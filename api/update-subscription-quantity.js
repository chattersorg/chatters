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

    // Only masters can update subscription quantity
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can modify subscriptions' });
    }

    // Get account data from Supabase
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id, stripe_subscription_id, is_paid')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Only update if account has an active paid subscription
    if (!account.is_paid || !account.stripe_subscription_id) {
      return res.status(200).json({
        message: 'No active subscription to update',
        updated: false
      });
    }

    // Count venues for this account
    const { count: venueCount, error: countError } = await supabase
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (countError) {
      throw new Error(`Failed to count venues: ${countError.message}`);
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id, {
      expand: ['items.data.price.product']
    });

    if (!subscription || subscription.status === 'canceled') {
      return res.status(400).json({
        error: 'Subscription is not active',
        updated: false
      });
    }

    // Get the subscription item (there should be only one)
    const subscriptionItem = subscription.items.data[0];
    const subscriptionItemId = subscriptionItem.id;
    const currentQuantity = subscriptionItem.quantity;
    const price = subscriptionItem.price;

    // Check if this is a test/flat-rate plan (doesn't scale with venue count)
    const productName = price.product?.name || '';
    const priceNickname = price.nickname || '';

    // Skip quantity updates for test plans or flat-rate plans
    if (productName.includes('Test') ||
        productName.includes('test') ||
        priceNickname.includes('Test') ||
        priceNickname.includes('test') ||
        price.metadata?.billing_type === 'flat') {
      console.log(`Skipping quantity update for test/flat-rate plan: ${productName || priceNickname}`);
      return res.status(200).json({
        message: 'Test/flat-rate plan - quantity not updated',
        productName,
        priceNickname,
        venueCount,
        updated: false,
        skipped: true
      });
    }

    // Only update if quantity has changed
    if (currentQuantity === venueCount) {
      return res.status(200).json({
        message: 'Quantity unchanged',
        venueCount,
        updated: false
      });
    }

    // Update the subscription quantity
    await stripe.subscriptionItems.update(subscriptionItemId, {
      quantity: venueCount,
      proration_behavior: 'create_prorations',
    });

    console.log(`Updated subscription ${subscription.id} quantity from ${currentQuantity} to ${venueCount}`);

    return res.status(200).json({
      success: true,
      message: 'Subscription quantity updated',
      previousQuantity: currentQuantity,
      newQuantity: venueCount,
      updated: true
    });

  } catch (error) {
    console.error('Error updating subscription quantity:', error);
    return res.status(500).json({
      error: 'Failed to update subscription quantity',
      message: error.message
    });
  }
};
