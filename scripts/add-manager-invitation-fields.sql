-- Migration: Add phone, date_of_birth, and permission_template_id to manager_invitations table
-- Run this in Supabase SQL Editor

-- Add phone column
ALTER TABLE manager_invitations
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add date_of_birth column
ALTER TABLE manager_invitations
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add permission_template_id column (references role_templates)
ALTER TABLE manager_invitations
ADD COLUMN IF NOT EXISTS permission_template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL;

-- Also ensure users table has phone and date_of_birth columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'manager_invitations'
AND column_name IN ('phone', 'date_of_birth', 'permission_template_id');
