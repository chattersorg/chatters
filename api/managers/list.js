// /api/managers/list.js
// Get list of managers the current user can manage

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's role and account
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, account_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all managers in the account with their details
    const { data: managers, error: managersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        role,
        invited_by,
        created_at,
        first_name,
        last_name
      `)
      .eq('account_id', userData.account_id)
      .eq('role', 'manager')
      .is('deleted_at', null);

    if (managersError) {
      console.error('Error fetching managers:', managersError);
      return res.status(500).json({ error: 'Failed to fetch managers' });
    }

    // Get venue access for each manager
    const managerIds = managers.map(m => m.id);

    const { data: staffData } = await supabaseAdmin
      .from('staff')
      .select('user_id, venue_id, venues(id, name)')
      .in('user_id', managerIds);

    // Get current user's venues for filtering
    const { data: userVenues } = await supabaseAdmin
      .from('staff')
      .select('venue_id')
      .eq('user_id', user.id);

    const userVenueIds = new Set(userVenues?.map(v => v.venue_id) || []);

    // Build venue map for each manager
    const venuesByManager = new Map();
    staffData?.forEach(staff => {
      if (!venuesByManager.has(staff.user_id)) {
        venuesByManager.set(staff.user_id, []);
      }
      if (staff.venues) {
        venuesByManager.get(staff.user_id).push(staff.venues);
      }
    });

    // Determine which managers the current user can see
    const canManage = (managerId) => {
      // Master can see all
      if (userData.role === 'master' || userData.role === 'admin') {
        return true;
      }

      const manager = managers.find(m => m.id === managerId);
      if (!manager) return false;

      // Check if current user invited this manager
      if (manager.invited_by === user.id) {
        return true;
      }

      // Check venue scope - all manager's venues must be in user's venues
      const managerVenues = venuesByManager.get(managerId) || [];
      const managerVenueIds = managerVenues.map(v => v.id);

      if (managerVenueIds.length === 0) return false;

      return managerVenueIds.every(vid => userVenueIds.has(vid));
    };

    // Filter and enrich managers
    const enrichedManagers = managers
      .filter(m => canManage(m.id))
      .map(manager => ({
        ...manager,
        venues: venuesByManager.get(manager.id) || [],
        invited_by_name: null // Will be populated below
      }));

    // Get inviter names
    const inviterIds = [...new Set(enrichedManagers.map(m => m.invited_by).filter(Boolean))];
    if (inviterIds.length > 0) {
      const { data: inviters } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', inviterIds);

      const inviterMap = new Map(inviters?.map(i => [i.id, i]) || []);

      enrichedManagers.forEach(manager => {
        if (manager.invited_by) {
          const inviter = inviterMap.get(manager.invited_by);
          if (inviter) {
            manager.invited_by_name = inviter.first_name && inviter.last_name
              ? `${inviter.first_name} ${inviter.last_name}`
              : inviter.email;
          }
        }
      });
    }

    // Build hierarchy tree for master/admin view
    let hierarchy = null;
    if (userData.role === 'master' || userData.role === 'admin') {
      hierarchy = buildHierarchy(enrichedManagers, userData.id);
    }

    return res.status(200).json({
      managers: enrichedManagers,
      hierarchy,
      currentUserRole: userData.role
    });

  } catch (error) {
    console.error('Managers List API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function buildHierarchy(managers, masterId) {
  const tree = [];
  const managerMap = new Map(managers.map(m => [m.id, { ...m, children: [] }]));

  managers.forEach(manager => {
    const node = managerMap.get(manager.id);
    if (manager.invited_by === masterId || !manager.invited_by) {
      // Direct report of master
      tree.push(node);
    } else if (managerMap.has(manager.invited_by)) {
      // Child of another manager
      managerMap.get(manager.invited_by).children.push(node);
    } else {
      // Orphaned (inviter not in list) - add to root
      tree.push(node);
    }
  });

  return tree;
}
