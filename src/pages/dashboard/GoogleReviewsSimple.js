// /src/pages/dashboard/GoogleReviewsSimple.js
// Simplified Google Reviews page (no API quota needed)
import React, { useState, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

const GoogleReviewsSimplePage = () => {
  usePageTitle('Google Reviews');

  const { venueId, venueName } = useVenue();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (venueId) {
      checkConnection();
    }
  }, [venueId]);

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
