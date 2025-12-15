// /api/create-account-from-invitation.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Look up the invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invError || !invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired'
      });
    }

    // Check if invitation has already been accepted
    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been used'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Create the user account in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: invitation.first_name,
        last_name: invitation.last_name
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account: ' + authError.message
      });
    }

    // Create user record in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        phone: invitation.phone || null,
        date_of_birth: invitation.date_of_birth || null,
        role: 'manager',
        account_id: invitation.account_id
      });

    if (userError) {
      console.error('User table insertion error:', userError);
      // Try to delete the auth user since we failed to create the database record
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user record: ' + userError.message
      });
    }

    // Create staff records for each venue
    const staffRecords = invitation.venue_ids.map(venueId => ({
      user_id: authData.user.id,
      venue_id: venueId,
      role: 'manager'
    }));

    const { error: staffError } = await supabaseAdmin
      .from('staff')
      .insert(staffRecords);

    if (staffError) {
      console.error('Staff records creation error:', staffError);
      // Don't fail the whole request, but log it
    }

    // Create user permissions if a permission template was specified
    if (invitation.permission_template_id) {
      const { error: permError } = await supabaseAdmin
        .from('user_permissions')
        .insert({
          user_id: authData.user.id,
          account_id: invitation.account_id,
          role_template_id: invitation.permission_template_id,
          custom_permissions: [],
          created_by: invitation.invited_by
        });

      if (permError) {
        console.error('User permissions creation error:', permError);
        // Don't fail the whole request, but log it
      }
    }

    // Mark invitation as accepted
    await supabaseAdmin
      .from('manager_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('token', token);

    return res.status(200).json({
      success: true,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Create account from invitation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
