# Database Schema

## Overview

Chatters uses Supabase (PostgreSQL) with Row Level Security (RLS) policies to ensure multi-tenant data isolation. The schema supports role-based access control and trial account management.

## Core Tables

### `accounts`
Top-level account grouping for billing and trial management.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  trial_ends_at TIMESTAMPTZ,
  is_paid BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);
```

**Key Fields**: - `trial_ends_at`: When the trial period expires - `is_paid`: Whether account has active subscription - `stripe_customer_id`: Stripe customer reference - `stripe_subscription_id`: Active subscription reference

### `users`
User authentication and role assignment.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'master', 'manager')),
  account_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Roles**: - `admin`: System administrators with full access - `master`: Account owners with billing access - `manager`: Venue-specific users with limited access

### `venues`
Individual venue information linked to accounts.

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'Europe/London',
  feedback_hours_start TIME DEFAULT '09:00',
  feedback_hours_end TIME DEFAULT '22:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Features**: - Venue-specific timezone support - Configurable feedback collection hours - Linked to account for billing purposes

### `staff`
Many-to-many relationship between users and venues.

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  venue_id UUID REFERENCES venues(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, venue_id)
);
```

**Purpose**: - Links manager users to specific venues - Provides staff information for feedback resolution - Enforces venue access control for managers

### `employees`
Venue-specific employees (not system users).

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Difference from Staff**: - Employees are venue-specific records - No system login capabilities - Can be assigned to resolve feedback via staff proxy

### `feedback`
Customer feedback entries with resolution tracking.

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  venue_id UUID REFERENCES venues(id) NOT NULL,
  table_number INTEGER NOT NULL,
  question_id UUID REFERENCES questions(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  additional_feedback TEXT,
  is_actioned BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES staff(id),
  resolved_at TIMESTAMPTZ,
  resolution_type TEXT CHECK (resolution_type IN ('staff_resolved', 'positive_feedback_cleared', 'dismissed')),
  resolution_notes TEXT,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Fields**: - `session_id`: Groups related feedback from same customer session - `rating`: 1-5 star rating - `is_actioned`: Whether feedback has been addressed - `resolved_by`: Staff member who resolved (must be in staff table) - `resolution_type`: How the feedback was handled - `dismissed`: Whether feedback was dismissed without action

**Resolution Types**: - `staff_resolved`: Negative feedback resolved by staff member - `positive_feedback_cleared`: Positive feedback acknowledged - `dismissed`: Feedback dismissed as no action needed

### `questions`
Custom feedback questions per venue.

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) NOT NULL,
  question TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  question_type TEXT DEFAULT 'rating' CHECK (question_type IN ('rating', 'text', 'custom')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Features**: - Venue-specific custom questions - Ordering support for question sequence - Multiple question types (rating, text, custom) - Active/inactive toggle

## Supporting Tables

### `zones`
Floor plan zone definitions for table grouping.

```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `tables`
Table definitions with zone assignments.

```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) NOT NULL,
  table_number INTEGER NOT NULL,
  zone_id UUID REFERENCES zones(id),
  x_position FLOAT,
  y_position FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venue_id, table_number)
);
```

**Floor Plan Features**: - Visual positioning (x_position, y_position) - Zone grouping for organization - Unique table numbers per venue

## Data Relationships

### Account → Venues → Staff/Employees
```
accounts (1) ──── (many) venues
                      ├── (many) staff ──── (many) users  
                      ├── (many) employees
                      ├── (many) feedback
                      ├── (many) questions
                      ├── (many) zones
                      └── (many) tables
```

### Feedback Resolution Chain
```
feedback.resolved_by → staff.id → users.id
```

**Important**: - `feedback.resolved_by` must reference `staff.id` (not `users.id`) - For employee resolutions, use staff member as proxy - Positive feedback can have `resolved_by = null`

## Row Level Security (RLS)

### Venue-Scoped Access
All venue-related tables enforce RLS based on user's venue access:

```sql
-- Example RLS policy for feedback table
CREATE POLICY "Users can access feedback for their venues" ON feedback
FOR ALL USING (
  venue_id IN (
    SELECT venue_id FROM staff WHERE user_id = auth.uid()
    UNION
    SELECT v.id FROM venues v 
    JOIN accounts a ON v.account_id = a.id
    JOIN users u ON u.account_id = a.id
    WHERE u.id = auth.uid() AND u.role = 'master'
  )
);
```

### Admin Override
Admin users bypass venue restrictions:

```sql
-- Admin users can access all data
CREATE POLICY "Admins can access all feedback" ON feedback
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Trial Management

### Account Status Checking
```sql
-- Check if account trial is expired
SELECT 
  trial_ends_at,
  is_paid,
  CASE 
    WHEN is_paid THEN 'active'
    WHEN trial_ends_at IS NULL THEN 'no_trial'
    WHEN trial_ends_at > now() THEN 'trial_active'
    ELSE 'trial_expired'
  END as status
FROM accounts WHERE id = account_id;
```

### Manager Access via Venue
```sql
-- Get account status for manager users
SELECT a.trial_ends_at, a.is_paid
FROM accounts a
JOIN venues v ON a.id = v.account_id  
JOIN staff s ON v.id = s.venue_id
WHERE s.user_id = manager_user_id;
```

## Common Queries

### Get User's Accessible Venues
```sql
SELECT DISTINCT v.*
FROM venues v
LEFT JOIN staff s ON v.id = s.venue_id AND s.user_id = auth.uid()
LEFT JOIN accounts a ON v.account_id = a.id
LEFT JOIN users u ON a.id = u.account_id AND u.id = auth.uid()
WHERE s.user_id IS NOT NULL OR u.role = 'master';
```

### Get Unresolved Feedback for Venue
```sql
SELECT f.*, q.question, s.first_name, s.last_name
FROM feedback f
LEFT JOIN questions q ON f.question_id = q.id
LEFT JOIN staff s ON f.resolved_by = s.id
WHERE f.venue_id = venue_id 
  AND f.is_actioned = false
  AND f.dismissed = false
ORDER BY f.created_at DESC;
```

### Get Staff Performance Metrics
```sql
SELECT 
  s.first_name,
  s.last_name,
  COUNT(f.id) as resolved_count,
  AVG(EXTRACT(EPOCH FROM (f.resolved_at - f.created_at))/3600) as avg_resolution_hours
FROM staff s
LEFT JOIN feedback f ON s.id = f.resolved_by
WHERE s.venue_id = venue_id
  AND f.created_at >= date_trunc('month', now())
GROUP BY s.id, s.first_name, s.last_name;
```

## Indexes

Critical indexes for performance:

```sql
-- Feedback queries
CREATE INDEX idx_feedback_venue_created ON feedback(venue_id, created_at DESC);
CREATE INDEX idx_feedback_session ON feedback(session_id);
CREATE INDEX idx_feedback_resolution ON feedback(is_actioned, dismissed, venue_id);

-- Staff relationships  
CREATE INDEX idx_staff_user_venue ON staff(user_id, venue_id);
CREATE INDEX idx_staff_venue ON staff(venue_id);

-- Account lookups
CREATE INDEX idx_venues_account ON venues(account_id);
CREATE INDEX idx_users_account ON users(account_id);
```

---

*This schema supports multi-tenant SaaS operations with role-based access control, trial management, and comprehensive feedback tracking.*