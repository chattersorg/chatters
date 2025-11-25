// /pages/api/webhook.js
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Check if event has already been processed (idempotency)
 * Returns true if this is a duplicate event
 */
async function isEventProcessed(eventId) {
  const { data } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single();

  return !!data;
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId, eventType, customerId = null) {
  await supabase
    .from('stripe_webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      customer_id: customerId,
      processed_at: new Date().toISOString()
    });
}

/**
 * Helper function to find account by Stripe customer ID
 * Falls back to email lookup for checkout.session.completed (first-time customers)
 */
async function findAccountByCustomer(customerId, fallbackEmail = null) {
  // First try to find by customer ID (most reliable)
  if (customerId) {
    const { data: account } = await supabase
      .from('accounts')
      .select('id, stripe_subscription_id, stripe_subscription_status')
      .eq('stripe_customer_id', customerId)
      .single();

    if (account) {
      return { account, source: 'customer_id' };
    }
  }

  // Fall back to email lookup only for new customers (checkout.session.completed)
  // This is needed because customer_id might not be saved yet for first-time checkouts
  if (fallbackEmail) {
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .ilike('email', fallbackEmail) // Case-insensitive email match
      .single();

    if (user?.account_id) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id, stripe_subscription_id, stripe_subscription_status')
        .eq('id', user.account_id)
        .single();

      if (account) {
        return { account, source: 'email' };
      }
    }
  }

  return { account: null, source: null };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: 'Webhook error' });
  }

  // Idempotency check - skip if already processed
  const isDuplicate = await isEventProcessed(event.id);
  if (isDuplicate) {
    console.log('Duplicate event, skipping:', event.id);
    return res.status(200).json({ received: true, duplicate: true });
  }

  // Handle different webhook events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const customerEmail = session.customer_email;

        // Try customer_id first, then fall back to email for new customers
        const { account, source } = await findAccountByCustomer(customerId, customerEmail);

        if (account) {
          const { error: updateError } = await supabase
            .from('accounts')
            .update({
              is_paid: true,
              trial_ends_at: null,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_subscription_status: 'active',
              account_type: 'paid'
            })
            .eq('id', account.id);

          if (updateError) throw updateError;
          console.log(`Account marked as paid: ${account.id} (found via ${source})`);
        } else {
          console.warn('No account found for customer:', customerId, 'email:', customerEmail);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const isActive = subscription.status === 'active';

        // Ignore canceled or ended subscriptions (old incomplete subscriptions)
        if (subscription.ended_at || subscription.canceled_at) {
          console.log('Ignoring ended/canceled subscription:', subscription.id, 'Status:', subscription.status);
          break;
        }

        // Find account by customer ID
        const { account } = await findAccountByCustomer(customerId);

        if (!account) {
          console.warn('No account found for customer:', customerId);
          break;
        }

        // Only update if this is the current subscription OR if we don't have one yet
        if (!account.stripe_subscription_id || account.stripe_subscription_id === subscription.id) {
          const { error: updateError } = await supabase
            .from('accounts')
            .update({
              is_paid: isActive,
              stripe_subscription_id: subscription.id,
              stripe_subscription_status: subscription.status,
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              trial_ends_at: isActive ? null : undefined,
              account_type: isActive ? 'paid' : undefined
            })
            .eq('stripe_customer_id', customerId);

          if (updateError) throw updateError;
          console.log('Subscription updated:', subscription.id, 'Status:', subscription.status, 'Cancel at period end:', subscription.cancel_at_period_end);
        } else {
          console.log('Ignoring update for non-active subscription:', subscription.id);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const isActive = subscription.status === 'active';

        // Ignore canceled or ended subscriptions
        if (subscription.ended_at || subscription.canceled_at) {
          console.log('Ignoring ended/canceled subscription creation:', subscription.id);
          break;
        }

        // Update account when subscription is first created
        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            is_paid: isActive,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: isActive ? null : undefined,
            account_type: isActive ? 'paid' : undefined
          })
          .eq('stripe_customer_id', customerId);

        if (updateError) throw updateError;
        console.log('Subscription created:', subscription.id, 'Status:', subscription.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find account by customer ID
        const { account } = await findAccountByCustomer(customerId);

        if (!account) {
          console.warn('No account found for customer:', customerId);
          break;
        }

        // Only mark as canceled if this is the current subscription
        if (account.stripe_subscription_id === subscription.id) {
          const { error: updateError } = await supabase
            .from('accounts')
            .update({
              is_paid: false,
              stripe_subscription_id: null,
              stripe_subscription_status: 'canceled'
            })
            .eq('stripe_customer_id', customerId);

          if (updateError) throw updateError;
          console.log('Subscription cancelled:', subscription.id);
        } else {
          console.log('Ignoring deletion of non-active subscription:', subscription.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const attemptCount = invoice.attempt_count || 1;

        // Get current account state
        const { account } = await findAccountByCustomer(customerId);

        // Update account to reflect payment failure with dunning tracking
        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            stripe_subscription_status: 'past_due',
            payment_failed_at: account?.payment_failed_at || new Date().toISOString(),
            payment_failure_count: attemptCount,
            last_payment_error: invoice.last_payment_error?.message || 'Payment failed'
          })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('Error updating account for payment failure:', updateError);
        }

        // Log for manual dunning follow-up (could integrate email service here)
        console.log('Payment failed for customer:', customerId, 'Attempt:', attemptCount);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        // Update account with payment success and clear dunning state
        const updateData = {
          is_paid: true,
          payment_failed_at: null,
          payment_failure_count: 0,
          last_payment_error: null
        };

        if (subscriptionId) {
          updateData.stripe_subscription_id = subscriptionId;
          updateData.stripe_subscription_status = 'active';
          updateData.account_type = 'paid';
          updateData.trial_ends_at = null;
        }

        const { error: updateError } = await supabase
          .from('accounts')
          .update(updateData)
          .eq('stripe_customer_id', customerId);

        if (updateError) throw updateError;
        console.log('Payment succeeded for customer:', customerId);
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object;
        console.log('Payment processing for customer:', paymentIntent.customer);
        break;
      }

      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object;
        const customerId = setupIntent.customer;

        // Payment method successfully added
        console.log('Payment method added for customer:', customerId);

        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId);

        if (updateError) console.error('Error updating account:', updateError);
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object;
        console.log('Customer updated:', customer.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Mark event as processed for idempotency
    await markEventProcessed(event.id, event.type, event.data.object?.customer);

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ message: err.message });
  }
}
