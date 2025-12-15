# Google Reviews Integration - Setup Guide

## ✅ Implementation Complete!

The Google Reviews integration has been successfully implemented in Chatters. Below are the setup instructions and next steps.

---

## 📋 What Was Implemented

### 1. Database Schema ✅ - **Tables Created:** - `google_connections` - Stores OAuth tokens per venue - `google_locations` - Stores Google Business Profile locations - `google_reviews` - Stores individual reviews and replies - `venue_permissions` - Controls manager access to review features

### 2. Backend API Routes ✅ - `/api/google/auth-init` - Initiates OAuth flow - `/api/google/auth-callback` - Handles OAuth redirect - `/api/google/disconnect` - Disconnects Google account - `/api/google/status` - Checks connection status - `/api/google/locations` - Gets connected locations - `/api/google-reviews/list` - Lists reviews for venue - `/api/google-reviews/sync` - Manual sync trigger - `/api/google-reviews/reply` - Post reply to review - `/api/cron/sync-google-reviews` - Automated sync (every 30 min)

### 3. Frontend Components ✅ - **Pages:** - `/reviews` - Main Google Reviews dashboard - **Components:** - `GoogleBusinessConnect` - OAuth connection UI - `ReviewCard` - Individual review display with reply functionality - `ReviewFilters` - Filter reviews (all/unresponded/responded) - `ReviewStats` - Statistics summary - **Navigation:** - Added "Reviews" to sidebar navigation

### 4. Automated Sync ✅ - Cron job configured to run every 30 minutes - Syncs all reviews from connected Google Business Profiles

---

## 🚀 Next Steps: Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name: **"Chatters-Production"**
4. Click "Create"

### Step 2: Enable Google Business Profile API

1. In the Cloud Console, go to **"APIs & Services" → "Library"**
2. Search for **"Google Business Profile API"**
3. Click on it and press **"Enable"**
4. Also enable: **"My Business Account Management API"** and **"My Business Business Information API"**

### Step 3: Configure OAuth 2.0 Consent Screen

1. Go to **"APIs & Services" → "OAuth consent screen"**
2. User Type: **External**
3. Click "Create"
4. Fill in the form: - **App name:** Chatters - **User support email:** support@getchatters.com (or your email) - **Authorized domains:** getchatters.com - **Developer contact email:** Your email
5. Click "Save and Continue"



6. **Scopes:** Click "Add or Remove Scopes" - Add: `https://www.googleapis.com/auth/business.manage` - Add: `https://www.googleapis.com/auth/userinfo.email`
7. Click "Save and Continue"
8. **Test users:** Add your Gmail accounts for testing
9. Click "Save and Continue"

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"Create Credentials" → "OAuth 2.0 Client ID"**
3. Application type: **Web application**
4. Name: **"Chatters Web App"**
5. **Authorized redirect URIs:** Add these URLs:
   ```
   https://my.getchatters.com/api/google/auth-callback
   http://localhost:3000/api/google/auth-callback
   ```
6. Click **"Create"**
7. **IMPORTANT:** Copy the **Client ID** and **Client Secret** - you'll need these!

---

## 🔐 Environment Variables Setup

Add these environment variables to your Vercel project:

### Required Variables:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://my.getchatters.com/api/google/auth-callback

# Existing variables (make sure these are set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_cron_secret
```

### How to Add in Vercel:

1. Go to your Vercel dashboard
2. Select your "chatters" project
3. Go to **Settings → Environment Variables**
4. Add each variable above
5. Make sure to add them for **Production**, **Preview**, and **Development** environments

---

## 🧪 Testing the Integration

### Test in Development (Optional):

1. Start your local server: `npm start`
2. Go to Settings → Integrations
3. Click "Connect Google Business Profile"
4. You should be redirected to Google OAuth
5. Sign in and grant permissions
6. You should be redirected back with success message

### Test in Production:

1. Deploy to Vercel: `git push`
2. Go to https://my.getchatters.com/settings?tab=Integrations
3. Click "Connect Google Business Profile"
4. Complete OAuth flow
5. Check https://my.getchatters.com/reviews to see synced reviews

---

## 🔍 Verification Checklist

After setup, verify these items: - [ ] Google Cloud Project created - [ ] APIs enabled (Google Business Profile, Account Management, Business Information) - [ ] OAuth consent screen configured - [ ] OAuth 2.0 credentials created - [ ] Redirect URIs added correctly - [ ] Environment variables added to Vercel - [ ] Code deployed to production - [ ] OAuth flow works (can connect Google account) - [ ] Reviews sync automatically - [ ] Can reply to reviews - [ ] Cron job running every 30 minutes - [ ] Manager permissions work correctly

---

## 👥 Manager Permissions

### How to Enable Manager Access:

**This feature is NOT YET IMPLEMENTED in the UI.** Here's how to enable it manually for now:

### Manual SQL Query:

```sql
-- Allow managers to VIEW Google reviews for a venue
UPDATE venue_permissions
SET can_view_google_reviews = true
WHERE venue_id = 'YOUR_VENUE_ID_HERE';

