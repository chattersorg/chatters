// /api/auth-helper.js
const { createClient } = require('@supabase/supabase-js');

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Service role client for admin queries after user is authenticated
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticateAdmin(req) {
  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization token');
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify user with regular client (not service role)
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Invalid authorization token');
  }

  // Use service role to query users table (bypasses RLS)
  // This is safe because we've already verified the user's identity above
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, role, account_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  return userData;
}

async function requireMasterRole(req) {
  const userData = await authenticateAdmin(req);

  // Allow both master and admin roles (admins can impersonate)
  if (!['master', 'admin'].includes(userData.role)) {
    throw new Error('Insufficient permissions. Master role required.');
  }

  return userData;
}

async function requireAdminRole(req) {
  const userData = await authenticateAdmin(req);
  
  if (!['admin', 'master'].includes(userData.role)) {
    throw new Error('Insufficient permissions. Admin role required.');
  }

  return userData;
}

async function requirePermission(req, permissionCode) {
  const userData = await authenticateAdmin(req);

  // Admin and master users always have all permissions
  if (['admin', 'master'].includes(userData.role)) {
    return userData;
  }

  // For managers, check their permissions
  // First get user's permission record
  const { data: userPerm } = await supabaseAdmin
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
    .maybeSingle();

  let hasPermission = false;

  if (userPerm) {
    // Check custom permissions first
    if (userPerm.custom_permissions?.includes(permissionCode)) {
      hasPermission = true;
    }
    // Then check role template permissions
    else if (userPerm.role_templates?.role_template_permissions) {
      hasPermission = userPerm.role_templates.role_template_permissions.some(
        rtp => rtp.permissions?.code === permissionCode
      );
    }
  } else {
    // No explicit permissions assigned - fall back to Viewer template
    // This handles newly invited managers who haven't had permissions assigned yet
    const { data: viewerTemplate } = await supabaseAdmin
      .from('role_templates')
      .select(`
        role_template_permissions (
          permissions (code)
        )
      `)
      .eq('code', 'viewer')
      .single();

    if (viewerTemplate?.role_template_permissions) {
      hasPermission = viewerTemplate.role_template_permissions.some(
        rtp => rtp.permissions?.code === permissionCode
      );
    }
  }

  if (!hasPermission) {
    throw new Error(`Insufficient permissions. ${permissionCode} permission required.`);
  }

  return userData;
}

/**
 * Check if a target user is within the requester's hierarchy.
 * Returns true if:
 * - Requester is master/admin (can manage all in account)
 * - Target reports to requester (directly or indirectly via reports_to/invited_by chain)
 *
 * @param {string} requesterId - The user making the request
 * @param {string} targetId - The user being acted upon
 * @param {string} accountId - The account to scope the query
 * @returns {Promise<boolean>}
 */
async function isInHierarchy(requesterId, targetId, accountId) {
  // Get all managers in the account
  const { data: allManagers } = await supabaseAdmin
    .from('users')
    .select('id, reports_to, invited_by')
    .eq('account_id', accountId)
    .eq('role', 'manager')
    .is('deleted_at', null);

  if (!allManagers) return false;

  // Build set of subordinate IDs by traversing the hierarchy
  const subordinateIds = new Set();
  const findSubordinates = (managerId) => {
    (allManagers || []).forEach(m => {
      // Use reports_to if available, fall back to invited_by
      const parentId = m.reports_to || m.invited_by;
      if (parentId === managerId && !subordinateIds.has(m.id)) {
        subordinateIds.add(m.id);
        findSubordinates(m.id);
      }
    });
  };
  findSubordinates(requesterId);

  return subordinateIds.has(targetId);
}

/**
 * Require that a target user is within the requester's hierarchy.
 * Masters/admins can manage all managers in their account.
 * Managers can only manage their subordinates.
 *
 * @param {object} userData - The authenticated user data (from requirePermission)
 * @param {string} targetId - The user being acted upon
 * @throws {Error} if target is not in hierarchy
 */
async function requireHierarchy(userData, targetId) {
  // Masters and admins can manage all managers in their account
  if (['master', 'admin'].includes(userData.role)) {
    return true;
  }

  // For managers, check hierarchy
  const inHierarchy = await isInHierarchy(userData.id, targetId, userData.account_id);
  if (!inHierarchy) {
    throw new Error('You can only manage users who report to you in the hierarchy.');
  }

  return true;
}

async function authenticateVenueAccess(req, venueId) {
  const userData = await authenticateAdmin(req);

  // Admin users have access to all venues
  if (userData.role === 'admin') {
    return userData;
  }

  // Master users have access to venues in their account
  if (userData.role === 'master') {
    const { data: venue, error } = await supabaseAdmin
      .from('venues')
      .select('account_id')
      .eq('id', venueId)
      .single();

    if (error || !venue) {
      throw new Error('Venue not found');
    }

    if (venue.account_id !== userData.account_id) {
      throw new Error('Access denied. Venue not in your account.');
    }

    return userData;
  }

  // Manager users have access to venues they're assigned to via staff table
  if (userData.role === 'manager') {
    const { data: staffRecord, error } = await supabaseAdmin
      .from('staff')
      .select('venue_id')
      .eq('user_id', userData.id)
      .eq('venue_id', venueId)
      .single();

    if (error || !staffRecord) {
      throw new Error('Access denied. You are not assigned to this venue.');
    }

    return userData;
  }

  throw new Error('Insufficient permissions');
}

module.exports = {
  authenticateAdmin,
  requireMasterRole,
  requireAdminRole,
  requirePermission,
  authenticateVenueAccess,
  isInHierarchy,
  requireHierarchy
};