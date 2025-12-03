-- =====================================================
-- GRANULAR PERMISSIONS SYSTEM
-- =====================================================
-- This migration creates a flexible permissions system where:
-- 1. Permissions are individual capabilities (e.g., 'feedback.view', 'staff.edit')
-- 2. Role templates are predefined sets of permissions (e.g., 'Viewer', 'Manager', 'Admin')
-- 3. Users can be assigned a role template OR individual permissions
-- 4. Permissions can be scoped to account-wide or venue-specific

-- =====================================================
-- 1. PERMISSIONS TABLE - Define all available permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- e.g., 'feedback.view', 'staff.edit'
  name TEXT NOT NULL,                   -- Human-readable name
  description TEXT,                     -- Description of what this permission allows
  category TEXT NOT NULL,               -- Grouping: 'feedback', 'staff', 'reports', 'settings', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (code, name, description, category) VALUES
  -- Feedback permissions
  ('feedback.view', 'View Feedback', 'View customer feedback and responses', 'feedback'),
  ('feedback.respond', 'Respond to Feedback', 'Reply to customer feedback', 'feedback'),
  ('feedback.delete', 'Delete Feedback', 'Delete feedback entries', 'feedback'),
  ('feedback.export', 'Export Feedback', 'Export feedback data to CSV/Excel', 'feedback'),

  -- Questions permissions
  ('questions.view', 'View Questions', 'View feedback questions', 'questions'),
  ('questions.edit', 'Edit Questions', 'Create, edit, and delete feedback questions', 'questions'),

  -- Reports permissions
  ('reports.view', 'View Reports', 'Access reporting dashboards', 'reports'),
  ('reports.export', 'Export Reports', 'Export report data', 'reports'),
  ('reports.create', 'Create Custom Reports', 'Create and save custom reports', 'reports'),

  -- NPS permissions
  ('nps.view', 'View NPS', 'View NPS scores and submissions', 'nps'),
  ('nps.export', 'Export NPS', 'Export NPS data', 'nps'),

  -- Staff permissions
  ('staff.view', 'View Staff', 'View employee list and details', 'staff'),
  ('staff.edit', 'Edit Staff', 'Add, edit, and remove employees', 'staff'),
  ('staff.leaderboard', 'View Leaderboard', 'Access staff leaderboard', 'staff'),
  ('staff.recognition', 'Manage Recognition', 'Give and manage staff recognition', 'staff'),

  -- Manager permissions
  ('managers.view', 'View Managers', 'View manager list', 'managers'),
  ('managers.invite', 'Invite Managers', 'Invite new managers to the venue', 'managers'),
  ('managers.remove', 'Remove Managers', 'Remove managers from the venue', 'managers'),
  ('managers.permissions', 'Manage Permissions', 'Change manager permissions', 'managers'),

  -- Venue settings permissions
  ('venue.view', 'View Venue Settings', 'View venue configuration', 'venue'),
  ('venue.edit', 'Edit Venue Settings', 'Edit venue details and settings', 'venue'),
  ('venue.branding', 'Edit Branding', 'Customize venue branding and colors', 'venue'),
  ('venue.integrations', 'Manage Integrations', 'Connect and manage third-party integrations', 'venue'),

  -- Floor plan permissions
  ('floorplan.view', 'View Floor Plan', 'View the venue floor plan', 'floorplan'),
  ('floorplan.edit', 'Edit Floor Plan', 'Edit table layout and zones', 'floorplan'),

  -- QR Code permissions
  ('qr.view', 'View QR Codes', 'View and download QR codes', 'qr'),
  ('qr.generate', 'Generate QR Codes', 'Generate new QR codes', 'qr'),

  -- AI features permissions
  ('ai.insights', 'View AI Insights', 'Access AI-powered insights', 'ai'),
  ('ai.chat', 'Use AI Chat', 'Use the AI chat assistant', 'ai'),
  ('ai.regenerate', 'Regenerate AI Insights', 'Request new AI analysis', 'ai'),

  -- Reviews permissions
  ('reviews.view', 'View Reviews', 'View external reviews (Google, etc.)', 'reviews'),
  ('reviews.respond', 'Respond to Reviews', 'Reply to external reviews', 'reviews'),

  -- Billing permissions (account-level)
  ('billing.view', 'View Billing', 'View subscription and billing info', 'billing'),
  ('billing.manage', 'Manage Billing', 'Update payment methods and subscription', 'billing'),

  -- Multi-venue permissions
  ('multivenue.view', 'View All Venues', 'Access multi-venue overview', 'multivenue'),
  ('multivenue.compare', 'Compare Venues', 'Compare performance across venues', 'multivenue')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. ROLE TEMPLATES TABLE - Predefined permission sets
