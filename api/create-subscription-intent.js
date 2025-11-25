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
      .select('account_id, role, email')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only masters can create subscriptions
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can manage subscriptions' });
    }

    // Validate price ID
    if (!priceId || !VALID_PRICE_IDS.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', user.account_id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get actual venue count from database - don't trust client input
    const { count: venueCount, error: countError } = await supabase
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', user.account_id);

    if (countError) {
      throw new Error(`Failed to count venues: ${countError.message}`);
    }

    const quantity = Math.max(venueCount || 1, 1); // At least 1 venue

    let customerId = account.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          chatters_account_id: user.account_id,
        },
      });
      customerId = customer.id;

      // Save customer ID to account
      await supabase
        .from('accounts')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.account_id);
    }

    // Create the subscription with payment pending
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card', 'bacs_debit'],
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        chatters_account_id: user.account_id
      },
      expand: ['latest_invoice.payment_intent'],
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    return res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      quantity: quantity
    });
  } catch (error) {
    console.error('Subscription intent creation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
