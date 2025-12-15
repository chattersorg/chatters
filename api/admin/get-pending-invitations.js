// /api/admin/get-pending-invitations.js
const { createClient } = require('@supabase/supabase-js');
const { requireMasterRole } = require('../auth-helper');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userData = await requireMasterRole(req);

    const { data: invitations, error } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('account_id', userData.account_id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Get pending invitations error:', error);
    return res.status(500).json({ error: error.message });
  }
};
