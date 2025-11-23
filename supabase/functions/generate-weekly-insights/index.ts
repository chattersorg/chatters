import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Helper to get Monday of the current week
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// Helper to get Sunday of a given week
function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

interface Venue {
  id: string;
  name: string;
  account_id: string;
}

interface FeedbackItem {
  id: string;
  rating: number;
  additional_feedback: string | null;
  created_at: string;
  questions: { question: string } | null;
}

interface NPSItem {
  score: number;
  created_at: string;
}

serve(async (req) => {
  try {
    // Verify this is a cron request or authorized request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Calculate current week (Monday to Sunday)
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(weekStart);
    const startDate = new Date(weekStart);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(weekEnd);
    endDate.setHours(23, 59, 59, 999);

    console.log(`[Weekly Insights] Generating for week: ${weekStart} to ${weekEnd}`);

    // Get all active venues
    const { data: venues, error: venuesError } = await supabase
      .from("venues")
      .select("id, name, account_id");

    if (venuesError) {
      console.error("Error fetching venues:", venuesError);
      throw venuesError;
    }

    if (!venues || venues.length === 0) {
      return new Response(
        JSON.stringify({ message: "No venues found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[Weekly Insights] Processing ${venues.length} venues...`);

    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each venue
    for (const venue of venues as Venue[]) {
      try {
        // Check if insight already exists for this week
        const { data: existingInsight } = await supabase
          .from("ai_insights")
          .select("id")
          .eq("venue_id", venue.id)
          .eq("week_start", weekStart)
          .single();

        if (existingInsight) {
          console.log(`[Weekly Insights] Skipping ${venue.name} - already generated`);
          results.skipped++;
          continue;
        }

        // Fetch feedback for this venue
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("feedback")
          .select(`
            id,
            rating,
            additional_feedback,
            created_at,
            questions (question)
          `)
          .eq("venue_id", venue.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false });

        if (feedbackError) throw feedbackError;

        // Fetch NPS submissions
        const { data: npsData, error: npsError } = await supabase
          .from("nps_submissions")
          .select("score, created_at")
          .eq("venue_id", venue.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false });

        if (npsError) throw npsError;

        const totalFeedback = (feedbackData || []).length;
        const totalNPS = (npsData || []).length;

        // Skip if no data
        if (totalFeedback === 0 && totalNPS === 0) {
          console.log(`[Weekly Insights] Skipping ${venue.name} - no feedback data`);
          results.skipped++;
          continue;
        }

        console.log(`[Weekly Insights] Generating for ${venue.name} (${totalFeedback} feedback, ${totalNPS} NPS)`);

        // Fetch previous insights for historical context
        const { data: previousInsights } = await supabase
          .from("ai_insights")
          .select("date_from, date_to, ai_score, actionable_recommendation, critical_insights")
          .eq("venue_id", venue.id)
          .order("created_at", { ascending: false })
          .limit(3);

        // Generate the AI prompt
        const prompt = prepareFeedbackSummary(
          feedbackData as FeedbackItem[],
          npsData as NPSItem[],
          venue.name,
          weekStart,
          weekEnd,
          previousInsights
        );

        // Call Anthropic API
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Anthropic API error: ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        const rawInsight = result.content[0].text;

        // Parse JSON response
        let parsedInsight;
        try {
          let jsonText = rawInsight.trim();
          if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
          } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
          }
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
          parsedInsight = JSON.parse(jsonText);
        } catch (parseError) {
          throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }

        // Calculate NPS score
        const npsScores = (npsData || []).map((item: NPSItem) => item.score).filter((s) => s !== null);
        let npsScore = null;
        if (npsScores.length > 0) {
          const promoters = npsScores.filter((s) => s >= 9).length;
          const detractors = npsScores.filter((s) => s <= 6).length;
          npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
        }

        // Save to database
        const { error: saveError } = await supabase.from("ai_insights").insert([
          {
            venue_id: venue.id,
            date_from: weekStart,
            date_to: weekEnd,
            week_start: weekStart,
            ai_score: parsedInsight.ai_score,
            critical_insights: parsedInsight.critical_insights,
            strengths: parsedInsight.strengths,
            areas_for_improvement: parsedInsight.areas_for_improvement,
            actionable_recommendation: parsedInsight.actionable_recommendation,
            improvement_tips: parsedInsight.improvement_tips,
            feedback_count: totalFeedback,
            nps_count: totalNPS,
            nps_score: npsScore,
          },
        ]);

        if (saveError) throw saveError;

        console.log(`[Weekly Insights] ✓ Generated for ${venue.name}`);
        results.processed++;
      } catch (error) {
        results.failed++;
        const errorMessage = `Failed for ${venue.name}: ${error.message}`;
        results.errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    console.log(
      `[Weekly Insights] Complete: ${results.processed} generated, ${results.skipped} skipped, ${results.failed} failed`
    );

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Weekly Insights] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// Prepare feedback summary for AI analysis
function prepareFeedbackSummary(
  feedbackData: FeedbackItem[],
  npsData: NPSItem[],
  venueName: string,
  dateFrom: string,
  dateTo: string,
  previousInsights: any[] = []
): string {
  // Count feedback by rating
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackData.forEach((item) => {
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
  const avgRating = totalRatingCount > 0 ? (totalRating / totalRatingCount).toFixed(1) : "0";

  // Calculate NPS score
  const npsScores = npsData.map((item) => item.score).filter((score) => score !== null);
  let npsScore: number | null = null;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  if (npsScores.length > 0) {
    promoters = npsScores.filter((s) => s >= 9).length;
    passives = npsScores.filter((s) => s >= 7 && s <= 8).length;
    detractors = npsScores.filter((s) => s <= 6).length;
    npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
  }

  // Collect all text feedback
  const allComments: { question: string; rating: number; text: string }[] = [];
  feedbackData.forEach((item) => {
    if (item.additional_feedback) {
      allComments.push({
        question: item.questions?.question || "General feedback",
        rating: item.rating,
        text: item.additional_feedback,
      });
    }
  });
  allComments.sort((a, b) => a.rating - b.rating);

  // Build historical context
  let historicalContext = "";
  if (previousInsights && previousInsights.length > 0) {
    historicalContext = `\n## Historical Context (Previous Analyses):
${previousInsights
  .map((insight, idx) => {
    const insights = insight.critical_insights || [];
    const insightTitles = insights.map((i: any) => i.title).join(", ");
    return `${idx + 1}. Period: ${insight.date_from} to ${insight.date_to}
   - AI Score: ${insight.ai_score}/10
   - Key Issues: ${insightTitles || "N/A"}
   - Recommendation: ${insight.actionable_recommendation?.substring(0, 150) || "N/A"}...`;
  })
  .join("\n\n")}

**Important:** Consider whether issues from previous analyses have improved, worsened, or remained the same.
`;
  }

  return `You are an expert hospitality consultant analysing customer feedback for "${venueName}" from ${dateFrom} to ${dateTo}.

## Overall Performance Summary:
- **Total feedback submissions:** ${feedbackData.length}
- **Average rating:** ${avgRating}/5
- **Rating distribution:**
  • 5★: ${ratingCounts[5]} (${totalRatingCount > 0 ? Math.round((ratingCounts[5] / totalRatingCount) * 100) : 0}%)
  • 4★: ${ratingCounts[4]} (${totalRatingCount > 0 ? Math.round((ratingCounts[4] / totalRatingCount) * 100) : 0}%)
  • 3★: ${ratingCounts[3]} (${totalRatingCount > 0 ? Math.round((ratingCounts[3] / totalRatingCount) * 100) : 0}%)
  • 2★: ${ratingCounts[2]} (${totalRatingCount > 0 ? Math.round((ratingCounts[2] / totalRatingCount) * 100) : 0}%)
  • 1★: ${ratingCounts[1]} (${totalRatingCount > 0 ? Math.round((ratingCounts[1] / totalRatingCount) * 100) : 0}%)
- **NPS responses:** ${npsData.length}${
    npsScore !== null
      ? `
  • Promoters (9-10): ${promoters} (${Math.round((promoters / npsScores.length) * 100)}%)
  • Passives (7-8): ${passives} (${Math.round((passives / npsScores.length) * 100)}%)
  • Detractors (0-6): ${detractors} (${Math.round((detractors / npsScores.length) * 100)}%)
  • **NPS Score: ${npsScore}**`
      : ""
  }

## Customer Feedback:
${allComments
  .slice(0, 60)
  .map((comment, idx) => `${idx + 1}. [${comment.rating}★] ${comment.question}\n   "${comment.text}"`)
  .join("\n\n")}
${historicalContext}

---

## YOUR TASK:

Analyse this feedback and provide a report in **UK English**.

**CRITICAL:** Your response MUST be valid JSON in this exact format:

\`\`\`json
{
  "ai_score": <number 0-10>,
  "critical_insights": [
    { "title": "Brief Title", "content": "One sentence description." }
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "areas_for_improvement": ["Area 1", "Area 2"],
  "actionable_recommendation": "One clear sentence with specific action.",
  "improvement_tips": ["Tip 1", "Tip 2", "Tip 3"]
}
\`\`\`

**Scoring Guidelines (0-10):**
- 9-10: Exceptional, NPS >70, avg rating >4.5
- 7-8: Strong, NPS 50-70, avg rating 4.0-4.5
- 5-6: Good but needs improvement, NPS 20-50, avg rating 3.5-4.0
- 3-4: Significant issues, NPS 0-20, avg rating 3.0-3.5
- 0-2: Critical issues, NPS <0, avg rating <3.0

**IMPORTANT:** Return ONLY the JSON object. No additional text.`;
}
