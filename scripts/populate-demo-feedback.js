/**
 * One-time Demo Feedback Data Population Script
 *
 * This script generates realistic feedback data for the demo account.
 * - Generates 60 days of historical feedback data
 * - Uses batch inserts for performance (no timeouts)
 * - Creates feedback sessions with realistic patterns
 * - Marks older feedback as resolved
 * - NO NPS emails generated
 *
 * Usage:
 *   REACT_APP_SUPABASE_URL=https://xjznwqvwlooarskroogf.supabase.co \
 *   REACT_APP_SUPABASE_ANON_KEY=your_key \
 *   node scripts/populate-demo-feedback.js
 */

const { createClient } = require('@supabase/supabase-js');

// Demo account ID
const DEMO_ACCOUNT_ID = 'af1d9502-a1a9-4873-8776-9b7177ed30c3';

// Number of days to populate
const DAYS_TO_POPULATE = 60;

// Feedback templates
const feedbackTemplates = {
  positive: [
    "Absolutely fantastic experience! The food was delicious and the service was top-notch.",
    "Had a wonderful time here. Great atmosphere and friendly staff.",
    "Excellent meal, everything was perfect. Highly recommend!",
    "Best pub food I've had in ages. Will definitely be back!",
    "Lovely venue, great drinks selection, and the staff were amazing.",
    "Perfect spot for a Sunday roast. Everything was cooked to perfection.",
    "Really enjoyed our visit. Staff were particularly helpful.",
    "Great value for money and the portions were generous.",
    "Beautiful setting and the food exceeded expectations.",
    "Couldn't fault anything. From start to finish, it was brilliant.",
    "The atmosphere was perfect and our server was so attentive.",
    "Wonderful experience, will definitely recommend to friends.",
    "Such a gem! Food was superb and service was impeccable.",
    "Loved every minute. The team here really know what they're doing.",
    "Outstanding! One of the best meals I've had this year."
  ],
  neutral: [
    "Nice place, food was good. Service could be a bit faster.",
    "Decent experience overall. Would come back.",
    "Good atmosphere, standard pub fare. Nothing special but nothing bad.",
    "Solid meal, reasonably priced. Busy but that's expected.",
    "Pleasant enough. The food was okay, maybe a bit hit and miss.",
    "Average experience. Food was fine, service was okay.",
    "Not bad for a quick bite. Would prefer more vegetarian options.",
    "Acceptable. Nothing to complain about but nothing remarkable either.",
    "Food was tasty but took a while to arrive.",
    "Good location, decent food. Could improve on presentation."
  ],
  negative: [
    "Disappointing experience. Food took ages to arrive and wasn't even hot.",
    "Not impressed. The service was slow and the food was mediocre.",
    "Expected better. The place was busy and staff seemed rushed.",
    "Overpriced for what you get. Won't be rushing back.",
    "Poor experience. Very disappointing given the reviews.",
    "Food was cold when it arrived. Had to send it back.",
    "Waited 45 minutes for our food, then it was wrong order.",
    "Not up to standard. The quality has really gone downhill."
  ]
};

// Generate random time between 11am and 10pm for a given date
function getRandomTimeInRange(date) {
  const result = new Date(date);
  const hour = 11 + Math.floor(Math.random() * 11); // 11am to 10pm
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  result.setHours(hour, minute, second, 0);
  return result;
}

