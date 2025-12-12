import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVenue } from '../../../context/VenueContext';
import { supabase } from '../../../utils/supabase';
import UnifiedVenuePreviewModal from './UnifiedVenuePreviewModal';

const GoogleReviewsCard = () => {
  const { venueId } = useVenue();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ google: [], tripadvisor: [], matched_venues: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [currentRatings, setCurrentRatings] = useState({ google: null, tripadvisor: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentVenueData, setCurrentVenueData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [canGenerateReviewLinks, setCanGenerateReviewLinks] = useState({ google: false, tripadvisor: false });
  const [generateLinkLoading, setGenerateLinkLoading] = useState({ google: false, tripadvisor: false });
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const loadCurrentRatings = useCallback(async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      // Load Google rating
      const googleResponse = await fetch(`/api/reviews?platform=google&action=ratings&venueId=${venueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Load TripAdvisor rating
      const tripAdvisorResponse = await fetch(`/api/reviews?platform=tripadvisor&action=ratings&venueId=${venueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const ratings = {
        google: googleResponse.ok ? await googleResponse.json() : null,
        tripadvisor: tripAdvisorResponse.ok ? await tripAdvisorResponse.json() : null
      };

      setCurrentRatings(ratings);
    } catch (error) {
      console.error('Error loading current ratings:', error);
    }
  }, [venueId]);

  const loadCurrentVenueData = useCallback(async () => {
    try {
      const { data: venue, error } = await supabase
        .from('venues')
        .select('id, name, address, phone, website, venue_locked, place_id, google_review_link, tripadvisor_location_id, tripadvisor_link')
        .eq('id', venueId)
        .single();

      if (!error && venue) {
        setCurrentVenueData(venue);
        setIsLocked(venue.venue_locked || false);
        // Check if we can generate review links
        setCanGenerateReviewLinks({
          google: venue.place_id && !venue.google_review_link,
          tripadvisor: venue.tripadvisor_location_id && !venue.tripadvisor_link
        });
      }
    } catch (error) {
      console.error('Error loading venue data:', error);
    }
  }, [venueId]);

  // Load current ratings and venue data on mount
  useEffect(() => {
    if (venueId) {
      loadCurrentRatings();
      loadCurrentVenueData();
    }
  }, [venueId, loadCurrentRatings, loadCurrentVenueData]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (value) => {
    setSearchQuery(value);
    setShowDropdown(value.length > 2);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    if (value.length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performUnifiedSearch(value);
      }, 300);
    } else {
      setSearchResults({ google: [], tripadvisor: [], matched_venues: [] });
      setIsSearching(false);
    }
  };

  const performUnifiedSearch = async (query) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        return;
      }

      const url = `/api/reviews?platform=unified&action=search&query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();

        // Check if TripAdvisor had errors and show a message
        if (data.tripadvisor?.error && data.tripadvisor.error.includes('unauthorized')) {
          setMessage('TripAdvisor search unavailable - please remove domain restrictions from your TripAdvisor API key to enable server-side requests. Google search is still working.');
        }
        
        setSearchResults({
          google: data.google.suggestions || [],
          tripadvisor: data.tripadvisor.suggestions || [],
          matched_venues: data.matched_venues || []
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Search failed:', response.status, errorData);
        setSearchResults({ google: [], tripadvisor: [], matched_venues: [] });
      }
    } catch (error) {
      console.error('💥 Search error:', error);
      setSearchResults({ google: [], tripadvisor: [], matched_venues: [] });
    } finally {
      setIsSearching(false);
    }
  };



  const handleGoogleMapUrl = async () => {
    if (!googleMapUrl.trim() || isLocked) return;

    setLoading(true);
    setMessage('');

    try {
      // Extract place_id from Google Maps URL
      const placeIdMatch = googleMapUrl.match(/place_id=([^&]+)/);
      const dataMatch = googleMapUrl.match(/data=([^&]+)/);
      
      let placeId = null;
      
      if (placeIdMatch) {
        placeId = placeIdMatch[1];
      } else if (dataMatch) {
        // Handle encoded URLs - this is a simplified extraction
        const decoded = decodeURIComponent(dataMatch[1]);
        const pidMatch = decoded.match(/0x[a-f0-9]+:0x[a-f0-9]+/);
        if (pidMatch) {
          // For complex URLs, we'll need to use Find Place API
          const token = (await supabase.auth.getSession()).data.session?.access_token;
          const response = await fetch(`/api/reviews?platform=google&action=places-search&query=${encodeURIComponent(googleMapUrl)}&type=findplace`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.places && data.places.length > 0) {
              placeId = data.places[0].place_id;
            }
          }
        }
      }

      if (!placeId) {
        setMessage('Could not extract Place ID from URL. Please use the search instead.');
        return;
      }

      // Get full venue details and show preview modal
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const detailsResponse = await fetch(`/api/reviews?platform=google&action=place-details&placeId=${placeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (detailsResponse.ok) {
        const venueData = await detailsResponse.json();
        setSelectedPlace(venueData);
        setShowPreviewModal(true);
        setGoogleMapUrl('');
      } else {
        const error = await detailsResponse.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderRatingDisplay = (rating, platform) => {
    if (!rating) return null;

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 capitalize">{platform} Rating</h4>
          {canGenerateReviewLinks[platform] && (
            <button
              onClick={() => handleGenerateReviewLink(platform)}
              disabled={generateLinkLoading[platform]}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {generateLinkLoading[platform] ? 'Generating...' : 'Generate Review Link'}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold text-gray-900">
            {rating.rating ? rating.rating.toFixed(1) : 'N/A'}
          </div>
          <div className="text-yellow-500 text-xl">⭐</div>
          <div className="text-sm text-gray-600">
            ({rating.ratings_count || 0} reviews)
          </div>
        </div>
        {rating.attributions && rating.attributions.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <div dangerouslySetInnerHTML={{ __html: rating.attributions[0] }} />
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date(rating.fetched_at).toLocaleString()}
          {rating.cached && ' (cached)'}
        </div>
      </div>
    );
  };

  const handleGenerateReviewLink = async (platform) => {
    if (!currentVenueData) return;

    const platformData = platform === 'google' ? 
      { id: currentVenueData.place_id, field: 'google_review_link' } :
      { id: currentVenueData.tripadvisor_location_id, field: 'tripadvisor_link' };

    if (!platformData.id) return;

    setGenerateLinkLoading(prev => ({ ...prev, [platform]: true }));
    setMessage('');

    try {
      const reviewLink = platform === 'google' ?
        `https://search.google.com/local/writereview?placeid=${platformData.id}` :
        `https://www.tripadvisor.com/UserReviewEdit-g${platformData.id}`;
      
      const { error } = await supabase
        .from('venues')
        .update({ [platformData.field]: reviewLink })
        .eq('id', venueId);

      if (error) throw error;

      setMessage(`${platform.charAt(0).toUpperCase() + platform.slice(1)} review link generated successfully!`);
      setCanGenerateReviewLinks(prev => ({ ...prev, [platform]: false }));
      
      setTimeout(() => {
        loadCurrentVenueData();
      }, 1000);

    } catch (error) {
      setMessage(`Error generating ${platform} review link: ${error.message}`);
    } finally {
      setGenerateLinkLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const selectMatchedVenue = async (matchedVenue) => {
    if (isLocked) {
      setMessage('Error: Venue is already locked to existing listings');
      return;
    }

    setShowDropdown(false);
    setSearchQuery(`${matchedVenue.google.name} (Matched)`);
    setLoading(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // Fetch full details for both platforms
      const [googleResponse, tripAdvisorResponse] = await Promise.allSettled([
        fetch(`/api/reviews?platform=google&action=place-details&placeId=${matchedVenue.google.place_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/reviews?platform=tripadvisor&action=location-details&locationId=${matchedVenue.tripadvisor.location_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const venueDetails = {
        google: googleResponse.status === 'fulfilled' && googleResponse.value.ok ? 
          await googleResponse.value.json() : null,
        tripadvisor: tripAdvisorResponse.status === 'fulfilled' && tripAdvisorResponse.value.ok ? 
          await tripAdvisorResponse.value.json() : null
      };

      setSelectedPlace(venueDetails);
      setShowPreviewModal(true);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectSingleVenue = async (venue, platform) => {
    if (isLocked) {
      setMessage('Error: Venue is already locked to existing listings');
      return;
    }

    setShowDropdown(false);
    setSearchQuery(venue.name || venue.description);
    setLoading(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      let venueDetails = { google: null, tripadvisor: null };

      if (platform === 'google') {
        const response = await fetch(`/api/reviews?platform=google&action=place-details&placeId=${venue.place_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          venueDetails.google = await response.json();
        }
      } else if (platform === 'tripadvisor') {
        const response = await fetch(`/api/reviews?platform=tripadvisor&action=location-details&locationId=${venue.location_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          venueDetails.tripadvisor = await response.json();
        }
      }

      setSelectedPlace(venueDetails);
      setShowPreviewModal(true);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVenues = async (autoPopulate) => {
    if (!selectedPlace) return;

    setLoading(true);
    setMessage('');
    setShowPreviewModal(false);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const updates = [];

      // Update Google venue if selected
      if (selectedPlace.google) {
        updates.push(
          fetch(`/api/reviews?platform=google&action=update-venue&venueId=${venueId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              place_id: selectedPlace.google.place_id,
              venue_data: selectedPlace.google,
              auto_populate: autoPopulate
            })
          })
        );
      }

      // Update TripAdvisor venue if selected
      if (selectedPlace.tripadvisor) {
        updates.push(
          fetch(`/api/reviews?platform=tripadvisor&action=update-venue&venueId=${venueId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              location_id: selectedPlace.tripadvisor.location_id,
              venue_data: selectedPlace.tripadvisor,
              auto_populate: autoPopulate
            })
          })
        );
      }

      const results = await Promise.allSettled(updates);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok);

      if (successful.length === updates.length) {
        setMessage('Venue listings linked successfully and venue locked!');
        setIsLocked(true);
        setSelectedPlace(null);
        setTimeout(() => {
          loadCurrentRatings();
          loadCurrentVenueData();
        }, 1000);
      } else {
        setMessage(`Partial success: ${successful.length}/${updates.length} platforms linked. Some updates failed.`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Review Platform Integration</h3>
        <p className="text-sm text-gray-600">
          Link your Google Business and TripAdvisor listings to display ratings and track review performance across platforms.
        </p>
      </div>

      {/* Current Ratings Display */}
      {(currentRatings.google || currentRatings.tripadvisor) && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentRatings.google && renderRatingDisplay(currentRatings.google, 'google')}
          {currentRatings.tripadvisor && renderRatingDisplay(currentRatings.tripadvisor, 'tripadvisor')}
        </div>
      )}

      {/* Locked Status */}
      {isLocked && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-green-500 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-green-800">Google Venue Locked</h4>
                <p className="text-sm text-green-700">
                  Your venue is linked to Google and cannot be changed. This ensures rating progression tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section - Only show if not locked */}
      {!isLocked && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Find your business across review platforms
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search for your business name + city/postcode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            
            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                ) : (
                  <>
                    {/* Matched venues first */}
                    {searchResults.matched_venues.map((match, index) => (
                      <button
                        key={`match-${index}`}
                        onClick={() => selectMatchedVenue(match)}
                        className="w-full px-3 py-3 text-left hover:bg-blue-50 border-b border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm text-gray-900 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                                Perfect Match
                              </span>
                              {match.google.name}
                            </div>
                            <div className="text-xs text-gray-500">{match.google.address}</div>
                            <div className="text-xs text-blue-600 mt-1">
                              Found on both Google & TripAdvisor
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            {Math.round(match.similarity_score.overall * 100)}% match
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Individual Google results */}
                    {searchResults.google.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                          Google Places
                        </div>
                        {searchResults.google.map((result, index) => (
                          <button
                            key={`google-${index}`}
                            onClick={() => selectSingleVenue(result, 'google')}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100"
                          >
                            <div className="font-medium text-sm text-gray-900 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                Google
                              </span>
                              {result.name}
                            </div>
                            <div className="text-xs text-gray-500">{result.address}</div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Individual TripAdvisor results */}
                    {searchResults.tripadvisor.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                          TripAdvisor
                        </div>
                        {searchResults.tripadvisor.map((result, index) => (
                          <button
                            key={`tripadvisor-${index}`}
                            onClick={() => selectSingleVenue(result, 'tripadvisor')}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-sm text-gray-900 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                                TripAdvisor
                              </span>
                              {result.name}
                            </div>
                            <div className="text-xs text-gray-500">{result.address}</div>
                            {result.rating && (
                              <div className="text-xs text-gray-600 mt-1">
                                ⭐ {result.rating} ({result.num_reviews} reviews)
                              </div>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

          {/* Google Maps URL Fallback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or paste Google Maps URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={googleMapUrl}
                onChange={(e) => setGoogleMapUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleGoogleMapUrl}
                disabled={loading || !googleMapUrl.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </div>
      )}

      {/* Venue Preview Modal */}
      <UnifiedVenuePreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedPlace(null);
        }}
        onConfirm={handleConfirmVenues}
        venueData={selectedPlace}
        currentVenueData={currentVenueData}
        isLoading={loading}
      />
    </div>
  );
};

export default GoogleReviewsCard;