# Google Reviews Integration Setup

This document outlines the setup process for the Google Reviews integration feature in Chatters.

## Overview

The Google Reviews integration allows venues to: - Display current Google star ratings and review counts - Automatically refresh ratings daily via cron job - Set up automated review prompts based on current ratings - Track review performance over time

## Prerequisites

1. **Google Cloud Console Project** with Places API enabled
2. **Supabase Service Role Key** for database operations
3. **Vercel Cron** for nightly rating refresh

## Setup Steps

### 1. Database Migration

Run the migration to add Google ratings support:

```sql
-- Apply the migration file: migrations/add_google_ratings_support.sql
psql -f migrations/add_google_ratings_support.sql
```

Or apply manually in Supabase SQL editor.

### 2. Google Cloud Configuration

1. **Enable Places API**: - Go to [Google Cloud Console](https://console.cloud.google.com/) - Enable "Places API" for your project - Create an API key restricted to Places API

2. **Configure API Key Restrictions**: - **Application restrictions**: HTTP referrers (websites) - Add your domain: `*.yourdomain.com/*` - Add localhost for development: `localhost/*` - **API restrictions**: Restrict to "Places API"

### 3. Environment Variables

Add these environment variables to your deployment:

```bash
# Google Maps API Key (for Places API)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Supabase Service Role Key (for cron job database writes)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cron job authentication
CRON_SECRET=your_random_secret_string

# Optional: Only refresh active venues (default: false)
REFRESH_ACTIVE_ONLY=false
```

### 4. Vercel Cron Configuration

The `vercel.json` file includes a cron job that runs nightly at 2 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-google-ratings",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 5. Set Up Cron Authentication

1. Generate a random secret for `CRON_SECRET`
2. Add it to your Vercel environment variables
3. The cron endpoint will verify this secret before running

## API Endpoints

### Get Google Rating
```
GET /api/ratings/google?venueId={venueId}&forceRefresh={0|1}
```

**Authentication**: Requires user session with venue access

**Response**:
```json
{
  "source": "google",
  "rating": 4.3,
  "ratings_count": 1204,
  "attributions": ["<span>Data © Google</span>"],
  "fetched_at": "2025-09-19T11:34:21Z",
  "cached": true
}
```

### Update Venue Place ID
```
PATCH /api/venues/{venueId}
```

**Body**:
```json
{
  "place_id": "ChIJ..."
}
```

### Google Places Search
```
GET /api/google/places-search?query={searchTerm}&type={autocomplete|findplace}
```

Used by the settings UI for business search.

## Usage

### 1. Venue Setup

1. Go to **Settings > Venue**
2. Find the **Google Reviews** card
3. Search for your business or paste Google Maps URL
4. Select your listing to link the Place ID

### 2. Display Ratings

Use the `GoogleRatingBadge` component anywhere in your app:

```jsx
import GoogleRatingBadge from './components/dashboard/GoogleRatingBadge';

<GoogleRatingBadge showAttribution={true} />
```

### 3. Monitor Costs - Check logs for monthly API call counts - Default limit: 1000 calls/day maximum - Estimated cost: <£30/month for ≤200 venues

## Cost Control - **Cache TTL**: 24 hours (configurable via `GOOGLE_RATINGS_TTL_HOURS`) - **Daily limit**: 1000 calls maximum per day - **Minimal fields**: Only requests `rating,user_ratings_total` to minimize cost - **Active venues only**: Optional setting to only refresh venues with recent feedback

## Troubleshooting

### Common Issues

1. **"Invalid Place ID" errors**: - Verify the Place ID is correct in the venue settings - Try re-linking the venue using the search function

2. **"Quota exceeded" errors**: - Check Google Cloud Console quotas - Monitor daily API usage in cron job logs

3. **Cron job failures**: - Check Vercel function logs - Verify `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`

### Monitoring - Cron job results are logged to Vercel function logs - API errors return appropriate HTTP status codes - Failed venue updates are logged with venue IDs for debugging

## Attribution Requirements

Per Google Places API terms: - Always display attribution when showing ratings - Use the `attributions` field returned by the API - The `GoogleRatingBadge` component handles this automatically

## Future Enhancements

The current implementation supports minimal fields for cost control. Future versions could add: - Review text extraction - Review reply management - TripAdvisor integration - Historical rating tracking