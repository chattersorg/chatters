// /api/admin/delete-manager.js
const { createClient } = require('@supabase/supabase-js');
const { requireMasterRole } = require('../auth-helper');

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
    const userData = await requireMasterRole(req);
    const { managerId } = req.body;

    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }

    // Verify the manager belongs to the same account
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('id, email, account_id, role')
      .eq('id', managerId)
      .eq('account_id', userData.account_id)
      .eq('role', 'manager')
      .is('deleted_at', null)
      .single();

    if (managerError || !manager) {
      return res.status(404).json({ error: 'Manager not found or already deleted' });
    }

    // Soft delete the manager
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userData.id
      })
      .eq('id', managerId);

    if (deleteError) {
      console.error('Error soft-deleting manager:', deleteError);
      return res.status(500).json({ error: 'Failed to delete manager' });
    }

    // Also soft-delete any pending invitations for this email
    await supabaseAdmin
      .from('manager_invitations')
      .update({ status: 'rejected' })
      .eq('email', manager.email)
      .eq('status', 'pending');

    // Get the manager's current permissions before deletion for audit log
    const { data: existingPerm } = await supabaseAdmin
      .from('user_permissions')
      .select('role_template_id, custom_permissions')
      .eq('user_id', managerId)
      .single();

    // Log the permission deletion for audit
    try {
      await supabaseAdmin
        .from('permission_audit_log')
        .insert({
          target_user_id: managerId,
          changed_by_user_id: userData.id,
          action: 'delete',
          previous_role_template_id: existingPerm?.role_template_id || null,
          previous_custom_permissions: existingPerm?.custom_permissions || [],
          new_role_template_id: null,
          new_custom_permissions: [],
          account_id: userData.account_id,
          ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
          user_agent: req.headers['user-agent'] || null
        });
    } catch (auditError) {
      console.error('Failed to write audit log:', auditError);
    }

    console.log(`Manager ${manager.email} soft-deleted by ${userData.id}`);

    return res.status(200).json({
      success: true,
      message: `Manager deleted successfully. They can be recovered within 14 days.`
    });

  } catch (error) {
    console.error('Delete manager error:', error);
    return res.status(500).json({ error: error.message });
  }
};
