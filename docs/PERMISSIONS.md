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

## Available Permissions

### Feedback
| Code | Name | Description |
|------|------|-------------|
| `feedback.view` | View Feedback | View customer feedback and responses |
| `feedback.respond` | Respond to Feedback | Reply to customer feedback |
| `feedback.export` | Export Feedback | Export feedback data to CSV/Excel |

### Questions
| Code | Name | Description |
|------|------|-------------|
| `questions.view` | View Questions | View feedback questions |
| `questions.edit` | Edit Questions | Create, edit, and delete feedback questions |

### Reports
| Code | Name | Description |
|------|------|-------------|
| `reports.view` | View Reports | Access reporting dashboards |
| `reports.export` | Export Reports | Export report data |
| `reports.create` | Create Custom Reports | Create and save custom reports |

### NPS
| Code | Name | Description |
|------|------|-------------|
| `nps.view` | View NPS Score | View NPS scores and submissions |
| `nps.insights` | View NPS Insights | View NPS insights and analysis |
| `nps.edit` | Edit NPS Settings | Configure NPS surveys and settings |
| `nps.export` | Export NPS | Export NPS data |

### Staff
| Code | Name | Description |
|------|------|-------------|
| `staff.view` | View Staff | View employee list and details |
| `staff.edit` | Edit Staff | Add, edit, and remove employees |
| `staff.leaderboard` | View Leaderboard | Access staff leaderboard |
| `staff.recognition` | Manage Recognition | Give and manage staff recognition |

### Managers
| Code | Name | Description |
|------|------|-------------|
| `managers.view` | View Managers | View manager list |
| `managers.invite` | Invite Managers | Invite new managers to the venue |
| `managers.remove` | Remove Managers | Remove managers from the venue |
| `managers.permissions` | Manage Permissions | Change manager permissions |

### Venue Settings
| Code | Name | Description |
|------|------|-------------|
| `venue.view` | View Venue Settings | View venue configuration |
| `venue.edit` | Edit Venue Settings | Edit venue details and settings |
| `venue.branding` | Edit Branding | Customize venue branding and colors |
| `venue.integrations` | Manage Integrations | Connect and manage third-party integrations |

### Floor Plan
| Code | Name | Description |
|------|------|-------------|
| `floorplan.view` | View Floor Plan | View the venue floor plan |
| `floorplan.edit` | Edit Floor Plan | Edit table layout and zones |

### QR Codes
| Code | Name | Description |
|------|------|-------------|
| `qr.view` | View QR Codes | View and download QR codes |
| `qr.generate` | Generate QR Codes | Generate new QR codes |

### AI Features
| Code | Name | Description |
|------|------|-------------|
| `ai.insights` | View AI Insights | Access AI-powered insights |
| `ai.chat` | Use AI Chat | Use the AI chat assistant |
| `ai.regenerate` | Regenerate AI Insights | Request new AI analysis |

### Reviews
| Code | Name | Description |
|------|------|-------------|
| `reviews.view` | View Reviews | View external reviews (Google, etc.) |
<!-- | `reviews.respond` | Respond to Reviews | Reply to external reviews | (Not yet implemented) -->

### Billing
| Code | Name | Description |
|------|------|-------------|
| `billing.view` | View Billing | View subscription and billing info |
| `billing.manage` | Manage Billing | Update payment methods and subscription |

### Multi-Venue
| Code | Name | Description |
|------|------|-------------|
| `multivenue.view` | View All Venues | Access multi-venue overview |

## Role Templates

### System Templates

These are predefined templates that cannot be modified:

#### Viewer
Read-only access to feedback and reports.
- `feedback.view`, `questions.view`, `reports.view`, `nps.view`
- `staff.view`, `staff.leaderboard`, `venue.view`, `floorplan.view`
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
- `questions.edit`, `reports.create`
- `managers.view`, `managers.invite`
- `venue.edit`, `venue.branding`, `venue.integrations`
- `floorplan.edit`, `ai.regenerate`

#### Admin
Full access including user management.
- All permissions

### Custom Templates

Account owners (master users) can create custom role templates specific to their account. These appear in the "Custom Templates" section when assigning permissions.

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
<PermissionGate permission="feedback.delete">
  <DeleteButton />
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

### withPermission HOC

For class components or wrapping entire pages:

```jsx
import { withPermission } from '../context/PermissionsContext';

const BillingPage = () => { /* ... */ };

export default withPermission('billing.view')(BillingPage);

// Multiple permissions
export default withPermission(['billing.view', 'billing.manage'], 'all')(BillingPage);
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
  { id: 'feedback', label: 'Questions', path: '/feedback/questions', permission: 'questions.view' },
  { id: 'staff', label: 'Staff', path: '/staff/leaderboard', permission: 'staff.leaderboard',
    subItems: [
      { label: 'Leaderboard', path: '/staff/leaderboard', permission: 'staff.leaderboard' },
      { label: 'Staff List', path: '/staff/list', permission: 'staff.view' },
    ]
  },
];
```

## Managing Permissions

### For Master Users

1. Go to **Administration > Permissions > Manager Access**
2. Click on a manager to view/edit their permissions
3. Choose a role template OR toggle individual permissions
4. Click **Save Permissions**

### Creating Custom Templates

1. Go to **Administration > Permissions > Role Templates**
2. Click **Create Template**
3. Enter a name and description
4. Select the permissions to include
5. Click **Save**

### Assigning Permissions via API

```javascript
// Assign a role template
await supabase
  .from('user_permissions')
  .upsert({
    user_id: managerId,
    account_id: accountId,
    role_template_id: templateId,
    custom_permissions: []
  });

// Assign custom permissions
await supabase
  .from('user_permissions')
  .upsert({
    user_id: managerId,
    account_id: accountId,
    role_template_id: null,
    custom_permissions: ['feedback.view', 'feedback.respond', 'staff.view']
  });
```

## Default Behavior

- **No permissions assigned**: Managers default to the `viewer` role template
- **Master/Admin users**: Always have full access (bypass permission checks)
- **New managers**: Start with viewer permissions until explicitly changed

## Migrations

The permissions system was created in:
- `20251203000000_create_permissions_system.sql` - Initial schema and data
- `20251203000001_remove_venue_specific_permissions.sql` - Removed venue-specific permissions (now account-wide only)
