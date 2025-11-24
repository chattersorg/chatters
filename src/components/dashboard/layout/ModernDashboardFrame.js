import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVenue } from '../../../context/VenueContext';
import { supabase } from '../../../utils/supabase';
import Sidebar from './Sidebar';
import ModernHeader from './ModernHeader';
import { FiClock, FiZap } from 'react-icons/fi';
import { Button } from '../../ui/button';

const ModernDashboardFrame = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useVenue();

  useEffect(() => {
    const loadUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      const userId = userData?.user?.id;
      
      if (!email) return navigate('/signin');
      
      const { data: user } = await supabase
        .from('users')
        .select('email, role, account_id')
        .eq('id', userId)
        .single();
      
      if (!user) return navigate('/signin');
      
      setUserInfo(user);

      // Only fetch trial info for master users
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

  // Handle responsive sidebar - start collapsed on mobile
  useEffect(() => {
    const handleResize = () => {
      // On mobile, always start collapsed
      // On desktop, use saved preference or default to expanded
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect expired trials
  const isOnBillingRoute = location.pathname === '/settings/billing' || location.pathname.startsWith('/settings/billing');
  
  useEffect(() => {
    if (trialInfo?.isExpired && !isOnBillingRoute) {
      navigate('/settings/billing');
    }
  }, [trialInfo?.isExpired, isOnBillingRoute, navigate]);

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Header */}
      <ModernHeader
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        trialInfo={trialInfo}
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } mt-16`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ModernDashboardFrame;