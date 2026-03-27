# Modular Billing System Implementation Plan

## Overview

Add account-level module management to Chatters with two initial modules:
- **Feedback** (core, required): £99/venue/mo or £84/venue/mo annually
- **NPS** (add-on): £49/venue/mo or £41/venue/mo annually

Trial accounts get access to modules based on selection at trial creation. Master role users manage modules via a Feature Management page.

---

## Confirmed Decisions

| Decision | Choice |
|----------|--------|
| Legacy accounts | Current active paid accounts get grandfathered with all modules |
| NPS downgrade | Access continues until end of billing period |
| Venue-level toggle | Remove - NPS is account-level only (deprecate `venues.nps_enabled`) |
| Feature Management access | Master users only |
| Trial setup | Select modules at trial creation, can enable more during trial |
| Bundle discount | None for now |

---

## Pricing Summary

| Module | Billed Monthly | Billed Annually |
|--------|----------------|-----------------|
| Feedback | £99 PVPM + VAT | £84 PVPM + VAT |
| NPS | £49 PVPM + VAT | £41 PVPM + VAT |
| **Total** | **£148 PVPM + VAT** | **£125 PVPM + VAT** |

*PVPM = Per Venue Per Month*

---

## Legacy Account Handling

| Account Type | Behavior |
|--------------|----------|
| Current active paid accounts | Keep current pricing, full access to Feedback + NPS forever |
| Existing trial | Access based on modules selected at trial creation |
| New trial | Access based on modules selected at trial creation |
| New paid | Module-based pricing, choose Feedback or Feedback + NPS |

Legacy accounts are identified by the `is_legacy_pricing` flag on the `accounts` table (set during migration for all currently paid accounts).

---

## Phase 1: Database Schema

### New Tables

```sql
-- Reference table for available modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,          -- 'feedback', 'nps'
  name VARCHAR(100) NOT NULL,                 -- 'Feedback', 'NPS'
  description TEXT,
  is_core BOOLEAN DEFAULT FALSE,              -- TRUE for feedback
  price_monthly_pence INTEGER NOT NULL,       -- 9900 for feedback, 4900 for NPS
  price_yearly_pence INTEGER NOT NULL,        -- 10080 for feedback, 4920 for NPS
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for account modules
CREATE TABLE account_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  module_code VARCHAR(50) NOT NULL REFERENCES modules(code),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,                    -- Set when module removed (access until period end)
  stripe_subscription_item_id VARCHAR(255),
  UNIQUE(account_id, module_code)
);

-- Indexes
CREATE INDEX idx_account_modules_account ON account_modules(account_id);
CREATE INDEX idx_account_modules_module ON account_modules(module_code);
```

### Accounts Table Addition

```sql
ALTER TABLE accounts ADD COLUMN is_legacy_pricing BOOLEAN DEFAULT FALSE;
```

### Seed Data

```sql
INSERT INTO modules (code, name, description, is_core, price_monthly_pence, price_yearly_pence, display_order)
VALUES
  ('feedback', 'Feedback', 'Core feedback collection and analytics', TRUE, 9900, 10080, 1),
  ('nps', 'NPS', 'Net Promoter Score surveys and insights', FALSE, 4900, 4920, 2);
```

### Migration for Existing Accounts

