// /api/send-password-reset.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const crypto = require('crypto');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://my.getchatters.com';

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (userError || !users || users.length === 0) {
      // Don't reveal if email exists or not (security best practice)
      console.log('User not found for email:', email);
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    const user = users[0];

    // Generate secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        email: user.email,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      throw new Error('Failed to create reset token');
    }

    // Create reset link
    const resetLink = `${APP_URL}/reset-password?token=${token}`;

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Chatters <noreply@getchatters.com>',
        to: user.email,
        subject: 'Reset your Chatters password',
        html: generatePasswordResetEmail(user.first_name || 'there', resetLink, expiresAt)
      });

      console.log('Password reset email sent to:', user.email);
    } else {
      console.warn('RESEND_API_KEY not set, skipping email send');
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to send password reset email',
      details: error.message
    });
  }
};

function generatePasswordResetEmail(name, resetLink, expiresAt) {
  const expiryTime = expiresAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Chatters</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background-color: #000000; padding: 40px; text-align: center;">
              <img src="https://getchatters.com/img/logo/chatters-logo-white-2025.svg" alt="Chatters" style="height: 32px; width: auto; margin-bottom: 20px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">Reset Your Password</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 16px; line-height: 26px;">
                Hi ${name},
              </p>

              <p style="margin: 0 0 24px; color: #4a5568; font-size: 15px; line-height: 24px;">
                We received a request to reset your password for your Chatters account. Click the button below to create a new password and regain access to your dashboard:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 48px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 16px; color: #718096; font-size: 14px; line-height: 20px;">
                Or copy and paste this link into your browser:
              </p>

              <div style="margin: 0 0 28px; padding: 14px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <a href="${resetLink}" style="color: #4299e1; font-size: 13px; word-break: break-all; text-decoration: none;">
                  ${resetLink}
                </a>
              </div>

              <!-- Security Notice -->
              <div style="margin: 28px 0; padding: 16px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 6px;">
                <p style="margin: 0; color: #c53030; font-size: 14px; line-height: 22px; font-weight: 500;">
                  ⏱️ This link expires in 1 hour (at ${expiryTime})
                </p>
                <p style="margin: 8px 0 0; color: #742a2a; font-size: 13px; line-height: 20px;">
                  For your security, this password reset link can only be used once.
                </p>
              </div>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">

              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 22px;">
                <strong>Didn't request this?</strong><br/>
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
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
