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

    // Create email HTML - table-based layout for mobile email client compatibility
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd love your feedback</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <!-- Email Container -->
  <table cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
    <tbody>
      <!-- Header -->
      <tr>
        <td style="padding: 24px 20px; border-bottom: 1px solid #e5e7eb;">
          <table cellpadding="0" cellspacing="0" style="width: 100%;">
            <tbody>
              <tr>
                ${venue.logo ? `
                <td style="width: 50px; vertical-align: middle;">
                  <img src="${venue.logo}" alt="${venueName}" style="height: 40px; width: auto; display: block;">
                </td>
                ` : ''}
                <td style="vertical-align: middle; text-align: ${venue.logo ? 'right' : 'left'}; font-size: 18px; font-weight: 600; color: #111827;">
                  ${venueName}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="padding: 32px 20px;">
          <h1 style="color: #111827; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
            ${emailGreeting}
          </h1>

          <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-top: 0; margin-bottom: 28px;">
            ${emailBody}
          </p>

          <!-- Question -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
            <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0; line-height: 1.4;">
              ${npsQuestion}
            </p>
          </div>

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="width: 100%;">
            <tbody>
              <tr>
                <td style="text-align: center; padding-bottom: 16px;">
                  <a href="${npsUrl}" style="display: inline-block; background-color: ${venue.primary_color || '#4E74FF'}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                    ${emailButtonText}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
            Takes less than 30 seconds
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.6;">
            You're receiving this because you recently visited ${venueName}.<br>
            <a href="${npsUrl}" style="color: #6b7280; text-decoration: underline;">Click here to respond</a> or ignore this email.
          </p>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Powered by footer -->
  <p style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
    Powered by Chatters
  </p>
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
