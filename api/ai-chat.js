/**
 * AI Chat API Endpoint
 *
 * Conversational interface for querying feedback data using Claude Haiku.
 * Users can ask natural language questions about their feedback.
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, venueId, venueName, history = [] } = req.body;

    // Validate required fields
    if (!message || !venueId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Anthropic API key
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Determine date range based on the user's question
    const dateRange = parseDateRange(message);

    // Fetch relevant feedback data
    const feedbackData = await fetchFeedbackData(supabase, venueId, dateRange);
    const npsData = await fetchNPSData(supabase, venueId, dateRange);
    const employees = await fetchEmployees(supabase, venueId);
    const staffPerformance = calculateStaffPerformance(feedbackData, employees);
    const stats = calculateStats(feedbackData, npsData);

    // Build context for Claude
    const context = buildContext(feedbackData, npsData, stats, staffPerformance, venueName, dateRange);

    // Call Claude Haiku
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a helpful assistant for "${venueName || 'this venue'}", a hospitality business. You help staff understand their customer feedback data.

IMPORTANT RULES:
- Be concise and direct - staff are busy
- Use UK English spelling (organisation, analyse, colour, etc.)
- Reference specific data when available
- If asked about specific feedback, quote it directly
- Keep responses under 150 words unless showing multiple feedback items
- Format lists with bullet points for readability
- If the data doesn't contain what they're asking about, say so clearly
- You may have conversation history - use it to provide contextual responses
- You have access to staff performance data - use it to answer questions about employee performance`,
        messages: [
          // Include conversation history for context (if any)
          ...history.map(h => ({
            role: h.role,
            content: h.content
          })),
          // Current message with fresh data context
          {
            role: 'user',
            content: `${context}

---

USER QUESTION: ${message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[AI Chat] Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    const result = await response.json();
    const aiResponse = result.content[0].text;

    return res.status(200).json({
      response: aiResponse,
      stats: {
        feedbackCount: feedbackData.length,
        npsCount: npsData.length,
        dateRange
      }
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}

/**
 * Parse date range from user's message
 */
