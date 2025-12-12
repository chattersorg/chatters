import React, { useState, useEffect, useRef } from 'react';
import { useVenue } from '../../../context/VenueContext';
import { supabase } from '../../../utils/supabase';
import { CheckCircle2, XCircle, Search, ExternalLink, Unlink, AlertCircle, Zap, Star, TrendingUp, Bell } from 'lucide-react';

const IntegrationsTab = () => {
  const { venueId, userRole } = useVenue();
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tripadvisorSearchQuery, setTripadvisorSearchQuery] = useState('');
  const [tripadvisorResults, setTripadvisorResults] = useState([]);
  const [isSearchingTripadvisor, setIsSearchingTripadvisor] = useState(false);
  const [showTripadvisorDropdown, setShowTripadvisorDropdown] = useState(false);
  const tripadvisorSearchTimeoutRef = useRef(null);
  const tripadvisorDropdownRef = useRef(null);

  // Google connection state
  const [googleStatus, setGoogleStatus] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (venueId) {
      loadVenueData();
      checkGoogleConnection();
    }
  }, [venueId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tripadvisorDropdownRef.current && !tripadvisorDropdownRef.current.contains(event.target)) {
        setShowTripadvisorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check URL for Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'google_connected') {
      setMessage({ type: 'success', text: 'Google Business Profile connected successfully!' });
      window.history.replaceState({}, '', window.location.pathname);
      checkGoogleConnection();
    } else if (success === 'google_reconnected') {
      setMessage({ type: 'success', text: 'Google Business Profile reconnected successfully!' });
      window.history.replaceState({}, '', window.location.pathname);
      checkGoogleConnection();
    } else if (error) {
      const details = params.get('details');
      setMessage({ type: 'error', text: details ? decodeURIComponent(details) : 'Failed to connect Google Business Profile' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadVenueData = async () => {
    try {
      const { data: venue, error } = await supabase
        .from('venues')
        .select('id, name, place_id, tripadvisor_location_id, google_review_link, tripadvisor_link, tripadvisor_integration_locked')
        .eq('id', venueId)
        .single();

      if (!error && venue) {
        setVenueData(venue);
      }
    } catch (error) {
      console.error('Error loading venue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setGoogleLoading(false);
        return;
      }

      const response = await fetch(`/api/google?action=status&venueId=${venueId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleStatus(data);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    if (userRole !== 'master') {
      setMessage({ type: 'error', text: 'Only account owners can connect Google Business Profile' });
      return;
    }

    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'You must be logged in to connect Google' });
        return;
      }

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
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('Error connecting Google:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to connect Google Business Profile' });
    } finally {
      setConnecting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (userRole !== 'master') {
      setMessage({ type: 'error', text: 'Only account owners can disconnect Google Business Profile' });
      return;
    }

    if (!window.confirm('Are you sure you want to disconnect your Google Business Profile? This will remove all synced reviews.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'You must be logged in' });
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

      setMessage({ type: 'success', text: 'Google Business Profile disconnected successfully' });
      checkGoogleConnection();

    } catch (error) {
      console.error('Error disconnecting:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to disconnect Google Business Profile' });
    }
  };

  const handleUnlinkTripAdvisor = async () => {
    if (!window.confirm('Are you sure you want to unlink TripAdvisor? This will remove the connection and stop tracking ratings.')) {
      return;
    }

    setUnlinking(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/reviews/tripadvisor/unlink-venue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ venueId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to unlink TripAdvisor');
      }

      setMessage({ type: 'success', text: 'TripAdvisor unlinked successfully' });
      await loadVenueData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUnlinking(false);
    }
  };

  const handleTripadvisorSearchInput = (value) => {
    setTripadvisorSearchQuery(value);
    setShowTripadvisorDropdown(value.length > 2);

    if (tripadvisorSearchTimeoutRef.current) {
      clearTimeout(tripadvisorSearchTimeoutRef.current);
    }

    if (value.length > 2) {
      setIsSearchingTripadvisor(true);
      tripadvisorSearchTimeoutRef.current = setTimeout(() => {
        performTripadvisorSearch(value);
      }, 300);
    } else {
      setTripadvisorResults([]);
      setIsSearchingTripadvisor(false);
    }
  };

  const performTripadvisorSearch = async (query) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        console.error('No authentication token');
        return;
      }

      const url = `/api/reviews?platform=tripadvisor&action=location-search&query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTripadvisorResults(data.suggestions || []);
      } else {
        console.error('TripAdvisor search failed:', response.status);
        setTripadvisorResults([]);
      }
    } catch (error) {
      console.error('TripAdvisor search error:', error);
      setTripadvisorResults([]);
    } finally {
      setIsSearchingTripadvisor(false);
    }
  };

  const selectTripadvisorVenue = async (venue) => {
    if (venueData?.tripadvisor_integration_locked) {
      setMessage({ type: 'error', text: 'TripAdvisor listing is locked and cannot be changed' });
      return;
    }

    if (venueData?.tripadvisor_location_id) {
      setMessage({ type: 'error', text: 'TripAdvisor listing is already connected' });
      return;
    }

    setShowTripadvisorDropdown(false);
    setTripadvisorSearchQuery(venue.name);
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/reviews?platform=tripadvisor&action=update-venue&venueId=${venueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location_id: venue.location_id,
          venue_data: venue,
          auto_populate: false
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'TripAdvisor listing connected successfully!' });
        await loadVenueData();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to connect TripAdvisor listing' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading || googleLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          Loading integrations...
        </div>
      </div>
    );
  }

  const googleConnected = googleStatus?.connected || false;
  const tripadvisorConnected = venueData?.tripadvisor_location_id && venueData.tripadvisor_location_id.trim() !== '';
  const canManageConnection = userRole === 'master';

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message.text && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm ${
          message.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
        }`}>
          {message.type === 'error' ? (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Business Profile Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Business Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View and respond to reviews</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                googleConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${googleConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                {googleConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {googleConnected ? (
              <div className="space-y-5">
                {/* Connected Info */}
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-300">Connected successfully</p>
                    <p className="text-sm text-green-700 dark:text-green-400">{googleStatus?.connection?.email}</p>
                  </div>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>View all reviews</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span>Reply directly</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Auto-sync</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Bell className="w-4 h-4 text-purple-500" />
                    <span>Notifications</span>
                  </div>
                </div>

                {/* Disconnect Button */}
                {canManageConnection && (
                  <button
                    onClick={handleGoogleDisconnect}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    Disconnect
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Benefits */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What you'll get:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Star, text: 'View all Google reviews in one place', color: 'text-amber-500' },
                      { icon: Zap, text: 'Reply to reviews directly from Chatters', color: 'text-blue-500' },
                      { icon: TrendingUp, text: 'Reviews sync automatically every 30 minutes', color: 'text-green-500' },
                      { icon: Bell, text: 'Get notified of new reviews', color: 'text-purple-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connect Button */}
                {canManageConnection ? (
                  <button
                    onClick={handleGoogleConnect}
                    disabled={connecting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Only account owners can connect Google Business Profile. Please contact your account owner.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TripAdvisor Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm p-2">
                  <img
                    src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/tripadvisor-icon.png"
                    alt="TripAdvisor"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">TripAdvisor</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Listing integration</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                tripadvisorConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${tripadvisorConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                {tripadvisorConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {tripadvisorConnected ? (
              <div className="space-y-5">
                {/* Connected Info */}
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-300">TripAdvisor listing connected</p>
                    <p className="text-sm text-green-700 dark:text-green-400">Reviews are being tracked automatically</p>
                  </div>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Track reviews</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                    <span>Review links</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Rating trends</span>
                  </div>
                </div>

                {/* Disconnect Button */}
                {venueData?.tripadvisor_integration_locked ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This integration is locked and cannot be unlinked. Contact support if you need to change this.
                  </p>
                ) : (
                  <button
                    onClick={handleUnlinkTripAdvisor}
                    disabled={unlinking}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Unlink className="w-4 h-4" />
                    {unlinking ? 'Unlinking...' : 'Disconnect'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Benefits */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What you'll get:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Star, text: 'Track TripAdvisor reviews automatically', color: 'text-amber-500' },
                      { icon: ExternalLink, text: 'Generate review request links', color: 'text-blue-500' },
                      { icon: TrendingUp, text: 'Monitor rating changes over time', color: 'text-green-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search for your business
                  </label>
                  <div className="relative" ref={tripadvisorDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={tripadvisorSearchQuery}
                        onChange={(e) => handleTripadvisorSearchInput(e.target.value)}
                        placeholder="e.g., 'The Fox Inn, SW1A 1AA'"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    </div>

                    {showTripadvisorDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {isSearchingTripadvisor ? (
                          <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                            Searching TripAdvisor...
                          </div>
                        ) : tripadvisorResults.length > 0 ? (
                          tripadvisorResults.map((result, index) => (
                            <button
                              key={`tripadvisor-${index}`}
                              onClick={() => selectTripadvisorVenue(result)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  TripAdvisor
                                </span>
                                <span className="font-medium text-sm text-gray-900 dark:text-white">{result.name}</span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {result.address && (
                                  <>
                                    {result.address.street1 && <span>{result.address.street1}, </span>}
                                    {result.address.city && <span>{result.address.city}</span>}
                                    {result.address.postalcode && <span>, {result.address.postalcode}</span>}
                                  </>
                                )}
                              </div>
                              {result.rating && (
                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  {result.rating} ({result.num_reviews} reviews)
                                </div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No results found. Try including your business name and postcode.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Include your business name and postcode for best results (UK businesses only)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Connected Banner */}
      {googleConnected && tripadvisorConnected && (
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-300">All integrations connected</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Your Google Business Profile and TripAdvisor are both connected and tracking reviews automatically.
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!googleConnected && !tripadvisorConnected && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Connect your review platforms above to start managing all your reviews in one place.
          </p>
        </div>
      )}
    </div>
  );
};

export default IntegrationsTab;
