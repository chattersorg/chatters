# API Consolidation Status & Split Recommendations

## Summary

Current state of Vercel Edge Functions and recommendations for splitting large consolidated endpoints.

---

## 📊 File Size Analysis

| File | Lines | Status | Priority | Actions |
|------|-------|--------|----------|---------|
| `reviews.js` | 1267 | 🔴 **Critical** | **Urgent** | 9 handlers → Split into 9 files |
| `admin/seed-demo.js` | 508 | 🟡 **Large** | Low | Single purpose, keep as-is |
| `google-reviews.js` | 313 | 🟡 **Large** | Medium | 3 handlers → Split into 3 files |
| `cron/refresh-google-ratings.js` | 302 | 🟡 **Large** | Low | Cron job, single purpose |
| `google.js` | 285 | 🟡 **Monitor** | Medium | 5 handlers → Split into 5 files |
| `cron/sync-google-reviews.js` | 246 | 🟡 **Monitor** | Low | Cron job, single purpose |
| `admin.js` | 199 | ✅ **Split** | Done | Keep for backwards compat |
| `webhook.js` | 88 | ✅ **Good** | None | Single purpose |
| `create-checkout-session.js` | 44 | ✅ **Good** | None | Single purpose |
| `create-trial-account.js` | 30 | ✅ **Good** | None | Single purpose |
| `auth-helper.js` | 101 | ✅ **Good** | None | Shared utility |

---

## 🔴 URGENT: reviews.js (1267 lines)

**Current Structure:** - Query params: `?platform={google|tripadvisor|unified}&action={action}` - Contains 9 different handlers across 3 platforms

### Handlers:

**Google Platform (4 handlers):**
1. `GET /api/reviews?platform=google&action=ratings` - Get Google ratings for venue
2. `GET /api/reviews?platform=google&action=places-search` - Search Google Places
3. `GET /api/reviews?platform=google&action=place-details` - Get place details
4. `POST /api/reviews?platform=google&action=update-venue` - Update venue with Google data

**TripAdvisor Platform (4 handlers):**
5. `GET /api/reviews?platform=tripadvisor&action=ratings` - Get TripAdvisor ratings
6. `GET /api/reviews?platform=tripadvisor&action=location-search` - Search locations
7. `GET /api/reviews?platform=tripadvisor&action=location-details` - Get location details
8. `POST /api/reviews?platform=tripadvisor&action=update-venue` - Update venue

**Unified Platform (1 handler):**
9. `GET /api/reviews?platform=unified&action=search` - Unified review search

### Recommended Split:

```
api/
├── reviews/
│   ├── google/
│   │   ├── ratings.js (GET)
│   │   ├── places-search.js (GET)
│   │   ├── place-details.js (GET)
│   │   └── update-venue.js (POST)
│   ├── tripadvisor/
│   │   ├── ratings.js (GET)
│   │   ├── location-search.js (GET)
│   │   ├── location-details.js (GET)
│   │   └── update-venue.js (POST)
│   └── unified/
│       └── search.js (GET)
```

**Frontend Migration:**
```javascript
// Before
const response = await fetch('/api/reviews?platform=google&action=ratings&venueId=123');

// After
const response = await fetch('/api/reviews/google/ratings?venueId=123');
```

**Estimated Impact:** - Each file: ~100-150 lines (down from 1267) - Cold start: 3-5x faster - Debugging: Much easier per endpoint - Vercel limits: No longer an issue

---

## 🟡 MEDIUM: google-reviews.js (313 lines)

**Current Structure:** - Query params: `?action={list|sync|reply}` - Contains 3 different handlers

### Handlers:

1. `GET /api/google-reviews?action=list` - List Google reviews for venue
2. `POST /api/google-reviews?action=sync` - Sync reviews from Google My Business
3. `POST /api/google-reviews?action=reply` - Reply to a Google review

### Recommended Split:

```
api/
├── google-reviews/
│   ├── list.js (GET)
│   ├── sync.js (POST)
│   └── reply.js (POST)
```

**Frontend Migration:**
```javascript
// Before
const response = await fetch('/api/google-reviews?action=list&venueId=123');

// After
const response = await fetch('/api/google-reviews/list?venueId=123');
```

---

## 🟡 MEDIUM: google.js (285 lines)

**Current Structure:** - Query params: `?action={auth-init|auth-callback|disconnect|status|locations}` - Contains 5 different handlers for Google OAuth

### Handlers:

1. `GET /api/google?action=auth-init` - Initialize Google OAuth flow
2. `GET /api/google?action=auth-callback` - Handle OAuth callback
3. `POST /api/google?action=disconnect` - Disconnect Google account
4. `GET /api/google?action=status` - Check Google connection status
5. `GET /api/google?action=locations` - Get Google Business locations

