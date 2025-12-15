# Soft Delete Setup for Managers

## Overview

Managers can now be "deleted" without losing their data. When a manager is deleted: - They are marked as deleted (`deleted_at` timestamp set) - All their data is preserved (staff records, feedback, sessions) - They disappear from active manager listings - They can be recovered within 14 days - After 14 days, a cleanup script permanently deletes them

## Setup Required

### 1. Add Soft Delete Columns to Database

You need to run the migration to add `deleted_at` and `deleted_by` columns to the `users` table.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Add soft delete columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

-- Create index for deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Add comments
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft-deleted. NULL means user is active. Users can be recovered within 14 days.';
COMMENT ON COLUMN users.deleted_by IS 'ID of the user who deleted this user';
```

5. Click **Run**
6. Verify the columns were added in **Table Editor** > **users** table

**Option B: Via Supabase CLI**

```bash
supabase db push
```

This will push the migration file located at:
`supabase/migrations/20251102_add_soft_delete_to_users.sql`

### 2. Verify Migration

After running the migration, verify it worked:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('deleted_at', 'deleted_by');
```

You should see: - `deleted_at` - timestamp with time zone - YES (nullable) - `deleted_by` - uuid - YES (nullable)

## How It Works

### Deleting a Manager

When you click "Delete" on a manager:

1. API sets `deleted_at` to current timestamp
2. API sets `deleted_by` to your user ID
3. Manager removed from active listings immediately
4. Any pending invitations for that email are rejected
5. Staff records remain intact (for historical data)
6. User receives message: "Manager deleted successfully. They can be recovered within 14 days."

### Recovery (Manual Process)

To recover a deleted manager within 14 days:

```sql
-- Find deleted managers
SELECT id, email, first_name, last_name, deleted_at
FROM users
WHERE role = 'manager'
AND deleted_at IS NOT NULL
AND deleted_at > NOW() - INTERVAL '14 days';

-- Recover a specific manager
UPDATE users
SET deleted_at = NULL, deleted_by = NULL
WHERE email = 'manager@example.com';
```

### Permanent Deletion (After 14 Days)

Run the cleanup script manually or as a cron job:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/cleanup-deleted-managers.js
```

This script: - Finds managers deleted more than 14 days ago - Permanently deletes their staff records - Permanently deletes their user record - Permanently deletes their auth record - Logs all deletions

**Recommended**: Set up a weekly cron job to run this script automatically.

## Benefits

1. **Mistake Protection** - Accidental deletions can be recovered
2. **Data Preservation** - All feedback and session data preserved
3. **Audit Trail** - Track who deleted whom and when
4. **Historical Records** - Staff records remain for reporting
5. **Graceful Degradation** - 14-day grace period for recovery

## API Endpoints

### Delete Manager (Soft Delete)
```
POST /api/admin/delete-manager
Authorization: Bearer <token>
Body: { "managerId": "uuid" }
```

### Resend Invitation
```
POST /api/admin/resend-invitation
Authorization: Bearer <token>
Body: { "email": "manager@example.com" }
```

## Database Schema

```sql
-- users table (relevant columns)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  account_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,  -- NULL = active, timestamp = deleted
  deleted_by UUID REFERENCES users(id),  -- Who deleted this user
  ...
);

-- Index for performance
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

## Queries

### Find Active Managers
```sql
SELECT * FROM users
WHERE role = 'manager'
AND deleted_at IS NULL;
```

### Find Recently Deleted Managers
```sql
SELECT email, deleted_at, deleted_by
FROM users
WHERE role = 'manager'
AND deleted_at IS NOT NULL
AND deleted_at > NOW() - INTERVAL '14 days';
```

### Find Managers Ready for Permanent Deletion
```sql
SELECT email, deleted_at
FROM users
WHERE role = 'manager'
AND deleted_at IS NOT NULL
AND deleted_at < NOW() - INTERVAL '14 days';
```

## Troubleshooting

### Migration fails with "column already exists"
This is fine - the migration uses `IF NOT EXISTS` so it's safe to run multiple times.

### Deleted managers still showing up
Make sure the frontend code is filtering by `deleted_at IS NULL`:
```javascript
.is('deleted_at', null)
```

### Want to permanently delete immediately
If you need to bypass the 14-day grace period, manually delete using SQL:
```sql
-- Use with caution!
DELETE FROM staff WHERE user_id = 'manager-uuid';
DELETE FROM users WHERE id = 'manager-uuid';
```

## Future Enhancements

Potential improvements:
1. **Recovery UI** - Add button to recover deleted managers in dashboard
2. **Automatic Cleanup** - Vercel cron job to run cleanup script weekly
3. **Email Notification** - Email manager when deleted and before permanent deletion
4. **Soft Delete for Venues** - Extend soft-delete to venue records
