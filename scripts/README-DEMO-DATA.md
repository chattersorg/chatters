# Demo Data Population Scripts

Two approaches for populating demo data: **CSV-based (recommended)** or **API-based**.

## CSV-Based Approach (Recommended)

Fast, reliable, no timeout issues. Generates CSV files then bulk imports.

### Step 1: Generate CSV Files

```bash
node scripts/generate-demo-csv.js <accountId> [days]
```

**Example:**
```bash
# Generate 60 days of data for account af1d9502-a1a9-4873-8776-9b7177ed30c3
node scripts/generate-demo-csv.js af1d9502-a1a9-4873-8776-9b7177ed30c3 60
```

**Output:**
- Creates `demo-data-csv/` directory with 4 CSV files:
  - `sessions.csv` - Feedback sessions
  - `feedback.csv` - Feedback items with ratings and comments
  - `nps.csv` - NPS email submissions
  - `ratings.csv` - Google & TripAdvisor rating snapshots

### Step 2: Import CSV Files

```bash
node scripts/import-demo-csv.js [accountId] [--clear]
```

**Examples:**
```bash
# Import without clearing existing data
node scripts/import-demo-csv.js

# Clear existing data first, then import
node scripts/import-demo-csv.js af1d9502-a1a9-4873-8776-9b7177ed30c3 --clear
```

**Performance:**
- Processes in chunks of 500 records
- ~30-60 seconds for 60 days of data
- No timeout issues

---

## API-Based Approach

Uses the admin UI "Populate 60 Days" button. Processes day-by-day via API calls.

**Pros:**
- Works from the browser
- Shows real-time progress

**Cons:**
- Slower (~3-4 minutes for 60 days)
- 60 sequential API calls (one per day)
- Can fail mid-process if network issues

**Location:**
Admin Dashboard → Account Detail → "Populate 60 Days" button

---

## Data Volume

**Per venue, per day:**
- 5 feedback sessions (~13 feedback items per day)
- 5 NPS submissions
- 2 rating scores (Google + TripAdvisor)
- 2 historical rating snapshots

**For 60 days:**
- ~300 sessions
- ~780 feedback items
- ~300 NPS submissions
- ~240 rating snapshots

**Staff Resolution:**
- 60% of feedback items older than 2 days are randomly resolved by staff members

---

## Environment Variables Required

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Troubleshooting

### "No venues found for this account"
Make sure the account ID is correct and has at least one venue.

### "Missing environment variables"
Set `REACT_APP_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file.

### Import errors
Check that:
1. CSV files were generated successfully
2. Venue IDs in CSV match venues in your database
3. Questions exist for each venue (script auto-creates if missing)

---

## Recommended Workflow

1. **Generate CSVs:**
   ```bash
   node scripts/generate-demo-csv.js abc123 60
   ```

2. **Review CSV files** in `demo-data-csv/` directory

3. **Import with clear flag** to replace existing data:
   ```bash
   node scripts/import-demo-csv.js abc123 --clear
   ```

Done! Your demo account now has 60 days of realistic data.
