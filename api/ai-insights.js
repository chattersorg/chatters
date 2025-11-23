/**
 * AI Insights API Endpoint
 *
 * This serverless function securely handles AI analysis of customer feedback
 * using the Anthropic Claude API. It keeps the API key secure on the server side.
 *
 * Supports weekly insight generation with week_start parameter for automatic
 * Sunday night generation.
 */

import { createClient } from '@supabase/supabase-js';

// Helper to get Monday of a given week
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// Helper to get Sunday of a given week (end of week)
function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feedbackData, npsData, venueName, venueId, dateFrom, dateTo, weekStart } = req.body;

    // Calculate week_start from dateFrom if not provided
    const calculatedWeekStart = weekStart || getWeekStart(dateFrom);

    console.log('[AI Insights] Request received:', {
      feedbackCount: feedbackData?.length || 0,
      npsCount: npsData?.length || 0,
      venueName,
      venueId,
      dateRange: `${dateFrom} to ${dateTo}`,
      weekStart: calculatedWeekStart
    });

    // Validate required fields
    if (!feedbackData || !npsData || !venueName || !venueId || !dateFrom || !dateTo) {
      console.error('[AI Insights] Missing required fields:', {
        feedbackData: !!feedbackData,
        npsData: !!npsData,
        venueName: !!venueName,
        venueId: !!venueId,
        dateFrom: !!dateFrom,
        dateTo: !!dateTo
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if we already have an insight for this week
    const { data: existingInsight } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('venue_id', venueId)
      .eq('week_start', calculatedWeekStart)
      .single();

    if (existingInsight) {
      console.log('[AI Insights] Returning cached insight for week:', calculatedWeekStart);
      return res.status(200).json({
        ...existingInsight,
        cached: true
      });
    }

    // Fetch previous insights for historical context (last 3 insights)
    const { data: previousInsights } = await supabase
      .from('ai_insights')
      .select('date_from, date_to, ai_score, actionable_recommendation, critical_insights')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Get Anthropic API key from environment
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      console.error('[AI Insights] ANTHROPIC_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
    }

    // Prepare feedback summary for AI
    const feedbackSummary = prepareFeedbackSummary(
      feedbackData,
      npsData,
      venueName,
      dateFrom,
      dateTo,
      previousInsights
    );

    console.log('[AI Insights] Prompt length:', feedbackSummary.length, 'characters');

    // Call Anthropic Claude API
    console.log('[AI Insights] Calling Anthropic API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: feedbackSummary,
          },
        ],
      }),
    });

    console.log('[AI Insights] Anthropic API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[AI Insights] Anthropic API error:', errorData);
      return res.status(500).json({
        error: 'Failed to generate insights. Please try again.',
        details: errorData
      });
    }

    const result = await response.json();
    const rawInsight = result.content[0].text;

    console.log('[AI Insights] Successfully generated insight, length:', rawInsight.length, 'characters');
    console.log('[AI Insights] Raw AI response:', rawInsight);

    // Parse the JSON response from Claude
    // Claude sometimes wraps JSON in markdown code blocks, so we need to extract it
    let parsedInsight;
    try {
      let jsonText = rawInsight.trim();

      // Remove markdown code block if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
      }

      // Try to find JSON object if there's additional text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      parsedInsight = JSON.parse(jsonText);

      // Validate the structure
      if (!parsedInsight.ai_score || !parsedInsight.critical_insights || !parsedInsight.strengths ||
          !parsedInsight.areas_for_improvement || !parsedInsight.actionable_recommendation || !parsedInsight.improvement_tips) {
        throw new Error('Missing required fields in AI response');
      }

    } catch (parseError) {
      console.error('[AI Insights] Failed to parse AI response as JSON:', parseError);
      console.error('[AI Insights] Raw response that failed to parse:', rawInsight);
      return res.status(500).json({
        error: 'Failed to parse AI insights. Please try again.',
        details: parseError.message,
        rawResponse: rawInsight.substring(0, 500) // Include first 500 chars for debugging
      });
    }

    // Calculate NPS score for metadata
    const npsScores = npsData.map(item => item.score).filter(score => score !== null);
    let npsScore = null;
    if (npsScores.length > 0) {
      const promoters = npsScores.filter(s => s >= 9).length;
      const detractors = npsScores.filter(s => s <= 6).length;
      npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
    }

    // Store the insight in Supabase
    const insightRecord = {
      venue_id: venueId,
      date_from: dateFrom,
      date_to: dateTo,
      week_start: calculatedWeekStart,
      ai_score: parsedInsight.ai_score,
      critical_insights: parsedInsight.critical_insights,
      strengths: parsedInsight.strengths,
      areas_for_improvement: parsedInsight.areas_for_improvement,
      actionable_recommendation: parsedInsight.actionable_recommendation,
      improvement_tips: parsedInsight.improvement_tips,
      feedback_count: feedbackData.length,
      nps_count: npsData.length,
      nps_score: npsScore
    };

    const { data: savedInsight, error: saveError } = await supabase
      .from('ai_insights')
      .insert([insightRecord])
      .select()
      .single();

    if (saveError) {
      console.error('[AI Insights] Failed to save insight to database:', saveError);
      // Still return the insight even if save fails
      return res.status(200).json({
        ...insightRecord,
        id: null,
        created_at: new Date().toISOString(),
        saved: false
      });
    }

    console.log('[AI Insights] Successfully saved insight to database');
    return res.status(200).json({
      ...savedInsight,
      saved: true,
      cached: false
    });

  } catch (error) {
    console.error('[AI Insights] Error in AI insights endpoint:', error);
    return res.status(500).json({
      error: 'An error occurred while generating insights. Please try again.',
      details: error.message
    });
  }
}

