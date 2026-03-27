import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    null, null, null
  ],
  neutral: [
    "Nice place, food was good. Service could be a bit faster.",
    "Decent experience overall. Would come back.",
    "Good atmosphere, standard pub fare. Nothing special but nothing bad.",
    "Solid meal, reasonably priced. Busy but that's expected.",
    "Pleasant enough. The food was okay, maybe a bit hit and miss.",
    "Average experience. Food was fine, service was okay.",
    null, null
  ],
  negative: [
    "Disappointing experience. Food took ages to arrive and wasn't even hot.",
    "Not impressed. The service was slow and the food was mediocre.",
    "Expected better. The place was busy and staff seemed rushed.",
    "Overpriced for what you get. Won't be rushing back.",
    "Food was cold when it arrived. Had to send it back.",
    "Waited 45 minutes for our food, then it was wrong order.",
    null
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
    null, null
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

const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'James', 'Sophie', 'David', 'Emily', 'Tom', 'Lucy', 'Alex', 'Kate', 'Ben', 'Anna', 'Matt', 'Lisa', 'Chris', 'Rachel', 'Dan', 'Claire', 'Oliver', 'Amelia', 'Harry', 'Isla', 'George', 'Mia', 'Jack', 'Ava', 'Jacob', 'Charlotte'];

// Helper functions
function generateRating(venueIndex = 0) {
  const distributions = [
    { p5: 0.35, p4: 0.35, p3: 0.20, p2: 0.07, p1: 0.03 },
    { p5: 0.30, p4: 0.30, p3: 0.25, p2: 0.10, p1: 0.05 },
    { p5: 0.40, p4: 0.38, p3: 0.15, p2: 0.05, p1: 0.02 },
  ];

  const dist = distributions[venueIndex % distributions.length];
  const rand = Math.random();

  if (rand < dist.p5) return 5;
  if (rand < dist.p5 + dist.p4) return 4;
  if (rand < dist.p5 + dist.p4 + dist.p3) return 3;
  if (rand < dist.p5 + dist.p4 + dist.p3 + dist.p2) return 2;
  return 1;
}

function getFeedbackText(rating, employees) {
  let templates;
  if (rating >= 4) templates = feedbackTemplates.positive;
  else if (rating === 3) templates = feedbackTemplates.neutral;
  else templates = feedbackTemplates.negative;

  let text = templates[Math.floor(Math.random() * templates.length)];

  if (text && text.includes('{staff_name}') && employees.length > 0) {
    const emp = employees[Math.floor(Math.random() * employees.length)];
    text = text.replace('{staff_name}', emp.first_name);
  }

  return text;
}

function getRandomTimeInRange(date) {
  const result = new Date(date);
  const hour = 10 + Math.floor(Math.random() * 13);
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  result.setHours(hour, minute, second, 0);
  return result;
}

function generateTestEmail() {
  const random = Math.random().toString(36).substring(2, 8);
  return `demo-cust-${random}@example.com`;
}

// Generate NPS score with gradual improvement over time
function generateNpsScore(monthIndex, cumulativeBoost) {
  const boostFactor = cumulativeBoost / 100;
  const promoterProb = Math.min(0.70, 0.50 + boostFactor * 0.5);
  const detractorProb = Math.max(0.05, 0.20 - boostFactor * 0.5);
  const passiveProb = 1 - promoterProb - detractorProb;

  const rand = Math.random();

  if (rand < promoterProb) {
    return Math.random() < 0.6 ? 10 : 9;
  } else if (rand < promoterProb + passiveProb) {
    return Math.random() < 0.5 ? 8 : 7;
  } else {
    return Math.floor(Math.random() * 7);
  }
}

