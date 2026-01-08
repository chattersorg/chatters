-- Add managers.venues permission for managing venue assignments
-- This permission allows managers to change which venues other managers can access

-- Insert the new permission
INSERT INTO permissions (code, name, description, category)
VALUES (
  'managers.venues',
  'Manage Venue Access',
  'Change which venues a manager can access. Only affects managers below you in the hierarchy.',
  'managers'
)
ON CONFLICT (code) DO NOTHING;

-- Add this permission to the 'manager' and 'admin' system role templates
-- (but not 'viewer' or 'editor' as they shouldn't manage venue access)

-- Add to Manager template
INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id
FROM role_templates rt, permissions p
WHERE rt.code = 'manager' AND p.code = 'managers.venues'
ON CONFLICT DO NOTHING;

-- Add to Admin template
INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id
FROM role_templates rt, permissions p
WHERE rt.code = 'admin' AND p.code = 'managers.venues'
ON CONFLICT DO NOTHING;

-- Add RLS policies for role_templates table if not already present
-- These ensure users can only modify templates in their own account

-- Enable RLS on role_templates if not already enabled
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view system and own account templates" ON role_templates;
DROP POLICY IF EXISTS "Masters can create account templates" ON role_templates;
DROP POLICY IF EXISTS "Masters can update own account templates" ON role_templates;
DROP POLICY IF EXISTS "Masters can delete own account templates" ON role_templates;

-- Create read policy: Users can see system templates and templates from their account
CREATE POLICY "Users can view system and own account templates"
ON role_templates FOR SELECT
TO authenticated
USING (
  is_system = true
  OR account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  )
);

-- Create insert policy: Only masters can create templates for their account
CREATE POLICY "Masters can create account templates"
ON role_templates FOR INSERT
TO authenticated
WITH CHECK (
  is_system = false
  AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
  )
);

-- Create update policy: Only masters can update non-system templates in their account
CREATE POLICY "Masters can update own account templates"
ON role_templates FOR UPDATE
TO authenticated
USING (
  is_system = false
  AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
  )
)
WITH CHECK (
  is_system = false
  AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
  )
);

-- Create delete policy: Only masters can delete non-system templates in their account
CREATE POLICY "Masters can delete own account templates"
ON role_templates FOR DELETE
TO authenticated
USING (
  is_system = false
  AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
  )
);

-- Also add RLS to role_template_permissions
ALTER TABLE role_template_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view template permissions" ON role_template_permissions;
DROP POLICY IF EXISTS "Masters can manage template permissions" ON role_template_permissions;

-- Create read policy for role_template_permissions
CREATE POLICY "Users can view template permissions"
ON role_template_permissions FOR SELECT
TO authenticated
USING (
  role_template_id IN (
    SELECT id FROM role_templates
    WHERE is_system = true
    OR account_id IN (SELECT account_id FROM users WHERE id = auth.uid())
  )
);

-- Create insert/update/delete policy for role_template_permissions
CREATE POLICY "Masters can manage template permissions"
ON role_template_permissions FOR ALL
TO authenticated
USING (
  role_template_id IN (
    SELECT id FROM role_templates
    WHERE is_system = false
    AND account_id IN (SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master')
  )
)
WITH CHECK (
  role_template_id IN (
    SELECT id FROM role_templates
    WHERE is_system = false
    AND account_id IN (SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master')
  )
);
