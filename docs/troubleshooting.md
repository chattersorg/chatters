# Troubleshooting Guide

## Common Issues & Solutions

### Authentication & Access Issues

#### "Access Denied" or User Cannot Login
**Symptoms**: User gets logged out, can't access dashboard, or sees access denied messages.

**Diagnosis**:
```javascript
// Check user auth state
const { data: { user } } = await supabase.auth.getUser();
console.log('Auth user:', user);

// Check user record in database
const { data: userRecord } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('User record:', userRecord);
```

**Solutions**:
1. **Missing User Record**: User exists in auth but not in `users` table
   ```sql
   INSERT INTO users (id, email, role, account_id) 
   VALUES ('auth-user-id', 'user@example.com', 'master', 'account-id');
   ```

2. **Incorrect Role Assignment**: 
   ```sql
   UPDATE users SET role = 'master' WHERE email = 'user@example.com';
   ```

3. **Missing Venue Access**: For managers, ensure staff record exists
   ```sql
   INSERT INTO staff (user_id, venue_id, first_name, last_name) 
   VALUES ('user-id', 'venue-id', 'First', 'Last');
   ```

#### Trial Expired Access Issues
**Symptoms**: User can access system even after trial expiry, or gets unexpected redirects.

**Diagnosis**:
```sql
-- Check account trial status
SELECT 
  a.trial_ends_at,
  a.is_paid,
  CASE 
    WHEN a.is_paid THEN 'active'
    WHEN a.trial_ends_at > now() THEN 'trial_active'
    ELSE 'trial_expired'
  END as status
FROM accounts a
JOIN users u ON a.id = u.account_id
WHERE u.email = 'user@example.com';
```

**Solutions**:
1. **Update Trial Enforcement**: Check `DashboardFrame.js:108-112` for trial redirect logic
2. **Billing Access**: Ensure managers can't access billing unless trial expired
3. **Clear Browser Cache**: Trial info might be cached locally

### Feedback System Issues

#### "Failed to mark feedback as actioned" Error
**Symptoms**: Error when trying to resolve feedback in kiosk or dashboard.

**Diagnosis**:
```javascript
// Check the exact error
console.error('Resolution error:', error);

// Verify staff member exists
const { data: staff } = await supabase
  .from('staff')
  .select('*')
  .eq('id', selectedStaffId)
  .eq('venue_id', venueId);
console.log('Staff member:', staff);
```

**Common Causes & Solutions**:

1. **Foreign Key Constraint Violation** (`Key is not present in table "staff"`)
   ```javascript
   // Ensure resolved_by references staff.id, not users.id
   const updateData = {
     resolved_by: staffId, // Must be from staff table
     resolution_type: 'staff_resolved'
   };
   ```

2. **Employee Resolution Issues**: When employee resolves feedback
   ```javascript
   // Use staff proxy for employee resolutions
   if (selectedStaffMember.startsWith('employee-')) {
     const currentStaffMember = staffMembers.find(s => 
       s.source === 'staff' && s.user_id === currentUser?.id
     );
     resolvedById = currentStaffMember.id; // Use staff ID as proxy
   }
   ```

3. **Missing Venue Access**: User doesn't have access to venue
   ```sql
   -- Verify user has venue access
   SELECT s.* FROM staff s WHERE s.user_id = 'user-id' AND s.venue_id = 'venue-id';
   ```

#### Feedback Not Appearing in Dashboard
**Symptoms**: New feedback submitted but not showing in alerts or dashboard.

**Diagnosis**:
```sql
-- Check if feedback exists
SELECT * FROM feedback WHERE venue_id = 'venue-id' ORDER BY created_at DESC LIMIT 10;

-- Check real-time subscription
console.log('Supabase subscription status:', subscription);
```

**Solutions**:
1. **RLS Policy Issues**: Check user can access venue feedback
   ```sql
   -- Test RLS as specific user
   SET ROLE authenticated;
   SET request.jwt.claims TO '{"sub": "user-id"}';
   SELECT * FROM feedback WHERE venue_id = 'venue-id';
   ```

2. **Real-time Subscription**: Ensure subscription is active
   ```javascript
   const subscription = supabase
     .channel('feedback-updates')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public', 
       table: 'feedback',
       filter: `venue_id=eq.${venueId}`
     }, handleNewFeedback)
     .subscribe();
   ```

3. **Filtering Logic**: Check if feedback meets alert criteria
   ```javascript
   // Feedback needs low score to appear in alerts
   const isAlert = session.lowScore && !session.isActioned && !session.isExpired;
   ```

### Database & Performance Issues

#### Slow Query Performance
**Symptoms**: Dashboard takes long to load, feedback queries timeout.

