// /api/managers/list.js
// Get list of managers the current user can manage

import { createClient } from '@supabase/supabase-js';

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
    // Get optional venueId filter from query params
    const { venueId } = req.query;

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

    // If venueId is provided, verify it belongs to user's account
    if (venueId) {
      const { data: venue, error: venueError } = await supabaseAdmin
        .from('venues')
        .select('id, account_id')
        .eq('id', venueId)
        .single();

      if (venueError || !venue || venue.account_id !== userData.account_id) {
        return res.status(403).json({ error: 'Invalid venue' });
      }
    }

    // Get all managers in the account with their details
    const { data: managers, error: managersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        role,
        invited_by,
        reports_to,
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
    const managersWithVenueAccess = new Set();
    staffData?.forEach(staff => {
      if (!venuesByManager.has(staff.user_id)) {
        venuesByManager.set(staff.user_id, []);
      }
      if (staff.venues) {
        venuesByManager.get(staff.user_id).push(staff.venues);
      }
      // Track which managers have access to the requested venue
      if (venueId && staff.venue_id === venueId) {
        managersWithVenueAccess.add(staff.user_id);
      }
    });

    // Build hierarchy tree to check if user manages someone (directly or indirectly)
    // Uses reports_to for hierarchy, falls back to invited_by for backward compatibility
    const isInHierarchyChain = (targetId, managerId) => {
      // Check if managerId is above targetId in the hierarchy (directly or through chain)
      let current = managers.find(m => m.id === targetId);
      const visited = new Set();

      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        // Use reports_to first, fall back to invited_by
        const parentId = current.reports_to || current.invited_by;
        if (parentId === managerId) {
          return true;
        }
        // Move up the chain
        current = managers.find(m => m.id === parentId);
      }
      return false;
    };

    // Determine which managers the current user can see
    const canManage = (managerId) => {
      // Master can see all
      if (userData.role === 'master' || userData.role === 'admin') {
        return true;
      }

      // Only show managers that report to this user (directly or indirectly)
      return isInHierarchyChain(managerId, user.id);
    };

    // Filter and enrich managers
    const enrichedManagers = managers
      .filter(m => canManage(m.id))
      // If venueId is provided, only show managers with access to that venue
      .filter(m => !venueId || managersWithVenueAccess.has(m.id))
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

    // Build hierarchy tree for all users
    // For master/admin: shows all managers with master as root
    // For managers: shows their direct reports with them as root
    const hierarchy = buildHierarchy(enrichedManagers, user.id);

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
    // Use reports_to for hierarchy, fall back to invited_by for backward compatibility
    const parentId = manager.reports_to || manager.invited_by;

    if (parentId === masterId || !parentId) {
      // Direct report of master/root
      tree.push(node);
    } else if (managerMap.has(parentId)) {
      // Child of another manager
      managerMap.get(parentId).children.push(node);
    } else {
      // Orphaned (parent not in list) - add to root
      tree.push(node);
    }
  });

  return tree;
}
