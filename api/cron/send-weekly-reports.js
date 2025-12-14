// /api/cron/send-weekly-reports.js
// Weekly cron job to send performance report emails to opted-in users
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Create Supabase client with service role for database access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://my.getchatters.com';

module.exports = async function handler(req, res) {
  // Check if this is a test request
  const isTestMode = req.query.test === 'true';
  const testUserId = req.query.userId;

  // For production cron, verify the secret
  if (!isTestMode) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  }

  const startTime = new Date();
  let emailsSent = 0;
  let errorCount = 0;
  const errors = [];

  try {
    console.log(`📧 Starting weekly performance report emails... ${isTestMode ? '(TEST MODE)' : ''}`);

    let users;

    if (isTestMode && testUserId) {
      // Test mode: only fetch the specific user
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, role, account_id')
        .eq('id', testUserId)
        .single();

      if (userError) {
        throw new Error(`Failed to fetch test user: ${userError.message}`);
      }

      users = userData ? [userData] : [];
      console.log(`🧪 Test mode: Sending to ${userData?.email} (role: ${userData?.role})`);
    } else {
      // Production: Get all users who have opted in to weekly reports
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, role, account_id')
        .eq('weekly_report_enabled', true)
        .is('deleted_at', null);

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      users = usersData;
    }

    console.log(`👥 Found ${users?.length || 0} users to process`);

    if (!users || users.length === 0) {
      return res.status(200).json({
        status: 'completed',
        message: isTestMode ? 'Test user not found' : 'No users opted in to weekly reports',
        emails_sent: 0,
        duration_ms: Date.now() - startTime.getTime()
      });
    }

    // Calculate date range for the past week
    const weekEnd = new Date();
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartISO = weekStart.toISOString();
    const weekEndISO = weekEnd.toISOString();

    // Format dates for display
    const formatDate = (date) => {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };
    const weekRangeText = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

    // Process each user
    for (const user of users) {
      try {
        let venues = [];

        // Master users get venues via account_id, managers via staff table
        if (user.role === 'master' && user.account_id) {
          // Master user: get venues by account_id
          const { data: accountVenues, error: venuesError } = await supabaseAdmin
            .from('venues')
            .select('id, name, logo, primary_color, nps_enabled')
            .eq('account_id', user.account_id);

          if (venuesError) {
            throw new Error(`Failed to fetch venues for master: ${venuesError.message}`);
          }

          venues = accountVenues || [];
          console.log(`👤 Master user ${user.email}: found ${venues.length} venues via account`);
        } else {
          // Manager or other: get venues via staff table
          const { data: staffRecords, error: staffError } = await supabaseAdmin
            .from('staff')
            .select('venue_id')
            .eq('user_id', user.id);

          if (staffError) {
            throw new Error(`Failed to fetch staff records: ${staffError.message}`);
          }

          if (staffRecords && staffRecords.length > 0) {
            const venueIds = staffRecords.map(s => s.venue_id);

            const { data: staffVenues, error: venuesError } = await supabaseAdmin
              .from('venues')
              .select('id, name, logo, primary_color, nps_enabled')
              .in('id', venueIds);

            if (venuesError) {
              throw new Error(`Failed to fetch venues: ${venuesError.message}`);
            }

            venues = staffVenues || [];
          }
          console.log(`👤 Manager user ${user.email}: found ${venues.length} venues via staff`);
        }

        if (venues.length === 0) {
          console.log(`⏭️ User ${user.email} has no venue access, skipping`);
          continue;
        }

        // Calculate metrics for each venue
        const venueReports = [];
        for (const venue of venues) {
          const metrics = await calculateVenueMetrics(venue.id, weekStartISO, weekEndISO);

          // Also get NPS data if enabled
          let npsData = null;
          if (venue.nps_enabled) {
            npsData = await calculateNPSMetrics(venue.id, weekStartISO, weekEndISO);
          }

          venueReports.push({
            venue,
            metrics,
            npsData
          });
        }

        // Generate and send email
        const emailHtml = generateEmailHtml(user, venueReports, weekRangeText);

        await resend.emails.send({
          from: 'Chatters <noreply@getchatters.com>',
          to: user.email,
          subject: `Weekly Performance Report - ${weekRangeText}`,
          html: emailHtml
        });

        emailsSent++;
        console.log(`✅ Sent weekly report to ${user.email}`);

      } catch (userError) {
        errorCount++;
        errors.push({ user: user.email, error: userError.message });
        console.error(`❌ Error processing user ${user.email}:`, userError.message);
      }
    }

    const duration = Date.now() - startTime.getTime();
    console.log(`✅ Weekly reports complete: ${emailsSent} sent, ${errorCount} errors in ${duration}ms`);

    return res.status(200).json({
      status: 'completed',
      emails_sent: emailsSent,
      errors: errorCount,
      error_details: errors.slice(0, 10), // Cap errors to avoid huge response
      duration_ms: duration
    });

  } catch (error) {
    console.error('❌ Weekly reports cron failed:', error);
    return res.status(500).json({
      status: 'failed',
      error: error.message,
      emails_sent: emailsSent,
      duration_ms: Date.now() - startTime.getTime()
    });
  }
};

