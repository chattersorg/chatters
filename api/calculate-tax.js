const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// EU country codes for reverse charge eligibility
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

/**
 * Calculate tax for a subscription based on billing address
 * Uses Stripe Tax Calculations API to get accurate tax rates
 * Handles VAT reverse charge for EU B2B customers
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

    const { billingPeriod, address, vatNumber } = req.body;

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

    // Check if this is an EU B2B transaction (reverse charge applies)
    const isEUCountry = EU_COUNTRIES.includes(address.country);
    const hasValidVat = vatNumber && vatNumber.length >= 5;
    const isReverseCharge = isEUCountry && hasValidVat;

    // If reverse charge applies, return 0% tax
    if (isReverseCharge) {
      return res.status(200).json({
        subtotal: subtotalCents / 100,
        taxAmount: 0,
        taxRate: 0,
        total: subtotalCents / 100,
        currency: 'gbp',
        country: address.country,
        reverseCharge: true,
        message: 'Reverse charge - VAT not applicable'
      });
    }

    // Use Stripe Tax Calculations API for non-reverse-charge scenarios
    const calculationParams = {
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
    };

    // If customer has a valid UK VAT number, include it (they still pay VAT but it's recorded)
    if (address.country === 'GB' && vatNumber) {
      calculationParams.customer_details.tax_ids = [{
        type: 'gb_vat',
        value: vatNumber.replace(/\s/g, '').toUpperCase()
      }];
    }

    const calculation = await stripe.tax.calculations.create(calculationParams);

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
      reverseCharge: false,
      calculationId: calculation.id
    });

  } catch (error) {
    console.error('Error calculating tax:', error);

    // If Stripe Tax fails, try to return a reasonable fallback
    try {
      const { billingPeriod, address } = req.body;

      // Get price for fallback calculation
      const priceId = billingPeriod === 'monthly'
        ? process.env.REACT_APP_STRIPE_PRICE_MONTHLY
        : process.env.REACT_APP_STRIPE_PRICE_YEARLY;
      const price = await stripe.prices.retrieve(priceId);

      const { data: user } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', (await supabase.auth.getUser(req.headers.authorization.replace('Bearer ', ''))).data.user.id)
        .single();

      const { count: venueCount } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', user?.account_id);

      const quantity = Math.max(venueCount || 1, 1);
      const subtotalCents = price.unit_amount * quantity;

      // Fallback: UK = 20%, EU = 0% (assume B2B reverse charge), other = 0%
      let taxRate = 0;
      if (address?.country === 'GB') {
        taxRate = 20;
      }

      const taxAmountCents = Math.round(subtotalCents * taxRate / 100);

      return res.status(200).json({
        subtotal: subtotalCents / 100,
        taxAmount: taxAmountCents / 100,
        taxRate: taxRate,
        total: (subtotalCents + taxAmountCents) / 100,
        currency: 'gbp',
        country: address?.country,
        fallback: true,
        message: 'Using estimated tax rate'
      });
    } catch (fallbackError) {
      // Complete failure - return zeros
      return res.status(200).json({
        subtotal: 0,
        taxAmount: 0,
        taxRate: 0,
        total: 0,
        error: 'Tax calculation unavailable',
        message: error.message
      });
    }
  }
};
