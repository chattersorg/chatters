// /src/pages/dashboard/GoogleReviews.js
// Main Google Reviews dashboard page
import React, { useState, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import ReviewCard from '../../components/google-reviews/ReviewCard';
import ReviewFilters from '../../components/google-reviews/ReviewFilters';
import ReviewStats from '../../components/google-reviews/ReviewStats';
import { Link } from 'react-router-dom';

const GoogleReviewsPage = () => {
  usePageTitle('Google Reviews');

  const { venueId, venueName } = useVenue();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    if (venueId) {
      checkConnectionAndPermissions();
      fetchReviews();
    }
  }, [venueId, filter]);

  const checkConnectionAndPermissions = async () => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if venue has Google connected
      const response = await fetch(`/api/google?action=status&venueId=${venueId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      setIsConnected(data.connected);

      // Check permissions if connected
      if (data.connected) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        // Managers need explicit permission
        if (userData?.role === 'manager') {
          const { data: permissions } = await supabase
            .from('venue_permissions')
            .select('can_view_google_reviews')
            .eq('venue_id', venueId)
            .single();

          setHasPermission(permissions?.can_view_google_reviews || false);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const fetchReviews = async () => {
    if (!venueId) return;

    setLoading(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        venueId,
        filter
      });

      const response = await fetch(`/api/google-reviews?action=list&${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error fetching reviews:', error);
        if (response.status === 403) {
          setHasPermission(false);
        }
        setReviews([]);
        return;
      }

      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/google-reviews?action=sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ venueId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sync complete:', data.summary);
        // Refresh reviews
        await fetchReviews();
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync reviews');
    } finally {
      setSyncing(false);
    }
  };

  // Not connected to Google
  if (!isConnected && !loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Google Reviews Not Connected</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your Google Business Profile to view and respond to reviews directly from Chatters.
          </p>
          <Link
            to="/settings?tab=Integrations"
            className="inline-flex items-center px-6 py-3 bg-custom-black text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  // No permission
  if (!hasPermission && !loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view Google reviews for this venue. Please contact your account owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Google Reviews</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{venueName}</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? 'Syncing...' : 'Sync Reviews'}
        </button>
      </div>

      {/* Stats */}
      {stats && <ReviewStats stats={stats} />}

      {/* Filters */}
      <ReviewFilters value={filter} onChange={setFilter} />

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading reviews...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'unresponded' ? 'All caught up! No reviews need a response.' : 'No reviews found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              venueId={venueId}
              onReplySuccess={fetchReviews}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleReviewsPage;