async function calculateVenueMetrics(venueId, startISO, endISO) {
  // Fetch feedback data
  const { data: feedbackData } = await supabaseAdmin
    .from('feedback')
    .select('id, session_id, rating, created_at, resolved_at, is_actioned, dismissed, resolution_type')
    .eq('venue_id', venueId)
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  // Fetch assistance requests
  const { data: assistanceData } = await supabaseAdmin
    .from('assistance_requests')
    .select('id, created_at, resolved_at, status')
    .eq('venue_id', venueId)
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  // Calculate feedback count (by unique sessions)
  const sessionIds = new Set();
  let totalRating = 0;
  let ratingCount = 0;

  if (feedbackData) {
    feedbackData.forEach(f => {
      sessionIds.add(f.session_id);
      if (f.rating) {
        totalRating += f.rating;
        ratingCount++;
      }
    });
  }

  const feedbackCount = sessionIds.size + (assistanceData?.length || 0);
  const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : null;

  // Calculate completion rate
  let resolvedCount = 0;
  let totalItems = 0;

  // Process feedback sessions
  if (feedbackData?.length) {
    const sessions = new Map();
    feedbackData.forEach(f => {
      if (!sessions.has(f.session_id)) {
        sessions.set(f.session_id, []);
      }
      sessions.get(f.session_id).push(f);
    });

    sessions.forEach(items => {
      totalItems++;
      const isResolved = items.some(x =>
        x.is_actioned ||
        x.dismissed ||
        x.resolution_type === 'staff_resolved' ||
        x.resolution_type === 'positive_feedback_cleared'
      );
      if (isResolved) resolvedCount++;
    });
  }

  // Process assistance requests
  if (assistanceData?.length) {
    assistanceData.forEach(a => {
      totalItems++;
      if (a.status === 'resolved' || a.resolved_at) {
        resolvedCount++;
      }
    });
  }

  const completionRate = totalItems > 0 ? Math.round((resolvedCount / totalItems) * 100) : null;

  // Calculate average resolution time
  const resolutionTimes = [];

  // From feedback
  if (feedbackData?.length) {
    const sessionMap = new Map();
    feedbackData.forEach(f => {
      if (f.resolved_at && !sessionMap.has(f.session_id)) {
        sessionMap.set(f.session_id, {
          created_at: f.created_at,
          resolved_at: f.resolved_at
        });
      }
    });
    sessionMap.forEach(s => {
      const mins = (new Date(s.resolved_at) - new Date(s.created_at)) / (1000 * 60);
      resolutionTimes.push(mins);
    });
  }

  // From assistance requests
  if (assistanceData?.length) {
    assistanceData.forEach(a => {
      if (a.resolved_at) {
        const mins = (new Date(a.resolved_at) - new Date(a.created_at)) / (1000 * 60);
        resolutionTimes.push(mins);
      }
    });
  }

  const avgResolutionMins = resolutionTimes.length > 0
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    : null;

  return {
    feedbackCount,
    avgRating,
    completionRate,
    avgResolutionMins,
    resolvedCount,
    totalItems
  };
}

