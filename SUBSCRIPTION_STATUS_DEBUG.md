# Stripe Subscription Status Debugging Guide

## Problem
The `stripe_subscription_status` field keeps reverting to `incomplete_expired`.

## Possible Causes

### 1. **Stripe Webhook Events**
The most likely cause is that Stripe is sending webhook events that update the subscription status. This can happen when: - A subscription payment fails - A subscription expires before payment completes - The customer doesn't complete the payment within the allowed time (usually 24 hours) - Multiple webhook events are being received and processed in the wrong order

### 2. **Database Triggers or Functions**
There might be a database trigger or function that automatically updates this field.

### 3. **Scheduled Jobs**
A cron job or scheduled task might be syncing data from Stripe periodically.

### 4. **Application Code**
Frontend or backend code might be inadvertently updating this field.

## Investigation Steps

### Step 1: Check Stripe Dashboard
1. Go to your Stripe Dashboard
2. Navigate to Customers → Find your customer
3. Check their subscription status in Stripe
4. Look at the Events tab to see what events Stripe has sent recently

### Step 2: Check Webhook Logs in Stripe
1. Go to Developers → Webhooks in Stripe Dashboard
2. Check the webhook endpoint logs
3. Look for these events: - `customer.subscription.updated` - `customer.subscription.created` - `customer.subscription.deleted` - `checkout.session.completed`
4. Check if any of these events have `status: 'incomplete_expired'`

### Step 3: Run Diagnostic Queries in Supabase

Open the Supabase SQL Editor and run these queries:

```sql
-- Check the current subscription status
SELECT
    id,
    name,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_subscription_status,
    is_paid,
    account_type,
    updated_at
FROM accounts
ORDER BY updated_at DESC;

-- Check if there are any triggers on accounts table
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'accounts';

-- Check for functions that modify accounts
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_definition LIKE '%accounts%'
AND routine_definition LIKE '%stripe%';
```

### Step 4: Enable Audit Logging

To track who/what is changing the subscription status, run this migration in Supabase SQL Editor:

```sql
-- Create audit log table
CREATE TABLE IF NOT EXISTS accounts_audit_log (
    id BIGSERIAL PRIMARY KEY,
    account_id UUID,
    changed_at TIMESTAMP DEFAULT NOW(),
    changed_by TEXT,
    old_subscription_status TEXT,
    new_subscription_status TEXT,
    old_is_paid BOOLEAN,
    new_is_paid BOOLEAN,
    operation TEXT,
    request_user_agent TEXT,
    request_ip TEXT
);

-- Create trigger function
CREATE OR REPLACE FUNCTION log_accounts_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.stripe_subscription_status IS DISTINCT FROM NEW.stripe_subscription_status
           OR OLD.is_paid IS DISTINCT FROM NEW.is_paid THEN
            INSERT INTO accounts_audit_log (
                account_id,
                changed_by,
                old_subscription_status,
                new_subscription_status,
                old_is_paid,
                new_is_paid,
                operation
            ) VALUES (
                NEW.id,
                current_user,
                OLD.stripe_subscription_status,
                NEW.stripe_subscription_status,
                OLD.is_paid,
                NEW.is_paid,
                TG_OP
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS accounts_changes_trigger ON accounts;
CREATE TRIGGER accounts_changes_trigger
    AFTER UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION log_accounts_changes();

-- Grant access
GRANT SELECT ON accounts_audit_log TO authenticated;
GRANT SELECT ON accounts_audit_log TO service_role;
```

After enabling this, wait for the status to change again, then query:

```sql
SELECT * FROM accounts_audit_log ORDER BY changed_at DESC LIMIT 10;
```

This will show you exactly when and how the status is being changed.

## Common Solutions

### Solution 1: Fix Webhook Processing Order

The webhook handler might be processing events in the wrong order. Update `/api/webhook.js`:

```javascript
case 'customer.subscription.updated': {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  // Only update if the new status is more recent
  const { data: currentAccount } = await supabase
    .from('accounts')
    .select('updated_at, stripe_subscription_status')
    .eq('stripe_customer_id', customerId)
    .single();

  // If subscription is incomplete_expired but we already have an active status, check Stripe
  if (subscription.status === 'incomplete_expired' &&
      currentAccount?.stripe_subscription_status === 'active') {
    console.warn('Ignoring incomplete_expired status as account is currently active');
    break;
  }

  await supabase
    .from('accounts')
    .update({
      is_paid: subscription.status === 'active',
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
    })
    .eq('stripe_customer_id', customerId);

  break;
}
```

### Solution 2: Check Subscription in Stripe Before Updating

Add a check to verify the subscription status directly with Stripe:

```javascript
// In webhook.js, before updating database
const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id);
console.log('Current Stripe subscription status:', stripeSubscription.status);

// Only update if Stripe's current status matches
if (stripeSubscription.status === subscription.status) {
  await supabase.from('accounts').update({...}).eq(...);
}
```

### Solution 3: Ignore Old Incomplete_Expired Events

If you have an active subscription, ignore incomplete_expired events:

```javascript
case 'customer.subscription.updated': {
  const subscription = event.data.object;

  // Don't process incomplete_expired if there's already an active subscription
  if (subscription.status === 'incomplete_expired') {
    const { data: account } = await supabase
      .from('accounts')
      .select('stripe_subscription_status, stripe_subscription_id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (account &&
        account.stripe_subscription_status === 'active' &&
        account.stripe_subscription_id !== subscription.id) {
      console.log('Ignoring incomplete_expired for old subscription');
      break;
    }
  }

  // Continue with update...
}
```

## Prevention

1. **Add Event Timestamp Checking**: Store the event timestamp and only process newer events
2. **Use Stripe Subscription ID**: Check if the incomplete_expired subscription is the same as the currently active one
3. **Add Validation**: Before updating, verify the subscription exists and is the current one in Stripe

## Quick Fix to Test

Run this in Supabase SQL Editor to manually set it back and see how long it takes to revert:

```sql
UPDATE accounts
SET
    stripe_subscription_status = 'active',
    is_paid = true,
    account_type = 'paid'
WHERE stripe_customer_id = 'your-stripe-customer-id';
```

Then check the `accounts_audit_log` table after it reverts to see what changed it.
