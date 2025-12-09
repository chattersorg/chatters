// /api/admin/seed-demo-ratings.js
// Generate Google and TripAdvisor ratings with upward trend
// Processes a date range and shows improvement over time

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateRatings(accountId, startDateStr, endDateStr) {
  // Get venues for this account
  const { data: venues, error: venueError } = await supabaseAdmin
    .from('venues')
    .select('id, name')
    .eq('account_id', accountId);

  if (venueError) throw venueError;
  if (!venues || venues.length === 0) {
    throw new Error('No venues found for this account');
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Delete existing historical ratings in date range
  for (const venue of venues) {
    await supabaseAdmin
      .from('historical_ratings')
      .delete()
      .eq('venue_id', venue.id)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString());
  }

  const historicalRecords = [];
  const venueResults = [];

  for (const venue of venues) {
    // Random starting points (3.7-4.1) and ending points (4.3-4.7)
    const googleStart = 3.7 + Math.random() * 0.4;
    const googleEnd = 4.3 + Math.random() * 0.4;
    const tripStart = 3.6 + Math.random() * 0.5;
    const tripEnd = 4.2 + Math.random() * 0.5;
    
    const googleCountStart = randomInt(120, 200);
    const tripCountStart = randomInt(70, 130);

    const googleIncrement = (googleEnd - googleStart) / totalDays;
    const tripIncrement = (tripEnd - tripStart) / totalDays;

    let googleCount = googleCountStart;
    let tripCount = tripCountStart;
    let dayIndex = 0;
    let finalGoogleRating, finalTripRating;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const recordedAt = new Date(d);
      recordedAt.setHours(23, 0, 0, 0);

      // Calculate rating with trend + small daily noise
      const googleNoise = (Math.random() - 0.5) * 0.08;
      const tripNoise = (Math.random() - 0.5) * 0.08;

      const googleRating = Math.min(5.0, Math.max(3.5,
        googleStart + (googleIncrement * dayIndex) + googleNoise
      ));
      const tripRating = Math.min(5.0, Math.max(3.5,
        tripStart + (tripIncrement * dayIndex) + tripNoise
      ));

      // Increase review counts
      googleCount += randomInt(1, 4);
      tripCount += randomInt(0, 3);

      historicalRecords.push({
        venue_id: venue.id,
        source: 'google',
        rating: Math.round(googleRating * 10) / 10,
        ratings_count: googleCount,
        is_initial: false,
        recorded_at: recordedAt.toISOString()
      });

      historicalRecords.push({
        venue_id: venue.id,
        source: 'tripadvisor',
        rating: Math.round(tripRating * 10) / 10,
        ratings_count: tripCount,
        is_initial: false,
        recorded_at: recordedAt.toISOString()
      });

      finalGoogleRating = Math.round(googleRating * 10) / 10;
      finalTripRating = Math.round(tripRating * 10) / 10;
      dayIndex++;
    }

    // Update current external_ratings with final values
    await supabaseAdmin
      .from('external_ratings')
      .upsert({
        venue_id: venue.id,
        source: 'google',
        rating: finalGoogleRating,
        ratings_count: googleCount,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'venue_id,source' });

    await supabaseAdmin
      .from('external_ratings')
      .upsert({
        venue_id: venue.id,
        source: 'tripadvisor',
        rating: finalTripRating,
        ratings_count: tripCount,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'venue_id,source' });

    venueResults.push({
      name: venue.name,
      googleStart: Math.round(googleStart * 10) / 10,
      googleEnd: finalGoogleRating,
      tripStart: Math.round(tripStart * 10) / 10,
      tripEnd: finalTripRating
    });
  }

  // Batch insert historical records
  const batchSize = 100;
  for (let i = 0; i < historicalRecords.length; i += batchSize) {
    const batch = historicalRecords.slice(i, i + batchSize);
    const { error } = await supabaseAdmin.from('historical_ratings').insert(batch);
    if (error) {
      console.error('Insert error:', error.message);
    }
  }

  return {
    historicalRecordsCreated: historicalRecords.length,
    venuesProcessed: venues.length,
    daysProcessed: totalDays,
    venueResults
  };
}

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

    const { accountId, startDate, endDate } = req.body;

    if (!accountId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Account ID, start date, and end date are required' });
    }

    // Validate date range (max 60 days)
    const dayCount = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (dayCount > 60) {
      return res.status(400).json({ error: `Date range too large (${dayCount} days). Maximum 60 days.` });
    }

    const stats = await generateRatings(accountId, startDate, endDate);

    return res.status(200).json({
      success: true,
      message: `Ratings data created for ${stats.venuesProcessed} venue(s) across ${stats.daysProcessed} days`,
      stats
    });

  } catch (error) {
    console.error('[seed-demo-ratings] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