```sql
-- Mark all current paid accounts as legacy
UPDATE accounts
SET is_legacy_pricing = TRUE
WHERE is_paid = TRUE AND stripe_subscription_id IS NOT NULL;

-- All accounts get feedback module
INSERT INTO account_modules (account_id, module_code)
SELECT id, 'feedback' FROM accounts;

-- Legacy paid accounts get NPS module
INSERT INTO account_modules (account_id, module_code)
SELECT id, 'nps' FROM accounts WHERE is_legacy_pricing = TRUE
ON CONFLICT (account_id, module_code) DO NOTHING;

-- Accounts with nps_enabled venues also get NPS module (catch any edge cases)
INSERT INTO account_modules (account_id, module_code)
SELECT DISTINCT v.account_id, 'nps'
FROM venues v WHERE v.nps_enabled = true
ON CONFLICT (account_id, module_code) DO NOTHING;
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_modules ENABLE ROW LEVEL SECURITY;

-- Modules table: readable by all authenticated users
CREATE POLICY "Modules readable by authenticated users"
  ON modules FOR SELECT TO authenticated USING (true);

-- Account modules: users can read their own account's modules
CREATE POLICY "Account modules readable by account members"
  ON account_modules FOR SELECT TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
      UNION
      SELECT v.account_id FROM staff s
      JOIN venues v ON v.id = s.venue_id
      WHERE s.user_id = auth.uid()
    )
  );
```

---

## Phase 2: Stripe Setup

### New Products/Prices Required

Create in Stripe Dashboard:

| Product | Monthly Price | Yearly Price |
|---------|---------------|--------------|
| Chatters Feedback | £99/unit (9900 pence) | £1,008/unit (100800 pence) |
| Chatters NPS | £49/unit (4900 pence) | £492/unit (49200 pence) |

### New Environment Variables

```env
# New module-based pricing
STRIPE_PRICE_FEEDBACK_MONTHLY=price_xxx
STRIPE_PRICE_FEEDBACK_YEARLY=price_xxx
STRIPE_PRICE_NPS_MONTHLY=price_xxx
STRIPE_PRICE_NPS_YEARLY=price_xxx

# Keep existing for legacy detection
REACT_APP_STRIPE_PRICE_MONTHLY=price_1SOlgLAIlP4JnTHqeVRD4xMQ
REACT_APP_STRIPE_PRICE_YEARLY=price_1SOlgtAIlP4JnTHqczWQo97i
```

### Subscription Structure

New subscriptions will have multiple line items:
```
Subscription
├── Item 1: Feedback (quantity = venue count)
└── Item 2: NPS (quantity = venue count) [optional]
```

---

## Phase 3: Backend Implementation

### New API Endpoints

| File | Method | Purpose |
|------|--------|---------|
| `api/modules/list.js` | GET | List available modules + account's enabled modules |
| `api/modules/add.js` | POST | Add module to subscription (creates Stripe subscription item) |
| `api/modules/remove.js` | POST | Remove module from subscription (sets disabled_at, keeps access until period end) |

### Modified API Files

| File | Changes |
|------|---------|
| `api/create-subscription-intent.js` | Accept modules array, create multi-item subscription |
| `api/webhook.js` | Sync subscription items with account_modules table |
| `api/update-subscription-quantity.js` | Update quantity for all module line items |
| `api/send-test-nps-email.js` | Check account has NPS module before sending |

### Module Remove Logic (End of Period Access)

```javascript
// api/modules/remove.js
// Instead of immediately removing from Stripe, set disabled_at
// Stripe subscription item removed at period end via scheduled job or webhook

await supabase
  .from('account_modules')
  .update({ disabled_at: new Date().toISOString() })
  .eq('account_id', accountId)
  .eq('module_code', 'nps');

// Schedule Stripe item removal at period end
await stripe.subscriptionItems.update(subscriptionItemId, {
  deleted: true,
  proration_behavior: 'none', // No refund, access until period end
  clear_usage: false,
});
```

---

## Phase 4: Frontend - Context & Hooks

### Extend VenueContext

**File:** `src/context/VenueContext.js`

Add to context:
```javascript
{
  enabledModules: ['feedback', 'nps'],  // Array of enabled module codes
  hasModule: (code) => boolean,          // Check if module is enabled
  isLegacyPricing: boolean,              // True if using old pricing
}
```

