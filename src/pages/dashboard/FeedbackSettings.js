import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import FeedbackTimeSelection from '../../components/dashboard/settings/venuetabcomponents/FeedbackTimeSelection';
import { Button } from '../../components/ui/button';
import { RefreshCw } from 'lucide-react';

// Reusable card component - defined outside to prevent re-creation on every render
const SettingsCard = ({ title, description, children, onSave, loading, message, saveLabel = 'Save' }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
    <div className="p-6">
      {children}
    </div>
    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Changes are saved per venue
        </div>
        <Button
          variant="primary"
          onClick={onSave}
          loading={loading}
        >
          {loading ? 'Saving...' : saveLabel}
        </Button>
      </div>
      {message && (
        <div className={`text-xs p-2 rounded-lg mt-3 ${
          message.includes('success') || message.includes('regenerated')
            ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
            : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  </div>
);

const FeedbackSettings = () => {
  usePageTitle('Feedback Settings');
  const { venueId } = useVenue();

  // Review Platform Links state
  const [tripadvisorLink, setTripadvisorLink] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [reviewLinksLoading, setReviewLinksLoading] = useState(false);
  const [reviewLinksMessage, setReviewLinksMessage] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [tripadvisorLocationId, setTripadvisorLocationId] = useState('');

  // Session Timeout state
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(2);
  const [selectedTimeoutHours, setSelectedTimeoutHours] = useState(2);
  const [sessionTimeoutLoading, setSessionTimeoutLoading] = useState(false);
  const [sessionTimeoutMessage, setSessionTimeoutMessage] = useState('');

  // Co-resolver state
  const [enableCoResolving, setEnableCoResolving] = useState(false);
  const [coResolverLoading, setCoResolverLoading] = useState(false);
  const [coResolverMessage, setCoResolverMessage] = useState('');

  // Review threshold state
  const [feedbackReviewThreshold, setFeedbackReviewThreshold] = useState(4);
  const [reviewThresholdLoading, setReviewThresholdLoading] = useState(false);
  const [reviewThresholdMessage, setReviewThresholdMessage] = useState('');

  useEffect(() => {
    if (!venueId) return;
    fetchFeedbackSettings();
  }, [venueId]);

  const fetchFeedbackSettings = async () => {
    try {
      const { data: venueData, error } = await supabase
        .from('venues')
        .select('tripadvisor_link, google_review_link, session_timeout_hours, place_id, tripadvisor_location_id, enable_co_resolving, feedback_review_threshold')
        .eq('id', venueId)
        .single();

      if (error) {
        console.error('Error fetching feedback settings:', error);
        return;
      }

      setTripadvisorLink(venueData.tripadvisor_link || '');
      setGoogleReviewLink(venueData.google_review_link || '');
      setSessionTimeoutHours(venueData.session_timeout_hours || 2);
      setSelectedTimeoutHours(venueData.session_timeout_hours || 2);
      setPlaceId(venueData.place_id || '');
      setTripadvisorLocationId(venueData.tripadvisor_location_id || '');
      setEnableCoResolving(venueData.enable_co_resolving || false);
      setFeedbackReviewThreshold(venueData.feedback_review_threshold ?? 4);
    } catch (error) {
      console.error('Error fetching feedback settings:', error);
    }
  };

  const regenerateGoogleUrl = () => {
    if (placeId) {
      const generatedUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
      setGoogleReviewLink(generatedUrl);
      setReviewLinksMessage('Google review URL regenerated! Click "Save" to save.');
    } else {
      setReviewLinksMessage('No Google Place ID found. Please link your venue in Settings > Integrations first.');
    }
  };

  const regenerateTripAdvisorUrl = () => {
    if (tripadvisorLocationId) {
      const generatedUrl = `https://www.tripadvisor.com/UserReviewEdit-d${tripadvisorLocationId}`;
      setTripadvisorLink(generatedUrl);
      setReviewLinksMessage('TripAdvisor review URL regenerated! Click "Save" to save.');
    } else {
      setReviewLinksMessage('No TripAdvisor Location ID found. Please link your venue in Settings > Integrations first.');
    }
  };

  const saveReviewLinks = async () => {
    if (!venueId) return;
    setReviewLinksLoading(true);
    setReviewLinksMessage('');

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          tripadvisor_link: tripadvisorLink,
          google_review_link: googleReviewLink,
        })
        .eq('id', venueId);

      if (error) throw error;
      setReviewLinksMessage('Review links updated successfully!');
    } catch (error) {
      console.error('Error updating review links:', error);
      setReviewLinksMessage('Failed to update review links: ' + error.message);
    } finally {
      setReviewLinksLoading(false);
    }
  };

  const saveSessionTimeout = async () => {
    if (!venueId) return;
    setSessionTimeoutLoading(true);
    setSessionTimeoutMessage('');

    try {
      const { data, error, count } = await supabase
        .from('venues')
        .update({ session_timeout_hours: selectedTimeoutHours })
        .eq('id', venueId)
        .select();

      if (error) throw error;
      if (count === 0 || !data || data.length === 0) {
        throw new Error('No rows updated. You may not have permission to update this venue.');
      }

      setSessionTimeoutHours(selectedTimeoutHours);
      setSessionTimeoutMessage('Session timeout updated successfully!');
    } catch (error) {
      console.error('Error saving session timeout:', error);
      setSessionTimeoutMessage(`Failed to save session timeout: ${error.message}`);
    } finally {
      setSessionTimeoutLoading(false);
    }
  };

  const saveCoResolverSettings = async () => {
    if (!venueId) return;
    setCoResolverLoading(true);
    setCoResolverMessage('');

    try {
      const { error } = await supabase
        .from('venues')
        .update({ enable_co_resolving: enableCoResolving })
        .eq('id', venueId);

      if (error) throw error;
      setCoResolverMessage('Co-resolver settings updated successfully!');
    } catch (error) {
      console.error('Error saving co-resolver settings:', error);
      setCoResolverMessage(`Failed to save co-resolver settings: ${error.message}`);
    } finally {
      setCoResolverLoading(false);
    }
  };

  const saveReviewThreshold = async () => {
    if (!venueId) return;
    setReviewThresholdLoading(true);
    setReviewThresholdMessage('');

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          feedback_review_threshold: feedbackReviewThreshold
        })
        .eq('id', venueId);

      if (error) throw error;
      setReviewThresholdMessage('Review threshold updated successfully!');
    } catch (error) {
      console.error('Error saving review threshold:', error);
      setReviewThresholdMessage(`Failed to save review threshold: ${error.message}`);
    } finally {
      setReviewThresholdLoading(false);
    }
  };

  if (!venueId) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Feedback Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure how feedback is collected and processed for your venue</p>
      </div>

      {/* Review Platform Links */}
      <SettingsCard
        title="Review Platform Links"
        description="Direct satisfied customers to leave positive reviews"
        onSave={saveReviewLinks}
        loading={reviewLinksLoading}
        message={reviewLinksMessage}
      >
        <div className="space-y-6">
          {/* Google Reviews */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Reviews
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={googleReviewLink}
                onChange={(e) => setGoogleReviewLink(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Button
                variant="outline"
                onClick={regenerateGoogleUrl}
                disabled={!placeId}
                title={placeId ? "Generate Google review URL" : "Link venue in Integrations first"}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </Button>
            </div>
            {!placeId && (
              <p className="text-xs text-amber-600 mt-2">
                Link your Google Business venue in Settings → Integrations to enable URL generation
              </p>
            )}
          </div>

          {/* TripAdvisor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              TripAdvisor
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://www.tripadvisor.com/your-venue"
                value={tripadvisorLink}
                onChange={(e) => setTripadvisorLink(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Button
                variant="outline"
                onClick={regenerateTripAdvisorUrl}
                disabled={!tripadvisorLocationId}
                title={tripadvisorLocationId ? "Generate TripAdvisor review URL" : "Link venue in Integrations first"}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </Button>
            </div>
            {!tripadvisorLocationId && (
              <p className="text-xs text-amber-600 mt-2">
                Link your TripAdvisor venue in Settings → Integrations to enable URL generation
              </p>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Review Prompt Threshold */}
      <SettingsCard
        title="Feedback Review Prompt Threshold"
        description="Set the minimum star rating required to show Google/TripAdvisor review links after feedback"
        onSave={saveReviewThreshold}
        loading={reviewThresholdLoading}
        message={reviewThresholdMessage}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback Rating Threshold
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Minimum star rating (1-5) required to show review links after feedback
            </p>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="feedbackThreshold"
                    value={rating}
                    checked={feedbackReviewThreshold === rating}
                    onChange={() => setFeedbackReviewThreshold(rating)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {rating}+ star{rating !== 1 ? 's' : ''} {rating === 4 ? '(default)' : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Higher thresholds mean only your happiest customers see the review prompt, improving your public ratings.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Session Timeout */}
      <SettingsCard
        title="Session Timeout"
        description="How long feedback stays visible in kiosk view"
        onSave={saveSessionTimeout}
        loading={sessionTimeoutLoading}
        message={sessionTimeoutMessage}
      >
        <div className="space-y-3">
          {[1, 2, 4, 6, 8, 12, 24].map((hours) => (
            <label key={hours} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="sessionTimeout"
                value={hours}
                checked={selectedTimeoutHours === hours}
                onChange={() => setSelectedTimeoutHours(hours)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {hours} hour{hours !== 1 ? 's' : ''}{hours === 2 ? ' (default)' : ''}
              </span>
            </label>
          ))}
        </div>
      </SettingsCard>

      {/* Feedback Collection Hours */}
      <FeedbackTimeSelection currentVenueId={venueId} />

      {/* Co-Resolver Settings */}
      <SettingsCard
        title="Co-Resolver Feature"
        description="Allow staff to assign a secondary team member who helped resolve feedback"
        onSave={saveCoResolverSettings}
        loading={coResolverLoading}
        message={coResolverMessage}
      >
        <div className="space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Co-Resolvers
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Allow selecting a second staff member when resolving feedback</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableCoResolving}
                onChange={(e) => setEnableCoResolving(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2548CC]"></div>
            </label>
          </div>

          {enableCoResolving && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Example:</strong> If John notices a guest's food issue and Sarah (the chef) makes new food, John can resolve the feedback and add Sarah as a co-resolver to recognise her contribution.
              </p>
            </div>
          )}
        </div>
      </SettingsCard>
    </div>
  );
};

export default FeedbackSettings;
