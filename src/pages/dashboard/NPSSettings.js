import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { Button } from '../../components/ui/button';
import FilterSelect from '../../components/ui/FilterSelect';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

// Reusable card component
const SettingsCard = ({ title, description, children, onSave, loading, saveLabel = 'Save' }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
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
    </div>
  </div>
);

const NPSSettings = () => {
  usePageTitle('NPS Settings');
  const { venueId, venueName } = useVenue();

  // NPS state
  const [npsEnabled, setNpsEnabled] = useState(false);
  const [npsDelayHours, setNpsDelayHours] = useState(24);
  const [npsQuestion, setNpsQuestion] = useState('How likely are you to recommend us to a friend or colleague?');
  const [npsLoading, setNpsLoading] = useState(false);

  // NPS Review threshold state
  const [npsReviewThreshold, setNpsReviewThreshold] = useState(9);
  const [reviewThresholdLoading, setReviewThresholdLoading] = useState(false);

  // NPS Email customisation state
  const [npsEmailSubject, setNpsEmailSubject] = useState('How was your visit to {venue_name}?');
  const [npsEmailGreeting, setNpsEmailGreeting] = useState('Thank you for visiting {venue_name}!');
  const [npsEmailBody, setNpsEmailBody] = useState('We hope you had a great experience. We\'d love to hear your feedback.');
  const [npsEmailButtonText, setNpsEmailButtonText] = useState('Rate Your Experience');
  const [emailCustomLoading, setEmailCustomLoading] = useState(false);

  // Test email state
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    fetchNPSSettings();
  }, [venueId]);

  const fetchNPSSettings = async () => {
    try {
      const { data: venueData, error } = await supabase
        .from('venues')
        .select('nps_enabled, nps_delay_hours, nps_question, nps_review_threshold, nps_email_subject, nps_email_greeting, nps_email_body, nps_email_button_text')
        .eq('id', venueId)
        .single();

      if (error) {
        console.error('Error fetching NPS settings:', error);
        return;
      }

      setNpsEnabled(venueData.nps_enabled || false);
      setNpsDelayHours(venueData.nps_delay_hours || 24);
      setNpsQuestion(venueData.nps_question || 'How likely are you to recommend us to a friend or colleague?');
      setNpsReviewThreshold(venueData.nps_review_threshold ?? 9);
      setNpsEmailSubject(venueData.nps_email_subject || 'How was your visit to {venue_name}?');
      setNpsEmailGreeting(venueData.nps_email_greeting || 'Thank you for visiting {venue_name}!');
      setNpsEmailBody(venueData.nps_email_body || 'We hope you had a great experience. We\'d love to hear your feedback.');
      setNpsEmailButtonText(venueData.nps_email_button_text || 'Rate Your Experience');
    } catch (error) {
      console.error('Error fetching NPS settings:', error);
    }
  };

  const saveNPSSettings = async () => {
    if (!venueId) return;
    setNpsLoading(true);

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          nps_enabled: npsEnabled,
          nps_delay_hours: npsDelayHours,
          nps_question: npsQuestion
        })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('NPS settings updated successfully!');
    } catch (error) {
      console.error('Error saving NPS settings:', error);
      toast.error(`Failed to save NPS settings: ${error.message}`);
    } finally {
      setNpsLoading(false);
    }
  };

  const saveReviewThresholds = async () => {
    if (!venueId) return;
    setReviewThresholdLoading(true);

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          nps_review_threshold: npsReviewThreshold
        })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Review thresholds updated successfully!');
    } catch (error) {
      console.error('Error saving review thresholds:', error);
      toast.error(`Failed to save review thresholds: ${error.message}`);
    } finally {
      setReviewThresholdLoading(false);
    }
  };

  const saveEmailCustomization = async () => {
    if (!venueId) return;
    setEmailCustomLoading(true);

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          nps_email_subject: npsEmailSubject,
          nps_email_greeting: npsEmailGreeting,
          nps_email_body: npsEmailBody,
          nps_email_button_text: npsEmailButtonText
        })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Email customisation updated successfully!');
    } catch (error) {
      console.error('Error saving email customization:', error);
      toast.error(`Failed to save email customisation: ${error.message}`);
    } finally {
      setEmailCustomLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!venueId) return;
    setSendingTestEmail(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/send-test-nps-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ venueId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      toast.success(data.message);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (!venueId) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your Net Promoter Score surveys and thresholds</p>
      </div>

      {/* NPS Email Settings */}
      <SettingsCard
        title="NPS Email Surveys"
        description="Send automated follow-up emails to gather customer loyalty insights"
        onSave={saveNPSSettings}
        loading={npsLoading}
      >
        <div className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable NPS Emails
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically send NPS surveys after visits</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={npsEnabled}
                onChange={(e) => setNpsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2548CC]"></div>
            </label>
          </div>

          {npsEnabled && (
            <>
              {/* Delay Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Send Delay
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  How long after a guest leaves feedback before sending the NPS survey
                </p>
                <div className="flex gap-4">
                  {[12, 24, 36].map((hours) => (
                    <label key={hours} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="npsDelay"
                        value={hours}
                        checked={npsDelayHours === hours}
                        onChange={() => setNpsDelayHours(hours)}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {hours}h {hours === 24 ? '(recommended)' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* NPS Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NPS Question
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Choose the question shown to guests in the NPS survey email
                </p>
                <FilterSelect
                  value={npsQuestion}
                  onChange={(e) => setNpsQuestion(e.target.value)}
                  options={[
                    { value: 'How likely are you to recommend us to a friend or colleague?', label: 'How likely are you to recommend us to a friend or colleague?' },
                    { value: 'How likely are you to recommend us to friends and family?', label: 'How likely are you to recommend us to friends and family?' },
                    { value: 'How likely are you to visit us again?', label: 'How likely are you to visit us again?' },
                    { value: 'How likely are you to recommend us based on your experience?', label: 'How likely are you to recommend us based on your experience?' }
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </SettingsCard>

      {/* NPS Email Customisation */}
      {npsEnabled && (
        <SettingsCard
          title="Email Customisation"
          description="Customise the content of your NPS survey emails"
          onSave={saveEmailCustomization}
          loading={emailCustomLoading}
        >
          <div className="space-y-6">
            {/* Email Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Subject
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                The subject line of the NPS email
              </p>
              <FilterSelect
                value={npsEmailSubject}
                onChange={(e) => setNpsEmailSubject(e.target.value)}
                options={[
                  { value: 'How was your visit to {venue_name}?', label: `How was your visit to ${venueName}?` },
                  { value: 'We\'d love your feedback, {venue_name}', label: `We'd love your feedback, ${venueName}` },
                  { value: '{venue_name} wants to hear from you', label: `${venueName} wants to hear from you` },
                  { value: 'Quick question about your visit to {venue_name}', label: `Quick question about your visit to ${venueName}` }
                ]}
              />
            </div>

            {/* Email Greeting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Greeting
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                The headline shown at the top of the email
              </p>
              <FilterSelect
                value={npsEmailGreeting}
                onChange={(e) => setNpsEmailGreeting(e.target.value)}
                options={[
                  { value: 'Thank you for visiting {venue_name}!', label: `Thank you for visiting ${venueName}!` },
                  { value: 'We hope you enjoyed your visit!', label: 'We hope you enjoyed your visit!' },
                  { value: 'Thanks for stopping by {venue_name}!', label: `Thanks for stopping by ${venueName}!` },
                  { value: 'We loved having you at {venue_name}!', label: `We loved having you at ${venueName}!` }
                ]}
              />
            </div>

            {/* Email Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Body Text
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                The main message shown before the survey question
              </p>
              <FilterSelect
                value={npsEmailBody}
                onChange={(e) => setNpsEmailBody(e.target.value)}
                options={[
                  { value: 'We hope you had a great experience. We\'d love to hear your feedback.', label: 'We hope you had a great experience. We\'d love to hear your feedback.' },
                  { value: 'Your opinion matters to us. Please take a moment to share your thoughts.', label: 'Your opinion matters to us. Please take a moment to share your thoughts.' },
                  { value: 'We\'re always looking to improve. Would you mind sharing your experience?', label: 'We\'re always looking to improve. Would you mind sharing your experience?' },
                  { value: 'Help us serve you better by sharing a quick rating.', label: 'Help us serve you better by sharing a quick rating.' }
                ]}
              />
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Button Text
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                The text shown on the email's call-to-action button
              </p>
              <FilterSelect
                value={npsEmailButtonText}
                onChange={(e) => setNpsEmailButtonText(e.target.value)}
                options={[
                  { value: 'Rate Your Experience', label: 'Rate Your Experience' },
                  { value: 'Share Your Feedback', label: 'Share Your Feedback' },
                  { value: 'Take Quick Survey', label: 'Take Quick Survey' },
                  { value: 'Give Us Your Rating', label: 'Give Us Your Rating' }
                ]}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Preview</p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p><span className="font-medium">Subject:</span> {npsEmailSubject.replace('{venue_name}', venueName)}</p>
                <p><span className="font-medium">Greeting:</span> {npsEmailGreeting.replace('{venue_name}', venueName)}</p>
                <p><span className="font-medium">Body:</span> {npsEmailBody}</p>
                <p><span className="font-medium">Question:</span> {npsQuestion}</p>
                <p><span className="font-medium">Button:</span> [{npsEmailButtonText}]</p>
              </div>
            </div>

            {/* Send Test Email */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Send Test Email</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Send a preview of this email to yourself
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={sendTestEmail}
                  disabled={sendingTestEmail}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendingTestEmail ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            </div>
          </div>
        </SettingsCard>
      )}

      {/* NPS Review Prompt Threshold */}
      {npsEnabled && (
        <SettingsCard
          title="NPS Review Prompt Threshold"
          description="Set the minimum NPS score required to show Google/TripAdvisor review links after NPS surveys"
          onSave={saveReviewThresholds}
          loading={reviewThresholdLoading}
        >
        <div className="space-y-6">
          {/* NPS Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              NPS Score Threshold
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Minimum NPS score (0-10) required to show review links after NPS survey
            </p>
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <label key={score} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="npsThreshold"
                    value={score}
                    checked={npsReviewThreshold === score}
                    onChange={() => setNpsReviewThreshold(score)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {score}+ {score === 9 ? '(default)' : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Higher thresholds mean only your happiest customers see the review prompt after NPS surveys, improving your public ratings.
            </p>
          </div>
        </div>
      </SettingsCard>
      )}
    </div>
  );
};

export default NPSSettings;
