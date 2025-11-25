// Help Articles Index
// This file maps article slugs to their components for dynamic routing

import QuickStartGuide from './QuickStartGuide';
import SettingUpFirstVenue from './SettingUpFirstVenue';
import CreatingQRCode from './CreatingQRCode';
import TestingSystem from './TestingSystem';
import QRCodeBestPractices from './QRCodeBestPractices';
import UnderstandingKioskMode from './UnderstandingKioskMode';

// Article mapping object
// Format: 'url-slug': { component: ComponentName, category: 'Category Name' }
export const articles = {
  // Getting Started
  'quick-start-guide': {
    component: QuickStartGuide,
    category: 'Getting Started',
    title: 'Quick Start Guide'
  },
  'setting-up-first-venue': {
    component: SettingUpFirstVenue,
    category: 'Getting Started',
    title: 'Setting Up Your First Venue'
  },
  'creating-qr-code': {
    component: CreatingQRCode,
    category: 'Getting Started',
    title: 'Creating Your QR Code'
  },
  'testing-system': {
    component: TestingSystem,
    category: 'Getting Started',
    title: 'Testing Your System'
  },

  // QR Codes & Setup
  'qr-code-best-practices': {
    component: QRCodeBestPractices,
    category: 'QR Codes & Setup',
    title: 'QR Code Best Practices'
  },
  'printing-qr-codes': {
    component: QRCodeBestPractices, // Placeholder
    category: 'QR Codes & Setup',
    title: 'Printing Your QR Codes'
  },
  'qr-code-troubleshooting': {
    component: QRCodeBestPractices, // Placeholder
    category: 'QR Codes & Setup',
    title: 'QR Code Not Scanning?'
  },
  'multiple-qr-codes': {
    component: QRCodeBestPractices, // Placeholder
    category: 'QR Codes & Setup',
    title: 'Multiple QR Codes for One Venue'
  },

  // Kiosk Mode
  'understanding-kiosk-mode': {
    component: UnderstandingKioskMode,
    category: 'Kiosk Mode',
    title: 'Understanding Kiosk Mode'
  },
  'setting-up-floor-plan': {
    component: UnderstandingKioskMode, // Placeholder
    category: 'Kiosk Mode',
    title: 'Setting Up Your Floor Plan'
  },
  'alert-colours-explained': {
    component: UnderstandingKioskMode, // Placeholder
    category: 'Kiosk Mode',
    title: 'Alert Colours Explained'
  },
  'staff-training-kiosk': {
    component: UnderstandingKioskMode, // Placeholder
    category: 'Kiosk Mode',
    title: 'Staff Training for Kiosk Mode'
  },

  // Assistance Requests
  'what-are-assistance-requests': {
    component: QuickStartGuide, // Placeholder
    category: 'Assistance Requests',
    title: 'What Are Assistance Requests?'
  },
  'responding-to-assistance': {
    component: QuickStartGuide, // Placeholder
    category: 'Assistance Requests',
    title: 'Responding to Assistance Requests'
  },
  'managing-high-volume': {
    component: QuickStartGuide, // Placeholder
    category: 'Assistance Requests',
    title: 'Managing High Volume Requests'
  },
  'assistance-analytics': {
    component: QuickStartGuide, // Placeholder
    category: 'Assistance Requests',
    title: 'Assistance Request Analytics'
  },

  // Customization
  'branding-feedback-forms': {
    component: QuickStartGuide, // Placeholder
    category: 'Customization',
    title: 'Branding Your Feedback Forms'
  },
  'creating-effective-questions': {
    component: QuickStartGuide, // Placeholder
    category: 'Customization',
    title: 'Creating Effective Questions'
  },
  'question-types-formats': {
    component: QuickStartGuide, // Placeholder
    category: 'Customization',
    title: 'Question Types and Formats'
  },
  'setting-feedback-hours': {
    component: QuickStartGuide, // Placeholder
    category: 'Customization',
    title: 'Setting Feedback Hours'
  },

  // Analytics & Reports
  'understanding-dashboard': {
    component: QuickStartGuide, // Placeholder
    category: 'Analytics & Reports',
    title: 'Understanding Your Dashboard'
  },
  'exporting-data': {
    component: QuickStartGuide, // Placeholder
    category: 'Analytics & Reports',
    title: 'Exporting Data'
  },
  'automated-reports': {
    component: QuickStartGuide, // Placeholder
    category: 'Analytics & Reports',
    title: 'Setting Up Automated Reports'
  },
  'trend-analysis': {
    component: QuickStartGuide, // Placeholder
    category: 'Analytics & Reports',
    title: 'Trend Analysis'
  },

  // Team Management
  'user-roles-explained': {
    component: QuickStartGuide, // Placeholder
    category: 'Team Management',
    title: 'User Roles Explained'
  },
  'adding-team-members': {
    component: QuickStartGuide, // Placeholder
    category: 'Team Management',
    title: 'Adding Team Members'
  },
  'managing-permissions': {
    component: QuickStartGuide, // Placeholder
    category: 'Team Management',
    title: 'Managing Permissions'
  },
  'removing-team-members': {
    component: QuickStartGuide, // Placeholder
    category: 'Team Management',
    title: 'Removing Team Members'
  },

  // Billing & Account
  'understanding-plans': {
    component: QuickStartGuide, // Placeholder
    category: 'Billing & Account',
    title: 'Understanding Plans'
  },
  'upgrading-plan': {
    component: QuickStartGuide, // Placeholder
    category: 'Billing & Account',
    title: 'Upgrading Your Plan'
  },
  'managing-subscription': {
    component: QuickStartGuide, // Placeholder
    category: 'Billing & Account',
    title: 'Managing Your Subscription'
  },
  'cancellation-data-export': {
    component: QuickStartGuide, // Placeholder
    category: 'Billing & Account',
    title: 'Cancellation & Data Export'
  },

  // Troubleshooting
  'common-issues': {
    component: QuickStartGuide, // Placeholder
    category: 'Troubleshooting',
    title: 'Common Issues & Solutions'
  },
  'no-feedback-appearing': {
    component: QuickStartGuide, // Placeholder
    category: 'Troubleshooting',
    title: 'No Feedback Appearing'
  },
  'kiosk-not-updating': {
    component: QuickStartGuide, // Placeholder
    category: 'Troubleshooting',
    title: 'Kiosk Mode Not Updating'
  },
  'browser-compatibility': {
    component: QuickStartGuide, // Placeholder
    category: 'Troubleshooting',
    title: 'Browser Compatibility'
  },

  // Security & Privacy
  'data-security-overview': {
    component: QuickStartGuide, // Placeholder
    category: 'Security & Privacy',
    title: 'Data Security Overview'
  },
  'gdpr-compliance': {
    component: QuickStartGuide, // Placeholder
    category: 'Security & Privacy',
    title: 'GDPR Compliance'
  },
  'user-access-security': {
    component: QuickStartGuide, // Placeholder
    category: 'Security & Privacy',
    title: 'User Access Security'
  },
  'data-retention-policy': {
    component: QuickStartGuide, // Placeholder
    category: 'Security & Privacy',
    title: 'Data Retention Policy'
  }
};

// Helper function to get article by slug
export const getArticle = (slug) => {
  return articles[slug] || null;
};

// Helper function to get all article slugs
export const getAllSlugs = () => {
  return Object.keys(articles);
};
