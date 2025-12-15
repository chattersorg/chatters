// /api/send-email-change.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

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
    const { currentEmail, newEmail } = req.body;

    if (!currentEmail || !newEmail) {
      return res.status(400).json({ error: 'Current and new email are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if current user exists
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name')
      .eq('email', currentEmail.toLowerCase())
      .single();

    if (userError || !currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Check if new email is already in use
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', newEmail.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'This email is already in use by another account' });
    }

    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Store the email change request
    const { error: insertError } = await supabaseAdmin
      .from('email_change_requests')
      .insert({
        user_id: currentUser.id,
        old_email: currentEmail.toLowerCase(),
        new_email: newEmail.toLowerCase(),
        token: token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating email change request:', insertError);
      return res.status(500).json({ error: 'Failed to create email change request' });
    }

    // Create verification URL
    const verificationUrl = `${APP_URL}/verify-email-change?token=${token}`;

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Chatters <noreply@getchatters.com>',
        to: newEmail,
        subject: 'Verify Your New Email Address',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your New Email</h1>
              </div>

              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi ${currentUser.first_name || 'there'},</p>

                <p style="font-size: 16px; margin-bottom: 20px;">
                  You've requested to change your Chatters account email address from <strong>${currentEmail}</strong> to <strong>${newEmail}</strong>.
                </p>

                <p style="font-size: 16px; margin-bottom: 30px;">
                  Click the button below to verify this email address and complete the change:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}"
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                    Verify New Email Address
                  </a>
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="font-size: 14px; color: #667eea; word-break: break-all; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  ${verificationUrl}
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                    <strong>Important:</strong>
                  </p>
                  <ul style="font-size: 14px; color: #666; padding-left: 20px;">
                    <li>This link will expire in 24 hours</li>
                    <li>If you didn't request this change, please ignore this email</li>
                    <li>Your current email address will remain active until you verify the new one</li>
                  </ul>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 12px; color: #999; margin: 0;">
                    © ${new Date().getFullYear()} Chatters. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `
      });

      console.log('Email change verification sent to:', newEmail);
    } else {
      console.warn('RESEND_API_KEY not set, skipping email send');
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent to your new email address. Please check your inbox.'
    });

  } catch (error) {
    console.error('Error in send-email-change:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred'
    });
  }
};
