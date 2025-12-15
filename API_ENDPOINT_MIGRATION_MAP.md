# API Endpoint Migration Map

## Overview

All consolidated API endpoints have been split into individual files. This document maps old routes to new routes for frontend migration.

---

## ✅ COMPLETED: All Splits

### 1. Reviews API (9 endpoints)
### 2. Google Reviews API (3 endpoints)
### 3. Google OAuth API (5 endpoints)
### 4. Admin API (5 endpoints) - Previously completed

**Total: 22 new individual endpoint files created**

---

## 📍 Route Migration Guide

### Reviews API

#### Google Platform (4 endpoints)

| Old Route | New Route | Method | File |
|-----------|-----------|--------|------|
| `/api/reviews?platform=google&action=ratings` | `/api/reviews/google/ratings` | GET | `api/reviews/google/ratings.js` |
| `/api/reviews?platform=google&action=places-search` | `/api/reviews/google/places-search` | GET | `api/reviews/google/places-search.js` |
| `/api/reviews?platform=google&action=place-details` | `/api/reviews/google/place-details` | GET | `api/reviews/google/place-details.js` |
| `/api/reviews?platform=google&action=update-venue` | `/api/reviews/google/update-venue` | POST | `api/reviews/google/update-venue.js` |

**Example Migration:**
```javascript
// Before
const response = await fetch('/api/reviews?platform=google&action=ratings&venueId=123&forceRefresh=0');

// After
const response = await fetch('/api/reviews/google/ratings?venueId=123&forceRefresh=0');
```

#### TripAdvisor Platform (4 endpoints)

| Old Route | New Route | Method | File |
|-----------|-----------|--------|------|
| `/api/reviews?platform=tripadvisor&action=ratings` | `/api/reviews/tripadvisor/ratings` | GET | `api/reviews/tripadvisor/ratings.js` |
| `/api/reviews?platform=tripadvisor&action=location-search` | `/api/reviews/tripadvisor/location-search` | GET | `api/reviews/tripadvisor/location-search.js` |
| `/api/reviews?platform=tripadvisor&action=location-details` | `/api/reviews/tripadvisor/location-details` | GET | `api/reviews/tripadvisor/location-details.js` |
| `/api/reviews?platform=tripadvisor&action=update-venue` | `/api/reviews/tripadvisor/update-venue` | POST | `api/reviews/tripadvisor/update-venue.js` |

**Example Migration:**
```javascript
// Before
const response = await fetch('/api/reviews?platform=tripadvisor&action=ratings&venueId=123');

// After
const response = await fetch('/api/reviews/tripadvisor/ratings?venueId=123');
```

#### Unified Platform (1 endpoint)

| Old Route | New Route | Method | File |
|-----------|-----------|--------|------|
| `/api/reviews?platform=unified&action=search` | `/api/reviews/unified/search` | GET | `api/reviews/unified/search.js` |

**Example Migration:**
```javascript
// Before
const response = await fetch('/api/reviews?platform=unified&action=search&venueId=123&query=excellent');

// After
const response = await fetch('/api/reviews/unified/search?venueId=123&query=excellent');
```

---

### Google Reviews API (3 endpoints)

| Old Route | New Route | Method | File |
|-----------|-----------|--------|------|
| `/api/google-reviews?action=list` | `/api/google-reviews/list` | GET | `api/google-reviews/list.js` |
| `/api/google-reviews?action=sync` | `/api/google-reviews/sync` | POST | `api/google-reviews/sync.js` |
| `/api/google-reviews?action=reply` | `/api/google-reviews/reply` | POST | `api/google-reviews/reply.js` |

**Example Migration:**
```javascript
// Before - List
const response = await fetch('/api/google-reviews?action=list&venueId=123&filter=unresponded');

// After - List
const response = await fetch('/api/google-reviews/list?venueId=123&filter=unresponded');

// Before - Sync
const response = await fetch('/api/google-reviews?action=sync', {
  method: 'POST',
  body: JSON.stringify({ venueId: '123', locationId: 'abc' })
});

// After - Sync
const response = await fetch('/api/google-reviews/sync', {
  method: 'POST',
  body: JSON.stringify({ venueId: '123', locationId: 'abc' })
});
```

