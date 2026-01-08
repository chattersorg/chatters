import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { Button } from '../../components/ui/button';
import FilterSelect from '../../components/ui/FilterSelect';
import { Send, Image, Link, Palette, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

// Reusable card component
const SettingsCard = ({ title, description, children, onSave, loading, saveLabel = 'Save', icon: Icon }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
    <div className="p-6">
      {children}
    </div>
    {onSave && (
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
    )}
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

  // NPS Email customisation state - Basic
  const [npsEmailSubject, setNpsEmailSubject] = useState('How was your visit to {venue_name}?');
  const [npsEmailGreeting, setNpsEmailGreeting] = useState('Hi {customer_name},');
  const [npsEmailBody, setNpsEmailBody] = useState('Thanks for joining us at {venue_name}.\n\nIf you can spare a couple of minutes to tell us about your visit, we would really appreciate hearing about your experience.');
  const [npsEmailButtonText, setNpsEmailButtonText] = useState('Share feedback');
  const [emailCustomLoading, setEmailCustomLoading] = useState(false);

  // NPS Email customisation state - Header Image
  const [npsEmailHeaderImage, setNpsEmailHeaderImage] = useState('');
  const [headerImageLoading, setHeaderImageLoading] = useState(false);

  // NPS Email customisation state - Navigation Links
  const [npsEmailNavLink1Text, setNpsEmailNavLink1Text] = useState('');
  const [npsEmailNavLink1Url, setNpsEmailNavLink1Url] = useState('');
  const [npsEmailNavLink2Text, setNpsEmailNavLink2Text] = useState('');
  const [npsEmailNavLink2Url, setNpsEmailNavLink2Url] = useState('');
  const [npsEmailNavLink3Text, setNpsEmailNavLink3Text] = useState('');
  const [npsEmailNavLink3Url, setNpsEmailNavLink3Url] = useState('');
  const [navLinksLoading, setNavLinksLoading] = useState(false);

  // NPS Email customisation state - Colors
  const [npsEmailBackgroundColor, setNpsEmailBackgroundColor] = useState('#f5f5dc');
  const [npsEmailCardColor, setNpsEmailCardColor] = useState('#ffffff');
  const [npsEmailTextColor, setNpsEmailTextColor] = useState('#111827');
  const [npsEmailButtonColor, setNpsEmailButtonColor] = useState('');
  const [npsEmailButtonTextColor, setNpsEmailButtonTextColor] = useState('#ffffff');
  const [colorsLoading, setColorsLoading] = useState(false);

  // NPS Email customisation state - Sign-off
  const [npsEmailSignoff, setNpsEmailSignoff] = useState('Thank you,');
  const [npsEmailSignoffName, setNpsEmailSignoffName] = useState('');

  // NPS Email customisation state - Footer Links
  const [npsEmailFooterLink1Text, setNpsEmailFooterLink1Text] = useState('');
  const [npsEmailFooterLink1Url, setNpsEmailFooterLink1Url] = useState('');
  const [npsEmailFooterLink2Text, setNpsEmailFooterLink2Text] = useState('');
  const [npsEmailFooterLink2Url, setNpsEmailFooterLink2Url] = useState('');
  const [npsEmailFooterLink3Text, setNpsEmailFooterLink3Text] = useState('');
  const [npsEmailFooterLink3Url, setNpsEmailFooterLink3Url] = useState('');
  const [footerLinksLoading, setFooterLinksLoading] = useState(false);

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
        .select(`
          nps_enabled, nps_delay_hours, nps_question, nps_review_threshold,
          nps_email_subject, nps_email_greeting, nps_email_body, nps_email_button_text,
          nps_email_header_image,
          nps_email_nav_link_1_text, nps_email_nav_link_1_url,
          nps_email_nav_link_2_text, nps_email_nav_link_2_url,
          nps_email_nav_link_3_text, nps_email_nav_link_3_url,
          nps_email_background_color, nps_email_card_color, nps_email_text_color,
          nps_email_button_color, nps_email_button_text_color,
          nps_email_signoff, nps_email_signoff_name,
          nps_email_footer_link_1_text, nps_email_footer_link_1_url,
          nps_email_footer_link_2_text, nps_email_footer_link_2_url,
          nps_email_footer_link_3_text, nps_email_footer_link_3_url,
          primary_color
        `)
        .eq('id', venueId)
        .single();

      if (error) {
        console.error('Error fetching NPS settings:', error);
        return;
      }

      // Basic settings
      setNpsEnabled(venueData.nps_enabled || false);
      setNpsDelayHours(venueData.nps_delay_hours || 24);
      setNpsQuestion(venueData.nps_question || 'How likely are you to recommend us to a friend or colleague?');
      setNpsReviewThreshold(venueData.nps_review_threshold ?? 9);

      // Email content
      setNpsEmailSubject(venueData.nps_email_subject || 'How was your visit to {venue_name}?');
      setNpsEmailGreeting(venueData.nps_email_greeting || 'Hi {customer_name},');
      setNpsEmailBody(venueData.nps_email_body || 'Thanks for joining us at {venue_name}.\n\nIf you can spare a couple of minutes to tell us about your visit, we would really appreciate hearing about your experience.');
      setNpsEmailButtonText(venueData.nps_email_button_text || 'Share feedback');

      // Header image
      setNpsEmailHeaderImage(venueData.nps_email_header_image || '');

      // Navigation links
      setNpsEmailNavLink1Text(venueData.nps_email_nav_link_1_text || '');
      setNpsEmailNavLink1Url(venueData.nps_email_nav_link_1_url || '');
      setNpsEmailNavLink2Text(venueData.nps_email_nav_link_2_text || '');
      setNpsEmailNavLink2Url(venueData.nps_email_nav_link_2_url || '');
      setNpsEmailNavLink3Text(venueData.nps_email_nav_link_3_text || '');
      setNpsEmailNavLink3Url(venueData.nps_email_nav_link_3_url || '');

      // Colors (use primary_color as fallback for button color)
      setNpsEmailBackgroundColor(venueData.nps_email_background_color || '#f5f5dc');
      setNpsEmailCardColor(venueData.nps_email_card_color || '#ffffff');
      setNpsEmailTextColor(venueData.nps_email_text_color || '#111827');
      setNpsEmailButtonColor(venueData.nps_email_button_color || venueData.primary_color || '#4E74FF');
      setNpsEmailButtonTextColor(venueData.nps_email_button_text_color || '#ffffff');

      // Sign-off
      setNpsEmailSignoff(venueData.nps_email_signoff || 'Thank you,');
      setNpsEmailSignoffName(venueData.nps_email_signoff_name || '');

      // Footer links
      setNpsEmailFooterLink1Text(venueData.nps_email_footer_link_1_text || '');
      setNpsEmailFooterLink1Url(venueData.nps_email_footer_link_1_url || '');
      setNpsEmailFooterLink2Text(venueData.nps_email_footer_link_2_text || '');
      setNpsEmailFooterLink2Url(venueData.nps_email_footer_link_2_url || '');
      setNpsEmailFooterLink3Text(venueData.nps_email_footer_link_3_text || '');
      setNpsEmailFooterLink3Url(venueData.nps_email_footer_link_3_url || '');
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
          nps_email_button_text: npsEmailButtonText,
          nps_email_signoff: npsEmailSignoff,
          nps_email_signoff_name: npsEmailSignoffName
        })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Email content updated successfully!');
    } catch (error) {
      console.error('Error saving email customization:', error);
      toast.error(`Failed to save email content: ${error.message}`);
    } finally {
      setEmailCustomLoading(false);
    }
  };

  const handleHeaderImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !venueId) return;

    setHeaderImageLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${venueId}-nps-header.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete existing file
      const { error: deleteError } = await supabase.storage
        .from('venue-logos')
        .remove([filePath]);

      if (deleteError && deleteError.message !== 'The resource was not found') {
        throw new Error('Failed to delete existing header: ' + deleteError.message);
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('venue-logos')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Failed to upload header: ' + uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('venue-logos')
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // Update database
      const { error: updateError } = await supabase
        .from('venues')
        .update({ nps_email_header_image: cacheBustedUrl })
        .eq('id', venueId);

      if (updateError) {
        throw new Error('Failed to update header: ' + updateError.message);
      }

      setNpsEmailHeaderImage(cacheBustedUrl);
      toast.success('Header image updated successfully!');
    } catch (error) {
      console.error('Error updating header image:', error);
      toast.error('Failed to update header image: ' + error.message);
    } finally {
      setHeaderImageLoading(false);
    }
  };

  const removeHeaderImage = async () => {
    if (!venueId) return;

    setHeaderImageLoading(true);

    try {
      // Remove from storage if it exists
      if (npsEmailHeaderImage) {
        const fileName = `${venueId}-nps-header`;
        // Try to remove common extensions
        await supabase.storage.from('venue-logos').remove([`${fileName}.png`]);
        await supabase.storage.from('venue-logos').remove([`${fileName}.jpg`]);
        await supabase.storage.from('venue-logos').remove([`${fileName}.jpeg`]);
        await supabase.storage.from('venue-logos').remove([`${fileName}.webp`]);
      }

      // Update database
      const { error } = await supabase
        .from('venues')
        .update({ nps_email_header_image: null })
        .eq('id', venueId);

      if (error) throw error;

      setNpsEmailHeaderImage('');
      toast.success('Header image removed!');
    } catch (error) {
      console.error('Error removing header image:', error);
      toast.error('Failed to remove header image');
    } finally {
      setHeaderImageLoading(false);
    }
  };

  const saveNavLinks = async () => {
    if (!venueId) return;
    setNavLinksLoading(true);

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          nps_email_nav_link_1_text: npsEmailNavLink1Text || null,
          nps_email_nav_link_1_url: npsEmailNavLink1Url || null,
          nps_email_nav_link_2_text: npsEmailNavLink2Text || null,
          nps_email_nav_link_2_url: npsEmailNavLink2Url || null,
          nps_email_nav_link_3_text: npsEmailNavLink3Text || null,
          nps_email_nav_link_3_url: npsEmailNavLink3Url || null
        })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Navigation links updated successfully!');
    } catch (error) {
      console.error('Error saving navigation links:', error);
      toast.error(`Failed to save navigation links: ${error.message}`);
    } finally {
      setNavLinksLoading(false);
    }
  };

  const saveColors = async () => {
    if (!venueId) return;
    setColorsLoading(true);

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          nps_email_background_color: npsEmailBackgroundColor,
          nps_email_card_color: npsEmailCardColor,
          nps_email_text_color: npsEmailTextColor,
          nps_email_button_color: npsEmailButtonColor,
          nps_email_button_text_color: npsEmailButtonTextColor
        })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Email colors updated successfully!');
    } catch (error) {
      console.error('Error saving colors:', error);
      toast.error(`Failed to save colors: ${error.message}`);
    } finally {
      setColorsLoading(false);
    }
  };

  const saveFooterLinks = async () => {
    if (!venueId) return;
    setFooterLinksLoading(true);

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          nps_email_footer_link_1_text: npsEmailFooterLink1Text || null,
          nps_email_footer_link_1_url: npsEmailFooterLink1Url || null,
          nps_email_footer_link_2_text: npsEmailFooterLink2Text || null,
          nps_email_footer_link_2_url: npsEmailFooterLink2Url || null,
          nps_email_footer_link_3_text: npsEmailFooterLink3Text || null,
          nps_email_footer_link_3_url: npsEmailFooterLink3Url || null
        })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Footer links updated successfully!');
    } catch (error) {
      console.error('Error saving footer links:', error);
      toast.error(`Failed to save footer links: ${error.message}`);
    } finally {
      setFooterLinksLoading(false);
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

  // Helper to replace placeholders for preview
  const replacePreviewPlaceholders = (text) => {
    return text
      .replace(/{venue_name}/g, venueName || 'Your Venue')
      .replace(/{customer_name}/g, 'there');
  };

  if (!venueId) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your Net Promoter Score surveys and email design</p>
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

      {/* Email Design Section - Only show when NPS is enabled */}
      {npsEnabled && (
        <>
          {/* Header Image */}
          <SettingsCard
            title="Header Banner"
            description="Add a custom header image to your NPS emails"
            icon={Image}
          >
            <div className="space-y-4">
              <div className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {npsEmailHeaderImage ? (
                  <img
                    src={npsEmailHeaderImage}
                    alt="Header banner"
                    className="w-full max-h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-3"
                  />
                ) : (
                  <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-3">
                    <span className="text-gray-400 dark:text-gray-500 text-sm text-center px-4">No header image - click to upload</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderImageUpload}
                    disabled={headerImageLoading}
                    id="header-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="header-upload"
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                      headerImageLoading
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2548CC] text-white hover:bg-[#1e3ba8]'
                    }`}
                  >
                    {headerImageLoading ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {npsEmailHeaderImage && (
                    <button
                      onClick={removeHeaderImage}
                      disabled={headerImageLoading}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Recommended: 600px wide, landscape format
                </p>
              </div>
            </div>
          </SettingsCard>

          {/* Navigation Links */}
          <SettingsCard
            title="Navigation Links"
            description="Add up to 3 navigation links below the header (e.g., Menus, Book Now, Gift Cards)"
            onSave={saveNavLinks}
            loading={navLinksLoading}
            icon={Link}
          >
            <div className="space-y-4">
              {[1, 2, 3].map((num) => {
                const textValue = num === 1 ? npsEmailNavLink1Text : num === 2 ? npsEmailNavLink2Text : npsEmailNavLink3Text;
                const urlValue = num === 1 ? npsEmailNavLink1Url : num === 2 ? npsEmailNavLink2Url : npsEmailNavLink3Url;
                const setTextValue = num === 1 ? setNpsEmailNavLink1Text : num === 2 ? setNpsEmailNavLink2Text : setNpsEmailNavLink3Text;
                const setUrlValue = num === 1 ? setNpsEmailNavLink1Url : num === 2 ? setNpsEmailNavLink2Url : setNpsEmailNavLink3Url;

                return (
                  <div key={num} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Link {num} Text
                      </label>
                      <input
                        type="text"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder="e.g., MENUS"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Link {num} URL
                      </label>
                      <input
                        type="url"
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Leave empty to hide. Links will appear in a row below the header image.
              </p>
            </div>
          </SettingsCard>

          {/* Email Colors */}
          <SettingsCard
            title="Email Colors"
            description="Customise the colors of your NPS emails"
            onSave={saveColors}
            loading={colorsLoading}
            icon={Palette}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Background Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Page Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={npsEmailBackgroundColor}
                      onChange={(e) => setNpsEmailBackgroundColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={npsEmailBackgroundColor}
                      onChange={(e) => setNpsEmailBackgroundColor(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Card Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Card Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={npsEmailCardColor}
                      onChange={(e) => setNpsEmailCardColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={npsEmailCardColor}
                      onChange={(e) => setNpsEmailCardColor(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={npsEmailTextColor}
                      onChange={(e) => setNpsEmailTextColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={npsEmailTextColor}
                      onChange={(e) => setNpsEmailTextColor(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Button Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Button Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={npsEmailButtonColor}
                      onChange={(e) => setNpsEmailButtonColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={npsEmailButtonColor}
                      onChange={(e) => setNpsEmailButtonColor(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Button Text Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Button Text</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={npsEmailButtonTextColor}
                      onChange={(e) => setNpsEmailButtonTextColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={npsEmailButtonTextColor}
                      onChange={(e) => setNpsEmailButtonTextColor(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Preview</label>
                <div
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 min-h-[200px]"
                  style={{ backgroundColor: npsEmailBackgroundColor }}
                >
                  <div
                    className="rounded-lg p-4 shadow-sm"
                    style={{ backgroundColor: npsEmailCardColor }}
                  >
                    <p className="text-sm font-medium mb-3" style={{ color: npsEmailTextColor }}>
                      Email Preview
                    </p>
                    <p className="text-xs mb-4" style={{ color: npsEmailTextColor, opacity: 0.8 }}>
                      This is how your email content will look.
                    </p>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: npsEmailButtonColor, color: npsEmailButtonTextColor }}
                    >
                      {npsEmailButtonText || 'Share feedback'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Email Content */}
          <SettingsCard
            title="Email Content"
            description="Customise the text content of your NPS emails"
            onSave={saveEmailCustomization}
            loading={emailCustomLoading}
            icon={MessageSquare}
          >
            <div className="space-y-6">
              {/* Email Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={npsEmailSubject}
                  onChange={(e) => setNpsEmailSubject(e.target.value)}
                  placeholder="How was your visit to {venue_name}?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use {'{venue_name}'} to insert your venue name
                </p>
              </div>

              {/* Email Greeting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Greeting
                </label>
                <input
                  type="text"
                  value={npsEmailGreeting}
                  onChange={(e) => setNpsEmailGreeting(e.target.value)}
                  placeholder="Hi {customer_name},"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use {'{customer_name}'} to personalise (shows "there" if name not available)
                </p>
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Body
                </label>
                <textarea
                  value={npsEmailBody}
                  onChange={(e) => setNpsEmailBody(e.target.value)}
                  placeholder="Thanks for joining us..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can use multiple paragraphs. Use {'{venue_name}'} for your venue name.
                </p>
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={npsEmailButtonText}
                  onChange={(e) => setNpsEmailButtonText(e.target.value)}
                  placeholder="Share feedback"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sign-off */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sign-off Text
                  </label>
                  <input
                    type="text"
                    value={npsEmailSignoff}
                    onChange={(e) => setNpsEmailSignoff(e.target.value)}
                    placeholder="Thank you,"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sign-off Name
                  </label>
                  <input
                    type="text"
                    value={npsEmailSignoffName}
                    onChange={(e) => setNpsEmailSignoffName(e.target.value)}
                    placeholder="The Team x"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Preview</p>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><span className="font-medium">Subject:</span> {replacePreviewPlaceholders(npsEmailSubject)}</p>
                  <p><span className="font-medium">Greeting:</span> {replacePreviewPlaceholders(npsEmailGreeting)}</p>
                  <p><span className="font-medium">Body:</span></p>
                  <div className="pl-4 whitespace-pre-wrap text-xs">{replacePreviewPlaceholders(npsEmailBody)}</div>
                  <p><span className="font-medium">Question:</span> {npsQuestion}</p>
                  <p><span className="font-medium">Button:</span> [{npsEmailButtonText}]</p>
                  {(npsEmailSignoff || npsEmailSignoffName) && (
                    <p><span className="font-medium">Sign-off:</span> {npsEmailSignoff} {npsEmailSignoffName}</p>
                  )}
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Footer Links */}
          <SettingsCard
            title="Footer Links"
            description="Add up to 3 footer links (e.g., Privacy Policy, Terms & Conditions)"
            onSave={saveFooterLinks}
            loading={footerLinksLoading}
            icon={Link}
          >
            <div className="space-y-4">
              {[1, 2, 3].map((num) => {
                const textValue = num === 1 ? npsEmailFooterLink1Text : num === 2 ? npsEmailFooterLink2Text : npsEmailFooterLink3Text;
                const urlValue = num === 1 ? npsEmailFooterLink1Url : num === 2 ? npsEmailFooterLink2Url : npsEmailFooterLink3Url;
                const setTextValue = num === 1 ? setNpsEmailFooterLink1Text : num === 2 ? setNpsEmailFooterLink2Text : setNpsEmailFooterLink3Text;
                const setUrlValue = num === 1 ? setNpsEmailFooterLink1Url : num === 2 ? setNpsEmailFooterLink2Url : setNpsEmailFooterLink3Url;

                return (
                  <div key={num} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Link {num} Text
                      </label>
                      <input
                        type="text"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder="e.g., Privacy Policy"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Link {num} URL
                      </label>
                      <input
                        type="url"
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Leave empty to hide. Links will appear in the email footer.
              </p>
            </div>
          </SettingsCard>

          {/* Send Test Email */}
          <SettingsCard
            title="Test Your Email"
            description="Send a preview of your NPS email to yourself"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Send a test email with your current settings to see how it looks.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Make sure to save your changes before sending a test.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={sendTestEmail}
                disabled={sendingTestEmail}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </SettingsCard>

          {/* NPS Review Prompt Threshold */}
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
        </>
      )}
    </div>
  );
};

export default NPSSettings;