### Recommended Split:

```
api/
├── google/
│   ├── auth-init.js (GET)
│   ├── auth-callback.js (GET)
│   ├── disconnect.js (POST)
│   ├── status.js (GET)
│   └── locations.js (GET)
```

**Frontend Migration:**
```javascript
// Before
const response = await fetch('/api/google?action=status&venueId=123');

// After
const response = await fetch('/api/google/status?venueId=123');
```

---

## ✅ COMPLETED: admin.js (199 lines)

**Status:** Already split into 5 individual files in `/api/admin/`

### Split Files: - ✅ `/api/admin/create-user.js` - ✅ `/api/admin/invite-manager.js` - ✅ `/api/admin/resend-invitation.js` - ✅ `/api/admin/revoke-invitation.js` - ✅ `/api/admin/get-pending-invitations.js`

**Note:** Original `/api/admin.js` kept for backwards compatibility

---

## 🟢 GOOD: Files That Don't Need Splitting

These files are either: - Single-purpose endpoints - Cron jobs - Shared utilities

| File | Lines | Reason |
|------|-------|--------|
| `seed-demo.js` | 508 | Single complex task, hard to split meaningfully |
| `refresh-google-ratings.js` | 302 | Cron job, single workflow |
| `sync-google-reviews.js` | 246 | Cron job, single workflow |
| `webhook.js` | 88 | Stripe webhook handler, single purpose |
| `create-checkout-session.js` | 44 | Single Stripe action |
| `create-trial-account.js` | 30 | Single account creation action |
| `auth-helper.js` | 101 | Shared utility functions |

---

## 📋 Implementation Priority

### Phase 1: Urgent (Do Now)
1. **Split `reviews.js`** (1267 lines → 9 files of ~140 lines each) - Highest impact - Prevents function size limit issues - Improves performance significantly

### Phase 2: Important (Do Soon)
2. **Split `google-reviews.js`** (313 lines → 3 files of ~100 lines each) - Growing feature - Frequently updated
3. **Split `google.js`** (285 lines → 5 files of ~50 lines each) - OAuth flow benefits from clear separation - Easier debugging

### Phase 3: Optional (Future)
4. **Monitor cron jobs** - If they exceed 500 lines, consider splitting
5. **Keep an eye on `seed-demo.js`** - Currently 508 lines, could be split if needed

---

## 🛠️ Split Implementation Template

For each consolidated file, follow this pattern:

### 1. Create Individual Files

```javascript
// api/{category}/{action}.js
export default async function handler(req, res) {
  // Extract just ONE handler from the original file
  // Include necessary imports and utilities
  // Keep authentication logic

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handler logic here
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

### 2. Update Frontend Calls

Create a migration helper:

```javascript
// utils/api-migrator.js
export function getReviewsEndpoint(platform, action) {
  // Temporary helper during migration
  const newEndpoints = {
    'google-ratings': '/api/reviews/google/ratings',
    'google-places-search': '/api/reviews/google/places-search',
    // ... etc
  };

  const key = `${platform}-${action}`;
  return newEndpoints[key] || `/api/reviews?platform=${platform}&action=${action}`;
}
```

### 3. Gradual Migration

1. Create new endpoints
2. Update frontend incrementally
3. Keep old file for 2-3 weeks
4. Monitor error rates
5. Remove old file when migration complete

---

## 📊 Expected Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Largest function | 1267 lines | ~150 lines | 8.4x smaller |
| Cold start time | 2-3s | <500ms | 4-6x faster |
| Deploy time | ~60s | ~20s | 3x faster |
| Debug time | Hours | Minutes | 10x faster |
| Function limit risk | High | None | ✅ Eliminated |

---

## 🚦 Action Items

### Immediate (This Week) - [ ] Split `reviews.js` into 9 files - [ ] Update frontend to use new review endpoints - [ ] Test all review platform integrations

### Short Term (Next 2 Weeks) - [ ] Split `google-reviews.js` into 3 files - [ ] Split `google.js` into 5 files - [ ] Update frontend for Google endpoints - [ ] Remove old consolidated files

### Ongoing - [ ] Monitor function sizes monthly - [ ] Set up alerts for files >300 lines - [ ] Document new endpoints in API docs - [ ] Update Postman/Thunder collections

---

## 🔗 Related Documentation - [API_SPLIT_MIGRATION.md](./API_SPLIT_MIGRATION.md) - Admin split details - [Vercel Function Limits](https://vercel.com/docs/functions/limitations) - [Edge Function Best Practices](https://vercel.com/docs/functions/edge-functions)

---

**Last Updated:** 2025-10-31
**Status:** Admin endpoints complete, Reviews pending
