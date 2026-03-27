import React, { useState, useEffect, useRef } from 'react';
import { useVenue } from '../../../context/VenueContext';
import { supabase } from '../../../utils/supabase';
import { CheckCircle2, XCircle, Search, ExternalLink, Unlink, AlertCircle, Star, TrendingUp, Link2, ChevronRight } from 'lucide-react';
import ModernCard from '../layout/ModernCard';

const IntegrationsTab = () => {
  const { venueId, userRole } = useVenue();
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // TripAdvisor search state
  const [tripadvisorSearchQuery, setTripadvisorSearchQuery] = useState('');
  const [tripadvisorResults, setTripadvisorResults] = useState([]);
  const [isSearchingTripadvisor, setIsSearchingTripadvisor] = useState(false);
  const [showTripadvisorDropdown, setShowTripadvisorDropdown] = useState(false);
  const [tripadvisorSearchError, setTripadvisorSearchError] = useState(null);
  const tripadvisorSearchTimeoutRef = useRef(null);
  const tripadvisorDropdownRef = useRef(null);

  // Google search state
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [googleResults, setGoogleResults] = useState([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [showGoogleDropdown, setShowGoogleDropdown] = useState(false);
  const [googleSearchError, setGoogleSearchError] = useState(null);
  const googleSearchTimeoutRef = useRef(null);
  const googleDropdownRef = useRef(null);

  useEffect(() => {
    if (venueId) {
      loadVenueData();
    }
  }, [venueId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tripadvisorDropdownRef.current && !tripadvisorDropdownRef.current.contains(event.target)) {
        setShowTripadvisorDropdown(false);
      }
      if (googleDropdownRef.current && !googleDropdownRef.current.contains(event.target)) {
        setShowGoogleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadVenueData = async () => {
    try {
      const { data: venue, error } = await supabase
        .from('venues')
        .select('id, name, place_id, tripadvisor_location_id, google_review_link, tripadvisor_link, tripadvisor_integration_locked, google_integration_locked, address')
        .eq('id', venueId)
        .single();

      if (!error && venue) {
        setVenueData(venue);
        const postcode = venue.address?.postalCode || venue.address?.postcode || '';
        const suggestedSearch = postcode ? `${venue.name}, ${postcode}` : venue.name;

        if (!venue.tripadvisor_location_id && venue.name) {
          setTripadvisorSearchQuery(suggestedSearch);
        }
        if (!venue.place_id && venue.name) {
          setGoogleSearchQuery(suggestedSearch);
        }
      }
    } catch (error) {
      console.error('Error loading venue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Google search handlers
  const handleGoogleSearchInput = (value) => {
    setGoogleSearchQuery(value);
    setShowGoogleDropdown(value.length > 2);
    setGoogleSearchError(null);

    if (googleSearchTimeoutRef.current) {
      clearTimeout(googleSearchTimeoutRef.current);
    }

    if (value.length > 2) {
      setIsSearchingGoogle(true);
      googleSearchTimeoutRef.current = setTimeout(() => {
        performGoogleSearch(value);
      }, 300);
    } else {
      setGoogleResults([]);
      setIsSearchingGoogle(false);
    }
  };

  const handleGoogleSearchButton = () => {
    if (googleSearchQuery.length > 2) {
      setShowGoogleDropdown(true);
      setIsSearchingGoogle(true);
      performGoogleSearch(googleSearchQuery);
    }
  };

  const performGoogleSearch = async (query) => {
    setGoogleSearchError(null);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        setGoogleSearchError('Please log in to search Google');
        return;
      }

      const url = `/api/reviews?platform=google&action=places-search&query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleResults(data.suggestions || []);
        if (data.suggestions?.length === 0) {
          setGoogleSearchError('No results found. Try different search terms.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Google search failed:', response.status, errorData);
        setGoogleResults([]);
        if (errorData.reason === 'google_api_not_configured') {
          setGoogleSearchError('Google search is temporarily unavailable. Please try again later.');
        } else if (errorData.status === 'temporary_unavailable') {
          setGoogleSearchError('Google search is temporarily unavailable. Please try again later.');
        } else {
          setGoogleSearchError('Search failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Google search error:', error);
      setGoogleResults([]);
      setGoogleSearchError('Network error. Please check your connection.');
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const selectGoogleVenue = async (venue) => {
    if (venueData?.google_integration_locked) {
      setMessage({ type: 'error', text: 'Google listing is locked and cannot be changed' });
      return;
    }

    if (venueData?.place_id) {
      setMessage({ type: 'error', text: 'Google listing is already connected' });
      return;
    }

    setShowGoogleDropdown(false);
    setGoogleSearchQuery(venue.structured_formatting?.main_text || venue.description);
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/reviews?platform=google&action=update-venue&venueId=${venueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          place_id: venue.place_id,
          auto_populate: false
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Google listing connected successfully!' });
        await loadVenueData();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to connect Google listing' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!window.confirm('Are you sure you want to unlink Google? This will remove the connection and stop tracking ratings.')) {
      return;
    }

    setUnlinkingGoogle(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          place_id: null,
          google_review_link: null,
          google_integration_locked: false
        })
        .eq('id', venueId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Google unlinked successfully' });
      await loadVenueData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUnlinkingGoogle(false);
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
    setTripadvisorSearchError(null);

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

  const handleTripadvisorSearchButton = () => {
    if (tripadvisorSearchQuery.length > 2) {
      setShowTripadvisorDropdown(true);
      setIsSearchingTripadvisor(true);
      performTripadvisorSearch(tripadvisorSearchQuery);
    }
  };

  const performTripadvisorSearch = async (query) => {
    setTripadvisorSearchError(null);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        console.error('No authentication token');
        setTripadvisorSearchError('Please log in to search TripAdvisor');
        return;
      }

      const url = `/api/reviews?platform=tripadvisor&action=location-search&query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTripadvisorResults(data.suggestions || []);
        if (data.suggestions?.length === 0) {
          setTripadvisorSearchError('No results found. Try different search terms.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('TripAdvisor search failed:', response.status, errorData);
        setTripadvisorResults([]);
        if (errorData.reason === 'tripadvisor_api_not_configured') {
          setTripadvisorSearchError('TripAdvisor search is temporarily unavailable. Please try again later.');
        } else if (errorData.status === 'temporary_unavailable') {
          setTripadvisorSearchError('TripAdvisor search is temporarily unavailable. Please try again later.');
        } else {
          setTripadvisorSearchError('Search failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('TripAdvisor search error:', error);
      setTripadvisorResults([]);
      setTripadvisorSearchError('Network error. Please check your connection.');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          Loading integrations...
        </div>
      </div>
    );
  }

  const googleConnected = venueData?.place_id && venueData.place_id.trim() !== '';
  const tripadvisorConnected = venueData?.tripadvisor_location_id && venueData.tripadvisor_location_id.trim() !== '';

  // Integration card component for connected state
  const IntegrationRow = ({
    name,
    description,
    icon,
    connected,
    locked,
    onDisconnect,
    disconnecting,
    searchQuery,
    onSearchInput,
    onSearchButton,
    isSearching,
    searchError,
    results,
    showDropdown,
    dropdownRef,
    onSelect,
    renderResult,
    accentColor = 'blue'
  }) => (
    <ModernCard className="overflow-hidden" padding="p-0">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {connected ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Connected
              </span>
              {!locked && (
                <button
                  onClick={onDisconnect}
                  disabled={disconnecting}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Disconnect"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Not connected
            </span>
          )}
        </div>
      </div>

      {/* Search section when not connected */}
      {!connected && (
        <div className="px-5 pb-5 pt-0">
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchInput(e.target.value)}
                  placeholder="Search for your business..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={onSearchButton}
                disabled={searchQuery.length < 3 || isSearching}
                className={`px-4 py-2.5 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  accentColor === 'green'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </div>

            {showDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : searchError ? (
                  <div className="px-4 py-3 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                ) : results.length > 0 ? (
                  results.map((result, index) => renderResult(result, index, onSelect))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ModernCard>
  );

  return (
    <div className="space-y-4">
      {/* Message Display */}
      {message.text && (
        <div className={`flex items-center gap-3 p-4 rounded-lg text-sm ${
          message.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
        }`}>
          {message.type === 'error' ? (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Review Platforms Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Review Platforms
        </h2>

        {/* Google Business Profile */}
        <IntegrationRow
          name="Google Business Profile"
          description="Track your Google rating and reviews"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          }
          connected={googleConnected}
          locked={venueData?.google_integration_locked}
          onDisconnect={handleUnlinkGoogle}
          disconnecting={unlinkingGoogle}
          searchQuery={googleSearchQuery}
          onSearchInput={handleGoogleSearchInput}
          onSearchButton={handleGoogleSearchButton}
          isSearching={isSearchingGoogle}
          searchError={googleSearchError}
          results={googleResults}
          showDropdown={showGoogleDropdown}
          dropdownRef={googleDropdownRef}
          onSelect={selectGoogleVenue}
          accentColor="blue"
          renderResult={(result, index, onSelect) => (
            <button
              key={`google-${index}`}
              onClick={() => onSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {result.structured_formatting?.main_text || result.description}
              </div>
              {result.structured_formatting?.secondary_text && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {result.structured_formatting.secondary_text}
                </div>
              )}
            </button>
          )}
        />

        {/* TripAdvisor */}
        <IntegrationRow
          name="TripAdvisor"
          description="Track your TripAdvisor rating and reviews"
          icon={
            <img
              src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/tripadvisor-icon.png"
              alt="TripAdvisor"
              className="w-5 h-5 object-contain"
            />
          }
          connected={tripadvisorConnected}
          locked={venueData?.tripadvisor_integration_locked}
          onDisconnect={handleUnlinkTripAdvisor}
          disconnecting={unlinking}
          searchQuery={tripadvisorSearchQuery}
          onSearchInput={handleTripadvisorSearchInput}
          onSearchButton={handleTripadvisorSearchButton}
          isSearching={isSearchingTripadvisor}
          searchError={tripadvisorSearchError}
          results={tripadvisorResults}
          showDropdown={showTripadvisorDropdown}
          dropdownRef={tripadvisorDropdownRef}
          onSelect={selectTripadvisorVenue}
          accentColor="green"
          renderResult={(result, index, onSelect) => (
            <button
              key={`tripadvisor-${index}`}
              onClick={() => onSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900 dark:text-white">{result.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
          )}
        />
      </div>

      {/* Coming Soon Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Coming Soon
        </h2>

        <ModernCard padding="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { name: 'SevenRooms', description: 'Reservation system integration', color: 'bg-purple-500' },
              { name: 'ResDiary', description: 'Reservation system integration', color: 'bg-blue-500' },
              { name: 'OpenTable', description: 'Reservation system integration', color: 'bg-red-500' },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-5 opacity-60">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center`}>
                    <span className="text-white font-semibold text-sm">{integration.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{integration.description}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </ModernCard>
      </div>
    </div>
  );
};

export default IntegrationsTab;
