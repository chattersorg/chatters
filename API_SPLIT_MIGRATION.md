# API Endpoint Split Migration Guide

## Overview

To prevent Vercel Edge Function size limit issues, we've begun splitting large consolidated API files into individual endpoint files. This allows each function to stay under the limit and improves cold start performance.

---

## ✅ Completed: Admin Endpoints

The `/api/admin.js` file has been split into individual endpoints:

### New Endpoint Structure

| Old Endpoint | New Endpoint | Method | Description |
|-------------|-------------|--------|-------------|
| `/api/admin?action=create-user` | `/api/admin/create-user` | POST | Create new user with role |
| `/api/admin?action=invite-manager` | `/api/admin/invite-manager` | POST | Send manager invitation |
| `/api/admin?action=resend-invitation` | `/api/admin/resend-invitation` | POST | Extend invitation expiry |
| `/api/admin?action=revoke-invitation` | `/api/admin/revoke-invitation` | POST | Revoke pending invitation |
| `/api/admin?action=get-pending-invitations` | `/api/admin/get-pending-invitations` | GET | Get all pending invites |

### Migration for Frontend

**Before:**
```javascript
const response = await fetch('/api/admin?action=create-user', {
  method: 'POST',
  body: JSON.stringify({ email, password, role, accountId })
});
```

**After:**
```javascript
const response = await fetch('/api/admin/create-user', {
  method: 'POST',
  body: JSON.stringify({ email, password, role, accountId })
});
```

---

## 🚧 TODO: Reviews Endpoints

The `/api/reviews.js` file is **1267 lines** and needs to be split. It contains:

### Google Platform Actions - `GET /api/reviews?platform=google&action=ratings` → Get Google ratings for venue - `GET /api/reviews?platform=google&action=places-search` → Search Google Places - `GET /api/reviews?platform=google&action=place-details` → Get place details - `POST /api/reviews?platform=google&action=update-venue` → Update venue with Google data

### TripAdvisor Platform Actions - `GET /api/reviews?platform=tripadvisor&action=ratings` → Get TripAdvisor ratings - `GET /api/reviews?platform=tripadvisor&action=location-search` → Search locations - `GET /api/reviews?platform=tripadvisor&action=location-details` → Get location details - `POST /api/reviews?platform=tripadvisor&action=update-venue` → Update venue

### Unified Actions - `GET /api/reviews?platform=unified&action=search` → Unified review search

### Recommended Split Structure

```
api/
├── reviews/
│   ├── google/
│   │   ├── ratings.js
│   │   ├── places-search.js
│   │   ├── place-details.js
│   │   └── update-venue.js
│   ├── tripadvisor/
│   │   ├── ratings.js
│   │   ├── location-search.js
│   │   ├── location-details.js
│   │   └── update-venue.js
│   └── unified/
│       └── search.js
```

**Suggested new routes:** - `/api/reviews/google/ratings` - `/api/reviews/google/places-search` - `/api/reviews/tripadvisor/ratings` - `/api/reviews/unified/search`

---

## 📋 Other Large Files to Consider

| File | Lines | Status | Priority |
|------|-------|--------|----------|
| `/api/reviews.js` | 1267 | ⚠️ Needs splitting | High |
| `/api/google-reviews.js` | 313 | 🟡 Monitor | Medium |
| `/api/google.js` | 285 | 🟡 Monitor | Medium |
| `/api/admin.js` | 199 | ✅ Split (keep for backwards compat) | Done |

---

## 🔄 Migration Strategy

### Phase 1: Create New Endpoints (Done for Admin) - [x] Split admin.js into `/api/admin/*` files - [ ] Split reviews.js into `/api/reviews/**/*` files - [ ] Split google-reviews.js if needed - [ ] Split google.js if needed

### Phase 2: Update Frontend Calls - [ ] Update admin API calls in dashboard - [ ] Update review API calls in dashboard - [ ] Update Google integration calls

### Phase 3: Backwards Compatibility - Keep old files for 1-2 releases for backwards compatibility - Add deprecation warnings in console - Remove old files after frontend migration complete

### Phase 4: Testing - [ ] Test all new admin endpoints - [ ] Test all new review endpoints - [ ] Verify authentication still works - [ ] Check error handling

---

## 🛠️ Implementation Notes

### Authentication Handling
All endpoints use `auth-helper.js` functions: - `requireAdminRole(req)` - For admin-only endpoints - `requireMasterRole(req)` - For account owners - `authenticateVenueAccess(req, venueId)` - For venue-specific access

### Error Response Format
Consistent error format across all endpoints:
```json
{
  "error": "Error message here"
}
```

### Supabase Clients - **Admin Client**: Uses `SUPABASE_SERVICE_ROLE_KEY` for bypassing RLS - **Regular Client**: Uses `SUPABASE_ANON_KEY` for user-level access

---

## 📊 Benefits of Splitting

1. **Vercel Function Limits**: Each function stays well under the 1MB limit
2. **Cold Start Performance**: Smaller functions = faster cold starts
3. **Debugging**: Easier to trace issues to specific endpoints
4. **Deployment**: Can update individual endpoints without redeploying all
5. **Monitoring**: Better metrics per endpoint in Vercel dashboard
6. **Maintenance**: Easier to understand and modify individual endpoints

---

## ⚠️ Important Notes - **Don't delete old files yet** - Keep for backwards compatibility during migration - **Test thoroughly** - Each endpoint should be tested in production - **Update incrementally** - Migrate frontend calls gradually, not all at once - **Monitor errors** - Watch Sentry for any issues with new endpoints - **Document changes** - Update API documentation when migration complete

---

## 🚀 Next Steps

1. **Complete reviews.js split** - Highest priority due to size
2. **Update frontend code** - Incrementally migrate API calls
3. **Test in production** - Verify all endpoints work correctly
4. **Monitor performance** - Check cold start times improve
5. **Remove old files** - After 2-3 weeks of stable operation

---

## 📞 Questions?

If you encounter issues during migration:
1. Check Vercel function logs
2. Review Sentry error reports
3. Test endpoints with Postman/Thunder Client
4. Verify authentication tokens are being passed correctly
