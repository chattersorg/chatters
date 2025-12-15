// /api/admin/update-manager.js
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
    const { managerId, firstName, lastName, phone, dateOfBirth } = req.body;

    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Verify the manager belongs to the same account
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('id, account_id, role')
      .eq('id', managerId)
      .eq('role', 'manager')
      .is('deleted_at', null)
      .single();

    if (managerError || !manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    if (manager.account_id !== userData.account_id) {
      return res.status(403).json({ error: 'You do not have permission to edit this manager' });
    }

    // Update the manager's details
    const { data: updatedManager, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        date_of_birth: dateOfBirth || null
      })
      .eq('id', managerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating manager:', updateError);
      throw new Error('Failed to update manager: ' + updateError.message);
    }

    return res.status(200).json({
      success: true,
      manager: updatedManager,
      message: 'Manager updated successfully'
    });
  } catch (error) {
    console.error('Update manager error:', error);
    return res.status(500).json({ error: error.message });
  }
};
