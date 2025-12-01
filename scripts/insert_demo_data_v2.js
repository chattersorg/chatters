#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

// Venue IDs from the SQL file
// Set to just The Dunn Inn for now - can add others back later
const venues = [
  // { id: 'd877bd0b-6522-409f-9192-ca996e1a7f48', name: 'The Lion of Beaconsfield' },
  { id: 'd7683570-11ac-4007-ba95-dcdb4ef6c101', name: 'The Dunn Inn' },
  // { id: 'ba9c45d4-3947-4560-9327-7f00c695d177', name: 'The Fox' }
];

// 14 employees per venue with roles and locations
const employeeTemplates = {
  lion: [
    { first_name: 'James', last_name: 'Smith', role: 'Manager', location: 'Floor Manager' },
    { first_name: 'Lucy', last_name: 'Brown', role: 'Server', location: 'Main Dining' },
    { first_name: 'Poppy', last_name: 'Stanhope', role: 'Waitress', location: 'Main Dining' },
    { first_name: 'Tilly', last_name: 'Wadsworth', role: 'Bartender', location: 'Bar' },
    { first_name: 'Theo', last_name: 'Bannister', role: 'Bartender', location: 'Bar' },
    { first_name: 'Alfie', last_name: 'Cooper', role: 'Waiter', location: 'Patio' },
    { first_name: 'Daisy', last_name: 'Mitchell', role: 'Server', location: 'Patio' },
    { first_name: 'Oscar', last_name: 'Hughes', role: 'Chef', location: 'Kitchen' },
    { first_name: 'Ruby', last_name: 'Harrison', role: 'Sous Chef', location: 'Kitchen' },
    { first_name: 'Archie', last_name: 'Fletcher', role: 'Kitchen Porter', location: 'Kitchen' },
    { first_name: 'Freya', last_name: 'Barnes', role: 'Host', location: 'Front of House' },
    { first_name: 'Leo', last_name: 'Richardson', role: 'Busser', location: 'Main Dining' },
    { first_name: 'Lily', last_name: 'Edwards', role: 'Server', location: 'Main Dining' },
    { first_name: 'Noah', last_name: 'Murphy', role: 'Bartender', location: 'Bar' }
  ],
  dunn: [
    { first_name: 'Emma', last_name: 'Johnson', role: 'Manager', location: 'Floor Manager' },
    { first_name: 'Oliver', last_name: 'Davies', role: 'Server', location: 'Main Dining' },
    { first_name: 'Sophie', last_name: 'Williams', role: 'Waitress', location: 'Main Dining' },
    { first_name: 'Jack', last_name: 'Taylor', role: 'Bartender', location: 'Bar' },
    { first_name: 'Mia', last_name: 'Anderson', role: 'Server', location: 'Garden Area' },
    { first_name: 'Thomas', last_name: 'Walker', role: 'Waiter', location: 'Garden Area' },
    { first_name: 'Jessica', last_name: 'Bennett', role: 'Bartender', location: 'Bar' },
    { first_name: 'William', last_name: 'Foster', role: 'Chef', location: 'Kitchen' },
    { first_name: 'Emily', last_name: 'Parker', role: 'Sous Chef', location: 'Kitchen' },
    { first_name: 'Joshua', last_name: 'Reed', role: 'Kitchen Porter', location: 'Kitchen' },
    { first_name: 'Chloe', last_name: 'Morgan', role: 'Host', location: 'Front of House' },
    { first_name: 'Ethan', last_name: 'Collins', role: 'Busser', location: 'Main Dining' },
    { first_name: 'Grace', last_name: 'Powell', role: 'Server', location: 'Main Dining' },
    { first_name: 'Daniel', last_name: 'Price', role: 'Bartender', location: 'Bar' }
  ],
  fox: [
    { first_name: 'Harry', last_name: 'Wilson', role: 'Manager', location: 'Floor Manager' },
    { first_name: 'Amelia', last_name: 'Thomas', role: 'Server', location: 'Main Dining' },
    { first_name: 'Charlie', last_name: 'Roberts', role: 'Waiter', location: 'Main Dining' },
    { first_name: 'Isla', last_name: 'Moore', role: 'Bartender', location: 'Bar' },
    { first_name: 'George', last_name: 'White', role: 'Server', location: 'Beer Garden' },
    { first_name: 'Florence', last_name: 'Scott', role: 'Waitress', location: 'Beer Garden' },
    { first_name: 'Jacob', last_name: 'Green', role: 'Bartender', location: 'Bar' },
    { first_name: 'Evie', last_name: 'Adams', role: 'Chef', location: 'Kitchen' },
    { first_name: 'Max', last_name: 'Campbell', role: 'Sous Chef', location: 'Kitchen' },
    { first_name: 'Ava', last_name: 'Bailey', role: 'Kitchen Porter', location: 'Kitchen' },
    { first_name: 'Lucas', last_name: 'Ward', role: 'Host', location: 'Front of House' },
    { first_name: 'Ella', last_name: 'Cox', role: 'Busser', location: 'Main Dining' },
    { first_name: 'Henry', last_name: 'Russell', role: 'Server', location: 'Main Dining' },
    { first_name: 'Scarlett', last_name: 'Chapman', role: 'Bartender', location: 'Bar' }
  ]
};

