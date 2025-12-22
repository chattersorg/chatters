// /api/admin/seed-demo-feedback.js
// High-quality demo data generation for feedback and assistance requests
// Processes ONE DAY at a time to avoid Supabase rate limits
// Generates 45-50 sessions/day, 5-10 assistance requests/day
// ~95% completion rate, 7-10 min avg resolution time, 4.0-4.5 avg satisfaction

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const positiveComments = [
  'Excellent service, very attentive staff!',
  'Really enjoyed the atmosphere here',
  'Food was delicious, will definitely return',
  'Staff were friendly and professional',
  'Great experience overall',
  'Lovely venue, highly recommend',
  'Perfect for a night out',
  'Amazing cocktails and great service',
  'The team here are fantastic',
  'Best pub in the area!',
  'Really impressed with the quality',
  'Wonderful evening, thank you!',
  'Staff made us feel very welcome',
  'Great food and even better service',
  'Will be coming back soon!',
  null, null, null, null, null
];

const neutralComments = [
  'Service was okay',
  'Decent experience',
  'Food was average',
  'Nothing special but not bad',
  'Could be better',
  null, null, null
];

const negativeComments = [
  'Had to wait too long for drinks',
  'Staff seemed distracted',
  'Food took a while to arrive',
  'Could improve the service speed',
  'Table was not cleaned properly',
  'Music was too loud',
  null
];

