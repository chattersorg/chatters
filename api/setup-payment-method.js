const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create a SetupIntent for collecting payment method without charging
 * This is used during trial to collect payment details for future billing
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

    // Get user's role and account_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_id, role, email')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized - user not found' });
    }

    // Only masters can setup payment methods
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can manage payment methods' });
    }

    // Get account data
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id, name')
      .eq('id', user.account_id)
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      throw new Error(`Database error: ${accountError.message}`);
    }

    let customerId = account?.stripe_customer_id;

    // If no customer exists, create one
    if (!customerId) {
      console.log('Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: user.email,
        name: account?.name || user.email,
        metadata: {
          chatters_account_id: user.account_id,
          chatters_account_name: account?.name || user.email,
          account_type: 'trial'
        }
      });

      customerId = customer.id;
      console.log('Stripe customer created:', customerId);

      // Save customer ID to database
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.account_id);

      if (updateError) {
        console.error('Error saving customer ID to database:', updateError);
        throw new Error(`Failed to save customer ID: ${updateError.message}`);
      }
    }

    // Create SetupIntent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        chatters_account_id: user.account_id
      }
    });

    return res.status(200).json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return res.status(500).json({
      error: 'Failed to create setup intent',
      message: error.message
    });
  }
};
