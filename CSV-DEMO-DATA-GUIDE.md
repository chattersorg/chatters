# CSV Demo Data Population - Quick Guide

## Simple 2-Step Process

### Step 1: Generate CSV for a Venue

```bash
node scripts/generate-venue-demo-csv.js <venueId> [days]
```

**Example:**
```bash
# Generate 60 days of data for venue abc-123
node scripts/generate-venue-demo-csv.js abc-123 60
```

**Output:** - Single CSV file: `demo-data-csv/venue-abc-123-demo-data.csv` - Contains ALL data: feedback, NPS, and ratings in one file

### Step 2: Import the CSV

You have 3 options:

#### Option A: Use the Import Script (Recommended)
```bash
# Import with overwrite
node scripts/import-demo-csv.js abc-123 --clear
```

#### Option B: Manual Supabase Dashboard Import
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Use "Import data from CSV" feature
4. Upload the generated CSV file

#### Option C: API Upload (Future - UI Button)
*Coming soon: Upload button in admin dashboard*

---

## CSV Format

Single unified format with all data types:

```csv
data_type,session_id,table_number,rating,comment,nps_score,customer_email,google_rating,tripadvisor_rating,timestamp,question_id,acknowledged_by,acknowledged_at
feedback,abc123,5,4,Great food!,,,,,2025-01-15T19:30:00Z,q1,,,
nps,,,,8,customer@example.com,,,,2025-01-15T20:00:00Z,,,,
rating,,,,,,,5,,2025-01-15T23:00:00Z,,,,
rating,,,,,,,,4,2025-01-15T23:00:00Z,,,,
```

---

## Quick Start Example

```bash
# 1. Set environment variables
export REACT_APP_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-key

# 2. Generate CSV for venue
node scripts/generate-venue-demo-csv.js my-venue-id 60

# 3. Import with overwrite
node scripts/import-demo-csv.js my-account-id --clear
```

Done! Your venue now has 60 days of demo data.

---

## What Gets Created (per day per venue) - ✅ 5 feedback sessions (~13 feedback items) - ✅ 5 NPS submissions - ✅ 2 rating scores (Google + TripAdvisor) - ✅ 2 historical rating snapshots - ✅ 60% of feedback automatically resolved by staff

**Total for 60 days:** - ~300 sessions - ~780 feedback items - ~300 NPS submissions - ~240 rating snapshots

---

## Files - `scripts/generate-venue-demo-csv.js` - Generate CSV - `scripts/import-demo-csv.js` - Import CSV to database - `api/admin/upload-venue-demo-csv.js` - API endpoint (future use) - `demo-data-csv/` - Output directory for CSV files

---

## Why CSV?

✅ **Fast**: 60 days in under 1 minute
✅ **Reliable**: No API timeouts
✅ **Flexible**: Edit CSV before importing
✅ **Simple**: One file, all data
✅ **Repeatable**: Generate multiple times

No more timeout issues!
