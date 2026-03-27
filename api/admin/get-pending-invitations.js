// /api/admin/get-pending-invitations.js
const { createClient } = require('@supabase/supabase-js');
const { requirePermission } = require('../auth-helper');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require managers.invite permission (same as invite-manager endpoint)
    const userData = await requirePermission(req, 'managers.invite');

    // For admin users impersonating, get account_id from query param
    // For master users, use their own account_id
    let accountId = userData.account_id;

    if (!accountId && req.query.accountId) {
      // Admin user impersonating - use the provided account_id
      accountId = req.query.accountId;
    }

    if (!accountId) {
      return res.status(200).json({ invitations: [] });
    }

    // Build the query
    let query = supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // For managers (non-master/admin), only show invitations they created
    if (userData.role === 'manager') {
      query = query.eq('invited_by', userData.id);
    }

    const { data: invitations, error } = await query;

    if (error) throw error;

    return res.status(200).json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Get pending invitations error:', error);
    return res.status(500).json({ error: error.message });
  }
};
