-- Migration: Add Manager Hierarchy Support
-- This adds the invited_by column to track who invited each manager

-- Add invited_by column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Add index for efficient hierarchy queries
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

-- Migrate existing managers: Set invited_by to the master user of their account
-- This makes all existing managers direct reports of the account owner
UPDATE users u
SET invited_by = (
  SELECT m.id
  FROM users m
  WHERE m.account_id = u.account_id
    AND m.role = 'master'
  LIMIT 1
)
WHERE u.role = 'manager'
  AND u.invited_by IS NULL;

-- Create a function to check if user X can manage user Y
-- Returns true if:
-- 1. X is a master/admin (can manage anyone in their account)
-- 2. X invited Y (directly or somewhere in the invitation chain)
CREATE OR REPLACE FUNCTION can_manage_user(manager_id UUID, target_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  manager_role TEXT;
  manager_account UUID;
  target_account UUID;
BEGIN
  -- Get manager's role and account
  SELECT role, account_id INTO manager_role, manager_account
  FROM users WHERE id = manager_id;

  -- Get target's account
  SELECT account_id INTO target_account
  FROM users WHERE id = target_id;

  -- Must be same account
  IF manager_account != target_account THEN
    RETURN FALSE;
  END IF;

  -- Admin can manage anyone
  IF manager_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Master can manage anyone in their account
  IF manager_role = 'master' THEN
    RETURN TRUE;
  END IF;

  -- Check if manager invited target (recursive up the chain)
  -- This means: walk up from target's invited_by until we find manager_id
  IF EXISTS (
    WITH RECURSIVE invitation_chain AS (
      SELECT id, invited_by FROM users WHERE id = target_id
      UNION ALL
      SELECT u.id, u.invited_by
      FROM users u
      INNER JOIN invitation_chain ic ON u.id = ic.invited_by
    )
    SELECT 1 FROM invitation_chain WHERE invited_by = manager_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- No other criteria - venue scope alone is not enough
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all managers a user can see
CREATE OR REPLACE FUNCTION get_manageable_users(viewer_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  invited_by UUID,
  created_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  venue_ids UUID[],
  venue_names TEXT[]
) AS $$
DECLARE
  viewer_role TEXT;
  viewer_account UUID;
BEGIN
  -- Get viewer's role and account
  SELECT u.role, u.account_id INTO viewer_role, viewer_account
  FROM users u WHERE u.id = viewer_id;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.role,
    u.invited_by,
    u.created_at,
    COALESCE(
      (SELECT s.first_name FROM staff s WHERE s.user_id = u.id LIMIT 1),
      split_part(u.email, '@', 1)
    ) as first_name,
    COALESCE(
      (SELECT s.last_name FROM staff s WHERE s.user_id = u.id LIMIT 1),
      ''
    ) as last_name,
    ARRAY_AGG(DISTINCT s.venue_id) FILTER (WHERE s.venue_id IS NOT NULL) as venue_ids,
    ARRAY_AGG(DISTINCT v.name) FILTER (WHERE v.name IS NOT NULL) as venue_names
  FROM users u
  LEFT JOIN staff s ON u.id = s.user_id
  LEFT JOIN venues v ON s.venue_id = v.id
  WHERE u.account_id = viewer_account
    AND u.role = 'manager'
    AND can_manage_user(viewer_id, u.id)
  GROUP BY u.id, u.email, u.role, u.invited_by, u.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON COLUMN users.invited_by IS 'The user who invited this manager. Used for hierarchy management.';
COMMENT ON FUNCTION can_manage_user IS 'Checks if manager_id can manage target_id based on invitation chain. Masters/admins can manage anyone in their account. Managers can only manage people they invited.';
COMMENT ON FUNCTION get_manageable_users IS 'Returns all managers that the viewer can see/manage.';
