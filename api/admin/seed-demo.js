// /api/admin/seed-demo.js
// Seeds demo data for a specific venue (feedback, reviews, scores) with date range support
// OPTIMIZED with batch inserts to prevent timeouts
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Demo data generators
const CUSTOMER_NAMES = [
  'Sarah Johnson', 'Michael Chen', 'Emma Williams', 'James Taylor', 'Olivia Brown',
  'David Martinez', 'Sophia Anderson', 'Robert Wilson', 'Isabella Garcia', 'William Lee',
  'Ava Rodriguez', 'John Davis', 'Mia Hernandez', 'Richard Lopez', 'Charlotte Moore',
  'Thomas White', 'Amelia Harris', 'Daniel Clark', 'Emily Lewis', 'Matthew Walker'
];

const POSITIVE_COMMENTS = [
  'Excellent service, the staff were very attentive!',
  'Food was absolutely delicious, will definitely come back.',
  'Amazing atmosphere and great cocktails.',
  'Our server was fantastic, very knowledgeable about the menu.',
  'Best meal we\'ve had in ages, highly recommend!',
  'Quick service and wonderful presentation.',
  'The ambiance is perfect for a special occasion.',
  'Staff went above and beyond to accommodate our dietary needs.',
  'Incredible flavors, chef really knows what they\'re doing.',
  'Perfectly cooked steak and the sides were delicious.',
  'Everything was fresh and beautifully plated.',
  'The attention to detail was impressive.',
  'Lovely spot, great for date night!',
  'Best Sunday roast in town!'
];

const NEUTRAL_COMMENTS = [
  'Food was good, service was okay.',
  'Average experience, nothing special but not bad.',
  'Decent meal, a bit pricey for what you get.',
  'Nice location but the menu is limited.',
  'Food came out fairly quickly.',
  'Standard restaurant experience.',
  'The portions were reasonable.'
];

const NEGATIVE_COMMENTS = [
  'Service was quite slow, waited 20 minutes for drinks.',
  'Food was cold when it arrived at our table.',
  'Our order was incorrect and took ages to fix.',
  'Music was too loud, couldn\'t have a conversation.',
  'The bathroom was not clean.',
  'Expected better quality for the price.',
  'Staff seemed overwhelmed and stressed.',
  'Table was sticky and hadn\'t been cleaned properly.',
  'Had to ask three times for water.',
  'Waited over an hour for our mains.'
];

const GOOGLE_REVIEW_TEXTS = {
  5: [
    'Outstanding experience from start to finish! The food was exceptional and the service was impeccable. Our waiter remembered our preferences from previous visits. Highly recommended for any special occasion.',
    'Absolutely love this place! Been coming here for years and it never disappoints. The consistency in quality is remarkable.',
    'Best restaurant in the area! Fresh ingredients, creative dishes, and wonderful staff. The chef clearly puts thought into every plate.',
    'Fantastic meal! Every course was perfection. The sommelier helped us pick the perfect wine pairing.',
    'Can\'t fault this place - amazing food, great service, lovely atmosphere. Will be back very soon!'
  ],
  4: [
    'Really enjoyed our meal here. The atmosphere is lovely and the food was very good. Only minor issue was the wait time, but worth it.',
    'Great food and nice ambiance. Service was friendly and efficient. Would definitely return.',
    'Solid choice for dinner. Menu has good variety and everything we tried was tasty.',
    'Very pleasant evening. Food was delicious and staff were attentive. Slightly pricey but worth it.',
    'Good experience overall. The steak was cooked perfectly and sides were excellent.'
  ],
  3: [
    'Decent restaurant, nothing particularly special. Food was okay but overpriced for what you get.',
    'Mixed experience - some dishes were great, others were just average. Service could be more attentive.',
    'It\'s fine for a casual meal but wouldn\'t go out of my way to come here again.',
    'Average food, average service. Nothing wrong with it, just nothing memorable either.',
    'Okay for what it is. Menu could use more variety.'
  ],
  2: [
    'Disappointed with the quality. Service was slow and food arrived lukewarm. Expected much better based on the reviews.',
    'Overpriced and underwhelming. The steak was overcooked and the vegetables were bland.',
    'Not a great experience. Long wait times and the staff seemed disorganized.',
    'Food quality has gone downhill. Used to be much better.'
  ],
  1: [
    'Very poor experience. Had to wait 45 minutes for our food and when it arrived, it was cold. Manager was unhelpful.',
    'Terrible service and mediocre food. Won\'t be returning.',
    'Extremely disappointed. Nothing about this meal was enjoyable.'
  ]
};

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

