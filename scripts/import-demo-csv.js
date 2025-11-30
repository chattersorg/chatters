// Import CSV files into Supabase
// Usage: node scripts/import-demo-csv.js [--clear]

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importCSV(filename, tableName, chunkSize = 1000) {
  const csvPath = path.join(__dirname, '..', 'demo-data-csv', filename);

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    return 0;
  }

  console.log(`\n📥 Importing ${filename} into ${tableName}...`);

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      // Handle empty strings
      if (value === '') return null;
      // Handle numbers
      if (context.column === 'rating' || context.column === 'ratings_count' || context.column === 'score' || context.column === 'table_number') {
        return value ? Number(value) : null;
      }
      // Handle booleans
      if (context.column === 'is_initial') {
        return value === 'true' || value === 't' || value === '1';
      }
      return value;
    }
  });

  console.log(`  Found ${records.length} records`);

  let imported = 0;
  let errors = 0;

  // Process in chunks
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);

    try {
      const { error } = await supabase
        .from(tableName)
        .insert(chunk);

      if (error) {
        console.error(`  ❌ Error in chunk ${i / chunkSize + 1}:`, error.message);
        errors += chunk.length;
      } else {
        imported += chunk.length;
        process.stdout.write(`\r  Progress: ${imported}/${records.length} (${Math.round(imported/records.length * 100)}%)`);
      }
    } catch (err) {
      console.error(`  ❌ Exception in chunk ${i / chunkSize + 1}:`, err.message);
      errors += chunk.length;
    }
  }

  console.log(`\n  ✅ Imported: ${imported}, Errors: ${errors}`);
  return imported;
}

async function clearExistingData(accountId) {
  console.log('\n🗑️  Clearing existing demo data...');

  // Get venues for this account
  const { data: venues } = await supabase
    .from('venues')
    .select('id')
    .eq('account_id', accountId);

  if (!venues || venues.length === 0) {
    console.log('  No venues found for this account');
    return;
  }

  const venueIds = venues.map(v => v.id);

  // Delete in reverse order of dependencies
  console.log('  Deleting feedback...');
  await supabase.from('feedback').delete().in('venue_id', venueIds);

  console.log('  Deleting sessions...');
  await supabase.from('feedback_sessions').delete().in('venue_id', venueIds);

  console.log('  Deleting NPS submissions...');
  await supabase.from('nps_submissions').delete().in('venue_id', venueIds);

  console.log('  Deleting historical ratings...');
  await supabase.from('historical_ratings').delete().in('venue_id', venueIds);

  console.log('  ✅ Cleared existing data');
}

async function importAllCSVs() {
  console.log('\n🚀 Starting CSV import...\n');

  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  if (shouldClear) {
    const accountId = args.find(arg => !arg.startsWith('--'));
    if (!accountId) {
      console.error('Error: Account ID required when using --clear flag');
      console.log('Usage: node scripts/import-demo-csv.js <accountId> --clear');
      process.exit(1);
    }
    await clearExistingData(accountId);
  }

  const startTime = Date.now();

  let totalImported = 0;

  // Import in dependency order
  totalImported += await importCSV('sessions.csv', 'feedback_sessions', 500);
  totalImported += await importCSV('feedback.csv', 'feedback', 500);
  totalImported += await importCSV('nps.csv', 'nps_submissions', 500);
  totalImported += await importCSV('ratings.csv', 'historical_ratings', 500);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✅ Import complete!`);
  console.log(`📊 Total records imported: ${totalImported}`);
  console.log(`⏱️  Time taken: ${duration}s\n`);
}

importAllCSVs().catch(console.error);
