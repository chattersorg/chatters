// /api/admin/revoke-invitation.js
const { createClient } = require('@supabase/supabase-js');
const { requireMasterRole } = require('../auth-helper');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userData = await requireMasterRole(req);
    const { invitationId } = req.body;

    if (!invitationId) {
      return res.status(400).json({ error: 'Invitation ID required' });
    }

    // Verify the invitation belongs to the user's account and is pending
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('account_id', userData.account_id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const { error } = await supabaseAdmin
      .from('manager_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return res.status(500).json({ error: error.message });
  }
};
