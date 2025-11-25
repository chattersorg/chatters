import React, { useState, useEffect, useRef } from 'react';
import { useVenue } from '../../../context/VenueContext';
import { supabase } from '../../../utils/supabase';
import GoogleBusinessConnect from './GoogleBusinessConnect';

const IntegrationsTab = () => {
  const { venueId } = useVenue();
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [message, setMessage] = useState('');
  const [tripadvisorSearchQuery, setTripadvisorSearchQuery] = useState('');
  const [tripadvisorResults, setTripadvisorResults] = useState([]);
  const [isSearchingTripadvisor, setIsSearchingTripadvisor] = useState(false);
  const [showTripadvisorDropdown, setShowTripadvisorDropdown] = useState(false);
  const tripadvisorSearchTimeoutRef = useRef(null);
  const tripadvisorDropdownRef = useRef(null);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleUnlinkTripAdvisor = async () => {
    if (!window.confirm('Are you sure you want to unlink TripAdvisor? This will remove the connection and stop tracking ratings.')) {
      return;
    }

    setUnlinking(true);
    setMessage('');

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

      setMessage('TripAdvisor unlinked successfully');
      await loadVenueData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
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
      setMessage('Error: TripAdvisor listing is locked and cannot be changed');
      return;
    }

    if (venueData?.tripadvisor_location_id) {
      setMessage('Error: TripAdvisor listing is already connected');
      return;
    }

    setShowTripadvisorDropdown(false);
    setTripadvisorSearchQuery(venue.name);
    setLoading(true);
    setMessage('');

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
        setMessage('TripAdvisor listing connected successfully!');
        await loadVenueData();
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error || 'Failed to connect TripAdvisor listing'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading integrations...</div>
      </div>
    );
  }

  const googleConnected = venueData?.place_id && venueData.place_id.trim() !== '';
  const tripadvisorConnected = venueData?.tripadvisor_location_id && venueData.tripadvisor_location_id.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('Error') || message.includes('Failed')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Google Business Profile Card */}
      <GoogleBusinessConnect />

      {/* TripAdvisor Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-1">
                <img
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/tripadvisor-icon.png"
                  alt="TripAdvisor"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">TripAdvisor</h3>
                <p className="text-sm text-gray-500">Listing integration</p>
              </div>
            </div>
            {tripadvisorConnected ? (
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
            {tripadvisorConnected ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-medium text-green-900 mb-1">✅ TripAdvisor listing is connected</p>
                  <p className="text-green-700 text-xs">Your TripAdvisor reviews are being tracked automatically.</p>
                </div>

                {venueData?.tripadvisor_integration_locked ? (
                  <p className="text-xs text-gray-500">
                    This integration is locked and cannot be unlinked. Contact support if you need to change this.
                  </p>
                ) : (
                  <button
                    onClick={handleUnlinkTripAdvisor}
                    disabled={unlinking}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {unlinking ? 'Unlinking...' : 'Unlink TripAdvisor'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-3 font-medium text-gray-700">Connect your TripAdvisor listing to:</p>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>• Track TripAdvisor reviews automatically</li>
                    <li>• Generate review request links</li>
                    <li>• Monitor rating changes over time</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search for your business on TripAdvisor
                  </label>
                  <div className="relative" ref={tripadvisorDropdownRef}>
                    <input
                      type="text"
                      value={tripadvisorSearchQuery}
                      onChange={(e) => handleTripadvisorSearchInput(e.target.value)}
                      placeholder="e.g., 'The Fox Inn, SW1A 1AA' or 'Restaurant London'"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />

                    {showTripadvisorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isSearchingTripadvisor ? (
                          <div className="px-3 py-2 text-sm text-gray-500">Searching TripAdvisor...</div>
                        ) : tripadvisorResults.length > 0 ? (
                          tripadvisorResults.map((result, index) => (
                            <button
                              key={`tripadvisor-${index}`}
                              onClick={() => selectTripadvisorVenue(result)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm text-gray-900 flex items-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                                  TripAdvisor
                                </span>
                                {result.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {result.address && (
                                  <>
                                    {result.address.street1 && <span>{result.address.street1}, </span>}
                                    {result.address.city && <span>{result.address.city}</span>}
                                    {result.address.postalcode && <span>, {result.address.postalcode}</span>}
                                    {result.address.country && <span> • {result.address.country}</span>}
                                  </>
                                )}
                              </div>
                              {result.rating && (
                                <div className="text-xs text-gray-600 mt-1">
                                  ⭐ {result.rating} ({result.num_reviews} reviews)
                                </div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Include your business name and postcode for best results (UK businesses only)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status Bar */}
      {googleConnected && tripadvisorConnected && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">Both integrations are connected</h4>
              <p className="text-sm text-green-700">
                Your integrations are locked and cannot be changed for reporting purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help text when nothing connected */}
      {!googleConnected && !tripadvisorConnected && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Connect your Google Business and TripAdvisor listings above to start tracking reviews.
        </div>
      )}
    </div>
  );
};

export default IntegrationsTab;
