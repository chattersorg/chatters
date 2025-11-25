import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }

    // Get all accounts with stripe subscription IDs
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, stripe_subscription_id')
      .not('stripe_subscription_id', 'is', null);

    if (accountsError) {
      throw accountsError;
    }

    // Fetch subscription details from Stripe for each account
    const mrrByAccount = {};
    let totalMRR = 0;

    for (const account of accounts || []) {
      if (account.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);

          // Only count active subscriptions
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            // Calculate MRR from the subscription
            // For yearly subscriptions, divide by 12 to get monthly equivalent
            let accountMRR = 0;

            for (const item of subscription.items.data) {
              const price = item.price;
              const quantity = item.quantity || 1;

              if (price.recurring) {
                let amount = (price.unit_amount / 100) * quantity;

                // Convert to monthly if yearly
                if (price.recurring.interval === 'year') {
                  amount = amount / 12;
                } else if (price.recurring.interval === 'week') {
                  amount = amount * 4.33; // Average weeks per month
                } else if (price.recurring.interval === 'day') {
                  amount = amount * 30; // Average days per month
                }
                // 'month' stays as is

                accountMRR += amount;
              }
            }

            mrrByAccount[account.id] = Math.round(accountMRR * 100) / 100; // Round to 2 decimal places
            totalMRR += accountMRR;
          } else {
            mrrByAccount[account.id] = 0;
          }
        } catch (stripeError) {
          // Subscription might not exist anymore
          console.error(`Error fetching subscription ${account.stripe_subscription_id}:`, stripeError.message);
          mrrByAccount[account.id] = 0;
        }
      }
    }

    return res.status(200).json({
      mrrByAccount,
      totalMRR: Math.round(totalMRR * 100) / 100
    });

  } catch (error) {
    console.error('Admin MRR fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
