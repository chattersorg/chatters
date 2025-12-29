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
    // Note: For master users created via admin panel, the user record exists but has no auth user yet
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', invitation.email)
      .is('deleted_at', null)
      .single();

    // If user exists and is a master user (created via admin), allow them to set password
    // If user exists and is already a manager with auth, block them
    if (existingUser && existingUser.role !== 'master') {
      // Check if this user already has an auth account (can sign in)
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const hasAuthAccount = listData?.users?.some(u => u.email === invitation.email);

      if (hasAuthAccount) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists'
        });
      }
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
          account_id: invitation.account_id,
          invited_by: invitation.invited_by
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
      // Check if there's an existing user record by email (master users created via admin panel)
      // We need to check this BEFORE creating auth user so we can use the same ID
      const { data: existingUserByEmail } = await supabaseAdmin
        .from('users')
        .select('id, role, first_name, last_name')
        .eq('email', invitation.email)
        .is('deleted_at', null)
        .single();

      if (existingUserByEmail) {
        // Master user exists - create auth user with the SAME ID as the existing user record
        // This avoids foreign key constraint issues
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          id: existingUserByEmail.id, // Use the existing user's ID!
          email: invitation.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: invitation.first_name || existingUserByEmail.first_name,
            last_name: invitation.last_name || existingUserByEmail.last_name
          }
        });

        if (authError) {
          // If auth user already exists with different ID, try to update it
          if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            const existingAuthUser = listData?.users?.find(u => u.email === invitation.email);

            if (existingAuthUser) {
              const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingAuthUser.id,
                {
                  password: password,
                  email_confirm: true,
                  user_metadata: {
                    first_name: invitation.first_name || existingUserByEmail.first_name,
                    last_name: invitation.last_name || existingUserByEmail.last_name
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

        // Update the user record (don't change ID, just update other fields)
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            first_name: invitation.first_name || existingUserByEmail.first_name,
            last_name: invitation.last_name || existingUserByEmail.last_name,
            phone: invitation.phone || null,
            date_of_birth: invitation.date_of_birth || null,
            deleted_at: null,
            invited_by: invitation.invited_by
            // Preserve the existing role (master/manager)
          })
          .eq('id', existingUserByEmail.id);

        if (updateError) {
          console.error('User table update error:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to update user record: ' + updateError.message
          });
        }

        authUserId = existingUserByEmail.id;
      } else {
        // No existing user - create new auth user with auto-generated ID
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: invitation.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: invitation.first_name,
            last_name: invitation.last_name
          }
        });

        if (authError) {
          if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            const existingAuthUser = listData?.users?.find(u => u.email === invitation.email);

            if (existingAuthUser) {
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
        // Use upsert to handle both insert and update cases
        // This ensures invited_by is always set correctly, even if a record was created by a trigger
        const { error: upsertError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: authUserId,
            email: invitation.email,
            first_name: invitation.first_name,
            last_name: invitation.last_name,
            phone: invitation.phone || null,
            date_of_birth: invitation.date_of_birth || null,
            role: 'manager',
            account_id: invitation.account_id,
            deleted_at: null,
            invited_by: invitation.invited_by
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error('User table upsert error:', upsertError);
          // Try to delete the auth user since we failed to create the database record
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          return res.status(500).json({
            success: false,
            message: 'Failed to create user record: ' + upsertError.message
          });
        }
      }
    }

    // Only create staff records for manager invitations (not master users)
    // Master users created via admin panel have empty venue_ids array
    if (invitation.venue_ids && invitation.venue_ids.length > 0) {
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
