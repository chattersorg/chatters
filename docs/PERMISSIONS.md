# Permissions System

This document describes the granular permissions system used in Chatters. Permissions control what managers can see and do within the dashboard.

## Overview

The permissions system has three main components:

1. **Permissions** - Individual capabilities (e.g., `feedback.view`, `staff.edit`)
2. **Role Templates** - Predefined sets of permissions (e.g., Viewer, Editor, Manager, Admin)
3. **User Permissions** - Links users to either a role template or custom permissions

Permissions are **account-wide** - a manager has the same permissions across all venues they have access to.

## User Roles

There are three user roles in Chatters:

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | System administrators | All permissions automatically |
| `master` | Account owners | All permissions automatically |
| `manager` | Venue managers | Based on assigned role template or custom permissions |

**Note:** `admin` and `master` users bypass permission checks entirely and have full access.

---

## Available Permissions

### Feedback

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `feedback.view` | View Feedback | - | Route: `/feedback/all`, Sidebar: Feedback menu |
| `feedback.respond` | Respond to Feedback | `feedback.view` | UI: Reply button in AllFeedback.js |
| `feedback.export` | Export Feedback | `feedback.view` | UI: Export button in StaffMemberDetails.js |
| `feedback.settings` | Edit Feedback Settings | `feedback.view` | Route: `/feedback/settings` |
| `questions.view` | View Questions | - | Routes: `/questions`, `/feedback/questions`, Sidebar: Questions menu item |
| `questions.edit` | Edit Questions | `questions.view` | UI: Add/Edit/Delete buttons in QuestionManagementTab.js |

### Reports

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `reports.view` | View Reports | - | Routes: `/reports/*`, Sidebar: Reports menu |
| `reports.export` | Export Reports | `reports.view` | UI: Export buttons in Staff_Leaderboard.js, StaffMemberDetails.js, RecognitionHistory.js |
| `reports.create` | Create Custom Reports | `reports.view` | Route: `/reports/builder` |

### NPS

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `nps.view` | View NPS Score | - | Routes: `/nps/score`, `/nps-report/:venueId`, Sidebar: NPS menu |
| `nps.insights` | View NPS Insights | `nps.view` | Route: `/nps/insights` |
| `nps.edit` | Edit NPS Settings | `nps.view` | Route: `/nps/settings` |
| `nps.export` | Export NPS Data | `nps.view` | UI: Export button in ReportsNPS.js |

### Staff

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `staff.view` | View Staff | - | Route: `/staff/employees`, Sidebar: Employees menu item |
| `staff.edit` | Edit Staff | `staff.view` | UI: Add/Import buttons in StaffList.js, Route: `/staff/import` |
| `staff.leaderboard` | View Leaderboard | `staff.view` | Route: `/staff/leaderboard`, Sidebar: Leaderboard menu item |
| `staff.recognition` | Manage Recognition | `staff.view` | Route: `/staff/recognition`, Sidebar: Recognition menu item |
| `staff.roles` | Manage Roles | `staff.view` | Route: `/staff/roles`, Sidebar: Roles menu item |
| `staff.locations` | Manage Locations | `staff.view` | Route: `/staff/locations`, Sidebar: Locations menu item |

### Managers

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `managers.view` | View Managers | - | Routes: `/staff/managers`, `/admin/managers`, Sidebar: Managers menu item |
| `managers.invite` | Invite Managers | `managers.view` | Route: `/staff/managers/add`, UI: Invite button in ManagersPage.js |
| `managers.venues` | Manage Venue Access | `managers.view` | UI: Venues tab in ManagerDetail.js |
| `managers.remove` | Remove Managers | `managers.view` | UI: Delete button in ManagerDetail.js, ManagersTab.js |
| `managers.permissions` | Manage Permissions | `managers.view` | Routes: `/admin/permissions/*`, UI: Permissions tab in ManagerDetail.js, Settings icon in ManagersPage.js |

### Venue Settings

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `venue.view` | View Venue Settings | - | Route: `/settings/venue`, Sidebar: Venue Settings |
| `venue.edit` | Edit Venue Settings | - | UI: Save button in VenueTab.js |
| `venue.branding` | Edit Branding | - | Route: `/settings/branding`, Sidebar: Branding menu item, UI: Upload/Save buttons in BrandingTab.js |
| `venue.integrations` | Manage Integrations | - | Route: `/settings/integrations`, Sidebar: Integrations menu item |