// Check if a date already has data for a venue
async function checkDateHasData(venueId, dateStr) {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabaseAdmin
    .from('feedback_sessions')
    .select('id')
    .eq('venue_id', venueId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .limit(1);

  if (error) {
    console.error('Error checking existing data:', error);
    return false;
  }

  return data && data.length > 0;
}

export default async function handler(req, res) {
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

    // Check if user is admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && !userData.email?.endsWith('@getchatters.com'))) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { accountId, startDate, endDate } = req.body;

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
      sessionsCreated: 0,
      googleReviewsCreated: 0,
      externalRatingsCreated: 0,
      npsCreated: 0,
      datesSkipped: 0,
      datesProcessed: 0
    };

    // Process each venue
    for (const venue of venues) {
      // Get or create default questions for this venue
      let { data: questions } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('venue_id', venue.id)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (!questions || questions.length === 0) {
        const { data: newQuestions, error: qError } = await supabaseAdmin
          .from('questions')
          .insert([
            { venue_id: venue.id, question_text: 'How was your overall experience?', display_order: 1, is_active: true },
            { venue_id: venue.id, question_text: 'How was the food quality?', display_order: 2, is_active: true },
            { venue_id: venue.id, question_text: 'How was the service?', display_order: 3, is_active: true }
          ])
          .select('id');

        if (qError) console.error('Error creating questions:', qError);
        questions = newQuestions || [];
      }

      const questionIds = questions.map(q => q.id);
      const tableCount = venue.table_count || 10;
      const allReviews = [];

      // Process each date
      for (const dateStr of dates) {
        // Check if this date already has data
        const hasData = await checkDateHasData(venue.id, dateStr);

        if (hasData) {
          console.log(`Skipping ${dateStr} for venue ${venue.name} - data already exists`);
          stats.datesSkipped++;
          continue;
        }

        stats.datesProcessed++;

        // BATCH INSERT: Prepare all sessions for this day
        const sessionsToInsert = [];
        for (let i = 0; i < 30; i++) {
          const sessionTime = setTimeOfDay(new Date(dateStr), 11, 21);
          const tableNumber = randomInt(1, tableCount);
          const shouldIncludeEmail = Math.random() > 0.7;
          const sessionId = uuidv4();

          sessionsToInsert.push({
            id: sessionId,
            venue_id: venue.id,
            table_number: tableNumber.toString(),
            started_at: sessionTime.toISOString(),
            _tableNumber: tableNumber,
            _sessionTime: sessionTime,
            _shouldIncludeEmail: shouldIncludeEmail,
            _customerEmail: shouldIncludeEmail ? `customer_${dateStr}_${i}@example.com` : null,
            _index: i
          });
        }

        // Insert all sessions at once
        const { data: insertedSessions, error: sessionError } = await supabaseAdmin
          .from('feedback_sessions')
          .insert(sessionsToInsert.map(s => ({
            id: s.id,
            venue_id: s.venue_id,
            table_number: s.table_number,
            started_at: s.started_at
          })))
          .select();

        if (sessionError) {
          console.error('Error creating sessions:', sessionError);
          console.error('Session error details:', JSON.stringify(sessionError, null, 2));
          throw new Error(`Failed to create sessions: ${sessionError.message || sessionError.code || JSON.stringify(sessionError)}`);
        }

        if (!insertedSessions || insertedSessions.length === 0) {
          console.error('No sessions were inserted');
          throw new Error('Session insert succeeded but returned no data');
        }

        stats.sessionsCreated += insertedSessions.length;

        // BATCH INSERT: Prepare all feedback and NPS
        const feedbackToInsert = [];
        const npsToInsert = [];

        insertedSessions.forEach((session, idx) => {
          const sessionData = sessionsToInsert[idx];
          const sessionTime = sessionData._sessionTime;
          const tableNumber = sessionData._tableNumber;
          const shouldIncludeEmail = sessionData._shouldIncludeEmail;
          const customerEmail = sessionData._customerEmail;
          const i = sessionData._index;

          // Generate feedback (90% complete)
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

              feedbackToInsert.push({
                venue_id: venue.id,
                session_id: session.id,
                question_id: questionId,
                table_number: tableNumber.toString(),
                rating: rating,
                additional_feedback: comment,
                created_at: sessionTime.toISOString(),
                timestamp: sessionTime.toISOString()
              });
            }
          }

          // NPS submission (20 per day target)
          if (shouldIncludeEmail && npsToInsert.length < 20) {
            const scheduledDate = new Date(sessionTime);
            scheduledDate.setHours(scheduledDate.getHours() + 24);
            const sentDate = new Date(scheduledDate);
            sentDate.setMinutes(sentDate.getMinutes() + randomInt(0, 30));
            const respondedDate = new Date(sentDate);
            respondedDate.setHours(respondedDate.getHours() + randomInt(1, 48));

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
              session_id: session.id,
              customer_email: customerEmail,
              scheduled_send_at: scheduledDate.toISOString(),
              sent_at: sentDate.toISOString(),
              score: npsScore,
              responded_at: respondedDate.toISOString()
            });
          }
        });

        // Batch insert feedback (chunks of 500 to avoid payload limits)
        if (feedbackToInsert.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < feedbackToInsert.length; i += chunkSize) {
            const chunk = feedbackToInsert.slice(i, i + chunkSize);
            const { error: feedbackError } = await supabaseAdmin
              .from('feedback')
              .insert(chunk);

            if (feedbackError) {
              console.error('Error creating feedback batch:', feedbackError);
            } else {
              stats.feedbackCreated += chunk.length;
            }
          }
        }

        // Batch insert NPS
        if (npsToInsert.length > 0) {
          const { error: npsError } = await supabaseAdmin
            .from('nps_submissions')
            .insert(npsToInsert);

          if (npsError) {
            console.error('Error creating NPS batch:', npsError);
          } else {
            stats.npsCreated += npsToInsert.length;
          }
        }

        // 1 Google review per day
        const reviewTime = setTimeOfDay(new Date(dateStr), 10, 22);
        let starRating;
        const rand = Math.random();
        if (rand < 0.50) {
          starRating = 5;
        } else if (rand < 0.75) {
          starRating = 4;
        } else if (rand < 0.90) {
          starRating = 3;
        } else if (rand < 0.97) {
          starRating = 2;
        } else {
          starRating = 1;
        }

        const reviewerName = randomElement(CUSTOMER_NAMES);
        const reviewText = randomElement(GOOGLE_REVIEW_TEXTS[starRating]);
        const shouldReply = (starRating >= 4 && Math.random() > 0.6) || (starRating <= 2 && Math.random() > 0.2);
        let replyText = null;
        let replyDate = null;

        if (shouldReply) {
          const replyDateObj = new Date(reviewTime);
          replyDateObj.setHours(replyDateObj.getHours() + randomInt(2, 72));
          replyDate = replyDateObj.toISOString();

          if (starRating >= 4) {
            replyText = `Thank you so much for your wonderful review, ${reviewerName.split(' ')[0]}! We're thrilled you enjoyed your experience and look forward to welcoming you back soon.`;
          } else {
            replyText = `Thank you for your feedback, ${reviewerName.split(' ')[0]}. We're sorry your experience didn't meet expectations. We'd love the opportunity to make this right - please contact us directly so we can address your concerns.`;
          }
        }

        const { error: reviewError } = await supabaseAdmin
          .from('google_reviews')
          .insert({
            venue_id: venue.id,
            google_review_id: `demo_review_${venue.id}_${dateStr}`,
            reviewer_name: reviewerName,
            star_rating: starRating,
            review_text: reviewText,
            review_date: reviewTime.toISOString(),
            review_reply: replyText,
            reply_date: replyDate,
            is_replied: shouldReply,
            created_at: reviewTime.toISOString()
          });

        if (reviewError) {
          console.error('Error creating Google review:', reviewError);
        } else {
          stats.googleReviewsCreated++;
          allReviews.push(starRating);
        }

        // 1 historical rating snapshot per day
        if (allReviews.length > 0) {
          const avgRating = (allReviews.reduce((a, b) => a + b, 0) / allReviews.length).toFixed(1);
          const snapshotTime = setTimeOfDay(new Date(dateStr), 23, 23);

          const { error: ratingsError } = await supabaseAdmin
            .from('historical_ratings')
            .insert({
              venue_id: venue.id,
              source: 'google',
              rating: avgRating,
              ratings_count: allReviews.length,
              is_initial: false,
              recorded_at: snapshotTime.toISOString()
            });

          if (ratingsError) {
            console.error('Error creating historical rating:', ratingsError);
          } else {
            stats.externalRatingsCreated++;
          }
        }
      }

      // Update current external_ratings with latest data
      if (allReviews.length > 0) {
        const avgRating = (allReviews.reduce((a, b) => a + b, 0) / allReviews.length).toFixed(1);

        await supabaseAdmin
          .from('external_ratings')
          .upsert({
            venue_id: venue.id,
            source: 'google',
            rating: avgRating,
            ratings_count: allReviews.length,
            fetched_at: new Date().toISOString()
          }, {
            onConflict: 'venue_id,source'
          });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Demo data created for ${venues.length} venue(s) across ${dates.length} days`,
      stats
    });

  } catch (error) {
    console.error('[seed-demo] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
