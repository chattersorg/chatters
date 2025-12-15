# System Architecture

## Overview

Chatters is a React SaaS application for hospitality venue feedback management with a dual-domain architecture serving both marketing content and the dashboard application.

## Domain-Based Architecture

### Marketing Site - **Domain**: `getchatters.com` - **Purpose**: Landing pages, pricing, features, authentication - **Components**: Static marketing pages, sign-up/sign-in flows

### Dashboard Application - **Domain**: `my.getchatters.com` - **Purpose**: Core application functionality for venue management - **Components**: Feedback management, reports, staff management, settings

### Domain Routing Logic
```javascript
// App.js:26
if (window.location.hostname.startsWith('my.')) {
  // Dashboard app (AppRoutes)
} else {
  // Marketing site (MarketingRoutes) 
}
```

## User Roles & Authorization

### Role Hierarchy
1. **Admin** (`admin`) - Full system access - Bypasses VenueContext - Separate routing (`/admin/*`) - Can access any account/venue

2. **Master** (`master`) - Account owners - Can access multiple venues within their account - Full billing and subscription access - Can manage staff and venues

3. **Manager** (`manager`) - Venue-specific access through staff table - Cannot access billing (unless trial expired) - Limited to assigned venues

### Role Detection Flow
```javascript
// AppRoutes.js:14-31
// Automatic redirection based on user role
if (role === 'admin') redirect('/admin')
if (role === 'master') redirect('/dashboard') 
if (role === 'manager') redirect('/dashboard')
```

## Database Architecture

### Core Tables - **`accounts`**: Top-level account grouping, trial management - **`venues`**: Individual venue information, linked to accounts - **`users`**: User authentication and role assignment - **`staff`**: Many-to-many relationship between users and venues - **`employees`**: Venue-specific employees (not system users) - **`feedback`**: Customer feedback entries - **`questions`**: Custom feedback questions per venue

### Key Relationships
```
accounts (1) ──── (many) venues
venues (1) ──── (many) staff ──── (many) users
venues (1) ──── (many) employees
venues (1) ──── (many) feedback
venues (1) ──── (many) questions
```

## State Management

### VenueContext
**Location**: `src/context/VenueContext.js`

**Purpose**: Core venue selection and user role management - Automatically resolves user's accessible venues based on role - Handles venue switching with localStorage persistence - **Critical**: Admin users should never mount VenueContext (line 42)

**Key Functions**: - `setCurrentVenue()`: Switch active venue - `venueId`, `venueName`: Current venue state - `allVenues`: All accessible venues for user - `userRole`: Current user's role

### ModalContext
**Location**: `src/context/ModalContext.js`

**Purpose**: Global modal state management - Centralized modal opening/closing - Modal state persistence across navigation

## Component Architecture

### Page Organization
```
src/pages/
├── marketing/          # Marketing site pages
├── admin/             # Admin-only pages  
├── components/        # Page-specific components
│   ├── settings/      # Settings tab components
│   ├── staff/         # Staff management components
│   ├── reports/       # Report visualizations
│   └── kiosk/         # Kiosk mode components
└── [main pages]       # Dashboard, Reports, etc.
```

### UI Components
```
src/components/
├── ui/               # shadcn/ui base components
├── reports/          # Chart and analytics components
├── dashboard/        # Dashboard-specific components
└── common/           # Shared utility components
```

## Authentication Flow

### Trial Management - **Trial tracking**: Account-level `trial_ends_at` and `is_paid` fields - **Access enforcement**: Automatic redirection to billing when expired - **Role-based access**: Masters get full billing access, managers get limited access

### Session Management - **Supabase Auth**: JWT-based authentication - **Role resolution**: Database lookup on login - **Venue access**: Resolved through staff table for managers

## Key Architectural Patterns

### 1. Role-Based Component Rendering
```javascript
if (userRole === 'master') {
  // Show billing and account management
} else if (userRole === 'manager') {
  // Show limited venue management
}
```

### 2. Venue-Scoped Data
```javascript
// Most API calls include venue scoping
supabase.from('feedback').select('*').eq('venue_id', venueId)
```

### 3. Staff Membership Resolution
```javascript
// Managers access venues through staff table
const { data: staffRow } = await supabase
  .from('staff')
  .select('venues!inner(account_id)')
  .eq('user_id', userId)
```

### 4. Admin Isolation - Admin users have completely separate routing - Never load VenueContext to avoid conflicts - Direct database access bypassing venue restrictions

## Technology Stack

### Frontend - **React 18**: Component framework - **React Router**: Client-side routing - **Tailwind CSS**: Utility-first styling - **Radix UI**: Accessible component primitives - **shadcn/ui**: Pre-built component library

### Data Visualization - **Chart.js**: Primary charting library - **Recharts**: React-specific charts - **Custom heatmaps**: Floor plan visualizations

### Backend Services - **Supabase**: Database, authentication, real-time subscriptions - **Stripe**: Payment processing and subscription management - **Vercel**: Hosting and serverless functions

### Monitoring & Analytics - **Sentry**: Error tracking and performance monitoring - **Vercel Analytics**: Usage analytics - **Speed Insights**: Performance monitoring

## Environment Configuration

### Required Variables
```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
REACT_APP_STRIPE_PRICE_MONTHLY=price_monthly_id
REACT_APP_STRIPE_PRICE_YEARLY=price_yearly_id
```

### Development vs Production - **Development**: Uses local environment variables - **Production**: Vercel environment variable management - **Database**: Single Supabase instance for all environments

## Security Considerations

### Row Level Security (RLS) - All Supabase tables use RLS policies - Users can only access their own account's data - Venue-scoped access through staff relationships

### Role-Based Access Control - Frontend role checks prevent unauthorized UI access - Backend RLS policies enforce data access restrictions - Trial expiry enforcement at application level

### API Security - Supabase handles JWT validation - Client-side role checks for UI rendering - Server-side policies for data access

---

*This architecture supports multi-tenant SaaS operations with role-based access control and trial management.*