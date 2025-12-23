const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// VAT number type mapping for Stripe
const VAT_TYPE_MAP = {
  AT: 'eu_vat',
  BE: 'eu_vat',
  BG: 'eu_vat',
  HR: 'eu_vat',
  CY: 'eu_vat',
  CZ: 'eu_vat',
  DK: 'eu_vat',
  EE: 'eu_vat',
  FI: 'eu_vat',
  FR: 'eu_vat',
  DE: 'eu_vat',
  GR: 'eu_vat',
  HU: 'eu_vat',
  IE: 'eu_vat',
  IT: 'eu_vat',
  LV: 'eu_vat',
  LT: 'eu_vat',
  LU: 'eu_vat',
  MT: 'eu_vat',
  NL: 'eu_vat',
  PL: 'eu_vat',
  PT: 'eu_vat',
  RO: 'eu_vat',
  SK: 'eu_vat',
  SI: 'eu_vat',
  ES: 'eu_vat',
  SE: 'eu_vat',
  GB: 'gb_vat'
};

/**
 * Update Stripe customer with VAT number and billing address
 * This is called before payment to ensure tax is calculated correctly
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

    const { vatNumber, country, address } = req.body;

    // Get user's account and Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Only masters can update billing info
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Only account owners can update billing information' });
    }

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', user.account_id)
      .single();

    if (accountError) {
      return res.status(500).json({ error: 'Failed to fetch account' });
    }

    if (!account?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found. Please complete checkout first.' });
    }

    const updates = {};

    // Update billing address if provided
    if (address) {
      updates.address = {
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        country: address.country || country || 'GB'
      };
    }

    // Update the customer with the address
    if (Object.keys(updates).length > 0) {
      await stripe.customers.update(account.stripe_customer_id, updates);
    }

    // Add VAT number if provided
    if (vatNumber && country) {
      const vatType = VAT_TYPE_MAP[country];

      if (vatType) {
        const cleanVatNumber = vatNumber.replace(/\s/g, '').toUpperCase();

        try {
          // First, check if this tax ID already exists
          const existingTaxIds = await stripe.customers.listTaxIds(
            account.stripe_customer_id,
            { limit: 10 }
          );

          const alreadyExists = existingTaxIds.data.some(
            taxId => taxId.value.toUpperCase() === cleanVatNumber
          );

          if (!alreadyExists) {
            // Add the tax ID
            await stripe.customers.createTaxId(
              account.stripe_customer_id,
              {
                type: vatType,
                value: cleanVatNumber
              }
            );
          }
        } catch (taxError) {
          // If the tax ID is invalid or already exists, log but don't fail
          console.error('Tax ID error:', taxError.message);
          // Continue - the main customer update succeeded
        }
      }
    }

    // Update the customer's tax exempt status if they have a valid EU VAT
    // This is for B2B reverse charge scenarios
    if (vatNumber && country && country !== 'GB') {
      const vatType = VAT_TYPE_MAP[country];
      if (vatType === 'eu_vat') {
        // For EU B2B customers with valid VAT, set tax_exempt to 'reverse'
        await stripe.customers.update(account.stripe_customer_id, {
          tax_exempt: 'reverse'
        });
      }
    } else if (vatNumber && country === 'GB') {
      // UK customers with VAT are still charged UK VAT
      await stripe.customers.update(account.stripe_customer_id, {
        tax_exempt: 'none'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer tax information updated'
    });

  } catch (error) {
    console.error('Error updating customer tax info:', error);
    return res.status(500).json({
      error: 'Failed to update tax information',
      message: error.message
    });
  }
};
