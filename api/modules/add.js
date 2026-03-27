// /api/modules/add.js
// Add a module to an account's subscription

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Module price IDs mapping
const MODULE_PRICE_IDS = {
  feedback: {
    monthly: process.env.STRIPE_PRICE_FEEDBACK_MONTHLY,
    yearly: process.env.STRIPE_PRICE_FEEDBACK_YEARLY,
  },
  nps: {
    monthly: process.env.STRIPE_PRICE_NPS_MONTHLY,
    yearly: process.env.STRIPE_PRICE_NPS_YEARLY,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleCode } = req.body;

    if (!moduleCode) {
      return res.status(400).json({ error: 'Module code is required' });
    }

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

    // Get user's role and account
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, account_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only masters can add modules
    if (userData.role !== 'master') {
      return res.status(403).json({ error: 'Only account owners can manage modules' });
    }

    const accountId = userData.account_id;
    if (!accountId) {
      return res.status(400).json({ error: 'No account found for user' });
    }

    // Verify the module exists
    const { data: module, error: moduleError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('code', moduleCode)
      .single();

    if (moduleError || !module) {
      return res.status(400).json({ error: 'Invalid module code' });
    }

    // Check if module is already enabled
    const { data: existingModule } = await supabaseAdmin
      .from('account_modules')
      .select('*')
      .eq('account_id', accountId)
      .eq('module_code', moduleCode)
      .single();

    const now = new Date();
    if (existingModule && (!existingModule.disabled_at || new Date(existingModule.disabled_at) > now)) {
      return res.status(400).json({ error: 'Module is already enabled' });
    }

    // Get account details
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('stripe_customer_id, stripe_subscription_id, is_paid, is_legacy_pricing')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Legacy pricing accounts get all modules - just enable it
    if (account.is_legacy_pricing) {
      await enableModule(accountId, moduleCode, null);
      return res.status(200).json({
        success: true,
        message: 'Module enabled (legacy account)',
      });
    }

    // For trial accounts (not paid), just enable the module
    if (!account.is_paid) {
      await enableModule(accountId, moduleCode, null);
      return res.status(200).json({
        success: true,
        message: 'Module enabled for trial',
      });
    }

    // For paid accounts, we need to add a subscription item
    if (!account.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Get current subscription to determine billing interval
    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return res.status(400).json({ error: 'Subscription is not active' });
    }

    // Determine if monthly or yearly based on existing subscription
    const existingItem = subscription.items.data[0];
    const interval = existingItem?.price?.recurring?.interval || 'month';
    const priceType = interval === 'year' ? 'yearly' : 'monthly';

    // Get the price ID for this module
    const modulePrices = MODULE_PRICE_IDS[moduleCode];
    if (!modulePrices || !modulePrices[priceType]) {
      return res.status(400).json({ error: 'Module pricing not configured' });
    }

    const priceId = modulePrices[priceType];

    // Get venue count for quantity
    const { count: venueCount } = await supabaseAdmin
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    const quantity = Math.max(venueCount || 1, 1);

    // Add the subscription item
    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: account.stripe_subscription_id,
      price: priceId,
      quantity: quantity,
      proration_behavior: 'create_prorations', // Prorate for the current period
    });

    // Enable the module in the database
    await enableModule(accountId, moduleCode, subscriptionItem.id);

    return res.status(200).json({
      success: true,
      message: 'Module added to subscription',
      subscription_item_id: subscriptionItem.id,
    });

  } catch (error) {
    console.error('Module Add API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function enableModule(accountId, moduleCode, stripeSubscriptionItemId) {
  // Check if record exists (might be re-enabling a previously disabled module)
  const { data: existing } = await supabaseAdmin
    .from('account_modules')
    .select('id')
    .eq('account_id', accountId)
    .eq('module_code', moduleCode)
    .single();

  if (existing) {
    // Update existing record
    await supabaseAdmin
      .from('account_modules')
      .update({
        enabled_at: new Date().toISOString(),
        disabled_at: null,
        stripe_subscription_item_id: stripeSubscriptionItemId,
      })
      .eq('id', existing.id);
  } else {
    // Insert new record
    await supabaseAdmin
      .from('account_modules')
      .insert({
        account_id: accountId,
        module_code: moduleCode,
        enabled_at: new Date().toISOString(),
        stripe_subscription_item_id: stripeSubscriptionItemId,
      });
  }
}
