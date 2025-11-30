-- Fix RLS policies for external_ratings and historical_ratings tables
-- These tables need to be readable by authenticated users for the dashboard

-- Enable RLS if not already enabled
ALTER TABLE external_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view external ratings  or their venues" ON external_ratings;
DROP POLICY IF EXISTS "Users can view historical ratings for their venues" ON historical_ratings;

-- Create policy for external_ratings: users can read ratings for venues they have access to
CREATE POLICY "Users can view external ratings for their venues"
ON external_ratings
FOR SELECT
USING (
  venue_id IN (
    SELECT v.id FROM venues v
    JOIN accounts a ON v.account_id = a.id
    JOIN users u ON u.account_id = a.id
    WHERE u.id = auth.uid()
  )
  OR
  venue_id IN (
    SELECT venue_id FROM staff WHERE user_id = auth.uid()
  )
);

-- Create policy for historical_ratings: users can read ratings for venues they have access to
CREATE POLICY "Users can view historical ratings for their venues"
ON historical_ratings
FOR SELECT
USING ( 
  venue_id IN (
    SELECT v.id FROM venues v
    JOIN accounts a ON v.account_id = a.id
    JOIN users u ON u.account_id = a.id
    WHERE u.id = auth.uid()
  )
  OR
  venue_id IN (
    SELECT venue_id FROM staff WHERE user_id = auth.uid()
  )
);
