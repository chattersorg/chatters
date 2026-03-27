-- Add master_only flag to permissions table
-- This flag indicates permissions that can only be assigned by master users
-- Managers cannot assign these permissions to their subordinates

-- Add the column if it doesn't exist
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS master_only BOOLEAN DEFAULT FALSE;

-- Mark billing permissions as master-only
UPDATE permissions SET master_only = TRUE WHERE code LIKE 'billing.%';

-- Verify the changes
SELECT code, name, category, master_only FROM permissions WHERE master_only = TRUE;