function parseDateRange(message) {
  const now = new Date();
  const lowerMessage = message.toLowerCase();

  // Default to last 7 days
  let fromDate = new Date(now);
  let toDate = new Date(now);

  if (lowerMessage.includes('today')) {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (lowerMessage.includes('yesterday')) {
    fromDate.setDate(now.getDate() - 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(fromDate);
    toDate.setHours(23, 59, 59, 999);
  } else if (lowerMessage.includes('last week') || lowerMessage.includes('past week')) {
    fromDate.setDate(now.getDate() - 7);
  } else if (lowerMessage.includes('last month') || lowerMessage.includes('past month')) {
    fromDate.setDate(now.getDate() - 30);
  } else if (lowerMessage.includes('last 3 months') || lowerMessage.includes('past 3 months')) {
    fromDate.setDate(now.getDate() - 90);
  } else if (lowerMessage.includes('beginning of last week') || lowerMessage.includes('start of last week')) {
    // Get Monday of last week
    const dayOfWeek = now.getDay();
    const daysToLastMonday = dayOfWeek === 0 ? 13 : dayOfWeek + 6;
    fromDate.setDate(now.getDate() - daysToLastMonday);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 1);
    toDate.setHours(23, 59, 59, 999);
  } else if (lowerMessage.includes('this week')) {
    // Get Monday of current week
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    fromDate.setDate(now.getDate() - daysToMonday);
    fromDate.setHours(0, 0, 0, 0);
  } else {
    // Default: last 7 days
    fromDate.setDate(now.getDate() - 7);
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    description: getDateRangeDescription(fromDate, toDate)
  };
}

function getDateRangeDescription(from, to) {
  const fromStr = from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const toStr = to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fromStr} - ${toStr}`;
}

/**
 * Fetch feedback data for the venue
 */
async function fetchFeedbackData(supabase, venueId, dateRange) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*, questions(question)')
    .eq('venue_id', venueId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[AI Chat] Error fetching feedback:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch employees for the venue
 */
async function fetchEmployees(supabase, venueId) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name')
    .eq('venue_id', venueId)
    .eq('is_active', true);

  if (error) {
    console.error('[AI Chat] Error fetching employees:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch NPS data for the venue
 */
async function fetchNPSData(supabase, venueId, dateRange) {
  const { data, error } = await supabase
    .from('nps_submissions')
    .select('*')
    .eq('venue_id', venueId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[AI Chat] Error fetching NPS:', error);
    return [];
  }

  return data || [];
}

/**
 * Calculate staff performance metrics
 */
function calculateStaffPerformance(feedbackData, employees) {
  if (!employees || employees.length === 0) {
    return null;
  }

  // Create a map of employee IDs to names
  const employeeMap = {};
  employees.forEach(e => {
    employeeMap[e.id] = e.name;
  });

  // Calculate resolved feedback per employee
  const resolvedByEmployee = {};
  const resolutionTimes = {};

  feedbackData.forEach(f => {
    if (f.resolved_by && f.is_actioned) {
      const employeeId = f.resolved_by;
      if (!resolvedByEmployee[employeeId]) {
        resolvedByEmployee[employeeId] = {
          count: 0,
          positiveCleared: 0,
          issuesResolved: 0,
          totalResolutionTime: 0,
          resolutionCount: 0
        };
      }
      resolvedByEmployee[employeeId].count++;

      // Track resolution type
      if (f.resolution_type === 'positive_feedback_cleared') {
        resolvedByEmployee[employeeId].positiveCleared++;
      } else {
        resolvedByEmployee[employeeId].issuesResolved++;
      }

      // Calculate resolution time if we have both timestamps
      if (f.created_at && f.resolved_at) {
        const created = new Date(f.created_at);
        const resolved = new Date(f.resolved_at);
        const timeDiff = (resolved - created) / (1000 * 60); // minutes
        if (timeDiff > 0 && timeDiff < 1440) { // Only count if < 24 hours
          resolvedByEmployee[employeeId].totalResolutionTime += timeDiff;
          resolvedByEmployee[employeeId].resolutionCount++;
        }
      }
    }
  });

  // Build performance array with employee names
  const performance = Object.entries(resolvedByEmployee)
    .map(([employeeId, data]) => ({
      name: employeeMap[employeeId] || 'Unknown',
      resolved: data.count,
      positiveCleared: data.positiveCleared,
      issuesResolved: data.issuesResolved,
      avgResolutionTime: data.resolutionCount > 0
        ? Math.round(data.totalResolutionTime / data.resolutionCount)
        : null
    }))
    .sort((a, b) => b.resolved - a.resolved);

  return performance;
}

/**
 * Calculate statistics from the data
 */
function calculateStats(feedbackData, npsData) {
  // Rating distribution
  const ratings = feedbackData.map(f => f.rating).filter(r => r != null);
  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => {
    if (r >= 1 && r <= 5) ratingCounts[r]++;
  });

  // NPS calculation
  const npsScores = npsData.map(n => n.score).filter(s => s != null);
  let npsScore = null;
  if (npsScores.length > 0) {
    const promoters = npsScores.filter(s => s >= 9).length;
    const detractors = npsScores.filter(s => s <= 6).length;
    npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
  }

  // Feedback with comments
  const feedbackWithComments = feedbackData.filter(f => f.additional_feedback?.trim());

  // Low ratings (1-2 stars)
  const lowRatingFeedback = feedbackData.filter(f => f.rating && f.rating <= 2);

  return {
    totalFeedback: feedbackData.length,
    totalNPS: npsData.length,
    avgRating,
    ratingCounts,
    npsScore,
    feedbackWithComments: feedbackWithComments.length,
    lowRatingCount: lowRatingFeedback.length
  };
}

/**
 * Build context string for Claude
 */
function buildContext(feedbackData, npsData, stats, staffPerformance, venueName, dateRange) {
  let context = `## Data Context for ${venueName || 'this venue'}
Period: ${dateRange.description}

### Summary Statistics:
- Total feedback submissions: ${stats.totalFeedback}
- Average rating: ${stats.avgRating || 'N/A'}/5
- Rating breakdown: 5★: ${stats.ratingCounts[5]}, 4★: ${stats.ratingCounts[4]}, 3★: ${stats.ratingCounts[3]}, 2★: ${stats.ratingCounts[2]}, 1★: ${stats.ratingCounts[1]}
- Feedback with comments: ${stats.feedbackWithComments}
- Low ratings (1-2★): ${stats.lowRatingCount}
- NPS submissions: ${stats.totalNPS}${stats.npsScore !== null ? `, NPS Score: ${stats.npsScore}` : ''}
`;

  // Add recent feedback with comments (prioritise low ratings)
  const feedbackWithComments = feedbackData
    .filter(f => f.additional_feedback?.trim())
    .sort((a, b) => (a.rating || 5) - (b.rating || 5)); // Low ratings first

  if (feedbackWithComments.length > 0) {
    context += `\n### Recent Feedback with Comments (${feedbackWithComments.length} total, showing up to 20):\n`;
    feedbackWithComments.slice(0, 20).forEach((f, i) => {
      const date = new Date(f.created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      const question = f.questions?.question || 'General';
      context += `${i + 1}. [${f.rating}★] ${date} - "${f.additional_feedback}" (${question}, Table ${f.table_number || 'N/A'})\n`;
    });
  }

  // Add NPS comments if any
  const npsWithComments = npsData.filter(n => n.comment?.trim());
  if (npsWithComments.length > 0) {
    context += `\n### NPS Comments (${npsWithComments.length} total, showing up to 10):\n`;
    npsWithComments.slice(0, 10).forEach((n, i) => {
      const date = new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      context += `${i + 1}. [Score: ${n.score}] ${date} - "${n.comment}"\n`;
    });
  }

  // Add staff performance data
  if (staffPerformance && staffPerformance.length > 0) {
    context += `\n### Staff Performance (${staffPerformance.length} staff members with activity):\n`;
    staffPerformance.forEach((staff, i) => {
      const avgTime = staff.avgResolutionTime
        ? `${staff.avgResolutionTime} min avg response`
        : 'no timing data';
      context += `${i + 1}. ${staff.name}: ${staff.resolved} feedback resolved (${staff.issuesResolved} issues fixed, ${staff.positiveCleared} positive cleared) - ${avgTime}\n`;
    });

    // Add top performer summary
    const topPerformer = staffPerformance[0];
    const fastestResponder = staffPerformance
      .filter(s => s.avgResolutionTime !== null)
      .sort((a, b) => a.avgResolutionTime - b.avgResolutionTime)[0];

    context += `\n**Top Performer:** ${topPerformer.name} (${topPerformer.resolved} resolved)\n`;
    if (fastestResponder) {
      context += `**Fastest Responder:** ${fastestResponder.name} (${fastestResponder.avgResolutionTime} min avg)\n`;
    }
  }

  return context;
}
