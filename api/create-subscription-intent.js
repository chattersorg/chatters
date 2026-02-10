import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Legacy price IDs (for backwards compatibility)
const LEGACY_PRICE_IDS = [
  process.env.REACT_APP_STRIPE_PRICE_MONTHLY,
  process.env.REACT_APP_STRIPE_PRICE_YEARLY
].filter(Boolean);

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

// All valid price IDs (legacy + module-based)
const ALL_VALID_PRICE_IDS = [
  ...LEGACY_PRICE_IDS,
  ...Object.values(MODULE_PRICE_IDS).flatMap(m => Object.values(m)),
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
  const { priceId, modules, billingInterval } = req.body;

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

    // Determine if using module-based pricing or legacy single price
    const useModulePricing = modules && Array.isArray(modules) && modules.length > 0;

    if (useModulePricing) {
      // Validate billing interval
      if (!billingInterval || !['monthly', 'yearly'].includes(billingInterval)) {
        return res.status(400).json({ error: 'Invalid billing interval' });
      }

      // Validate all modules
      const validModuleCodes = Object.keys(MODULE_PRICE_IDS);
      for (const moduleCode of modules) {
        if (!validModuleCodes.includes(moduleCode)) {
          return res.status(400).json({ error: `Invalid module code: ${moduleCode}` });
        }
        const modulePriceId = MODULE_PRICE_IDS[moduleCode][billingInterval];
        if (!modulePriceId) {
          return res.status(400).json({ error: `Module pricing not configured: ${moduleCode}` });
        }
      }

      // Feedback module is required
      if (!modules.includes('feedback')) {
        return res.status(400).json({ error: 'Feedback module is required' });
      }
    } else {
      // Legacy single price validation
      if (!priceId || !LEGACY_PRICE_IDS.includes(priceId)) {
        return res.status(400).json({ error: 'Invalid price ID' });
      }
    }

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id, name')
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

    // Build subscription items based on pricing model
    let subscriptionItems;
    let isLegacyPricing = false;

    if (useModulePricing) {
      // Module-based pricing: one item per module
      subscriptionItems = modules.map(moduleCode => ({
        price: MODULE_PRICE_IDS[moduleCode][billingInterval],
        quantity: quantity,
        metadata: {
          module_code: moduleCode,
        },
      }));
    } else {
      // Legacy single-price model
      isLegacyPricing = true;
      subscriptionItems = [
        {
          price: priceId,
          quantity: quantity,
        },
      ];
    }

    // Create the subscription with payment pending and automatic tax
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: subscriptionItems,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        chatters_account_id: user.account_id,
        is_legacy_pricing: isLegacyPricing ? 'true' : 'false',
        modules: useModulePricing ? modules.join(',') : '',
      },
      expand: ['latest_invoice.payment_intent', 'latest_invoice'],
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    // Send Slack notification for checkout initiated
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const isMonthly = useModulePricing
          ? billingInterval === 'monthly'
          : priceId === process.env.REACT_APP_STRIPE_PRICE_MONTHLY;
        const planType = isMonthly ? 'Monthly' : 'Annual';
        const period = isMonthly ? 'mo' : 'yr';

        // Get actual amounts from the invoice (includes Stripe Tax calculation)
        const invoice = subscription.latest_invoice;
        const subtotal = invoice.subtotal / 100; // Convert from cents
        const tax = invoice.tax ? invoice.tax / 100 : 0;
        const total = invoice.total / 100;

        const taxLine = tax > 0 ? `\nTax: *£${tax.toLocaleString()}*` : '\nTax: *Calculated at checkout*';

        // Add modules info for module-based pricing
        const modulesLine = useModulePricing
          ? `\nModules: *${modules.join(', ')}*`
          : '\nPlan: *Legacy (All Features)*';

        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Checkout started for: *${account.name || 'Unknown'}*\nBilling: *${planType}*${modulesLine}\nVenues: *${quantity}*\nSubtotal: *£${subtotal.toLocaleString()}/${period}*${taxLine}\nTotal: *£${total.toLocaleString()}/${period}*\n\nAwaiting card details...`
          })
        });
      } catch (slackError) {
        // Don't fail the checkout if Slack notification fails
        console.error('Slack notification failed:', slackError);
      }
    }

    return res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      quantity: quantity,
      modules: useModulePricing ? modules : null,
      isLegacyPricing: isLegacyPricing,
    });
  } catch (error) {
    console.error('Subscription intent creation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
