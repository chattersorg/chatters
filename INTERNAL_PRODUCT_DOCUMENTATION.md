# Chatters Internal Product Documentation

This document provides comprehensive internal product documentation for Chatters, designed for onboarding new team members and understanding the complete product functionality.

## Overview

### Product Purpose
Chatters is a React SaaS application for hospitality venue feedback management. The platform enables venues to collect, manage, and act on customer feedback in real-time through QR code-based surveys.

### Target Audience - **Primary**: Hospitality venues (restaurants, hotels, retail, events) - **Users**: Venue owners, managers, and staff - **Geographic**: UK market with GBP pricing

### Architecture Overview
The application serves two distinct domains: - **Marketing site**: Main domain (getchatters.com) - **Dashboard app**: Subdomain (my.getchatters.com)

Domain-based routing in `App.js:26` automatically serves appropriate content based on hostname detection.

---

## Navigation Structure

### Main Navigation Flow
Users enter through different paths based on their role:

1. **Role Detection**: `AppRoutes.js:14-31` automatically detects user role on login
2. **Admin Users**: Redirected to `/admin` (separate routing system)
3. **Regular Users**: Redirected to `/dashboard` with venue context loaded

### Primary Navigation Menu
Located in the top navigation bar (`DashboardFrame.js:203-221`), available on desktop and mobile: - **Overview** (`/dashboard`) - Main dashboard with daily metrics - **Feedback** (`/questions`) - Feedback collection and QR code management - **Reports** (`/reports`) - Analytics and performance metrics - **Floor Plan** (`/floorplan`) - Visual table layout and heatmap - **Staff** (`/staff`) - Team member management

### Secondary Navigation - **Settings** - Account/venue configuration (gear icon in top-right) - **Kiosk Mode** - Real-time feedback monitoring (button in top navigation) - **Venue Switcher** - Available for master accounts with multiple venues

### Mobile Navigation
Responsive hamburger menu with identical functionality, automatically closes when navigating between pages.

---

## User Roles & Authentication

### Role Hierarchy
1. **Admin**: Full system access (`admin` role or `@getchatters.com` email)
2. **Master**: Account owners who can manage multiple venues
3. **Manager**: Venue-specific access through staff table relationships

### Authentication Flow (`SignIn.js`)
1. User enters credentials on sign-in page
2. Supabase authentication validates user
3. System creates/verifies user record in `users` table
4. Role detection determines routing destination
5. VenueContext loads appropriate venue access

### Venue Context Resolution (`VenueContext.js`) - **Master users**: Access venues through `account_id` relationship - **Manager users**: Access venues through `staff` table membership - **Admin users**: Never mount VenueContext (bypass venue restrictions)

### Trial System - Trial banner displays days remaining (`DashboardFrame.js:160-188`) - Expired trials redirect to billing page automatically - Trial status tracked in `accounts` table with `trial_ends_at` field

---

## Page-by-Page Breakdown

### 1. Dashboard/Overview (`/dashboard`)

**Purpose**: Daily operational overview and quick actions

**Key Sections**: - **Header**: Quick action buttons (Launch Kiosk, Reports, Floor Plan) - **System Status**: Real-time online indicator with timestamp - **Key Metrics Grid**: 4 metric cards showing daily performance - Sessions actioned today - Unresolved alerts - Average satisfaction - Action completion rate - **Performance Charts**: Satisfaction trends and peak hours analysis - **Status Panels**: Table performance ranking and resolution times - **Recent Activity**: Recent sessions and assistance requests

**User Actions**: - Click "Launch Kiosk Mode" → Opens kiosk in new window - Click "Detailed Reports" → Navigate to Reports page - Click "Floor Plan" → Navigate to floor plan heatmap - View assistance request status indicators (pending/in progress/resolved)

**Real-time Updates**: Live subscription to assistance requests with status updates

---

### 2. Feedback Management (`/questions`)

**Purpose**: Create and manage customer feedback questions and QR codes

**Navigation Tabs**: - **QR Code & Sharing**: Generate and customize QR codes - **Question Management**: Add, edit, and organize feedback questions

#### QR Code Tab
**User Flow**:
1. User accesses QR Code tab (default or via sidebar)
2. QR code automatically generated for current venue
3. Options to download QR code in different formats
4. Copy shareable feedback URL
5. Customize QR code appearance and branding

**Key Elements**: - Live QR code preview - Download buttons (PNG, PDF, SVG) - Copy URL functionality - Branding customization options

