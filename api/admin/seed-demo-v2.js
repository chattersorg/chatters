// /api/admin/seed-demo-v2.js
// Modular demo data seeding with support for individual data types
// OPTIMIZED with batch inserts to prevent timeouts

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const POSITIVE_COMMENTS = [
  'Excellent service, the staff were very attentive!',
  'Food was absolutely delicious, will definitely come back.',
  'Amazing atmosphere and great cocktails.',
  'Our server was fantastic, very knowledgeable about the menu.',
  'Best meal we\'ve had in ages, highly recommend!',
  'Quick service and wonderful presentation.',
  'The ambiance is perfect for a special occasion.',
  'Staff went above and beyond to accommodate our dietary needs.',
];

const NEUTRAL_COMMENTS = [
  'Food was good, service was okay.',
  'Average experience, nothing special but not bad.',
  'Decent meal, a bit pricey for what you get.',
  'Nice location but the menu is limited.',
];

const NEGATIVE_COMMENTS = [
  'Service was quite slow, waited 20 minutes for drinks.',
  'Food was cold when it arrived at our table.',
  'Our order was incorrect and took ages to fix.',
  'The bathroom was not clean.',
];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setTimeOfDay(date, hourMin, hourMax) {
  const newDate = new Date(date);
  newDate.setHours(randomInt(hourMin, hourMax), randomInt(0, 59), randomInt(0, 59));
  return newDate;
}