async function calculateNPSMetrics(venueId, startISO, endISO) {
  const { data: npsData } = await supabaseAdmin
    .from('nps_submissions')
    .select('score')
    .eq('venue_id', venueId)
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  if (!npsData || npsData.length === 0) {
    return null;
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  npsData.forEach(n => {
    if (n.score >= 9) promoters++;
    else if (n.score >= 7) passives++;
    else detractors++;
  });

  const total = npsData.length;
  const npsScore = Math.round(((promoters - detractors) / total) * 100);

  return {
    score: npsScore,
    promoters,
    passives,
    detractors,
    total
  };
}

function formatResolutionTime(minutes) {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

function generateEmailHtml(user, venueReports, weekRangeText) {
  const firstName = user.first_name || 'there';

  // Generate venue sections
  const venueSections = venueReports.map(({ venue, metrics, npsData }) => {
    const primaryColor = venue.primary_color || '#3b82f6';

    return `
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <!-- Venue Header -->
        <table style="width: 100%; margin-bottom: 16px;">
          <tr>
            ${venue.logo ? `<td style="width: 48px; vertical-align: middle;"><img src="${venue.logo}" alt="${venue.name}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px;"></td>` : ''}
            <td style="vertical-align: middle; padding-left: ${venue.logo ? '12px' : '0'};">
              <h2 style="color: #111827; font-size: 18px; margin: 0; font-weight: 600;">${venue.name}</h2>
            </td>
          </tr>
        </table>

        <!-- Metrics Grid - 2x2 for mobile -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 6px;">
          <tr>
            <td style="background: #ffffff; border-radius: 8px; padding: 12px; text-align: center; width: 50%; border: 1px solid #e5e7eb;">
              <div style="font-size: 22px; font-weight: 700; color: #0369a1;">${metrics.feedbackCount}</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Feedback</div>
            </td>
            <td style="background: #ffffff; border-radius: 8px; padding: 12px; text-align: center; width: 50%; border: 1px solid #e5e7eb;">
              <div style="font-size: 22px; font-weight: 700; color: #ca8a04;">${metrics.avgRating || 'N/A'}${metrics.avgRating ? '/5' : ''}</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Avg Rating</div>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; border-radius: 8px; padding: 12px; text-align: center; width: 50%; border: 1px solid #e5e7eb;">
              <div style="font-size: 22px; font-weight: 700; color: #16a34a;">${metrics.completionRate !== null ? metrics.completionRate + '%' : 'N/A'}</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Completion</div>
            </td>
            <td style="background: #ffffff; border-radius: 8px; padding: 12px; text-align: center; width: 50%; border: 1px solid #e5e7eb;">
              <div style="font-size: 22px; font-weight: 700; color: #7c3aed;">${formatResolutionTime(metrics.avgResolutionMins)}</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Avg Response</div>
            </td>
          </tr>
        </table>

        ${npsData ? `
        <!-- NPS Section -->
        <table style="width: 100%; margin-top: 12px; background: ${npsData.score >= 50 ? '#dcfce7' : npsData.score >= 0 ? '#fef9c3' : '#fee2e2'}; border-radius: 8px;">
          <tr>
            <td style="padding: 14px; vertical-align: middle;">
              <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">NPS Score</div>
              <div style="font-size: 26px; font-weight: 700; color: ${npsData.score >= 50 ? '#16a34a' : npsData.score >= 0 ? '#ca8a04' : '#dc2626'};">${npsData.score}</div>
            </td>
            <td style="padding: 14px; text-align: right; vertical-align: middle; font-size: 12px; color: #6b7280;">
              <div>${npsData.promoters} Promoters</div>
              <div>${npsData.passives} Passives</div>
              <div>${npsData.detractors} Detractors</div>
            </td>
          </tr>
        </table>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Performance Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
  <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #111827; font-size: 24px; margin: 0 0 8px 0;">Weekly Performance Report</h1>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">${weekRangeText}</p>
    </div>

    <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
      Hi ${firstName},<br><br>
      Here's your weekly performance summary for your venue${venueReports.length > 1 ? 's' : ''}.
    </p>

    ${venueSections}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${APP_URL}/reports/feedback"
         style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View Full Reports
      </a>
    </div>
  </div>

  <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
    <p>
      You're receiving this because you enabled weekly performance reports.<br>
      <a href="${APP_URL}/account/profile" style="color: #9ca3af;">Manage your email preferences</a>
    </p>
    <p style="margin-top: 8px;">
      Powered by <a href="https://getchatters.com" style="color: #9ca3af;">Chatters</a>
    </p>
  </div>
</body>
</html>
  `;
}
