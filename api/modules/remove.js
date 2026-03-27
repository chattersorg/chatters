// /api/modules/remove.js
// Remove a module from an account's subscription
// Module access continues until the end of the current billing period

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleCode } = req.body;

    if (!moduleCode) {
      return res.status(400).json({ error: 'Module code is required' });
    }

    // Cannot remove core modules
    if (moduleCode === 'feedback') {
      return res.status(400).json({ error: 'Cannot remove the core Feedback module' });
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

    // Only masters can remove modules
    if (userData.role !== 'master') {
      return res.status(403).json({ error: 'Only account owners can manage modules' });
    }

    const accountId = userData.account_id;
    if (!accountId) {
      return res.status(400).json({ error: 'No account found for user' });
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

    // Legacy accounts cannot remove modules (they have all features)
    if (account.is_legacy_pricing) {
      return res.status(400).json({ error: 'Legacy accounts cannot modify modules' });
    }

    // Check if module is enabled
    const { data: accountModule, error: moduleError } = await supabaseAdmin
      .from('account_modules')
      .select('*')
      .eq('account_id', accountId)
      .eq('module_code', moduleCode)
      .single();

    if (moduleError || !accountModule) {
      return res.status(400).json({ error: 'Module is not enabled' });
    }

    const now = new Date();
    if (accountModule.disabled_at && new Date(accountModule.disabled_at) <= now) {
      return res.status(400).json({ error: 'Module is already disabled' });
    }

    // For trial/unpaid accounts, disable immediately
    if (!account.is_paid || !account.stripe_subscription_id) {
      await supabaseAdmin
        .from('account_modules')
        .update({ disabled_at: new Date().toISOString() })
        .eq('id', accountModule.id);

      return res.status(200).json({
        success: true,
        message: 'Module disabled',
        access_until: new Date().toISOString(),
      });
    }

    // For paid accounts, get the subscription period end
    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      // Subscription not active, disable immediately
      await supabaseAdmin
        .from('account_modules')
        .update({ disabled_at: new Date().toISOString() })
        .eq('id', accountModule.id);

      return res.status(200).json({
        success: true,
        message: 'Module disabled',
        access_until: new Date().toISOString(),
      });
    }

    // Set disabled_at to the end of the current billing period
    const periodEnd = new Date(subscription.current_period_end * 1000);

    await supabaseAdmin
      .from('account_modules')
      .update({ disabled_at: periodEnd.toISOString() })
      .eq('id', accountModule.id);

    // Schedule the Stripe subscription item for removal at period end
    // Note: We'll delete the item in the webhook when the subscription renews
    // For now, just mark it for deletion
    if (accountModule.stripe_subscription_item_id) {
      try {
        // Use clear_usage: true to avoid issues, and prorate: false for no refund
        await stripe.subscriptionItems.update(accountModule.stripe_subscription_item_id, {
          metadata: {
            pending_deletion: 'true',
            delete_at: periodEnd.toISOString(),
          },
        });
      } catch (stripeError) {
        console.error('Error updating subscription item:', stripeError);
        // Don't fail the request, the module is already marked as disabled
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Module will be removed at the end of your billing period',
      access_until: periodEnd.toISOString(),
    });

  } catch (error) {
    console.error('Module Remove API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
