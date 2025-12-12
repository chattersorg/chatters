// /src/pages/dashboard/GoogleReviews.js
// Main Google Reviews dashboard page
import React, { useState, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import ReviewCard from '../../components/google-reviews/ReviewCard';
import ReviewFilters from '../../components/google-reviews/ReviewFilters';
import ReviewStats from '../../components/google-reviews/ReviewStats';
import { Link } from 'react-router-dom';

// Demo mode temporarily disabled - all venues use real Google connection
// const DEMO_ACCOUNT_ID = 'af1d9502-a1a9-4873-8776-9b7177ed30c3';
// const LIVE_VENUE_IDS = ['ba9c45d4-3947-4560-9327-7f00c695d177']; // The Fox

// Demo reviews data for showcasing the feature
const generateDemoReviews = (venueName) => {
  const today = new Date();
  const daysAgo = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  return [
    {
      id: 'demo-1',
      reviewer_name: 'Sarah Mitchell',
      reviewer_profile_photo: null,
      star_rating: 5,
      review_text: 'Absolutely fantastic experience! The staff were incredibly attentive and the food was delicious. We had a table of 8 for my birthday and they made it so special. Will definitely be back!',
      review_date: daysAgo(1),
      is_replied: false,
      review_reply: null,
      reply_date: null,
    },
    {
      id: 'demo-2',
      reviewer_name: 'James Cooper',
      reviewer_profile_photo: null,
      star_rating: 2,
      review_text: 'Waited over 40 minutes for our main course. When it arrived, my steak was overcooked despite ordering medium-rare. Staff seemed overwhelmed and didn\'t check on us once. Disappointing for what should have been a nice evening out.',
      review_date: daysAgo(2),
      is_replied: false,
      review_reply: null,
      reply_date: null,
    },
    {
      id: 'demo-3',
      reviewer_name: 'Emma Thompson',
      reviewer_profile_photo: null,
      star_rating: 5,
      review_text: 'Our go-to place for Sunday lunch. The roast beef is the best in town and the Yorkshire puddings are to die for. Lovely atmosphere and friendly service every time.',
      review_date: daysAgo(3),
      is_replied: true,
      review_reply: `Thank you so much Emma! We're thrilled to hear you enjoy our Sunday roasts - it's always wonderful to see you. See you next weekend! - The ${venueName} Team`,
      reply_date: daysAgo(2),
    },
    {
      id: 'demo-4',
      reviewer_name: 'David Williams',
      reviewer_profile_photo: null,
      star_rating: 4,
      review_text: 'Really good pub with great selection of craft beers. Food was tasty and portions were generous. Only giving 4 stars because it was quite loud, but that\'s to be expected on a Friday night!',
      review_date: daysAgo(5),
      is_replied: true,
      review_reply: `Thanks for the kind words David! We're glad you enjoyed our craft beer selection. You're right that Friday nights can get lively - if you prefer something quieter, we'd recommend visiting on a weekday evening. Cheers! - The ${venueName} Team`,
      reply_date: daysAgo(4),
    },
    {
      id: 'demo-5',
      reviewer_name: 'Rachel Green',
      reviewer_profile_photo: null,
      star_rating: 1,
      review_text: 'Terrible service. We booked a table for 7pm and when we arrived they said they had no record of our booking. Had to wait 25 minutes for a table. Won\'t be returning.',
      review_date: daysAgo(4),
      is_replied: false,
      review_reply: null,
      reply_date: null,
    },
    {
      id: 'demo-6',
      reviewer_name: 'Michael Chen',
      reviewer_profile_photo: null,
      star_rating: 5,
      review_text: 'Brought my parents here for their anniversary dinner. The private dining area was perfect and the tasting menu was exceptional. Special thanks to our server Tom who made excellent wine recommendations.',
      review_date: daysAgo(7),
      is_replied: true,
      review_reply: `What a lovely way to celebrate! We're honoured you chose us for such a special occasion. We'll pass on your kind words to Tom - he'll be delighted! We hope to welcome you and your family again soon. - The ${venueName} Team`,
      reply_date: daysAgo(6),
    },
    {
      id: 'demo-7',
      reviewer_name: 'Lucy Parker',
      reviewer_profile_photo: null,
      star_rating: 3,
      review_text: 'Average experience. Food was okay but nothing special for the price. Nice decor though.',
      review_date: daysAgo(10),
      is_replied: false,
      review_reply: null,
      reply_date: null,
    },
  ];
};

const getDemoStats = () => ({
  totalReviews: 47,
  averageRating: 4.2,
  fiveStarCount: 28,
  fourStarCount: 9,
  threeStarCount: 5,
  twoStarCount: 3,
  oneStarCount: 2,
  unrespondedCount: 4,
  respondedPercentage: 91,
});

// Demo Review Card with simulated reply functionality
const DemoReviewCard = ({ review, onReplySuccess }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localReview, setLocalReview] = useState(review);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    setSubmitting(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update local state to show the reply
    setLocalReview({
      ...localReview,
      is_replied: true,
      review_reply: replyText.trim(),
      reply_date: new Date().toISOString(),
    });

    setShowReplyBox(false);
    setReplyText('');
    setSubmitting(false);
    onReplySuccess();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 dark:text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600 fill-current'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          {/* Reviewer Photo */}
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Reviewer Info */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{localReview.reviewer_name}</h4>
            <div className="flex items-center gap-3 mt-1">
              {renderStars(localReview.star_rating)}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(localReview.review_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Google Badge */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </div>
      </div>

      {/* Review Text */}
      {localReview.review_text && (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{localReview.review_text}</p>
      )}

      {/* Reply Section */}
      {localReview.is_replied ? (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Your Reply</span>
            <span className="text-xs text-blue-700 dark:text-blue-300">{formatDate(localReview.reply_date)}</span>
          </div>
          <p className="text-blue-900 dark:text-blue-100 text-sm leading-relaxed">{localReview.review_reply}</p>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {!showReplyBox ? (
            <PermissionGate permission="reviews.respond">
              <button
                onClick={() => setShowReplyBox(true)}
                className="inline-flex items-center px-4 py-2 bg-custom-black text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply to Review
              </button>
            </PermissionGate>
          ) : (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a thoughtful reply to this review..."
                maxLength={4096}
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {replyText.length} / 4096 characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowReplyBox(false);
                      setReplyText('');
                    }}
                    disabled={submitting}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={submitting || !replyText.trim()}
                    className="px-4 py-2 bg-custom-black text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoReviews, setDemoReviews] = useState([]);
  const [accountId, setAccountId] = useState(null);

  useEffect(() => {
    if (venueId) {
      checkConnectionAndPermissions();
    }
  }, [venueId]);

  useEffect(() => {
    if (venueId) {
      if (isDemoMode) {
        loadDemoReviews();
      } else {
        fetchReviews();
      }
    }
  }, [venueId, filter, isDemoMode]);

  const loadDemoReviews = () => {
    setLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      const allDemoReviews = generateDemoReviews(venueName || 'Venue');
      let filteredReviews = allDemoReviews;

      if (filter === 'unresponded') {
        filteredReviews = allDemoReviews.filter(r => !r.is_replied);
      } else if (filter === 'responded') {
        filteredReviews = allDemoReviews.filter(r => r.is_replied);
      } else if (filter === '5star') {
        filteredReviews = allDemoReviews.filter(r => r.star_rating === 5);
      } else if (filter === '4star') {
        filteredReviews = allDemoReviews.filter(r => r.star_rating === 4);
      } else if (filter === '3star') {
        filteredReviews = allDemoReviews.filter(r => r.star_rating === 3);
      } else if (filter === 'negative') {
        filteredReviews = allDemoReviews.filter(r => r.star_rating <= 2);
      }

      setDemoReviews(filteredReviews);
      setStats(getDemoStats());
      setLoading(false);
    }, 500);
  };

  const checkConnectionAndPermissions = async () => {
    setLoading(true);
    try {
      // First, fetch the venue's account_id to check if it's the demo account
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('account_id')
        .eq('id', venueId)
        .single();

      if (venueError) {
        console.error('Error fetching venue:', venueError);
        setLoading(false);
        return;
      }

      const fetchedAccountId = venueData?.account_id;
      setAccountId(fetchedAccountId);

      // Demo mode temporarily disabled - proceed to check real Google connection for all venues

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

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
    } finally {
      setLoading(false);
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
    // Demo mode - simulate sync
    if (isDemoMode) {
      setSyncing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSyncing(false);
      return;
    }

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
      ) : isDemoMode ? (
        // Demo mode - use DemoReviewCard with local state for replies
        demoReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unresponded' ? 'All caught up! No reviews need a response.' : 'No reviews found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {demoReviews.map((review) => (
              <DemoReviewCard
                key={review.id}
                review={review}
                onReplySuccess={() => {
                  // Update demo stats when a reply is sent
                  setStats(prev => prev ? {
                    ...prev,
                    unrespondedCount: Math.max(0, prev.unrespondedCount - 1),
                    respondedPercentage: Math.min(100, prev.respondedPercentage + 2)
                  } : prev);
                }}
              />
            ))}
          </div>
        )
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
