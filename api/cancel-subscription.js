const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: 'Account ID is required' });
  }

  // Extract and verify authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the user's session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Unauthorized - invalid token' });
    }

    // Get user's role and account_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized - user not found' });
    }

    // Check user has access to this account and is a master
    if (user.account_id !== accountId) {
      return res.status(403).json({ error: 'Forbidden - you do not have access to this account' });
    }

    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can cancel subscriptions' });
    }

    // Get account data from Supabase
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_subscription_id')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (!account.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel subscription at period end (don't cancel immediately)
    const subscription = await stripe.subscriptions.update(
      account.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    );

    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end
      }
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
};