### QR Codes

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `qr.view` | View QR Code & URL | - | Route: `/settings/qr-code`, Sidebar: QR Code menu item |
| `qr.generate` | Download QR Code | `qr.view` | UI: Download button in QRCodeSection.js |

### Floor Plan

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `floorplan.view` | View Floor Plan | - | Route: `/floorplan`, Sidebar: Floor Plan menu |
| `floorplan.edit` | Edit Floor Plan | `floorplan.view` | Route: `/floorplan/edit`, UI: Add Table, Save, Clear buttons in EditControls.js |

### AI Features

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `ai.insights` | View Weekly Insights | - | Route: `/ai/insights`, Sidebar: AI Insights menu item |
| `ai.regenerate` | Generate Insights | `ai.insights` | UI: Regenerate button in AIInsights.js |
| `ai.chat` | Use AI Chat | - | Routes: `/ai/chat`, `/ai/intelligence`, Sidebar: AI Chat menu item |

### Reviews

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `reviews.view` | View Reviews | - | Route: `/reviews`, Sidebar: Reviews menu (currently commented out) |

### Billing

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `billing.view` | View Billing | - | Route: `/account/billing`, Sidebar: Billing menu item |
| `billing.manage` | Manage Billing | `billing.view` | UI: Upgrade/Manage subscription buttons in BillingTab.js |
| `venue.create` | Create Venues | `billing.manage` | UI: Create Venue form in VenueSettings.js (multi-venue mode) |

### Multi-Venue

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `multivenue.view` | View All Venues | - | Routes: `/multi-venue/*`, Sidebar: Multi-Venue Dashboard and Reporting menu items |

### Venue Groups

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `venuegroups.view` | View Venue Groups | - | UI: View venue groups (read-only) |
| `venuegroups.edit` | Manage Venue Groups | `venuegroups.view` | Route: `/admin/venue-groups` |

### Menu

| Code | Name | Requires | Gatekeeps |
|------|------|----------|-----------|
| `menu.edit` | Edit Menu | - | Route: `/venue-settings/menu-builder` |

---

## Permission Dependencies

When a permission has a dependency (`requiresBase`), the base permission must be enabled for the child permission to work. When a base permission is disabled, all child permissions are automatically disabled.

```
feedback.view
├── feedback.respond
├── feedback.export
└── feedback.settings

questions.view
└── questions.edit

reports.view
├── reports.export
└── reports.create

nps.view
├── nps.insights
├── nps.edit
└── nps.export

staff.view
├── staff.edit
├── staff.leaderboard
├── staff.recognition
├── staff.roles
└── staff.locations

managers.view
├── managers.invite
├── managers.venues
├── managers.remove
└── managers.permissions

qr.view
└── qr.generate

floorplan.view
└── floorplan.edit

ai.insights
└── ai.regenerate

billing.view
└── billing.manage
    └── venue.create

venuegroups.view
└── venuegroups.edit
```

---

## Role Templates

### System Templates

These are predefined templates that cannot be modified:

#### Viewer
Read-only access to feedback and reports.
- `feedback.view`, `questions.view`, `reports.view`, `nps.view`
- `staff.view`, `staff.leaderboard`, `managers.view`
- `venue.view`, `floorplan.view`
- `qr.view`, `ai.insights`, `reviews.view`, `multivenue.view`

#### Editor
Can respond to feedback and manage staff.
- Everything in Viewer, plus:
- `feedback.respond`, `feedback.export`
- `reports.export`
- `staff.edit`, `staff.recognition`
- `qr.generate`, `ai.chat`

#### Manager
Full venue management except permissions.
- Everything in Editor, plus:
- `feedback.settings`, `questions.edit`, `reports.create`
- `nps.insights`, `nps.edit`, `nps.export`
- `staff.roles`, `staff.locations`
- `managers.invite`, `managers.venues`, `managers.remove`
- `venue.edit`, `venue.branding`, `venue.integrations`
- `floorplan.edit`, `ai.regenerate`, `menu.edit`

#### Admin
Full access including user management.
- All permissions including `managers.permissions`, `billing.*`, `venuegroups.*`, `venue.create`

### Custom Templates

Account owners (master users) can create custom role templates specific to their account. These appear in the "Custom Templates" section when assigning permissions.

---

## Database Schema

### Tables

