import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVenue } from '../../../context/VenueContext';
import {
  Settings,
  ExternalLink,
  BarChart3,
  MessageSquare,
  Users,
  Map,
  Home,
  Clock,
  Menu,
  Sparkles,
  Bell,
  HelpCircle
} from 'lucide-react';
import { Button } from '../../ui/button';

const mainMenuItems = [
  { id: 'overview', label: 'Overview', icon: Home, path: '/dashboard' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/questions' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'staff', label: 'Staff', icon: Users, path: '/staff' },
  { id: 'floorplan', label: 'Floor Plan', icon: Map, path: '/floorplan' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const subMenuItems = {
  feedback: [
    { label: 'Manage Questions', path: '/questions' },
    { label: 'Feedback Feed', path: '/feedbackfeed' }
  ],
  staff: [
    { label: 'Manage Staff', path: '/staff' },
    { label: 'Leaderboard', path: '/staff/leaderboard' }
  ]
};

// Canny App ID
const CANNY_APP_ID = '6783e273239ec5a91d6a6aa3';

const ModernHeader = ({ sidebarCollapsed, setSidebarCollapsed, trialInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useVenue();
  const [cannyLoaded, setCannyLoaded] = useState(false);
  const changelogButtonRef = useRef(null);

  // Load Canny SDK and initialize changelog widget
  useEffect(() => {
    // Load the Canny SDK script
    if (!window.Canny) {
      const script = document.createElement('script');
      script.src = 'https://canny.io/sdk.js';
      script.async = true;
      script.onload = () => {
        setCannyLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setCannyLoaded(true);
    }
  }, []);

  // Initialize Canny changelog when loaded
  useEffect(() => {
    if (cannyLoaded && window.Canny && changelogButtonRef.current) {
      window.Canny('initChangelog', {
        appID: CANNY_APP_ID,
        position: 'bottom',
        align: 'right',
        theme: 'light'
      });
    }
  }, [cannyLoaded]);

  const getCurrentSection = () => {
    const currentPath = location.pathname;

    // Special handling for account settings pages
    if (currentPath.startsWith('/account/')) {
      return { id: 'account', label: 'Account Settings', icon: Settings, path: '/account' };
    }

    // Multi-Venue Routes
    if (currentPath === '/multi-venue/venues') {
      return { id: 'venues-management', label: 'Venues', icon: Settings, path: '/multi-venue/venues' };
    }

    if (currentPath === '/multi-venue/overview') {
      return { id: 'portfolio-overview', label: 'Portfolio Overview', icon: BarChart3, path: '/multi-venue/overview' };
    }

    if (currentPath === '/multi-venue/dashboard') {
      return { id: 'custom-dashboard', label: 'Multi-Venue Dashboard', icon: BarChart3, path: '/multi-venue/dashboard' };
    }

    // Special handling for different path patterns
    if (currentPath.startsWith('/settings/')) {
      return mainMenuItems.find(item => item.id === 'settings') || mainMenuItems[0];
    }

    if (currentPath.startsWith('/feedback/') || currentPath === '/questions' || currentPath === '/feedbackfeed') {
      return mainMenuItems.find(item => item.id === 'feedback') || mainMenuItems[0];
    }

    if (currentPath.startsWith('/reports/') || currentPath.startsWith('/nps-report/')) {
      return mainMenuItems.find(item => item.id === 'reports') || mainMenuItems[0];
    }

    if (currentPath.startsWith('/staff/')) {
      return mainMenuItems.find(item => item.id === 'staff') || mainMenuItems[0];
    }

    if (currentPath === '/reviews') {
      return { id: 'reviews', label: 'Reviews', icon: MessageSquare, path: '/reviews' };
    }

    if (currentPath === '/ai-insights') {
      return { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, path: '/ai-insights' };
    }

    // Default path-based matching
    const currentItem = mainMenuItems.find(item =>
      currentPath === item.path || currentPath.startsWith(item.path + '/')
    );
    return currentItem || mainMenuItems[0];
  };

  const getCurrentSubItems = () => {
    const currentSection = getCurrentSection();
    return subMenuItems[currentSection.id] || [];
  };

  const getSubtitleForSection = () => {
    const currentPath = location.pathname;
    const currentSection = getCurrentSection();

    // Multi-Venue Routes
    if (currentPath === '/multi-venue/venues') {
      return 'Manage all venues';
    }

    if (currentPath === '/multi-venue/overview') {
      return 'Performance metrics across all your venues';
    }

    if (currentPath === '/multi-venue/dashboard') {
      return 'Customisable multi-venue analytics';
    }

    // Reviews
    if (currentPath === '/reviews') {
      return 'Google reviews and ratings';
    }

    // AI Insights
    if (currentPath === '/ai-insights') {
      return 'AI-powered insights from customer feedback';
    }

    // Settings subtitles
    if (currentPath.startsWith('/settings/') || currentPath.startsWith('/settings?')) {
      if (currentPath === '/settings/venues' || currentPath === '/settings?tab=Venue') return 'Manage all venues';
      if (currentPath === '/settings/venue-details') return 'Venue information and settings';
      if (currentPath === '/settings/feedback' || currentPath === '/settings?tab=Feedback') return 'Feedback configuration';
      if (currentPath === '/settings/branding' || currentPath === '/settings?tab=Branding') return 'Brand colors and logo';
      if (currentPath === '/settings/integrations' || currentPath === '/settings?tab=Integrations') return 'Third-party integrations';
      if (currentPath === '/settings/billing' || currentPath === '/settings?tab=Billing') return 'Subscription and billing';
      if (currentPath === '/settings' || currentPath === '/settings?tab=Account') return 'Profile settings';
      return 'Account configuration';
    }

    // Account Settings pages (accessed via settings dropdown)
    if (currentPath === '/account/profile') {
      return 'Profile settings';
    }
    if (currentPath === '/account/billing') {
      return 'Subscription and billing';
    }

    // Feedback subtitles
    if (currentSection.id === 'feedback') {
      if (currentPath === '/questions' || currentPath === '/feedback/questions') return 'Manage feedback questions';
      if (currentPath === '/feedbackfeed') return 'Live feedback feed';
      if (currentPath === '/feedback/qr') return 'QR code configuration';
      if (currentPath === '/feedback/all') return 'All feedback submissions';
      return 'Manage customer feedback';
    }

    // Reports subtitles
    if (currentSection.id === 'reports') {
      if (currentPath === '/reports/feedback') return 'Feedback analytics and trends';
      if (currentPath === '/reports/performance') return 'Venue performance metrics';
      if (currentPath === '/reports/impact') return 'Business impact analysis';
      if (currentPath === '/reports/insights') return 'Customer insights and patterns';
      if (currentPath === '/reports/metrics') return 'Key performance indicators';
      if (currentPath === '/reports/nps') return 'Net Promoter Score analytics';
      if (currentPath.startsWith('/nps-report/')) return 'Detailed NPS report';
      if (currentPath === '/reports/builder') return 'Custom report builder';
      return 'Analytics and insights';
    }

    // Staff subtitles
    if (currentSection.id === 'staff') {
      if (currentPath === '/staff/leaderboard') return 'Team performance rankings';
      if (currentPath === '/staff/recognition') return 'Staff recognition history';
      if (currentPath === '/staff/list') return 'Employees and managers';
      if (currentPath === '/staff/roles') return 'Role configuration';
      if (currentPath === '/staff/locations') return 'Location management';
      if (currentPath.startsWith('/staff/employees/')) return 'Employee details';
      if (currentPath.startsWith('/staff/managers/')) return 'Manager details';
      if (currentPath.startsWith('/staff-member/')) return 'Staff member details';
      return 'Team management';
    }

    // Floor Plan subtitles
    if (currentSection.id === 'floorplan') {
      return 'Venue layout and table management';
    }

    // Overview
    if (currentSection.id === 'overview') {
      return 'Your performance at a glance';
    }

    return 'Your performance at a glance';
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleOpenKiosk = () => {
    const w = window.screen?.availWidth ?? window.innerWidth;
    const h = window.screen?.availHeight ?? window.innerHeight;
    const features = `popup=yes,toolbar=0,location=0,menubar=0,scrollbars=1,status=0,resizable=1,left=0,top=0,width=${w},height=${h}`;
    const win = window.open('/kiosk', 'kioskWindow', features);
    if (!win) return;

    try {
      win.focus();
      const tryFullscreen = () => {
        const doc = win.document;
        const el = doc?.documentElement || doc?.body;
        if (!el) return;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        req?.call(el).catch(() => {});
      };
      win.addEventListener('load', tryFullscreen);
      setTimeout(() => {
        try { tryFullscreen(); } catch {}
      }, 800);
    } catch {}
  };

  const currentSection = getCurrentSection();
  const currentSubItems = getCurrentSubItems();
  const CurrentIcon = currentSection.icon;

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:left-16 left-0' : 'lg:left-64 left-0'
      }`}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Left Side - Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
              {currentSection.label}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">
              {getSubtitleForSection()}
            </p>
          </div>
        </div>

        {/* Right Side - Kiosk + Trial Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Trial Info */}
          {trialInfo && trialInfo.isActive && userRole === 'master' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <Clock className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Trial: <span className="font-semibold">{trialInfo.daysLeft}</span> day{trialInfo.daysLeft !== 1 ? 's' : ''} left
              </span>
              <button
                onClick={() => navigate('/account/billing')}
                className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Upgrade
              </button>
            </div>
          )}

          {/* Kiosk Mode Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenKiosk}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            <span>Kiosk</span>
            <ExternalLink className="w-4 h-4" />
          </Button>

          {/* What's New / Changelog Button */}
          <button
            ref={changelogButtonRef}
            data-canny-changelog
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="What's New"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default ModernHeader;