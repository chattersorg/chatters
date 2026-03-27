// /api/admin/update-manager-venues.js
// Update venue access for a manager with hierarchy validation

const { createClient } = require('@supabase/supabase-js');
const { requirePermission, requireHierarchy } = require('../auth-helper');

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
    // Require managers.venues permission
    const userData = await requirePermission(req, 'managers.venues');
    const { managerId, venueIds } = req.body;

    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }

    if (!venueIds || !Array.isArray(venueIds) || venueIds.length === 0) {
      return res.status(400).json({ error: 'At least one venue must be assigned' });
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
      return res.status(403).json({ error: 'Cannot modify venue access for users outside your account' });
    }

    // Cannot modify master or admin venue access
    if (targetManager.role === 'master' || targetManager.role === 'admin') {
      return res.status(403).json({ error: 'Cannot modify venue access for master or admin users' });
    }

    // Validate hierarchy - managers can only update venues for their subordinates
    await requireHierarchy(userData, managerId);

    // Verify all venues belong to the account
    const { data: venues, error: venuesError } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('account_id', userData.account_id)
      .in('id', venueIds);

    if (venuesError) {
      throw new Error('Failed to verify venues');
    }

    if (!venues || venues.length !== venueIds.length) {
      return res.status(403).json({ error: 'Some venues do not belong to your account' });
    }

    // For non-master/admin users, verify they have access to all the venues they're assigning
    if (userData.role === 'manager') {
      const { data: userVenues } = await supabaseAdmin
        .from('staff')
        .select('venue_id')
        .eq('user_id', userData.id);

      const userVenueIds = new Set(userVenues?.map(v => v.venue_id) || []);
      const unauthorizedVenues = venueIds.filter(vid => !userVenueIds.has(vid));

      if (unauthorizedVenues.length > 0) {
        return res.status(403).json({
          error: 'You can only assign venues you have access to'
        });
      }
    }

    // Get current venue assignments for audit log
    const { data: currentStaff } = await supabaseAdmin
      .from('staff')
      .select('venue_id')
      .eq('user_id', managerId);

    const previousVenueIds = currentStaff?.map(s => s.venue_id) || [];

    // Delete existing venue assignments
    const { error: deleteError } = await supabaseAdmin
      .from('staff')
      .delete()
      .eq('user_id', managerId);

    if (deleteError) {
      throw new Error('Failed to update venue assignments');
    }

    // Insert new venue assignments
    const newStaffRecords = venueIds.map(venueId => ({
      user_id: managerId,
      venue_id: venueId,
      role: 'manager'
    }));

    const { error: insertError } = await supabaseAdmin
      .from('staff')
      .insert(newStaffRecords);

    if (insertError) {
      // Try to restore previous assignments on failure
      if (previousVenueIds.length > 0) {
        await supabaseAdmin
          .from('staff')
          .insert(previousVenueIds.map(vid => ({
            user_id: managerId,
            venue_id: vid,
            role: 'manager'
          })));
      }
      throw new Error('Failed to update venue assignments');
    }

    // Log the change
    console.log('Venue access update:', {
      updatedBy: userData.id,
      updatedByRole: userData.role,
      targetUser: managerId,
      previousVenues: previousVenueIds,
      newVenues: venueIds,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Venue access updated successfully',
      venueIds
    });

  } catch (error) {
    console.error('Update manager venues error:', error);
    return res.status(error.message.includes('hierarchy') ? 403 : 500).json({
      error: error.message || 'Internal server error'
    });
  }
};