-- =====================================================
CREATE TABLE IF NOT EXISTS role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,            -- e.g., 'viewer', 'manager', 'admin'
  name TEXT NOT NULL,                   -- Display name
  description TEXT,                     -- What this role is for
  is_system BOOLEAN DEFAULT FALSE,      -- System roles can't be deleted
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,  -- NULL = system template, set = custom template
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert system role templates
INSERT INTO role_templates (code, name, description, is_system, account_id) VALUES
  ('viewer', 'Viewer', 'Read-only access to feedback and reports', TRUE, NULL),
  ('editor', 'Editor', 'Can respond to feedback and manage staff', TRUE, NULL),
  ('manager', 'Manager', 'Full venue management except billing and permissions', TRUE, NULL),
  ('admin', 'Admin', 'Full access including billing and user management', TRUE, NULL)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 3. ROLE TEMPLATE PERMISSIONS - Link templates to permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS role_template_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_template_id UUID NOT NULL REFERENCES role_templates(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_template_id, permission_id)
);

-- Assign permissions to system role templates
-- VIEWER: Read-only access
INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id FROM role_templates rt, permissions p
WHERE rt.code = 'viewer' AND p.code IN (
  'feedback.view', 'questions.view', 'reports.view', 'nps.view',
  'staff.view', 'staff.leaderboard', 'venue.view', 'floorplan.view',
  'qr.view', 'ai.insights', 'reviews.view', 'multivenue.view'
)
ON CONFLICT DO NOTHING;

-- EDITOR: Read + respond/edit content
INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id FROM role_templates rt, permissions p
WHERE rt.code = 'editor' AND p.code IN (
  'feedback.view', 'feedback.respond', 'feedback.export',
  'questions.view', 'reports.view', 'reports.export', 'nps.view', 'nps.export',
  'staff.view', 'staff.edit', 'staff.leaderboard', 'staff.recognition',
  'venue.view', 'floorplan.view', 'qr.view', 'qr.generate',
  'ai.insights', 'ai.chat', 'reviews.view', 'reviews.respond', 'multivenue.view'
)
ON CONFLICT DO NOTHING;

-- MANAGER: Full venue management
INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id FROM role_templates rt, permissions p
WHERE rt.code = 'manager' AND p.code IN (
  'feedback.view', 'feedback.respond', 'feedback.delete', 'feedback.export',
  'questions.view', 'questions.edit',
  'reports.view', 'reports.export', 'reports.create',
  'nps.view', 'nps.export',
  'staff.view', 'staff.edit', 'staff.leaderboard', 'staff.recognition',
  'managers.view', 'managers.invite',
  'venue.view', 'venue.edit', 'venue.branding', 'venue.integrations',
  'floorplan.view', 'floorplan.edit',
  'qr.view', 'qr.generate',
  'ai.insights', 'ai.chat', 'ai.regenerate',
  'reviews.view', 'reviews.respond',
  'multivenue.view', 'multivenue.compare'
)
ON CONFLICT DO NOTHING;

