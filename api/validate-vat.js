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
 * Validate a VAT number using Stripe's tax ID validation
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

    const { vatNumber, country } = req.body;

    if (!vatNumber || !country) {
      return res.status(400).json({ error: 'Missing required fields: vatNumber, country' });
    }

    // Clean the VAT number (remove spaces, ensure uppercase)
    const cleanVatNumber = vatNumber.replace(/\s/g, '').toUpperCase();

    // Get the VAT type for this country
    const vatType = VAT_TYPE_MAP[country];

    if (!vatType) {
      return res.status(200).json({
        valid: false,
        message: 'VAT numbers not supported for this country'
      });
    }

    // Basic format validation before calling Stripe
    if (cleanVatNumber.length < 5) {
      return res.status(200).json({
        valid: false,
        message: 'VAT number is too short'
      });
    }

    // Get user's account and Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', user.account_id)
      .single();

    if (accountError) {
      return res.status(500).json({ error: 'Failed to fetch account' });
    }

    // If we have a Stripe customer, try to validate the tax ID with Stripe
    if (account?.stripe_customer_id) {
      try {
        // Create a tax ID on the customer to validate it
        // Stripe validates the format and checksum automatically
        const taxId = await stripe.customers.createTaxId(
          account.stripe_customer_id,
          {
            type: vatType,
            value: cleanVatNumber
          }
        );

        // If we get here, the tax ID was valid and has been added
        // The verification status tells us if it's fully verified
        const isVerified = taxId.verification?.status === 'verified';
        const isPending = taxId.verification?.status === 'pending';

        return res.status(200).json({
          valid: true,
          verified: isVerified,
          pending: isPending,
          taxIdId: taxId.id,
          message: isVerified
            ? 'VAT number verified'
            : isPending
              ? 'VAT number valid, verification pending'
              : 'VAT number format valid'
        });
      } catch (stripeError) {
        // Check if the tax ID already exists
        if (stripeError.code === 'tax_id_invalid') {
          return res.status(200).json({
            valid: false,
            message: 'Invalid VAT number format or checksum'
          });
        }

        // If the tax ID already exists on the customer, that's fine
        if (stripeError.code === 'resource_already_exists') {
          return res.status(200).json({
            valid: true,
            verified: true,
            message: 'VAT number already on file'
          });
        }

        console.error('Stripe tax ID validation error:', stripeError);
        return res.status(200).json({
          valid: false,
          message: stripeError.message || 'Could not validate VAT number'
        });
      }
    } else {
      // No Stripe customer yet, just do basic format validation
      // We'll add the tax ID when we create/update the customer
      const isValidFormat = validateVatFormat(cleanVatNumber, country);

      return res.status(200).json({
        valid: isValidFormat,
        pending: true,
        message: isValidFormat
          ? 'VAT number format valid (will be verified on payment)'
          : 'Invalid VAT number format'
      });
    }
  } catch (error) {
    console.error('Error validating VAT:', error);
    return res.status(500).json({
      error: 'Failed to validate VAT number',
      message: error.message
    });
  }
};

/**
 * Basic VAT number format validation
 */
function validateVatFormat(vatNumber, country) {
  // Remove country prefix if present
  const prefixes = {
    AT: /^ATU?/i, BE: /^BE/i, BG: /^BG/i, HR: /^HR/i, CY: /^CY/i,
    CZ: /^CZ/i, DK: /^DK/i, EE: /^EE/i, FI: /^FI/i, FR: /^FR/i,
    DE: /^DE/i, GR: /^(GR|EL)/i, HU: /^HU/i, IE: /^IE/i, IT: /^IT/i,
    LV: /^LV/i, LT: /^LT/i, LU: /^LU/i, MT: /^MT/i, NL: /^NL/i,
    PL: /^PL/i, PT: /^PT/i, RO: /^RO/i, SK: /^SK/i, SI: /^SI/i,
    ES: /^ES/i, SE: /^SE/i, GB: /^GB/i
  };

  let number = vatNumber;
  if (prefixes[country]) {
    number = vatNumber.replace(prefixes[country], '');
  }

  // Basic length checks by country
  const minLengths = {
    AT: 8, BE: 9, BG: 9, HR: 11, CY: 9, CZ: 8, DK: 8, EE: 9, FI: 8,
    FR: 11, DE: 9, GR: 9, HU: 8, IE: 7, IT: 11, LV: 11, LT: 9, LU: 8,
    MT: 8, NL: 12, PL: 10, PT: 9, RO: 2, SK: 10, SI: 8, ES: 9, SE: 12, GB: 9
  };

  const minLength = minLengths[country] || 5;
  return number.length >= minLength;
}
