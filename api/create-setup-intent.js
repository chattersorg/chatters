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

    // Check user has access to this account
    if (user.account_id !== accountId) {
      return res.status(403).json({ error: 'Forbidden - you do not have access to this account' });
    }

    // Only masters can update payment methods
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can update payment methods' });
    }

    // Get account data from Supabase
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (!account.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found for this account' });
    }

    // Create SetupIntent for updating payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: account.stripe_customer_id,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow saving for future use
      metadata: {
        chatters_account_id: accountId,
        purpose: 'update_payment_method'
      }
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return res.status(500).json({
      error: 'Failed to create setup intent',
      message: error.message
    });
  }
};
