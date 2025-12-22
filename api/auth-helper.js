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
  
  if (userData.role !== 'master') {
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
  authenticateVenueAccess
};