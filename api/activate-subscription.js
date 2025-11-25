const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Valid price IDs - only allow these
const VALID_PRICE_IDS = [
  process.env.REACT_APP_STRIPE_PRICE_MONTHLY,
  process.env.REACT_APP_STRIPE_PRICE_YEARLY
].filter(Boolean);

/**
 * Activate subscription for a customer with saved payment method
 * Call this when trial ends or when manually activating
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract and verify authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { priceId } = req.body;

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

    // Only masters can activate subscriptions
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can activate subscriptions' });
    }

    // Validate price ID
    if (!priceId || !VALID_PRICE_IDS.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Get account with Stripe customer ID
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id, account_type')
      .eq('id', user.account_id)
      .single();

    if (accountError || !account?.stripe_customer_id) {
      return res.status(404).json({ error: 'Account or Stripe customer not found' });
    }

    // Get actual venue count from database
    const { count: venueCount, error: countError } = await supabase
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', user.account_id);

    if (countError) {
      throw new Error(`Failed to count venues: ${countError.message}`);
    }

    const quantity = Math.max(venueCount || 1, 1); // At least 1 venue

    // Check if customer has a payment method saved
    const paymentMethods = await stripe.paymentMethods.list({
      customer: account.stripe_customer_id,
      type: 'card',
      limit: 1
    });

    if (paymentMethods.data.length === 0) {
      return res.status(400).json({
        error: 'No payment method on file',
        message: 'Customer must add a payment method before activating subscription'
      });
    }

    // Set the default payment method
    const defaultPaymentMethod = paymentMethods.data[0].id;
    await stripe.customers.update(account.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: defaultPaymentMethod
      }
    });

    // Create the subscription with correct venue quantity
    const subscription = await stripe.subscriptions.create({
      customer: account.stripe_customer_id,
      items: [{ price: priceId, quantity: quantity }],
      default_payment_method: defaultPaymentMethod,
      metadata: {
        chatters_account_id: user.account_id
      }
    });

    // Update account in database
    await supabase
      .from('accounts')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        account_type: 'paid',
        is_paid: subscription.status === 'active',
        trial_ends_at: null
      })
      .eq('id', user.account_id);

    return res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      quantity: quantity
    });

  } catch (error) {
    console.error('Error activating subscription:', error);
    return res.status(500).json({
      error: 'Failed to activate subscription',
      message: error.message
    });
  }
};