**Diagnosis**:
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM feedback WHERE venue_id = 'venue-id' ORDER BY created_at DESC;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'feedback' AND attname IN ('venue_id', 'created_at', 'is_actioned');
```

**Solutions**:
1. **Add Missing Indexes**:
   ```sql
   CREATE INDEX idx_feedback_venue_created ON feedback(venue_id, created_at DESC);
   CREATE INDEX idx_feedback_resolution ON feedback(is_actioned, dismissed, venue_id);
   ```

2. **Optimize Queries**: Use pagination and limit results
   ```javascript
   const { data } = await supabase
     .from('feedback')
     .select('*')
     .eq('venue_id', venueId)
     .order('created_at', { ascending: false })
     .limit(50); // Limit results
   ```

3. **Session Grouping**: Group feedback by session_id to reduce data transfer
   ```javascript
   // Group in frontend instead of fetching all individual items
   const sessions = groupBySession(feedbackItems);
   ```

#### Connection Timeouts
**Symptoms**: "Network Error" or connection timeout messages.

**Solutions**:
1. **Check Supabase Status**: Visit [Supabase Status](https://status.supabase.com)
2. **Increase Timeout**: Add timeout configuration
   ```javascript
   const supabase = createClient(url, key, {
     db: { timeout: 10000 }
   });
   ```
3. **Retry Logic**: Implement automatic retries
   ```javascript
   const retryQuery = async (queryFn, maxRetries = 3) => {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await queryFn();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   };
   ```

### UI & Component Issues

#### Components Not Re-rendering
**Symptoms**: Data updates but UI doesn't reflect changes.

**Solutions**:
1. **State Dependencies**: Ensure useEffect dependencies are correct
   ```javascript
   useEffect(() => {
     loadFeedback();
   }, [venueId, loadFeedback]); // Include all dependencies
   ```

2. **Context Updates**: Check VenueContext is updating properly
   ```javascript
   // Force context refresh
   setCurrentVenue(venueId); // Triggers re-render
   ```

3. **Component Keys**: Use proper keys for dynamic lists
   ```javascript
   {sessions.map(session => (
     <FeedbackCard key={session.session_id} session={session} />
   ))}
   ```

#### Modal Issues
**Symptoms**: Modals not opening, closing, or displaying incorrect data.

**Solutions**:
1. **Modal State**: Check modal state management
   ```javascript
   // Ensure modal state is properly managed
   const [showModal, setShowModal] = useState(false);
   const [selectedSession, setSelectedSession] = useState(null);
   ```

2. **Z-Index Issues**: Check CSS z-index conflicts
   ```css
   .modal-overlay {
     z-index: 50; /* Ensure higher than other elements */
   }
   ```

### Environment & Configuration Issues

#### Environment Variables Not Loading
**Symptoms**: API calls fail, features don't work, blank screens.

**Diagnosis**:
```javascript
console.log('Environment variables:', {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  stripeKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
});
```

**Solutions**:
1. **File Location**: Ensure `.env.local` is in project root
2. **Variable Names**: Must start with `REACT_APP_`
3. **Restart Server**: Environment changes require restart
   ```bash
   # Stop server (Ctrl+C) and restart
   npm start
   ```

#### Stripe Integration Issues
**Symptoms**: Payment buttons don't work, checkout fails.

**Solutions**:
1. **Test Mode**: Ensure using test keys in development
2. **Webhook Configuration**: Check webhook endpoints
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
3. **CORS Issues**: Ensure domain is allowed in Stripe dashboard

### Deployment Issues

#### Build Failures
**Symptoms**: `npm run build` fails with errors.

**Common Solutions**:
1. **Clear Cache**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Environment Variables**: Ensure all required variables are set
3. **TypeScript Errors**: Fix any type errors
   ```bash
   npm run typecheck
   ```

4. **Linting Errors**: Fix ESLint warnings
   ```bash
   npm run lint -- --fix
   ```

#### Production Runtime Errors
**Symptoms**: App works in development but fails in production.

**Solutions**:
1. **Source Maps**: Enable for debugging
   ```bash
   GENERATE_SOURCEMAP=true npm run build
   ```

2. **Console Logs**: Check browser console for errors
3. **Browser DevTools**: Use debugging tools for error analysis

## Debugging Tools

### Supabase Debugging
```javascript
// Enable debug mode
const supabase = createClient(url, key, {
  debug: process.env.NODE_ENV === 'development'
});

// Log all queries
supabase.from('table').select().then(result => {
  console.log('Query result:', result);
});
```

### React DevTools - Install React Developer Tools browser extension - Use Profiler to identify performance issues - Inspect component props and state

### Network Debugging
```javascript
// Monitor all Supabase requests
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

## Performance Monitoring

### Core Web Vitals
```javascript
// Monitor performance
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log); 
getLCP(console.log);
getTTFB(console.log);
```

### Memory Usage
```javascript
// Check for memory leaks
setInterval(() => {
  console.log('Memory usage:', performance.memory);
}, 10000);
```

## Getting Help

### Before Asking for Help
1. Check this troubleshooting guide
2. Review relevant documentation sections
3. Check browser console for errors
4. Test with different user roles/accounts
5. Verify database state matches expectations

### Information to Include
When reporting issues, include: - **Error messages**: Full error text and stack traces - **User role**: admin/master/manager - **Browser**: Chrome/Safari/Firefox + version - **Steps to reproduce**: Exact sequence that causes issue - **Expected vs actual behavior** - **Database state**: Relevant table data - **Environment**: Development/Production

---

*This troubleshooting guide covers the most common issues encountered in the Chatters platform. Keep it updated as new issues are discovered and resolved.*