// /api/send-test-nps-email.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://my.getchatters.com';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    const { venueId } = req.body;

    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required' });
    }

    // Get venue data with NPS email settings
    const { data: venue, error: venueError } = await supabaseClient
      .from('venues')
      .select('name, logo, primary_color, nps_question, nps_email_subject, nps_email_greeting, nps_email_body, nps_email_button_text')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const venueName = venue.name || 'Our venue';
    const npsQuestion = venue.nps_question || 'How likely are you to recommend us to a friend or colleague?';

    // Get customisable email content with defaults
    const emailSubject = (venue.nps_email_subject || 'How was your visit to {venue_name}?')
      .replace(/{venue_name}/g, venueName);
    const emailGreeting = (venue.nps_email_greeting || 'Thank you for visiting {venue_name}!')
      .replace(/{venue_name}/g, venueName);
    const emailBody = venue.nps_email_body ||
      "We hope you had a great experience. We'd love to hear your feedback.";
    const emailButtonText = venue.nps_email_button_text || 'Rate Your Experience';

    // Create test NPS URL (links to a preview page, not an actual submission)
    const npsUrl = `${APP_URL}/nps?preview=true`;

    // Create email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd love your feedback</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${venue.logo ? `<div style="text-align: center; margin-bottom: 30px;">
    <img src="${venue.logo}" alt="${venueName}" style="height: 60px;">
  </div>` : ''}

  <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: ${venue.primary_color || '#111827'}; font-size: 24px; margin-top: 0;">
      ${emailGreeting}
    </h1>

    <p style="font-size: 16px; color: #4b5563;">
      ${emailBody}
    </p>

    <p style="font-size: 18px; font-weight: 600; color: #1f2937; margin-top: 30px; margin-bottom: 20px;">
      ${npsQuestion}
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${npsUrl}"
         style="display: inline-block; background: ${venue.primary_color || '#3b82f6'}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        ${emailButtonText}
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; text-align: center;">
      This will take less than 30 seconds
    </p>
  </div>

  <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 30px;">
    <p>
      You're receiving this because you recently visited ${venueName}.<br>
      <a href="${npsUrl}" style="color: #9ca3af;">Click here to respond</a> or ignore this email if you prefer not to participate.
    </p>
  </div>
</body>
</html>
    `;

    // Send test email via Resend
    await resend.emails.send({
      from: `${venueName} <feedback@getchatters.com>`,
      to: user.email,
      subject: `[TEST] ${emailSubject}`,
      html: emailHtml,
    });

    return res.status(200).json({
      success: true,
      message: `Test email sent to ${user.email}`
    });
  } catch (error) {
    console.error('Send test NPS email error:', error);
    return res.status(500).json({ error: error.message });
  }
};
