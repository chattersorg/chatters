-- Add reports_to field to users table for manager hierarchy
-- This is separate from invited_by - invited_by tracks who sent the invite,
-- reports_to tracks their position in the org hierarchy

ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES users(id);

-- Add reports_to to manager_invitations so it can be set during invite
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS reports_to UUID;

-- Create index for faster hierarchy queries
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON users(reports_to);

-- Backfill existing managers: set reports_to = invited_by for existing records
-- This maintains the current hierarchy
UPDATE users
SET reports_to = invited_by
WHERE role = 'manager'
  AND invited_by IS NOT NULL
  AND reports_to IS NULL;
