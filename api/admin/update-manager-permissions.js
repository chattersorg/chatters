// /api/admin/update-manager-permissions.js
// Update permissions for a manager with validation to prevent escalation

const { createClient } = require('@supabase/supabase-js');
const { requirePermission, requireHierarchy } = require('../auth-helper');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// List of permission codes that only master/admin can grant
const MASTER_ONLY_PERMISSIONS = [
  'billing.view',
  'billing.manage'
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require managers.permissions permission
    const userData = await requirePermission(req, 'managers.permissions');

    const {
      managerId,
      roleTemplateId,
      customPermissions = []
    } = req.body;

    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }

    // Verify the target manager exists and belongs to same account
    const { data: targetManager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('id, account_id, role')
      .eq('id', managerId)
      .is('deleted_at', null)
      .single();

    if (managerError || !targetManager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    if (targetManager.account_id !== userData.account_id) {
      return res.status(403).json({ error: 'Cannot modify permissions for users outside your account' });
    }

    // Cannot modify master or admin permissions
    if (targetManager.role === 'master' || targetManager.role === 'admin') {
      return res.status(403).json({ error: 'Cannot modify permissions for master or admin users' });
    }

    // Validate hierarchy - managers can only update permissions for their subordinates
    await requireHierarchy(userData, managerId);

    // For non-master/admin users, validate they can only grant permissions they have
    if (userData.role === 'manager') {
      // Get the current user's permissions
      const { data: inviterPerm } = await supabaseAdmin
        .from('user_permissions')
        .select(`
          role_template_id,
          custom_permissions,
          role_templates (
            role_template_permissions (
              permissions (code)
            )
          )
        `)
        .eq('user_id', userData.id)
        .single();

      let inviterPermissions = [];
      if (inviterPerm?.role_templates?.role_template_permissions) {
        inviterPermissions = inviterPerm.role_templates.role_template_permissions
          .map(rtp => rtp.permissions?.code)
          .filter(Boolean);
      }
      if (inviterPerm?.custom_permissions) {
        inviterPermissions = [...inviterPermissions, ...inviterPerm.custom_permissions];
      }

      // Validate template permissions
      if (roleTemplateId) {
        const { data: templateData } = await supabaseAdmin
          .from('role_templates')
          .select(`
            id,
            role_template_permissions (
              permissions (code, master_only)
            )
          `)
          .eq('id', roleTemplateId)
          .single();

        if (templateData?.role_template_permissions) {
          const templatePerms = templateData.role_template_permissions
            .map(rtp => rtp.permissions)
            .filter(Boolean);

          // Check for master_only permissions or permissions the inviter doesn't have
          for (const perm of templatePerms) {
            if (perm.master_only) {
              return res.status(403).json({
                error: `Cannot assign template with master-only permission: ${perm.code}`
              });
            }
            if (!inviterPermissions.includes(perm.code)) {
              return res.status(403).json({
                error: `Cannot assign permission you don't have: ${perm.code}`
              });
            }
          }
        }
      }

      // Validate custom permissions
      if (customPermissions.length > 0) {
        // Check for master-only permissions
        const forbiddenPerms = customPermissions.filter(code =>
          MASTER_ONLY_PERMISSIONS.includes(code)
        );
        if (forbiddenPerms.length > 0) {
          return res.status(403).json({
            error: `Cannot assign master-only permissions: ${forbiddenPerms.join(', ')}`
          });
        }

        // Check for permissions the inviter doesn't have
        const missingPerms = customPermissions.filter(code =>
          !inviterPermissions.includes(code)
        );
        if (missingPerms.length > 0) {
          return res.status(403).json({
            error: `Cannot assign permissions you don't have: ${missingPerms.join(', ')}`
          });
        }
      }
    }

    // All validation passed - update or insert permissions
    // Check if user_permissions record exists and get current state for audit
    const { data: existingPerm } = await supabaseAdmin
      .from('user_permissions')
      .select('id, role_template_id, custom_permissions')
      .eq('user_id', managerId)
      .maybeSingle();

    const permissionData = {
      user_id: managerId,
      account_id: userData.account_id,
      role_template_id: roleTemplateId || null,
      custom_permissions: roleTemplateId ? [] : customPermissions,
      created_by: userData.id,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingPerm?.id) {
      const { data, error } = await supabaseAdmin
        .from('user_permissions')
        .update(permissionData)
        .eq('id', existingPerm.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('user_permissions')
        .insert(permissionData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log the permission change for audit (database table)
    try {
      await supabaseAdmin
        .from('permission_audit_log')
        .insert({
          target_user_id: managerId,
          changed_by_user_id: userData.id,
          action: existingPerm?.id ? 'update' : 'create',
          previous_role_template_id: existingPerm?.role_template_id || null,
          previous_custom_permissions: existingPerm?.custom_permissions || [],
          new_role_template_id: roleTemplateId || null,
          new_custom_permissions: roleTemplateId ? [] : customPermissions,
          account_id: userData.account_id,
          ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
          user_agent: req.headers['user-agent'] || null
        });
    } catch (auditError) {
      // Don't fail the request if audit logging fails - just log it
      console.error('Failed to write audit log:', auditError);
    }

    // Also log to console for immediate visibility
    console.log('Permission update:', {
      updatedBy: userData.id,
      updatedByRole: userData.role,
      targetUser: managerId,
      action: existingPerm?.id ? 'update' : 'create',
      previousTemplate: existingPerm?.role_template_id || null,
      newTemplate: roleTemplateId || null,
      previousCustom: existingPerm?.custom_permissions || [],
      newCustom: roleTemplateId ? [] : customPermissions,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
};
