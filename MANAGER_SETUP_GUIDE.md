# Manager Setup Guide

## Current Situation

You have **7 orphaned manager accounts** that were created outside the proper invitation flow. They exist in the `users` table with `role: 'manager'` but have no entries in the `staff` table, which means: - They can't access any venues - They don't appear in the Managers UI - They can't log in successfully to the dashboard

### Orphaned Managers - mattjj6@gmail.com - Matthewjjackson@me.com - luke-vb1@gmail.com - bon.mar69@pornhub.com - hh@gg.com - will.smith738@yahoo.com - luke_vb1@outlook.com

### Your Venues - The Dunn Inn - The Fox - The Lions Head Pub

## Proper Manager Setup Flow

### How Managers Should Be Created

1. **Master user** goes to Staff > Managers
2. Clicks "Add Manager" button
3. Fills in: - First Name - Last Name - Email - Selects one or more venues
4. System creates: - Entry in `manager_invitations` table - Sends invitation email to manager
5. **Manager** receives email and clicks invitation link
6. Manager sets their password
7. System creates: - User record in `users` table with `role: 'manager'` - Staff records in `staff` table linking them to selected venues

### What Makes a Manager "Properly Set Up"

A properly set up manager has: - ✅ User record in `users` table - ✅ One or more records in `staff` table linking them to venues - ✅ Password set (can log in)

## Cleanup Options

### Option 1: Clean Start (Recommended)

Delete all orphaned managers and start fresh with proper invitations.

**Steps:**

1. Get your Supabase service role key: - Go to Supabase Dashboard - Settings > API > Project API Keys - Copy the `service_role` key (NOT the anon key)

2. Run the deletion script:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here node scripts/delete-orphaned-managers.js
   ```

3. Add managers properly through the dashboard: - Go to my.getchatters.com/staff/managers - Click "Add Manager" - Fill in details and select venues - Manager will receive an invitation email

### Option 2: Manual Deletion via UI

If you can somehow access the managers in the UI (they might show up in a different view), you can delete them one by one through the dashboard.

### Option 3: Create Staff Records for Existing Managers

**⚠️ Not Recommended** - These managers won't have proper invitation records and may not have set their passwords correctly.

If you still want to link them to venues, you would need to manually insert `staff` records.

## Verification

After cleanup, verify everything is working:

```bash
# Check for orphaned managers (should return 0)
node scripts/cleanup-orphaned-managers.js

# Check your database
# Managers should appear in: my.getchatters.com/staff/managers
```

## Adding New Managers Going Forward

Always use the "Add Manager" button in the dashboard at: - my.getchatters.com/staff/managers

This ensures: - Proper invitation flow - Staff records are created - Managers get invitation emails - Everything is set up correctly

## Technical Details

### Database Tables

**users table:**
```
id: UUID
email: string
role: 'master' | 'manager' | 'admin'
account_id: UUID
first_name: string
last_name: string
password_hash: string
```

**staff table** (many-to-many relationship):
```
id: UUID
user_id: UUID (references users.id)
venue_id: UUID (references venues.id)
role: 'manager' (for managers)
```

**manager_invitations table:**
```
id: UUID
email: string
invited_by: UUID
account_id: UUID
venue_ids: UUID[]
token: string
expires_at: timestamp
status: 'pending' | 'accepted' | 'expired'
```

### How the UI Queries Managers

The Managers page queries the `staff` table joined with `users` table:

```sql
SELECT staff.*, users.email, users.first_name, users.last_name
FROM staff
JOIN users ON staff.user_id = users.id
WHERE staff.venue_id IN (your_venue_ids)
  AND staff.role = 'manager'
```

This is why orphaned managers (who have no `staff` records) don't show up!

## Questions?

If you need help, check: - `src/pages/dashboard/StaffManagers.js` - Managers page logic - `src/components/dashboard/staff/ManagersTab.js` - Manager UI components - `api/admin/invite-manager.js` - Manager invitation API