-- ADMIN: Everything
INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id FROM role_templates rt, permissions p
WHERE rt.code = 'admin'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. USER PERMISSIONS TABLE - Assign permissions to users
-- =====================================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,  -- NULL = account-wide

  -- Either use a role template OR individual permissions (not both)
  role_template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL,

  -- For granular permissions (when not using a template)
  -- This is a JSONB array of permission codes for flexibility
  custom_permissions TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Ensure unique assignment per user per scope
  UNIQUE(user_id, account_id, venue_id)
);

-- =====================================================
-- 5. HELPER FUNCTION - Get user's effective permissions
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_venue_id UUID DEFAULT NULL
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

  -- Get permissions from user_permissions table
  -- Check venue-specific first, then account-wide
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
    AND (
      -- Venue-specific takes precedence
      (p_venue_id IS NOT NULL AND up.venue_id = p_venue_id)
      OR
      -- Fall back to account-wide
      (up.venue_id IS NULL AND NOT EXISTS (
        SELECT 1 FROM user_permissions up2
        WHERE up2.user_id = p_user_id
        AND up2.account_id = v_account_id
        AND up2.venue_id = p_venue_id
      ))
    )
  ORDER BY up.venue_id NULLS LAST
  LIMIT 1;

  -- If no permissions found, return empty array
  RETURN COALESCE(v_permissions, '{}'::TEXT[]);
END;
$$;

-- =====================================================
-- 6. HELPER FUNCTION - Check if user has permission
-- =====================================================
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_code TEXT,
  p_venue_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN p_permission_code = ANY(get_user_permissions(p_user_id, p_venue_id));
END;
$$;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_template_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions table: Everyone can read
CREATE POLICY "permissions_select" ON permissions FOR SELECT USING (true);

-- Role templates: Everyone can read system templates, account members can read their custom templates
CREATE POLICY "role_templates_select" ON role_templates FOR SELECT USING (
  is_system = true
  OR account_id IN (SELECT account_id FROM users WHERE id = auth.uid())
);

-- Role templates: Only masters/admins can create custom templates
CREATE POLICY "role_templates_insert" ON role_templates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
);

-- Role templates: Only masters/admins can update their custom templates
CREATE POLICY "role_templates_update" ON role_templates FOR UPDATE USING (
  is_system = false
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
);

-- Role templates: Only masters/admins can delete their custom templates
CREATE POLICY "role_templates_delete" ON role_templates FOR DELETE USING (
  is_system = false
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
);

-- Role template permissions: Same as role_templates
CREATE POLICY "role_template_permissions_select" ON role_template_permissions FOR SELECT USING (
  role_template_id IN (
    SELECT id FROM role_templates WHERE is_system = true
    OR account_id IN (SELECT account_id FROM users WHERE id = auth.uid())
  )
);

CREATE POLICY "role_template_permissions_insert" ON role_template_permissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND role_template_id IN (
    SELECT id FROM role_templates
    WHERE is_system = false
    AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
  )
);

CREATE POLICY "role_template_permissions_delete" ON role_template_permissions FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND role_template_id IN (
    SELECT id FROM role_templates
    WHERE is_system = false
    AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
  )
);

-- User permissions: Masters/admins can manage, users can view their own
CREATE POLICY "user_permissions_select" ON user_permissions FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master') AND account_id = user_permissions.account_id)
);

CREATE POLICY "user_permissions_insert" ON user_permissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "user_permissions_update" ON user_permissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "user_permissions_delete" ON user_permissions FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'master'))
  AND account_id = (SELECT account_id FROM users WHERE id = auth.uid())
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_role_templates_account ON role_templates(account_id);
CREATE INDEX IF NOT EXISTS idx_role_template_permissions_template ON role_template_permissions(role_template_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_account ON user_permissions(account_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_venue ON user_permissions(venue_id);

-- =====================================================
-- 9. TRIGGER TO UPDATE updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_permissions_updated_at();
