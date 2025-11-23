-- Add week_start column to ai_insights for weekly tracking
-- This enables automatic weekly AI insight generation

-- Add week_start column if it doesn't exist
ALTER TABLE ai_insights
ADD COLUMN IF NOT EXISTS week_start date;

-- Create index for efficient weekly queries
CREATE INDEX IF NOT EXISTS idx_ai_insights_venue_week
ON ai_insights (venue_id, week_start DESC);

-- Update existing insights to set week_start based on date_from
UPDATE ai_insights
SET week_start = date_trunc('week', date_from::date)::date
WHERE week_start IS NULL AND date_from IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN ai_insights.week_start IS 'Monday of the week this insight covers - used for weekly auto-generation';
