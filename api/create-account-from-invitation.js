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

    // Check if user already exists (excluding soft-deleted users)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .is('deleted_at', null)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Check if there's a soft-deleted user with this email that we can restore
    const { data: softDeletedUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .not('deleted_at', 'is', null)
      .single();

    let authUserId;

    if (softDeletedUser) {
      // User was previously soft-deleted, update the auth user's password and restore the record
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        softDeletedUser.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: invitation.first_name,
            last_name: invitation.last_name
          }
        }
      );

      if (updateAuthError) {
        console.error('Auth user update error:', updateAuthError);
        return res.status(500).json({
          success: false,
          message: 'Failed to restore user account: ' + updateAuthError.message
        });
      }

      // Restore the user record by clearing deleted_at and updating info
      const { error: restoreError } = await supabaseAdmin
        .from('users')
        .update({
          deleted_at: null,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          phone: invitation.phone || null,
          date_of_birth: invitation.date_of_birth || null,
          role: 'manager',
          account_id: invitation.account_id
        })
        .eq('id', softDeletedUser.id);

      if (restoreError) {
        console.error('User restore error:', restoreError);
        return res.status(500).json({
          success: false,
          message: 'Failed to restore user record: ' + restoreError.message
        });
      }

      authUserId = softDeletedUser.id;
    } else {
      // Create new user account in Supabase Auth
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
        // Check if the error is because the user already exists in Supabase Auth
        // This can happen if auth user exists but users table record was hard-deleted
        if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
          console.log('Auth user already exists, attempting to find and update existing user');

          // List users by email to find the existing auth user
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

          if (listError) {
            console.error('Error listing users:', listError);
            return res.status(500).json({
              success: false,
              message: 'Failed to create user account: ' + authError.message
            });
          }

          const existingAuthUser = listData.users.find(u => u.email === invitation.email);

          if (existingAuthUser) {
            // Update the existing auth user's password and metadata
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              {
                password: password,
                email_confirm: true,
                user_metadata: {
                  first_name: invitation.first_name,
                  last_name: invitation.last_name
                }
              }
            );

            if (updateError) {
              console.error('Error updating existing auth user:', updateError);
              return res.status(500).json({
                success: false,
                message: 'Failed to update user account: ' + updateError.message
              });
            }

            authUserId = existingAuthUser.id;
          } else {
            console.error('Auth user creation error:', authError);
            return res.status(500).json({
              success: false,
              message: 'Failed to create user account: ' + authError.message
            });
          }
        } else {
          console.error('Auth user creation error:', authError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create user account: ' + authError.message
          });
        }
      } else {
        authUserId = authData.user.id;
      }

      // Create or update user record in users table
      const { data: existingUserRecord } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', authUserId)
        .single();

      if (existingUserRecord) {
        // Update existing record (might have been hard-deleted and we're reusing the auth user)
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            email: invitation.email,
            first_name: invitation.first_name,
            last_name: invitation.last_name,
            phone: invitation.phone || null,
            date_of_birth: invitation.date_of_birth || null,
            role: 'manager',
            account_id: invitation.account_id,
            deleted_at: null
          })
          .eq('id', authUserId);

        if (updateError) {
          console.error('User table update error:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to update user record: ' + updateError.message
          });
        }
      } else {
        // Create new record
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUserId,
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
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          return res.status(500).json({
            success: false,
            message: 'Failed to create user record: ' + userError.message
          });
        }
      }
    }

    // Delete any existing staff records for this user (in case they were soft-deleted)
    await supabaseAdmin
      .from('staff')
      .delete()
      .eq('user_id', authUserId);

    // Create staff records for each venue
    const staffRecords = invitation.venue_ids.map(venueId => ({
      user_id: authUserId,
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

    // Delete any existing user permissions (in case they were soft-deleted)
    await supabaseAdmin
      .from('user_permissions')
      .delete()
      .eq('user_id', authUserId);

    // Create user permissions if a permission template was specified
    if (invitation.permission_template_id) {
      const { error: permError } = await supabaseAdmin
        .from('user_permissions')
        .insert({
          user_id: authUserId,
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
