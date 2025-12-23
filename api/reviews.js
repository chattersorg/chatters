// /api/reviews.js
// Consolidated review platform APIs (Google, TripAdvisor, Unified Search)
// Force deployment update
const { createClient } = require('@supabase/supabase-js');
const { authenticateVenueAccess, authenticateAdmin } = require('./auth-helper');

// Config constants
const GOOGLE_RATINGS_TTL_HOURS = 24;
const TRIPADVISOR_RATINGS_TTL_HOURS = 24;
const GOOGLE_PLACES_FIELDS = 'rating,user_ratings_total';
const GOOGLE_VENUE_DETAILS_FIELDS = 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total';
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;


// Create Supabase clients
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('🔧 Reviews API called:', req.method, req.url);
  console.log('🔧 Query params:', req.query);

  const { platform, action } = req.query;
  
  // Get the referer from the request headers for TripAdvisor API calls
  const referer = req.headers.origin || req.headers.referer || 'https://my.getchatters.com';
  console.log('🔧 Request origin/referer:', referer);

  try {
    // Route based on platform and action
    if (platform === 'google') {
      return await handleGoogleAction(req, res, action);
    } else if (platform === 'tripadvisor') {
      return await handleTripAdvisorAction(req, res, action);
    } else if (platform === 'unified') {
      return await handleUnifiedAction(req, res, action);
    } else {
      return res.status(400).json({ 
        error: 'Invalid platform parameter', 
        expected: 'google, tripadvisor, or unified',
        received: platform 
      });
    }
  } catch (error) {
    console.error('💥 Reviews API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// =============================================================================
// GOOGLE PLATFORM HANDLERS
// =============================================================================

async function handleGoogleAction(req, res, action) {
  switch (action) {
    case 'ratings':
      return await handleGoogleRatings(req, res);
    case 'places-search':
      return await handleGooglePlacesSearch(req, res);
    case 'place-details':
      return await handleGooglePlaceDetails(req, res);
    case 'update-venue':
      return await handleGoogleUpdateVenue(req, res);
    default:
      return res.status(400).json({ error: 'Invalid Google action', received: action });
  }
}

async function handleGoogleRatings(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { venueId, forceRefresh = '0' } = req.query;
  if (!venueId) {
    return res.status(400).json({ error: 'venueId parameter is required' });
  }

  await authenticateVenueAccess(req, venueId);

  const { data: venue, error: venueError } = await supabaseClient
    .from('venues')
    .select('id, place_id, name')
    .eq('id', venueId)
    .single();

  if (venueError || !venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  if (!venue.place_id) {
    return res.status(404).json({ error: 'Venue has no Google Place ID configured' });
  }

  // Check cache unless force refresh
  if (forceRefresh !== '1') {
    const { data: cachedRating } = await supabaseClient
      .from('external_ratings')
      .select('*')
      .eq('venue_id', venueId)
      .eq('source', 'google')
      .single();

    if (cachedRating) {
      const fetchedAt = new Date(cachedRating.fetched_at);
      const now = new Date();
      const hoursSinceUpdate = (now - fetchedAt) / (1000 * 60 * 60);

      if (hoursSinceUpdate < GOOGLE_RATINGS_TTL_HOURS) {
        return res.status(200).json({
          source: 'google',
          rating: cachedRating.rating ? parseFloat(cachedRating.rating) : null,
          ratings_count: cachedRating.ratings_count,
          attributions: cachedRating.attributions || [],
          fetched_at: cachedRating.fetched_at,
          cached: true
        });
      }
    }
  }

  // Fetch fresh data from Google
  try {
    const googleData = await fetchGooglePlaceDetails(venue.place_id);
    
    // Cache the result
    const { error: upsertError } = await supabaseAdmin
      .from('external_ratings')
      .upsert({
        venue_id: venueId,
        source: 'google',
        rating: googleData.rating,
        ratings_count: googleData.user_ratings_total,
        attributions: googleData.attributions || ['Data © Google'],
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'venue_id,source'
      });

    if (upsertError) {
      console.error('Failed to cache Google rating:', upsertError);
    }

    return res.status(200).json({
      source: 'google',
      rating: googleData.rating,
      ratings_count: googleData.user_ratings_total,
      attributions: googleData.attributions || ['Data © Google'],
      fetched_at: new Date().toISOString(),
      cached: false
    });

  } catch (googleError) {
    console.error('Google Places API error:', googleError);
    
    // Try to return stale cached data
    const { data: staleRating } = await supabaseClient
      .from('external_ratings')
      .select('*')
      .eq('venue_id', venueId)
      .eq('source', 'google')
      .single();

    if (staleRating) {
      return res.status(200).json({
        source: 'google',
        rating: staleRating.rating ? parseFloat(staleRating.rating) : null,
        ratings_count: staleRating.ratings_count,
        attributions: staleRating.attributions || [],
        fetched_at: staleRating.fetched_at,
        cached: true,
        stale: true
      });
    }

    return res.status(503).json({
      status: 'temporary_unavailable',
      reason: getErrorReason(googleError)
    });
  }
}

async function handleGooglePlacesSearch(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await authenticateAdmin(req);

  const { query, type = 'autocomplete' } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  if (!GOOGLE_API_KEY) {
    return res.status(503).json({ 
      status: 'temporary_unavailable', 
      reason: 'google_api_not_configured' 
    });
  }

  if (type === 'autocomplete') {
    return await handleGoogleAutocomplete(req, res, query, GOOGLE_API_KEY);
  } else if (type === 'findplace') {
    return await handleGoogleFindPlace(req, res, query, GOOGLE_API_KEY);
  } else {
    return res.status(400).json({ error: 'Invalid type. Use "autocomplete" or "findplace"' });
  }
}

async function handleGooglePlaceDetails(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await authenticateAdmin(req);

  const { placeId } = req.query;
  if (!placeId) {
    return res.status(400).json({ error: 'placeId parameter is required' });
  }

  if (!GOOGLE_API_KEY) {
    return res.status(503).json({ 
      status: 'temporary_unavailable', 
      reason: 'google_api_not_configured' 
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${GOOGLE_VENUE_DETAILS_FIELDS}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const result = data.result;
      
      // Parse address components
      const addressParts = result.formatted_address ? result.formatted_address.split(', ') : [];
      let structuredAddress = {
        line1: '',
        line2: '',
        city: '',
        county: '',
        postalCode: '',
        country: ''
      };

      if (addressParts.length >= 2) {
        structuredAddress.line1 = addressParts[0] || '';
        structuredAddress.city = addressParts[addressParts.length - 3] || '';
        structuredAddress.county = addressParts[addressParts.length - 2] || '';
        structuredAddress.postalCode = addressParts[addressParts.length - 1] || '';
        structuredAddress.country = 'United Kingdom';
      }

      return res.status(200).json({
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        structured_address: structuredAddress,
        phone: result.formatted_phone_number,
        website: result.website,
        rating: result.rating,
        ratings_count: result.user_ratings_total,
        attributions: data.html_attributions || ['Data © Google']
      });
    } else {
      return res.status(503).json({
        status: 'temporary_unavailable',
        reason: 'google_api_error',
        details: data.error_message || data.status
      });
    }
  } catch (error) {
    console.error('Place details error:', error);
    return res.status(503).json({
      status: 'temporary_unavailable',
      reason: 'network_error',
      details: error.message
    });
  }
}

async function handleGoogleUpdateVenue(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { venueId } = req.query;
  const { place_id, venue_data, auto_populate } = req.body;

  if (!venueId || !place_id) {
    return res.status(400).json({ error: 'venueId and place_id are required' });
  }

  await authenticateVenueAccess(req, venueId);

  // Check if Google integration is already locked
  const { data: existingVenue, error: venueCheckError } = await supabaseAdmin
    .from('venues')
    .select('google_integration_locked, place_id')
    .eq('id', venueId)
    .single();

  if (venueCheckError) {
    return res.status(500).json({ error: 'Failed to check venue status' });
  }

  if (existingVenue.google_integration_locked && existingVenue.place_id) {
    return res.status(403).json({ 
      error: 'Google integration is locked', 
      message: 'Google venue can only be set once and cannot be changed.' 
    });
  }

  // Generate Google review link
  const googleReviewLink = `https://search.google.com/local/writereview?placeid=${place_id}`;

  // Prepare update data
  let updateData = { 
    place_id,
    google_review_link: googleReviewLink,
    google_integration_locked: true
  };

  if (auto_populate && venue_data) {
    updateData = {
      ...updateData,
      name: venue_data.name || updateData.name,
      address: venue_data.structured_address || updateData.address,
      phone: venue_data.phone || updateData.phone,
      website: venue_data.website || updateData.website
    };
  }

  // Update venue
  const { data, error } = await supabaseAdmin
    .from('venues')
    .update(updateData)
    .eq('id', venueId)
    .select('id, name, place_id, google_integration_locked')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update venue', details: error.message });
  }

  // Store initial rating
  try {
    const googleData = await fetchGooglePlaceDetails(place_id);
    
    if (googleData.rating) {
      // Historical ratings
      await supabaseAdmin
        .from('historical_ratings')
        .insert({
          venue_id: venueId,
          source: 'google',
          rating: googleData.rating,
          ratings_count: googleData.user_ratings_total,
          is_initial: true,
          recorded_at: new Date().toISOString()
        });

      // Cache
      await supabaseAdmin
        .from('external_ratings')
        .upsert({
          venue_id: venueId,
          source: 'google',
          rating: googleData.rating,
          ratings_count: googleData.user_ratings_total,
          attributions: googleData.attributions || ['Data © Google'],
          fetched_at: new Date().toISOString()
        }, {
          onConflict: 'venue_id,source'
        });
    }
  } catch (ratingError) {
    console.error('Failed to fetch initial rating:', ratingError);
  }

  return res.status(200).json({
    message: 'Google listing connected successfully',
    venue: data
  });
}

// =============================================================================
// TRIPADVISOR PLATFORM HANDLERS
// =============================================================================

async function handleTripAdvisorAction(req, res, action) {
  // Get referer for TripAdvisor API calls
  const referer = req.headers.origin || req.headers.referer || 'https://my.getchatters.com';
  
  switch (action) {
    case 'ratings':
      return await handleTripAdvisorRatings(req, res, referer);
    case 'location-search':
      return await handleTripAdvisorLocationSearch(req, res, referer);
    case 'location-details':
      return await handleTripAdvisorLocationDetails(req, res, referer);
    case 'update-venue':
      return await handleTripAdvisorUpdateVenue(req, res, referer);
    default:
      return res.status(400).json({ error: 'Invalid TripAdvisor action', received: action });
  }
}

async function handleTripAdvisorRatings(req, res, referer) {
  console.log('🟠 [TripAdvisor] handleTripAdvisorRatings called');
  console.log('🟠 [TripAdvisor] Request method:', req.method);
  console.log('🟠 [TripAdvisor] Query params:', req.query);
  console.log('🟠 [TripAdvisor] Using referer:', referer);
  
  if (req.method !== 'GET') {
    console.log('❌ [TripAdvisor] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { venueId, forceRefresh = '0' } = req.query;
  console.log('🟠 [TripAdvisor] venueId:', venueId, 'forceRefresh:', forceRefresh);
  
  if (!venueId) {
    console.log('❌ [TripAdvisor] Missing venueId parameter');
    return res.status(400).json({ error: 'venueId parameter is required' });
  }

  console.log('🔐 [TripAdvisor] Authenticating venue access for venueId:', venueId);
  await authenticateVenueAccess(req, venueId);
  console.log('✅ [TripAdvisor] Authentication successful');

  console.log('🟠 [TripAdvisor] Fetching venue data from database');
  const { data: venue, error: venueError } = await supabaseClient
    .from('venues')
    .select('id, tripadvisor_location_id, name')
    .eq('id', venueId)
    .single();

  console.log('🟠 [TripAdvisor] Database query result:', { venue, venueError });

  if (venueError || !venue) {
    console.log('❌ [TripAdvisor] Venue not found:', venueError);
    return res.status(404).json({ error: 'Venue not found' });
  }

  console.log('🟠 [TripAdvisor] Venue found:', venue.name, 'TripAdvisor ID:', venue.tripadvisor_location_id);

  if (!venue.tripadvisor_location_id) {
    console.log('❌ [TripAdvisor] No TripAdvisor location ID configured for venue');
    return res.status(404).json({ error: 'Venue has no TripAdvisor location ID configured' });
  }

  // Check cache unless force refresh
  console.log('🟠 [TripAdvisor] Checking cache (forceRefresh:', forceRefresh, ')');
  if (forceRefresh !== '1') {
    const { data: cachedRating } = await supabaseClient
      .from('external_ratings')
      .select('*')
      .eq('venue_id', venueId)
      .eq('source', 'tripadvisor')
      .single();

    console.log('🟠 [TripAdvisor] Cached rating found:', !!cachedRating);
    if (cachedRating) {
      const fetchedAt = new Date(cachedRating.fetched_at);
      const now = new Date();
      const hoursSinceUpdate = (now - fetchedAt) / (1000 * 60 * 60);
      console.log('🟠 [TripAdvisor] Cache age:', hoursSinceUpdate.toFixed(2), 'hours (TTL:', TRIPADVISOR_RATINGS_TTL_HOURS, 'hours)');

      if (hoursSinceUpdate < TRIPADVISOR_RATINGS_TTL_HOURS) {
        console.log('✅ [TripAdvisor] Returning cached rating');
        return res.status(200).json({
          source: 'tripadvisor',
          rating: cachedRating.rating ? parseFloat(cachedRating.rating) : null,
          ratings_count: cachedRating.ratings_count,
          fetched_at: cachedRating.fetched_at,
          cached: true
        });
      } else {
        console.log('⏰ [TripAdvisor] Cache expired, fetching fresh data');
      }
    } else {
      console.log('🟠 [TripAdvisor] No cached rating found');
    }
  } else {
    console.log('🔄 [TripAdvisor] Force refresh requested, skipping cache');
  }

  // Fetch fresh data from TripAdvisor
  console.log('📡 [TripAdvisor] Fetching fresh data from API for location ID:', venue.tripadvisor_location_id);
  try {
    const tripAdvisorData = await fetchTripAdvisorLocationDetails(venue.tripadvisor_location_id, referer);
    console.log('✅ [TripAdvisor] API response received:', {
      rating: tripAdvisorData.rating,
      num_reviews: tripAdvisorData.num_reviews,
      location_id: tripAdvisorData.location_id
    });
    
    // Cache the result
    console.log('💾 [TripAdvisor] Caching rating data to database');
    const cacheResult = await supabaseAdmin
      .from('external_ratings')
      .upsert({
        venue_id: venueId,
        source: 'tripadvisor',
        rating: tripAdvisorData.rating,
        ratings_count: tripAdvisorData.num_reviews,
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'venue_id,source'
      });
    
    if (cacheResult.error) {
      console.error('⚠️ [TripAdvisor] Failed to cache rating:', cacheResult.error);
    } else {
      console.log('✅ [TripAdvisor] Rating cached successfully');
    }

    const responseData = {
      source: 'tripadvisor',
      rating: tripAdvisorData.rating,
      ratings_count: tripAdvisorData.num_reviews,
      fetched_at: new Date().toISOString(),
      cached: false
    };
    console.log('✅ [TripAdvisor] Sending response:', responseData);
    return res.status(200).json(responseData);

  } catch (tripAdvisorError) {
    console.error('💥 [TripAdvisor] API error occurred:', {
      message: tripAdvisorError.message,
      stack: tripAdvisorError.stack,
      venue_id: venueId,
      location_id: venue.tripadvisor_location_id
    });
    
    // Try to return stale cached data
    console.log('🔄 [TripAdvisor] Attempting to retrieve stale cached data as fallback');
    const { data: staleRating } = await supabaseClient
      .from('external_ratings')
      .select('*')
      .eq('venue_id', venueId)
      .eq('source', 'tripadvisor')
      .single();

    if (staleRating) {
      console.log('✅ [TripAdvisor] Returning stale cached data:', {
        rating: staleRating.rating,
        ratings_count: staleRating.ratings_count,
        fetched_at: staleRating.fetched_at
      });
      return res.status(200).json({
        source: 'tripadvisor',
        rating: staleRating.rating ? parseFloat(staleRating.rating) : null,
        ratings_count: staleRating.ratings_count,
        fetched_at: staleRating.fetched_at,
        cached: true,
        stale: true
      });
    }

    console.log('❌ [TripAdvisor] No fallback data available, returning error');
    const errorReason = getErrorReason(tripAdvisorError);
    console.log('❌ [TripAdvisor] Error reason classified as:', errorReason);
    return res.status(503).json({
      status: 'temporary_unavailable',
      reason: errorReason
    });
  }
}

async function handleTripAdvisorLocationSearch(req, res, referer) {
  console.log('🟠 [TripAdvisor] handleTripAdvisorLocationSearch called');
  console.log('🟠 [TripAdvisor] Request method:', req.method);
  console.log('🟠 [TripAdvisor] Query params:', req.query);
  console.log('🟠 [TripAdvisor] Using referer:', referer);
  
  if (req.method !== 'GET') {
    console.log('❌ [TripAdvisor] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔐 [TripAdvisor] Authenticating admin access');
  await authenticateAdmin(req);
  console.log('✅ [TripAdvisor] Admin authentication successful');

  const { query } = req.query;
  console.log('🟠 [TripAdvisor] Search query:', query);
  
  if (!query) {
    console.log('❌ [TripAdvisor] Missing query parameter');
    return res.status(400).json({ error: 'query parameter is required' });
  }

  console.log('🟠 [TripAdvisor] Checking API key configuration');
  if (!TRIPADVISOR_API_KEY) {
    console.log('❌ [TripAdvisor] API key not configured');
    return res.status(503).json({ 
      status: 'temporary_unavailable', 
      reason: 'tripadvisor_api_not_configured' 
    });
  }
  console.log('✅ [TripAdvisor] API key found');

  try {
    const url = `https://api.content.tripadvisor.com/api/v1/location/search?key=${TRIPADVISOR_API_KEY}&searchQuery=${encodeURIComponent(query)}&language=en`;
    console.log('📡 [TripAdvisor] Making API request to:', url.replace(TRIPADVISOR_API_KEY, '[REDACTED]'));
    
    const response = await fetch(url, {
      headers: {
        'Referer': referer
      }
    });
    console.log('📡 [TripAdvisor] API response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📡 [TripAdvisor] API response data:', JSON.stringify(data, null, 2));

    if (response.ok && data.data) {
      console.log('✅ [TripAdvisor] Search successful, found', data.data.length, 'locations');
      const suggestions = data.data.map((location, index) => {
        console.log(`🟠 [TripAdvisor] Processing location ${index + 1}:`, {
          location_id: location.location_id,
          name: location.name,
          city: location.address_obj?.city,
          rating: location.rating,
          num_reviews: location.num_reviews
        });
        
        return {
          location_id: location.location_id,
          name: location.name,
          address: location.address_obj ? {
            street1: location.address_obj.street1 || '',
            street2: location.address_obj.street2 || '',
            city: location.address_obj.city || '',
            state: location.address_obj.state || '',
            country: location.address_obj.country || '',
            postalcode: location.address_obj.postalcode || ''
          } : null,
          rating: location.rating,
          num_reviews: location.num_reviews,
          description: `${location.name}${location.address_obj ? `, ${location.address_obj.city || ''}` : ''}`
        };
      });

      console.log('✅ [TripAdvisor] Returning', suggestions.length, 'processed suggestions');
      return res.status(200).json({ suggestions });
    } else {
      console.log('❌ [TripAdvisor] Search failed or no data returned');
      console.log('❌ [TripAdvisor] Error details:', data.error || 'Unknown error');
      return res.status(503).json({
        status: 'temporary_unavailable',
        reason: 'tripadvisor_api_error',
        details: data.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('💥 [TripAdvisor] Search error occurred:', {
      message: error.message,
      stack: error.stack,
      query: query
    });
    return res.status(503).json({
      status: 'temporary_unavailable',
      reason: 'network_error',
      details: error.message
    });
  }
}

async function handleTripAdvisorLocationDetails(req, res, referer) {
  console.log('🟠 [TripAdvisor] handleTripAdvisorLocationDetails called');
  console.log('🟠 [TripAdvisor] Request method:', req.method);
  console.log('🟠 [TripAdvisor] Query params:', req.query);
  console.log('🟠 [TripAdvisor] Using referer:', referer);
  
  if (req.method !== 'GET') {
    console.log('❌ [TripAdvisor] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔐 [TripAdvisor] Authenticating admin access');
  await authenticateAdmin(req);
  console.log('✅ [TripAdvisor] Admin authentication successful');

  const { locationId } = req.query;
  console.log('🟠 [TripAdvisor] Location ID:', locationId);
  
  if (!locationId) {
    console.log('❌ [TripAdvisor] Missing locationId parameter');
    return res.status(400).json({ error: 'locationId parameter is required' });
  }

  try {
    console.log('📡 [TripAdvisor] Fetching location details for ID:', locationId);
    const locationData = await fetchTripAdvisorLocationDetails(locationId, referer);
    console.log('✅ [TripAdvisor] Location details retrieved:', {
      location_id: locationData.location_id,
      name: locationData.name,
      rating: locationData.rating,
      num_reviews: locationData.num_reviews,
      hasAddress: !!locationData.structured_address
    });
    return res.status(200).json(locationData);
  } catch (error) {
    console.error('💥 [TripAdvisor] Location details error:', {
      message: error.message,
      stack: error.stack,
      locationId: locationId
    });
    return res.status(503).json({
      status: 'temporary_unavailable',
      reason: 'tripadvisor_api_error',
      details: error.message
    });
  }
}

async function handleTripAdvisorUpdateVenue(req, res, referer) {
  console.log('🟠 [TripAdvisor] handleTripAdvisorUpdateVenue called');
  console.log('🟠 [TripAdvisor] Request method:', req.method);
  console.log('🟠 [TripAdvisor] Query params:', req.query);
  console.log('🟠 [TripAdvisor] Request body:', req.body);
  console.log('🟠 [TripAdvisor] Using referer:', referer);
  
  if (req.method !== 'PATCH') {
    console.log('❌ [TripAdvisor] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { venueId } = req.query;
  const { location_id, venue_data, auto_populate } = req.body;
  
  console.log('🟠 [TripAdvisor] Update params:', {
    venueId,
    location_id,
    auto_populate,
    hasVenueData: !!venue_data
  });

  if (!venueId || !location_id) {
    console.log('❌ [TripAdvisor] Missing required parameters');
    return res.status(400).json({ error: 'venueId and location_id are required' });
  }

  console.log('🔐 [TripAdvisor] Authenticating venue access for venueId:', venueId);
  await authenticateVenueAccess(req, venueId);
  console.log('✅ [TripAdvisor] Venue access authenticated');

  // Check if TripAdvisor integration is already locked
  const { data: existingVenue, error: venueCheckError } = await supabaseAdmin
    .from('venues')
    .select('tripadvisor_integration_locked, tripadvisor_location_id')
    .eq('id', venueId)
    .single();

  if (venueCheckError) {
    return res.status(500).json({ error: 'Failed to check venue status' });
  }

  if (existingVenue.tripadvisor_integration_locked && existingVenue.tripadvisor_location_id) {
    return res.status(403).json({ 
      error: 'TripAdvisor integration is locked', 
      message: 'TripAdvisor venue can only be set once and cannot be changed.' 
    });
  }

  // Generate TripAdvisor review link
  const tripAdvisorReviewLink = `https://www.tripadvisor.com/UserReviewEdit-g${location_id}`;

  // Prepare update data
  let updateData = { 
    tripadvisor_location_id: location_id,
    tripadvisor_link: tripAdvisorReviewLink,
    tripadvisor_integration_locked: true
  };

  if (auto_populate && venue_data) {
    updateData = {
      ...updateData,
      name: venue_data.name || updateData.name,
      address: venue_data.structured_address || updateData.address,
      phone: venue_data.phone || updateData.phone,
      website: venue_data.website || updateData.website
    };
  }

  // Update venue
  const { data, error } = await supabaseAdmin
    .from('venues')
    .update(updateData)
    .eq('id', venueId)
    .select('id, name, tripadvisor_location_id, tripadvisor_integration_locked')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update venue', details: error.message });
  }

  // Store initial rating
  console.log('💾 [TripAdvisor] Fetching and storing initial rating data');
  try {
    const tripAdvisorData = await fetchTripAdvisorLocationDetails(location_id, referer);
    console.log('✅ [TripAdvisor] Initial rating data fetched:', {
      rating: tripAdvisorData.rating,
      num_reviews: tripAdvisorData.num_reviews,
      location_id: tripAdvisorData.location_id
    });
    
    if (tripAdvisorData.rating) {
      console.log('💾 [TripAdvisor] Storing initial rating in historical_ratings table');
      // Historical ratings
      const histResult = await supabaseAdmin
        .from('historical_ratings')
        .insert({
          venue_id: venueId,
          source: 'tripadvisor',
          rating: tripAdvisorData.rating,
          ratings_count: tripAdvisorData.num_reviews,
          is_initial: true,
          recorded_at: new Date().toISOString()
        });
      
      if (histResult.error) {
        console.error('⚠️ [TripAdvisor] Failed to store historical rating:', histResult.error);
      } else {
        console.log('✅ [TripAdvisor] Historical rating stored successfully');
      }

      console.log('💾 [TripAdvisor] Caching rating in external_ratings table');
      // Cache
      const cacheResult = await supabaseAdmin
        .from('external_ratings')
        .upsert({
          venue_id: venueId,
          source: 'tripadvisor',
          rating: tripAdvisorData.rating,
          ratings_count: tripAdvisorData.num_reviews,
          fetched_at: new Date().toISOString()
        }, {
          onConflict: 'venue_id,source'
        });
      
      if (cacheResult.error) {
        console.error('⚠️ [TripAdvisor] Failed to cache rating:', cacheResult.error);
      } else {
        console.log('✅ [TripAdvisor] Rating cached successfully');
      }
    } else {
      console.log('⚠️ [TripAdvisor] No rating found in initial data, skipping rating storage');
    }
  } catch (ratingError) {
    console.error('💥 [TripAdvisor] Failed to fetch initial rating:', {
      message: ratingError.message,
      stack: ratingError.stack,
      location_id: location_id,
      venueId: venueId
    });
  }

  return res.status(200).json({
    message: 'Venue updated with TripAdvisor data successfully',
    venue: data
  });
}

// =============================================================================
// UNIFIED SEARCH HANDLERS
// =============================================================================

async function handleUnifiedAction(req, res, action) {
  switch (action) {
    case 'search':
      return await handleUnifiedSearch(req, res);
    default:
      return res.status(400).json({ error: 'Invalid unified action', received: action });
  }
}

async function handleUnifiedSearch(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await authenticateAdmin(req);

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  // Get referer for TripAdvisor API calls
  const referer = req.headers.origin || req.headers.referer || 'https://my.getchatters.com';
  console.log('🔧 [Unified Search] Using referer:', referer);

  try {
    // Search both platforms simultaneously
    const [googleResults, tripAdvisorResults] = await Promise.allSettled([
      searchGoogle(query),
      searchTripAdvisor(query, referer)
    ]);

    const response = {
      query,
      google: {
        status: googleResults.status,
        suggestions: googleResults.status === 'fulfilled' ? googleResults.value : [],
        error: googleResults.status === 'rejected' ? googleResults.reason.message : null
      },
      tripadvisor: {
        status: tripAdvisorResults.status,
        suggestions: tripAdvisorResults.status === 'fulfilled' ? tripAdvisorResults.value : [],
        error: tripAdvisorResults.status === 'rejected' ? tripAdvisorResults.reason.message : null
      }
    };

    // Try to match venues between platforms
    if (response.google.suggestions.length > 0 && response.tripadvisor.suggestions.length > 0) {
      response.matched_venues = findMatchingVenues(response.google.suggestions, response.tripadvisor.suggestions);
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Unified search error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function fetchGooglePlaceDetails(placeId) {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${GOOGLE_PLACES_FIELDS}&key=${GOOGLE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK') {
    const result = data.result;
    return {
      rating: result.rating || null,
      user_ratings_total: result.user_ratings_total || 0,
      attributions: data.html_attributions || ['Data © Google']
    };
  } else {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }
}

async function fetchTripAdvisorLocationDetails(locationId, referer = 'https://my.getchatters.com') {
  console.log('🟠 [TripAdvisor] fetchTripAdvisorLocationDetails called for ID:', locationId);
  console.log('🟠 [TripAdvisor] Using referer:', referer);
  
  if (!TRIPADVISOR_API_KEY) {
    console.log('❌ [TripAdvisor] API key not configured');
    throw new Error('TripAdvisor API key not configured');
  }
  console.log('✅ [TripAdvisor] API key found');

  const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${TRIPADVISOR_API_KEY}&language=en&currency=USD`;
  console.log('📡 [TripAdvisor] Making API request to:', url.replace(TRIPADVISOR_API_KEY, '[REDACTED]'));
  
  const response = await fetch(url, {
    headers: {
      'Referer': referer
    }
  });
  console.log('📡 [TripAdvisor] API response status:', response.status, response.statusText);
  
  const data = await response.json();
  console.log('📡 [TripAdvisor] Raw API response:', JSON.stringify(data, null, 2));

  if (response.ok && data) {
    console.log('✅ [TripAdvisor] Valid response received');
    const location = data;
    console.log('🟠 [TripAdvisor] Processing location data:', {
      location_id: location.location_id,
      name: location.name,
      hasAddressObj: !!location.address_obj,
      rating: location.rating,
      num_reviews: location.num_reviews
    });
    
    let structuredAddress = {
      line1: '',
      line2: '',
      city: '',
      county: '',
      postalCode: '',
      country: ''
    };

    if (location.address_obj) {
      console.log('🟠 [TripAdvisor] Processing address object:', location.address_obj);
      structuredAddress = {
        line1: location.address_obj.street1 || '',
        line2: location.address_obj.street2 || '',
        city: location.address_obj.city || '',
        county: location.address_obj.state || '',
        postalCode: location.address_obj.postalcode || '',
        country: location.address_obj.country || ''
      };
    } else {
      console.log('⚠️ [TripAdvisor] No address object found in response');
    }

    const result = {
      location_id: location.location_id,
      name: location.name,
      formatted_address: location.address,
      structured_address: structuredAddress,
      phone: location.phone,
      website: location.website,
      rating: location.rating ? parseFloat(location.rating) : null,
      num_reviews: location.num_reviews || 0
    };
    
    console.log('✅ [TripAdvisor] Returning processed location data:', {
      location_id: result.location_id,
      name: result.name,
      rating: result.rating,
      num_reviews: result.num_reviews,
      hasStructuredAddress: !!result.structured_address.city
    });
    
    return result;
  } else {
    console.log('❌ [TripAdvisor] API error response:', {
      status: response.status,
      statusText: response.statusText,
      error: data.error || 'Unknown error',
      data: data
    });
    throw new Error(`TripAdvisor API error: ${data.error || 'Unknown error'}`);
  }
}

async function searchGoogle(query) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.append('input', query);
  url.searchParams.append('types', 'establishment');
  url.searchParams.append('components', 'country:gb');
  url.searchParams.append('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === 'OK') {
    return data.predictions.map(prediction => ({
      platform: 'google',
      place_id: prediction.place_id,
      name: prediction.structured_formatting?.main_text || prediction.description,
      description: prediction.description,
      address: prediction.structured_formatting?.secondary_text || '',
      structured_formatting: prediction.structured_formatting
    }));
  } else {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }
}

async function searchTripAdvisor(query, referer = 'https://my.getchatters.com') {
  console.log('🟠 [TripAdvisor] searchTripAdvisor called for query:', query);
  console.log('🟠 [TripAdvisor] Using referer:', referer);
  
  if (!TRIPADVISOR_API_KEY) {
    console.log('❌ [TripAdvisor] API key not configured for unified search');
    throw new Error('TripAdvisor API key not configured');
  }
  console.log('✅ [TripAdvisor] API key found for unified search');

  const url = `https://api.content.tripadvisor.com/api/v1/location/search?key=${TRIPADVISOR_API_KEY}&searchQuery=${encodeURIComponent(query)}&language=en`;
  console.log('📡 [TripAdvisor] Unified search API request to:', url.replace(TRIPADVISOR_API_KEY, '[REDACTED]'));
  
  const response = await fetch(url, {
    headers: {
      'Referer': referer
    }
  });
  console.log('📡 [TripAdvisor] Unified search response status:', response.status, response.statusText);
  
  const data = await response.json();
  console.log('📡 [TripAdvisor] Unified search response data:', JSON.stringify(data, null, 2));

  if (response.ok && data.data) {
    console.log('✅ [TripAdvisor] Unified search successful, processing', data.data.length, 'results');
    const results = data.data.map((location, index) => {
      console.log(`🟠 [TripAdvisor] Processing unified search result ${index + 1}:`, {
        location_id: location.location_id,
        name: location.name,
        city: location.address_obj?.city,
        rating: location.rating,
        num_reviews: location.num_reviews
      });
      
      return {
        platform: 'tripadvisor',
        location_id: location.location_id,
        name: location.name,
        description: `${location.name}${location.address_obj ? `, ${location.address_obj.city || ''}` : ''}`,
        address: location.address_obj ? `${location.address_obj.city || ''}, ${location.address_obj.country || ''}` : '',
        rating: location.rating,
        num_reviews: location.num_reviews,
        address_obj: location.address_obj
      };
    });
    
    console.log('✅ [TripAdvisor] Returning', results.length, 'processed unified search results');
    return results;
  } else {
    console.log('❌ [TripAdvisor] Unified search failed');
    
    // Handle specific TripAdvisor error types
    if (data.Message && data.Message.includes('not authorized')) {
      console.log('❌ [TripAdvisor] Authorization error - likely domain restrictions');
      throw new Error('TripAdvisor API key unauthorized - this is likely due to domain restrictions. Remove domain restrictions from your TripAdvisor API key to allow server-side requests.');
    }
    
    const errorMsg = `TripAdvisor API error: ${data.error || data.message || data.Message || `HTTP ${response.status} ${response.statusText}`}`;
    console.log('❌ [TripAdvisor] Unified search error:', errorMsg);
    throw new Error(errorMsg);
  }
}

async function handleGoogleAutocomplete(req, res, query, apiKey) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.append('input', query);
  url.searchParams.append('types', 'establishment');
  url.searchParams.append('components', 'country:gb');
  url.searchParams.append('key', apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === 'OK') {
    const suggestions = data.predictions.map(prediction => ({
      place_id: prediction.place_id,
      description: prediction.description,
      structured_formatting: prediction.structured_formatting
    }));

    return res.status(200).json({
      suggestions,
      attributions: data.html_attributions || []
    });
  } else {
    return res.status(503).json({
      status: 'temporary_unavailable',
      reason: 'google_api_error',
      details: data.error_message || data.status
    });
  }
}

async function handleGoogleFindPlace(req, res, query, apiKey) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.append('input', query);
  url.searchParams.append('inputtype', 'textquery');
  url.searchParams.append('fields', 'place_id,name,formatted_address,rating,user_ratings_total');
  url.searchParams.append('locationbias', 'country:gb');
  url.searchParams.append('key', apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === 'OK') {
    const places = data.candidates.map(candidate => ({
      place_id: candidate.place_id,
      name: candidate.name,
      formatted_address: candidate.formatted_address,
      rating: candidate.rating,
      user_ratings_total: candidate.user_ratings_total
    }));

    return res.status(200).json({
      places,
      attributions: data.html_attributions || []
    });
  } else {
    return res.status(503).json({
      status: 'temporary_unavailable',
      reason: 'google_api_error',
      details: data.error_message || data.status
    });
  }
}

function findMatchingVenues(googleVenues, tripAdvisorVenues) {
  const matches = [];

  for (const googleVenue of googleVenues) {
    for (const tripAdvisorVenue of tripAdvisorVenues) {
      const nameMatch = calculateSimilarity(googleVenue.name, tripAdvisorVenue.name);
      const addressMatch = calculateSimilarity(googleVenue.address, tripAdvisorVenue.address);
      
      if (nameMatch > 0.7 && addressMatch > 0.5) {
        matches.push({
          google: googleVenue,
          tripadvisor: tripAdvisorVenue,
          similarity_score: {
            name: nameMatch,
            address: addressMatch,
            overall: (nameMatch + addressMatch) / 2
          }
        });
        break;
      }
    }
  }

  return matches.sort((a, b) => b.similarity_score.overall - a.similarity_score.overall);
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

function getErrorReason(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('quota') || message.includes('rate limit')) {
    return 'quota_exceeded';
  }
  if (message.includes('invalid') || message.includes('not found')) {
    return 'invalid_id';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'network_error';
  }
  
  return 'unknown_error';
}