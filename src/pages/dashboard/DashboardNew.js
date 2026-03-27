import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import perfLogger from '../../utils/performanceLogger';
import OverviewStats from '../../components/dashboard/overview/OverviewStats';
import RecentActivity from '../../components/dashboard/overview/RecentActivity';
import GoogleRatingTrendCard from '../../components/dashboard/reports/GoogleRatingTrendCard';
import TripAdvisorRatingTrendCard from '../../components/dashboard/reports/TripAdvisorRatingTrendCard';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import toast from 'react-hot-toast';

const DashboardNew = () => {
  usePageTitle('Overview');
  const {
    venueId,
    venueName,
    allVenues
  } = useVenue();

  // Log page load
  useEffect(() => {
    perfLogger.start('DashboardNew:PageLoad', { venueId, venueName });
    return () => {
      perfLogger.end('DashboardNew:PageLoad');
    };
  }, []);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserName();
    if (!venueId) return;

    // Load recent activity
    loadRecentActivity();

    // Real-time subscription for assistance requests
    const subscription = supabase
      .channel(`dashboard-activity-${venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistance_requests',
          filter: `venue_id=eq.${venueId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const request = payload.new;
            toast((t) => (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    New Assistance Request
                  </div>
                  <div className="text-xs text-gray-600">
                    Table {request.table_number} needs help
                  </div>
                </div>
              </div>
            ), {
              duration: 5000,
              style: {
                background: '#FFF7ED',
                border: '1px solid #FB923C',
                color: '#EA580C'
              }
            });
          }
          loadRecentActivity();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback',
          filter: `venue_id=eq.${venueId}`
        },
        () => {
          loadRecentActivity();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [venueId]);

  const loadUserName = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) return;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError) {
        if (auth.user?.email) {
          const emailName = auth.user.email.split('@')[0];
          const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          setUserName(capitalizedName);
        }
      } else {
        if (userData.first_name) {
          setUserName(userData.first_name);
        } else if (auth.user?.email) {
          const emailName = auth.user.email.split('@')[0];
          const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          setUserName(capitalizedName);
        }
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const loadRecentActivity = async () => {
    if (!venueId) return;

    try {
      setActivityLoading(true);

      // Get recent feedback and assistance requests
      const { data: feedback } = await supabase
        .from('feedback')
        .select('id, table_number, rating, additional_feedback, created_at')
        .eq('venue_id', venueId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: assistance } = await supabase
        .from('assistance_requests')
        .select('id, table_number, created_at, acknowledged_at, resolved_at')
        .eq('venue_id', venueId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine and sort activities
      const allActivities = [
        ...(feedback || []),
        ...(assistance || [])
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRecentActivity(allActivities);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back to <span className="font-semibold text-gray-800 dark:text-gray-300">{venueName}</span>
            </p>
          </div>
        </div>

      </div>

      {/* Overview Stats - Always single venue */}
      <OverviewStats />

      {/* Platform Ratings Trends */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Ratings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GoogleRatingTrendCard venueId={venueId} />
          <TripAdvisorRatingTrendCard venueId={venueId} />
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <ChartCard
        title="Recent Activity"
        subtitle="Customer interactions from the last 24 hours"
        actions={
          <Link
            to="/feedback/all"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            View All
          </Link>
        }
      >
        <RecentActivity
          activities={recentActivity}
          loading={activityLoading}
        />
      </ChartCard>
    </div>
  );
};

export default DashboardNew;