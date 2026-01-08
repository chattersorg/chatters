-- Venue Groups Feature
-- Allows grouping venues together (e.g., "London Venues", "Birmingham Venues")
-- for easier manager assignment

-- Create venue_groups table
CREATE TABLE IF NOT EXISTS venue_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create venue_group_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS venue_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_group_id UUID NOT NULL REFERENCES venue_groups(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_group_id, venue_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_groups_account_id ON venue_groups(account_id);
CREATE INDEX IF NOT EXISTS idx_venue_group_members_group_id ON venue_group_members(venue_group_id);
CREATE INDEX IF NOT EXISTS idx_venue_group_members_venue_id ON venue_group_members(venue_id);

-- Enable RLS
ALTER TABLE venue_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_groups
-- Masters can manage groups for their account
CREATE POLICY "Masters can view their account venue groups"
  ON venue_groups FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Masters can insert venue groups"
  ON venue_groups FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Masters can update their account venue groups"
  ON venue_groups FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
    )
  );

CREATE POLICY "Masters can delete their account venue groups"
  ON venue_groups FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
    )
  );

-- RLS Policies for venue_group_members
CREATE POLICY "Masters can view venue group members"
  ON venue_group_members FOR SELECT
  USING (
    venue_group_id IN (
      SELECT id FROM venue_groups WHERE account_id IN (
        SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
      )
    )
  );

CREATE POLICY "Masters can insert venue group members"
  ON venue_group_members FOR INSERT
  WITH CHECK (
    venue_group_id IN (
      SELECT id FROM venue_groups WHERE account_id IN (
        SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
      )
    )
  );

CREATE POLICY "Masters can delete venue group members"
  ON venue_group_members FOR DELETE
  USING (
    venue_group_id IN (
      SELECT id FROM venue_groups WHERE account_id IN (
        SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
      )
    )
  );

-- Add updated_at trigger for venue_groups
CREATE OR REPLACE FUNCTION update_venue_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_groups_updated_at
  BEFORE UPDATE ON venue_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_groups_updated_at();
