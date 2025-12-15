# Fix Manager Invitation 500 Error

## Problem

When clicking "Add Manager", you get a 500 error:
```
Failed to load resource: the server responded with a status of 500 ()
/api/admin/invite-manager:1
```

## Root Cause

The `manager_invitations` table **does not exist** in your Supabase database. The API at `/api/admin/invite-manager.js` is trying to insert into this table, but it doesn't exist yet.

## Solution

You need to create the `manager_invitations` table in your Supabase database.

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration SQL

Copy and paste this SQL into the SQL Editor and click "Run":

```sql
-- Create manager_invitations table for tracking manager invitation flow
CREATE TABLE IF NOT EXISTS manager_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    venue_ids UUID[] NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manager_invitations_email ON manager_invitations(email);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_token ON manager_invitations(token);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_account_id ON manager_invitations(account_id);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_status ON manager_invitations(status);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_expires_at ON manager_invitations(expires_at);

-- Add RLS policies
ALTER TABLE manager_invitations ENABLE ROW LEVEL SECURITY;

-- Master users can view invitations for their account
CREATE POLICY "Master users can view their account invitations"
    ON manager_invitations FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Master users can create invitations for their account
CREATE POLICY "Master users can create invitations"
    ON manager_invitations FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Master users can update invitations for their account
CREATE POLICY "Master users can update their account invitations"
    ON manager_invitations FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Master users can delete invitations for their account
CREATE POLICY "Master users can delete their account invitations"
    ON manager_invitations FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM users WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Admin users have full access
CREATE POLICY "Admin users have full access to invitations"
    ON manager_invitations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add comment
COMMENT ON TABLE manager_invitations IS 'Tracks manager invitation lifecycle from creation to acceptance';
```

### Step 3: Verify Table Was Created

After running the SQL, verify the table exists:

1. Go to "Table Editor" in your Supabase Dashboard
2. You should see `manager_invitations` in the list of tables
3. Check that it has these columns: - id (UUID) - email (TEXT) - first_name (TEXT) - last_name (TEXT) - invited_by (UUID) - account_id (UUID) - venue_ids (UUID[]) - token (TEXT) - expires_at (TIMESTAMP) - status (TEXT) - created_at (TIMESTAMP) - accepted_at (TIMESTAMP) - updated_at (TIMESTAMP)

### Step 4: Test Adding a Manager

1. Go to your deployed dev site
2. Navigate to Staff > Managers
3. Click "Add Manager"
4. Fill in the form and submit
5. It should now work without the 500 error!

## What This Table Does

The `manager_invitations` table tracks the complete manager invitation lifecycle:

1. **Master user** creates invitation → entry created with status='pending'
2. **Invitation email** sent with unique token
3. **Manager** clicks link and accepts → status='accepted', user + staff records created
4. **Invitation expires** after 7 days → can be manually set to status='expired'

## Next Steps

After creating the table, you'll need to:
1. Implement the invitation acceptance page (`/accept-invitation?token=...`)
2. Set up email sending for invitation notifications
3. Create a cron job to expire old invitations

## Migration File Location

The SQL migration is also saved at:
`supabase/migrations/20251101_create_manager_invitations_table.sql`

You can use this file for future reference or to recreate the table in other environments.
