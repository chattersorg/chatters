-- =====================================================
-- REMOVE VENUE-SPECIFIC PERMISSIONS
-- =====================================================
-- This migration removes venue-specific permissions and makes
-- all permissions account-wide only.

-- 1. Drop the venue_id index
DROP INDEX IF EXISTS idx_user_permissions_venue;

-- 2. Drop the unique constraint that includes venue_id
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_id_account_id_venue_id_key;

-- 3. Add new unique constraint without venue_id
ALTER TABLE user_permissions ADD CONSTRAINT user_permissions_user_id_account_id_key UNIQUE (user_id, account_id);

-- 4. Drop the venue_id column
ALTER TABLE user_permissions DROP COLUMN IF EXISTS venue_id;

-- 5. Update the get_user_permissions function to not use venue_id
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_venue_id UUID DEFAULT NULL  -- Kept for backwards compatibility but ignored
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permissions TEXT[];
  v_account_id UUID;
BEGIN
  -- Get user's account_id
  SELECT account_id INTO v_account_id FROM users WHERE id = p_user_id;

  -- If user is admin role, return all permissions
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'admin') THEN
    RETURN (SELECT ARRAY_AGG(code) FROM permissions);
  END IF;

  -- If user is master role, return admin template permissions
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'master') THEN
    RETURN (
      SELECT ARRAY_AGG(DISTINCT p.code)
      FROM role_templates rt
      JOIN role_template_permissions rtp ON rtp.role_template_id = rt.id
      JOIN permissions p ON p.id = rtp.permission_id
      WHERE rt.code = 'admin'
    );
  END IF;

  -- Get permissions from user_permissions table (account-wide only)
  SELECT
    COALESCE(
      -- If using role template, get those permissions
      CASE WHEN up.role_template_id IS NOT NULL THEN
        (SELECT ARRAY_AGG(DISTINCT p.code)
         FROM role_template_permissions rtp
         JOIN permissions p ON p.id = rtp.permission_id
         WHERE rtp.role_template_id = up.role_template_id)
      ELSE
        -- Otherwise use custom permissions
        up.custom_permissions
      END,
      '{}'::TEXT[]
    )
  INTO v_permissions
  FROM user_permissions up
  WHERE up.user_id = p_user_id
    AND up.account_id = v_account_id
  LIMIT 1;

  -- If no permissions found, return empty array
  RETURN COALESCE(v_permissions, '{}'::TEXT[]);
END;
$$;

-- 6. Update user_has_permission function (unchanged but re-created for consistency)
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_code TEXT,
  p_venue_id UUID DEFAULT NULL  -- Kept for backwards compatibility but ignored
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN p_permission_code = ANY(get_user_permissions(p_user_id, p_venue_id));
END;
$$;
