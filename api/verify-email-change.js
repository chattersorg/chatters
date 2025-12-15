// /api/verify-email-change.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Validate the token and get the email change request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('email_change_requests')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !request) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification link'
      });
    }

    // Check if already verified
    if (request.verified) {
      return res.status(400).json({
        success: false,
        error: 'This email change has already been verified'
      });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(request.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'This verification link has expired. Please request a new email change.'
      });
    }

    // Update the user's email in auth.users using admin API
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      request.user_id,
      { email: request.new_email }
    );

    if (updateAuthError) {
      console.error('Error updating auth email:', updateAuthError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update email address'
      });
    }

    // Update the users table
    const { error: updateUsersError } = await supabaseAdmin
      .from('users')
      .update({ email: request.new_email })
      .eq('id', request.user_id);

    if (updateUsersError) {
      console.error('Error updating users table:', updateUsersError);
      // Don't fail - auth email was updated successfully
    }

    // Mark the request as verified
    const { error: markVerifiedError } = await supabaseAdmin
      .from('email_change_requests')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('token', token);

    if (markVerifiedError) {
      console.error('Error marking request as verified:', markVerifiedError);
      // Don't fail - email was updated successfully
    }

    console.log('Email change verified successfully for user:', request.user_id);

    return res.status(200).json({
      success: true,
      message: 'Email address updated successfully',
      newEmail: request.new_email
    });

  } catch (error) {
    console.error('Error verifying email change:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify email change'
    });
  }
};
