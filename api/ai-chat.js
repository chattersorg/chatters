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

    // Analyze what data the question needs
    const dataNeeds = analyzeQuestionIntent(message);
    console.log('[AI Chat] Data needs:', dataNeeds);

    // Only fetch what we need based on the question
    let feedbackData = [];
    let npsData = [];
    let employees = [];
    let questions = [];
    let zoneData = { zones: [], tableToZone: {} };
    let staffRecognitions = [];
    let assistanceRequests = [];

    // Always fetch questions (lightweight, needed for context)
    questions = await fetchQuestions(supabase, venueId);

    // Fetch data based on needs
    if (dataNeeds.feedback || dataNeeds.trends || dataNeeds.zones) {
      feedbackData = await fetchFeedbackData(supabase, venueId, dateRange);
    }

    if (dataNeeds.nps) {
      npsData = await fetchNPSData(supabase, venueId, dateRange);
    }

    if (dataNeeds.staff || dataNeeds.feedback) {
      // Need employees for staff roster and for resolving feedback attribution
      employees = await fetchEmployees(supabase, venueId);
    }

    if (dataNeeds.zones) {
      zoneData = await fetchZoneData(supabase, venueId);
    }

    if (dataNeeds.staff) {
      staffRecognitions = await fetchStaffRecognitions(supabase, venueId, dateRange);
      assistanceRequests = await fetchAssistanceRequests(supabase, venueId, dateRange);
    }

    // Calculate derived data only if we have the source data
    const staffPerformance = (dataNeeds.staff && employees.length > 0)
      ? calculateStaffPerformance(feedbackData, employees, assistanceRequests)
      : null;
    const zonePerformance = (dataNeeds.zones && feedbackData.length > 0)
      ? calculateZonePerformance(feedbackData, zoneData)
      : null;
    const stats = (dataNeeds.feedback || dataNeeds.nps)
      ? calculateStats(feedbackData, npsData)
      : { totalFeedback: 0, totalNPS: 0, avgRating: null, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, npsScore: null, feedbackWithComments: 0, lowRatingCount: 0 };
    const trends = dataNeeds.trends ? calculateTrends(feedbackData, dateRange) : null;

    // Debug logging
    console.log('[AI Chat] Date range:', dateRange);
    console.log('[AI Chat] Data fetched:', {
      feedbackCount: feedbackData.length,
      npsCount: npsData.length,
      employeesCount: employees.length,
      questionsCount: questions.length,
      recognitionsCount: staffRecognitions.length,
      assistanceCount: assistanceRequests.length,
      dataNeeds
    });

    // Build context for Claude
    const context = buildContext(feedbackData, npsData, stats, staffPerformance, zonePerformance, questions, venueName, dateRange, trends, employees, staffRecognitions);

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
        system: `You are a helpful assistant for "${venueName || 'this venue'}", a hospitality business.

CRITICAL - BREVITY IS MANDATORY:
- Give SHORT, DIRECT answers. 2-3 sentences max for simple questions.
- Lead with the answer, not the explanation.
- Only elaborate if specifically asked for details.
- NO verbose context or unnecessary background.
- Example good response: "Ethan Collins is your top performer with 91 resolved interactions and a 10-min average response time."
- Example bad response: Long paragraphs explaining methodology, comparisons to peers, multiple metrics unprompted.

OTHER RULES:
- Use UK English (organisation, analyse, colour)
- Reference specific data when available
- Use bullet points only when listing 3+ items

HANDLING MISSING DATA:
- You CAN access all data types: feedback, NPS, staff, zones, trends. Don't claim you can't.
- If no data exists for a time period, simply say "No [data type] recorded for [period]."
- Don't add filler about other data that IS available - just answer the question asked.
- For absurd dates (before 2020 or future), just say "No data for that period." - don't elaborate.

VISUALISATION CAPABILITY:
- When the user asks for a graph, chart, or visual, OR when comparing multiple items, you MUST include a visualisation
- Add the chart block on its own line in your response using this EXACT format (no spaces around the colon):
  <!--CHART:{"type":"line","title":"Title","data":[{"label":"A","value":4.5},{"label":"B","value":4.2}]}-->
- Chart types: "line" for trends/changes over time, "bar" for comparing categories/items, "table" for detailed breakdowns
- The data array should have 2-12 data points with label and value for each
- Always briefly explain the visualisation in your text too
- Only ONE visualisation per response
- Use "bar" charts for: comparing staff, comparing questions, rating distributions
- Use "line" charts for: weekly trends, daily trends, changes over time
- Use "table" for: detailed staff stats, question breakdowns with multiple metrics
- Example bar chart for question comparison: <!--CHART:{"type":"bar","title":"Ratings by Question","data":[{"label":"Food Quality","value":4.5},{"label":"Service","value":4.0},{"label":"Ambience","value":4.2}]}-->
- Example line chart for trends: <!--CHART:{"type":"line","title":"Weekly Ratings","data":[{"label":"Week 1","value":4.2},{"label":"Week 2","value":4.5}]}-->`,
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

    // Determine primary data source based on question
    const lowerMessage = message.toLowerCase();
    const isNpsQuery = lowerMessage.includes('nps') ||
                       lowerMessage.includes('net promoter') ||
                       lowerMessage.includes('recommend') ||
                       lowerMessage.includes('promoter') ||
                       lowerMessage.includes('detractor');
    const isFeedbackQuery = lowerMessage.includes('feedback') ||
                            lowerMessage.includes('rating') ||
                            lowerMessage.includes('review') ||
                            lowerMessage.includes('comment') ||
                            lowerMessage.includes('star') ||
                            lowerMessage.includes('service') ||
                            lowerMessage.includes('food') ||
                            lowerMessage.includes('staff') ||
                            lowerMessage.includes('employee');

    // Determine primary data source for display
    let dataSource = 'both';
    if (isNpsQuery && !isFeedbackQuery) {
      dataSource = 'nps';
    } else if (isFeedbackQuery && !isNpsQuery) {
      dataSource = 'feedback';
    } else if (!isNpsQuery && !isFeedbackQuery) {
      // Default to feedback if no specific type detected
      dataSource = feedbackData.length > 0 ? 'feedback' : 'nps';
    }

    return res.status(200).json({
      response: aiResponse,
      stats: {
        feedbackCount: feedbackData.length,
        npsCount: npsData.length,
        dateRange,
        dataSource,
        dataFetched: dataNeeds
      }
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}

/**
 * Parse a date string in various formats
 * Supports: "1st January", "January 1", "1/1/2024", "2024-01-01", "1 Jan", etc.
 */
function parseDate(dateStr, defaultYear) {
  const str = dateStr.trim().toLowerCase();

  // Month name mapping
  const months = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };

  // Try "1st January 2024" or "1 January" or "1st Jan"
  const dayMonthMatch = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1]);
    const monthName = dayMonthMatch[2];
    const year = dayMonthMatch[3] ? parseInt(dayMonthMatch[3]) : defaultYear;
    if (months[monthName] !== undefined) {
      return new Date(year, months[monthName], day);
    }
  }

  // Try "January 1st 2024" or "January 1"
  const monthDayMatch = str.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1];
    const day = parseInt(monthDayMatch[2]);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3]) : defaultYear;
    if (months[monthName] !== undefined) {
      return new Date(year, months[monthName], day);
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY (UK format)
  const ukDateMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ukDateMatch) {
    const day = parseInt(ukDateMatch[1]);
    const month = parseInt(ukDateMatch[2]) - 1;
    const year = parseInt(ukDateMatch[3]);
    return new Date(year, month, day);
  }

  // Try DD/MM or DD-MM (assume current year)
  const shortDateMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})(?![\/\-])/);
  if (shortDateMatch) {
    const day = parseInt(shortDateMatch[1]);
    const month = parseInt(shortDateMatch[2]) - 1;
    return new Date(defaultYear, month, day);
  }

  return null;
}

