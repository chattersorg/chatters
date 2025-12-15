import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://my.getchatters.com';

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, venueId, role, invitedBy, venueName } = await req.json();

    if (!email || !venueId || !role) {
      return new Response(JSON.stringify({ error: 'Email, venueId, and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Generate secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation token
    const { error: tokenError } = await supabase
      .from('staff_invitation_tokens')
      .insert({
        email: email.toLowerCase(),
        token,
        venue_id: venueId,
        role,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      throw new Error('Failed to create invitation token');
    }

    // Create invitation link
    const invitationLink = `${APP_URL}/set-password?token=${token}`;

    // Get inviter's name if available
    let inviterName = 'Your colleague';
    if (invitedBy) {
      const { data: inviter } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', invitedBy)
        .single();

      if (inviter) {
        inviterName = `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || 'Your colleague';
      }
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Chatters <noreply@getchatters.com>',
        to: [email],
        subject: `You've been invited to join ${venueName || 'a venue'} on Chatters`,
        html: generateInvitationEmail(email, venueName || 'the team', inviterName, invitationLink, expiresAt, role)
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      throw new Error('Failed to send invitation email');
    }

    const emailData = await emailResponse.json();
    console.log('Invitation email sent successfully:', emailData.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation sent successfully',
      token // Return for testing purposes
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send invitation',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

function generateInvitationEmail(
  email: string,
  venueName: string,
  inviterName: string,
  invitationLink: string,
  expiresAt: Date,
  role: string
): string {
  const expiryDate = expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const roleDisplay = role === 'master' ? 'Account Owner' : 'Manager';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to Chatters</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <img src="https://getchatters.com/img/logo/chatters-logo-white-2025.svg" alt="Chatters" style="height: 32px; width: auto; margin-bottom: 20px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">You're Invited!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 16px; line-height: 26px;">
                Hi there,
              </p>

              <p style="margin: 0 0 24px; color: #4a5568; font-size: 15px; line-height: 24px;">
                <strong>${inviterName}</strong> has invited you to join <strong>${venueName}</strong> on Chatters as a <strong>${roleDisplay}</strong>.
              </p>

              <div style="margin: 28px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px;">
                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 22px;">
                  <strong>What is Chatters?</strong><br/>
                  Chatters is a customer feedback management platform that helps hospitality venues collect, manage, and act on customer feedback in real-time.
                </p>
              </div>

              <p style="margin: 24px 0; color: #4a5568; font-size: 15px; line-height: 24px;">
                Click the button below to accept the invitation and set up your account:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationLink}" style="display: inline-block; padding: 16px 48px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 16px; color: #718096; font-size: 14px; line-height: 20px;">
                Or copy and paste this link into your browser:
              </p>

              <div style="margin: 0 0 28px; padding: 14px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <a href="${invitationLink}" style="color: #4299e1; font-size: 13px; word-break: break-all; text-decoration: none;">
                  ${invitationLink}
                </a>
              </div>

              <!-- What You'll Get -->
              <div style="margin: 32px 0;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">What you'll be able to do:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 24px;">
                  ${role === 'master' ? `
                    <li>Manage multiple venues and locations</li>
                    <li>View analytics and reports across all venues</li>
                    <li>Invite and manage team members</li>
                    <li>Configure venue settings and integrations</li>
                  ` : `
                    <li>View and respond to customer feedback</li>
                    <li>Monitor real-time notifications</li>
                    <li>Access venue analytics and reports</li>
                    <li>Manage feedback settings</li>
                  `}
                </ul>
              </div>

              <!-- Expiry Notice -->
              <div style="margin: 28px 0; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 22px; font-weight: 500;">
                  ⏱️ This invitation expires on ${expiryDate}
                </p>
                <p style="margin: 8px 0 0; color: #78350f; font-size: 13px; line-height: 20px;">
                  Make sure to accept it before then to get started!
                </p>
              </div>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">

              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 22px;">
                <strong>Didn't expect this invitation?</strong><br/>
                If you're not sure why you received this email, please contact ${inviterName} or ignore this message.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="https://getchatters.com/img/logo/chatters-logo-black-2025.svg" alt="Chatters" style="height: 20px; width: auto; opacity: 0.6; margin-bottom: 16px;" />
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