```sql
-- All available permissions
permissions (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,      -- e.g., 'feedback.view'
  name TEXT NOT NULL,              -- Human-readable name
  description TEXT,                -- What this permission allows
  category TEXT NOT NULL           -- Grouping: 'feedback', 'staff', etc.
)

-- Predefined permission sets
role_templates (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,       -- e.g., 'viewer', 'manager'
  name TEXT NOT NULL,              -- Display name
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- System templates can't be deleted
  account_id UUID                  -- NULL = system, set = custom template
)

-- Links templates to permissions
role_template_permissions (
  id UUID PRIMARY KEY,
  role_template_id UUID NOT NULL,
  permission_id UUID NOT NULL
)

-- User permission assignments
user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  role_template_id UUID,           -- Use a template OR...
  custom_permissions TEXT[],       -- ...individual permissions
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

---

## Frontend Implementation

### PermissionsContext

The `PermissionsContext` provides permission checking throughout the app:

```javascript
import { usePermissions } from '../context/PermissionsContext';

const MyComponent = () => {
  const {
    permissions,           // Array of permission codes
    roleTemplate,          // { code, name } of current template
    hasPermission,         // (code) => boolean
    hasAnyPermission,      // (codes[]) => boolean
    hasAllPermissions,     // (codes[]) => boolean
    canAccess,             // (feature) => boolean
    loading,
    refetch
  } = usePermissions();

  if (hasPermission('feedback.delete')) {
    // Show delete button
  }
};
```

### PermissionGate Component

Use `PermissionGate` to conditionally render based on permissions:

```jsx
import { PermissionGate } from '../context/PermissionsContext';

// Single permission
<PermissionGate permission="feedback.respond">
  <ReplyButton />
</PermissionGate>

// Multiple permissions (any)
<PermissionGate permissions={['feedback.view', 'feedback.respond']}>
  <FeedbackSection />
</PermissionGate>

// Multiple permissions (all required)
<PermissionGate permissions={['feedback.view', 'feedback.respond']} mode="all">
  <RespondForm />
</PermissionGate>

// With fallback
<PermissionGate permission="billing.view" fallback={<UpgradePrompt />}>
  <BillingDashboard />
</PermissionGate>
```

### Route Protection

Routes are protected in `DashboardRoutes.js` using the `ProtectedRoute` component:

```jsx
<Route path="/feedback/all" element={
  <ProtectedRoute permission="feedback.view">
    <AllFeedback />
  </ProtectedRoute>
} />
```

### Sidebar Filtering

The sidebar automatically filters navigation items based on permissions. Each nav item has a `permission` field:

```javascript
const venueNavItems = [
  { id: 'overview', label: 'Overview', path: '/dashboard' },  // No permission = always visible
  { id: 'feedback', label: 'Feedback', path: '/feedback/all', permission: 'feedback.view' },
  { id: 'staff', label: 'Staff', path: '/staff/leaderboard', permission: 'staff.leaderboard',
    subItems: [
      { label: 'Leaderboard', path: '/staff/leaderboard', permission: 'staff.leaderboard' },
      { label: 'Employees', path: '/staff/employees', permission: 'staff.view' },
      { label: 'Roles', path: '/staff/roles', permission: 'staff.roles' },
      { label: 'Locations', path: '/staff/locations', permission: 'staff.locations' },
    ]
  },
];
```

---

## Managing Permissions

### For Master Users

1. Go to **Staff > Managers**
2. Click on a manager to view/edit their permissions
3. Go to the **Permissions** tab
4. Choose a role template OR toggle individual permissions
5. Click **Save Permissions**

### Creating Custom Templates

1. Go to **Administration > Permissions > Role Templates**
2. Click **Create Template**
3. Enter a name and description
4. Select the permissions to include
5. Click **Save**

---

## Default Behavior

- **No permissions assigned**: Managers default to the `viewer` role template
- **Master/Admin users**: Always have full access (bypass permission checks)
- **New managers**: Start with viewer permissions until explicitly changed

---

## Migrations

The permissions system was created in:
- `20251203000000_create_permissions_system.sql` - Initial schema and data
- `20251203000001_remove_venue_specific_permissions.sql` - Removed venue-specific permissions (now account-wide only)
- `20260107000000_add_managers_venues_permission.sql` - Added `managers.venues` permission and RLS policies
- `20260107000001_update_viewer_template.sql` - Added `managers.view` to Viewer template
