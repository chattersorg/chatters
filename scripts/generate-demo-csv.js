// Generate CSV files for demo data population
// Usage: node scripts/generate-demo-csv.js <accountId> <days>
// Example: node scripts/generate-demo-csv.js abc123 60

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function generateDemoData(accountId, days = 60) {
  console.log(`\n🚀 Generating ${days} days of demo data for account ${accountId}...\n`);

  // Get account venues
  const { data: venues, error: venueError } = await supabase
    .from('venues')
    .select('id, name, table_count')
    .eq('account_id', accountId);

  if (venueError || !venues || venues.length === 0) {
    console.error('Error: No venues found for this account');
    process.exit(1);
  }

  console.log(`Found ${venues.length} venue(s):`);
  venues.forEach(v => console.log(`  - ${v.name} (${v.id})`));

  // Generate dates
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dates = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().split('T')[0]);
  }

  console.log(`\nDate range: ${dates[0]} to ${dates[dates.length - 1]}\n`);

  // Create output directory
  const outputDir = path.join(__dirname, '..', 'demo-data-csv');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // CSV file streams
  const sessionsCsv = fs.createWriteStream(path.join(outputDir, 'sessions.csv'));
  const feedbackCsv = fs.createWriteStream(path.join(outputDir, 'feedback.csv'));
  const npsCsv = fs.createWriteStream(path.join(outputDir, 'nps.csv'));
  const ratingsCsv = fs.createWriteStream(path.join(outputDir, 'ratings.csv'));

  // Write CSV headers
  sessionsCsv.write('id,venue_id,table_number,started_at,created_at\n');
  feedbackCsv.write('venue_id,session_id,question_id,table_number,rating,additional_feedback,created_at,timestamp,acknowledged_at,acknowledged_by\n');
  npsCsv.write('venue_id,customer_email,scheduled_send_at,sent_at,score,responded_at,created_at\n');
  ratingsCsv.write('venue_id,source,rating,ratings_count,is_initial,recorded_at\n');

  let stats = {
    sessions: 0,
    feedback: 0,
    nps: 0,
    ratings: 0
  };

  for (const venue of venues) {
    console.log(`\nProcessing venue: ${venue.name}...`);

    // Get questions for this venue
    let { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('venue_id', venue.id)
      .eq('is_active', true);

    if (!questions || questions.length === 0) {
      console.log('  Creating default questions...');
      const { data: newQuestions } = await supabase
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

    // Get staff for resolution
    const { data: staffMembers } = await supabase
      .from('staff')
      .select('user_id')
      .eq('venue_id', venue.id);

    const staffIds = staffMembers?.map(s => s.user_id) || [];
    const tableCount = venue.table_count || 10;

    // Track ratings for cumulative average
    const allGoogleRatings = [];
    const allTripAdvisorRatings = [];

    for (const dateStr of dates) {
      // Generate 5 sessions per day
      for (let i = 0; i < 5; i++) {
        const sessionTime = setTimeOfDay(new Date(dateStr), 11, 21);
        const sessionId = uuidv4();

        sessionsCsv.write(`${escapeCSV(sessionId)},${escapeCSV(venue.id)},${escapeCSV(randomInt(1, tableCount))},${escapeCSV(sessionTime.toISOString())},${escapeCSV(sessionTime.toISOString())}\n`);
        stats.sessions++;

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

            // Random resolution (60% of items older than 2 days)
            const daysOld = Math.ceil((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
            let acknowledgedAt = '';
            let acknowledgedBy = '';

            if (daysOld > 2 && staffIds.length > 0 && Math.random() < 0.6) {
              const resolvedBy = randomElement(staffIds);
              const hoursToResolve = randomInt(1, 48);
              const resolveTime = new Date(sessionTime.getTime() + hoursToResolve * 60 * 60 * 1000);
              acknowledgedAt = resolveTime.toISOString();
              acknowledgedBy = resolvedBy;
            }

            feedbackCsv.write(`${escapeCSV(venue.id)},${escapeCSV(sessionId)},${escapeCSV(questionId)},${escapeCSV(randomInt(1, tableCount))},${escapeCSV(rating)},${escapeCSV(comment)},${escapeCSV(sessionTime.toISOString())},${escapeCSV(sessionTime.toISOString())},${escapeCSV(acknowledgedAt)},${escapeCSV(acknowledgedBy)}\n`);
            stats.feedback++;
          }
        }
      }

      // Generate 5 NPS submissions per day
      for (let i = 0; i < 5; i++) {
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

        npsCsv.write(`${escapeCSV(venue.id)},demo_customer_${dateStr}_${i}@example.com,${escapeCSV(scheduledDate.toISOString())},${escapeCSV(sentDate.toISOString())},${escapeCSV(npsScore)},${escapeCSV(respondedDate.toISOString())},${escapeCSV(visitTime.toISOString())}\n`);
        stats.nps++;
      }

      // Generate Google & TripAdvisor ratings
      const googleTime = setTimeOfDay(new Date(dateStr), 10, 22);
      const rand = Math.random();
      let googleRating;
      if (rand < 0.50) googleRating = 5;
      else if (rand < 0.75) googleRating = 4;
      else if (rand < 0.90) googleRating = 3;
      else if (rand < 0.97) googleRating = 2;
      else googleRating = 1;

      allGoogleRatings.push(googleRating);

      const tripTime = setTimeOfDay(new Date(dateStr), 10, 22);
      let tripRating;
      const tripRand = Math.random();
      if (tripRand < 0.40) tripRating = 5;
      else if (tripRand < 0.70) tripRating = 4;
      else if (tripRand < 0.90) tripRating = 3;
      else tripRating = randomInt(1, 2);

      allTripAdvisorRatings.push(tripRating);

      // Historical snapshots
      const googleAvg = (allGoogleRatings.reduce((a, b) => a + b, 0) / allGoogleRatings.length).toFixed(1);
      const tripAvg = (allTripAdvisorRatings.reduce((a, b) => a + b, 0) / allTripAdvisorRatings.length).toFixed(1);

      const snapshotTime = setTimeOfDay(new Date(dateStr), 23, 23);

      ratingsCsv.write(`${escapeCSV(venue.id)},google,${escapeCSV(googleAvg)},${escapeCSV(allGoogleRatings.length)},false,${escapeCSV(snapshotTime.toISOString())}\n`);
      ratingsCsv.write(`${escapeCSV(venue.id)},tripadvisor,${escapeCSV(tripAvg)},${escapeCSV(allTripAdvisorRatings.length)},false,${escapeCSV(snapshotTime.toISOString())}\n`);
      stats.ratings += 2;
    }

    console.log(`  ✅ Generated ${dates.length} days of data`);
  }

  // Close streams
  sessionsCsv.end();
  feedbackCsv.end();
  npsCsv.end();
  ratingsCsv.end();

  console.log(`\n✅ CSV files generated in ${outputDir}/\n`);
  console.log('📊 Stats:');
  console.log(`  - Sessions: ${stats.sessions}`);
  console.log(`  - Feedback items: ${stats.feedback}`);
  console.log(`  - NPS submissions: ${stats.nps}`);
  console.log(`  - Rating snapshots: ${stats.ratings}`);

  console.log('\n📝 Next steps:');
  console.log('1. Review the CSV files');
  console.log('2. Use the import script: node scripts/import-demo-csv.js');
  console.log('   OR manually import via Supabase dashboard\n');
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scripts/generate-demo-csv.js <accountId> [days]');
  console.log('Example: node scripts/generate-demo-csv.js abc123 60');
  process.exit(1);
}

const accountId = args[0];
const days = parseInt(args[1]) || 60;

generateDemoData(accountId, days).catch(console.error);
