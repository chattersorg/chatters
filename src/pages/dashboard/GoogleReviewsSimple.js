// /src/pages/dashboard/GoogleReviewsSimple.js
// Simplified Google Reviews page (no API quota needed)
// Demo mode for demo account shows fake reviews with reply functionality
import React, { useState, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

// Demo account ID - shows fake Google reviews for demo purposes
const DEMO_ACCOUNT_ID = 'af1d9502-a1a9-4873-8776-9b7177ed30c3';

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
    if (!replyText.trim()) return;

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

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
      year: 'numeric'
    });
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{localReview.reviewer_name}</h4>
            <div className="flex items-center gap-3 mt-1">
              {renderStars(localReview.star_rating)}
              <span className="text-sm text-gray-500">{formatDate(localReview.review_date)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-700">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </div>
      </div>

      {localReview.review_text && (
        <p className="text-gray-700 leading-relaxed mb-4">{localReview.review_text}</p>
      )}

      {localReview.is_replied ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900">Your Reply</span>
            <span className="text-xs text-blue-700">{formatDate(localReview.reply_date)}</span>
          </div>
          <p className="text-blue-900 text-sm leading-relaxed">{localReview.review_reply}</p>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {!showReplyBox ? (
            <button
              onClick={() => setShowReplyBox(true)}
              className="inline-flex items-center px-4 py-2 bg-custom-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply to Review
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a thoughtful reply to this review..."
                maxLength={4096}
                rows={4}
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{replyText.length} / 4096 characters</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReplyBox(false); setReplyText(''); }}
                    disabled={submitting}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={submitting || !replyText.trim()}
                    className="px-4 py-2 bg-custom-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

// Review Stats Component
const ReviewStats = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-2xl font-bold text-gray-900">{stats.totalReviews}</div>
      <div className="text-sm text-gray-600">Total Reviews</div>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-2xl font-bold text-gray-900">{stats.averageRating}</div>
      <div className="text-sm text-gray-600">Average Rating</div>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-2xl font-bold text-gray-900">{stats.unrespondedCount}</div>
      <div className="text-sm text-gray-600">Need Response</div>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-2xl font-bold text-gray-900">{stats.respondedPercentage}%</div>
      <div className="text-sm text-gray-600">Response Rate</div>
    </div>
  </div>
);

// Review Filters Component
const ReviewFilters = ({ value, onChange }) => {
  const filters = [
    { id: 'all', label: 'All Reviews' },
    { id: 'unresponded', label: 'Need Response' },
    { id: 'responded', label: 'Responded' },
    { id: 'negative', label: 'Negative (1-2★)' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === filter.id
              ? 'bg-custom-black text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

const GoogleReviewsSimplePage = () => {
  usePageTitle('Google Reviews');

  const { venueId, venueName } = useVenue();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoReviews, setDemoReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (venueId) {
      checkConnection();
    }
  }, [venueId]);

  useEffect(() => {
    if (isDemoMode) {
      loadDemoReviews();
    }
  }, [isDemoMode, filter, venueName]);

  const loadDemoReviews = () => {
    const allDemoReviews = generateDemoReviews(venueName || 'Venue');
    let filteredReviews = allDemoReviews;

    if (filter === 'unresponded') {
      filteredReviews = allDemoReviews.filter(r => !r.is_replied);
    } else if (filter === 'responded') {
      filteredReviews = allDemoReviews.filter(r => r.is_replied);
    } else if (filter === 'negative') {
      filteredReviews = allDemoReviews.filter(r => r.star_rating <= 2);
    }

    setDemoReviews(filteredReviews);
    setStats(getDemoStats());
  };

  const checkConnection = async () => {
    setLoading(true);
    try {
      // First check if this is the demo account
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('account_id')
        .eq('id', venueId)
        .single();

      if (!venueError && venueData?.account_id === DEMO_ACCOUNT_ID) {
        setIsDemoMode(true);
        setIsConnected(true);
        setLoading(false);
        return;
      }

      // For non-demo accounts, check actual connection
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/google?action=status&venueId=${venueId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        setConnectionInfo(data.connection);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Google Account Not Connected</h2>
          <p className="text-gray-600 mb-6">
            Connect your Google account to manage review links and access Google Business features.
          </p>
          <Link
            to="/settings?tab=Integrations"
            className="inline-flex items-center px-6 py-3 bg-custom-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Connect Google Account
          </Link>
        </div>
      </div>
    );
  }

  // Demo mode - show full review management with fake data
  if (isDemoMode) {
    return (
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Reviews</h1>
          <p className="text-gray-600 mt-1">{venueName}</p>
        </div>

        {/* Demo Mode Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Demo Mode</h3>
              <p className="text-sm text-blue-700 mt-1">
                This is a demo account with sample reviews. In production, reviews sync from your connected Google Business Profile.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && <ReviewStats stats={stats} />}

        {/* Filters */}
        <ReviewFilters value={filter} onChange={setFilter} />

        {/* Reviews List */}
        <div className="space-y-4">
          {demoReviews.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No reviews match this filter.</p>
            </div>
          ) : (
            demoReviews.map((review) => (
              <DemoReviewCard
                key={review.id}
                review={review}
                onReplySuccess={loadDemoReviews}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Google Reviews</h1>
        <p className="text-gray-600 mt-1">{venueName}</p>
      </div>

      {/* Connection Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Google Account Connected</h3>
            <p className="text-sm text-green-700 mt-1">
              Connected as: {connectionInfo?.email}
            </p>
          </div>
        </div>
      </div>

      {/* API Access Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Google Business Profile API Access Required</h3>
            <p className="text-sm text-blue-800 mb-3">
              To view and reply to reviews directly in Chatters, you need to apply for Google Business Profile API access.
            </p>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>How to apply:</strong></p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Visit the <a href="https://support.google.com/business/contact/api_default" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google Business API Contact Form</a></li>
                <li>Select "Application for Basic API Access"</li>
                <li>Explain your use case (review management platform)</li>
                <li>Wait 5-14 days for approval</li>
              </ol>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Meanwhile:</strong> Manage your Google review request links in{' '}
                <Link to="/settings/feedback" className="underline hover:text-blue-900 font-semibold">
                  Settings → Feedback
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Links Quick Access */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Request Links</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate and manage review request links for Google and TripAdvisor
            </p>
          </div>
          <Link
            to="/settings/feedback"
            className="flex items-center gap-2 px-4 py-2 bg-custom-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Manage Links
          </Link>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Auto-generate review links from your connected Google and TripAdvisor integrations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Customise and save links to share with satisfied customers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Add links to emails, receipts, or thank-you messages to boost positive reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Coming */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon (After API Approval)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View All Reviews</h3>
              <p className="text-sm text-gray-600">See all your Google reviews in one dashboard</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reply to Reviews</h3>
              <p className="text-sm text-gray-600">Respond to reviews directly from Chatters</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Auto-Sync Reviews</h3>
              <p className="text-sm text-gray-600">Reviews sync automatically every day</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Review Analytics</h3>
              <p className="text-sm text-gray-600">Track rating trends and response rates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleReviewsSimplePage;
