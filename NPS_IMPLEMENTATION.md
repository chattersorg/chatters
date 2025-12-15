# NPS (Net Promoter Score) Module Implementation

## Overview
Complete NPS system that allows venues to collect email addresses during feedback and automatically send follow-up NPS surveys via email.

## What's Been Implemented

### 1. Database Schema
**Migration**: `supabase/migrations/20251002161000_add_nps_system.sql` - **New Table**: `nps_submissions` - Tracks email collection, scheduled sends, and customer responses - Links to `feedback_sessions` and `venues` - Includes cooldown functionality to prevent spam - **Venue Settings** (added to `venues` table): - `nps_enabled`: Toggle NPS on/off - `nps_delay_hours`: 12, 24, or 36 hours after visit - `nps_question`: Customizable question text - `nps_cooldown_hours`: Prevents multiple emails to same customer (default 24h) - **Database Function**: `check_nps_cooldown()` - Validates if customer can receive another NPS email

### 2. Customer Experience

#### Email Collection ([CustomerFeedback.js](src/pages/dashboard/CustomerFeedback.js)) - **Prominent optional email field** before feedback questions - Creates `feedback_session` if email provided - Checks NPS enabled status and cooldown period - Automatically schedules NPS email based on `nps_delay_hours`

#### NPS Response Page ([NPSResponse.js](src/pages/dashboard/NPSResponse.js)) - **Route**: `/nps?id={submission_id}` - Clean 0-10 rating interface with color-coded categories - Shows customer their rating category (Promoter/Passive/Detractor) - **Thank you page** with Google/TripAdvisor review links - Mobile-responsive design matching venue branding

### 3. Email System

#### Edge Function ([supabase/functions/send-nps-emails](supabase/functions/send-nps-emails/)) - **Automated hourly cron job** checks for scheduled emails - Sends via **Resend API** with branded HTML template - Processes up to 50 emails per run - Logs errors to database for troubleshooting - Updates `sent_at` timestamp on success

#### Setup Required:
```bash
# Set secrets
npx supabase secrets set RESEND_API_KEY=your_key
npx supabase secrets set APP_URL=https://my.getchatters.com

# Deploy function
npx supabase functions deploy send-nps-emails

# Set up cron (see README in functions folder)
```

### 4. Dashboard & Analytics

#### NPS Reports Page ([ReportsNPS.js](src/pages/dashboard/ReportsNPS.js)) - **Route**: `/reports/nps` - **Key Metrics**: - Overall NPS Score (color-coded) - Response Rate - Emails Sent/Pending/Failed - Promoters/Passives/Detractors breakdown - **Visualizations**: - NPS trend over time (line chart) - Score distribution 0-10 (bar chart with color coding) - Recent responses table - **Filters**: 7/30/90/365 day ranges

#### Navigation - Added to sidebar under **Reports → NPS** (Star icon) - Accessible to all venue users

### 5. Settings Interface

#### NPS Configuration ([FeedbackSettings.js](src/pages/dashboard/FeedbackSettings.js))
**Path**: Settings → Feedback Settings

**Controls**: - ✅ Enable/Disable toggle - 📅 Delay selection (12, 24, 36 hours) - ✏️ Custom question text - 💾 Save button with status messages

### 6. Routes Added

**DashboardRoutes.js**: - `/nps` - Public NPS response page (no auth required) - `/reports/nps` - NPS analytics dashboard (auth required)

## Customer Flow

1. **Scan QR Code** → Feedback page loads
2. **Enter Email** (optional) before selecting table
3. **Complete Feedback** questions as normal
4. **Backend**: - Creates `feedback_session` record - Checks `nps_enabled` and cooldown - Schedules NPS email for `now + nps_delay_hours`
5. **Hourly Cron** sends pending emails via Resend
6. **Customer Clicks Link** → NPS response page
7. **Rates 0-10** → Response saved to database
8. **Thank You Page** → Shows Google/TripAdvisor links

## NPS Scoring - **Promoters** (9-10): Loyal enthusiasts - **Passives** (7-8): Satisfied but unenthusiastic - **Detractors** (0-6): Unhappy customers

**NPS Score** = (% Promoters - % Detractors) × 100

Range: -100 to +100 - **≥50**: Excellent - **0-49**: Good - **<0**: Needs improvement

## Email Cooldown

Prevents spam by checking if customer received NPS email within `nps_cooldown_hours` (default 24h). Uses database function for validation.

## Security - **Public NPS page**: Secured by UUID submission_id (unguessable) - **RLS policies**: Users can only view NPS for their venues - **Service role**: Edge function uses service role for email sending - **Email deduplication**: Built-in cooldown prevents abuse

## What's NOT Implemented Yet - **Dashboard widget**: NPS score on main overview (marked as pending) - **Email opt-out**: Not implemented (may not be legally required for post-service surveys) - **Email tracking**: Open/click rates (tracked in Resend, not imported to DB)

## Testing Checklist - [ ] Apply database migration - [ ] Deploy Edge Function with Resend API key - [ ] Set up cron job for hourly email sending - [ ] Enable NPS in Feedback Settings - [ ] Test email collection on feedback page - [ ] Verify scheduled email appears in `nps_submissions` - [ ] Test manual function invoke to send emails - [ ] Click email link and submit NPS rating - [ ] Check NPS Reports page shows data - [ ] Test cooldown (try same email twice within 24h)

## Files Modified/Created

**New Files**: - `supabase/migrations/20251002161000_add_nps_system.sql` - `supabase/functions/send-nps-emails/index.ts` - `supabase/functions/send-nps-emails/README.md` - `src/pages/dashboard/NPSResponse.js` - `src/pages/dashboard/ReportsNPS.js`

**Modified Files**: - `src/pages/dashboard/CustomerFeedback.js` - Email collection - `src/pages/dashboard/FeedbackSettings.js` - NPS settings UI - `src/DashboardRoutes.js` - Added routes - `src/components/dashboard/layout/Sidebar.js` - Added menu item

## Questions Answered

1. ✅ Email before or after questions? **Before**
2. ✅ Optional email? **Yes**
3. ✅ Delay options? **12, 24, 36 hours**
4. ✅ Customizable question? **Yes**
5. ✅ After rating response? **Thank you + review links**
6. ✅ Reporting metrics? **Full NPS analytics**
7. ✅ Dashboard placement? **Dedicated NPS page + navigation item**
8. ✅ Email service? **Resend**
9. ✅ Prevent duplicate emails? **24h cooldown**
