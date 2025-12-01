#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// The Lion of Beaconsfield venue ID
const VENUE_ID = 'd877bd0b-6522-409f-9192-ca996e1a7f48';
const VENUE_NAME = 'The Lion of Beaconsfield';

// Generate random feedback text
const feedbackTemplates = {
  positive: [
    "Absolutely fantastic experience! The food was delicious and the service was top-notch.",
    "Had a wonderful time here. Great atmosphere and friendly staff.",
    "Excellent meal, everything was perfect. Highly recommend!",
    "Best pub food I've had in ages. Will definitely be back!",
    "Lovely venue, great drinks selection, and the staff were amazing.",
    "Perfect spot for a Sunday roast. Everything was cooked to perfection.",
    "Really enjoyed our visit. The staff were particularly helpful.",
    "Great value for money and the portions were generous.",
    "Beautiful setting and the food exceeded expectations.",
    "Couldn't fault anything. From start to finish, it was brilliant.",
    "What a gem! The steak was cooked perfectly and the wine selection was superb.",
    "Fantastic service from start to finish. Will be recommending to friends.",
    "The fish and chips were the best I've had outside of the coast!",
    "Warm and welcoming atmosphere. Felt like home.",
    "Sunday lunch was exceptional. Already booked again for next week!"
  ],
  neutral: [
    "Nice place, food was good. Service could be a bit faster.",
    "Decent experience overall. Would come back.",
    "Good atmosphere, standard pub fare. Nothing special but nothing bad.",
    "Solid meal, reasonably priced. Busy but that's expected.",
    "Pleasant enough. The food was okay, maybe a bit hit and miss.",
    "Average experience. Food was fine, service was okay.",
    "Not bad for a quick bite. Would prefer more vegetarian options.",
    "Acceptable. Nothing to complain about but nothing remarkable either."
  ],
  negative: [
    "Disappointing experience. Food took ages to arrive and wasn't even hot.",
    "Not impressed. The service was slow and the food was mediocre.",
    "Expected better. The place was dirty and staff seemed disinterested.",
    "Overpriced for what you get. Won't be returning.",
    "Poor experience from start to finish. Very disappointing.",
    "Food was cold when it arrived. Had to send it back.",
    "Waited 45 minutes for our food, then it was wrong order.",
    "Not up to standard. The quality has really gone downhill."
  ]
};

const assistanceReasons = [
  'Need extra napkins', 'Request bill', 'Order drinks', 'Ask about menu',
  'Need condiments', 'Table needs cleaning', 'Request water', 'WiFi password',
  'Allergy question', 'High chair request', 'Birthday candles needed',
  'More cutlery please', 'Check on food order', 'Dessert menu request'
];

// Insert data in batches
async function insertInBatches(tableName, data, batchSize = 500) {
  console.log(`\n💾 Inserting ${data.length} records into ${tableName}...`);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).insert(batch);

    if (error) {
      console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`   ✓ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} (${batch.length} records)`);
    }
  }
}

