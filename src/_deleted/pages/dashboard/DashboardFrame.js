import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVenue } from '../../context/VenueContext';
import { useLoading } from '../../context/LoadingContext';
import { useImpersonation } from '../../context/ImpersonationContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { FiSettings, FiMenu, FiX, FiClock, FiZap, FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { Building2, Check } from 'lucide-react';
import ImpersonationBanner from '../../components/ImpersonationBanner';

import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../../components/ui/popover';

const navLinks = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/questions', label: 'Feedback' },
  { to: '/reports', label: 'Reports' },
  { to: '/floorplan', label: 'Floor Plan' },
  { to: '/staff', label: 'Staff' },
  { to: '/staff/leaderboard', label: 'Leaderboard' },
];

const UpdatedDashboardFrame = ({ children }) => {
  const [switchingVenue, setSwitchingVenue] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { venueId, venueName, allVenues, setCurrentVenue, userRole } = useVenue();
  const { showLoading } = useLoading();
  const { isImpersonating } = useImpersonation();
  const [userInfo, setUserInfo] = useState(null);

  const handleNavigation = (to) => {
    if (location.pathname !== to) {
      showLoading();
      navigate(to);
    }
  };
  
  // Trial info state
  const [trialInfo, setTrialInfo] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      const userId = userData?.user?.id;
      
      if (!email) return navigate('/signin');
      
      const { data: user } = await supabase
        .from('users')
        .select('email, role, account_id')
        .eq('id', userId)  // Use the user ID instead of email
        .single();
      
      if (!user) return navigate('/signin');
      
      setUserInfo(user);

      // Only fetch trial info for master users - managers don't need to see it
      if (user.role === 'master') {
        const accountIdToCheck = user.account_id;

        if (accountIdToCheck) {
        const { data: account } = await supabase
          .from('accounts')
          .select('trial_ends_at, is_paid, demo_account')
          .eq('id', accountIdToCheck)
          .single();

        if (account?.trial_ends_at && !account.is_paid && !account.demo_account) {
          const trialEndDate = new Date(account.trial_ends_at);
          const daysLeft = Math.max(
            0,
            Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );
          
          setTrialInfo({
            endsAt: trialEndDate,
            daysLeft: daysLeft,
            isActive: daysLeft > 0,
            isExpired: daysLeft <= 0,
            isPaid: account.is_paid,
            isDemoAccount: account.demo_account || false
          });
        }
        }
      }
    };
    loadUser();
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // For expired trials, redirect to billing page
  const isOnBillingRoute = location.pathname === '/settings/billing' || location.pathname.startsWith('/settings/billing');
  
  useEffect(() => {
    if (trialInfo?.isExpired && !isOnBillingRoute) {
      navigate('/settings/billing');
    }
  }, [trialInfo?.isExpired, isOnBillingRoute, navigate]);

  const handleOpenKiosk = () => {
    // Open near-fullscreen popup window
    const w = window.screen?.availWidth ?? window.innerWidth;
    const h = window.screen?.availHeight ?? window.innerHeight;
    const features = `popup=yes,toolbar=0,location=0,menubar=0,scrollbars=1,status=0,resizable=1,left=0,top=0,width=${w},height=${h}`;
    const win = window.open('/kiosk', 'kioskWindow', features);
    if (!win) return;

    // Attempt fullscreen on the new window (best-effort)
    try {
      win.focus();
      const tryFullscreen = () => {
        const doc = win.document;
        const el = doc?.documentElement || doc?.body;
        if (!el) return;
        const req =
          el.requestFullscreen ||
          el.webkitRequestFullscreen ||
          el.mozRequestFullScreen ||
          el.msRequestFullscreen;
        req?.call(el).catch(() => {});
      };
      win.addEventListener('load', tryFullscreen);
      // Fallback attempt after a short delay
      setTimeout(() => {
        try { tryFullscreen(); } catch {}
      }, 800);
    } catch {
      // Ignore cross-window access issues; window still opened
    }
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Remove the locations link - venue management is now in Settings
  const allNavLinks = navLinks;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Trial Banner - Only show for master users */}
      {trialInfo && trialInfo.isActive && userRole === 'master' && (
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                <FiZap className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-gray-700 font-medium text-sm">
                  Trial Account
                </span>
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <FiClock className="w-3 h-3" />
                  <span>
                    <span className="font-bold">{trialInfo.daysLeft}</span> day{trialInfo.daysLeft !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate('/settings')}
              size="sm"
              className="bg-custom-black hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Top nav */}
      <header className="border-b bg-white px-4 md:px-6 py-4 flex items-center justify-between shadow-sm relative z-50">
        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-6">
          {/* Logo with impersonation badge */}
          <div className="flex flex-col gap-1">
            <img
              src="https://www.getchatters.com/img/Logo.svg"
              alt="Chatters"
              className="h-6 w-auto cursor-pointer"
              onClick={() => handleNavigation('/dashboard')}
            />
            <ImpersonationBanner />
          </div>

          {/* Desktop Nav links */}
          <nav className="hidden lg:flex gap-6">
            {allNavLinks.map((link) => {
              const isActive = location.pathname === link.to
                || (location.pathname.startsWith(link.to + '/') && link.to !== '/staff');
              return (
                <button
                  key={link.to}
                  onClick={() => handleNavigation(link.to)}
                  className={`relative text-sm transition-colors after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-black after:transition-all after:duration-300 hover:after:w-full ${
                    isActive
                      ? 'font-medium text-black after:w-full'
                      : 'font-normal text-muted-foreground hover:text-black'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Kiosk link + Venue Switcher + Avatar + Mobile Menu Button */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Open Kiosk (desktop only) — to the LEFT of the venue switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenKiosk}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-l text-gray-700 border-gray-300 bg-white hover:bg-gray-50"
            title="Kiosk Mode (opens in a new window)"
          >
            <span className="text-sm">Kiosk Mode</span>
            <FiExternalLink className="w-4 h-4" />
          </Button>

          {/* Venue Switcher - Desktop */}
          <div className="hidden sm:block">
            {userRole === 'master' || allVenues.length > 1 ? (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <div title={venueName}>
                    <Button
                      variant="outline"
                      className="w-[140px] md:w-[200px] justify-between font-medium text-gray-700 border rounded-xl shadow-sm bg-white"
                    >
                      {switchingVenue ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 border-2 border-t-transparent border-gray-500 rounded-full animate-spin flex-shrink-0" />
                          <span className="text-sm text-muted-foreground hidden md:inline truncate">Switching...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{venueName || 'Select Venue'}</span>
                        </div>
                      )}
                      <FiChevronDown className="ml-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[140px] md:w-[200px] p-2 rounded-xl shadow-md bg-white">
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                      Switch Venue
                    </div>
                  </div>
                  <div className="p-2">
                    {allVenues.map((v) => (
                      <Button
                        key={v.id}
                        variant={v.id === venueId ? 'default' : 'ghost'}
                        size="sm"
                        disabled={switchingVenue}
                        onClick={async () => {
                          if (v.id === venueId) return;
                          setSwitchingVenue(true);
                          await new Promise((res) => setTimeout(res, 500));
                          setCurrentVenue(v.id);
                          setPopoverOpen(false);
                          setSwitchingVenue(false);
                        }}
                        className={`w-full justify-between rounded-lg mb-1 ${
                          v.id === venueId ? 'bg-custom-black text-white' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium truncate">{v.name}</span>
                        </div>
                        {v.id === venueId && (
                          <Check className="w-4 h-4 text-white flex-shrink-0" />
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {userRole === 'master' && (
                    <div className="p-2 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate('/settings?tab=Venue');
                          setPopoverOpen(false);
                        }}
                        className="w-full justify-start rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        + Add New Venue
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            ) : (
              <div className="text-sm font-medium text-gray-600 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 max-w-[140px] md:max-w-[200px] truncate">
                {venueName}
              </div>
            )}
          </div>

          {/* Avatar menu (settings) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 w-12 p-0 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <FiSettings className="h-8 w-8 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border border-gray-200 bg-white shadow-md p-1 font-medium"
            >
              <DropdownMenuItem
                onClick={() => handleNavigation('/settings')}
                className="rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer"
              >
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-md px-3 py-2 text-custom-red hover:bg-red-100 hover:text-red-700 cursor-pointer"
                onClick={async () => {
                  await supabase.auth.signOut();
                    // Clear custom remember-me flags
                  localStorage.removeItem('chatters_remember_email');
                  localStorage.removeItem('chatters_remember_me');
                  sessionStorage.removeItem('chatters_temp_session');
                  navigate('/signin');
                }}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            className="lg:hidden h-12 w-12 p-0 flex items-center justify-center rounded-full hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <FiX className="h-8 w-8 text-gray-600" />
            ) : (
              <FiMenu className="h-8 w-8 text-gray-600" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto"
            style={{ 
              top: trialInfo && trialInfo.isActive && userRole === 'master' ? '120px' : '72px', // Account for trial banner + nav height
              height: trialInfo && trialInfo.isActive && userRole === 'master' ? 'calc(100vh - 120px)' : 'calc(100vh - 72px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Menu</span>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FiX className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Mobile venue switcher */}
            {(userRole === 'master' || allVenues.length > 1) && (
              <div className="p-4 border-b sm:hidden">
                <span className="text-sm font-medium text-gray-700 block mb-3">Switch Venue</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-medium text-gray-700 border rounded-xl shadow-sm bg-white"
                    >
                      {switchingVenue ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 border-2 border-t-transparent border-gray-500 rounded-full animate-spin flex-shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">Switching...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{venueName || 'Select Venue'}</span>
                        </div>
                      )}
                      <FiChevronDown className="ml-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2 rounded-xl shadow-md bg-white" side="bottom" align="start">
                    <div className="p-2 border-b border-gray-100">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                        Switch Venue
                      </div>
                    </div>
                    <div className="p-2">
                      {allVenues.map((v) => (
                        <Button
                          key={v.id}
                          variant={v.id === venueId ? 'default' : 'ghost'}
                          size="sm"
                          disabled={switchingVenue}
                          onClick={async () => {
                            if (v.id === venueId) return;
                            setSwitchingVenue(true);
                            await new Promise((res) => setTimeout(res, 500));
                            setCurrentVenue(v.id);
                            setPopoverOpen(false);
                            setSwitchingVenue(false);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full justify-between rounded-lg mb-1 ${
                            v.id === venueId ? 'bg-custom-black text-white' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{v.name}</span>
                          </div>
                          {v.id === venueId && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </Button>
                      ))}
                    </div>
                    
                    {userRole === 'master' && (
                      <div className="p-2 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigate('/settings?tab=Venue');
                            setPopoverOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        >
                          + Add New Venue
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {/* Mobile navigation links */}
            <nav className="p-4">
              <div className="space-y-2">
                {allNavLinks.filter(link => link.to !== '/floorplan').map((link) => {
                  const isActive = location.pathname === link.to
                || (location.pathname.startsWith(link.to + '/') && link.to !== '/staff');
                  return (
                    <button
                      key={link.to}
                      onClick={() => {
                        handleNavigation(link.to);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-custom-black text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </div>
              {/* Mobile settings */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleNavigation('/settings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  Account Settings
                </button>
                <button
                  className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-custom-red hover:bg-red-50 hover:text-red-700"
                  onClick={async () => {
                    await supabase.auth.signOut();
                      // Clear custom remember-me flags
                    localStorage.removeItem('chatters_remember_email');
                    localStorage.removeItem('chatters_remember_me');
                    sessionStorage.removeItem('chatters_temp_session');
                    navigate('/signin');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</main>
    </div>
  );
};

export default UpdatedDashboardFrame;