async function populateDemoData() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🚀 Starting demo feedback data population...\n');

  // Get all venues for the demo account
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name')
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

  const stats = {
    totalSessions: 0,
    totalFeedback: 0,
    totalResolved: 0,
    errors: 0
  };

  // Process each venue
  for (const venue of venues) {
    console.log(`\n📊 Processing: ${venue.name}`);

    // Get venue resources
    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .eq('venue_id', venue.id);

    const { data: staffMembers } = await supabase
      .from('staff')
      .select('user_id')
      .eq('venue_id', venue.id);

    const staffIds = staffMembers?.map(s => s.user_id) || [];

    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('venue_id', venue.id);

    const questionIds = questions?.map(q => q.id) || [];

    console.log(`   👥 ${employees?.length || 0} employees, ${staffIds.length} staff, ${questionIds.length} questions`);

    // Generate data for each day
    for (let daysAgo = DAYS_TO_POPULATE; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      // Sessions per day: 15-25 (realistic restaurant traffic)
      const sessionCount = 15 + Math.floor(Math.random() * 10);

      const sessionsToInsert = [];
      const feedbackToInsert = [];

      for (let i = 0; i < sessionCount; i++) {
        const timestamp = getRandomTimeInRange(date);
        const tableNumber = Math.floor(Math.random() * 20) + 1;
        const sessionId = `${venue.id}-${date.getTime()}-${i}`;

        // Create session
        sessionsToInsert.push({
          id: sessionId,
          venue_id: venue.id,
          table_number: tableNumber,
          started_at: timestamp.toISOString(),
        });

        // Realistic distribution: 65% positive, 25% neutral, 10% negative
        const rand = Math.random();
        let rating;
        let templates;

        if (rand < 0.65) {
          rating = Math.random() < 0.6 ? 5 : 4;
          templates = feedbackTemplates.positive;
        } else if (rand < 0.90) {
          rating = 3;
          templates = feedbackTemplates.neutral;
        } else {
          rating = Math.random() < 0.5 ? 2 : 1;
          templates = feedbackTemplates.negative;
        }

        // 60% chance of having a comment
        const hasComment = Math.random() < 0.6;
        const feedbackText = hasComment
          ? templates[Math.floor(Math.random() * templates.length)]
          : null;

        const feedbackRecord = {
          venue_id: venue.id,
          session_id: sessionId,
          rating: rating,
          additional_feedback: feedbackText,
          table_number: tableNumber,
          created_at: timestamp.toISOString(),
        };

        // Randomly assign question
        if (questionIds.length > 0 && Math.random() < 0.7) {
          feedbackRecord.question_id = questionIds[Math.floor(Math.random() * questionIds.length)];
        }

        // Randomly assign employee
        if (employees && employees.length > 0 && Math.random() < 0.5) {
          feedbackRecord.employee_id = employees[Math.floor(Math.random() * employees.length)].id;
        }

        // Auto-resolve older feedback (feedback older than 7 days = 85% resolved)
        if (daysAgo > 7 && staffIds.length > 0 && Math.random() < 0.85) {
          const resolvedBy = staffIds[Math.floor(Math.random() * staffIds.length)];
          const resolveTime = new Date(timestamp.getTime() + (1 + Math.random() * 47) * 60 * 60 * 1000);
          feedbackRecord.acknowledged_at = resolveTime.toISOString();
          feedbackRecord.acknowledged_by = resolvedBy;
          stats.totalResolved++;
        }

        feedbackToInsert.push(feedbackRecord);
      }

      // Batch insert sessions (30 at a time)
      if (sessionsToInsert.length > 0) {
        const { error: sessionError } = await supabase
          .from('feedback_sessions')
          .insert(sessionsToInsert);

        if (sessionError) {
          console.error(`   ❌ Error inserting sessions for ${date.toLocaleDateString()}:`, sessionError.message);
          stats.errors++;
        } else {
          stats.totalSessions += sessionsToInsert.length;
        }
      }

      // Batch insert feedback (chunks of 500 to avoid payload limits)
      const chunkSize = 500;
      for (let i = 0; i < feedbackToInsert.length; i += chunkSize) {
        const chunk = feedbackToInsert.slice(i, i + chunkSize);
        const { error: feedbackError } = await supabase
          .from('feedback')
          .insert(chunk);

        if (feedbackError) {
          console.error(`   ❌ Error inserting feedback chunk for ${date.toLocaleDateString()}:`, feedbackError.message);
          stats.errors++;
        } else {
          stats.totalFeedback += chunk.length;
        }
      }

      // Progress indicator (every 7 days)
      if (daysAgo % 7 === 0) {
        console.log(`   ✓ ${DAYS_TO_POPULATE - daysAgo} days populated...`);
      }
    }

    console.log(`   ✅ Completed ${venue.name}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Demo data population complete!\n');
  console.log(`📈 Statistics:`);
  console.log(`   Total sessions:  ${stats.totalSessions.toLocaleString()}`);
  console.log(`   Total feedback:  ${stats.totalFeedback.toLocaleString()}`);
  console.log(`   Resolved items:  ${stats.totalResolved.toLocaleString()}`);
  console.log(`   Errors:          ${stats.errors}`);
  console.log('='.repeat(60) + '\n');

  if (stats.errors > 0) {
    console.log('⚠️  Some errors occurred. Check logs above for details.');
  } else {
    console.log('🎉 All data populated successfully!');
  }
}

// Run the script
populateDemoData().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
