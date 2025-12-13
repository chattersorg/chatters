import React, { useState, useEffect, useRef } from 'react';
import { useVenue } from '../../../context/VenueContext';
import { supabase } from '../../../utils/supabase';
import UnifiedVenuePreviewModal from './UnifiedVenuePreviewModal';

const UnifiedReviewsCard = () => {
  const { venueId } = useVenue();
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [tripadvisorSearchQuery, setTripadvisorSearchQuery] = useState('');
  const [googleResults, setGoogleResults] = useState([]);
  const [tripadvisorResults, setTripadvisorResults] = useState([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isSearchingTripadvisor, setIsSearchingTripadvisor] = useState(false);
  const [currentRatings, setCurrentRatings] = useState({ google: null, tripadvisor: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showGoogleDropdown, setShowGoogleDropdown] = useState(false);
  const [showTripadvisorDropdown, setShowTripadvisorDropdown] = useState(false);
  const [selectedVenues, setSelectedVenues] = useState(null);
  const [currentVenueData, setCurrentVenueData] = useState(null);
  const [initialDates, setInitialDates] = useState({ google: null, tripadvisor: null });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [canGenerateReviewLinks, setCanGenerateReviewLinks] = useState({ google: false, tripadvisor: false });
  const [generateLinkLoading, setGenerateLinkLoading] = useState({ google: false, tripadvisor: false });
  const googleSearchTimeoutRef = useRef(null);
  const tripadvisorSearchTimeoutRef = useRef(null);
  const googleDropdownRef = useRef(null);
  const tripadvisorDropdownRef = useRef(null);

  // Load current ratings and venue data on mount
  useEffect(() => {
    if (venueId) {
      loadCurrentRatings();
      loadCurrentVenueData();
      loadInitialDates();
    }
  }, [venueId]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (googleDropdownRef.current && !googleDropdownRef.current.contains(event.target)) {
        setShowGoogleDropdown(false);
      }
      if (tripadvisorDropdownRef.current && !tripadvisorDropdownRef.current.contains(event.target)) {
        setShowTripadvisorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCurrentRatings = async () => {
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
  };

  const loadCurrentVenueData = async () => {
    try {
      const { data: venue, error } = await supabase
        .from('venues')
        .select('id, name, address, phone, website, google_integration_locked, tripadvisor_integration_locked, place_id, google_review_link, tripadvisor_location_id, tripadvisor_link')
        .eq('id', venueId)
        .single();

      if (!error && venue) {
        setCurrentVenueData(venue);
        // Only lock UI if BOTH platforms are connected
        setIsLocked(venue.place_id && venue.tripadvisor_location_id);
        // Check if we can generate review links
        setCanGenerateReviewLinks({
          google: venue.place_id && !venue.google_review_link,
          tripadvisor: venue.tripadvisor_location_id && !venue.tripadvisor_link
        });
      }
    } catch (error) {
      console.error('Error loading venue data:', error);
    }
  };

  const loadInitialDates = async () => {
    try {
      const { data: googleInitial } = await supabase
        .from('historical_ratings')
        .select('recorded_at')
        .eq('venue_id', venueId)
        .eq('source', 'google')
        .eq('is_initial', true)
        .order('recorded_at', { ascending: true })
        .limit(1)
        .single();

      const { data: tripadvisorInitial } = await supabase
        .from('historical_ratings')
        .select('recorded_at')
        .eq('venue_id', venueId)
        .eq('source', 'tripadvisor')
        .eq('is_initial', true)
        .order('recorded_at', { ascending: true })
        .limit(1)
        .single();

      setInitialDates({
        google: googleInitial?.recorded_at || null,
        tripadvisor: tripadvisorInitial?.recorded_at || null
      });
    } catch (error) {
      console.error('Error loading initial dates:', error);
    }
  };

  const handleGoogleSearchInput = (value) => {
    setGoogleSearchQuery(value);
    setShowGoogleDropdown(value.length > 2);

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

  const performGoogleSearch = async (query) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        return;
      }

      const url = `/api/reviews?platform=google&action=places-search&query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleResults(data.suggestions || []);
      } else {
        setGoogleResults([]);
      }
    } catch (error) {
      setGoogleResults([]);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const performTripadvisorSearch = async (query) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
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
        setTripadvisorResults([]);
      }
    } catch (error) {
      setTripadvisorResults([]);
    } finally {
      setIsSearchingTripadvisor(false);
    }
  };

  const selectGoogleVenue = async (venue) => {
    if (currentVenueData?.google_integration_locked) {
      setMessage('Error: Google listing is locked and cannot be changed');
      return;
    }
    
    if (currentVenueData?.place_id) {
      setMessage('Error: Google listing is already connected');
      return;
    }

    setShowGoogleDropdown(false);
    setGoogleSearchQuery(venue.description);
    setLoading(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/reviews?platform=google&action=place-details&placeId=${venue.place_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const googleDetails = await response.json();
        setSelectedVenues({ google: googleDetails, tripadvisor: null });
        setShowPreviewModal(true);
      } else {
        setMessage('Error fetching Google venue details');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectTripadvisorVenue = async (venue) => {
    if (currentVenueData?.tripadvisor_integration_locked) {
      setMessage('Error: TripAdvisor listing is locked and cannot be changed');
      return;
    }
    
    if (currentVenueData?.tripadvisor_location_id) {
      setMessage('Error: TripAdvisor listing is already connected');
      return;
    }
    
    setShowTripadvisorDropdown(false);
    setTripadvisorSearchQuery(venue.name);
    setLoading(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/reviews?platform=tripadvisor&action=location-details&locationId=${venue.location_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const tripadvisorDetails = await response.json();
        setSelectedVenues({ google: null, tripadvisor: tripadvisorDetails });
        setShowPreviewModal(true);
      } else {
        setMessage('Error fetching TripAdvisor venue details');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVenues = async (autoPopulate) => {
    if (!selectedVenues) return;

    setLoading(true);
    setMessage('');
    setShowPreviewModal(false);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const updates = [];

      // Update Google venue if selected
      if (selectedVenues.google) {
        updates.push(
          fetch(`/api/reviews?platform=google&action=update-venue&venueId=${venueId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              place_id: selectedVenues.google.place_id,
              venue_data: selectedVenues.google,
              auto_populate: autoPopulate
            })
          })
        );
      }

      // Update TripAdvisor venue if selected
      if (selectedVenues.tripadvisor) {
        updates.push(
          fetch(`/api/reviews?platform=tripadvisor&action=update-venue&venueId=${venueId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              location_id: selectedVenues.tripadvisor.location_id,
              venue_data: selectedVenues.tripadvisor,
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
        setSelectedVenues(null);
        setTimeout(() => {
          loadCurrentRatings();
          loadCurrentVenueData();
        }, 1000);
      } else {
        const failedResults = results.filter(r => r.status === 'rejected' || !r.value.ok);
        setMessage(`Partial success: ${successful.length}/${updates.length} platforms linked. Some updates failed.`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
          <div className="text-sm text-gray-600">
            ({rating.ratings_count || 0} reviews)
          </div>
        </div>
        {rating.attributions && rating.attributions.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <div dangerouslySetInnerHTML={{ __html: rating.attributions[0] }} />
          </div>
        )}
        <div className="mt-2 space-y-1">
          {initialDates[platform] && (
            <div className="text-xs text-gray-500">
              Created at: {new Date(initialDates[platform]).toLocaleDateString('en-GB')}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Last updated: {new Date(rating.fetched_at).toLocaleDateString('en-GB')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Review Platform Integration</h3>
        <p className="text-sm text-gray-600">
          Link your Google Business and TripAdvisor listings to display ratings and track review performance.
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
          <div className="flex items-center">
            <div className="text-green-500 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-800">All Platforms Connected</h4>
              <p className="text-sm text-green-700">
                Both Google and TripAdvisor listings are connected. This ensures accurate rating progression tracking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Section - Only show if not locked */}
      {!isLocked && (
        <div className="space-y-6">
          {/* Google Search */}
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              🔵 Link with Google listing
            </label>
            <div className="relative" ref={googleDropdownRef}>
              <input
                type="text"
                value={googleSearchQuery}
                onChange={(e) => handleGoogleSearchInput(e.target.value)}
                placeholder="Search for your business on Google..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={currentVenueData?.google_integration_locked || currentVenueData?.place_id}
              />
            
            {/* Google Search Dropdown */}
            {showGoogleDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isSearchingGoogle ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Searching Google...</div>
                ) : googleResults.length > 0 ? (
                  googleResults.map((result, index) => (
                    <button
                      key={`google-${index}`}
                      onClick={() => selectGoogleVenue(result)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm text-gray-900 flex items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          Google
                        </span>
                        {result.structured_formatting?.main_text || result.description}
                      </div>
                      <div className="text-xs text-gray-500">{result.structured_formatting?.secondary_text || result.description}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                )}
              </div>
            )}
            </div>
            {currentVenueData?.place_id && (
              <p className="mt-1 text-xs text-green-600">✓ Google listing connected</p>
            )}
          </div>

          {/* TripAdvisor Search */}
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              🟢 Link with TripAdvisor listing
            </label>
            <div className="relative" ref={tripadvisorDropdownRef}>
              <input
                type="text"
                value={tripadvisorSearchQuery}
                onChange={(e) => handleTripadvisorSearchInput(e.target.value)}
                placeholder="Search for your business on TripAdvisor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={currentVenueData?.tripadvisor_integration_locked || currentVenueData?.tripadvisor_location_id}
              />
            
            {/* TripAdvisor Search Dropdown */}
            {showTripadvisorDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isSearchingTripadvisor ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Searching TripAdvisor...</div>
                ) : tripadvisorResults.length > 0 ? (
                  tripadvisorResults.map((result, index) => (
                    <button
                      key={`tripadvisor-${index}`}
                      onClick={() => selectTripadvisorVenue(result)}
                      className="w-full px-3 py-2 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm text-gray-900 flex items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                          TripAdvisor
                        </span>
                        {result.name}
                      </div>
                      <div className="text-xs text-gray-500">{result.address?.city}, {result.address?.country}</div>
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
            {currentVenueData?.tripadvisor_location_id && (
              <p className="mt-1 text-xs text-green-600">✓ TripAdvisor listing connected</p>
            )}
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

      {/* Unified Venue Preview Modal */}
      <UnifiedVenuePreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedVenues(null);
        }}
        onConfirm={handleConfirmVenues}
        venueData={selectedVenues}
        currentVenueData={currentVenueData}
        isLoading={loading}
      />
    </div>
  );
};

export default UnifiedReviewsCard;