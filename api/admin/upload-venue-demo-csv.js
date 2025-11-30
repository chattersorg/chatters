// API endpoint to upload and process venue demo data CSV
// POST /api/admin/upload-venue-demo-csv

const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const { venueId, csvData, clearExisting = true } = req.body;

    if (!venueId || !csvData) {
      return res.status(400).json({ error: 'Venue ID and CSV data are required' });
    }

    // Verify venue exists
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id, name, table_count')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Get questions for this venue
    let { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('venue_id', venueId)
      .eq('is_active', true);

    if (!questions || questions.length === 0) {
      const { data: newQuestions } = await supabaseAdmin
        .from('questions')
        .insert([
          { venue_id: venueId, question_text: 'How was your overall experience?', display_order: 1, is_active: true },
          { venue_id: venueId, question_text: 'How was the food quality?', display_order: 2, is_active: true },
          { venue_id: venueId, question_text: 'How was the service?', display_order: 3, is_active: true }
        ])
        .select('id');
      questions = newQuestions || [];
    }

    const questionIds = questions.map(q => q.id);

    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });

    // Clear existing data if requested
    if (clearExisting) {
      console.log('Clearing existing demo data for venue:', venueId);

      await supabaseAdmin.from('feedback').delete().eq('venue_id', venueId);
      await supabaseAdmin.from('feedback_sessions').delete().eq('venue_id', venueId);
      await supabaseAdmin.from('nps_submissions').delete().eq('venue_id', venueId);
      await supabaseAdmin.from('historical_ratings').delete().eq('venue_id', venueId);
    }

    // Process records by type
    const sessions = new Map(); // session_id -> session data
    const feedbackItems = [];
    const npsSubmissions = [];
    const ratings = { google: [], tripadvisor: [] };

    for (const record of records) {
      const dataType = record.data_type;

      if (dataType === 'feedback') {
        const sessionId = record.session_id;

        // Create session if not exists
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, {
            id: sessionId,
            venue_id: venueId,
            table_number: record.table_number,
            started_at: record.timestamp,
            created_at: record.timestamp
          });
        }

        // Create feedback item
        feedbackItems.push({
          venue_id: venueId,
          session_id: sessionId,
          question_id: record.question_id || questionIds[0], // Use first question if not specified
          table_number: record.table_number,
          rating: parseInt(record.rating),
          additional_feedback: record.comment || null,
          created_at: record.timestamp,
          timestamp: record.timestamp,
          acknowledged_at: record.acknowledged_at || null,
          acknowledged_by: record.acknowledged_by || null
        });
      } else if (dataType === 'nps') {
        npsSubmissions.push({
          venue_id: venueId,
          customer_email: record.customer_email,
          scheduled_send_at: record.timestamp,
          sent_at: record.timestamp,
          score: parseInt(record.nps_score),
          responded_at: record.timestamp,
          created_at: record.timestamp
        });
      } else if (dataType === 'rating') {
        if (record.google_rating) {
          ratings.google.push({
            rating: parseFloat(record.google_rating),
            timestamp: record.timestamp
          });
        }
        if (record.tripadvisor_rating) {
          ratings.tripadvisor.push({
            rating: parseFloat(record.tripadvisor_rating),
            timestamp: record.timestamp
          });
        }
      }
    }

    const stats = {
      sessionsCreated: 0,
      feedbackCreated: 0,
      npsCreated: 0,
      ratingsCreated: 0
    };

    // Insert sessions in batches
    const sessionArray = Array.from(sessions.values());
    for (let i = 0; i < sessionArray.length; i += 500) {
      const batch = sessionArray.slice(i, i + 500);
      const { error } = await supabaseAdmin
        .from('feedback_sessions')
        .insert(batch);

      if (error) {
        console.error('Error inserting sessions:', error);
      } else {
        stats.sessionsCreated += batch.length;
      }
    }

    // Insert feedback in batches
    for (let i = 0; i < feedbackItems.length; i += 500) {
      const batch = feedbackItems.slice(i, i + 500);
      const { error } = await supabaseAdmin
        .from('feedback')
        .insert(batch);

      if (error) {
        console.error('Error inserting feedback:', error);
      } else {
        stats.feedbackCreated += batch.length;
      }
    }

    // Insert NPS in batches
    for (let i = 0; i < npsSubmissions.length; i += 500) {
      const batch = npsSubmissions.slice(i, i + 500);
      const { error } = await supabaseAdmin
        .from('nps_submissions')
        .insert(batch);

      if (error) {
        console.error('Error inserting NPS:', error);
      } else {
        stats.npsCreated += batch.length;
      }
    }

    // Create historical rating snapshots
    const historicalRatings = [];

    // Google ratings
    let cumulativeGoogleRatings = [];
    for (const { rating, timestamp } of ratings.google) {
      cumulativeGoogleRatings.push(rating);
      const avgRating = (cumulativeGoogleRatings.reduce((a, b) => a + b, 0) / cumulativeGoogleRatings.length).toFixed(1);

      historicalRatings.push({
        venue_id: venueId,
        source: 'google',
        rating: parseFloat(avgRating),
        ratings_count: cumulativeGoogleRatings.length,
        is_initial: false,
        recorded_at: timestamp
      });
    }

    // TripAdvisor ratings
    let cumulativeTripRatings = [];
    for (const { rating, timestamp } of ratings.tripadvisor) {
      cumulativeTripRatings.push(rating);
      const avgRating = (cumulativeTripRatings.reduce((a, b) => a + b, 0) / cumulativeTripRatings.length).toFixed(1);

      historicalRatings.push({
        venue_id: venueId,
        source: 'tripadvisor',
        rating: parseFloat(avgRating),
        ratings_count: cumulativeTripRatings.length,
        is_initial: false,
        recorded_at: timestamp
      });
    }

    // Insert historical ratings
    if (historicalRatings.length > 0) {
      const { error } = await supabaseAdmin
        .from('historical_ratings')
        .insert(historicalRatings);

      if (error) {
        console.error('Error inserting historical ratings:', error);
      } else {
        stats.ratingsCreated = historicalRatings.length;
      }
    }

    // Update current external_ratings with latest averages
    if (cumulativeGoogleRatings.length > 0) {
      const googleAvg = (cumulativeGoogleRatings.reduce((a, b) => a + b, 0) / cumulativeGoogleRatings.length).toFixed(1);
      await supabaseAdmin
        .from('external_ratings')
        .upsert({
          venue_id: venueId,
          source: 'google',
          rating: parseFloat(googleAvg),
          ratings_count: cumulativeGoogleRatings.length,
          fetched_at: new Date().toISOString()
        }, { onConflict: 'venue_id,source' });
    }

    if (cumulativeTripRatings.length > 0) {
      const tripAvg = (cumulativeTripRatings.reduce((a, b) => a + b, 0) / cumulativeTripRatings.length).toFixed(1);
      await supabaseAdmin
        .from('external_ratings')
        .upsert({
          venue_id: venueId,
          source: 'tripadvisor',
          rating: parseFloat(tripAvg),
          ratings_count: cumulativeTripRatings.length,
          fetched_at: new Date().toISOString()
        }, { onConflict: 'venue_id,source' });
    }

    return res.status(200).json({
      success: true,
      message: `Demo data imported for ${venue.name}`,
      stats
    });

  } catch (error) {
    console.error('[upload-venue-demo-csv] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
