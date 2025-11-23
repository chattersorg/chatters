-- Weekly AI Insights Cron Job Setup
-- This migration documents the cron setup requirement

-- IMPORTANT: pg_cron must be enabled manually in Supabase dashboard
-- Go to Database > Extensions and enable both pg_cron and pg_net

-- The cron job should be created via SQL Editor in Supabase dashboard
-- after deploying the generate-weekly-insights edge function.

-- See supabase/functions/generate-weekly-insights/README.md for full setup instructions.

-- SQL to create the cron job (run in Supabase SQL Editor):
/*
SELECT cron.schedule(
  'generate-weekly-ai-insights',
  '0 23 * * 0',  -- Every Sunday at 23:00 UTC
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
*/

-- Placeholder to mark this migration as applied
SELECT 1;