Fetch modules during init:
```javascript
// After fetching account data
const { data: accountData } = await supabase
  .from('accounts')
  .select('is_legacy_pricing, account_type, is_paid')
  .eq('id', accountId)
  .single();

const { data: accountModules } = await supabase
  .from('account_modules')
  .select('module_code, disabled_at')
  .eq('account_id', accountId);

// Filter out modules that are disabled (past their access period)
let enabledModules = (accountModules || [])
  .filter(m => !m.disabled_at || new Date(m.disabled_at) > new Date())
  .map(m => m.module_code);

// Legacy paid accounts get all modules
if (accountData?.is_legacy_pricing) {
  enabledModules = ['feedback', 'nps'];
}

setEnabledModules(enabledModules);
setIsLegacyPricing(accountData?.is_legacy_pricing || false);
```

### New Component: ModuleGate

**File:** `src/components/guards/ModuleGate.js` (new)

```javascript
import { useVenue } from '../../context/VenueContext';

const ModuleGate = ({ module, children, fallback }) => {
  const { hasModule, loading } = useVenue();

  if (loading) return null;
  if (!hasModule(module)) return fallback || <ModuleUpgradePrompt module={module} />;
  return children;
};

export default ModuleGate;
```

---

## Phase 5: NPS Gating

### Routes to Gate

**File:** `src/DashboardRoutes.js`

Wrap NPS routes with ModuleGate:
```javascript
<Route path="/nps/score" element={
  <ModuleGate module="nps" fallback={<ModuleUpgradePage module="nps" />}>
    <ProtectedRoute permission="nps.view"><ReportsNPSPage /></ProtectedRoute>
  </ModuleGate>
} />
```

Routes to wrap:
- `/nps/score` → ReportsNPSPage
- `/nps/insights` → NPSInsightsPage
- `/nps/settings` → NPSSettingsPage
- `/nps-report/:venueId` → NPSReportDetail
- `/nps` → NPSResponse (show "survey unavailable" if no module)

### Sidebar Gating

**File:** `src/components/dashboard/layout/Sidebar.js`

Update `canSeeItem` function:
```javascript
const canSeeItem = useCallback((item) => {
  // Check module requirements first
  const moduleRequirements = {
    'nps.view': 'nps',
    'nps.insights': 'nps',
    'nps.edit': 'nps',
  };
  const requiredModule = moduleRequirements[item.permission];
  if (requiredModule && !hasModule(requiredModule)) {
    return false;
  }

  // Existing permission check
  if (userRole === 'master') return true;
  if (!item.permission) return true;
  return hasPermission(item.permission);
}, [userRole, hasPermission, hasModule]);
```

### CustomerFeedback.js Gating

**File:** `src/pages/dashboard/CustomerFeedback.js`

Since `venues.nps_enabled` is being deprecated, change NPS logic to check account module:

```javascript
// Fetch account modules for this venue's account
const { data: accountModules } = await supabase
  .from('account_modules')
  .select('module_code, disabled_at')
  .eq('account_id', venue.account_id)
  .eq('module_code', 'nps');

const hasNpsModule = accountModules && accountModules.length > 0 &&
  (!accountModules[0].disabled_at || new Date(accountModules[0].disabled_at) > new Date());

// Only show email field if NPS module enabled
{hasNpsModule && (
  <div className="mb-6 text-left">
    {/* Email/name inputs */}
  </div>
)}

// Only schedule NPS if module enabled
if (hasNpsModule && customerEmail) {
  // Schedule NPS email
}
```

### Components to Update

| Component | Change |
|-----------|--------|
| NPSChartTile | Wrap with ModuleGate or conditionally render |
| NPSDonutChartTile | Wrap with ModuleGate or conditionally render |
| MultiVenueNPSCard | Wrap with ModuleGate or conditionally render |
| NpsTrendChart | Wrap with ModuleGate or conditionally render |
| NPSConfigModal | Wrap with ModuleGate or hide trigger |

---

## Phase 6: Feature Management Page

### New Page: Feature Management

**File:** `src/pages/dashboard/FeatureManagement.js` (new)

