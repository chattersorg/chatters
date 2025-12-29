import React, { useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVenue } from '../../../context/VenueContext';
import { usePermissions } from '../../../context/PermissionsContext';
import { supabase } from '../../../utils/supabase';
import { isDevSite } from '../../../utils/domainUtils';
import ImpersonationBanner from '../../../components/ImpersonationBanner';
import {
  BarChart3,
  MessageSquare,
  Users,
  Map,
  Trophy,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Home,
  HelpCircle,
  Rss,
  UserPlus,
  CreditCard,
  Building2,
  FileText,
  QrCode,
  Table,
  LogOut,
  User,
  TrendingUp,
  Zap,
  Target,
  PieChart,
  Activity,
  Palette,
  UserCheck,
  Star,
  Award,
  MessageCircle,
  List,
  LayoutDashboard,
  Sparkles,
  Key
} from 'lucide-react';

// Venue Management Section - Single venue context
// Each item can have a 'permission' field for visibility control
// SubItems can also have individual permissions
const venueNavItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    path: '/dashboard',
    color: 'text-blue-600'
    // No permission - always visible
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    path: '/ai/insights',
    color: 'text-violet-600',
    permission: 'ai.insights',
    subItems: [
      { label: 'Weekly Insights', path: '/ai/insights', icon: Sparkles, permission: 'ai.insights' },
      { label: 'Chat', path: '/ai/chat', icon: MessageSquare, permission: 'ai.chat' }
    ]
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    path: '/feedback/all',
    color: 'text-green-600',
    permission: 'feedback.view',
    subItems: [
      { label: 'All Feedback', path: '/feedback/all', icon: List, permission: 'feedback.view' },
      { label: 'Questions', path: '/feedback/questions', icon: HelpCircle, permission: 'questions.view' },
      { label: 'Insights', path: '/feedback/insights', icon: Zap, permission: 'reports.view' },
      { label: 'Settings', path: '/settings/feedback', icon: Settings, permission: 'venue.view' }
    ]
  },
  {
    id: 'nps',
    label: 'NPS',
    icon: Star,
    path: '/nps/score',
    color: 'text-amber-600',
    permission: 'nps.view',
    subItems: [
      { label: 'Score', path: '/nps/score', icon: Star, permission: 'nps.view' },
      { label: 'Insights', path: '/nps/insights', icon: TrendingUp, permission: 'nps.view' },
      { label: 'Settings', path: '/nps/settings', icon: Settings, permission: 'nps.edit' }
    ]
  },
  // Reviews BETA - hidden for now
  // {
  //   id: 'reviews',
  //   label: 'Reviews',
  //   icon: MessageCircle,
  //   path: '/reviews',
  //   color: 'text-yellow-600',
  //   badge: 'BETA',
  //   permission: 'reviews.view'
  // },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    path: '/reports/performance',
    color: 'text-purple-600',
    permission: 'reports.view',
    subItems: [
      { label: 'Performance', path: '/reports/performance', icon: TrendingUp, permission: 'reports.view' },
      { label: 'Metrics', path: '/reports/metrics', icon: PieChart, permission: 'reports.view' },
      { label: 'Custom', path: '/reports/builder', icon: FileText, permission: 'reports.create' }
    ]
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: Users,
    path: '/staff/leaderboard',
    color: 'text-orange-600',
    permission: 'staff.leaderboard',
    subItems: [
      { label: 'Leaderboard', path: '/staff/leaderboard', icon: Trophy, permission: 'staff.leaderboard' },
      { label: 'Recognition', path: '/staff/recognition', icon: Award, permission: 'staff.recognition' },
      { label: 'Team', path: '/staff/team', icon: Users, permission: 'staff.view' },
      { label: 'Roles', path: '/staff/roles', icon: UserCheck, permission: 'staff.edit' },
      { label: 'Locations', path: '/staff/locations', icon: Map, permission: 'staff.edit' }
    ]
  },
  {
    id: 'floorplan',
    label: 'Floor Plan',
    icon: Map,
    path: '/floorplan',
    color: 'text-indigo-600',
    permission: 'floorplan.view'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings/venue',
    color: 'text-gray-600',
    permission: 'venue.view',
    subItems: [
      { label: 'Venue', path: '/settings/venue', icon: Building2, permission: 'venue.view' },
      { label: 'Branding', path: '/settings/branding', icon: Palette, permission: 'venue.branding' },
      { label: 'QR Code', path: '/settings/qr-code', icon: QrCode, permission: 'qr.view' },
      { label: 'Integrations', path: '/settings/integrations', icon: Activity, permission: 'venue.integrations' }
    ]
  }
];