-- Allow managers to REPLY to Google reviews for a venue
UPDATE venue_permissions
SET can_reply_to_google_reviews = true
WHERE venue_id = 'YOUR_VENUE_ID_HERE';
```

### Future UI Implementation:

You'll want to add a permissions management page where master users can toggle these permissions for managers. This would be in: - **Settings → Staff → Managers** - Or create a new **Settings → Permissions** page

---

## 📊 Features Overview

### For Master Users: - ✅ Connect/disconnect Google Business Profile - ✅ View all Google reviews - ✅ Reply to reviews - ✅ Manual sync trigger - ✅ See review statistics

### For Manager Users (when permission granted): - ✅ View Google reviews for their venue(s) - ✅ Reply to reviews (if permission granted) - ❌ Cannot connect/disconnect Google

### For Admin Users: - ✅ Global view of all reviews across all accounts - ✅ Full access to all functionality

---

## 🐛 Troubleshooting

### Issue: "OAuth error: redirect_uri_mismatch"
**Solution:** Make sure the redirect URI in Google Cloud Console matches exactly:
```
https://my.getchatters.com/api/google/auth-callback
```

### Issue: "No Google Business Profile accounts found"
**Solution:** Make sure the user signing in has a verified Google Business Profile account.

### Issue: "Token refresh failed"
**Solution:** User may need to re-authenticate. Disconnect and reconnect Google.

### Issue: "Permission denied" for managers
**Solution:** Check `venue_permissions` table and ensure `can_view_google_reviews` is `true`.

### Issue: Cron job not running
**Solution:**
1. Check Vercel dashboard → Deployments → Functions
2. Verify `vercel.json` has the cron job configured
3. Check cron job logs in Vercel

---

## 📈 Monitoring

### Check Sync Status:

1. Go to Vercel dashboard
2. Click on your project
3. Go to **Deployments → Functions**
4. Find `sync-google-reviews` function
5. View logs to see sync activity

### Database Queries:

```sql
-- Check connected venues
SELECT
  v.name as venue_name,
  gc.google_account_email,
  gc.created_at,
  (SELECT COUNT(*) FROM google_reviews gr
   JOIN google_locations gl ON gl.id = gr.location_id
   WHERE gl.google_connection_id = gc.id) as review_count
FROM google_connections gc
JOIN venues v ON v.id = gc.venue_id;

-- Check recent reviews
SELECT
  gr.reviewer_name,
  gr.star_rating,
  gr.review_text,
  gr.is_replied,
  gr.review_date,
  gl.location_name,
  v.name as venue_name
FROM google_reviews gr
JOIN google_locations gl ON gl.id = gr.location_id
JOIN google_connections gc ON gc.id = gl.google_connection_id
JOIN venues v ON v.id = gc.venue_id
ORDER BY gr.review_date DESC
LIMIT 20;
```

---

## 🎯 Known Limitations (v1) - One venue = one Google Business Profile location - No bulk reply functionality - No reply templates - No AI-suggested replies - No email notifications for new reviews - Manager permissions must be set manually via SQL

---

## 🔮 Future Enhancements (v2+) - Manager permissions UI - Reply templates - AI-suggested replies based on review sentiment - Email notifications for new reviews - Bulk actions (reply to multiple reviews) - Review analytics and trends - Support for multiple locations per venue - TripAdvisor review management (similar integration)

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel function logs
3. Check Supabase database for errors
4. Verify all environment variables are set correctly

---

## 🎉 You're Done!

Once you've completed the Google Cloud Console setup and added the environment variables to Vercel, your Google Reviews integration will be fully functional!

Test it out by:
1. Going to Settings → Integrations
2. Connecting your Google Business Profile
3. Navigating to the Reviews page
4. Viewing and replying to reviews!

---

**Last Updated:** 2025-10-13
**Version:** 1.0
**Implementation Status:** ✅ Complete (pending Google Cloud setup)