This page is accessible only to Master users and shows:
- Current enabled modules
- Available modules with pricing
- Trial billing preview (what they'll pay when trial ends)
- Add/remove module actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Feature Management                                    [Master only]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Your Modules                                                            │
│ ───────────────────────────────────────────────────────────────────     │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐     │
│ │ ✓ Feedback                                              Active  │     │
│ │   Core feedback collection and analytics                        │     │
│ │   £99/venue/mo × 3 venues = £297/mo                             │     │
│ └─────────────────────────────────────────────────────────────────┘     │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐     │
│ │ ○ NPS                                           [Enable Module] │     │
│ │   Net Promoter Score surveys and insights                       │     │
│ │   £49/venue/mo × 3 venues = £147/mo                             │     │
│ │                                                                 │     │
│ │   Enabling this will add £147/mo to your subscription.          │     │
│ └─────────────────────────────────────────────────────────────────┘     │
│                                                                         │
│ ───────────────────────────────────────────────────────────────────     │
│ Current Total: £297/mo                                                  │
│ With NPS: £444/mo                                                       │
│                                                                         │
│ [Trial ends in 12 days - you'll be billed £297/mo for Feedback]        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Route Addition

**File:** `src/DashboardRoutes.js`

```javascript
<Route path="/settings/features" element={
  <ProtectedRoute requiredRole="master">
    <FeatureManagementPage />
  </ProtectedRoute>
} />
```

### Sidebar Addition

Add to Settings section (master only):
```javascript
{
  name: 'Features',
  href: '/settings/features',
  icon: Puzzle,
  permission: null, // Master only via route protection
  masterOnly: true,
}
```

---

## Phase 7: Billing UI Updates

### BillingTab Updates

**File:** `src/components/dashboard/settings/BillingTab.js`

For **legacy subscriptions**, show read-only info:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Your Subscription (Legacy Plan)                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Plan: Monthly                                                           │
│ Price: £149/venue/mo × 3 venues = £447/mo                              │
│ Includes: Feedback + NPS (all features)                                 │
│                                                                         │
│ You're on a legacy plan. Your pricing and features are locked in.      │
│                                                                         │
│ [Manage Payment Method]                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

For **new subscriptions**, show module-based pricing:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Your Subscription                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Modules:                                                                │
│   • Feedback: £99/venue/mo × 3 = £297/mo                               │
│   • NPS: £49/venue/mo × 3 = £147/mo                                    │
│                                                                         │
│ Total: £444/mo                                                          │
│                                                                         │
│ [Manage Features] → links to /settings/features                         │
│ [Manage Payment Method]                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 8: Trial Account Creation

### Admin Trial Creation

When admin creates a trial account, add module selection:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Create Trial Account                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ Business Name: [                    ]                                   │
│ Contact Email: [                    ]                                   │
│                                                                         │
│ Modules to Enable:                                                      │
│ ☑ Feedback (always included)                                           │
│ ☐ NPS                                                                   │
│                                                                         │
│ Trial Duration: [14 days ▼]                                            │
│                                                                         │
│ [Create Trial]                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

This creates `account_modules` records at trial creation time.

---

## Deployment Safety

### Critical: Protecting Current Accounts

This implementation is designed to be **backwards-compatible**. Current accounts will NOT be affected because:

1. **Legacy flag protects paid accounts** - All current paid accounts get `is_legacy_pricing = TRUE`
2. **Migration adds modules first** - Database changes run before any code changes
3. **Fail-open logic** - If module check fails, default to full access
4. **Transitional fallbacks** - Keep old checks during transition period

### Fail-Open Code Pattern

All module checks MUST use fail-open logic during transition:

```javascript
// VenueContext.js - SAFE pattern
const { data: accountModules, error } = await supabase
  .from('account_modules')
  .select('module_code, disabled_at')
  .eq('account_id', accountId);

// FAIL OPEN: If query fails or table doesn't exist, grant full access
if (error || !accountModules) {
  console.warn('Module check failed, granting full access:', error);
  setEnabledModules(['feedback', 'nps']);
  return;
}

// Normal processing...
```

```javascript
// CustomerFeedback.js - SAFE pattern (public page, no auth)
// Keep BOTH old and new checks during transition
const { data: accountModules } = await supabase
  .from('account_modules')
  .select('module_code')
  .eq('account_id', venue.account_id)
  .eq('module_code', 'nps');

// Transitional: Allow NPS if EITHER old OR new system says yes
const hasNpsModule = (accountModules && accountModules.length > 0) || venue.nps_enabled;
```

### Deployment Order (MUST follow this sequence)

| Step | Action | Verify Before Proceeding |
|------|--------|--------------------------|
| 1 | **Create Stripe products/prices** | Products visible in Stripe dashboard |
| 2 | **Add env vars to Vercel** | `vercel env pull` shows new vars |
| 3 | **Run database migration** | Tables exist, data migrated (see verification queries) |
| 4 | **Verify migration** | Run all verification queries below |
| 5 | **Deploy VenueContext changes** | Test login works, no console errors |
| 6 | **Deploy UI gating (Sidebar, routes)** | Legacy accounts still see everything |
| 7 | **Deploy API changes** | New subscriptions work with modules |
| 8 | **Deploy remaining features** | Feature Management page, etc. |

### Verification Queries (Run after Step 4)

```sql
-- 1. All paid accounts should be legacy (MUST return 0)
SELECT COUNT(*) as paid_not_legacy
FROM accounts
WHERE is_paid = TRUE
  AND stripe_subscription_id IS NOT NULL
  AND is_legacy_pricing = FALSE;

-- 2. All accounts should have feedback module (MUST return 0 rows)
SELECT a.id, a.name
FROM accounts a
LEFT JOIN account_modules am ON am.account_id = a.id AND am.module_code = 'feedback'
WHERE am.id IS NULL;

-- 3. Legacy accounts should have NPS (MUST return 0 rows)
SELECT a.id, a.name
FROM accounts a
LEFT JOIN account_modules am ON am.account_id = a.id AND am.module_code = 'nps'
WHERE a.is_legacy_pricing = TRUE AND am.id IS NULL;

-- 4. Accounts with nps_enabled venues should have NPS module (MUST return 0 rows)
SELECT DISTINCT a.id, a.name
FROM accounts a
JOIN venues v ON v.account_id = a.id
LEFT JOIN account_modules am ON am.account_id = a.id AND am.module_code = 'nps'
WHERE v.nps_enabled = TRUE AND am.id IS NULL;
```

### Rollback Plan

If something goes wrong after deployment:

1. **Code rollback**: Revert to previous Vercel deployment
2. **Database is safe**: The new tables/columns don't affect existing functionality
3. **Legacy flag ensures access**: Even with new code, legacy accounts get full access

### What Could Go Wrong & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration runs after code deploy | Users see errors, NPS hidden | Deploy database FIRST, verify before code |
| Legacy flag not set | Paid accounts lose NPS access | Verification query #1 catches this |
| CustomerFeedback breaks | NPS emails stop scheduling | Keep `venue.nps_enabled` fallback |
| VenueContext fails | App crashes on login | Fail-open try/catch with full access default |
| Webhook fails | New modules not synced | Manual fix via Supabase dashboard |

---

## Implementation Order

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1 | Stripe products/prices setup | 0.5 day |
| 2 | Environment variables | 0.5 day |
| 3 | Database schema, migration | 1 day |
| 4 | **VERIFY MIGRATION** | Required checkpoint |
| 5 | VenueContext changes (with fail-open) | 1 day |
| 6 | ModuleGate component | 0.5 day |
| 7 | Sidebar gating | 0.5 day |
| 8 | Route gating (DashboardRoutes) | 0.5 day |
| 9 | CustomerFeedback.js changes (with fallback) | 0.5 day |
| 10 | Feature Management page | 1.5 days |
| 11 | API endpoints (list/add/remove) | 1 day |
| 12 | create-subscription-intent changes | 1 day |
| 13 | Webhook sync changes | 1 day |
| 14 | update-subscription-quantity changes | 0.5 day |
| 15 | BillingTab UI updates | 1 day |
| 16 | Admin trial creation updates | 0.5 day |
| 17 | Testing | 2 days |
| 18 | Remove transitional fallbacks | 0.5 day (after 30 days) |

**Total: ~13-14 days**

---

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/guards/ModuleGate.js` | Gating component for module access |
| `src/pages/dashboard/FeatureManagement.js` | Feature Management page (master only) |
| `src/pages/dashboard/ModuleUpgradePage.js` | Upgrade prompt page for gated routes |
| `src/components/dashboard/features/ModuleCard.js` | Module display card with enable/disable |
| `api/modules/list.js` | List modules endpoint |
| `api/modules/add.js` | Add module endpoint |
| `api/modules/remove.js` | Remove module endpoint |

### Modified Files

| File | Changes |
|------|---------|
| `src/context/VenueContext.js` | Add enabledModules, hasModule(), isLegacyPricing |
| `src/DashboardRoutes.js` | Wrap NPS routes with ModuleGate, add Feature Management route |
| `src/components/dashboard/layout/Sidebar.js` | Add module check to canSeeItem, add Features link |
| `src/pages/dashboard/CustomerFeedback.js` | Use account_modules instead of venues.nps_enabled |
| `src/components/dashboard/settings/BillingTab.js` | Show legacy vs modular billing info |
| `api/create-subscription-intent.js` | Support multi-item subscriptions |
| `api/webhook.js` | Sync account_modules on subscription changes |
| `api/update-subscription-quantity.js` | Update all module quantities |
| `api/send-test-nps-email.js` | Check NPS module before sending |

---

## Deprecation Plan: venues.nps_enabled

The `venues.nps_enabled` column is being replaced by account-level module access.

| Phase | Action |
|-------|--------|
| Migration | Copy nps_enabled=true venues to account_modules |
| Code changes | Replace all `venue.nps_enabled` checks with `hasModule('nps')` |
| Monitoring | Keep column for 30 days, log any access |
| Cleanup | Remove column after confirming no usage |

---

## Verification Checklist

### Test Scenarios

- [ ] Legacy paid account - sees all features, "Legacy Plan" badge in billing
- [ ] New trial (Feedback only) - sees Feedback, NPS hidden, can enable NPS in Feature Management
- [ ] New trial (Feedback + NPS) - sees everything
- [ ] New paid (Feedback only) - NPS hidden, Feature Management shows NPS as available
- [ ] New paid (Feedback + NPS) - full access
- [ ] Add NPS module mid-subscription - Stripe updated, NPS unlocked immediately
- [ ] Remove NPS module - access continues until period end, then hidden
- [ ] Venue count change - all module quantities updated in Stripe
- [ ] CustomerFeedback - email field hidden if account lacks NPS module
- [ ] NPSResponse page - shows "survey unavailable" if no NPS module
- [ ] Feature Management - only visible to master users

### Stripe Test Commands

```bash
# Listen for webhooks locally
stripe listen --forward-to localhost:3000/api/webhook

# Trigger test events
stripe trigger customer.subscription.updated
```

---

## Future Extensibility

This architecture supports:
- Additional modules (AI Insights, Reviews, Integrations, etc.)
- Module-specific permissions
- Module bundles/packages with discounts
- Usage-based pricing per module
- Custom enterprise pricing

To add a new module:
1. Add row to `modules` table
2. Create Stripe products/prices
3. Add env vars for price IDs
4. Add to `moduleRequirements` mapping in Sidebar
5. Create ModuleGate wrappers for relevant routes/components
6. Add card to Feature Management page
