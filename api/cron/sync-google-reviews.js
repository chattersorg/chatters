// /api/cron/sync-google-reviews.js
// Automated cron job to sync Google reviews every 30 minutes
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const { getRefreshedAuth } = require('../google/utils/token-refresh');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetches and stores reviews for a Google location
 */
async function syncLocationReviews(location, auth) {
  try {
    const mybusiness = google.mybusinessaccountmanagement({
      version: 'v1',
      auth
    });

    // Fetch reviews from Google
    const response = await mybusiness.accounts.locations.reviews.list({
      parent: location.location_id
    });

    const reviews = response.data.reviews || [];

    let newCount = 0;
    let updatedCount = 0;

    for (const review of reviews) {
      // Convert star rating
      const starRating = {
        'FIVE': 5,
        'FOUR': 4,
        'THREE': 3,
        'TWO': 2,
        'ONE': 1
      }[review.starRating] || 3;

      const reviewData = {
        location_id: location.id,
        google_review_id: review.name,
        reviewer_name: review.reviewer?.displayName || 'Anonymous',
        reviewer_profile_photo: review.reviewer?.profilePhotoUrl,
        star_rating: starRating,
        review_text: review.comment || null,
        review_date: review.createTime,
        review_reply: review.reviewReply?.comment || null,
        reply_date: review.reviewReply?.updateTime || null,
        is_replied: !!review.reviewReply
      };

      // Upsert review
      await supabaseAdmin
        .from('google_reviews')
        .upsert(reviewData, {
          onConflict: 'google_review_id',
          ignoreDuplicates: false
        });

      // Check if this was a new review
      const { data: existing } = await supabaseAdmin
        .from('google_reviews')
        .select('created_at, updated_at')
        .eq('google_review_id', review.name)
        .single();

      if (existing) {
        if (existing.created_at === existing.updated_at) {
          newCount++;
        } else {
          updatedCount++;
        }
      }
    }

    // Update last synced timestamp
    await supabaseAdmin
      .from('google_locations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', location.id);

    return {
      success: true,
      total: reviews.length,
      new: newCount,
      updated: updatedCount
    };

  } catch (error) {
    console.error(`Error syncing location ${location.location_name}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export default async function handler(req, res) {
  // Verify this is a cron request (Vercel sets this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = new Date();
  let totalProcessed = 0;
  let totalNew = 0;
  let totalUpdated = 0;
  let errorCount = 0;
  const errors = [];

  try {
    console.log('🔄 Starting Google reviews sync cron job...');

    // Get all active Google connections
    const { data: connections, error: connError } = await supabaseAdmin
      .from('google_connections')
      .select(`
        *,
        venues (
          id,
          name
        )
      `);

    if (connError) {
      throw new Error(`Failed to fetch connections: ${connError.message}`);
    }

    if (!connections || connections.length === 0) {
      console.log('No Google connections found');
      return res.status(200).json({
        status: 'completed',
        message: 'No Google connections to sync'
      });
    }

    console.log(`📍 Found ${connections.length} Google connection(s) to sync`);

    // Process each connection
    for (const connection of connections) {
      try {
        const venueName = connection.venues?.name || 'Unknown';
        console.log(`\n🏢 Processing venue: ${venueName}`);

        // Get refreshed auth
        const auth = await getRefreshedAuth(connection);

        // Get all active locations for this connection
        const { data: locations, error: locError } = await supabaseAdmin
          .from('google_locations')
          .select('*')
          .eq('google_connection_id', connection.id)
          .eq('is_active', true);

        if (locError || !locations || locations.length === 0) {
          console.log(`⚠️ No active locations for ${venueName}`);
          continue;
        }

        console.log(`📍 Found ${locations.length} location(s) for ${venueName}`);

        // Sync reviews for each location
        for (const location of locations) {
          try {
            console.log(`  🔵 Syncing: ${location.location_name}`);

            const result = await syncLocationReviews(location, auth);

            if (result.success) {
              totalProcessed += result.total;
              totalNew += result.new;
              totalUpdated += result.updated;
              console.log(`  ✅ ${location.location_name}: ${result.total} reviews (${result.new} new, ${result.updated} updated)`);
            } else {
              errorCount++;
              errors.push({
                venue: venueName,
                location: location.location_name,
                error: result.error
              });
              console.error(`  ❌ ${location.location_name}: ${result.error}`);
            }

          } catch (error) {
            errorCount++;
            errors.push({
              venue: venueName,
              location: location.location_name,
              error: error.message
            });
            console.error(`  ❌ Error syncing ${location.location_name}:`, error.message);
          }

          // Small delay between locations to be respectful to Google's API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        errorCount++;
        errors.push({
          venue: connection.venues?.name || 'Unknown',
          error: error.message
        });
        console.error(`❌ Error processing connection:`, error.message);
      }

      // Delay between venues
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const duration = new Date() - startTime;
    const summary = {
      status: 'completed',
      duration_ms: duration,
      connections_processed: connections.length,
      total_reviews: totalProcessed,
      new_reviews: totalNew,
      updated_reviews: totalUpdated,
      errors: errorCount,
      error_details: errors.slice(0, 10) // Limit error details
    };

    console.log('\n📊 Sync summary:', summary);

    return res.status(200).json(summary);

  } catch (error) {
    console.error('💥 Cron job failed:', error);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
      total_processed: totalProcessed,
      new_reviews: totalNew,
      updated_reviews: totalUpdated,
      errors: errorCount
    });
  }
}
