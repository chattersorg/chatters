# Trial Payment Flow - Collect Payment Details Without Charging

## Overview

This implementation allows you to collect payment details from customers during their trial period **without charging them**. The subscription only activates (and billing begins) when:

1. The trial period expires (automatic)
2. You manually activate it in Stripe (manual)
3. The customer chooses to upgrade early

## How It Works

### Step 1: Customer Signs Up (Trial Starts)

```javascript
import { createStripeCustomer } from '../utils/stripeHelpers';

// When account is created
const trialEndDate = new Date();
trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 day trial

const { customerId } = await createStripeCustomer({
  email: user.email,
  accountName: 'Company Name',
  accountId: accountId,
  accountType: 'trial',
  trialEndsAt: trialEndDate
});
```

**Result:** - ✅ Stripe customer created - ✅ No payment method added yet - ✅ No subscription created - ✅ No charge made - ✅ Account has full access during trial

### Step 2: Customer Adds Payment Method (During Trial)

During trial, show a prompt like: "Add payment details now for seamless access after trial"

```javascript
import { setupPaymentMethod } from '../utils/stripeHelpers';
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Get setup intent
const { clientSecret } = await setupPaymentMethod({
  email: user.email,
  accountId: accountId
});

// Use Stripe Elements to collect payment details
const { error } = await stripe.confirmSetup({
  clientSecret,
  confirmParams: {
    return_url: `${window.location.origin}/account/billing`,
  },
});
```

**Result:** - ✅ Payment method saved to customer - ✅ Still no subscription created - ✅ Still no charge made - ✅ Customer continues trial with peace of mind

### Step 3A: Trial Expires (Automatic Activation)

When trial expires, call the activation endpoint:

```javascript
import { activateSubscription } from '../utils/stripeHelpers';

// When trial ends, activate subscription
const { subscriptionId, status } = await activateSubscription({
  accountId: accountId,
  priceId: process.env.REACT_APP_STRIPE_PRICE_MONTHLY
});

console.log(`Subscription ${subscriptionId} is now ${status}`);
```

**Result:** - ✅ Subscription created using saved payment method - ✅ First payment processed - ✅ Webhook updates account to `account_type: 'paid'` - ✅ Customer continues with seamless access

### Step 3B: Manual Activation in Stripe

You can also manually activate in Stripe Dashboard:

1. Go to **Customers** → Find the customer
2. Click **"Add subscription"**
3. Select your price (monthly/yearly)
4. Choose the saved payment method
5. Click **"Start subscription"**

**Result:** - ✅ Subscription starts immediately - ✅ Payment processed - ✅ Webhook syncs status to database

### Step 3C: Customer Upgrades Early

Customer can choose to end trial early and start subscription:

```javascript
// When customer clicks "Upgrade Now" during trial
const { subscriptionId } = await activateSubscription({
  accountId: accountId,
  priceId: selectedPriceId // monthly or yearly
});

alert('Subscription activated! Thank you for upgrading.');
```

## What If Customer Doesn't Add Payment Method?

If trial expires and no payment method is saved:

1. Access is blocked (based on `account_type` and trial expiry)
2. User is redirected to `/billing` page
3. They must add payment method and subscribe to continue

## API Endpoints Created

### 1. `/api/setup-payment-method` (NEW) - Creates SetupIntent for collecting payment method - No charge made - Returns `clientSecret` for Stripe Elements

### 2. `/api/activate-subscription` (NEW) - Activates subscription using saved payment method - Checks payment method exists before creating subscription - Returns subscription ID and status

### 3. `/api/create-stripe-customer` - Creates Stripe customer with metadata - Called on account creation

## Webhook Events

The webhook now handles: - `setup_intent.succeeded` - Payment method successfully added - `customer.subscription.created` - Subscription activated - `customer.subscription.updated` - Status changes - `invoice.payment_succeeded` - Payment successful - `invoice.payment_failed` - Payment failed

## Test Account (£1/mo) Flow

For your test account with £1/mo pricing:

```javascript
// 1. Create customer (one-time)
const { customerId } = await createStripeCustomer({
  email: 'test@example.com',
  accountName: 'Test Account',
  accountId: testAccountId,
  accountType: 'test'
});

// 2. Add payment method
const { clientSecret } = await setupPaymentMethod({
  email: 'test@example.com',
  accountId: testAccountId
});

// Use Stripe Elements to save card...

// 3. Activate with £1 price
const { subscriptionId } = await activateSubscription({
  accountId: testAccountId,
  priceId: 'price_xxxxx' // Your £1/mo price ID
});
```

## Demo Account Flow

Demo accounts are simpler:

```javascript
// Just create customer (optional)
const { customerId } = await createStripeCustomer({
  email: 'demo@example.com',
  accountName: 'Demo Account',
  accountId: demoAccountId,
  accountType: 'demo'
});

// No payment method needed
// No subscription needed
// Always has access
```

## Benefits of This Approach

✅ **Better conversion** - Easier for customers to add card during trial
✅ **Seamless transition** - No interruption when trial ends
✅ **Reduced churn** - Customers don't have to remember to add payment
✅ **Compliance** - No charge until trial actually expires
✅ **Manual control** - You can activate/delay as needed
✅ **Test friendly** - Easy to test billing without real charges

## Next Steps

1. Add "Add Payment Method" UI during trial period
2. Set up cron job to activate subscriptions when trials expire
3. Send reminder emails before trial ends
4. Test the full flow with Stripe test cards

## Example UI Flow

**During Trial:**
```
┌─────────────────────────────────────────┐
│ Your trial ends in 5 days               │
│                                         │
│ Add payment details now for seamless   │
│ access when your trial ends.           │
│                                         │
│ [ Add Payment Method ]  [Maybe Later]  │
└─────────────────────────────────────────┘
```

**After Adding Payment Method:**
```
┌─────────────────────────────────────────┐
│ ✓ Payment method saved                  │
│                                         │
│ Your subscription will start            │
│ automatically when your trial ends.     │
│                                         │
│ Trial ends in 5 days                    │
└─────────────────────────────────────────┘
```

**Trial Expired (No Payment Method):**
```
┌─────────────────────────────────────────┐
│ Your trial has expired                  │
│                                         │
│ Add payment details to continue using   │
│ Chatters.                               │
│                                         │
│ [ Subscribe Now ]                       │
└─────────────────────────────────────────┘
```
