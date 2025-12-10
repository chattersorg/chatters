-- =====================================================
-- DIGITAL MENUS FEATURE
-- =====================================================
-- Adds menu functionality to Chatters:
-- 1. Menu categories and items tables
-- 2. Menu settings on venues table
-- 3. Storage bucket for PDFs and venue assets
-- 4. Menu permissions

-- =====================================================
-- 1. EXTEND VENUES TABLE FOR MENU SETTINGS
-- =====================================================
ALTER TABLE venues ADD COLUMN IF NOT EXISTS menu_type TEXT DEFAULT 'none';
-- Values: 'none', 'link', 'pdf', 'builder'

ALTER TABLE venues ADD COLUMN IF NOT EXISTS menu_url TEXT;
-- For 'link' type - external URL

ALTER TABLE venues ADD COLUMN IF NOT EXISTS menu_pdf_url TEXT;
-- For 'pdf' type - Supabase storage URL

COMMENT ON COLUMN venues.menu_type IS 'Menu display type: none, link, pdf, or builder';
COMMENT ON COLUMN venues.menu_url IS 'External menu URL when menu_type is link';
COMMENT ON COLUMN venues.menu_pdf_url IS 'Supabase storage URL when menu_type is pdf';

-- =====================================================
-- 2. MENU CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE menu_categories IS 'Menu categories for the digital menu builder (e.g., Starters, Mains, Desserts)';

-- =====================================================
-- 3. MENU ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  dietary_tags TEXT[] DEFAULT '{}',
  -- Supported tags: 'V' (Vegetarian), 'VG' (Vegan), 'GF' (Gluten Free), 'DF' (Dairy Free), 'N' (Contains Nuts)
  is_available BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE menu_items IS 'Menu items within categories for the digital menu builder';
COMMENT ON COLUMN menu_items.dietary_tags IS 'Array of dietary tags: V (Vegetarian), VG (Vegan), GF (Gluten Free), DF (Dairy Free), N (Contains Nuts)';

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_menu_categories_venue ON menu_categories(venue_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(venue_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;

-- =====================================================
-- 5. UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_menu_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS menu_categories_updated_at ON menu_categories;
CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_categories_updated_at();

DROP TRIGGER IF EXISTS menu_items_updated_at ON menu_items;
CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_items_updated_at();

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read visible menu categories and available items (for /menu/{venueId} page)
CREATE POLICY "menu_categories_public_read" ON menu_categories
  FOR SELECT USING (is_visible = true);

CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM menu_categories mc
      WHERE mc.id = menu_items.category_id
      AND mc.is_visible = true
    )
  );

-- Authenticated users can read all categories/items for venues they manage
CREATE POLICY "menu_categories_auth_read" ON menu_categories
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.venue_id = menu_categories.venue_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN venues v ON v.account_id = u.account_id
      WHERE v.id = menu_categories.venue_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'master')
    )
  );

CREATE POLICY "menu_items_auth_read" ON menu_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM menu_categories mc
      JOIN staff s ON s.venue_id = mc.venue_id
      WHERE mc.id = menu_items.category_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM menu_categories mc
      JOIN venues v ON v.id = mc.venue_id
      JOIN users u ON u.account_id = v.account_id
      WHERE mc.id = menu_items.category_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'master')
    )
  );

-- Insert/Update/Delete for venue managers
CREATE POLICY "menu_categories_manage" ON menu_categories
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.venue_id = menu_categories.venue_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN venues v ON v.account_id = u.account_id
      WHERE v.id = menu_categories.venue_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'master')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.venue_id = menu_categories.venue_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN venues v ON v.account_id = u.account_id
      WHERE v.id = menu_categories.venue_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'master')
    )
  );

CREATE POLICY "menu_items_manage" ON menu_items
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM menu_categories mc
      JOIN staff s ON s.venue_id = mc.venue_id
      WHERE mc.id = menu_items.category_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM menu_categories mc
      JOIN venues v ON v.id = mc.venue_id
      JOIN users u ON u.account_id = v.account_id
      WHERE mc.id = menu_items.category_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'master')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM menu_categories mc
      JOIN staff s ON s.venue_id = mc.venue_id
      WHERE mc.id = menu_items.category_id
      AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM menu_categories mc
      JOIN venues v ON v.id = mc.venue_id
      JOIN users u ON u.account_id = v.account_id
      WHERE mc.id = menu_items.category_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'master')
    )
  );

-- =====================================================
-- 7. STORAGE BUCKET FOR VENUE ASSETS
-- =====================================================
-- Create a unified bucket for venue assets (logos, backgrounds, menu PDFs)
-- Note: This needs to be run via Supabase dashboard or with service role
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'venue-assets',
--   'venue-assets',
--   true,
--   10485760, -- 10MB limit
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies will be added via Supabase dashboard:
-- 1. Public read access for all files
-- 2. Authenticated users can upload to their venue's folder
-- 3. Path structure: {venue_id}/logos/, {venue_id}/backgrounds/, {venue_id}/menus/

-- =====================================================
-- 8. ADD MENU PERMISSIONS
-- =====================================================
INSERT INTO permissions (code, name, description, category) VALUES
  ('menu.view', 'View Menu', 'View menu settings and items', 'menu'),
  ('menu.edit', 'Edit Menu', 'Create and edit menu categories and items', 'menu')
ON CONFLICT (code) DO NOTHING;

-- Add menu permissions to Editor, Manager, and Admin role templates
INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id
FROM role_templates rt, permissions p
WHERE rt.code = 'viewer' AND p.code = 'menu.view'
ON CONFLICT DO NOTHING;

INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id
FROM role_templates rt, permissions p
WHERE rt.code = 'editor' AND p.code IN ('menu.view', 'menu.edit')
ON CONFLICT DO NOTHING;

INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id
FROM role_templates rt, permissions p
WHERE rt.code = 'manager' AND p.code IN ('menu.view', 'menu.edit')
ON CONFLICT DO NOTHING;

INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT rt.id, p.id
FROM role_templates rt, permissions p
WHERE rt.code = 'admin' AND p.code IN ('menu.view', 'menu.edit')
ON CONFLICT DO NOTHING;