/**
 * Parse date range from user's message
 */
function parseDateRange(message) {
  const now = new Date();
  const lowerMessage = message.toLowerCase();
  const currentYear = now.getFullYear();

  // Default dates
  let fromDate = new Date(now);
  let toDate = new Date(now);

  // Try to parse explicit date ranges first
  // "from X to Y", "between X and Y", "X to Y", "X - Y"
  const rangePatterns = [
    /from\s+(.+?)\s+to\s+(.+?)(?:\s|$|,|\?)/i,
    /between\s+(.+?)\s+and\s+(.+?)(?:\s|$|,|\?)/i,
    /(\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+(?:\s+\d{4})?)\s+(?:to|-)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+(?:\s+\d{4})?)/i,
    /([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)\s+(?:to|-)\s+([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)/i,
    /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)\s+(?:to|-)\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)/i
  ];

  for (const pattern of rangePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const startDate = parseDate(match[1], currentYear);
      const endDate = parseDate(match[2], currentYear);
      if (startDate && endDate) {
        fromDate = startDate;
        fromDate.setHours(0, 0, 0, 0);
        toDate = endDate;
        toDate.setHours(23, 59, 59, 999);
        return {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          description: getDateRangeDescription(fromDate, toDate)
        };
      }
    }
  }

  // Try single date patterns: "on 5th November", "for November 5th"
  const singleDatePatterns = [
    /on\s+(\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+(?:\s+\d{4})?)/i,
    /on\s+([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)/i,
    /for\s+(\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+(?:\s+\d{4})?)/i
  ];

  for (const pattern of singleDatePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const date = parseDate(match[1], currentYear);
      if (date) {
        fromDate = new Date(date);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(date);
        toDate.setHours(23, 59, 59, 999);
        return {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          description: getDateRangeDescription(fromDate, toDate)
        };
      }
    }
  }

  // Named month with optional prefix: "November 2025", "in November", "for October"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthMatch = lowerMessage.match(/(?:in\s+|for\s+|during\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/i);
  if (monthMatch) {
    const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
    const year = monthMatch[2] ? parseInt(monthMatch[2]) : currentYear;
    fromDate = new Date(year, monthIndex, 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(year, monthIndex + 1, 0); // Last day of month
    toDate.setHours(23, 59, 59, 999);
    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      description: getDateRangeDescription(fromDate, toDate)
    };
  }

  // Standalone year: "2024", "2024?", "in 2024" (must come after month match)
  const yearMatch = lowerMessage.match(/\b(20[0-9]{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    fromDate = new Date(year, 0, 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(year, 11, 31);
    toDate.setHours(23, 59, 59, 999);
    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      description: `${year}`
    };
  }

  // "last X days/weeks/months"
  const lastNMatch = lowerMessage.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/);
  if (lastNMatch) {
    const n = parseInt(lastNMatch[1]);
    const unit = lastNMatch[2];
    if (unit.startsWith('day')) {
      fromDate.setDate(now.getDate() - n);
    } else if (unit.startsWith('week')) {
      fromDate.setDate(now.getDate() - (n * 7));
    } else if (unit.startsWith('month')) {
      fromDate.setMonth(now.getMonth() - n);
    }
    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      description: getDateRangeDescription(fromDate, toDate)
    };
  }

  // Standard keyword matching
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
    // Go to the previous calendar month
    fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    toDate.setHours(23, 59, 59, 999);
  } else if (lowerMessage.includes('last 3 months') || lowerMessage.includes('past 3 months')) {
    fromDate.setDate(now.getDate() - 90);
  } else if (lowerMessage.includes('this week')) {
    // Get Monday of current week
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    fromDate.setDate(now.getDate() - daysToMonday);
    fromDate.setHours(0, 0, 0, 0);
  } else if (lowerMessage.includes('this month')) {
    // Start of current month
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    fromDate.setHours(0, 0, 0, 0);
  } else if (lowerMessage.includes('this year')) {
    fromDate = new Date(now.getFullYear(), 0, 1);
    fromDate.setHours(0, 0, 0, 0);
  } else if (lowerMessage.includes('last year')) {
    fromDate = new Date(now.getFullYear() - 1, 0, 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(now.getFullYear() - 1, 11, 31);
    toDate.setHours(23, 59, 59, 999);
  } else if (lowerMessage.includes('all time') || lowerMessage.includes('ever') || lowerMessage.includes('overall')) {
    // All time - go back 5 years
    fromDate.setFullYear(now.getFullYear() - 5);
  } else {
    // Default: all time (5 years back) - let the AI work with all available data
    fromDate.setFullYear(now.getFullYear() - 5);
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
 * Analyze the user's question to determine what data sources are needed
 * Returns an object indicating which data types to fetch
 */
function analyzeQuestionIntent(message) {
  const lower = message.toLowerCase();

  // Default: nothing needed
  const needs = {
    feedback: false,
    nps: false,
    staff: false,
    zones: false,
    trends: false,
    questionsOnly: false
  };

  // Questions-only patterns (don't need feedback data)
  const questionsOnlyPatterns = [
    /what (are|questions|do you ask)/i,
    /which questions/i,
    /show.*questions/i,
    /list.*questions/i,
    /what feedback questions/i,
    /what do (we|you) ask/i
  ];

  if (questionsOnlyPatterns.some(p => p.test(message))) {
    needs.questionsOnly = true;
    return needs;
  }

  // Staff-related patterns
  const staffPatterns = [
    /staff/i, /employee/i, /team/i, /worker/i, /server/i, /waiter/i, /waitress/i,
    /who (resolved|handled|fixed)/i, /best performer/i, /top performer/i,
    /recognition/i, /shoutout/i, /praise/i, /who works/i, /how many staff/i,
    /fastest (response|responder)/i, /resolution time/i, /who is/i, /roster/i
  ];

  // NPS-related patterns
  const npsPatterns = [
    /nps/i, /net promoter/i, /recommend/i, /promoter/i, /detractor/i,
    /likely.*recommend/i, /loyalty/i
  ];

  // Zone/area patterns
  const zonePatterns = [
    /zone/i, /area/i, /section/i, /table \d+/i, /tables/i,
    /which (zone|area|section)/i, /best (zone|area|section)/i,
    /worst (zone|area|section)/i
  ];

  // Trend patterns
  const trendPatterns = [
    /trend/i, /over time/i, /change/i, /improv/i, /declin/i, /week by week/i,
    /weekly/i, /daily/i, /compare/i, /vs/i, /versus/i, /getting better/i,
    /getting worse/i, /progress/i
  ];

  // Feedback-related patterns (general)
  const feedbackPatterns = [
    /feedback/i, /rating/i, /review/i, /comment/i, /star/i, /score/i,
    /complain/i, /issue/i, /problem/i, /negative/i, /positive/i, /happy/i,
    /unhappy/i, /satisfied/i, /dissatisfied/i, /average/i, /how (are|is) (we|it)/i,
    /what (are|do) (customers|people|guests)/i, /food/i, /service/i, /quality/i,
    /how.*doing/i, /performance/i, /summary/i, /overview/i
  ];

  // Check each category
  if (staffPatterns.some(p => p.test(message))) {
    needs.staff = true;
    needs.feedback = true; // Need feedback to see who resolved what
  }

  if (npsPatterns.some(p => p.test(message))) {
    needs.nps = true;
  }

  if (zonePatterns.some(p => p.test(message))) {
    needs.zones = true;
    needs.feedback = true; // Need feedback to calculate zone performance
  }

  if (trendPatterns.some(p => p.test(message))) {
    needs.trends = true;
    needs.feedback = true; // Need feedback for trend analysis
  }

  if (feedbackPatterns.some(p => p.test(message))) {
    needs.feedback = true;
  }

  // If nothing specific was detected, default to feedback (most common use case)
  if (!needs.feedback && !needs.nps && !needs.staff && !needs.zones && !needs.trends && !needs.questionsOnly) {
    needs.feedback = true;
  }

  return needs;
}

/**
 * Fetch feedback data for the venue
 */
async function fetchFeedbackData(supabase, venueId, dateRange) {
  // Supabase has a hard 1000-row limit per request. Paginate to get more.
  const allData = [];
  const pageSize = 1000;
  const maxPages = 3; // Up to 3000 items for AI context

  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, questions(question)')
      .eq('venue_id', venueId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('[AI Chat] Error fetching feedback page', page, ':', error);
      break;
    }

    if (!data || data.length === 0) break;
    allData.push(...data);

    if (data.length < pageSize) break;
  }

  console.log('[AI Chat] Feedback - fetched:', allData.length, 'items');
  return allData;
}

/**
 * Fetch employees for the venue
 */
async function fetchEmployees(supabase, venueId) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, role, location, is_active')
    .eq('venue_id', venueId);

  if (error) {
    console.error('[AI Chat] Error fetching employees:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch staff recognitions for the venue
 */
async function fetchStaffRecognitions(supabase, venueId, dateRange) {
  // First get employees for this venue to filter recognitions
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id')
    .eq('venue_id', venueId);

  if (empError || !employees || employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map(e => e.id);

  const { data, error } = await supabase
    .from('staff_recognitions')
    .select('*')
    .in('employee_id', employeeIds)
    .gte('sent_at', dateRange.from)
    .lte('sent_at', dateRange.to)
    .order('sent_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[AI Chat] Error fetching staff recognitions:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch assistance requests for the venue
 */
async function fetchAssistanceRequests(supabase, venueId, dateRange) {
  const { data, error } = await supabase
    .from('assistance_requests')
    .select('*')
    .eq('venue_id', venueId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[AI Chat] Error fetching assistance requests:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch active questions for the venue
 */
async function fetchQuestions(supabase, venueId) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question, order')
    .eq('venue_id', venueId)
    .eq('active', true)
    .order('order', { ascending: true });

  if (error) {
    console.error('[AI Chat] Error fetching questions:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch zone data and table assignments for the venue
 */
async function fetchZoneData(supabase, venueId) {
  // Fetch zones
  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select('id, name, order')
    .eq('venue_id', venueId)
    .order('order', { ascending: true });

  if (zonesError) {
    console.error('[AI Chat] Error fetching zones:', zonesError);
    return { zones: [], tableToZone: {} };
  }

  // Fetch table positions with zone assignments
  const { data: tables, error: tablesError } = await supabase
    .from('table_positions')
    .select('table_number, zone_id')
    .eq('venue_id', venueId);

  if (tablesError) {
    console.error('[AI Chat] Error fetching table positions:', tablesError);
    return { zones: zones || [], tableToZone: {} };
  }

  // Build a map from table_number to zone info
  const tableToZone = {};
  const zoneMap = {};
  (zones || []).forEach(z => {
    zoneMap[z.id] = z.name;
  });

  (tables || []).forEach(t => {
    if (t.zone_id && zoneMap[t.zone_id]) {
      tableToZone[t.table_number] = {
        zoneId: t.zone_id,
        zoneName: zoneMap[t.zone_id]
      };
    }
  });

  return { zones: zones || [], tableToZone };
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
    .limit(500);

  if (error) {
    console.error('[AI Chat] Error fetching NPS:', error);
    return [];
  }

  return data || [];
}

/**
 * Calculate zone performance metrics from feedback data
 */
function calculateZonePerformance(feedbackData, zoneData) {
  const { zones, tableToZone } = zoneData;

  if (!zones || zones.length === 0) {
    return null;
  }

  // Initialize zone stats
  const zoneStats = {};
  zones.forEach(z => {
    zoneStats[z.id] = {
      name: z.name,
      feedbackCount: 0,
      totalRating: 0,
      ratingCount: 0,
      lowRatings: 0,
      highRatings: 0,
      commentsCount: 0,
      recentComments: []
    };
  });

  // Add an "unassigned" bucket for tables without zones
  zoneStats['unassigned'] = {
    name: 'Unassigned Tables',
    feedbackCount: 0,
    totalRating: 0,
    ratingCount: 0,
    lowRatings: 0,
    highRatings: 0,
    commentsCount: 0,
    recentComments: []
  };

  // Process feedback and assign to zones
  feedbackData.forEach(f => {
    const tableNum = f.table_number;
    const zoneInfo = tableToZone[tableNum];
    const zoneId = zoneInfo ? zoneInfo.zoneId : 'unassigned';

    if (!zoneStats[zoneId]) return;

    zoneStats[zoneId].feedbackCount++;

    if (f.rating != null) {
      zoneStats[zoneId].totalRating += f.rating;
      zoneStats[zoneId].ratingCount++;
      if (f.rating <= 2) zoneStats[zoneId].lowRatings++;
      if (f.rating >= 4) zoneStats[zoneId].highRatings++;
    }

    if (f.additional_feedback?.trim()) {
      zoneStats[zoneId].commentsCount++;
      if (zoneStats[zoneId].recentComments.length < 3) {
        zoneStats[zoneId].recentComments.push({
          rating: f.rating,
          comment: f.additional_feedback,
          table: tableNum
        });
      }
    }
  });

  // Calculate averages and build result
  const performance = Object.entries(zoneStats)
    .filter(([id, stats]) => stats.feedbackCount > 0)
    .map(([id, stats]) => ({
      zoneId: id,
      name: stats.name,
      feedbackCount: stats.feedbackCount,
      avgRating: stats.ratingCount > 0
        ? (stats.totalRating / stats.ratingCount).toFixed(2)
        : null,
      lowRatings: stats.lowRatings,
      highRatings: stats.highRatings,
      commentsCount: stats.commentsCount,
      recentComments: stats.recentComments
    }))
    .sort((a, b) => b.feedbackCount - a.feedbackCount);

  // Also include zone-to-table mapping summary for context
  const zoneTableSummary = {};
  zones.forEach(z => {
    const tables = Object.entries(tableToZone)
      .filter(([_, info]) => info.zoneId === z.id)
      .map(([tableNum, _]) => parseInt(tableNum))
      .sort((a, b) => a - b);
    zoneTableSummary[z.name] = tables;
  });

  return { performance, zoneTableSummary };
}

/**
 * Calculate staff performance metrics
 */
function calculateStaffPerformance(feedbackData, employees, assistanceRequests = []) {
  if (!employees || employees.length === 0) {
    return null;
  }

  // Create a map of employee IDs to names (handle both name formats)
  const employeeMap = {};
  employees.forEach(e => {
    const name = e.first_name || e.last_name
      ? `${e.first_name || ''} ${e.last_name || ''}`.trim()
      : 'Unknown';
    employeeMap[e.id] = name;
  });

  // Calculate resolved feedback per employee
  const resolvedByEmployee = {};

  feedbackData.forEach(f => {
    if (f.resolved_by && f.is_actioned) {
      const employeeId = f.resolved_by;
      if (!resolvedByEmployee[employeeId]) {
        resolvedByEmployee[employeeId] = {
          count: 0,
          positiveCleared: 0,
          issuesResolved: 0,
          assistanceResolved: 0,
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

  // Also count assistance requests resolved
  assistanceRequests.forEach(ar => {
    if (ar.resolved_by) {
      const employeeId = ar.resolved_by;
      if (!resolvedByEmployee[employeeId]) {
        resolvedByEmployee[employeeId] = {
          count: 0,
          positiveCleared: 0,
          issuesResolved: 0,
          assistanceResolved: 0,
          totalResolutionTime: 0,
          resolutionCount: 0
        };
      }
      resolvedByEmployee[employeeId].assistanceResolved++;
      resolvedByEmployee[employeeId].count++;
    }
  });

  // Build performance array with employee names
  const performance = Object.entries(resolvedByEmployee)
    .map(([employeeId, data]) => ({
      name: employeeMap[employeeId] || 'Unknown',
      resolved: data.count,
      positiveCleared: data.positiveCleared,
      issuesResolved: data.issuesResolved,
      assistanceResolved: data.assistanceResolved,
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
 * Calculate trend data by splitting the date range into periods
 */
function calculateTrends(feedbackData, dateRange) {
  if (feedbackData.length < 2) return null;

  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);
  const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));

  // Only calculate trends if we have at least 7 days of data
  if (totalDays < 7) return null;

  // Split into two halves for comparison
  const midpoint = new Date(from.getTime() + (to - from) / 2);

  const firstHalf = feedbackData.filter(f => new Date(f.created_at) < midpoint);
  const secondHalf = feedbackData.filter(f => new Date(f.created_at) >= midpoint);

  // Calculate averages for each half
  const calcAvg = (data) => {
    const ratings = data.map(f => f.rating).filter(r => r != null);
    return ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
  };

  const firstHalfAvg = calcAvg(firstHalf);
  const secondHalfAvg = calcAvg(secondHalf);

  // Weekly breakdown if period is long enough
  let weeklyBreakdown = null;
  if (totalDays >= 14) {
    weeklyBreakdown = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    let weekStart = new Date(from);

    while (weekStart < to) {
      const weekEnd = new Date(Math.min(weekStart.getTime() + weekMs, to.getTime()));
      const weekData = feedbackData.filter(f => {
        const d = new Date(f.created_at);
        return d >= weekStart && d < weekEnd;
      });

      const weekRatings = weekData.map(f => f.rating).filter(r => r != null);
      const weekAvg = weekRatings.length > 0
        ? (weekRatings.reduce((a, b) => a + b, 0) / weekRatings.length).toFixed(2)
        : null;

      weeklyBreakdown.push({
        weekStart: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        weekEnd: weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        count: weekData.length,
        avgRating: weekAvg,
        lowRatings: weekData.filter(f => f.rating && f.rating <= 2).length
      });

      weekStart = weekEnd;
    }
  }

  // Calculate overall trend direction
  let trendDirection = null;
  if (firstHalfAvg !== null && secondHalfAvg !== null) {
    const diff = secondHalfAvg - firstHalfAvg;
    if (Math.abs(diff) >= 0.1) {
      trendDirection = diff > 0 ? 'improving' : 'declining';
    } else {
      trendDirection = 'stable';
    }
  }

  return {
    totalDays,
    firstHalf: {
      count: firstHalf.length,
      avgRating: firstHalfAvg?.toFixed(2) || 'N/A',
      period: `${from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${midpoint.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    },
    secondHalf: {
      count: secondHalf.length,
      avgRating: secondHalfAvg?.toFixed(2) || 'N/A',
      period: `${midpoint.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    },
    trendDirection,
    weeklyBreakdown
  };
}

/**
 * Build context string for Claude
 */
function buildContext(feedbackData, npsData, stats, staffPerformance, zonePerformance, questions, venueName, dateRange, trends, employees, staffRecognitions) {
  let context = `## Data Context for ${venueName || 'this venue'}
Period: ${dateRange.description}

### Active Feedback Questions:
${questions.length > 0
    ? questions.map((q, i) => `${i + 1}. "${q.question}"`).join('\n')
    : 'No active questions configured'}
`;

  // Only show per-question breakdown and stats if we have feedback data
  if (feedbackData.length > 0) {
    context += `
### Per-Question Breakdown:
${questions.length > 0
      ? questions.map(q => {
          const questionFeedback = feedbackData.filter(f => f.question_id === q.id);
          const ratings = questionFeedback.map(f => f.rating).filter(r => r != null);
          const avgRating = ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 'N/A';
          const lowCount = ratings.filter(r => r <= 2).length;
          const highCount = ratings.filter(r => r >= 4).length;
          return `- "${q.question}": ${ratings.length} responses, ${avgRating}/5 avg (${highCount} positive, ${lowCount} negative)`;
        }).join('\n')
      : 'No question data available'}

### Summary Statistics:
- Total feedback submissions: ${stats.totalFeedback}
- Average rating: ${stats.avgRating || 'N/A'}/5
- Rating breakdown: 5★: ${stats.ratingCounts[5]}, 4★: ${stats.ratingCounts[4]}, 3★: ${stats.ratingCounts[3]}, 2★: ${stats.ratingCounts[2]}, 1★: ${stats.ratingCounts[1]}
- Feedback with comments: ${stats.feedbackWithComments}
- Low ratings (1-2★): ${stats.lowRatingCount}
`;
  }

  // Only show NPS stats if we have NPS data
  if (npsData.length > 0) {
    context += `- NPS submissions: ${stats.totalNPS}${stats.npsScore !== null ? `, NPS Score: ${stats.npsScore}` : ''}\n`;
  }

  // Add trend analysis if available
  if (trends) {
    context += `
### Trend Analysis (over ${trends.totalDays} days):
- First half (${trends.firstHalf.period}): ${trends.firstHalf.count} feedback, ${trends.firstHalf.avgRating}/5 avg
- Second half (${trends.secondHalf.period}): ${trends.secondHalf.count} feedback, ${trends.secondHalf.avgRating}/5 avg
- Overall trend: ${trends.trendDirection || 'insufficient data'}
`;

    if (trends.weeklyBreakdown && trends.weeklyBreakdown.length > 0) {
      context += `\n**Weekly Breakdown:**\n`;
      trends.weeklyBreakdown.forEach(week => {
        const rating = week.avgRating ? `${week.avgRating}/5` : 'no ratings';
        const issues = week.lowRatings > 0 ? ` (${week.lowRatings} low)` : '';
        context += `- ${week.weekStart} - ${week.weekEnd}: ${week.count} feedback, ${rating}${issues}\n`;
      });
    }
  }

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
      const assistPart = staff.assistanceResolved > 0 ? `, ${staff.assistanceResolved} assistance requests` : '';
      context += `${i + 1}. ${staff.name}: ${staff.resolved} total resolved (${staff.issuesResolved} issues, ${staff.positiveCleared} positive${assistPart}) - ${avgTime}\n`;
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

  // Add zone performance data
  if (zonePerformance && zonePerformance.performance && zonePerformance.performance.length > 0) {
    context += `\n### Zone/Area Performance:\n`;

    // First show the zone-to-table mapping
    if (zonePerformance.zoneTableSummary) {
      context += `\n**Zone Layout:**\n`;
      Object.entries(zonePerformance.zoneTableSummary).forEach(([zoneName, tables]) => {
        if (tables.length > 0) {
          // Summarise table ranges for readability
          const tableStr = tables.length > 5
            ? `${tables[0]}-${tables[tables.length - 1]} (${tables.length} tables)`
            : tables.join(', ');
          context += `- ${zoneName}: Tables ${tableStr}\n`;
        }
      });
    }

    // Then show performance metrics per zone
    context += `\n**Zone Performance Metrics:**\n`;
    zonePerformance.performance.forEach((zone, i) => {
      const rating = zone.avgRating ? `${zone.avgRating}/5 avg` : 'no ratings';
      const issues = zone.lowRatings > 0 ? `, ${zone.lowRatings} low ratings` : '';
      context += `${i + 1}. ${zone.name}: ${zone.feedbackCount} feedback, ${rating}${issues}\n`;
    });

    // Find best and worst performing zones
    const zonesWithRatings = zonePerformance.performance.filter(z => z.avgRating);
    if (zonesWithRatings.length > 1) {
      const sorted = [...zonesWithRatings].sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating));
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      context += `\n**Best Performing Zone:** ${best.name} (${best.avgRating}/5)\n`;
      if (best.name !== worst.name) {
        context += `**Needs Attention:** ${worst.name} (${worst.avgRating}/5)\n`;
      }
    }

    // Show recent comments by zone if any have notable feedback
    const zonesWithComments = zonePerformance.performance.filter(z => z.recentComments && z.recentComments.length > 0);
    if (zonesWithComments.length > 0) {
      context += `\n**Recent Zone Comments:**\n`;
      zonesWithComments.forEach(zone => {
        zone.recentComments.forEach(c => {
          context += `- [${zone.name}, Table ${c.table}, ${c.rating}★] "${c.comment}"\n`;
        });
      });
    }
  }

  // Add full staff roster
  if (employees && employees.length > 0) {
    const activeEmployees = employees.filter(e => e.is_active !== false);
    const inactiveEmployees = employees.filter(e => e.is_active === false);

    context += `\n### Staff Roster (${activeEmployees.length} active, ${inactiveEmployees.length} inactive):\n`;

    // Group by role if roles exist
    const byRole = {};
    activeEmployees.forEach(e => {
      const role = e.role || 'Unassigned';
      if (!byRole[role]) byRole[role] = [];
      const name = e.first_name || e.last_name
        ? `${e.first_name || ''} ${e.last_name || ''}`.trim()
        : 'Unknown';
      byRole[role].push({ name, location: e.location, id: e.id });
    });

    Object.entries(byRole).forEach(([role, staff]) => {
      context += `\n**${role}** (${staff.length}):\n`;
      staff.forEach(s => {
        const loc = s.location ? ` - ${s.location}` : '';
        context += `- ${s.name}${loc}\n`;
      });
    });
  }

  // Add staff recognitions
  if (staffRecognitions && staffRecognitions.length > 0) {
    // Build employee name lookup
    const employeeNames = {};
    (employees || []).forEach(e => {
      const name = e.first_name || e.last_name
        ? `${e.first_name || ''} ${e.last_name || ''}`.trim()
        : 'Unknown';
      employeeNames[e.id] = name;
    });

    // Count recognitions per employee
    const recognitionCounts = {};
    staffRecognitions.forEach(r => {
      const empId = r.employee_id;
      if (!recognitionCounts[empId]) {
        recognitionCounts[empId] = { count: 0, messages: [] };
      }
      recognitionCounts[empId].count++;
      if (r.message?.trim() && recognitionCounts[empId].messages.length < 3) {
        recognitionCounts[empId].messages.push(r.message.trim());
      }
    });

    context += `\n### Staff Recognitions (${staffRecognitions.length} total in period):\n`;

    // Sort by recognition count and show top performers
    const sortedRecognitions = Object.entries(recognitionCounts)
      .map(([empId, data]) => ({
        name: employeeNames[empId] || 'Unknown',
        count: data.count,
        messages: data.messages
      }))
      .sort((a, b) => b.count - a.count);

    sortedRecognitions.forEach((s, i) => {
      context += `${i + 1}. ${s.name}: ${s.count} recognition${s.count !== 1 ? 's' : ''}\n`;
      if (s.messages.length > 0) {
        s.messages.forEach(m => {
          context += `   - "${m}"\n`;
        });
      }
    });

    // Most recognised employee
    if (sortedRecognitions.length > 0) {
      const mostRecognised = sortedRecognitions[0];
      context += `\n**Most Recognised Staff Member:** ${mostRecognised.name} (${mostRecognised.count} recognitions)\n`;
    }
  }

  return context;
}
