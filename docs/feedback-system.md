# Feedback System

## Overview

The Chatters feedback system allows customers to submit real-time feedback via QR codes, which staff can then view, manage, and resolve through both the main dashboard and kiosk interfaces.

## Feedback Collection Flow

### 1. Customer Experience
1. **QR Code Scan**: Customer scans venue-specific QR code at their table
2. **Feedback Form**: Loads custom questions for the venue with rating scale (1-5)
3. **Additional Comments**: Optional text feedback for each question
4. **Submission**: Creates feedback entries grouped by `session_id`

### 2. Staff Notification - Real-time alerts for ratings ≤ 2 (poor feedback) - Dashboard notifications for immediate attention - Feedback appears in alerts tab for action

## Feedback Data Structure

### Session Grouping
Multiple feedback items are grouped by `session_id`:

```javascript
// Example session structure
{
  session_id: "uuid",
  table_number: 12,
  created_at: "2025-01-17T10:30:00Z",
  items: [
    {
      id: "uuid",
      question_id: "uuid", 
      rating: 2,
      additional_feedback: "Food was cold"
    },
    {
      id: "uuid",
      question_id: "uuid",
      rating: 4, 
      additional_feedback: "Great service"
    }
  ],
  avg_rating: 3.0,
  has_comments: true
}
```

### Rating Classification - **Positive Feedback**: Average rating > 3 - **Neutral Feedback**: Average rating = 3 - **Negative Feedback**: Average rating < 3 (requires resolution)

## Resolution Workflows

### Main Dashboard (`FeedbackTabs.js`)

#### Positive Feedback (Rating > 3) - **Button Text**: "View & Clear" - **Modal Title**: "View Feedback" - **Action**: Simple acknowledgment - **Database**: `resolution_type: 'positive_feedback_cleared'`, `resolved_by: null` - **No staff assignment required**

#### Negative Feedback (Rating ≤ 3) - **Button Text**: "Resolve" - **Modal Title**: "Resolve Feedback" - **Actions Available**:
  1. **Mark as Resolved**: Assign to staff member, resolution type: `staff_resolved`
  2. **No Action Needed**: Dismiss with reason, resolution type: `dismissed`

### Kiosk Mode (`FeedbackDetailModal.js`)

#### Positive Feedback (Rating > 3) - **Section Title**: "Acknowledgment" - **Interface**: Clean acknowledgment with green styling - **Action**: "Acknowledge & Clear Feedback" - **Database**: Same as dashboard - `positive_feedback_cleared`, no staff assignment

#### Negative Feedback (Rating ≤ 3) - **Section Title**: "Resolution Actions" - **Action Types**:
  1. **Mark as Resolved**: Full staff assignment workflow
  2. **Acknowledge & Dismiss**: With dismissal reason

### Staff Assignment Logic

#### Staff vs Employee Resolution
```javascript
if (selectedStaffMember.startsWith('staff-')) {
  // Direct staff resolution
  resolvedById = staffMemberId;
} else if (selectedStaffMember.startsWith('employee-')) {
  // Employee resolution via staff proxy
  const currentStaffMember = findCurrentStaffUser();
  resolvedById = currentStaffMember.id;
  resolutionNotes = `Resolved by ${employee.name} via ${staff.name}`;
}
```

**Important**: `resolved_by` field must reference `staff.id` due to foreign key constraint.

## Database Resolution Fields

### Primary Resolution Tracking
```sql
is_actioned BOOLEAN DEFAULT false     -- Whether feedback has been addressed
resolved_by UUID REFERENCES staff(id) -- Staff member who resolved
resolved_at TIMESTAMPTZ              -- When it was resolved
resolution_type TEXT                  -- How it was handled
resolution_notes TEXT                 -- Additional context
```

### Dismissal Tracking
```sql
dismissed BOOLEAN DEFAULT false      -- Whether dismissed without action
dismissed_at TIMESTAMPTZ            -- When dismissed
dismissed_reason TEXT               -- Reason for dismissal
```