/**
 * Prepare feedback data summary for AI analysis
 */
function prepareFeedbackSummary(feedbackData, npsData, venueName, dateFrom, dateTo, previousInsights = []) {
  // Count feedback by rating
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackData.forEach(item => {
    if (item.rating >= 1 && item.rating <= 5) {
      ratingCounts[item.rating]++;
    }
  });

  // Calculate average rating
  let totalRating = 0;
  let totalRatingCount = 0;
  Object.entries(ratingCounts).forEach(([rating, count]) => {
    totalRating += parseInt(rating) * count;
    totalRatingCount += count;
  });
  const avgRating = totalRatingCount > 0 ? (totalRating / totalRatingCount).toFixed(1) : 0;

  // Calculate NPS score
  const npsScores = npsData.map(item => item.score).filter(score => score !== null);
  let npsScore = null;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  if (npsScores.length > 0) {
    promoters = npsScores.filter(s => s >= 9).length;
    passives = npsScores.filter(s => s >= 7 && s <= 8).length;
    detractors = npsScores.filter(s => s <= 6).length;
    npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
  }

  // Group feedback by question to identify patterns
  const feedbackByQuestion = {};
  feedbackData.forEach(item => {
    const question = item.questions?.question || 'General feedback';
    if (!feedbackByQuestion[question]) {
      feedbackByQuestion[question] = {
        question,
        ratings: [],
        comments: []
      };
    }
    feedbackByQuestion[question].ratings.push(item.rating);
    if (item.additional_feedback) {
      feedbackByQuestion[question].comments.push({
        rating: item.rating,
        text: item.additional_feedback
      });
    }
  });

  // Calculate average rating per question
  const questionAnalysis = Object.values(feedbackByQuestion).map(q => {
    const avgQuestionRating = q.ratings.reduce((a, b) => a + b, 0) / q.ratings.length;
    return {
      question: q.question,
      avgRating: avgQuestionRating.toFixed(1),
      responseCount: q.ratings.length,
      comments: q.comments
    };
  }).sort((a, b) => parseFloat(a.avgRating) - parseFloat(b.avgRating)); // Lowest rated first

  // Collect all text feedback, prioritising low ratings
  const allComments = [];
  feedbackData.forEach(item => {
    if (item.additional_feedback) {
      allComments.push({
        question: item.questions?.question || 'General feedback',
        rating: item.rating,
        text: item.additional_feedback
      });
    }
  });

  // Sort comments: low ratings first (most critical)
  allComments.sort((a, b) => a.rating - b.rating);

  // Build historical context section
  let historicalContext = '';
  if (previousInsights && previousInsights.length > 0) {
    historicalContext = `\n## Historical Context (Previous Analyses):
${previousInsights.map((insight, idx) => {
  const insights = insight.critical_insights || [];
  const insightTitles = insights.map(i => i.title).join(', ');
  return `${idx + 1}. Period: ${insight.date_from} to ${insight.date_to}
   - AI Score: ${insight.ai_score}/10
   - Key Issues: ${insightTitles || 'N/A'}
   - Recommendation: ${insight.actionable_recommendation?.substring(0, 150) || 'N/A'}...`;
}).join('\n\n')}

**Important:** Consider whether issues from previous analyses have improved, worsened, or remained the same. Acknowledge progress where visible and flag persistent problems.
`;
  }

  // Build the comprehensive prompt for Claude
  const prompt = `You are an expert hospitality consultant analysing customer feedback for "${venueName}" from ${dateFrom} to ${dateTo}.

## Overall Performance Summary:
- **Total feedback submissions:** ${feedbackData.length}
- **Average rating:** ${avgRating}/5 ⭐
- **Rating distribution:**
  • 5★: ${ratingCounts[5]} (${Math.round((ratingCounts[5] / totalRatingCount) * 100)}%)
  • 4★: ${ratingCounts[4]} (${Math.round((ratingCounts[4] / totalRatingCount) * 100)}%)
  • 3★: ${ratingCounts[3]} (${Math.round((ratingCounts[3] / totalRatingCount) * 100)}%)
  • 2★: ${ratingCounts[2]} (${Math.round((ratingCounts[2] / totalRatingCount) * 100)}%)
  • 1★: ${ratingCounts[1]} (${Math.round((ratingCounts[1] / totalRatingCount) * 100)}%)
- **NPS responses:** ${npsData.length}${npsScore !== null ? `
  • Promoters (9-10): ${promoters} (${Math.round((promoters / npsScores.length) * 100)}%)
  • Passives (7-8): ${passives} (${Math.round((passives / npsScores.length) * 100)}%)
  • Detractors (0-6): ${detractors} (${Math.round((detractors / npsScores.length) * 100)}%)
  • **NPS Score: ${npsScore}**` : ''}

## Performance by Category:
${questionAnalysis.map((q, idx) =>
  `${idx + 1}. **${q.question}**
   - Average rating: ${q.avgRating}/5 (${q.responseCount} responses)
   - Status: ${parseFloat(q.avgRating) >= 4.0 ? '✅ Strong' : parseFloat(q.avgRating) >= 3.0 ? '⚠️ Needs attention' : '🚨 Critical'}`
).join('\n\n')}

## Detailed Customer Feedback (Priority: Critical Issues First):
${allComments.slice(0, 60).map((comment, idx) =>
  `${idx + 1}. [${comment.rating}★] ${comment.question}
   "${comment.text}"`
).join('\n\n')}
${historicalContext}

---

## YOUR TASK:

Analyse this feedback data and provide a comprehensive, actionable report in **UK English** (British spelling: organisation, analyse, realise, colour, etc.).

**CRITICAL:** Your response MUST be valid JSON in this exact format:

\`\`\`json
{
  "ai_score": <number 0-10>,
  "critical_insights": [
    {
      "title": "Cleanliness Issues",
      "content": "Hygiene rated 2.9/5, 41% below average, needs immediate attention."
    },
    {
      "title": "Menu Quality Low",
      "content": "Menu scored 3.0/5 with 20% negative feedback, requires urgent review."
    }
  ],
  "strengths": [
    "Music creates appropriate atmosphere with 3.3/5 rating from customers.",
    "Service staff show genuine engagement despite operational constraints."
  ],
  "areas_for_improvement": [
    "Implement daily hygiene checklists and deep-cleaning protocols immediately.",
    "Conduct menu audit and redesign based on customer feedback surveys."
  ],
  "actionable_recommendation": "Prioritise immediate deep-cleaning and hygiene training to address critical 2.9/5 cleanliness rating.",
  "improvement_tips": [
    "Create documented daily cleaning checklists for all staff to follow.",
    "Conduct weekly menu reviews and remove underperforming dishes.",
    "Implement mystery shopper program to identify service inconsistencies."
  ]
}
\`\`\`

**Scoring Guidelines for ai_score (0-10):**
- **9-10:** Exceptional performance, minimal issues, NPS >70, avg rating >4.5
- **7-8:** Strong performance, minor issues, NPS 50-70, avg rating 4.0-4.5
- **5-6:** Good but room for improvement, NPS 20-50, avg rating 3.5-4.0
- **3-4:** Significant issues present, NPS 0-20, avg rating 3.0-3.5
- **0-2:** Critical issues, urgent action needed, NPS <0, avg rating <3.0

**Analysis Requirements:**
1. **critical_insights:** Identify 2-3 key insights. Each insight should have:
   - title: 4-6 words max
   - content: ONE sentence (under 20 words)
2. **strengths:** List 2-3 strengths. Each should be ONE sentence (under 20 words).
3. **areas_for_improvement:** List 2-3 areas. Each should be ONE sentence (under 20 words).
4. **actionable_recommendation:** ONE clear sentence with a specific action (under 35 words).
5. **improvement_tips:** Provide 3-4 specific, actionable tips to improve the AI score. Each tip should be ONE sentence (under 20 words).

**Quality Standards:**
- BE CONCISE - use bullet-point style, not paragraphs
- Use specific numbers from the data
- Reference actual customer feedback when critical
- Be direct and constructive
- Use UK English spelling throughout (organisation, analyse, colour, etc.)
- Keep everything brief and scannable

**IMPORTANT:** Return ONLY the JSON object. No additional text before or after.`;

  return prompt;
}
