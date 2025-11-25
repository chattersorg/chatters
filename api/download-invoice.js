const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
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
      .select('account_id, role')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized - user not found' });
    }

    // Only masters can download invoices
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Forbidden - only account owners can download invoices' });
    }

    // Get invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Verify the invoice belongs to the user's account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', user.account_id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check the invoice's customer matches the user's account
    if (invoice.customer !== account.stripe_customer_id) {
      return res.status(403).json({ error: 'Forbidden - this invoice does not belong to your account' });
    }

    // Return the PDF URL
    return res.status(200).json({
      url: invoice.invoice_pdf,
      hosted_url: invoice.hosted_invoice_url
    });

  } catch (error) {
    console.error('Error retrieving invoice:', error);
    return res.status(500).json({
      error: 'Failed to retrieve invoice',
      message: error.message
    });
  }
};