### Resolution Types - `staff_resolved`: Negative feedback resolved by staff member - `positive_feedback_cleared`: Positive feedback acknowledged - `dismissed`: Feedback dismissed as no action needed

## Feedback States & Filtering

### Alert Status Logic
```javascript
// Requires attention (shows in Alerts tab)
const needsAttention = session.lowScore && 
                       !session.isActioned && 
                       !session.isExpired && 
                       !session.isDismissed;

// Resolved/Actioned (shows in Resolved tab)  
const isResolved = session.isActioned || session.isDismissed;

// Expired (shows in Expired tab)
const isExpired = session.isExpired && 
                  !session.isActioned && 
                  !session.isDismissed;
```

### Expiry Logic
```javascript
const EXPIRY_THRESHOLD_MINUTES = 120; // 2 hours
const isExpired = dayjs().diff(dayjs(created_at), 'minute') > EXPIRY_THRESHOLD_MINUTES;
```

## Real-Time Updates

### Supabase Subscriptions
```javascript
// Listen for new feedback
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

### Auto-Refresh - Dashboard auto-refreshes every 30 seconds - Real-time updates for new submissions - Immediate UI updates after resolution actions

## Question Management

### Custom Questions
```javascript
// Question structure
{
  id: "uuid",
  venue_id: "uuid", 
  question: "How was your food?",
  order_index: 1,
  is_active: true,
  question_type: "rating"
}
```

### Question Types - `rating`: 1-5 star rating with optional comments - `text`: Text-only feedback - `custom`: Venue-specific question formats

## Performance Considerations

### Indexing Strategy
```sql
-- Critical indexes for feedback queries
CREATE INDEX idx_feedback_venue_created ON feedback(venue_id, created_at DESC);
CREATE INDEX idx_feedback_session ON feedback(session_id);
CREATE INDEX idx_feedback_resolution ON feedback(is_actioned, dismissed, venue_id);
```

### Query Optimization - Paginate large feedback lists - Use session grouping to reduce data transfer - Index on frequently filtered fields (`venue_id`, `is_actioned`, `created_at`)

## Error Handling

### Common Issues
1. **Foreign Key Violations**: Ensure `resolved_by` references valid `staff.id`
2. **Session Grouping**: Handle cases where `session_id` is null
3. **Permission Errors**: Verify user has access to venue

### Resolution Validation
```javascript
// Validate staff assignment before resolution
if (!selectedStaffMember) {
  throw new Error('Staff member required for resolution');
}

// Ensure staff member exists in venue
const staffExists = await validateStaffMemberExists(staffId, venueId);
if (!staffExists) {
  throw new Error('Staff member not found for this venue');
}
```

## Analytics & Reporting

### Key Metrics - **Response Rate**: Percentage of tables providing feedback - **Resolution Time**: Time from submission to resolution - **Staff Performance**: Resolutions per staff member - **Customer Satisfaction**: Average ratings over time

### Data Aggregation
```javascript
// Session-level metrics
const avgRating = session.items
  .filter(item => item.rating !== null)
  .reduce((sum, item) => sum + item.rating, 0) / ratedItems.length;

// Venue-level metrics  
const dailyAverages = groupBy(feedback, 'created_at').map(day => ({
  date: day.date,
  avgRating: calculateAverage(day.items),
  totalFeedback: day.items.length,
  resolutionRate: day.items.filter(f => f.is_actioned).length / day.items.length
}));
```

## Best Practices

### Resolution Guidelines
1. **Respond Quickly**: Address negative feedback within 2 hours
2. **Assign Appropriately**: Match staff expertise to feedback type
3. **Document Actions**: Use resolution notes for context
4. **Follow Up**: Verify customer satisfaction after resolution

### Data Management
1. **Archive Old Feedback**: Consider archiving feedback older than 1 year
2. **Monitor Performance**: Track resolution times and staff performance
3. **Validate Data**: Ensure feedback sessions are properly grouped
4. **Maintain Indexes**: Monitor query performance and update indexes as needed

---

*The feedback system is designed for real-time responsiveness while maintaining data integrity and providing comprehensive tracking for venue management.*