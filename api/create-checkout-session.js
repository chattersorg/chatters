import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Valid price IDs - only allow these
const VALID_PRICE_IDS = [
  process.env.REACT_APP_STRIPE_PRICE_MONTHLY,
  process.env.REACT_APP_STRIPE_PRICE_YEARLY
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
  const { priceId } = req.body;

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

    // Only masters can create checkout sessions
    if (user.role !== 'master') {
      return res.status(403).json({ error: 'Only account owners can manage billing' });
    }

    // Validate price ID
    if (!priceId || !VALID_PRICE_IDS.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
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

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'https://my.getchatters.com'}/dashboard`,
      cancel_url: `${process.env.APP_URL || 'https://my.getchatters.com'}/account/billing`,
      customer_email: user.email,
      metadata: {
        chatters_account_id: user.account_id
      }
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
