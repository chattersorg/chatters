/**
 * Populate Missing Demo Days Script
 *
 * This script:
 * - Checks which days in the last 30 days (+ tomorrow) are missing demo data
 * - Populates those days with consistent, even data
 * - Creates Google/TripAdvisor ratings that increase by 0.5 over the 30 days
 *
 * Usage:
 *   REACT_APP_SUPABASE_URL=https://xjznwqvwlooarskroogf.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
 *   node scripts/populate-missing-demo-days.js
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Demo account ID
const DEMO_ACCOUNT_ID = 'af1d9502-a1a9-4873-8776-9b7177ed30c3';

// Configuration
const DAYS_BACK = 30;
const DAYS_FORWARD = 1; // Tomorrow
const SESSIONS_PER_DAY = 20; // Even amount each day
const NPS_PER_DAY = 5;

// Starting ratings (30 days ago) - will increase by 0.5 over the period
const STARTING_GOOGLE_RATING = 4.2;
const STARTING_TRIPADVISOR_RATING = 4.0;
const RATING_INCREASE = 0.5;

// Feedback templates
const POSITIVE_COMMENTS = [
  'Excellent service, the staff were very attentive!',
  'Food was absolutely delicious, will definitely come back.',
  'Amazing atmosphere and great cocktails.',
  'Our server was fantastic, very knowledgeable about the menu.',
  'Best meal we\'ve had in ages, highly recommend!',
  'Quick service and wonderful presentation.',
  'The ambiance is perfect for a special occasion.',
  'Staff went above and beyond to accommodate our dietary needs.',
  'Lovely evening, great food and friendly service.',
  'Really impressed with the quality. Top notch!',
];

const NEUTRAL_COMMENTS = [
  'Food was good, service was okay.',
  'Average experience, nothing special but not bad.',
  'Decent meal, a bit pricey for what you get.',
  'Nice location but the menu is limited.',
  'Fine for a quick bite, nothing memorable.',
];

const NEGATIVE_COMMENTS = [
  'Service was quite slow, waited 20 minutes for drinks.',
  'Food was cold when it arrived at our table.',
  'Our order was incorrect and took ages to fix.',
  'The bathroom was not clean.',
  'Disappointed with the portion sizes.',
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

// Calculate what the rating should be for a given day (0 = oldest, DAYS_BACK = today)
function getRatingForDay(dayIndex, startRating) {
  const totalDays = DAYS_BACK + DAYS_FORWARD;
  const dailyIncrease = RATING_INCREASE / totalDays;
  return Math.min(5, startRating + (dayIndex * dailyIncrease));
}

async function main() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials.');
    console.error('   Required: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🚀 Starting missing demo days population...\n');

  // Get all venues for the demo account
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name, table_count')
    .eq('account_id', DEMO_ACCOUNT_ID);

  if (venuesError) {
    console.error('❌ Failed to fetch venues:', venuesError.message);
    process.exit(1);
  }

  if (!venues || venues.length === 0) {
    console.error('❌ No demo venues found');
    process.exit(1);
  }

  console.log(`📍 Found ${venues.length} venues:\n${venues.map(v => `   - ${v.name}`).join('\n')}\n`);

  // Generate date range (30 days back to tomorrow)
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = DAYS_BACK; i >= -DAYS_FORWARD; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push({
      dateStr: date.toISOString().split('T')[0],
      date: date,
      dayIndex: DAYS_BACK - i // 0 = oldest day, increases towards future
    });
  }

  console.log(`📅 Date range: ${dates[0].dateStr} to ${dates[dates.length - 1].dateStr} (${dates.length} days)\n`);

  const stats = {
    daysChecked: 0,
    daysSkipped: 0,
    daysPopulated: 0,
    sessionsCreated: 0,
    feedbackCreated: 0,
    npsCreated: 0,
    ratingsCreated: 0,
    errors: 0
  };

  for (const venue of venues) {
    console.log(`\n📊 Processing: ${venue.name}`);

    // Get questions for this venue
    let { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('venue_id', venue.id)
      .eq('active', true);

    if (!questions || questions.length === 0) {
      // Create default questions
      const { data: newQuestions } = await supabase
        .from('questions')
        .insert([
          { venue_id: venue.id, question: 'How was your overall experience?', order: 1, active: true },
          { venue_id: venue.id, question: 'How was the food quality?', order: 2, active: true },
          { venue_id: venue.id, question: 'How was the service?', order: 3, active: true }
        ])
        .select('id');
      questions = newQuestions || [];
      console.log('   ✓ Created default questions');
    }

    const questionIds = questions.map(q => q.id);

    // Get staff members for resolution
    const { data: staffMembers } = await supabase
      .from('staff')
      .select('user_id')
      .eq('venue_id', venue.id);

    const staffIds = staffMembers?.map(s => s.user_id) || [];
    const tableCount = venue.table_count || 15;

    // Check which days already have data
    const missingDays = [];

    for (const dayInfo of dates) {
      stats.daysChecked++;

      const startOfDay = new Date(dayInfo.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dayInfo.date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingSessions } = await supabase
        .from('feedback_sessions')
        .select('id')
        .eq('venue_id', venue.id)
        .gte('started_at', startOfDay.toISOString())
        .lte('started_at', endOfDay.toISOString())
        .limit(1);

      if (existingSessions && existingSessions.length > 0) {
        stats.daysSkipped++;
      } else {
        missingDays.push(dayInfo);
      }
    }

    console.log(`   📋 ${missingDays.length} days need data, ${stats.daysSkipped} days already have data`);

    // Populate missing days
    for (const dayInfo of missingDays) {
      const { dateStr, date, dayIndex } = dayInfo;

      // Calculate ratings for this day
      const googleRating = getRatingForDay(dayIndex, STARTING_GOOGLE_RATING);
      const tripRating = getRatingForDay(dayIndex, STARTING_TRIPADVISOR_RATING);

      // Create feedback sessions
      const sessionsToInsert = [];
      const feedbackToInsert = [];

      for (let i = 0; i < SESSIONS_PER_DAY; i++) {
        const sessionTime = setTimeOfDay(date, 11, 21);
        const sessionId = uuidv4();
        const tableNumber = randomInt(1, tableCount).toString();

        sessionsToInsert.push({
          id: sessionId,
          venue_id: venue.id,
          table_number: tableNumber,
          started_at: sessionTime.toISOString(),
        });

        // Create feedback for this session
        // Rating distribution: 65% positive (4-5), 25% neutral (3), 10% negative (1-2)
        const rand = Math.random();
        let rating;
        let comment = null;

        if (rand < 0.65) {
          rating = Math.random() < 0.6 ? 5 : 4;
          if (Math.random() < 0.4) comment = randomElement(POSITIVE_COMMENTS);
        } else if (rand < 0.90) {
          rating = 3;
          if (Math.random() < 0.3) comment = randomElement(NEUTRAL_COMMENTS);
        } else {
          rating = Math.random() < 0.5 ? 2 : 1;
          if (Math.random() < 0.5) comment = randomElement(NEGATIVE_COMMENTS);
        }

        const questionId = randomElement(questionIds);

        const feedbackItem = {
          venue_id: venue.id,
          session_id: sessionId,
          question_id: questionId,
          table_number: tableNumber,
          rating: rating,
          additional_feedback: comment,
          created_at: sessionTime.toISOString(),
          timestamp: sessionTime.toISOString()
        };

        feedbackToInsert.push(feedbackItem);
      }

      // Insert sessions
      const { error: sessionError } = await supabase
        .from('feedback_sessions')
        .insert(sessionsToInsert);

      if (sessionError) {
        console.error(`   ❌ Error inserting sessions for ${dateStr}:`, sessionError.message);
        stats.errors++;
        continue;
      }
      stats.sessionsCreated += sessionsToInsert.length;

      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert(feedbackToInsert);

      if (feedbackError) {
        console.error(`   ❌ Error inserting feedback for ${dateStr}:`, feedbackError.message);
        stats.errors++;
      } else {
        stats.feedbackCreated += feedbackToInsert.length;
      }

      // Create NPS submissions
      const npsToInsert = [];
      for (let i = 0; i < NPS_PER_DAY; i++) {
        const visitTime = setTimeOfDay(date, 11, 21);
        const scheduledDate = new Date(visitTime.getTime() + 24 * 60 * 60 * 1000);
        const sentDate = new Date(scheduledDate.getTime() + randomInt(0, 30) * 60 * 1000);
        const respondedDate = new Date(sentDate.getTime() + randomInt(1, 48) * 60 * 60 * 1000);

        // NPS distribution: 60% promoters (9-10), 25% passives (7-8), 15% detractors (0-6)
        let npsScore;
        const npsRand = Math.random();
        if (npsRand < 0.60) {
          npsScore = randomInt(9, 10);
        } else if (npsRand < 0.85) {
          npsScore = randomInt(7, 8);
        } else {
          npsScore = randomInt(0, 6);
        }

        npsToInsert.push({
          venue_id: venue.id,
          customer_email: `demo_${dateStr.replace(/-/g, '')}_${i}@example.com`,
          scheduled_send_at: scheduledDate.toISOString(),
          sent_at: sentDate.toISOString(),
          score: npsScore,
          responded_at: respondedDate.toISOString(),
          created_at: visitTime.toISOString()
        });
      }

      const { error: npsError } = await supabase
        .from('nps_submissions')
        .insert(npsToInsert);

      if (npsError) {
        console.error(`   ❌ Error inserting NPS for ${dateStr}:`, npsError.message);
        stats.errors++;
      } else {
        stats.npsCreated += npsToInsert.length;
      }

      // Create historical ratings (end of day snapshot)
      const snapshotTime = setTimeOfDay(date, 23, 23);

      // Calculate cumulative counts based on day position
      const ratingsCount = (dayIndex + 1) * 3; // Grows over time

      const { error: ratingsError } = await supabase
        .from('historical_ratings')
        .insert([
          {
            venue_id: venue.id,
            source: 'google',
            rating: googleRating.toFixed(1),
            ratings_count: ratingsCount,
            is_initial: false,
            recorded_at: snapshotTime.toISOString()
          },
          {
            venue_id: venue.id,
            source: 'tripadvisor',
            rating: tripRating.toFixed(1),
            ratings_count: ratingsCount,
            is_initial: false,
            recorded_at: snapshotTime.toISOString()
          }
        ]);

      if (ratingsError) {
        console.error(`   ❌ Error inserting ratings for ${dateStr}:`, ratingsError.message);
        stats.errors++;
      } else {
        stats.ratingsCreated += 2;
      }

      stats.daysPopulated++;
    }

    // Update external_ratings with the latest (tomorrow's) values
    const latestDay = dates[dates.length - 1];
    const finalGoogleRating = getRatingForDay(latestDay.dayIndex, STARTING_GOOGLE_RATING);
    const finalTripRating = getRatingForDay(latestDay.dayIndex, STARTING_TRIPADVISOR_RATING);
    const totalRatingsCount = (latestDay.dayIndex + 1) * 3;

    await supabase
      .from('external_ratings')
      .upsert({
        venue_id: venue.id,
        source: 'google',
        rating: finalGoogleRating.toFixed(1),
        ratings_count: totalRatingsCount,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'venue_id,source' });

    await supabase
      .from('external_ratings')
      .upsert({
        venue_id: venue.id,
        source: 'tripadvisor',
        rating: finalTripRating.toFixed(1),
        ratings_count: totalRatingsCount,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'venue_id,source' });

    console.log(`   ✅ Completed ${venue.name}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Demo data population complete!\n');
  console.log('📈 Statistics:');
  console.log(`   Days checked:      ${stats.daysChecked}`);
  console.log(`   Days skipped:      ${stats.daysSkipped} (already had data)`);
  console.log(`   Days populated:    ${stats.daysPopulated}`);
  console.log(`   Sessions created:  ${stats.sessionsCreated}`);
  console.log(`   Feedback created:  ${stats.feedbackCreated}`);
  console.log(`   NPS created:       ${stats.npsCreated}`);
  console.log(`   Ratings created:   ${stats.ratingsCreated}`);
  console.log(`   Errors:            ${stats.errors}`);
  console.log('='.repeat(60));
  console.log('\n📊 Rating progression:');
  console.log(`   Google:      ${STARTING_GOOGLE_RATING.toFixed(1)} → ${(STARTING_GOOGLE_RATING + RATING_INCREASE).toFixed(1)} (+${RATING_INCREASE})`);
  console.log(`   TripAdvisor: ${STARTING_TRIPADVISOR_RATING.toFixed(1)} → ${(STARTING_TRIPADVISOR_RATING + RATING_INCREASE).toFixed(1)} (+${RATING_INCREASE})`);
  console.log('');

  if (stats.errors > 0) {
    console.log('⚠️  Some errors occurred. Check logs above for details.');
    process.exit(1);
  } else {
    console.log('🎉 All data populated successfully!');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
