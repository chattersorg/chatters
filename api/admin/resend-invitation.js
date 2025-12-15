// /api/admin/resend-invitation.js
const { createClient } = require('@supabase/supabase-js');
const { requireMasterRole } = require('../auth-helper');
const { Resend } = require('resend');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userData = await requireMasterRole(req);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the pending invitation
    const { data: invitation, error } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('email', email)
      .eq('account_id', userData.account_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !invitation) {
      return res.status(404).json({ error: 'No pending invitation found for this email' });
    }

    // Extend expiration
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await supabaseAdmin.from('manager_invitations').update({
      expires_at: newExpiresAt.toISOString()
    }).eq('id', invitation.id);

    // Resend the invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://my.getchatters.com'}/set-password?token=${invitation.token}`;

    if (process.env.RESEND_API_KEY) {
      // Create Resend client only when API key is available
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Get venue names
      const { data: venues } = await supabaseAdmin
        .from('venues')
        .select('name')
        .in('id', invitation.venue_ids);

      const venueNames = venues?.map(v => v.name).join(', ') || 'selected venues';

      // Get inviter's name
      const { data: inviter } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name')
        .eq('id', userData.id)
        .single();

      const inviterName = inviter ? `${inviter.first_name} ${inviter.last_name}` : 'Your account administrator';

      await resend.emails.send({
        from: 'Chatters <noreply@getchatters.com>',
        to: email,
        subject: 'Reminder: You\'ve been invited to join Chatters',
        html: generateReminderEmail(invitation.first_name, inviterName, venueNames, inviteLink)
      });

      console.log('Invitation resent to:', email);
    } else {
      console.warn('RESEND_API_KEY not set, skipping email send');
    }

    return res.status(200).json({
      success: true,
      message: 'Invitation email resent successfully'
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return res.status(500).json({ error: error.message });
  }
};

function generateReminderEmail(firstName, inviterName, venueNames, inviteLink) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: You're Invited to Chatters</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background-color: #000000; padding: 40px; text-align: center;">
              <img src="https://getchatters.com/img/Logo.svg" alt="Chatters" style="height: 40px; width: auto; margin-bottom: 20px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">Friendly Reminder</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 16px; line-height: 26px;">
                Hi ${firstName},
              </p>

              <p style="margin: 0 0 24px; color: #4a5568; font-size: 15px; line-height: 24px;">
                This is a friendly reminder that <strong>${inviterName}</strong> has invited you to join their team on Chatters as a venue manager.
              </p>

              <!-- Venue Info Box -->
              <div style="margin: 28px 0; padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #166534; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your venue access
                </p>
                <p style="margin: 0; color: #15803d; font-size: 16px; font-weight: 500;">
                  ${venueNames || 'Selected venues'}
                </p>
              </div>

              <p style="margin: 0 0 32px; color: #4a5568; font-size: 15px; line-height: 24px;">
                Click the button below to set up your password and access your dashboard:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 48px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 16px; color: #718096; font-size: 14px; line-height: 20px;">
                Or copy and paste this link into your browser:
              </p>

              <div style="margin: 0 0 28px; padding: 14px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <a href="${inviteLink}" style="color: #4299e1; font-size: 13px; word-break: break-all; text-decoration: none;">
                  ${inviteLink}
                </a>
              </div>

              <!-- Expiry Notice -->
              <div style="margin: 28px 0; padding: 16px; background-color: #fefce8; border-left: 4px solid #facc15; border-radius: 6px;">
                <p style="margin: 0; color: #854d0e; font-size: 14px; line-height: 22px;">
                  This invitation expires in <strong>7 days</strong>. Please accept it before then.
                </p>
              </div>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">

              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 22px;">
                <strong>Didn't expect this?</strong><br/>
                If you weren't expecting an invitation from ${inviterName}, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="https://getchatters.com/img/Logo.svg" alt="Chatters" style="height: 24px; width: auto; opacity: 0.6; margin-bottom: 16px;" />
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px; color: #718096; font-size: 14px;">
                Questions? We're here to help!<br/>
                <a href="mailto:support@getchatters.com" style="color: #10b981; text-decoration: none; font-weight: 500;">support@getchatters.com</a>
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} Chatters. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #cbd5e0; font-size: 11px;">
                <a href="https://getchatters.com" style="color: #a0aec0; text-decoration: none;">getchatters.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
