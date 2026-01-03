// Shared permissions configuration used across the app
// This is the single source of truth for permission display

import {
  MessageSquare,
  Edit2,
  BarChart3,
  Star,
  Users,
  Shield,
  Settings,
  Map,
  Sparkles,
  CreditCard,
  Building2
} from 'lucide-react';

// Permission sections with descriptions - used for Role Templates and Manager Detail pages
export const permissionSections = [
  {
    title: 'Feedback',
    category: 'feedback',
    icon: MessageSquare,
    permissions: [
      { code: 'feedback.view', label: 'View Feedback', description: 'Access the feedback feed to view all customer feedback submissions and responses from your team.' },
      { code: 'feedback.respond', label: 'Respond to Feedback', description: 'Send replies directly to customers who have left feedback, allowing you to address concerns or thank them.', requiresBase: 'feedback.view' },
      { code: 'feedback.export', label: 'Export Feedback', description: 'Download feedback data as CSV or Excel files for offline analysis or reporting purposes.', requiresBase: 'feedback.view' },
      { code: 'feedback.settings', label: 'Edit Feedback Settings', description: 'Modify feedback questions, set feedback availability hours, customise thank you messages, and configure review prompts.', requiresBase: 'feedback.view' }
    ]
  },
  {
    title: 'Reports',
    category: 'reports',
    icon: BarChart3,
    permissions: [
      { code: 'reports.view', label: 'View Reports', description: 'Access reporting dashboards showing feedback trends, ratings over time, and performance metrics.' },
      { code: 'reports.export', label: 'Export Reports', description: 'Download report data and charts as CSV, Excel, or PDF files for sharing or presentations.', requiresBase: 'reports.view' },
      { code: 'reports.create', label: 'Create Custom Reports', description: 'Build and save custom report configurations with specific date ranges, filters, and metrics.', requiresBase: 'reports.view' }
    ]
  },
  {
    title: 'NPS',
    category: 'nps',
    icon: Star,
    permissions: [
      { code: 'nps.view', label: 'View NPS Score', description: 'Access the NPS score page showing your Net Promoter Score, response breakdown, and submission history.' },
      { code: 'nps.insights', label: 'View NPS Insights', description: 'Access AI-powered analysis of your NPS data, including trends, sentiment analysis, and recommendations.' },
      { code: 'nps.edit', label: 'Edit NPS Settings', description: 'Configure NPS survey settings, enable or disable NPS collection, and customise the survey questions.' },
      { code: 'nps.export', label: 'Export NPS Data', description: 'Download NPS responses and scores as CSV or Excel files for external analysis or record-keeping.' }
    ]
  },
  {
    title: 'Staff',
    category: 'staff',
    icon: Users,
    permissions: [
      { code: 'staff.view', label: 'View Staff', description: 'View the list of staff members, their details, and which roles or locations they are assigned to.' },
      { code: 'staff.edit', label: 'Edit Staff', description: 'Add new staff members, update their information, assign roles and locations, or remove them from the system.', requiresBase: 'staff.view' },
      { code: 'staff.leaderboard', label: 'View Leaderboard', description: 'Access the staff leaderboard showing performance rankings based on customer feedback and recognition.' },
      { code: 'staff.recognition', label: 'Manage Recognition', description: 'Give recognition to staff members and view the recognition history for your team.' }
    ]
  },
  {
    title: 'Managers',
    category: 'managers',
    icon: Shield,
    permissions: [
      { code: 'managers.view', label: 'View Managers', description: 'View the list of managers who have access to this venue and their current permission levels.' },
      { code: 'managers.invite', label: 'Invite Managers', description: 'Send invitations to new managers, granting them access to the venue dashboard with specified permissions.', requiresBase: 'managers.view' },
      { code: 'managers.remove', label: 'Remove Managers', description: 'Revoke access for managers, removing their ability to view or manage this venue.', requiresBase: 'managers.view' },
      { code: 'managers.permissions', label: 'Manage Permissions', description: 'Change the permission levels of other managers, controlling what they can view and do within the dashboard.', requiresBase: 'managers.view' }
    ]
  },
  {
    title: 'Venue Settings',
    category: 'venue',
    icon: Settings,
    permissions: [
      { code: 'venue.edit', label: 'Edit Venue Settings', description: 'Modify venue details such as name, address, opening hours, contact information, and general settings.' },
      { code: 'venue.branding', label: 'Edit Branding', description: 'Customise the venue branding including logo, colours, and styling that appears on customer-facing pages.' },
      { code: 'venue.integrations', label: 'Manage Integrations', description: 'Connect and configure the venue\'s third-party integrations.' },
      { code: 'qr.view', label: 'View QR Code & URL', description: 'View and download the venue QR code and feedback URL for sharing with customers.' }
    ]
  },
  {
    title: 'Floor Plan',
    category: 'floorplan',
    icon: Map,
    permissions: [
      { code: 'floorplan.view', label: 'View Floor Plan', description: 'View the venue floor plan showing table positions, zones, and the current layout configuration.' },
      { code: 'floorplan.edit', label: 'Edit Floor Plan', description: 'Modify the floor plan by adding, moving, or removing tables and defining zones within the venue.', requiresBase: 'floorplan.view' }
    ]
  },
  {
    title: 'AI Features',
    category: 'ai',
    icon: Sparkles,
    permissions: [
      { code: 'ai.insights', label: 'View Weekly Insights', description: 'Access the weekly AI-generated insights summarising your feedback data, trends, and areas for improvement.' },
      { code: 'ai.regenerate', label: 'Generate Insights', description: 'Request fresh AI analysis of your data, useful after significant changes or to get updated recommendations.', requiresBase: 'ai.insights' },
      { code: 'ai.chat', label: 'Use AI Chat', description: 'Interact with the AI assistant to ask questions about your feedback data and get instant analysis.' }
    ]
  },
  {
    title: 'Reviews',
    category: 'reviews',
    icon: Star,
    permissions: [
      { code: 'reviews.view', label: 'View Reviews', description: 'View external reviews from platforms like Google and TripAdvisor, aggregated in one place.' }
    ]
  },
  {
    title: 'Billing',
    category: 'billing',
    icon: CreditCard,
    permissions: [
      { code: 'billing.view', label: 'View Billing', description: 'View subscription details, invoices, and payment history for the account.' },
      { code: 'billing.manage', label: 'Manage Billing', description: 'Update payment methods, change subscription plans, and manage billing settings.' }
    ]
  },
  {
    title: 'Multi-Venue',
    category: 'multivenue',
    icon: Building2,
    permissions: [
      { code: 'multivenue.view', label: 'View All Venues', description: 'Access the multi-venue overview showing performance comparisons and aggregated data across all venues.' }
    ]
  },
  {
    title: 'Menu',
    category: 'menu',
    icon: Edit2,
    permissions: [
      { code: 'menu.edit', label: 'Edit Menu', description: 'Access the menu builder to add, modify, or remove menu items, update prices, and manage categories.' }
    ]
  }
];

// Helper to get all permission codes as a flat array
export const getAllPermissionCodes = () => {
  return permissionSections.flatMap(section => section.permissions.map(p => p.code));
};

// Helper to get permission info by code
export const getPermissionInfo = (code) => {
  for (const section of permissionSections) {
    const perm = section.permissions.find(p => p.code === code);
    if (perm) {
      return { ...perm, category: section.category, categoryTitle: section.title };
    }
  }
  return null;
};

// Helper to get section by category
export const getSectionByCategory = (category) => {
  return permissionSections.find(s => s.category === category);
};