// Main execution
async function main() {
  console.log(`🚀 Starting demo data insertion for ${VENUE_NAME}...\n`);
  console.log(`📡 Connected to: ${supabaseUrl}\n`);

  try {
    // Step 1: Get existing employees
    console.log('========================================');
    console.log('STEP 1: Loading Employees');
    console.log('========================================\n');

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, role')
      .eq('venue_id', VENUE_ID)
      .eq('is_active', true);

    if (empError || !employees || employees.length === 0) {
      console.error(`❌ No employees found for ${VENUE_NAME}`);
      process.exit(1);
    }

    console.log(`   ✓ Found ${employees.length} employees`);
    employees.forEach(e => console.log(`     - ${e.first_name} ${e.last_name} (${e.role})`));

    // Step 2: Clear existing data for this venue
    console.log('\n========================================');
    console.log('STEP 2: Clearing Existing Data');
    console.log('========================================\n');

    await supabase.from('nps_submissions').delete().eq('venue_id', VENUE_ID);
    await supabase.from('assistance_requests').delete().eq('venue_id', VENUE_ID);
    await supabase.from('feedback').delete().eq('venue_id', VENUE_ID);
    await supabase.from('external_ratings').delete().eq('venue_id', VENUE_ID);
    await supabase.from('historical_ratings').delete().eq('venue_id', VENUE_ID);

    console.log('   ✓ Cleared existing data');

    // Step 3: Generate feedback for last 30 days
    console.log('\n========================================');
    console.log('STEP 3: Generating Feedback (30 days)');
    console.log('========================================\n');

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(10, 0, 0, 0);

    const allFeedback = [];
    const allAssistance = [];

    let currentDate = new Date(startDate);
    let dayCount = 0;

    while (currentDate <= endDate) {
      // 50-70 responses per day (slightly less than Dunn Inn)
      const responsesPerDay = Math.floor(Math.random() * 21) + 50;
      dayCount++;

      for (let i = 0; i < responsesPerDay; i++) {
        // Random time during the day (10am - 11pm)
        const responseTime = new Date(currentDate);
        responseTime.setHours(10 + Math.floor(Math.random() * 13));
        responseTime.setMinutes(Math.floor(Math.random() * 60));
        responseTime.setSeconds(Math.floor(Math.random() * 60));

        // Determine sentiment (65% positive, 25% neutral, 10% negative)
        const rand = Math.random();
        let rating, templates;

        if (rand < 0.65) {
          rating = Math.random() < 0.5 ? 5 : 4;
          templates = feedbackTemplates.positive;
        } else if (rand < 0.9) {
          rating = 3;
          templates = feedbackTemplates.neutral;
        } else {
          rating = Math.random() < 0.5 ? 1 : 2;
          templates = feedbackTemplates.negative;
        }

        // Random table number (1-20)
        const tableNumber = Math.floor(Math.random() * 20) + 1;

        // Select random feedback template
        const feedbackText = templates[Math.floor(Math.random() * templates.length)];

        // 80% of feedback should be resolved
        const shouldResolve = Math.random() < 0.80;

        // Select random staff member for resolution
        const resolvingStaff = employees[Math.floor(Math.random() * employees.length)];

        // Resolution happens 5-60 minutes after feedback
        const resolutionTime = new Date(responseTime.getTime() + (5 + Math.floor(Math.random() * 55)) * 60 * 1000);

        // Create feedback record with unique session_id
        const feedback = {
          venue_id: VENUE_ID,
          session_id: uuidv4(),
          rating: rating,
          additional_feedback: feedbackText,
          table_number: tableNumber,
          created_at: responseTime.toISOString(),
          is_actioned: shouldResolve,
          resolved_by: shouldResolve ? resolvingStaff.id : null,
          resolved_at: shouldResolve ? resolutionTime.toISOString() : null,
          resolution_type: shouldResolve ? (rating > 3 ? 'positive_feedback_cleared' : 'staff_resolved') : null
        };

        allFeedback.push(feedback);

        // 12% chance of assistance request
        if (Math.random() < 0.12) {
          const assistanceTime = new Date(responseTime.getTime() - Math.random() * 30 * 60 * 1000);
          const assistanceResolved = Math.random() < 0.95;

          let assistResolvedAt = null;
          let assistResolvedBy = null;

          if (assistanceResolved) {
            const assistMinutes = Math.floor(Math.random() * 5) + 1;
            assistResolvedAt = new Date(assistanceTime.getTime() + assistMinutes * 60 * 1000);
            assistResolvedBy = employees[Math.floor(Math.random() * employees.length)].id;
          }

          const assistance = {
            venue_id: VENUE_ID,
            table_number: tableNumber,
            status: assistanceResolved ? 'resolved' : 'pending',
            message: assistanceReasons[Math.floor(Math.random() * assistanceReasons.length)],
            created_at: assistanceTime.toISOString(),
            acknowledged_at: assistanceResolved ? assistanceTime.toISOString() : null,
            acknowledged_by: assistResolvedBy,
            resolved_at: assistResolvedAt ? assistResolvedAt.toISOString() : null,
            resolved_by: assistResolvedBy,
            notes: assistanceResolved ? 'Request handled' : null
          };

          allAssistance.push(assistance);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`   ✓ Generated ${dayCount} days of feedback`);
    console.log(`   📊 Total feedback records: ${allFeedback.length}`);
    console.log(`   📊 Total assistance requests: ${allAssistance.length}`);

    // Calculate resolution stats
    const resolvedCount = allFeedback.filter(f => f.is_actioned).length;
    console.log(`   📊 Resolved: ${resolvedCount} (${Math.round(resolvedCount / allFeedback.length * 100)}%)`);

    // Step 4: Insert feedback
    console.log('\n========================================');
    console.log('STEP 4: Inserting Feedback & Assistance');
    console.log('========================================');

    await insertInBatches('feedback', allFeedback, 500);
    await insertInBatches('assistance_requests', allAssistance, 500);

    // Step 5: Generate historical ratings with gradual improvement
    console.log('\n========================================');
    console.log('STEP 5: Generating Historical Ratings');
    console.log('========================================\n');

    const allHistoricalRatings = [];
    const historicalStart = new Date(startDate);
    const historicalEnd = new Date(endDate);

    // Starting ratings (Lion starts slightly higher)
    let tripAdvisorRating = 4.0;
    let tripAdvisorCount = 120;
    let googleRating = 3.9;
    let googleCount = 185;

    // Target ratings
    const tripAdvisorTarget = 4.6;
    const googleTarget = 4.5;

    let ratingsCurrentDate = new Date(historicalStart);
    let isFirst = true;

    while (ratingsCurrentDate <= historicalEnd) {
      // Calculate progress (0 to 1)
      const progress = (ratingsCurrentDate - historicalStart) / (historicalEnd - historicalStart);

      // Gradually increase ratings
      const currentTripAdvisor = tripAdvisorRating + (tripAdvisorTarget - tripAdvisorRating) * progress;
      const currentGoogle = googleRating + (googleTarget - googleRating) * progress;

      // TripAdvisor rating
      allHistoricalRatings.push({
        venue_id: VENUE_ID,
        source: 'tripadvisor',
        rating: parseFloat(currentTripAdvisor.toFixed(2)),
        ratings_count: tripAdvisorCount,
        is_initial: isFirst,
        recorded_at: ratingsCurrentDate.toISOString()
      });

      // Google rating
      allHistoricalRatings.push({
        venue_id: VENUE_ID,
        source: 'google',
        rating: parseFloat(currentGoogle.toFixed(2)),
        ratings_count: googleCount,
        is_initial: isFirst,
        recorded_at: ratingsCurrentDate.toISOString()
      });

      isFirst = false;

      // Increment review counts
      tripAdvisorCount += Math.floor(Math.random() * 3) + 1;
      googleCount += Math.floor(Math.random() * 4) + 2;

      // Move to next day
      ratingsCurrentDate.setDate(ratingsCurrentDate.getDate() + 1);
    }

    console.log(`   ✓ TripAdvisor: ${tripAdvisorRating} → ${tripAdvisorTarget} (${tripAdvisorCount} reviews)`);
    console.log(`   ✓ Google: ${googleRating} → ${googleTarget} (${googleCount} reviews)`);

    await insertInBatches('historical_ratings', allHistoricalRatings, 500);

    // Insert current external ratings
    const { error: extError } = await supabase.from('external_ratings').insert([
      {
        venue_id: VENUE_ID,
        source: 'tripadvisor',
        rating: tripAdvisorTarget,
        ratings_count: tripAdvisorCount,
        fetched_at: new Date().toISOString()
      },
      {
        venue_id: VENUE_ID,
        source: 'google',
        rating: googleTarget,
        ratings_count: googleCount,
        fetched_at: new Date().toISOString()
      }
    ]);

    if (extError) {
      console.error('   ❌ Error inserting external ratings:', extError.message);
    } else {
      console.log('\n💾 Inserting 2 records into external_ratings...');
      console.log('   ✓ Inserted batch 1/1 (2 records)');
    }

    // Step 6: Generate NPS data
    console.log('\n========================================');
    console.log('STEP 6: Generating NPS Data');
    console.log('========================================\n');

    const allNPSSubmissions = [];
    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'James', 'Sophie', 'David', 'Emily', 'Tom', 'Lucy', 'Alex', 'Kate', 'Ben', 'Anna', 'Matt', 'Lisa', 'Chris', 'Rachel', 'Dan', 'Claire'];
    const lastNames = ['Smith', 'Jones', 'Brown', 'Wilson', 'Taylor', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Johnson', 'Walker', 'Wright', 'Robinson', 'Thompson', 'White', 'Hughes', 'Edwards', 'Green', 'Hall', 'Wood'];
    const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.co.uk', 'hotmail.com', 'icloud.com'];

    let npsCurrentDate = new Date(startDate);

    while (npsCurrentDate <= endDate) {
      // 20-35 NPS submissions per day
      const npsPerDay = Math.floor(Math.random() * 16) + 20;

      for (let i = 0; i < npsPerDay; i++) {
        const visitTime = new Date(npsCurrentDate);
        visitTime.setHours(10 + Math.floor(Math.random() * 13));
        visitTime.setMinutes(Math.floor(Math.random() * 60));

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`;

        const scheduledSendAt = new Date(visitTime.getTime() + 24 * 60 * 60 * 1000);
        const wasSent = Math.random() < 0.85;
        const sentAt = wasSent ? new Date(scheduledSendAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null;
        const hasResponse = wasSent && Math.random() < 0.60;

        let score = null;
        let respondedAt = null;

        if (hasResponse) {
          const rand = Math.random();
          if (rand < 0.45) {
            score = Math.random() < 0.6 ? 10 : 9;
          } else if (rand < 0.75) {
            score = Math.random() < 0.5 ? 8 : 7;
          } else {
            score = Math.floor(Math.random() * 7);
          }
          const responseDelay = Math.random() * 3 * 24 * 60 * 60 * 1000;
          respondedAt = new Date(sentAt.getTime() + responseDelay);
        }

        allNPSSubmissions.push({
          venue_id: VENUE_ID,
          customer_email: email,
          scheduled_send_at: scheduledSendAt.toISOString(),
          sent_at: sentAt ? sentAt.toISOString() : null,
          send_error: wasSent ? null : (Math.random() < 0.3 ? 'Invalid email address' : null),
          score: score,
          responded_at: respondedAt ? respondedAt.toISOString() : null,
          created_at: visitTime.toISOString()
        });
      }

      npsCurrentDate.setDate(npsCurrentDate.getDate() + 1);
    }

    const responses = allNPSSubmissions.filter(s => s.score !== null);
    const promoters = responses.filter(s => s.score >= 9).length;
    const passives = responses.filter(s => s.score >= 7 && s.score <= 8).length;
    const detractors = responses.filter(s => s.score <= 6).length;
    const npsScore = responses.length > 0 ? Math.round(((promoters - detractors) / responses.length) * 100) : 0;

    console.log(`   ✓ Generated ${allNPSSubmissions.length} NPS submissions`);
    console.log(`   📊 Responses: ${responses.length} (${Math.round(responses.length / allNPSSubmissions.length * 100)}% response rate)`);
    console.log(`   📊 NPS Score: ${npsScore}`);

    await insertInBatches('nps_submissions', allNPSSubmissions, 500);

    console.log(`\n✅ Demo data insertion complete for ${VENUE_NAME}!\n`);
    console.log('==========================================');
    console.log('Summary:');
    console.log('==========================================');
    console.log(`✓ ${allFeedback.length} feedback records (80% resolved by staff)`);
    console.log(`✓ ${allAssistance.length} assistance requests`);
    console.log(`✓ ${allHistoricalRatings.length} historical rating records`);
    console.log(`✓ TripAdvisor: 4.0 → 4.6 | Google: 3.9 → 4.5`);
    console.log(`✓ ${allNPSSubmissions.length} NPS submissions`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
