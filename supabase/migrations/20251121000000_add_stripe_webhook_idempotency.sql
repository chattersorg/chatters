-- Add webhook idempotency table to prevent duplicate event processing
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  customer_id TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

-- Index for cleanup queries (to remove old events)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at ON stripe_webhook_events(processed_at);

-- Add dunning tracking columns to accounts table
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Comment on new columns
COMMENT ON TABLE stripe_webhook_events IS 'Stores processed Stripe webhook event IDs for idempotency';
COMMENT ON COLUMN stripe_webhook_events.event_id IS 'Stripe event ID (e.g., evt_xxx)';
COMMENT ON COLUMN stripe_webhook_events.event_type IS 'Stripe event type (e.g., invoice.payment_failed)';
COMMENT ON COLUMN stripe_webhook_events.customer_id IS 'Stripe customer ID associated with the event';

COMMENT ON COLUMN accounts.payment_failed_at IS 'Timestamp of first payment failure (for dunning)';
COMMENT ON COLUMN accounts.payment_failure_count IS 'Number of payment retry attempts';
COMMENT ON COLUMN accounts.last_payment_error IS 'Most recent payment error message';
COMMENT ON COLUMN accounts.cancel_at_period_end IS 'Whether subscription will cancel at period end';

-- Optional: Clean up old webhook events (older than 30 days)
-- You can run this periodically or create a scheduled function
-- DELETE FROM stripe_webhook_events WHERE processed_at < NOW() - INTERVAL '30 days';
