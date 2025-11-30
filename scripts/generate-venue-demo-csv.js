// Generate a single CSV file with all demo data for a specific venue
// Usage: node scripts/generate-venue-demo-csv.js <venueId> <days>
// Example: node scripts/generate-venue-demo-csv.js abc123 60

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const POSITIVE_COMMENTS = [
  'Excellent service, the staff were very attentive!',
  'Food was absolutely delicious, will definitely come back.',
  'Amazing atmosphere and great cocktails.',
  'Our server was fantastic, very knowledgeable about the menu.',
];

const NEUTRAL_COMMENTS = [
  'Food was good, service was okay.',
  'Average experience, nothing special but not bad.',
];

const NEGATIVE_COMMENTS = [
  'Service was quite slow, waited 20 minutes for drinks.',
  'Food was cold when it arrived at our table.',
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

async function generateVenueDemoData(venueId, days = 60) {
  console.log(`\n🚀 Generating ${days} days of demo data for venue ${venueId}...\n`);

  // Get venue
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id, name, table_count')
    .eq('id', venueId)
    .single();

  if (venueError || !venue) {
    console.error('Error: Venue not found');
    process.exit(1);
  }

  console.log(`Venue: ${venue.name}`);

  // Get questions
  let { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('venue_id', venue.id)
    .eq('is_active', true);

  if (!questions || questions.length === 0) {
    console.log('Creating default questions...');
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

  // Get staff
  const { data: staffMembers } = await supabase
    .from('staff')
    .select('user_id')
    .eq('venue_id', venue.id);

  const staffIds = staffMembers?.map(s => s.user_id) || [];
  const tableCount = venue.table_count || 10;

  // Generate dates
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dates = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().split('T')[0]);
  }

  // Create output directory
  const outputDir = path.join(__dirname, '..', 'demo-data-csv');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `venue-${venueId}-demo-data.csv`;
  const csvPath = path.join(outputDir, filename);
  const csv = fs.createWriteStream(csvPath);

  // Write header
  csv.write('data_type,session_id,table_number,rating,comment,nps_score,customer_email,google_rating,tripadvisor_rating,timestamp,question_id,acknowledged_by,acknowledged_at\n');

  let stats = {
    sessions: 0,
    feedback: 0,
    nps: 0,
    ratings: 0
  };

  const allGoogleRatings = [];
  const allTripAdvisorRatings = [];

  console.log(`\nGenerating data for ${dates.length} days...\n`);

  for (const dateStr of dates) {
    // Generate 5 sessions per day
    for (let i = 0; i < 5; i++) {
      const sessionTime = setTimeOfDay(new Date(dateStr), 11, 21);
      const sessionId = uuidv4();
      const tableNum = randomInt(1, tableCount);

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

          let comment = '';
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
          let acknowledgedBy = '';
          let acknowledgedAt = '';

          if (daysOld > 2 && staffIds.length > 0 && Math.random() < 0.6) {
            acknowledgedBy = randomElement(staffIds);
            const hoursToResolve = randomInt(1, 48);
            const resolveTime = new Date(sessionTime.getTime() + hoursToResolve * 60 * 60 * 1000);
            acknowledgedAt = resolveTime.toISOString();
          }

          csv.write(`feedback,${escapeCSV(sessionId)},${escapeCSV(tableNum)},${escapeCSV(rating)},${escapeCSV(comment)},,,,,${escapeCSV(sessionTime.toISOString())},${escapeCSV(questionId)},${escapeCSV(acknowledgedBy)},${escapeCSV(acknowledgedAt)}\n`);
          stats.feedback++;
        }
      }
    }

    // Generate 5 NPS submissions per day
    for (let i = 0; i < 5; i++) {
      const visitTime = setTimeOfDay(new Date(dateStr), 11, 21);

      let npsScore;
      const rand = Math.random();
      if (rand < 0.60) {
        npsScore = randomInt(9, 10);
      } else if (rand < 0.85) {
        npsScore = randomInt(7, 8);
      } else {
        npsScore = randomInt(0, 6);
      }

      csv.write(`nps,,,,${escapeCSV(npsScore)},demo_${dateStr}_${i}@example.com,,,,${escapeCSV(visitTime.toISOString())},,,,\n`);
      stats.nps++;
    }

    // Generate Google & TripAdvisor ratings
    const rand = Math.random();
    let googleRating;
    if (rand < 0.50) googleRating = 5;
    else if (rand < 0.75) googleRating = 4;
    else if (rand < 0.90) googleRating = 3;
    else if (rand < 0.97) googleRating = 2;
    else googleRating = 1;

    allGoogleRatings.push(googleRating);

    let tripRating;
    const tripRand = Math.random();
    if (tripRand < 0.40) tripRating = 5;
    else if (tripRand < 0.70) tripRating = 4;
    else if (tripRand < 0.90) tripRating = 3;
    else tripRating = randomInt(1, 2);

    allTripAdvisorRatings.push(tripRating);

    const snapshotTime = setTimeOfDay(new Date(dateStr), 23, 23);
    csv.write(`rating,,,,,,,${escapeCSV(googleRating)},,${escapeCSV(snapshotTime.toISOString())},,,,\n`);
    csv.write(`rating,,,,,,,,${escapeCSV(tripRating)},${escapeCSV(snapshotTime.toISOString())},,,,\n`);
    stats.ratings += 2;
  }

  csv.end();

  console.log(`✅ CSV generated: ${filename}\n`);
  console.log('📊 Stats:');
  console.log(`  - Sessions: ${stats.sessions}`);
  console.log(`  - Feedback items: ${stats.feedback}`);
  console.log(`  - NPS submissions: ${stats.nps}`);
  console.log(`  - Rating snapshots: ${stats.ratings}`);
  console.log(`\n📁 File location: ${csvPath}\n`);
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scripts/generate-venue-demo-csv.js <venueId> [days]');
  process.exit(1);
}

const venueId = args[0];
const days = parseInt(args[1]) || 60;

generateVenueDemoData(venueId, days).catch(console.error);
