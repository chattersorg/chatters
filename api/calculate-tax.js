const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Calculate tax for a subscription based on billing address
 * Uses Stripe Tax Calculations API to get accurate tax rates
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

  try {
    // Verify the user's session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Unauthorized - invalid token' });
    }

    // Get user's account_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized - user not found' });
    }

    const { billingPeriod, address } = req.body;

    if (!billingPeriod || !address) {
      return res.status(400).json({ error: 'Missing required fields: billingPeriod, address' });
    }

    // Get venue count for this account
    const { count: venueCount, error: countError } = await supabase
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', user.account_id);

    if (countError) {
      throw new Error(`Failed to count venues: ${countError.message}`);
    }

    const quantity = Math.max(venueCount || 1, 1);

    // Get the correct price ID
    const priceId = billingPeriod === 'monthly'
      ? process.env.REACT_APP_STRIPE_PRICE_MONTHLY
      : process.env.REACT_APP_STRIPE_PRICE_YEARLY;

    // Get price details from Stripe
    const price = await stripe.prices.retrieve(priceId);
    const unitAmount = price.unit_amount; // in cents
    const subtotalCents = unitAmount * quantity;

    // Use Stripe Tax Calculations API
    const calculation = await stripe.tax.calculations.create({
      currency: 'gbp',
      line_items: [
        {
          amount: subtotalCents,
          reference: `venue_subscription_${billingPeriod}`,
          tax_behavior: 'exclusive',
          tax_code: 'txcd_10000000', // General - Electronically Supplied Services
        },
      ],
      customer_details: {
        address: {
          line1: address.line1 || '',
          line2: address.line2 || '',
          city: address.city || '',
          state: address.state || '',
          postal_code: address.postal_code || '',
          country: address.country || 'GB',
        },
        address_source: 'billing',
      },
    });

    // Extract tax information
    const taxAmountCents = calculation.tax_amount_exclusive;
    const totalCents = subtotalCents + taxAmountCents;

    // Calculate effective tax rate
    const taxRate = subtotalCents > 0
      ? Math.round((taxAmountCents / subtotalCents) * 100)
      : 0;

    return res.status(200).json({
      subtotal: subtotalCents / 100,
      taxAmount: taxAmountCents / 100,
      taxRate: taxRate,
      total: totalCents / 100,
      currency: 'gbp',
      country: address.country,
      calculationId: calculation.id
    });

  } catch (error) {
    console.error('Error calculating tax:', error);

    // If Stripe Tax fails, return subtotal without tax calculation
    // This allows the form to continue working
    return res.status(200).json({
      subtotal: 0,
      taxAmount: 0,
      taxRate: 0,
      total: 0,
      error: 'Tax calculation unavailable',
      message: error.message
    });
  }
};