---

### Google OAuth API (5 endpoints)

| Old Route | New Route | Method | File |
|-----------|-----------|--------|------|
| `/api/google?action=auth-init` | `/api/google/auth-init` | POST | `api/google/auth-init.js` |
| `/api/google?action=auth-callback` | `/api/google/auth-callback` | GET | `api/google/auth-callback.js` |
| `/api/google?action=disconnect` | `/api/google/disconnect` | DELETE | `api/google/disconnect.js` |
| `/api/google?action=status` | `/api/google/status` | GET | `api/google/status.js` |
| `/api/google?action=locations` | `/api/google/locations` | GET | `api/google/locations.js` |

**Example Migration:**
```javascript
// Before - Initialize OAuth
const response = await fetch('/api/google?action=auth-init', {
  method: 'POST',
  body: JSON.stringify({ accountId: '123' })
});

// After - Initialize OAuth
const response = await fetch('/api/google/auth-init', {
  method: 'POST',
  body: JSON.stringify({ accountId: '123' })
});

// Before - Get status
const response = await fetch('/api/google?action=status&venueId=123');

// After - Get status
const response = await fetch('/api/google/status?venueId=123');
```

---

### Admin API (5 endpoints) - Previously Completed

| Old Route | New Route | Method | File |
|-----------|-----------|--------|------|
| `/api/admin?action=create-user` | `/api/admin/create-user` | POST | `api/admin/create-user.js` |
| `/api/admin?action=invite-manager` | `/api/admin/invite-manager` | POST | `api/admin/invite-manager.js` |
| `/api/admin?action=resend-invitation` | `/api/admin/resend-invitation` | POST | `api/admin/resend-invitation.js` |
| `/api/admin?action=revoke-invitation` | `/api/admin/revoke-invitation` | POST | `api/admin/revoke-invitation.js` |
| `/api/admin?action=get-pending-invitations` | `/api/admin/get-pending-invitations` | GET | `api/admin/get-pending-invitations.js` |

---

## 🔧 Frontend Migration Helper

Create a temporary migration helper to make the transition easier:

```javascript
// utils/api-routes.js

/**
 * Maps old API routes to new split endpoints
 * Use during migration period, then remove once all frontend code is updated
 */
export const API_ROUTES = {
  // Reviews - Google
  'reviews-google-ratings': '/api/reviews/google/ratings',
  'reviews-google-places-search': '/api/reviews/google/places-search',
  'reviews-google-place-details': '/api/reviews/google/place-details',
  'reviews-google-update-venue': '/api/reviews/google/update-venue',

  // Reviews - TripAdvisor
  'reviews-tripadvisor-ratings': '/api/reviews/tripadvisor/ratings',
  'reviews-tripadvisor-location-search': '/api/reviews/tripadvisor/location-search',
  'reviews-tripadvisor-location-details': '/api/reviews/tripadvisor/location-details',
  'reviews-tripadvisor-update-venue': '/api/reviews/tripadvisor/update-venue',

  // Reviews - Unified
  'reviews-unified-search': '/api/reviews/unified/search',

  // Google Reviews
  'google-reviews-list': '/api/google-reviews/list',
  'google-reviews-sync': '/api/google-reviews/sync',
  'google-reviews-reply': '/api/google-reviews/reply',

  // Google OAuth
  'google-auth-init': '/api/google/auth-init',
  'google-auth-callback': '/api/google/auth-callback',
  'google-disconnect': '/api/google/disconnect',
  'google-status': '/api/google/status',
  'google-locations': '/api/google/locations',

  // Admin
  'admin-create-user': '/api/admin/create-user',
  'admin-invite-manager': '/api/admin/invite-manager',
  'admin-resend-invitation': '/api/admin/resend-invitation',
  'admin-revoke-invitation': '/api/admin/revoke-invitation',
  'admin-get-pending-invitations': '/api/admin/get-pending-invitations',
};

// Helper function
export function getApiRoute(key) {
  return API_ROUTES[key] || null;
}

// Usage example
const endpoint = getApiRoute('reviews-google-ratings');
const response = await fetch(`${endpoint}?venueId=123`);
```

---

