import React, { useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { Button } from '../../ui/button';
import { PermissionGate } from '../../../context/PermissionsContext';

// Helper component to render text with {table} highlighted
const HighlightedInput = ({ value, onChange, placeholder, rows, className }) => {
  const renderHighlightedText = (text) => {
    if (!text) return null;
    return text.split(/(\{table\})/g).map((part, index) =>
      part === '{table}' ? (
        <span
          key={index}
          style={{
            color: '#2F5CFF',
            fontWeight: '600'
          }}
        >
          {'{table}'}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  if (rows) {
    return (
      <div className="relative">
        <div
          className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          {renderHighlightedText(value || '')}
        </div>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`${className} relative bg-transparent`}
          style={{ color: 'transparent', caretColor: 'black' }}
        />
      </div>
    );
  } else {
    return (
      <div className="relative">
        <div
          className="absolute inset-0 pointer-events-none whitespace-pre overflow-hidden px-3 py-2 text-sm text-gray-900 dark:text-white flex items-center"
        >
          {renderHighlightedText(value || '')}
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${className} relative bg-transparent`}
          style={{ color: 'transparent', caretColor: 'black' }}
        />
      </div>
    );
  }
};

// Reusable SettingsCard component matching FeedbackSettings style
const SettingsCard = ({ title, description, children, onSave, loading, message }) => (
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
        <PermissionGate permission="venue.branding">
          <Button
            variant="primary"
            onClick={onSave}
            loading={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </PermissionGate>
      </div>
      {message && (
        <div className={`text-xs p-2 rounded-lg mt-3 ${
          message.includes('success')
            ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
            : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  </div>
);

const BrandingTab = ({
  logo, setLogo,
  backgroundImage, setBackgroundImage,
  primaryColor, setPrimaryColor,
  backgroundColor, setBackgroundColor,
  textColor, setTextColor,
  buttonTextColor, setButtonTextColor,
  assistanceTitle, setAssistanceTitle,
  assistanceMessage, setAssistanceMessage,
  assistanceIcon, setAssistanceIcon,
  thankYouTitle, setThankYouTitle,
  thankYouMessage, setThankYouMessage,
  thankYouIcon, setThankYouIcon,
  venueId
}) => {
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoMessage, setLogoMessage] = useState('');
  const [backgroundImageLoading, setBackgroundImageLoading] = useState(false);
  const [backgroundImageMessage, setBackgroundImageMessage] = useState('');
  const [colorsLoading, setColorsLoading] = useState(false);
  const [colorsMessage, setColorsMessage] = useState('');
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [assistanceUpdateMessage, setAssistanceUpdateMessage] = useState('');
  const [thankYouLoading, setThankYouLoading] = useState(false);
  const [thankYouUpdateMessage, setThankYouUpdateMessage] = useState('');

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !venueId) return;

    setLogoLoading(true);
    setLogoMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${venueId}-logo.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: deleteError } = await supabase.storage
        .from('venue-logos')
        .remove([filePath]);

      if (deleteError && deleteError.message !== 'The resource was not found') {
        throw new Error('Failed to delete existing logo: ' + deleteError.message);
      }

      const { error: uploadError } = await supabase.storage
        .from('venue-logos')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Failed to upload logo: ' + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('venue-logos')
        .getPublicUrl(filePath);

      // Add cache-busting parameter to force browser to load new image
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('venues')
        .update({ logo: cacheBustedUrl })
        .eq('id', venueId);

      if (updateError) {
        throw new Error('Failed to update logo: ' + updateError.message);
      }

      setLogo(cacheBustedUrl);
      setLogoMessage('Logo updated successfully!');
    } catch (error) {
      console.error('Error updating logo:', error);
      setLogoMessage('Failed to update logo: ' + error.message);
    } finally {
      setLogoLoading(false);
    }
  };

  const handleBackgroundImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !venueId) return;

    setBackgroundImageLoading(true);
    setBackgroundImageMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${venueId}-background.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: deleteError } = await supabase.storage
        .from('venue-logos')
        .remove([filePath]);

      if (deleteError && deleteError.message !== 'The resource was not found') {
        throw new Error('Failed to delete existing background: ' + deleteError.message);
      }

      const { error: uploadError } = await supabase.storage
        .from('venue-logos')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Failed to upload background: ' + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('venue-logos')
        .getPublicUrl(filePath);

      // Add cache-busting parameter to force browser to load new image
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('venues')
        .update({ background_image: cacheBustedUrl })
        .eq('id', venueId);

      if (updateError) {
        throw new Error('Failed to update background: ' + updateError.message);
      }

      setBackgroundImage(cacheBustedUrl);
      setBackgroundImageMessage('Background image updated successfully!');
    } catch (error) {
      console.error('Error updating background:', error);
      setBackgroundImageMessage('Failed to update background: ' + error.message);
    } finally {
      setBackgroundImageLoading(false);
    }
  };

  const saveColors = async () => {
    if (!venueId) return;

    setColorsLoading(true);
    setColorsMessage('');

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          primary_color: primaryColor,
          background_color: backgroundColor,
          text_color: textColor,
          button_text_color: buttonTextColor
        })
        .eq('id', venueId);

      if (error) {
        throw new Error('Failed to save colors: ' + error.message);
      }

      setColorsMessage('Colors saved successfully!');
    } catch (error) {
      console.error('Error saving colors:', error);
      setColorsMessage('Failed to save colors: ' + error.message);
    } finally {
      setColorsLoading(false);
    }
  };

  const saveAssistanceSettings = async () => {
    if (!venueId) return;

    setAssistanceLoading(true);
    setAssistanceUpdateMessage('');

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          assistance_title: assistanceTitle,
          assistance_message: assistanceMessage,
          assistance_icon: assistanceIcon
        })
        .eq('id', venueId);

      if (error) {
        throw new Error('Failed to save assistance settings: ' + error.message);
      }

      setAssistanceUpdateMessage('Assistance message settings saved successfully!');
    } catch (error) {
      setAssistanceUpdateMessage('Failed to save assistance settings: ' + error.message);
    } finally {
      setAssistanceLoading(false);
    }
  };

  const saveThankYouSettings = async () => {
    if (!venueId) return;

    setThankYouLoading(true);
    setThankYouUpdateMessage('');

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          thank_you_title: thankYouTitle,
          thank_you_message: thankYouMessage,
          thank_you_icon: thankYouIcon
        })
        .eq('id', venueId);

      if (error) {
        throw new Error('Failed to save thank you settings: ' + error.message);
      }

      setThankYouUpdateMessage('Thank you message settings saved successfully!');
    } catch (error) {
      setThankYouUpdateMessage('Failed to save thank you settings: ' + error.message);
    } finally {
      setThankYouLoading(false);
    }
  };

  const emojiOptions = [
    { value: '🙋', label: 'Hand Raised' },
    { value: '👋', label: 'Waving Hand' },
    { value: '🆘', label: 'SOS' },
    { value: '💁', label: 'Person Tipping' },
    { value: '🤝', label: 'Handshake' },
    { value: '🔔', label: 'Bell' },
    { value: '✋', label: 'Raised Hand' },
    { value: '🚨', label: 'Alert' }
  ];

  const thankYouEmojiOptions = [
    { value: '✅', label: 'Check Mark' },
    { value: '👍', label: 'Thumbs Up' },
    { value: '❤️', label: 'Heart' },
    { value: '😊', label: 'Smile' },
    { value: '🎉', label: 'Party' },
    { value: '⭐', label: 'Star' },
    { value: '🙏', label: 'Thank You' },
    { value: '💯', label: 'Perfect' }
  ];

  return (
    <div className="space-y-6">
      {/* Logo & Background Image - 2 Column Layout */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Branding Assets</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload your venue's logo and splash page background</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logo</label>
              <div className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-24 h-24 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm mb-3"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-3">
                    <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-2">No logo</span>
                  </div>
                )}
                <PermissionGate permission="venue.branding">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoLoading}
                    id="logo-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                      logoLoading
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2548CC] text-white hover:bg-[#1e3ba8]'
                    }`}
                  >
                    {logoLoading ? 'Uploading...' : 'Upload Logo'}
                  </label>
                </PermissionGate>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Square image, min 100x100px
                </p>
                {logoMessage && (
                  <p className={`text-xs mt-2 ${logoMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {logoMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Background Image Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Splash Page Background</label>
              <div className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {backgroundImage ? (
                  <img
                    src={backgroundImage}
                    alt="Background"
                    className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-3"
                  />
                ) : (
                  <div className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-3">
                    <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-2">No background image</span>
                  </div>
                )}
                <PermissionGate permission="venue.branding">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    disabled={backgroundImageLoading}
                    id="background-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="background-upload"
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                      backgroundImageLoading
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2548CC] text-white hover:bg-[#1e3ba8]'
                    }`}
                  >
                    {backgroundImageLoading ? 'Uploading...' : 'Upload Background'}
                  </label>
                </PermissionGate>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Landscape image, 1920x1080px recommended
                </p>
                {backgroundImageMessage && (
                  <p className={`text-xs mt-2 ${backgroundImageMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {backgroundImageMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Images are saved automatically when uploaded
          </div>
        </div>
      </div>

      {/* Brand Colors */}
      <SettingsCard
        title="Brand Colors"
        description="Customize the colors used on your feedback pages"
        onSave={saveColors}
        loading={colorsLoading}
        message={colorsMessage}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Color Pickers - Narrow Column */}
          <div className="md:w-1/3 flex-shrink-0">
            <div className="space-y-3">
              {/* Primary Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Text</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Button Text Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Button Text</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview - Takes up remaining 2/3 */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Preview</label>
            <div
              className="rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center p-6 h-full min-h-[180px]"
              style={
                backgroundImage
                  ? {
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }
                  : { backgroundColor: backgroundColor }
              }
            >
              <div className="bg-white rounded-xl shadow-lg p-5 max-w-xs w-full">
                <p className="text-sm font-medium mb-3" style={{ color: textColor }}>
                  Feedback Page Preview
                </p>
                <button
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Confirmation Messages - Combined Assistance & Thank You */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Confirmation Messages</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize the messages customers see after actions</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assistance Message Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Assistance Request</h4>
                <PermissionGate permission="venue.branding">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveAssistanceSettings}
                    loading={assistanceLoading}
                    className="text-xs px-2 py-1"
                  >
                    {assistanceLoading ? 'Saving...' : 'Save'}
                  </Button>
                </PermissionGate>
              </div>

              {/* Emoji Selection - Compact */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Emoji</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {emojiOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAssistanceIcon(option.value)}
                      className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                        assistanceIcon === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      title={option.label}
                    >
                      <span className="text-xl">{option.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Message */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title</label>
                <HighlightedInput
                  value={assistanceTitle}
                  onChange={(e) => setAssistanceTitle(e.target.value)}
                  placeholder="Help is on the way!"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Message</label>
                <HighlightedInput
                  value={assistanceMessage}
                  onChange={(e) => setAssistanceMessage(e.target.value)}
                  placeholder="We've notified our team..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Use {'{table}'} for table number</p>
              </div>

              {assistanceUpdateMessage && (
                <p className={`text-xs ${assistanceUpdateMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {assistanceUpdateMessage}
                </p>
              )}
            </div>

            {/* Thank You Message Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Thank You</h4>
                <PermissionGate permission="venue.branding">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveThankYouSettings}
                    loading={thankYouLoading}
                    className="text-xs px-2 py-1"
                  >
                    {thankYouLoading ? 'Saving...' : 'Save'}
                  </Button>
                </PermissionGate>
              </div>

              {/* Emoji Selection - Compact */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Emoji</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {thankYouEmojiOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setThankYouIcon(option.value)}
                      className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                        thankYouIcon === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      title={option.label}
                    >
                      <span className="text-xl">{option.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Message */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={thankYouTitle}
                  onChange={(e) => setThankYouTitle(e.target.value)}
                  placeholder="Thanks for your feedback!"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Message</label>
                <textarea
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  placeholder="Your response has been submitted..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {thankYouUpdateMessage && (
                <p className={`text-xs ${thankYouUpdateMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {thankYouUpdateMessage}
                </p>
              )}
            </div>
          </div>

          {/* Shared Preview Section */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Preview</label>
            <div
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center gap-6"
              style={
                backgroundImage
                  ? {
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }
                  : { backgroundColor: backgroundColor }
              }
            >
              {/* Assistance Preview */}
              <div className="bg-white rounded-xl shadow-lg p-4 w-44 flex-shrink-0">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl mb-2">{assistanceIcon || '🙋'}</div>
                  <h2 className="text-xs font-bold mb-1" style={{ color: textColor }}>
                    {(assistanceTitle || 'Help is on the way!').substring(0, 25)}{(assistanceTitle || '').length > 25 ? '...' : ''}
                  </h2>
                  <p className="text-xs leading-tight" style={{ color: textColor, opacity: 0.7 }}>
                    {(assistanceMessage || 'We\'ve notified our team...').substring(0, 40)}...
                  </p>
                </div>
              </div>

              {/* Thank You Preview */}
              <div className="bg-white rounded-xl shadow-lg p-4 w-44 flex-shrink-0">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl mb-2">{thankYouIcon || '✅'}</div>
                  <h2 className="text-xs font-bold mb-1" style={{ color: textColor }}>
                    {(thankYouTitle || 'Thanks for your feedback!').substring(0, 25)}{(thankYouTitle || '').length > 25 ? '...' : ''}
                  </h2>
                  <p className="text-xs leading-tight" style={{ color: textColor, opacity: 0.7 }}>
                    {(thankYouMessage || 'Your response has been submitted.').substring(0, 40)}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Each message type saves independently
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingTab;
