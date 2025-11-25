// /src/components/dashboard/settings/GoogleBusinessConnect.jsx
import React, { useState, useEffect } from 'react';
import { useVenue } from '../../../context/VenueContext';
import { supabase } from '../../../utils/supabase';

const GoogleBusinessConnect = () => {
  const { venueId, userRole } = useVenue();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (venueId) {
      checkConnection();
    }
  }, [venueId]);

  // Check URL for success/error messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'google_connected') {
      alert('Google account connected successfully!\n\nYou can now generate review request links for your venue.');
      window.history.replaceState({}, '', window.location.pathname);
      checkConnection();
    } else if (success === 'google_reconnected') {
      alert('Google account reconnected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      checkConnection();
    } else if (error) {
      let errorMessage = 'Failed to connect Google Business Profile';
      const details = params.get('details');
      if (details) {
        errorMessage += `: ${decodeURIComponent(details)}`;
      }
      alert(errorMessage);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/google?action=status&venueId=${venueId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (userRole !== 'master') {
      alert('Only account owners can connect Google Business Profile');
      return;
    }

    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to connect Google');
        return;
      }

      // Call the auth-init endpoint
      const response = await fetch('/api/google?action=auth-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ venueId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initialize Google authentication');
      }

      const data = await response.json();

      // Redirect to Google OAuth
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('Error connecting Google:', error);
      alert(error.message || 'Failed to connect Google Business Profile');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (userRole !== 'master') {
      alert('Only account owners can disconnect Google Business Profile');
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to disconnect your Google Business Profile? This will remove all synced reviews.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch('/api/google?action=disconnect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ venueId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disconnect');
      }

      alert('Google Business Profile disconnected successfully');
      checkConnection();

    } catch (error) {
      console.error('Error disconnecting:', error);
      alert(error.message || 'Failed to disconnect Google Business Profile');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mt-1"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-4 text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected || false;
  const canManageConnection = userRole === 'master';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Google Business Profile</h3>
              <p className="text-sm text-gray-500">View and reply to reviews</p>
            </div>
          </div>
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-sm font-medium text-gray-500">Not Connected</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="text-sm text-gray-600">
          {isConnected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-medium text-green-900 mb-1">✅ Connected</p>
                <p className="text-green-700 text-xs">
                  Connected as: {connectionStatus.connection.email}
                </p>
                {connectionStatus.connection.locationCount > 0 && (
                  <p className="text-green-700 text-xs mt-1">
                    {connectionStatus.connection.locationCount} location(s) found
                  </p>
                )}
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-2">What you can do:</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• View all Google reviews in one place</li>
                  <li>• Reply to reviews directly from Chatters</li>
                  <li>• Reviews sync automatically every 30 minutes</li>
                  <li>• Get notified of new reviews</li>
                </ul>
              </div>

              {canManageConnection && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Disconnect Google
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-3 font-medium text-gray-700">Connect your Google Business Profile to:</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• View and reply to Google reviews</li>
                  <li>• Automatic review syncing</li>
                  <li>• Centralized review management</li>
                  <li>• Real-time notifications</li>
                </ul>
              </div>

              {canManageConnection ? (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full px-4 py-3 bg-[#2548CC] text-white rounded-lg hover:bg-[#1e3ba8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Connect Google Business Profile
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-800 text-xs">
                    Only account owners can connect Google Business Profile. Please contact your account owner.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleBusinessConnect;
