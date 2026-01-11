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
 * Sync account_modules based on Stripe subscription items
 * Creates/updates module records based on what's in the subscription
 */
async function syncAccountModules(accountId, subscription) {
  const items = subscription.items?.data || [];
  const now = new Date().toISOString();

  // Get module codes from subscription item metadata
  const moduleCodes = [];
  const itemsByModule = {};

  for (const item of items) {
    const moduleCode = item.metadata?.module_code || item.price?.metadata?.module_code;
    if (moduleCode) {
      moduleCodes.push(moduleCode);
      itemsByModule[moduleCode] = item.id;
    }
  }

  // If no modules found in subscription, this might be a legacy pricing subscription
  if (moduleCodes.length === 0) {
    const isLegacy = subscription.metadata?.is_legacy_pricing === 'true';
    if (isLegacy) {
      // Legacy accounts get all modules - enable feedback at minimum
      moduleCodes.push('feedback');
      // Mark account as legacy pricing
      await supabase
        .from('accounts')
        .update({ is_legacy_pricing: true })
        .eq('id', accountId);
    }
    return;
  }

  // For each module in the subscription, ensure it's enabled
  for (const moduleCode of moduleCodes) {
    const stripeItemId = itemsByModule[moduleCode] || null;

    // Check if module record exists
    const { data: existing } = await supabase
      .from('account_modules')
      .select('id, disabled_at')
      .eq('account_id', accountId)
      .eq('module_code', moduleCode)
      .single();

    if (existing) {
      // Update existing - clear disabled_at if it was set, update stripe item id
      await supabase
        .from('account_modules')
        .update({
          disabled_at: null,
          stripe_subscription_item_id: stripeItemId,
        })
        .eq('id', existing.id);
    } else {
      // Create new module record
      await supabase
        .from('account_modules')
        .insert({
          account_id: accountId,
          module_code: moduleCode,
          enabled_at: now,
          stripe_subscription_item_id: stripeItemId,
        });
    }
  }

  console.log(`Synced ${moduleCodes.length} modules for account ${accountId}:`, moduleCodes);
}

/**
 * Handle modules marked for deletion at period end
 * Called when subscription renews to clean up old module items
 */
async function processModuleDeletions(accountId, subscription) {
  const items = subscription.items?.data || [];

  for (const item of items) {
    if (item.metadata?.pending_deletion === 'true') {
      const moduleCode = item.metadata?.module_code || item.price?.metadata?.module_code;

      // Delete the subscription item from Stripe
      try {
        await stripe.subscriptionItems.del(item.id);
        console.log(`Deleted subscription item ${item.id} for module ${moduleCode}`);
      } catch (err) {
        console.error(`Failed to delete subscription item ${item.id}:`, err.message);
      }

      // Update account_modules record
      if (moduleCode) {
        await supabase
          .from('account_modules')
          .update({
            stripe_subscription_item_id: null,
          })
          .eq('account_id', accountId)
          .eq('module_code', moduleCode);
      }
    }
  }
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

          // Sync account_modules based on subscription items
          if (subscriptionId) {
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['items.data.price'],
              });
              await syncAccountModules(account.id, subscription);
            } catch (syncErr) {
              console.error('Error syncing account modules:', syncErr);
            }
          }
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

        // Find account to get account_id for module sync
        const { account } = await findAccountByCustomer(customerId);

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

        // Sync account_modules based on subscription items
        if (account && isActive) {
          try {
            await syncAccountModules(account.id, subscription);
          } catch (syncErr) {
            console.error('Error syncing account modules:', syncErr);
          }
        }
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

        // Get account details for notification
        let accountName = 'Unknown';
        let accountEmail = '';
        if (account) {
          const { data: accountData } = await supabase
            .from('accounts')
            .select('name')
            .eq('id', account.id)
            .single();
          accountName = accountData?.name || 'Unknown';

          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('account_id', account.id)
            .eq('role', 'master')
            .single();
          accountEmail = userData?.email || '';
        }

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

        // Send Slack notification for payment failure
        if (process.env.SLACK_WEBHOOK_URL) {
          try {
            const amount = (invoice.amount_due / 100).toLocaleString();
            const errorMessage = invoice.last_payment_error?.message || 'Payment failed';
            await fetch(process.env.SLACK_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `Payment failed for: *${accountName}*\nEmail: *${accountEmail}*\nAmount: *£${amount}*\nAttempt: *${attemptCount}*\nError: ${errorMessage}`
              })
            });
          } catch (slackError) {
            console.error('Slack notification failed:', slackError);
          }
        }

        // Log for manual dunning follow-up (could integrate email service here)
        console.log('Payment failed for customer:', customerId, 'Attempt:', attemptCount);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        // Get account details for notification
        const { account } = await findAccountByCustomer(customerId);
        let accountName = 'Unknown';
        let accountEmail = '';
        let venueCount = 0;
        if (account) {
          const { data: accountData } = await supabase
            .from('accounts')
            .select('name')
            .eq('id', account.id)
            .single();
          accountName = accountData?.name || 'Unknown';

          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('account_id', account.id)
            .eq('role', 'master')
            .single();
          accountEmail = userData?.email || '';

          const { count } = await supabase
            .from('venues')
            .select('id', { count: 'exact', head: true })
            .eq('account_id', account.id);
          venueCount = count || 0;
        }

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

        // Process module deletions scheduled for this billing period
        // This handles modules that were marked for removal at period end
        if (account && subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ['items.data.price'],
            });
            await processModuleDeletions(account.id, subscription);
          } catch (delErr) {
            console.error('Error processing module deletions:', delErr);
          }
        }

        // Send Slack notification for payment success
        if (process.env.SLACK_WEBHOOK_URL) {
          try {
            const subtotal = (invoice.subtotal / 100);
            const tax = (invoice.tax / 100) || 0;
            const total = (invoice.total / 100);
            const isMonthly = invoice.lines?.data?.[0]?.price?.recurring?.interval === 'month';
            const period = isMonthly ? 'mo' : 'yr';

            await fetch(process.env.SLACK_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `Payment successful for: *${accountName}*\nEmail: *${accountEmail}*\nPlan: *${isMonthly ? 'Monthly' : 'Annual'}*\nVenues: *${venueCount}*\nSubtotal: *£${subtotal.toLocaleString()}/${period}*\nVAT: *£${tax.toLocaleString()}*\nTotal: *£${total.toLocaleString()}/${period}*`
              })
            });
          } catch (slackError) {
            console.error('Slack notification failed:', slackError);
          }
        }

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
