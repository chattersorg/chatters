# Billing System Implementation - Complete

## Overview

I've implemented a comprehensive billing system that supports three distinct account types with proper Stripe integration and access control.

## Database Changes

### New Columns Added to `accounts` Table

```sql
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'trial' CHECK (account_type IN ('demo', 'trial', 'paid', 'test')),
ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT CHECK (stripe_subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'));
```

## Account Types

1. **`demo`** - Free forever demo accounts - Never billed - Always have access - No payment required

2. **`trial`** - Standard customer accounts - Start with 14-day free trial - After trial ends, access restricted until payment - Convert to `paid` when subscription active

3. **`paid`** - Active paid subscriptions - Requires active Stripe subscription - Access based on `stripe_subscription_status`

4. **`test`** - Internal testing account (£1/mo) - For testing billing flow - Requires active subscription

## Files Created/Modified

### New Files Created

1. **`/src/utils/accountAccess.js`** - `checkAccountAccess(accountId)` - Check if account has access - `getUserAccountId(userId)` - Get account ID for user (handles managers)

2. **`/src/utils/stripeHelpers.js`** - `createStripeCustomer()` - Create Stripe customer from frontend - `createSubscription()` - Create subscription for customer

3. **`/src/hooks/useAccountAccess.js`** - `useAccountAccess()` - React hook for access control with auto-redirect - `useAccountType()` - Hook to get account type for UI changes

4. **`/api/create-stripe-customer.js`** - Serverless function to create Stripe customers - Updates accounts table with `stripe_customer_id` and `account_type`

### Files Modified

1. **`/src/components/dashboard/settings/BillingTab.js`** - Now fetches `account_type` and `stripe_subscription_status` - Uses new columns for access control

2. **`/src/pages/dashboard/Billing.js`** - Now fetches `account_type` and `stripe_subscription_status` - Trial expiration logic updated

3. **`/api/webhook.js`** - All subscription events now update `stripe_subscription_status` - `checkout.session.completed` sets `account_type` to 'paid' - `customer.subscription.updated` syncs subscription status - `customer.subscription.created` syncs subscription status - `customer.subscription.deleted` sets status to 'canceled'

## How It Works

### 1. Account Creation

When a new account is created, call the new API endpoint:

```javascript
import { createStripeCustomer } from '../utils/stripeHelpers';

// Create Stripe customer
const { customerId } = await createStripeCustomer({
  email: user.email,
  accountName: 'Company Name',
  accountId: accountId,
  accountType: 'trial',  // or 'demo', 'test'
  trialEndsAt: trialEndDate
});
```

This will: - Create a Stripe customer - Store `stripe_customer_id` in accounts table - Set `account_type` appropriately - **No subscription is created yet** - customer exists but isn't being charged

### 2. Access Control

Use the `useAccountAccess` hook in protected routes:

```javascript
import { useAccountAccess } from '../hooks/useAccountAccess';

const MyProtectedPage = () => {
  const { hasAccess, loading, accountData } = useAccountAccess({
    redirectOnExpired: true  // Auto-redirect to /billing if no access
  });

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied</div>;

  return <div>Protected content</div>;
};
```

### 3. Subscription Flow

**Trial Accounts:** - Start with `account_type: 'trial'` - Have access until `trial_ends_at` - After trial expires, access is denied unless they subscribe - When they subscribe, `account_type` changes to 'paid'

**Demo Accounts:** - Set `account_type: 'demo'` - Always have access - Never need to subscribe

**Test Account (£1/mo):** - Set `account_type: 'test'` - Create custom £1/mo price in Stripe dashboard - Create subscription immediately with that price ID - Access based on subscription status

### 4. Webhook Syncing

Stripe webhooks automatically keep `stripe_subscription_status` in sync: - `active` - Full access - `past_due` - Grace period (you decide if they have access) - `canceled` - No access - `trialing` - Access during Stripe-managed trial - `incomplete` - Payment pending - `unpaid` - No access

## Implementation Checklist

### ✅ Completed - [x] Database columns added - [x] Utility functions for access checking - [x] React hooks for access control - [x] Stripe customer creation API - [x] Webhook handler updates - [x] Billing page updates

### 🔲 Next Steps

1. **Add Customer Creation on Signup** - Find where accounts are created - Call `createStripeCustomer()` after account creation - Set appropriate `account_type` based on context

2. **Set Up Custom £1/mo Price in Stripe** - Go to Stripe Dashboard → Products - Create new price at £1/mo - Save the price ID - Use it when creating subscriptions for test accounts

3. **Add Access Control to Routes** - Use `useAccountAccess()` hook in main dashboard component - Redirect expired trials to `/billing`

4. **Set Account Types for Existing Accounts**
   ```sql
   -- Set existing paid accounts
   UPDATE accounts
   SET account_type = 'paid'
   WHERE is_paid = true;

   -- Set existing trial accounts
   UPDATE accounts
   SET account_type = 'trial'
   WHERE is_paid = false AND trial_ends_at IS NOT NULL;

   -- Set demo accounts (manually identify these)
   UPDATE accounts
   SET account_type = 'demo'
   WHERE id IN ('your-demo-account-ids');
   ```

5. **Test the Flow** - Create a new trial account → Should create Stripe customer - Let trial expire → Should lose access, redirect to billing - Subscribe → Should regain access, `account_type` changes to 'paid' - Cancel subscription → Should lose access again

## Example: Creating Your £1/mo Test Account Subscription

```javascript
// In Stripe Dashboard or via API
const testAccountPriceId = 'price_xxxxx';  // Your £1/mo price

// When creating your test account
await createStripeCustomer({
  email: 'your-test@email.com',
  accountName: 'Test Account',
  accountId: testAccountId,
  accountType: 'test'
});

// Then create the subscription
await createSubscription({
  customerId: customer.id,
  priceId: testAccountPriceId,
  trialDays: null  // No trial for test account
});
```

## Questions?

All the pieces are in place. The main thing left to do is:

1. Wire up the customer creation when accounts are created
2. Add the access control hook to your main dashboard layout
3. Create the £1/mo price in Stripe for your test account

Let me know if you need help with any of these steps!
