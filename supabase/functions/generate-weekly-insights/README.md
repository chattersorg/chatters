# Generate Weekly Insights Edge Function

This Edge Function runs on a cron schedule (every Sunday at 11 PM UTC) to automatically generate AI-powered weekly insights for all venues.

## Setup

### 1. Deploy the Function

```bash
npx supabase functions deploy generate-weekly-insights
```

### 2. Verify Environment Variables

The function uses these variables (already configured in Supabase):

- `SUPABASE_URL` - Automatically set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically set by Supabase
- `ANTHROPIC_API_KEY` - Must be set as a secret

If `ANTHROPIC_API_KEY` isn't set:

```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Set Up Cron Job

In your Supabase dashboard, go to Database > Extensions and enable `pg_cron` and `pg_net`.

Then run this SQL to create the weekly cron job:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the function to run every Sunday at 11 PM UTC
SELECT cron.schedule(
  'generate-weekly-ai-insights',
  '0 23 * * 0',  -- At 23:00 on Sunday
  $$
  SELECT
    net.http_post(
      url:='https://xjznwqvwlooarskroogf.supabase.co/functions/v1/generate-weekly-insights',
      headers:=jsonb_build_object(
        'Content-Type','application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### 4. Store Service Role Key (if not already done)

```sql
-- Store service role key for cron job authentication
-- Get this from your Supabase dashboard > Settings > API
ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'your_service_role_key';
```

## Testing

Test the function manually:

```bash
npx supabase functions invoke generate-weekly-insights --method POST
```

Or test with curl:

```bash
curl -X POST https://xjznwqvwlooarskroogf.supabase.co/functions/v1/generate-weekly-insights \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Monitoring

Check cron job status:

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View recent job runs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## How It Works

1. Function runs every Sunday at 11 PM UTC (ready for Monday morning)
2. Queries all venues in the system
3. For each venue:
   - Checks if insight already exists for the current week
   - Fetches feedback and NPS data for the week (Monday-Sunday)
   - Calls Anthropic Claude API to generate insights
   - Saves insights to `ai_insights` table with `week_start` column
4. Returns summary of processed, skipped, and failed venues

## Weekly Schedule

- **When:** Every Sunday at 11:00 PM UTC
- **Coverage:** Monday to Sunday of the current week
- **Format:** `week_start` is always the Monday of the week

## Troubleshooting

### Function not running

1. Check if pg_cron extension is enabled
2. Verify the cron job exists: `SELECT * FROM cron.job;`
3. Check job run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`

### Missing insights

1. Venue may have no feedback data for the week (function skips these)
2. Check function logs in Supabase dashboard > Edge Functions > Logs

### API errors

1. Verify ANTHROPIC_API_KEY is set correctly
2. Check API rate limits
3. Review function logs for specific error messages
