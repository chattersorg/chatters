// Export all data for a venue into a single CSV
// Usage: node scripts/export-venue-data.js <venueId>

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportVenueData(venueId) {
  console.log(`\n📤 Exporting all data for venue ${venueId}...\n`);

  // Verify venue exists
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id, name, account_id')
    .eq('id', venueId)
    .single();

  if (venueError || !venue) {
    console.error('Error: Venue not found');
    process.exit(1);
  }

  console.log(`Venue: ${venue.name}\n`);

  // Create output directory
  const outputDir = path.join(__dirname, '..', 'demo-data-csv');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const csvPath = path.join(outputDir, `venue-${venueId}-export.csv`);
  const csv = fs.createWriteStream(csvPath);

  // Write header
  csv.write('data_type,id,table_number,started_at,rating,comment,question_text,question_id,session_id,acknowledged,acknowledged_by,acknowledged_at,customer_email,nps_score,responded_at,source,ratings_count,recorded_at,insight_type,insight_text,priority,request_type,request_details,status,requested_at,resolved_at,employee_name,employee_email,employee_role,position_x,position_y\n');

  let stats = {
    feedback_sessions: 0,
    feedback: 0,
    nps_submissions: 0,
    questions: 0,
    ai_insights: 0,
    assistance_requests: 0,
    google_ratings: 0,
    tripadvisor_ratings: 0,
    employees: 0,
    managers: 0,
    table_positions: 0
  };

  // 1. Questions
  console.log('Fetching questions...');
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('venue_id', venueId);

  for (const q of (questions || [])) {
    csv.write(`question,${escapeCSV(q.id)},,,,,"${escapeCSV(q.question_text)}",,,,,,,,,,,,,,,,,,,,,,,\n`);
    stats.questions++;
  }

  // 2. Feedback Sessions
  console.log('Fetching feedback sessions...');
  const { data: sessions } = await supabase
    .from('feedback_sessions')
    .select('*')
    .eq('venue_id', venueId);

  for (const s of (sessions || [])) {
    csv.write(`session,${escapeCSV(s.id)},${escapeCSV(s.table_number)},${escapeCSV(s.started_at)},,,,,,,,,,,,,,,,,,,,,,,,,,\n`);
    stats.feedback_sessions++;
  }

  // 3. Feedback
  console.log('Fetching feedback...');
  const { data: feedback } = await supabase
    .from('feedback')
    .select('*, questions(question_text)')
    .eq('venue_id', venueId);

  for (const f of (feedback || [])) {
    const acknowledged = f.acknowledged_at ? 'yes' : 'no';
    csv.write(`feedback,${escapeCSV(f.id)},${escapeCSV(f.table_number)},,${escapeCSV(f.rating)},${escapeCSV(f.additional_feedback)},${escapeCSV(f.questions?.question_text)},${escapeCSV(f.question_id)},${escapeCSV(f.session_id)},${acknowledged},${escapeCSV(f.acknowledged_by)},${escapeCSV(f.acknowledged_at)},,,,,,,,,,,,,,,,,,,\n`);
    stats.feedback++;
  }

  // 4. NPS Submissions
  console.log('Fetching NPS submissions...');
  const { data: nps } = await supabase
    .from('nps_submissions')
    .select('*')
    .eq('venue_id', venueId);

  for (const n of (nps || [])) {
    csv.write(`nps,${escapeCSV(n.id)},,,,,,,,,,,${escapeCSV(n.customer_email)},${escapeCSV(n.score)},${escapeCSV(n.responded_at)},,,,,,,,,,,,,,,,\n`);
    stats.nps_submissions++;
  }

  // 5. AI Insights
  console.log('Fetching AI insights...');
  const { data: insights } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('venue_id', venueId);

  for (const i of (insights || [])) {
    csv.write(`ai_insight,${escapeCSV(i.id)},,,,,,,,,,,,,,,,,,${escapeCSV(i.insight_type)},${escapeCSV(i.insight_text)},${escapeCSV(i.priority)},,,,,,,,,,\n`);
    stats.ai_insights++;
  }

  // 6. Assistance Requests
  console.log('Fetching assistance requests...');
  const { data: requests } = await supabase
    .from('assistance_requests')
    .select('*')
    .eq('venue_id', venueId);

  for (const r of (requests || [])) {
    csv.write(`assistance_request,${escapeCSV(r.id)},${escapeCSV(r.table_number)},,,,,,,,,,,,,,,,,,,${escapeCSV(r.request_type)},${escapeCSV(r.request_details)},${escapeCSV(r.status)},${escapeCSV(r.requested_at)},${escapeCSV(r.resolved_at)},,,,,\n`);
    stats.assistance_requests++;
  }

  // 7. Historical Ratings (Google)
  console.log('Fetching Google ratings...');
  const { data: googleRatings } = await supabase
    .from('historical_ratings')
    .select('*')
    .eq('venue_id', venueId)
    .eq('source', 'google');

  for (const g of (googleRatings || [])) {
    csv.write(`google_rating,${escapeCSV(g.id)},,,,${escapeCSV(g.rating)},,,,,,,,,,google,${escapeCSV(g.ratings_count)},${escapeCSV(g.recorded_at)},,,,,,,,,,,,\n`);
    stats.google_ratings++;
  }

  // 8. Historical Ratings (TripAdvisor)
  console.log('Fetching TripAdvisor ratings...');
  const { data: tripRatings } = await supabase
    .from('historical_ratings')
    .select('*')
    .eq('venue_id', venueId)
    .eq('source', 'tripadvisor');

  for (const t of (tripRatings || [])) {
    csv.write(`tripadvisor_rating,${escapeCSV(t.id)},,,,${escapeCSV(t.rating)},,,,,,,,,,tripadvisor,${escapeCSV(t.ratings_count)},${escapeCSV(t.recorded_at)},,,,,,,,,,,,\n`);
    stats.tripadvisor_ratings++;
  }

  // 9. Staff/Employees
  console.log('Fetching employees...');
  const { data: staff } = await supabase
    .from('staff')
    .select('*, users(email)')
    .eq('venue_id', venueId);

  for (const s of (staff || [])) {
    csv.write(`employee,${escapeCSV(s.user_id)},,,,,,,,,,,,,,,,,,,,,,,,,${escapeCSV(s.name)},${escapeCSV(s.users?.email)},${escapeCSV(s.role)},,\n`);
    stats.employees++;
  }

  // 10. Managers (from users table via account)
  console.log('Fetching managers...');
  const { data: managers } = await supabase
    .from('users')
    .select('*')
    .eq('account_id', venue.account_id)
    .in('role', ['master', 'manager']);

  for (const m of (managers || [])) {
    csv.write(`manager,${escapeCSV(m.id)},,,,,,,,,,,,,,,,,,,,,,,,,${escapeCSV(m.name)},${escapeCSV(m.email)},${escapeCSV(m.role)},,\n`);
    stats.managers++;
  }

  // 11. Table Positions
  console.log('Fetching table positions...');
  const { data: positions } = await supabase
    .from('table_positions')
    .select('*')
    .eq('venue_id', venueId);

  for (const p of (positions || [])) {
    csv.write(`table_position,${escapeCSV(p.id)},${escapeCSV(p.table_number)},,,,,,,,,,,,,,,,,,,,,,,,,,,${escapeCSV(p.position_x)},${escapeCSV(p.position_y)}\n`);
    stats.table_positions++;
  }

  csv.end();

  console.log(`\n✅ Export complete: ${csvPath}\n`);
  console.log('📊 Stats:');
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });
  console.log('');
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scripts/export-venue-data.js <venueId>');
  process.exit(1);
}

const venueId = args[0];
exportVenueData(venueId).catch(console.error);