async function insertInBatches(supabase, tableName, data, batchSize = 500) {
  if (data.length === 0) return [];

  const insertedData = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { data: inserted, error } = await supabase.from(tableName).insert(batch).select();

    if (error) {
      console.error(`Error inserting into ${tableName}:`, error.message);
    } else if (inserted) {
      insertedData.push(...inserted);
    }
  }

  return insertedData;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accountId, days: daysInput = 60, clearExisting = true } = req.body;
  const days = parseInt(daysInput, 10) || 60;

  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  console.log(`Generating demo data: accountId=${accountId}, days=${days}, clearExisting=${clearExisting}`);

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Verify account exists and fetch venues
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name, enable_co_resolving, table_count')
      .eq('account_id', accountId);

    if (venuesError || !venues || venues.length === 0) {
      return res.status(404).json({ error: 'No venues found for this account' });
    }

    // Fetch employees and questions for each venue
    const venueData = {};

    for (const venue of venues) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, location, is_active')
        .eq('venue_id', venue.id)
        .eq('is_active', true);

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
    }

    // Clear existing data if requested
    if (clearExisting) {
      const venueIds = venues.map(v => v.id);

      await supabase.from('feedback_tag_responses').delete().in('question_id',
        Object.values(venueData).flatMap(vd => vd.questions.map(q => q.id))
      );
      await supabase.from('nps_submissions').delete().in('venue_id', venueIds);
      await supabase.from('feedback_sessions').delete().in('venue_id', venueIds);
      await supabase.from('assistance_requests').delete().in('venue_id', venueIds);
      await supabase.from('feedback').delete().in('venue_id', venueIds);
    }

    // Generate data
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Calculate NPS improvement per month (random 2-5 points increase)
    const totalMonths = Math.ceil(days / 30);
    const monthlyNpsBoosts = [];
    for (let m = 0; m < totalMonths; m++) {
      const boost = 2 + Math.floor(Math.random() * 4);
      monthlyNpsBoosts.push(boost);
    }

    const allFeedbackSessions = [];
    const allFeedback = [];
    const allNpsSubmissions = [];
    const allAssistanceRequests = [];
    const feedbackTagQueue = [];

    for (let venueIndex = 0; venueIndex < venues.length; venueIndex++) {
      const venue = venues[venueIndex];
      const { employees, questions } = venueData[venue.id];

      const dailyFeedbackRange = [
        [45, 55],
        [55, 70],
        [35, 50],
      ][venueIndex % 3];

      const resolutionRate = [0.92, 0.88, 0.95][venueIndex % 3];
      const coResolverRate = venue.enable_co_resolving ? [0.15, 0.25, 0.18][venueIndex % 3] : 0;
      const emailCaptureRate = [0.35, 0.42, 0.38][venueIndex % 3];

      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const monthIndex = Math.floor(daysSinceStart / 30);
        const cumulativeNpsBoost = monthlyNpsBoosts.slice(0, monthIndex + 1).reduce((sum, b) => sum + b, 0);

        const [minFeedback, maxFeedback] = dailyFeedbackRange;
        const feedbackPerDay = minFeedback + Math.floor(Math.random() * (maxFeedback - minFeedback + 1));
        const npsStandalonePerDay = Math.floor(Math.random() * 8) + 5;

        for (let i = 0; i < feedbackPerDay; i++) {
          const timestamp = getRandomTimeInRange(currentDate);
          const tableNumber = Math.floor(Math.random() * (venue.table_count || 20)) + 1;
          const sessionId = uuidv4();
          const providesEmail = i < Math.floor(feedbackPerDay * emailCaptureRate);

          if (providesEmail) {
            allFeedbackSessions.push({
              id: sessionId,
              venue_id: venue.id,
              table_number: tableNumber.toString(),
              started_at: timestamp.toISOString()
            });
          }

          const questionsToAnswer = questions.length > 0 ? questions : [{ id: null }];
          let sessionPrimaryRating = null;

          for (const question of questionsToAnswer) {
            const rating = generateRating(venueIndex);
            if (sessionPrimaryRating === null) sessionPrimaryRating = rating;

            const feedbackText = getFeedbackText(rating, employees);
            const daysSinceCreated = Math.ceil((endDate - timestamp) / (1000 * 60 * 60 * 24));
            const resolveChance = Math.min(resolutionRate, daysSinceCreated / 20);
            const shouldResolve = employees.length > 0 && Math.random() < resolveChance;

            const resolver = shouldResolve ? employees[Math.floor(Math.random() * employees.length)] : null;
            const resolutionTime = shouldResolve
              ? new Date(timestamp.getTime() + (3 + Math.floor(Math.random() * 15)) * 60 * 1000)
              : null;

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

            if (question.conditional_tags?.enabled &&
                question.conditional_tags?.tags?.length > 0 &&
                rating < question.conditional_tags.threshold) {
              const availableTags = question.conditional_tags.tags;
              const numTags = Math.min(1 + Math.floor(Math.random() * 3), availableTags.length);
              const shuffled = [...availableTags].sort(() => Math.random() - 0.5);
              const selectedTags = shuffled.slice(0, numTags);

              feedbackTagQueue.push({
                feedbackIndex: allFeedback.length,
                question_id: question.id,
                tags: selectedTags
              });
            }

            allFeedback.push(feedbackRecord);
          }

          // Generate linked NPS
          if (providesEmail) {
            const scheduledSendAt = new Date(timestamp.getTime() + 24 * 60 * 60 * 1000);
            const wasSent = Math.random() < 0.90;
            const sentAt = wasSent ? new Date(scheduledSendAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null;

            const npsResponseRateByRating = { 1: 0.20, 2: 0.31, 3: 0.42, 4: 0.53, 5: 0.64 };
            const npsResponseRate = npsResponseRateByRating[sessionPrimaryRating] || 0.42;
            const hasResponse = wasSent && Math.random() < npsResponseRate;

            let score = null;
            let npsFeedback = null;
            let respondedAt = null;

            if (hasResponse) {
              score = generateNpsScore(monthIndex, cumulativeNpsBoost);

              if (score >= 9) {
                npsFeedback = npsFeedbackTemplates.promoter[Math.floor(Math.random() * npsFeedbackTemplates.promoter.length)];
              } else if (score >= 7) {
                npsFeedback = npsFeedbackTemplates.passive[Math.floor(Math.random() * npsFeedbackTemplates.passive.length)];
              } else {
                npsFeedback = npsFeedbackTemplates.detractor[Math.floor(Math.random() * npsFeedbackTemplates.detractor.length)];
              }

              const potentialResponseTime = new Date(sentAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
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
          }
        }

        // Generate standalone NPS
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
            score = generateNpsScore(monthIndex, cumulativeNpsBoost);

            if (score >= 9) {
              npsFeedback = npsFeedbackTemplates.promoter[Math.floor(Math.random() * npsFeedbackTemplates.promoter.length)];
            } else if (score >= 7) {
              npsFeedback = npsFeedbackTemplates.passive[Math.floor(Math.random() * npsFeedbackTemplates.passive.length)];
            } else {
              npsFeedback = npsFeedbackTemplates.detractor[Math.floor(Math.random() * npsFeedbackTemplates.detractor.length)];
            }

            const potentialResponseTime = new Date(sentAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
            respondedAt = potentialResponseTime > endDate ? endDate : potentialResponseTime;
          }

          allNpsSubmissions.push({
            venue_id: venue.id,
            session_id: null,
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
        }

        // Assistance requests
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
    }

    // Insert data
    await insertInBatches(supabase, 'feedback_sessions', allFeedbackSessions, 500);
    const insertedFeedback = await insertInBatches(supabase, 'feedback', allFeedback, 500);

    // Create tag responses with actual feedback IDs
    const allTagResponses = [];
    if (feedbackTagQueue.length > 0 && insertedFeedback.length > 0) {
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
      await insertInBatches(supabase, 'feedback_tag_responses', allTagResponses, 500);
    }

    await insertInBatches(supabase, 'nps_submissions', allNpsSubmissions, 500);
    await insertInBatches(supabase, 'assistance_requests', allAssistanceRequests, 500);

    // Calculate NPS score for summary
    const npsResponses = allNpsSubmissions.filter(s => s.score !== null);
    const promoters = npsResponses.filter(s => s.score >= 9).length;
    const detractors = npsResponses.filter(s => s.score <= 6).length;
    const npsScore = npsResponses.length > 0
      ? Math.round(((promoters - detractors) / npsResponses.length) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      summary: {
        account: account.name,
        days,
        venues: venues.length,
        feedbackSessions: allFeedbackSessions.length,
        feedbackRecords: allFeedback.length,
        tagResponses: allTagResponses.length,
        npsSubmissions: allNpsSubmissions.length,
        npsLinked: allNpsSubmissions.filter(n => n.session_id).length,
        npsStandalone: allNpsSubmissions.filter(n => !n.session_id).length,
        npsScore,
        assistanceRequests: allAssistanceRequests.length,
        npsImprovementPlan: monthlyNpsBoosts
      }
    });

  } catch (error) {
    console.error('Error generating demo data:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate demo data' });
  }
}