#### Question Management Tab
**User Flow**:
1. View active questions (max 5 allowed)
2. Add new questions with character limit (100)
3. Drag and drop to reorder questions
4. Edit existing questions in-line
5. Archive questions when limit reached

**Key Actions**: - **Add Question**: Text input with real-time validation - **Reorder**: Drag-and-drop interface with visual feedback - **Edit**: Click to edit, ESC to cancel, Enter to save - **Delete**: Remove questions (moves to inactive status) - **Replace Modal**: When adding 6th question, choose replacement

**Limitations**: 5 active questions maximum, duplicate prevention

---

### 3. Reports (`/reports`)

**Purpose**: Comprehensive analytics and performance tracking

**Navigation Tabs**: - **Performance Dashboard**: Key metrics and trends - **Business Impact**: Revenue and operational insights - **Customer Insights**: Satisfaction analysis and patterns - **Quick Metrics**: At-a-glance performance indicators

**Key Metrics Calculated**: - Action completion rate (% of feedback actioned) - Average satisfaction score - Response time analytics - Peak hours analysis - Table performance rankings - Satisfaction trends over time

**User Actions**: - Switch between report tabs (desktop sidebar or mobile dropdown) - Filter data by time periods - View detailed breakdowns of metrics - Export data (where available)

**Real-time**: Live updates as new feedback arrives

---

### 4. Floor Plan/Heatmap (`/floorplan`)

**Purpose**: Visual table layout management and feedback heatmap

**Two Modes**:
1. **View Mode**: See table layout with feedback indicators
2. **Edit Mode**: Modify table positions and add/remove tables

**Mobile Restriction**: Desktop only - mobile users see "not available" message

#### View Mode - Visual floor plan with tables positioned - Color-coded feedback indicators on tables - Zone-based organization - Real-time feedback status display

#### Edit Mode User Flow
1. Click "Edit Layout" button
2. Add tables by number and shape (square, circle, long)
3. Drag tables to reposition
4. Resize tables using corner handles
5. Delete tables with trash can icon
6. Save changes or exit edit mode

**Zone Management**: - Create new zones with "Add Zone" button - Rename zones by clicking zone names - Delete zones (removes all contained tables) - Switch between zones using zone selector

**Table Management**: - Default table shapes with preset dimensions - Drag-and-drop positioning - Resize handles for custom dimensions - Table number assignment and validation

---

### 5. Staff Management (`/staff`)

**Purpose**: Manage team members and venue access permissions

**Role-Based Tabs**: - **Masters**: See Managers, Invites, Employees tabs - **Managers**: See Employees tab only

#### Managers Tab (Master Only)
**Functionality**: - View all managers across account venues - Add new managers via email invitation - Assign venue access permissions - Remove manager access

**User Flow**:
1. View list of current managers
2. Click "Add Manager" → Email invitation modal
3. Select which venues manager can access
4. Send invitation or add existing user
5. Manage venue assignments for existing managers

#### Employees Tab
**Purpose**: Track non-system users (staff without dashboard access)

**User Flow**:
1. View employee list for current venue(s)
2. Click "Add Employee" → Employee details form
3. Fill in name, email, phone, role
4. Save employee record for tracking/reporting

**Features**: - Employee search and filtering - Edit employee information - Delete employee records - Role assignment (custom text field)

#### Invites Tab (Master Only) - View pending staff invitations - Resend or cancel invitations - Track invitation status

---

### 6. Settings (`/settings`)

**Purpose**: Account and venue configuration management

**Navigation Tabs**: - **Profile**: Personal information - **Venue**: Venue details and configuration - **Branding**: Colors and visual customization - **Billing**: Subscription management (Master only) - **Notifications**: Alert preferences

#### Profile Tab
**User Actions**: - Update first name, last name - Email is read-only (managed by auth system) - Save changes with success/error feedback

#### Venue Tab  
**Configuration Options**: - Venue name - Table count - Address (full address structure) - TripAdvisor and Google Review links - Feedback collection timing settings

#### Branding Tab
**Customization Options**: - Primary color picker - Secondary color picker - Logo upload functionality - Color preview in real-time

#### Billing Tab (Master Users Only)
**Functionality**: - View trial status and days remaining - Choose monthly (£29/mo) or yearly (£278/yr) plans - Stripe checkout integration - Access restrictions for non-master users

