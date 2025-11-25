import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Valid price IDs - only allow these
const VALID_PRICE_IDS = [
  process.env.REACT_APP_STRIPE_PRICE_MONTHLY,
  process.env.REACT_APP_STRIPE_PRICE_YEARLY
].filter(Boolean);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Extract and verify authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { newPriceId } = req.body;

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
      return res.status(404).json({ error: 'User not found' });
    }

    // Only masters can update subscriptions
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can manage subscriptions' });
    }

    // Validate price ID
    if (!newPriceId || !VALID_PRICE_IDS.includes(newPriceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Get account with subscription
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.account_id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (!account.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription to update' });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);

    if (subscription.status !== 'active') {
      return res.status(400).json({ error: 'Subscription is not active' });
    }

    // Get current subscription item
    const subscriptionItemId = subscription.items.data[0].id;
    const currentPriceId = subscription.items.data[0].price.id;
    const currentQuantity = subscription.items.data[0].quantity;

    // Check if trying to switch to the same plan
    if (currentPriceId === newPriceId) {
      return res.status(400).json({ error: 'Already on this plan' });
    }

    // Determine if upgrade or downgrade
    const isYearlyPrice = newPriceId === process.env.REACT_APP_STRIPE_PRICE_YEARLY;
    const currentIsYearly = currentPriceId === process.env.REACT_APP_STRIPE_PRICE_YEARLY;

    // Update the subscription
    // proration_behavior: 'create_prorations' will automatically handle credits/charges
    const updatedSubscription = await stripe.subscriptions.update(
      account.stripe_subscription_id,
      {
        items: [{
          id: subscriptionItemId,
          price: newPriceId,
          quantity: currentQuantity
        }],
        proration_behavior: 'create_prorations', // Automatically adjust for mid-cycle changes
        metadata: {
          previous_price_id: currentPriceId,
          updated_at: new Date().toISOString()
        }
      }
    );

    // Get the upcoming invoice to show the prorated amount
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: account.stripe_customer_id
    });

    return res.status(200).json({
      success: true,
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      newPlan: isYearlyPrice ? 'yearly' : 'monthly',
      previousPlan: currentIsYearly ? 'yearly' : 'monthly',
      prorationAmount: upcomingInvoice.amount_due / 100,
      nextBillingDate: new Date(updatedSubscription.current_period_end * 1000).toISOString()
    });

  } catch (error) {
    console.error('Subscription update error:', error);
    return res.status(500).json({ error: error.message });
  }
}