// Multi-Venue Section - Cross-venue analysis
const multiVenueNavItems = [
  {
    id: 'venues-management',
    label: 'Venues',
    icon: Building2,
    path: '/multi-venue/venues',
    color: 'text-indigo-600',
    permission: 'venue.view'
  },
  {
    id: 'multi-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/multi-venue/dashboard',
    color: 'text-blue-600',
    permission: 'multivenue.view'
  },
  {
    id: 'multi-reporting',
    label: 'Reporting',
    icon: BarChart3,
    path: '/multi-venue/reporting',
    color: 'text-purple-600',
    permission: 'multivenue.view'
    // Removed subItems - these paths were duplicates of venue section items
    // which caused sidebar flickering when navigating
  }
];

// Administration Section - Master-only for account-wide management
const adminNavItems = [
  {
    id: 'permission-templates',
    label: 'Permission Templates',
    icon: Key,
    path: '/admin/permissions/templates',
    color: 'text-rose-600'
  }
];

// Account settings items for bottom section
const getAccountItems = (userRole, trialInfo, hasBillingPermission) => {
  const items = [
    { label: 'Profile', path: '/account/profile', icon: User }
  ];

  // Show billing for master users, users with billing.view permission, OR if trial is expired
  if (userRole === 'master' || hasBillingPermission || trialInfo?.isExpired) {
    items.push({ label: 'Billing', path: '/account/billing', icon: CreditCard });
  }

  return items;
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    venueId,
    venueName,
    allVenues,
    setCurrentVenue,
    userRole
  } = useVenue();
  const { hasPermission } = usePermissions();

  // Check if user has billing permission
  const hasBillingPermission = hasPermission('billing.view');

  // Helper to check if item should be visible based on permission
  // Master users see everything, otherwise check permission
  const canSeeItem = useCallback((item) => {
    if (userRole === 'master') return true;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  }, [userRole, hasPermission]);

  // Helper to resolve path - handles both static paths and dynamic path functions
  const resolvePath = useCallback((path) => {
    if (typeof path === 'function') {
      return path(venueId);
    }
    return path;
  }, [venueId]);

  // Filter nav items based on permissions - memoized to prevent unnecessary re-renders
  const filterNavItems = useCallback((items) => {
    return items
      .filter(item => canSeeItem(item))
      .map(item => {
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(subItem => canSeeItem(subItem));
          // If no sub-items are visible, hide the parent too
          if (filteredSubItems.length === 0) return null;
          return { ...item, subItems: filteredSubItems };
        }
        return item;
      })
      .filter(Boolean);
  }, [canSeeItem]);

  // Get filtered nav items - memoized
  const filteredVenueNavItems = useMemo(() => filterNavItems(venueNavItems), [filterNavItems]);
  const filteredMultiVenueNavItems = useMemo(() => filterNavItems(multiVenueNavItems), [filterNavItems]);

  // Get account items based on user role, trial status, and permissions
  const accountItems = getAccountItems(userRole, trialInfo, hasBillingPermission);

  // Determine if user has access to multiple venues
  const hasMultipleVenues = allVenues.length > 1;

  const isActive = useCallback((path, exactMatch = false) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  const hasActiveSubitem = useCallback((subItems) => {
    return subItems?.some(subItem => {
      const resolvedSubPath = typeof subItem.path === 'function' ? subItem.path(venueId) : subItem.path;
      return location.pathname === resolvedSubPath || location.pathname.startsWith(resolvedSubPath + '/');
    });
  }, [location.pathname, venueId]);

  // Fetch trial information for billing access control
  React.useEffect(() => {
    const fetchTrialInfo = async () => {
      if (userRole !== 'master' && userRole !== 'manager') return;
      
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (!userId) return;

        // Get user account info
        const { data: userRow } = await supabase
          .from('users')
          .select('account_id, role')
          .eq('id', userId)
          .single();

        if (!userRow) return;

        // For managers, get account_id through their venue
        let accountIdToCheck = userRow.account_id;
        if (userRow.role === 'manager' && !accountIdToCheck) {
          const { data: staffRow } = await supabase
            .from('staff')
            .select('venues!inner(account_id)')
            .eq('user_id', userId)
            .limit(1)
            .single();
            
          accountIdToCheck = staffRow?.venues?.account_id;
        }

        if (!accountIdToCheck) return;

        // Fetch account trial/subscription info
        const { data: accountData } = await supabase
          .from('accounts')
          .select('trial_ends_at, is_paid')
          .eq('id', accountIdToCheck)
          .single();

        if (accountData) {
          const trialEndsAt = accountData.trial_ends_at ? new Date(accountData.trial_ends_at) : null;
          const now = new Date();
          const isExpired = trialEndsAt && now > trialEndsAt && !accountData.is_paid;
          const isActive = trialEndsAt && now <= trialEndsAt && !accountData.is_paid;
          
          setTrialInfo({
            isExpired,
            isActive,
            trialEndsAt
          });
        }
      } catch (error) {
        console.error('Error fetching trial info:', error);
      }
    };

    fetchTrialInfo();
  }, [userRole]);

  // Auto-open/close submenu based on current route
  React.useEffect(() => {
    if (collapsed) return; // Don't auto-manage submenus when collapsed

    const allNavItems = [
      ...filteredVenueNavItems,
      ...(hasMultipleVenues ? filteredMultiVenueNavItems : []),
      ...(userRole === 'master' ? adminNavItems : [])
    ];
    const currentItem = allNavItems.find(item =>
      item.subItems && item.subItems.some(subItem =>
        location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
      )
    );
    if (currentItem) {
      setActiveSubmenu(currentItem.id);
    }
    // Note: We intentionally don't close the submenu when navigating to a non-submenu route
    // to prevent annoying auto-closing behavior when users want to keep a menu open
  }, [location.pathname, collapsed, hasMultipleVenues, userRole, filteredVenueNavItems, filteredMultiVenueNavItems]);

  const toggleSubmenu = (itemId) => {
    if (collapsed) {
      setCollapsed(false);
      setActiveSubmenu(itemId);
    } else {
      setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('chatters_remember_email');
    localStorage.removeItem('chatters_remember_me');
    localStorage.removeItem('impersonation');
    localStorage.removeItem('chatters_currentVenueId');
    sessionStorage.removeItem('chatters_temp_session');
    navigate('/signin');
  };

  // Close sidebar on mobile when clicking a link
  const handleMobileLinkClick = () => {
    if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${
          collapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-16'
            : 'translate-x-0 w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <div className="flex flex-col gap-1">
              <>
                  <img
                    src="/img/logo/chatters-logo-black-2025.svg"
                    alt="Chatters"
                    className="h-6 w-auto block dark:hidden"
                  />
                  <img
                    src="/img/logo/chatters-logo-white-2025.svg"
                    alt="Chatters"
                    className="h-6 w-auto hidden dark:block"
                  />
                </>
              <ImpersonationBanner />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Venue Dropdown */}
        {!collapsed && (
          <div className="px-3 pt-4 pb-2">
            {hasMultipleVenues ? (
              <div className="relative">
                <button
                  onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{venueName}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0 transition-transform ${venueDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {venueDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {allVenues.map((venue) => (
                      <button
                        key={venue.id}
                        onClick={() => {
                          setCurrentVenue(venue.id);
                          setVenueDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          venue.id === venueId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="truncate">{venue.name}</span>
                        {venue.id === venueId && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{venueName}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="mt-2 px-2 flex-1 overflow-y-auto custom-scrollbar">
          {/* Render Venue Management Section */}
          {filteredVenueNavItems.map((item) => {
            const Icon = item.icon;
            const resolvedPath = resolvePath(item.path);
            const itemActive = isActive(resolvedPath) || hasActiveSubitem(item.subItems);
            const showSubmenu = !collapsed && activeSubmenu === item.id && item.subItems;

            return (
              <div key={item.id} className="mb-1">
                {/* Main Nav Item */}
                {item.subItems ? (
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                      itemActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${itemActive ? item.color : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                      {!collapsed && (
                        <span className="ml-3 font-medium text-sm">{item.label}</span>
                      )}
                    </div>
                    {!collapsed && item.subItems && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showSubmenu ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    to={resolvedPath}
                    onClick={handleMobileLinkClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                      itemActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${itemActive ? item.color : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                      {!collapsed && (
                        <span className="ml-3 font-medium text-sm">{item.label}</span>
                      )}
                    </div>
                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded uppercase tracking-wide">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}

                {/* Submenu Items */}
                {showSubmenu && (
                  <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                    {item.subItems.map((subItem, idx) => {
                      const SubIcon = subItem.icon;
                      const resolvedSubPath = resolvePath(subItem.path);
                      // Check if any sibling path starts with this path - if so, use exact match
                      const hasSiblingPrefix = item.subItems.some((other, otherIdx) => {
                        const otherPath = resolvePath(other.path);
                        return otherIdx !== idx && typeof otherPath === 'string' && typeof resolvedSubPath === 'string' && otherPath.startsWith(resolvedSubPath + '/');
                      });
                      const subItemActive = hasSiblingPrefix
                        ? isActive(resolvedSubPath, true)
                        : isActive(resolvedSubPath);
                      return (
                        <Link
                          key={resolvedSubPath}
                          to={resolvedSubPath}
                          onClick={handleMobileLinkClick}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors group ${
                            subItemActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <SubIcon className="w-4 h-4 mr-2" />
                            {subItem.label}
                          </div>
                          {subItem.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded uppercase tracking-wide">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Multi-Venue Section Divider */}
          {hasMultipleVenues && filteredMultiVenueNavItems.length > 0 && !collapsed && (
            <div className="my-4 px-3">
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Multi Venue
                </p>
              </div>
            </div>
          )}

          {/* Render Multi-Venue Section */}
          {hasMultipleVenues && filteredMultiVenueNavItems.map((item) => {
            const Icon = item.icon;
            const itemActive = isActive(item.path) || hasActiveSubitem(item.subItems);
            const showSubmenu = !collapsed && activeSubmenu === item.id && item.subItems;

            return (
              <div key={item.id} className="mb-1">
                {/* Main Nav Item */}
                {item.subItems ? (
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                      itemActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${itemActive ? item.color : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                      {!collapsed && (
                        <span className="ml-3 font-medium text-sm">{item.label}</span>
                      )}
                    </div>
                    {!collapsed && item.subItems && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showSubmenu ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={handleMobileLinkClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                      itemActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${itemActive ? item.color : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                      {!collapsed && (
                        <span className="ml-3 font-medium text-sm">{item.label}</span>
                      )}
                    </div>
                  </Link>
                )}

                {/* Submenu Items */}
                {showSubmenu && (
                  <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                    {item.subItems.map((subItem, idx) => {
                      const SubIcon = subItem.icon;
                      // Check if any sibling path starts with this path - if so, use exact match
                      const hasSiblingPrefix = item.subItems.some((other, otherIdx) =>
                        otherIdx !== idx && other.path.startsWith(subItem.path + '/')
                      );
                      const subItemActive = hasSiblingPrefix
                        ? isActive(subItem.path, true)
                        : isActive(subItem.path);
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={handleMobileLinkClick}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors group ${
                            subItemActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <SubIcon className="w-4 h-4 mr-2" />
                            {subItem.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Administration Section - Master only */}
          {userRole === 'master' && !collapsed && (
            <div className="my-4 px-3">
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Administration
                </p>
              </div>
            </div>
          )}

          {/* Render Administration Section */}
          {userRole === 'master' && adminNavItems.map((item) => {
            const Icon = item.icon;
            const itemActive = isActive(item.path) || hasActiveSubitem(item.subItems);
            const showSubmenu = !collapsed && activeSubmenu === item.id && item.subItems;

            return (
              <div key={item.id} className="mb-1">
                {/* Main Nav Item */}
                {item.subItems ? (
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                      itemActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${itemActive ? item.color : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                      {!collapsed && (
                        <span className="ml-3 font-medium text-sm">{item.label}</span>
                      )}
                    </div>
                    {!collapsed && item.subItems && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showSubmenu ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={handleMobileLinkClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                      itemActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${itemActive ? item.color : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                      {!collapsed && (
                        <span className="ml-3 font-medium text-sm">{item.label}</span>
                      )}
                    </div>
                  </Link>
                )}

                {/* Submenu Items */}
                {showSubmenu && (
                  <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                    {item.subItems.map((subItem, idx) => {
                      const SubIcon = subItem.icon;
                      // Check if any sibling path starts with this path - if so, use exact match
                      const hasSiblingPrefix = item.subItems.some((other, otherIdx) =>
                        otherIdx !== idx && other.path.startsWith(subItem.path + '/')
                      );
                      const subItemActive = hasSiblingPrefix
                        ? isActive(subItem.path, true)
                        : isActive(subItem.path);
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={handleMobileLinkClick}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors group ${
                            subItemActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <SubIcon className="w-4 h-4 mr-2" />
                            {subItem.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Account Actions - Bottom of Sidebar */}
        <div className="mt-auto p-2 border-t border-gray-200 dark:border-gray-800">
          {/* Account Settings Section */}
          {!collapsed && (
            <div className="mb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Account Settings
              </p>
              <div className="space-y-1">
                {accountItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                        isActive(item.path)
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <ItemIcon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsed Account Links */}
          {collapsed && (
            <div className="space-y-1 mb-2">
              {accountItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${
                      isActive(item.path)
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    title={item.label}
                  >
                    <ItemIcon className={`w-5 h-5 ${isActive(item.path) ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            title={collapsed ? 'Sign Out' : ''}
          >
            <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
            {!collapsed && (
              <span className="ml-3 font-medium text-sm">Sign Out</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
};

export default Sidebar;