## 📝 Migration Checklist

### Phase 1: Reviews API (Highest Priority) - [ ] Update Google ratings calls - [ ] Update Google places search calls - [ ] Update Google place details calls - [ ] Update Google venue update calls - [ ] Update TripAdvisor ratings calls - [ ] Update TripAdvisor location search calls - [ ] Update TripAdvisor location details calls - [ ] Update TripAdvisor venue update calls - [ ] Update unified search calls - [ ] Test all review integrations

### Phase 2: Google Reviews API - [ ] Update list reviews calls - [ ] Update sync reviews calls - [ ] Update reply to reviews calls - [ ] Test Google My Business integration

### Phase 3: Google OAuth API - [ ] Update OAuth initialization - [ ] Update OAuth callback (redirect URI in Google Console) - [ ] Update disconnect calls - [ ] Update status check calls - [ ] Update locations fetch calls - [ ] Test OAuth flow end-to-end

### Phase 4: Admin API (Already Done) - [ ] Update create user calls (if any remaining) - [ ] Update invite manager calls - [ ] Update resend invitation calls - [ ] Update revoke invitation calls - [ ] Update get pending invitations calls

### Phase 5: Cleanup - [ ] Monitor error logs for 2-3 weeks - [ ] Verify no old routes are being called - [ ] Add deprecation warnings to old endpoints - [ ] Remove old consolidated files after confirmation - [ ] Update API documentation - [ ] Update Postman/Thunder collections

---

## 🔍 Finding All Frontend API Calls

Use these grep commands to find all occurrences:

```bash
# Find reviews API calls
grep -r "api/reviews" src/ --include="*.js" --include="*.jsx"

# Find google-reviews API calls
grep -r "api/google-reviews" src/ --include="*.js" --include="*.jsx"

# Find google OAuth API calls
grep -r "api/google" src/ --include="*.js" --include="*.jsx"

# Find admin API calls
grep -r "api/admin" src/ --include="*.js" --include="*.jsx"

# Find all API calls with action parameter (old format)
grep -r "action=" src/ --include="*.js" --include="*.jsx"
```

---

## ⚠️ Important Notes

### Backwards Compatibility - Original consolidated files (`reviews.js`, `google-reviews.js`, `google.js`, `admin.js`) are still present - They can be kept for backwards compatibility during migration - Add console warnings to old endpoints after migration is complete - Remove old files after 2-3 weeks of stable operation

### Google OAuth Redirect URI
**IMPORTANT:** Update your Google Cloud Console OAuth settings:

**Old redirect URI:**
```
https://my.getchatters.com/api/google?action=auth-callback
```

**New redirect URI:**
```
https://my.getchatters.com/api/google/auth-callback
```

Both can be kept active during migration period.

### Environment Variables
No changes needed - all environment variables remain the same: - `GOOGLE_MAPS_API_KEY` - `TRIPADVISOR_API_KEY` - `GOOGLE_CLIENT_ID` - `GOOGLE_CLIENT_SECRET` - `SUPABASE_SERVICE_ROLE_KEY` - etc.

---

## 📊 Migration Progress Tracking

| Category | Old File | Lines | New Files | Status |
|----------|----------|-------|-----------|--------|
| Reviews | `reviews.js` | 1267 | 9 files | ✅ Complete |
| Google Reviews | `google-reviews.js` | 313 | 3 files | ✅ Complete |
| Google OAuth | `google.js` | 285 | 5 files | ✅ Complete |
| Admin | `admin.js` | 199 | 5 files | ✅ Complete |
| **TOTAL** | **4 files** | **2064 lines** | **22 files** | ✅ **All Done** |

---

## 🚀 Expected Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Largest function | 1267 lines | ~290 lines | 4.4x smaller |
| Average function size | 516 lines | ~100 lines | 5.2x smaller |
| Cold start time | 2-3s | <500ms | 4-6x faster |
| Deploy time | ~60s | ~20s | 3x faster |
| Function limit risk | ⚠️ High | ✅ None | Eliminated |
| Debugging complexity | ⚠️ High | ✅ Low | Much easier |

---

**Last Updated:** 2025-10-31
**Status:** All splits complete, ready for frontend migration
