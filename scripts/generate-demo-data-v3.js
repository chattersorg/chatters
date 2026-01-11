#!/usr/bin/env node

/**
 * Enhanced Demo Data Generator v3
 *
 * Features:
 * - Uses EXISTING employees from the database (doesn't create new ones)
 * - Uses EXISTING questions and respects conditional_tags thresholds
 * - Generates feedback_tag_responses when rating < threshold
 * - Links some NPS to feedback sessions (customers who provided email)
 * - Some NPS are standalone (customers who didn't leave feedback)
 * - Adds co-resolver support based on venue settings
 * - Varies data patterns per venue for realism
 *
 * Usage:
 *   node scripts/generate-demo-data-v3.js <account_id>
 *   node scripts/generate-demo-data-v3.js <account_id> --clear   # Clear existing data first
 *   node scripts/generate-demo-data-v3.js <account_id> --days=30 # Custom day range
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const accountId = args.find(arg => !arg.startsWith('--'));
const shouldClear = args.includes('--clear');
const daysArg = args.find(arg => arg.startsWith('--days='));
const DAYS_TO_GENERATE = daysArg ? parseInt(daysArg.split('=')[1]) : 60;

if (!accountId) {
  console.error('❌ Usage: node generate-demo-data-v3.js <account_id> [--clear] [--days=60]');
  console.error('   Example: node generate-demo-data-v3.js af1d9502-a1a9-4873-8776-9b7177ed30c3');
  process.exit(1);
}

// Feedback text templates
const feedbackTemplates = {
  positive: [
    "Absolutely fantastic experience! The food was delicious and the service was top-notch.",
    "Had a wonderful time here. Great atmosphere and friendly staff.",
    "Excellent meal, everything was perfect. Highly recommend!",
    "Best pub food I've had in ages. Will definitely be back!",
    "Lovely venue, great drinks selection, and the staff were amazing.",
    "Perfect spot for a Sunday roast. Everything was cooked to perfection.",
    "Really enjoyed our visit. {staff_name} was particularly helpful.",
    "Great value for money and the portions were generous.",
    "Beautiful setting and the food exceeded expectations.",
    "Couldn't fault anything. From start to finish, it was brilliant.",
    null, null, null // Some feedback has no text
  ],
  neutral: [
    "Nice place, food was good. Service could be a bit faster.",
    "Decent experience overall. Would come back.",
    "Good atmosphere, standard pub fare. Nothing special but nothing bad.",
    "Solid meal, reasonably priced. Busy but that's expected.",
    "Pleasant enough. The food was okay, maybe a bit hit and miss.",
    "Average experience. Food was fine, service was okay.",
    null, null // Some feedback has no text
  ],
  negative: [
    "Disappointing experience. Food took ages to arrive and wasn't even hot.",
    "Not impressed. The service was slow and the food was mediocre.",
    "Expected better. The place was busy and staff seemed rushed.",
    "Overpriced for what you get. Won't be rushing back.",
    "Food was cold when it arrived. Had to send it back.",
    "Waited 45 minutes for our food, then it was wrong order.",
    null // Some feedback has no text
  ]
};

const assistanceReasons = [
  'Need extra napkins', 'Request bill', 'Order drinks', 'Ask about menu',
  'Need condiments', 'Table needs cleaning', 'Request water', 'WiFi password',
  'Allergy question', 'High chair request', 'More cutlery please',
  'Can we order dessert?', 'Need a kids menu'
];

const npsFeedbackTemplates = {
  promoter: [
    "Wonderful experience, will definitely recommend!",
    "Best meal we've had in months. Already told friends about it.",
    "Exceptional service and food quality.",
    "A hidden gem! Can't wait to come back.",
    null, null // Many don't leave feedback
  ],
  passive: [
    "Good overall, but room for improvement.",
    "Nice place, nothing exceptional.",
    "Decent experience.",
    null, null, null
  ],
  detractor: [
    "Disappointing visit. Expected better based on reviews.",
    "Service was too slow and food was average.",
    "Won't be returning. Not worth the price.",
    null, null
  ]
};

// Customer name pools for NPS
const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'James', 'Sophie', 'David', 'Emily', 'Tom', 'Lucy', 'Alex', 'Kate', 'Ben', 'Anna', 'Matt', 'Lisa', 'Chris', 'Rachel', 'Dan', 'Claire', 'Oliver', 'Amelia', 'Harry', 'Isla', 'George', 'Mia', 'Jack', 'Ava', 'Jacob', 'Charlotte'];

// Insert data in batches
async function insertInBatches(tableName, data, batchSize = 500) {
  if (data.length === 0) {
    console.log(`   ⏭️  No ${tableName} records to insert`);
    return [];
  }

  console.log(`\n💾 Inserting ${data.length} records into ${tableName}...`);
  const insertedData = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { data: inserted, error } = await supabase.from(tableName).insert(batch).select();

    if (error) {
      console.error(`   ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      if (batch[0]) {
        console.error('   First record:', JSON.stringify(batch[0], null, 2));
      }
    } else {
      console.log(`   ✓ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} (${batch.length} records)`);
      if (inserted) insertedData.push(...inserted);
    }
  }

  return insertedData;
}

// Generate weighted rating
function generateRating(venueIndex = 0) {
  // Each venue has slightly different rating distribution
  const distributions = [
    { p5: 0.35, p4: 0.35, p3: 0.20, p2: 0.07, p1: 0.03 }, // Venue 0: balanced
    { p5: 0.30, p4: 0.30, p3: 0.25, p2: 0.10, p1: 0.05 }, // Venue 1: slightly worse
    { p5: 0.40, p4: 0.38, p3: 0.15, p2: 0.05, p1: 0.02 }, // Venue 2: better
  ];

  const dist = distributions[venueIndex % distributions.length];
  const rand = Math.random();

  if (rand < dist.p5) return 5;
  if (rand < dist.p5 + dist.p4) return 4;
  if (rand < dist.p5 + dist.p4 + dist.p3) return 3;
  if (rand < dist.p5 + dist.p4 + dist.p3 + dist.p2) return 2;
  return 1;
}

// Get feedback text based on rating
function getFeedbackText(rating, employees) {
  let templates;
  if (rating >= 4) templates = feedbackTemplates.positive;
  else if (rating === 3) templates = feedbackTemplates.neutral;
  else templates = feedbackTemplates.negative;

  let text = templates[Math.floor(Math.random() * templates.length)];

  // Replace {staff_name} placeholder if present
  if (text && text.includes('{staff_name}') && employees.length > 0) {
    const emp = employees[Math.floor(Math.random() * employees.length)];
    text = text.replace('{staff_name}', emp.first_name);
  }

  return text;
}

// Generate random time during business hours
function getRandomTimeInRange(date) {
  const result = new Date(date);
  const hour = 10 + Math.floor(Math.random() * 13); // 10am to 11pm
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  result.setHours(hour, minute, second, 0);
  return result;
}

// Generate test email for NPS
function generateTestEmail() {
  const random = Math.random().toString(36).substring(2, 8);
  return `luke+demo-cust-${random}@getchatters.com`;
}

// Generate NPS score with gradual improvement over time
// monthIndex: 0 = oldest month, higher = more recent
// cumulativeBoost: total NPS points to add by this month
function generateNpsScore(monthIndex, cumulativeBoost) {
  // Base distribution: 50% promoter, 30% passive, 20% detractor → NPS ~30
  // We shift the distribution to improve NPS over time
  // Each point of boost increases promoter % by ~0.5% and decreases detractor % by ~0.5%

  const boostFactor = cumulativeBoost / 100; // Convert to percentage shift

  // Adjusted probabilities (capped at reasonable limits)
  const promoterProb = Math.min(0.70, 0.50 + boostFactor * 0.5);
  const detractorProb = Math.max(0.05, 0.20 - boostFactor * 0.5);
  const passiveProb = 1 - promoterProb - detractorProb;

  const rand = Math.random();

  if (rand < promoterProb) {
    // Promoter: 9-10
    return Math.random() < 0.6 ? 10 : 9;
  } else if (rand < promoterProb + passiveProb) {
    // Passive: 7-8
    return Math.random() < 0.5 ? 8 : 7;
  } else {
    // Detractor: 0-6
    return Math.floor(Math.random() * 7);
  }
}

// Main execution
async function main() {
  console.log('🚀 Enhanced Demo Data Generator v3\n');
  console.log(`📡 Connected to: ${supabaseUrl}`);
  console.log(`📋 Account ID: ${accountId}`);
  console.log(`📅 Days to generate: ${DAYS_TO_GENERATE}`);
  console.log(`🗑️  Clear existing: ${shouldClear ? 'Yes' : 'No'}\n`);

  try {
    // Step 1: Verify account exists and fetch venues
    console.log('========================================');
    console.log('STEP 1: Fetching Account & Venues');
    console.log('========================================\n');

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('❌ Account not found:', accountId);
      process.exit(1);
    }

    console.log(`✓ Account: ${account.name}`);

    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name, enable_co_resolving, table_count')
      .eq('account_id', accountId);

    if (venuesError || !venues || venues.length === 0) {
      console.error('❌ No venues found for this account');
      process.exit(1);
    }

    console.log(`✓ Found ${venues.length} venues:`);
    venues.forEach(v => console.log(`   - ${v.name} (${v.id})`));

    // Step 2: Fetch existing employees and questions for each venue
    console.log('\n========================================');
    console.log('STEP 2: Fetching Employees & Questions');
    console.log('========================================\n');

    const venueData = {};

    for (const venue of venues) {
      // Fetch employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, location, is_active')
        .eq('venue_id', venue.id)
        .eq('is_active', true);

      // Fetch questions with conditional_tags
      const { data: questions } = await supabase
        .from('questions')
        .select('id, question, conditional_tags, active')
        .eq('venue_id', venue.id)
        .eq('active', true)
        .order('order');

      venueData[venue.id] = {
        venue,
        employees: employees || [],
        questions: questions || []
      };

      console.log(`📍 ${venue.name}:`);
      console.log(`   - ${employees?.length || 0} active employees`);
      console.log(`   - ${questions?.length || 0} active questions`);

      // Show questions with tags
      if (questions) {
        questions.forEach(q => {
          if (q.conditional_tags?.enabled && q.conditional_tags?.tags?.length > 0) {
            console.log(`   - Q: "${q.question.substring(0, 40)}..." (tags when < ${q.conditional_tags.threshold})`);
          }
        });
      }
    }

    // Step 3: Clear existing data if requested
    if (shouldClear) {
      console.log('\n========================================');
      console.log('STEP 3: Clearing Existing Data');
      console.log('========================================\n');

      const venueIds = venues.map(v => v.id);

      console.log('🗑️  Deleting existing demo data...');

      // Delete in correct order (respecting foreign keys)
      await supabase.from('feedback_tag_responses').delete().in('question_id',
        Object.values(venueData).flatMap(vd => vd.questions.map(q => q.id))
      );
      await supabase.from('nps_submissions').delete().in('venue_id', venueIds);
      await supabase.from('feedback_sessions').delete().in('venue_id', venueIds);
      await supabase.from('assistance_requests').delete().in('venue_id', venueIds);
      await supabase.from('feedback').delete().in('venue_id', venueIds);

      console.log('   ✓ Cleared existing data');
    }

    // Step 4: Generate data
    console.log('\n========================================');
    console.log('STEP 4: Generating Data');
    console.log('========================================\n');

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - DAYS_TO_GENERATE);
    startDate.setHours(0, 0, 0, 0);

    // Calculate NPS improvement per month (random 2-5 points increase)
    // We'll track the month index and apply cumulative improvement
    const totalMonths = Math.ceil(DAYS_TO_GENERATE / 30);
    const monthlyNpsBoosts = [];
    for (let m = 0; m < totalMonths; m++) {
      // Each month gets a random boost of 2-5 points (cumulative)
      const boost = 2 + Math.floor(Math.random() * 4); // 2, 3, 4, or 5
      monthlyNpsBoosts.push(boost);
    }
    console.log(`📈 NPS improvement plan: ${monthlyNpsBoosts.join(' → ')} pts/month (cumulative over ${totalMonths} months)`);

    const allFeedbackSessions = [];
    const allFeedback = [];
    const allTagResponses = []; // Will be populated after feedback insert
    const allNpsSubmissions = [];
    const allAssistanceRequests = [];

    // Track feedback that needs tags (will link after insert)
    const feedbackTagQueue = [];

    for (let venueIndex = 0; venueIndex < venues.length; venueIndex++) {
      const venue = venues[venueIndex];
      const { employees, questions } = venueData[venue.id];

      console.log(`\n📍 Generating data for: ${venue.name}`);

      if (employees.length === 0) {
        console.log('   ⚠️  No employees found, skipping resolution data');
      }

      if (questions.length === 0) {
        console.log('   ⚠️  No questions found, generating feedback without question_id');
      }

      // Vary patterns per venue
      const dailyFeedbackRange = [
        [45, 55],  // Venue 0
        [55, 70],  // Venue 1
        [35, 50],  // Venue 2
      ][venueIndex % 3];

      const resolutionRate = [0.92, 0.88, 0.95][venueIndex % 3];
      const coResolverRate = venue.enable_co_resolving ? [0.15, 0.25, 0.18][venueIndex % 3] : 0;
      const emailCaptureRate = [0.35, 0.42, 0.38][venueIndex % 3]; // % of customers who provide email

      let currentDate = new Date(startDate);
      let feedbackCount = 0;
      let npsLinkedCount = 0;
      let npsStandaloneCount = 0;
      let tagResponseCount = 0;

      while (currentDate <= endDate) {
        // Calculate which month we're in (0 = oldest) and cumulative NPS boost
        const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const monthIndex = Math.floor(daysSinceStart / 30);
        const cumulativeNpsBoost = monthlyNpsBoosts.slice(0, monthIndex + 1).reduce((sum, b) => sum + b, 0);

        const [minFeedback, maxFeedback] = dailyFeedbackRange;
        const feedbackPerDay = minFeedback + Math.floor(Math.random() * (maxFeedback - minFeedback + 1));

        // NPS: Some linked to feedback sessions, some standalone
        const npsLinkedPerDay = Math.floor(feedbackPerDay * emailCaptureRate * 0.8); // 80% of email captures get NPS
        const npsStandalonePerDay = Math.floor(Math.random() * 8) + 5; // 5-12 standalone NPS

        for (let i = 0; i < feedbackPerDay; i++) {
          const timestamp = getRandomTimeInRange(currentDate);
          const tableNumber = Math.floor(Math.random() * (venue.table_count || 20)) + 1;
          const sessionId = uuidv4();

          // Determine if this customer provides email (for NPS linking)
          const providesEmail = i < Math.floor(feedbackPerDay * emailCaptureRate);

          // Create feedback session if customer provides email
          if (providesEmail) {
            allFeedbackSessions.push({
              id: sessionId,
              venue_id: venue.id,
              table_number: tableNumber.toString(),
              started_at: timestamp.toISOString()
            });
          }

          // Generate feedback for each active question
          const questionsToAnswer = questions.length > 0 ? questions : [{ id: null }];

          // Track the session's primary rating (first question's rating) for NPS response rate
          let sessionPrimaryRating = null;

          for (const question of questionsToAnswer) {
            const rating = generateRating(venueIndex);

            // Store the first rating as the session's primary rating
            if (sessionPrimaryRating === null) {
              sessionPrimaryRating = rating;
            }
            const feedbackText = getFeedbackText(rating, employees);

            // Determine resolution
            const daysSinceCreated = Math.ceil((endDate - timestamp) / (1000 * 60 * 60 * 24));
            const resolveChance = Math.min(resolutionRate, daysSinceCreated / 20);
            const shouldResolve = employees.length > 0 && Math.random() < resolveChance;

            const resolver = shouldResolve ? employees[Math.floor(Math.random() * employees.length)] : null;
            const resolutionTime = shouldResolve
              ? new Date(timestamp.getTime() + (3 + Math.floor(Math.random() * 15)) * 60 * 1000)
              : null;

            // Co-resolver (only if main resolver exists and venue has it enabled)
            let coResolver = null;
            if (resolver && employees.length > 1 && Math.random() < coResolverRate) {
              const otherEmployees = employees.filter(e => e.id !== resolver.id);
              coResolver = otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
            }

            const feedbackRecord = {
              venue_id: venue.id,
              question_id: question.id,
              session_id: providesEmail ? sessionId : null,
              rating,
              additional_feedback: feedbackText,
              table_number: tableNumber.toString(),
              created_at: timestamp.toISOString(),
              is_actioned: shouldResolve,
              resolved_by: resolver?.id || null,
              co_resolver_id: coResolver?.id || null,
              resolved_at: resolutionTime?.toISOString() || null,
              resolution_type: shouldResolve
                ? (rating >= 4 ? 'positive_feedback_cleared' : 'staff_resolved')
                : null
            };

            // Check if we need to generate tags for this feedback
            if (question.conditional_tags?.enabled &&
                question.conditional_tags?.tags?.length > 0 &&
                rating < question.conditional_tags.threshold) {

              // Select 1-3 random tags
              const availableTags = question.conditional_tags.tags;
              const numTags = Math.min(1 + Math.floor(Math.random() * 3), availableTags.length);
              const shuffled = [...availableTags].sort(() => Math.random() - 0.5);
              const selectedTags = shuffled.slice(0, numTags);

              // Queue for later (need feedback_id after insert)
              feedbackTagQueue.push({
                feedbackIndex: allFeedback.length,
                question_id: question.id,
                tags: selectedTags
              });

              tagResponseCount += selectedTags.length;
            }

            allFeedback.push(feedbackRecord);
            feedbackCount++;
          }

          // Generate linked NPS (customer provided email during feedback)
          // NPS response rate varies by CSAT rating: 1★=20%, 2★=31%, 3★=42%, 4★=53%, 5★=64%
          if (providesEmail && npsLinkedCount < npsLinkedPerDay * DAYS_TO_GENERATE / (currentDate <= startDate ? 1 : Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24)))) {
            const scheduledSendAt = new Date(timestamp.getTime() + 24 * 60 * 60 * 1000);
            const wasSent = Math.random() < 0.90;
            const sentAt = wasSent ? new Date(scheduledSendAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null;

            // Response rate based on CSAT rating: 1★=20%, 2★=31%, 3★=42%, 4★=53%, 5★=64%
            const npsResponseRateByRating = { 1: 0.20, 2: 0.31, 3: 0.42, 4: 0.53, 5: 0.64 };
            const npsResponseRate = npsResponseRateByRating[sessionPrimaryRating] || 0.42;
            const hasResponse = wasSent && Math.random() < npsResponseRate;

            let score = null;
            let npsFeedback = null;
            let respondedAt = null;

            if (hasResponse) {
              // Use time-based NPS score generation for gradual improvement
              score = generateNpsScore(monthIndex, cumulativeNpsBoost);

              // Select feedback template based on score
              if (score >= 9) {
                npsFeedback = npsFeedbackTemplates.promoter[Math.floor(Math.random() * npsFeedbackTemplates.promoter.length)];
              } else if (score >= 7) {
                npsFeedback = npsFeedbackTemplates.passive[Math.floor(Math.random() * npsFeedbackTemplates.passive.length)];
              } else {
                npsFeedback = npsFeedbackTemplates.detractor[Math.floor(Math.random() * npsFeedbackTemplates.detractor.length)];
              }

              const potentialResponseTime = new Date(sentAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
              // Cap response time to now so we don't have future dates
              respondedAt = potentialResponseTime > endDate ? endDate : potentialResponseTime;
            }

            allNpsSubmissions.push({
              venue_id: venue.id,
              session_id: sessionId,
              customer_email: generateTestEmail(),
              customer_name: firstNames[Math.floor(Math.random() * firstNames.length)],
              scheduled_send_at: scheduledSendAt.toISOString(),
              sent_at: sentAt?.toISOString() || null,
              send_error: wasSent ? null : (Math.random() < 0.3 ? 'Invalid email address' : null),
              score,
              feedback: npsFeedback,
              responded_at: respondedAt?.toISOString() || null,
              created_at: timestamp.toISOString()
            });
            npsLinkedCount++;
          }
        }

        // Generate standalone NPS (customers who didn't leave feedback but got NPS email)
        for (let i = 0; i < npsStandalonePerDay; i++) {
          const visitTime = getRandomTimeInRange(currentDate);
          const scheduledSendAt = new Date(visitTime.getTime() + 24 * 60 * 60 * 1000);
          const wasSent = Math.random() < 0.85;
          const sentAt = wasSent ? new Date(scheduledSendAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null;
          const hasResponse = wasSent && Math.random() < 0.60;

          let score = null;
          let npsFeedback = null;
          let respondedAt = null;

          if (hasResponse) {
            // Use time-based NPS score generation for gradual improvement
            score = generateNpsScore(monthIndex, cumulativeNpsBoost);

            // Select feedback template based on score
            if (score >= 9) {
              npsFeedback = npsFeedbackTemplates.promoter[Math.floor(Math.random() * npsFeedbackTemplates.promoter.length)];
            } else if (score >= 7) {
              npsFeedback = npsFeedbackTemplates.passive[Math.floor(Math.random() * npsFeedbackTemplates.passive.length)];
            } else {
              npsFeedback = npsFeedbackTemplates.detractor[Math.floor(Math.random() * npsFeedbackTemplates.detractor.length)];
            }

            const potentialResponseTime = new Date(sentAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
            // Cap response time to now so we don't have future dates
            respondedAt = potentialResponseTime > endDate ? endDate : potentialResponseTime;
          }

          allNpsSubmissions.push({
            venue_id: venue.id,
            session_id: null, // Standalone - no linked feedback session
            customer_email: generateTestEmail(),
            customer_name: firstNames[Math.floor(Math.random() * firstNames.length)],
            scheduled_send_at: scheduledSendAt.toISOString(),
            sent_at: sentAt?.toISOString() || null,
            send_error: wasSent ? null : (Math.random() < 0.3 ? 'Invalid email address' : null),
            score,
            feedback: npsFeedback,
            responded_at: respondedAt?.toISOString() || null,
            created_at: visitTime.toISOString()
          });
          npsStandaloneCount++;
        }

        // Assistance requests (10% of feedback sessions)
        const assistanceCount = Math.floor(feedbackPerDay * 0.1);
        for (let i = 0; i < assistanceCount; i++) {
          const assistTime = getRandomTimeInRange(currentDate);
          const tableNumber = Math.floor(Math.random() * (venue.table_count || 20)) + 1;
          const isResolved = Math.random() < 0.98;

          const acknowledgedBy = employees.length > 0 && isResolved
            ? employees[Math.floor(Math.random() * employees.length)]
            : null;

          const resolvedBy = employees.length > 0 && isResolved
            ? employees[Math.floor(Math.random() * employees.length)]
            : null;

          const acknowledgedAt = isResolved
            ? new Date(assistTime.getTime() + (1 + Math.floor(Math.random() * 3)) * 60 * 1000)
            : null;

          const resolvedAt = isResolved
            ? new Date(assistTime.getTime() + (3 + Math.floor(Math.random() * 10)) * 60 * 1000)
            : null;

          allAssistanceRequests.push({
            venue_id: venue.id,
            table_number: tableNumber,
            status: isResolved ? 'resolved' : 'pending',
            message: assistanceReasons[Math.floor(Math.random() * assistanceReasons.length)],
            created_at: assistTime.toISOString(),
            acknowledged_at: acknowledgedAt?.toISOString() || null,
            acknowledged_by: acknowledgedBy?.id || null,
            resolved_at: resolvedAt?.toISOString() || null,
            resolved_by: resolvedBy?.id || null,
            notes: isResolved ? 'Request handled' : null
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`   ✓ ${feedbackCount} feedback records`);
      console.log(`   ✓ ${npsLinkedCount} NPS linked to sessions`);
      console.log(`   ✓ ${npsStandaloneCount} standalone NPS`);
      console.log(`   ✓ ${tagResponseCount} tag responses queued`);
    }

    // Step 5: Insert data
    console.log('\n========================================');
    console.log('STEP 5: Inserting Data');
    console.log('========================================');

    // Insert feedback sessions first
    await insertInBatches('feedback_sessions', allFeedbackSessions, 500);

    // Insert feedback and get back IDs
    const insertedFeedback = await insertInBatches('feedback', allFeedback, 500);

    // Now create tag responses with actual feedback IDs
    if (feedbackTagQueue.length > 0 && insertedFeedback.length > 0) {
      console.log('\n🏷️  Processing tag responses...');

      for (const tagEntry of feedbackTagQueue) {
        const feedbackRecord = insertedFeedback[tagEntry.feedbackIndex];
        if (feedbackRecord?.id) {
          for (const tag of tagEntry.tags) {
            allTagResponses.push({
              feedback_id: feedbackRecord.id,
              question_id: tagEntry.question_id,
              tag: tag
            });
          }
        }
      }

      await insertInBatches('feedback_tag_responses', allTagResponses, 500);
    }

    // Insert NPS submissions
    await insertInBatches('nps_submissions', allNpsSubmissions, 500);

    // Insert assistance requests
    await insertInBatches('assistance_requests', allAssistanceRequests, 500);

    // Step 6: Summary
    console.log('\n========================================');
    console.log('✅ Demo Data Generation Complete!');
    console.log('========================================\n');

    // Calculate NPS metrics
    const npsResponses = allNpsSubmissions.filter(s => s.score !== null);
    const promoters = npsResponses.filter(s => s.score >= 9).length;
    const passives = npsResponses.filter(s => s.score >= 7 && s.score <= 8).length;
    const detractors = npsResponses.filter(s => s.score <= 6).length;
    const npsScore = npsResponses.length > 0
      ? Math.round(((promoters - detractors) / npsResponses.length) * 100)
      : 0;

    console.log('📊 Summary:');
    console.log(`   Venues: ${venues.length}`);
    console.log(`   Feedback sessions: ${allFeedbackSessions.length}`);
    console.log(`   Feedback records: ${allFeedback.length}`);
    console.log(`   Tag responses: ${allTagResponses.length}`);
    console.log(`   NPS submissions: ${allNpsSubmissions.length}`);
    console.log(`      - Linked to sessions: ${allNpsSubmissions.filter(n => n.session_id).length}`);
    console.log(`      - Standalone: ${allNpsSubmissions.filter(n => !n.session_id).length}`);
    console.log(`   NPS Score: ${npsScore} (${promoters}P / ${passives}N / ${detractors}D)`);
    console.log(`   Assistance requests: ${allAssistanceRequests.length}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run
main();