async function checkDateHasData(venueId, dateStr, dataType) {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  let table = 'feedback_sessions';
  if (dataType === 'reviews') table = 'historical_ratings';
  if (dataType === 'nps') table = 'nps_submissions';

  const { data } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('venue_id', venueId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .limit(1);

  return data && data.length > 0;
}

async function populateFeedback(venues, dates, stats) {
  for (const venue of venues) {
    // Get questions
    let { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('venue_id', venue.id)
      .eq('is_active', true);

    if (!questions || questions.length === 0) {
      const { data: newQuestions } = await supabaseAdmin
        .from('questions')
        .insert([
          { venue_id: venue.id, question_text: 'How was your overall experience?', display_order: 1, is_active: true },
          { venue_id: venue.id, question_text: 'How was the food quality?', display_order: 2, is_active: true },
          { venue_id: venue.id, question_text: 'How was the service?', display_order: 3, is_active: true }
        ])
        .select('id');
      questions = newQuestions || [];
    }

    const questionIds = questions.map(q => q.id);

    // Get staff members for resolution
    const { data: staffMembers } = await supabaseAdmin
      .from('staff')
      .select('user_id')
      .eq('venue_id', venue.id);

    const staffIds = staffMembers?.map(s => s.user_id) || [];
    const tableCount = venue.table_count || 10;

    for (const dateStr of dates) {
      if (await checkDateHasData(venue.id, dateStr, 'feedback')) {
        stats.datesSkipped++;
        continue;
      }

      stats.datesProcessed++;

      // Create 30 sessions per day
      const sessionsToInsert = [];
      for (let i = 0; i < 30; i++) {
        const sessionTime = setTimeOfDay(new Date(dateStr), 11, 21);
        const sessionId = uuidv4();

        sessionsToInsert.push({
          id: sessionId,
          venue_id: venue.id,
          table_number: randomInt(1, tableCount).toString(),
          started_at: sessionTime.toISOString(),
          _sessionTime: sessionTime,
        });
      }

      // Batch insert sessions
      const { data: insertedSessions, error: sessionError } = await supabaseAdmin
        .from('feedback_sessions')
        .insert(sessionsToInsert.map(s => ({
          id: s.id,
          venue_id: s.venue_id,
          table_number: s.table_number,
          started_at: s.started_at
        })))
        .select();

      if (sessionError) throw new Error(`Failed to create sessions: ${sessionError.message}`);
      stats.sessionsCreated += insertedSessions.length;

      // Create feedback items
      const feedbackToInsert = [];

      insertedSessions.forEach((session, idx) => {
        const sessionTime = sessionsToInsert[idx]._sessionTime;

        // 90% completion rate
        if (Math.random() > 0.1) {
          for (const questionId of questionIds) {
            let rating;
            const rand = Math.random();
            if (rand < 0.70) {
              rating = randomInt(4, 5);
            } else if (rand < 0.90) {
              rating = 3;
            } else {
              rating = randomInt(1, 2);
            }

            let comment = null;
            if (Math.random() > 0.6) {
              if (rating >= 4) {
                comment = randomElement(POSITIVE_COMMENTS);
              } else if (rating === 3) {
                comment = randomElement(NEUTRAL_COMMENTS);
              } else {
                comment = randomElement(NEGATIVE_COMMENTS);
              }
            }

            const feedbackItem = {
              venue_id: venue.id,
              session_id: session.id,
              question_id: questionId,
              table_number: session.table_number,
              rating: rating,
              additional_feedback: comment,
              created_at: sessionTime.toISOString(),
              timestamp: sessionTime.toISOString()
            };

            // RANDOM RESOLUTION: 60% of feedback older than 2 days gets resolved
            const daysOld = Math.ceil((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
            if (daysOld > 2 && staffIds.length > 0 && Math.random() < 0.6) {
              const resolvedBy = randomElement(staffIds);
              const hoursToResolve = randomInt(1, 48);
              const resolveTime = new Date(sessionTime.getTime() + hoursToResolve * 60 * 60 * 1000);

              feedbackItem.acknowledged_at = resolveTime.toISOString();
              feedbackItem.acknowledged_by = resolvedBy;
              stats.feedbackResolved = (stats.feedbackResolved || 0) + 1;
            }

            feedbackToInsert.push(feedbackItem);
          }
        }
      });

      // Batch insert feedback (chunks of 500)
      if (feedbackToInsert.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < feedbackToInsert.length; i += chunkSize) {
          const chunk = feedbackToInsert.slice(i, i + chunkSize);
          const { error } = await supabaseAdmin
            .from('feedback')
            .insert(chunk);

          if (error) {
            console.error('Error inserting feedback:', error);
          } else {
            stats.feedbackCreated += chunk.length;
          }
        }
      }
    }
  }
}

async function populateReviews(venues, dates, stats) {
  for (const venue of venues) {
    const allGoogleRatings = [];
    const allTripAdvisorRatings = [];

    for (const dateStr of dates) {
      if (await checkDateHasData(venue.id, dateStr, 'reviews')) {
        stats.datesSkipped++;
        continue;
      }

      stats.datesProcessed++;

      // Generate 1 Google rating per day
      const googleTime = setTimeOfDay(new Date(dateStr), 10, 22);
      const rand = Math.random();
      let googleRating;
      if (rand < 0.50) googleRating = 5;
      else if (rand < 0.75) googleRating = 4;
      else if (rand < 0.90) googleRating = 3;
      else if (rand < 0.97) googleRating = 2;
      else googleRating = 1;

      allGoogleRatings.push(googleRating);

      // Generate 1 TripAdvisor rating per day (slightly lower average)
      const tripTime = setTimeOfDay(new Date(dateStr), 10, 22);
      let tripRating;
      const tripRand = Math.random();
      if (tripRand < 0.40) tripRating = 5;
      else if (tripRand < 0.70) tripRating = 4;
      else if (tripRand < 0.90) tripRating = 3;
      else tripRating = randomInt(1, 2);

      allTripAdvisorRatings.push(tripRating);

      // Create historical snapshots
      const googleAvg = (allGoogleRatings.reduce((a, b) => a + b, 0) / allGoogleRatings.length).toFixed(1);
      const tripAvg = (allTripAdvisorRatings.reduce((a, b) => a + b, 0) / allTripAdvisorRatings.length).toFixed(1);

      const snapshotTime = setTimeOfDay(new Date(dateStr), 23, 23);

      await supabaseAdmin
        .from('historical_ratings')
        .insert([
          {
            venue_id: venue.id,
            source: 'google',
            rating: googleAvg,
            ratings_count: allGoogleRatings.length,
            is_initial: false,
            recorded_at: snapshotTime.toISOString()
          },
          {
            venue_id: venue.id,
            source: 'tripadvisor',
            rating: tripAvg,
            ratings_count: allTripAdvisorRatings.length,
            is_initial: false,
            recorded_at: snapshotTime.toISOString()
          }
        ]);

      stats.externalRatingsCreated += 2;
    }

    // Update current external_ratings with latest data
    if (allGoogleRatings.length > 0) {
      const googleAvg = (allGoogleRatings.reduce((a, b) => a + b, 0) / allGoogleRatings.length).toFixed(1);
      await supabaseAdmin
        .from('external_ratings')
        .upsert({
          venue_id: venue.id,
          source: 'google',
          rating: googleAvg,
          ratings_count: allGoogleRatings.length,
          fetched_at: new Date().toISOString()
        }, { onConflict: 'venue_id,source' });
    }

    if (allTripAdvisorRatings.length > 0) {
      const tripAvg = (allTripAdvisorRatings.reduce((a, b) => a + b, 0) / allTripAdvisorRatings.length).toFixed(1);
      await supabaseAdmin
        .from('external_ratings')
        .upsert({
          venue_id: venue.id,
          source: 'tripadvisor',
          rating: tripAvg,
          ratings_count: allTripAdvisorRatings.length,
          fetched_at: new Date().toISOString()
        }, { onConflict: 'venue_id,source' });
    }
  }
}

async function populateNPS(venues, dates, stats) {
  for (const venue of venues) {
    for (const dateStr of dates) {
      if (await checkDateHasData(venue.id, dateStr, 'nps')) {
        stats.datesSkipped++;
        continue;
      }

      stats.datesProcessed++;

      const npsToInsert = [];

      // 20 NPS submissions per day
      for (let i = 0; i < 20; i++) {
        const visitTime = setTimeOfDay(new Date(dateStr), 11, 21);
        const scheduledDate = new Date(visitTime.getTime() + 24 * 60 * 60 * 1000);
        const sentDate = new Date(scheduledDate.getTime() + randomInt(0, 30) * 60 * 1000);
        const respondedDate = new Date(sentDate.getTime() + randomInt(1, 48) * 60 * 60 * 1000);

        let npsScore;
        const rand = Math.random();
        if (rand < 0.60) {
          npsScore = randomInt(9, 10);
        } else if (rand < 0.85) {
          npsScore = randomInt(7, 8);
        } else {
          npsScore = randomInt(0, 6);
        }

        npsToInsert.push({
          venue_id: venue.id,
          customer_email: `demo_customer_${dateStr}_${i}@example.com`,
          scheduled_send_at: scheduledDate.toISOString(),
          sent_at: sentDate.toISOString(),
          score: npsScore,
          responded_at: respondedDate.toISOString(),
          created_at: visitTime.toISOString()
        });
      }

      // Batch insert NPS
      const { error } = await supabaseAdmin
        .from('nps_submissions')
        .insert(npsToInsert);

      if (error) {
        console.error('Error inserting NPS:', error);
      } else {
        stats.npsCreated += npsToInsert.length;
      }
    }
  }
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

    const { accountId, startDate, endDate, dataType = 'all' } = req.body;

    if (!accountId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Account ID, start date, and end date are required' });
    }

    // Get all venues for this account
    const { data: venues, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id, name, table_count')
      .eq('account_id', accountId);

    if (venueError) throw venueError;

    if (!venues || venues.length === 0) {
      return res.status(404).json({ error: 'No venues found for this account' });
    }

    // Generate date array
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    const stats = {
      feedbackCreated: 0,
      feedbackResolved: 0,
      sessionsCreated: 0,
      externalRatingsCreated: 0,
      npsCreated: 0,
      datesSkipped: 0,
      datesProcessed: 0
    };

    // Populate based on dataType
    if (dataType === 'feedback' || dataType === 'all') {
      await populateFeedback(venues, dates, stats);
    }

    if (dataType === 'reviews' || dataType === 'all') {
      await populateReviews(venues, dates, stats);
    }

    if (dataType === 'nps' || dataType === 'all') {
      await populateNPS(venues, dates, stats);
    }

    return res.status(200).json({
      success: true,
      message: `Demo ${dataType} data created for ${venues.length} venue(s) across ${dates.length} days`,
      stats
    });

  } catch (error) {
    console.error('[seed-demo-v2] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