const assistanceMessages = [
  'Could we get some more water please?',
  'Need the bill when you get a chance',
  'Can we order more drinks?',
  'Need some extra napkins',
  'Could we have the dessert menu?',
  'Can we move to a different table?',
  'Need help with menu choices',
  'Can we get some condiments please?',
  'Ready to order',
  'Need assistance with allergy information',
  'Could use some more cutlery',
  'Want to add to our order'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRating() {
  const rand = Math.random();
  if (rand < 0.02) return 1;
  if (rand < 0.05) return 2;
  if (rand < 0.20) return 3;
  if (rand < 0.65) return 4;
  return 5;
}

function getSentiment(rating) {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

function getComment(rating) {
  if (rating >= 4) return randomChoice(positiveComments);
  if (rating === 3) return randomChoice(neutralComments);
  return randomChoice(negativeComments);
}

function generateBusinessTime(date) {
  const hour = randomInt(11, 22);
  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);
  const newDate = new Date(date);
  newDate.setHours(hour, minute, second, 0);
  return newDate;
}

// Process a single day for a single venue
async function processSingleDay(venue, config, dateStr) {
  let feedbackCount = 0;
  let assistanceCount = 0;

  const currentDate = new Date(dateStr);

  // Delete existing data for this day
  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  await supabaseAdmin
    .from('feedback')
    .delete()
    .eq('venue_id', venue.id)
    .gte('created_at', dayStart.toISOString())
    .lte('created_at', dayEnd.toISOString());

  await supabaseAdmin
    .from('assistance_requests')
    .delete()
    .eq('venue_id', venue.id)
    .gte('created_at', dayStart.toISOString())
    .lte('created_at', dayEnd.toISOString());

  if (config.questions.length === 0) {
    return { feedbackCount: 0, assistanceCount: 0 };
  }

  // Generate 45-50 sessions per day
  const sessionsPerDay = randomInt(45, 50);
  const feedbackRecords = [];

  for (let s = 0; s < sessionsPerDay; s++) {
    const sessionId = uuidv4();
    const sessionTime = generateBusinessTime(currentDate);
    const tableNumber = randomInt(1, 25);

    // Each session answers all questions (or most - 90%)
    const questionsToAnswer = Math.random() > 0.1 
      ? config.questions 
      : config.questions.slice(0, randomInt(2, config.questions.length));

    for (const questionId of questionsToAnswer) {
      const rating = generateRating();
      const sentiment = getSentiment(rating);

      // 95% completion rate
      const shouldResolve = Math.random() < 0.95;
      const isNegative = rating <= 2;

      let resolved_at = null;
      let resolved_by = null;
      let co_resolver_id = null;
      let resolution_type = null;
      let is_actioned = false;

      if (shouldResolve && config.employees.length > 0) {
        is_actioned = true;
        // Resolution time: 3-15 minutes (avg ~9 min)
        const resolutionMinutes = randomInt(3, 15);
        resolved_at = new Date(sessionTime.getTime() + resolutionMinutes * 60 * 1000);
        resolved_by = randomChoice(config.employees);

        // 20% chance of co-resolver
        if (Math.random() < 0.2 && config.employees.length > 1) {
          const otherEmployees = config.employees.filter(e => e !== resolved_by);
          if (otherEmployees.length > 0) {
            co_resolver_id = randomChoice(otherEmployees);
          }
        }

        if (isNegative) {
          resolution_type = 'staff_resolved';
        } else if (rating >= 4) {
          resolution_type = 'positive_feedback_cleared';
        } else {
          resolution_type = Math.random() > 0.5 ? 'staff_resolved' : 'dismissed';
        }
      }

      feedbackRecords.push({
        question_id: questionId,
        venue_id: venue.id,
        session_id: sessionId,
        rating: rating,
        sentiment: sentiment,
        additional_feedback: getComment(rating),
        table_number: tableNumber,
        timestamp: sessionTime.toISOString(),
        created_at: sessionTime.toISOString(),
        is_actioned: is_actioned,
        resolved_at: resolved_at ? resolved_at.toISOString() : null,
        resolved_by: resolved_by,
        co_resolver_id: co_resolver_id,
        resolution_type: resolution_type,
        dismissed: resolution_type === 'dismissed',
        dismissed_at: resolution_type === 'dismissed' ? resolved_at.toISOString() : null
      });
    }
  }

  // Insert feedback in batches
  const batchSize = 200;
  for (let i = 0; i < feedbackRecords.length; i += batchSize) {
    const batch = feedbackRecords.slice(i, i + batchSize);
    const { error } = await supabaseAdmin.from('feedback').insert(batch);
    if (error) {
      console.error(`Error inserting feedback batch:`, error.message);
    } else {
      feedbackCount += batch.length;
    }
  }

  // Generate 5-10 assistance requests per day
  const assistancePerDay = randomInt(5, 10);
  const assistanceRecords = [];

  for (let a = 0; a < assistancePerDay; a++) {
    const requestTime = generateBusinessTime(currentDate);
    const tableNumber = randomInt(1, 25);

    const shouldResolve = Math.random() < 0.95;

    let status = 'pending';
    let acknowledged_at = null;
    let acknowledged_by = null;
    let resolved_at = null;
    let resolved_by = null;
    let notes = null;

    if (shouldResolve && config.employees.length > 0) {
      status = 'resolved';
      const ackMinutes = randomInt(1, 3);
      acknowledged_at = new Date(requestTime.getTime() + ackMinutes * 60 * 1000);
      acknowledged_by = randomChoice(config.employees);

      const resolveMinutes = randomInt(5, 12);
      resolved_at = new Date(requestTime.getTime() + resolveMinutes * 60 * 1000);
      resolved_by = acknowledged_by;
      notes = 'Request handled';
    } else if (Math.random() < 0.5 && config.employees.length > 0) {
      status = 'acknowledged';
      const ackMinutes = randomInt(1, 3);
      acknowledged_at = new Date(requestTime.getTime() + ackMinutes * 60 * 1000);
      acknowledged_by = randomChoice(config.employees);
    }

    assistanceRecords.push({
      venue_id: venue.id,
      table_number: tableNumber,
      message: randomChoice(assistanceMessages),
      status: status,
      created_at: requestTime.toISOString(),
      acknowledged_at: acknowledged_at ? acknowledged_at.toISOString() : null,
      acknowledged_by: acknowledged_by,
      resolved_at: resolved_at ? resolved_at.toISOString() : null,
      resolved_by: resolved_by,
      notes: notes
    });
  }

  const { error: assistanceError } = await supabaseAdmin.from('assistance_requests').insert(assistanceRecords);
  if (assistanceError) {
    console.error(`Error inserting assistance:`, assistanceError.message);
  } else {
    assistanceCount = assistanceRecords.length;
  }

  return { feedbackCount, assistanceCount };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && !userData.email?.endsWith('@getchatters.com'))) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { accountId, date, dates } = req.body;

    // Support both single date and multiple dates
    const datesToProcess = dates || (date ? [date] : []);

    if (!accountId || datesToProcess.length === 0) {
      return res.status(400).json({ error: 'Account ID and date(s) are required' });
    }

    // Limit to 5 days per request to avoid timeouts
    if (datesToProcess.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 days per request' });
    }

    // Get venues for this account
    const { data: venues, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id, name')
      .eq('account_id', accountId);

    if (venueError) throw venueError;
    if (!venues || venues.length === 0) {
      return res.status(404).json({ error: 'No venues found for this account' });
    }

    // Get questions and employees for each venue
    const venueConfigs = {};
    for (const venue of venues) {
      const { data: questions } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('venue_id', venue.id)
        .eq('active', true);

      const { data: employees } = await supabaseAdmin
        .from('employees')
        .select('id')
        .eq('venue_id', venue.id)
        .eq('is_active', true);

      venueConfigs[venue.id] = {
        name: venue.name,
        questions: questions?.map(q => q.id) || [],
        employees: employees?.map(e => e.id) || []
      };
    }

    // Process each venue for all requested dates
    let totalFeedback = 0;
    let totalAssistance = 0;

    for (const dateStr of datesToProcess) {
      for (const venue of venues) {
        const config = venueConfigs[venue.id];
        const { feedbackCount, assistanceCount } = await processSingleDay(venue, config, dateStr);
        totalFeedback += feedbackCount;
        totalAssistance += assistanceCount;
      }
    }

    return res.status(200).json({
      success: true,
      dates: datesToProcess,
      stats: {
        feedbackCreated: totalFeedback,
        assistanceCreated: totalAssistance,
        venuesProcessed: venues.length,
        daysProcessed: datesToProcess.length
      }
    });

  } catch (error) {
    console.error('[seed-demo-feedback] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