**Trial Handling**: - Active trial banner with days remaining - Expired trial forces billing page redirect - Non-masters see access denied message

---

### 7. Kiosk Mode (`/kiosk`)

**Purpose**: Real-time staff monitoring interface for live service

**Layout**: Two-panel layout (sidebar + main view)

#### Left Sidebar
**Sections**:
1. **Header**: Venue name, exit button
2. **Assistance Requests**: Live service requests
3. **Feedback List**: Recent unresolved feedback

**Assistance Requests**: - Color-coded status (pending=red, acknowledged=yellow, resolved=green) - Action buttons (Acknowledge, Resolve) - Real-time updates via Supabase subscriptions

**Feedback List**: - Grouped by session with session info - Mark as resolved with staff member name - Filter to show only unresolved items - Click feedback to highlight table on floor plan

#### Main View
**Two Modes**:
1. **Overview**: Zone grid with feedback counts
2. **Zone Detail**: Individual zone floor plan

**Zone Overview**: - Grid of zones with feedback indicators - Click zone to enter detailed view - Summary statistics per zone

**Zone Detail View**: - Visual floor plan for selected zone - Tables with color-coded feedback status - Selected feedback highlighted - Click tables to view feedback details

**Real-time Features**: - Live feedback updates - Assistance request notifications - Automatic data refresh every 30 seconds - Visual status indicators update immediately

---

## Key User Flows

### 1. Initial Setup (New Venue)
1. Master user creates account and first venue
2. Navigate to Feedback → Question Management
3. Set up 3-5 feedback questions
4. Go to QR Code tab → Download QR codes
5. Navigate to Floor Plan → Add tables and zones
6. Place QR codes in venue locations
7. Launch Kiosk Mode for staff monitoring

### 2. Daily Operations
1. Staff opens Kiosk Mode at start of service
2. Customers scan QR codes → Submit feedback
3. Feedback appears in Kiosk sidebar in real-time
4. Staff click feedback to see table location
5. Staff resolve issues and mark feedback as actioned
6. Assistance requests handled via Kiosk interface

### 3. Performance Review
1. Manager accesses Reports page
2. Review Performance Dashboard for key metrics
3. Check Customer Insights for satisfaction trends
4. Use Business Impact tab for operational insights
5. Export or share reports with team

### 4. Staff Management
1. Master user navigates to Staff page
2. Managers tab → Add new manager via email
3. Assign venue access permissions
4. New manager receives invitation email
5. Manager logs in → Accesses assigned venues only

### 5. Venue Expansion (Multi-location)
1. Master user adds new venue in Settings → Venue
2. System creates new venue with same account_id
3. Venue switcher appears in top navigation
4. Set up questions, floor plan, and staff for new venue
5. Each venue operates independently with shared account

---

## Special Flows & Edge Cases

### Trial Management - **7-day countdown**: Trial banner shows remaining days - **Expiration**: Auto-redirect to billing page on access - **Upgrade flow**: Stripe checkout → Webhook → Account activation - **Manager access**: Can see trial status but cannot upgrade

### Venue Switching (Master Accounts) - **Venue selector**: Dropdown in top navigation shows all account venues - **Context switching**: Changes all data views to selected venue - **Persistence**: Last selected venue saved in localStorage - **Staff isolation**: Managers see only assigned venues

### Real-time System Behavior - **Feedback ingestion**: Live updates via Supabase subscriptions - **Kiosk updates**: Immediate visual feedback for staff - **Fallback polling**: 30-second intervals if WebSocket fails - **Error handling**: Graceful degradation with manual refresh

### Role-Based Access Control - **Admin bypass**: Admins never load venue context - **Manager limitations**: Cannot access billing or add other managers - **Data isolation**: Users only see their authorized venue data - **Staff table**: Central authority for venue access permissions

### Mobile Considerations - **Responsive navigation**: Hamburger menu with identical functionality - **Floor plan restriction**: Desktop only with mobile notification - **Touch optimization**: All buttons and forms work on mobile devices - **Performance**: Optimized loading for mobile connections

### Error States & Validation - **Question limits**: Hard limit of 5 active questions with replacement flow - **Character limits**: 100 characters for questions with real-time validation - **Duplicate prevention**: Questions cannot be duplicated within venue - **File uploads**: Logo upload with size and type validation - **Form validation**: Real-time feedback with save state management

This documentation covers the complete product functionality as implemented in the codebase. Each section provides both technical context and practical user guidance for team members who need to understand the product deeply.