// /api/modules/list.js
// List available modules and account's enabled modules

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

    // Get user's account
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, account_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For managers without direct account_id, get it via staff
    let accountId = userData.account_id;
    if (!accountId && userData.role === 'manager') {
      const { data: staffRow } = await supabaseAdmin
        .from('staff')
        .select('venues!inner(account_id)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      accountId = staffRow?.venues?.account_id;
    }

    if (!accountId) {
      return res.status(400).json({ error: 'No account found for user' });
    }

    // Get all available modules
    const { data: allModules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .order('display_order');

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      return res.status(500).json({ error: 'Failed to fetch modules' });
    }

    // Get account's enabled modules
    const { data: accountModules, error: accountModulesError } = await supabaseAdmin
      .from('account_modules')
      .select('*')
      .eq('account_id', accountId);

    if (accountModulesError) {
      console.error('Error fetching account modules:', accountModulesError);
      return res.status(500).json({ error: 'Failed to fetch account modules' });
    }

    // Get account info for legacy pricing check
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, is_legacy_pricing, is_paid, trial_ends_at')
      .eq('id', accountId)
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      return res.status(500).json({ error: 'Failed to fetch account' });
    }

    // Get venue count for pricing calculations
    const { count: venueCount } = await supabaseAdmin
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // Enrich modules with enabled status
    const now = new Date();
    const enrichedModules = allModules.map(module => {
      const accountModule = accountModules?.find(am => am.module_code === module.code);
      const isEnabled = accountModule && (!accountModule.disabled_at || new Date(accountModule.disabled_at) > now);

      return {
        ...module,
        enabled: isEnabled,
        enabled_at: accountModule?.enabled_at || null,
        disabled_at: accountModule?.disabled_at || null,
        stripe_subscription_item_id: accountModule?.stripe_subscription_item_id || null,
      };
    });

    return res.status(200).json({
      modules: enrichedModules,
      account: {
        id: account.id,
        is_legacy_pricing: account.is_legacy_pricing,
        is_paid: account.is_paid,
        trial_ends_at: account.trial_ends_at,
      },
      venue_count: venueCount || 0,
    });

  } catch (error) {
    console.error('Modules List API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