// Generate random feedback text
const feedbackTemplates = {
  positive: [
    "Absolutely fantastic experience! The food was delicious and the service was top-notch.",
    "Had a wonderful time here. Great atmosphere and friendly staff.",
    "Excellent meal, everything was perfect. Highly recommend!",
    "Best pub food I've had in ages. Will definitely be back!",
    "Lovely venue, great drinks selection, and the staff were amazing.",
    "Perfect spot for a Sunday roast. Everything was cooked to perfection.",
    "Really enjoyed our visit. The {staff_name} was particularly helpful.",
    "Great value for money and the portions were generous.",
    "Beautiful setting and the food exceeded expectations.",
    "Couldn't fault anything. From start to finish, it was brilliant."
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
  'Allergy question', 'High chair request'
];

// Insert data in batches
async function insertInBatches(tableName, data, batchSize = 500) {
  console.log(`\n💾 Inserting ${data.length} records into ${tableName}...`);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).insert(batch);

    if (error) {
      console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      console.error('   First record in failed batch:', JSON.stringify(batch[0], null, 2));
    } else {
      console.log(`   ✓ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} (${batch.length} records)`);
    }
  }
}

// Generate comprehensive feedback for a date range
async function generateFeedbackData(employeesByVenue) {
  console.log('\n🎲 Generating comprehensive feedback data...\n');

  // Use last 60 days ending today
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 60);
  startDate.setHours(10, 0, 0, 0);

  const allFeedback = [];
  const allAssistance = [];

  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  console.log(`   Generating data for ${daysDiff} days across ${venues.length} venues`);

  for (const venue of venues) {
    console.log(`\n   📍 ${venue.name}`);

    const employees = employeesByVenue[venue.id];
    console.log(`   ✓ Using ${employees.length} employees`);

    // Generate feedback for each day
    let currentDate = new Date(startDate);
    let dayCount = 0;

    while (currentDate <= endDate) {
      const responsesPerDay = Math.floor(Math.random() * 26) + 45; // 45-70 responses
      dayCount++;

      for (let i = 0; i < responsesPerDay; i++) {
        // Random time during the day (10am - 11pm)
        const responseTime = new Date(currentDate);
        responseTime.setHours(10 + Math.floor(Math.random() * 13));
        responseTime.setMinutes(Math.floor(Math.random() * 60));
        responseTime.setSeconds(Math.floor(Math.random() * 60));

        // Determine sentiment (70% positive, 20% neutral, 10% negative)
        const rand = Math.random();
        let sentiment, rating, templates;

        if (rand < 0.7) {
          sentiment = 'positive';
          rating = Math.random() < 0.5 ? 5 : 4;
          templates = feedbackTemplates.positive;
        } else if (rand < 0.9) {
          sentiment = 'neutral';
          rating = 3;
          templates = feedbackTemplates.neutral;
        } else {
          sentiment = 'negative';
          rating = Math.random() < 0.5 ? 1 : 2;
          templates = feedbackTemplates.negative;
        }

        // Random table number
        const tableNumber = Math.floor(Math.random() * 20) + 1;

        // Select random feedback template
        let feedbackText = templates[Math.floor(Math.random() * templates.length)];

        // Replace {staff_name} if present
        if (feedbackText.includes('{staff_name}')) {
          const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
          feedbackText = feedbackText.replace('{staff_name}', randomEmployee.first_name);
        }

        // Determine if feedback should be resolved (older feedback more likely to be resolved)
        const daysSinceCreated = Math.ceil((endDate - responseTime) / (1000 * 60 * 60 * 24));
        const resolveChance = Math.min(0.95, daysSinceCreated / 30); // Up to 95% resolved for older feedback
        const shouldResolve = Math.random() < resolveChance;

        // Select random staff member for resolution
        const resolvingStaff = employees[Math.floor(Math.random() * employees.length)];

        // Resolution happens 5-60 minutes after feedback
        const resolutionTime = new Date(responseTime.getTime() + (5 + Math.floor(Math.random() * 55)) * 60 * 1000);

        // Create feedback record
        const feedback = {
          venue_id: venue.id,
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

        // 10% chance of assistance request
        if (Math.random() < 0.1) {
          const assistanceTime = new Date(responseTime.getTime() - Math.random() * 30 * 60 * 1000);
          const assistanceResolved = Math.random() < 0.98; // 98% assistance requests resolved

          let assistResolvedAt = null;
          let assistResolvedBy = null;

          if (assistanceResolved) {
            const assistMinutes = Math.floor(Math.random() * 5) + 1; // 1-5 minutes
            assistResolvedAt = new Date(assistanceTime.getTime() + assistMinutes * 60 * 1000);
            assistResolvedBy = employees[Math.floor(Math.random() * employees.length)].id;
          }

          const assistance = {
            venue_id: venue.id,
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

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`   ✓ Generated ${dayCount} days of feedback`);
  }

  console.log(`\n   📊 Total feedback records: ${allFeedback.length}`);
  console.log(`   📊 Total assistance requests: ${allAssistance.length}`);

  return { feedback: allFeedback, assistance: allAssistance };
}

// Generate historical ratings data for Google and TripAdvisor
function generateHistoricalRatings() {
  console.log('\n📈 Generating historical ratings data...\n');

  // Use last 60 days ending today
  const endDate = new Date();
  endDate.setHours(10, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 60);

  const allHistoricalRatings = [];
  const allExternalRatings = [];

  for (const venue of venues) {
    console.log(`   📍 ${venue.name}`);

    let currentDate = new Date(startDate);
    let tripAdvisorRating = 4.0;
    let tripAdvisorCount = Math.floor(Math.random() * 30) + 75; // Start between 75-105 reviews
    let googleRating = 3.8;
    let googleCount = Math.floor(Math.random() * 50) + 130; // Start between 130-180 reviews

    let isFirst = true;

    while (currentDate <= endDate) {
      // TripAdvisor rating progression: 4.0 → 4.76 over 2 months
      allHistoricalRatings.push({
        venue_id: venue.id,
        source: 'tripadvisor',
        rating: parseFloat(tripAdvisorRating.toFixed(2)),
        ratings_count: tripAdvisorCount,
        is_initial: isFirst,
        recorded_at: currentDate.toISOString()
      });

      // Google rating progression: 3.8 → 4.42 over 2 months
      allHistoricalRatings.push({
        venue_id: venue.id,
        source: 'google',
        rating: parseFloat(googleRating.toFixed(2)),
        ratings_count: googleCount,
        is_initial: isFirst,
        recorded_at: currentDate.toISOString()
      });

      isFirst = false;

      // Increment ratings
      tripAdvisorRating += 0.013;
      tripAdvisorCount += Math.floor(Math.random() * 3) + 1;
      googleRating += 0.008;
      googleCount += Math.floor(Math.random() * 4) + 2;

      // Move to next recording (every 2 days)
      currentDate.setDate(currentDate.getDate() + 2);
    }

    // Cap ratings at reasonable maximums
    const finalTripAdvisor = Math.min(tripAdvisorRating, 4.76);
    const finalGoogle = Math.min(googleRating, 4.42);

    // Insert current external ratings
    allExternalRatings.push({
      venue_id: venue.id,
      source: 'tripadvisor',
      rating: parseFloat(finalTripAdvisor.toFixed(2)),
      ratings_count: tripAdvisorCount,
      fetched_at: new Date().toISOString()
    });

    allExternalRatings.push({
      venue_id: venue.id,
      source: 'google',
      rating: parseFloat(finalGoogle.toFixed(2)),
      ratings_count: googleCount,
      fetched_at: new Date().toISOString()
    });

    console.log(`   ✓ TripAdvisor: 4.0 → ${finalTripAdvisor.toFixed(2)} (${tripAdvisorCount} reviews)`);
    console.log(`   ✓ Google: 3.8 → ${finalGoogle.toFixed(2)} (${googleCount} reviews)`);
  }

  return { historicalRatings: allHistoricalRatings, externalRatings: allExternalRatings };
}

// Generate NPS submission data
function generateNPSData() {
  console.log('\n📧 Generating NPS submission data...\n');

  // Use last 60 days ending today
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 60);
  startDate.setHours(10, 0, 0, 0);

  const allNPSSubmissions = [];

  // Generate realistic customer emails
  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'James', 'Sophie', 'David', 'Emily', 'Tom', 'Lucy', 'Alex', 'Kate', 'Ben', 'Anna', 'Matt', 'Lisa', 'Chris', 'Rachel', 'Dan', 'Claire'];
  const lastNames = ['Smith', 'Jones', 'Brown', 'Wilson', 'Taylor', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Johnson', 'Walker', 'Wright', 'Robinson', 'Thompson', 'White', 'Hughes', 'Edwards', 'Green', 'Hall', 'Wood'];
  const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.co.uk', 'hotmail.com', 'icloud.com'];

  for (const venue of venues) {
    console.log(`   📍 ${venue.name}`);

    let currentDate = new Date(startDate);
    let npsCount = 0;

    while (currentDate <= endDate) {
      // Generate 15-25 NPS submissions per day per venue (less than feedback)
      const npsPerDay = Math.floor(Math.random() * 11) + 15;

      for (let i = 0; i < npsPerDay; i++) {
        // Random time during the day
        const visitTime = new Date(currentDate);
        visitTime.setHours(10 + Math.floor(Math.random() * 13));
        visitTime.setMinutes(Math.floor(Math.random() * 60));

        // Generate unique customer email
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`;

        // Schedule email 24 hours after visit
        const scheduledSendAt = new Date(visitTime.getTime() + 24 * 60 * 60 * 1000);

        // 85% of emails are sent
        const wasSent = Math.random() < 0.85;
        const sentAt = wasSent ? new Date(scheduledSendAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null;

        // 65% of sent emails get a response
        const hasResponse = wasSent && Math.random() < 0.65;

        let score = null;
        let respondedAt = null;

        if (hasResponse) {
          // Generate realistic NPS distribution
          // 50% promoters (9-10), 30% passives (7-8), 20% detractors (0-6)
          const rand = Math.random();
          if (rand < 0.5) {
            // Promoters
            score = Math.random() < 0.6 ? 10 : 9;
          } else if (rand < 0.8) {
            // Passives
            score = Math.random() < 0.5 ? 8 : 7;
          } else {
            // Detractors
            score = Math.floor(Math.random() * 7); // 0-6
          }

          // Response time: 1 hour to 3 days after email sent
          const responseDelay = Math.random() * 3 * 24 * 60 * 60 * 1000; // Up to 3 days
          respondedAt = new Date(sentAt.getTime() + responseDelay);
        }

        const npsSubmission = {
          venue_id: venue.id,
          customer_email: email,
          scheduled_send_at: scheduledSendAt.toISOString(),
          sent_at: sentAt ? sentAt.toISOString() : null,
          send_error: wasSent ? null : (Math.random() < 0.3 ? 'Invalid email address' : null),
          score: score,
          responded_at: respondedAt ? respondedAt.toISOString() : null,
          created_at: visitTime.toISOString()
        };

        allNPSSubmissions.push(npsSubmission);
        npsCount++;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`   ✓ Generated ${npsCount} NPS submissions`);
  }

  // Calculate overall NPS metrics
  const responses = allNPSSubmissions.filter(s => s.score !== null);
  const promoters = responses.filter(s => s.score >= 9).length;
  const passives = responses.filter(s => s.score >= 7 && s.score <= 8).length;
  const detractors = responses.filter(s => s.score <= 6).length;
  const npsScore = responses.length > 0 ? Math.round(((promoters - detractors) / responses.length) * 100) : 0;

  console.log(`\n   📊 Total NPS submissions: ${allNPSSubmissions.length}`);
  console.log(`   📊 Responses: ${responses.length} (${Math.round(responses.length / allNPSSubmissions.length * 100)}% response rate)`);
  console.log(`   📊 NPS Score: ${npsScore}`);
  console.log(`   📊 Promoters: ${promoters} | Passives: ${passives} | Detractors: ${detractors}`);

  return allNPSSubmissions;
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive demo data insertion...\n');
  console.log(`📡 Connected to: ${supabaseUrl}\n`);

  try {
    // Step 1: Clear existing data
    console.log('========================================');
    console.log('STEP 1: Clearing Existing Data');
    console.log('========================================');

    console.log('\n🗑️  Clearing existing demo data...');

    const venueIds = venues.map(v => v.id);

    // Delete in correct order (respecting foreign keys)
    await supabase.from('nps_submissions').delete().in('venue_id', venueIds);
    await supabase.from('assistance_requests').delete().in('venue_id', venueIds);
    await supabase.from('feedback').delete().in('venue_id', venueIds);
    await supabase.from('external_ratings').delete().in('venue_id', venueIds);
    await supabase.from('historical_ratings').delete().in('venue_id', venueIds);
    await supabase.from('employees').delete().in('venue_id', venueIds);

    console.log('   ✓ Cleared existing data');

    // Step 2: Insert employees
    console.log('\n========================================');
    console.log('STEP 2: Inserting Employees');
    console.log('========================================');

    console.log('\n👥 Inserting 14 employees per venue...');

    const employeeData = [];
    const employeesByVenue = {};

    // Generate employee data for each venue
    const venueTemplateMap = {
      'd877bd0b-6522-409f-9192-ca996e1a7f48': { template: employeeTemplates.lion, domain: 'thelion.uk' },
      'd7683570-11ac-4007-ba95-dcdb4ef6c101': { template: employeeTemplates.dunn, domain: 'dunninn.uk' },
      'ba9c45d4-3947-4560-9327-7f00c695d177': { template: employeeTemplates.fox, domain: 'thefox.uk' }
    };

    venues.forEach((venue) => {
      const { template, domain } = venueTemplateMap[venue.id];

      template.forEach((emp, empIndex) => {
        const employee = {
          venue_id: venue.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          role: emp.role,
          email: `${emp.first_name.toLowerCase()}.${emp.last_name.toLowerCase()}@${domain}`
          // Note: location field will be added if it exists in schema
        };

        // Check if location field should be included (comment out if not in schema)
        if (emp.location) {
          employee.location = emp.location;
        }
        employeeData.push(employee);
      });
    });

    const { error: employeeError } = await supabase.from('employees').insert(employeeData);
    if (employeeError) {
      console.error('   ❌ Error inserting employees:', employeeError.message);
      throw employeeError;
    } else {
      console.log(`   ✓ Inserted ${employeeData.length} employees (${employeeData.length / 3} per venue)`);
    }

    // Fetch inserted employees
    for (const venue of venues) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, location')
        .eq('venue_id', venue.id);

      employeesByVenue[venue.id] = employees;
      console.log(`   ✓ ${venue.name}: ${employees.length} employees loaded`);
    }

    // Step 3: Insert historical ratings
    console.log('\n========================================');
    console.log('STEP 3: Inserting Historical Ratings');
    console.log('========================================');

    const { historicalRatings, externalRatings } = generateHistoricalRatings();

    await insertInBatches('historical_ratings', historicalRatings, 500);
    await insertInBatches('external_ratings', externalRatings, 10);

    // Step 4: Generate and insert feedback data
    console.log('\n========================================');
    console.log('STEP 4: Generating Feedback Data');
    console.log('========================================');

    const { feedback, assistance } = await generateFeedbackData(employeesByVenue);

    // Step 5: Insert feedback and assistance
    console.log('\n========================================');
    console.log('STEP 5: Inserting Feedback & Assistance');
    console.log('========================================');

    await insertInBatches('feedback', feedback, 500);
    await insertInBatches('assistance_requests', assistance, 500);

    // Step 6: Generate and insert NPS data
    console.log('\n========================================');
    console.log('STEP 6: Generating NPS Data');
    console.log('========================================');

    const npsSubmissions = generateNPSData();

    // Step 7: Insert NPS submissions
    console.log('\n========================================');
    console.log('STEP 7: Inserting NPS Submissions');
    console.log('========================================');

    await insertInBatches('nps_submissions', npsSubmissions, 500);

    console.log('\n✅ Demo data insertion complete!\n');
    console.log('==========================================');
    console.log('Summary:');
    console.log('==========================================');
    console.log(`✓ ${employeeData.length} employees (14 per venue)`);
    console.log(`✓ ${historicalRatings.length} historical rating records`);
    console.log(`✓ ${externalRatings.length} current external ratings`);
    console.log(`✓ ${feedback.length} feedback sessions`);
    console.log(`✓ ${assistance.length} assistance requests`);
    console.log(`✓ ${npsSubmissions.length} NPS submissions`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
