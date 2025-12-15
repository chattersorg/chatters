// /api/admin/invite-manager.js
const { createClient } = require('@supabase/supabase-js');
const { requireMasterRole } = require('../auth-helper');
const { Resend } = require('resend');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add detailed logging
  console.log('=== INVITE MANAGER API CALLED ===');
  console.log('Environment check:', {
    hasSupabaseUrl: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL),
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
  });

  try {
    const userData = await requireMasterRole(req);
    const { email, venueIds, firstName, lastName, phone, dateOfBirth, permissionTemplateId } = req.body;

    console.log('Invite manager request:', { email, firstName, lastName, phone, dateOfBirth, venueIds, permissionTemplateId, accountId: userData.account_id });

    if (!email || !venueIds || venueIds.length === 0) {
      return res.status(400).json({ error: 'Email and venue IDs required' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name required' });
    }

    // Verify venues belong to user's account
    const { data: venues, error: venuesError } = await supabaseAdmin
      .from('venues')
      .select('id, name')
      .eq('account_id', userData.account_id)
      .in('id', venueIds);

    if (venuesError) {
      console.error('Error fetching venues:', venuesError);
      throw new Error('Failed to verify venues: ' + venuesError.message);
    }

    if (!venues || venues.length !== venueIds.length) {
      return res.status(403).json({ error: 'Some venues do not belong to your account' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Create invitation
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('manager_invitations')
      .insert({
        email,
        invited_by: userData.id,
        account_id: userData.account_id,
        venue_ids: venueIds,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        permission_template_id: permissionTemplateId || null
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw new Error('Failed to create invitation: ' + inviteError.message);
    }

    console.log('Invitation created successfully:', invitation.id);

    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://my.getchatters.com'}/set-password?token=${token}`;

    try {
      if (process.env.RESEND_API_KEY) {
        // Get venue names for the email
        const venueNames = venues.map(v => v.name || v.id).join(', ');

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
          subject: 'You\'ve been invited to manage venues on Chatters',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">You've been invited to Chatters</h1>
                <p style="margin: 0 0 15px 0; color: #555;">Hi ${firstName},</p>
                <p style="margin: 0 0 15px 0; color: #555;">
                  ${inviterName} has invited you to manage venues on Chatters.
                </p>
                <p style="margin: 0 0 20px 0; color: #555;">
                  You'll have access to: <strong>${venueNames || 'selected venues'}</strong>
                </p>
                <a href="${inviteLink}"
                   style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; margin: 10px 0;">
                  Accept Invitation
                </a>
                <p style="margin: 20px 0 0 0; color: #888; font-size: 14px;">
                  This invitation expires in 7 days.
                </p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #888; font-size: 12px;">
                <p style="margin: 0 0 10px 0;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <p style="margin: 0;">
                  Can't click the button? Copy and paste this link into your browser:<br>
                  <span style="color: #10b981;">${inviteLink}</span>
                </p>
              </div>
            </body>
            </html>
          `
        });

        console.log('Invitation email sent to:', email);
      } else {
        console.warn('RESEND_API_KEY not set, skipping email send');
      }
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the whole request if email fails
    }

    return res.status(200).json({
      success: true,
      invitation,
      inviteLink,
      message: 'Manager invitation created successfully'
    });
  } catch (error) {
    console.error('=== INVITE MANAGER ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
