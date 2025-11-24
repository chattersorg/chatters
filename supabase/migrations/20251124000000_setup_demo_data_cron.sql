-- Setup daily demo data generation cron job
-- Runs at 4am UTC every day to populate yesterday's demo data

-- Enable pg_cron and pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the demo data generation job to run at 4am UTC daily
SELECT cron.schedule(
  'generate-demo-data-daily',
  '0 4 * * *',  -- 4am UTC every day
  $$
  SELECT net.http_post(
    url := 'https://xjznwqvwlooarskroogf.supabase.co/functions/v1/generate-demo-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
