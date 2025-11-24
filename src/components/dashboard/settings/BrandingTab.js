import React, { useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { Button } from '../../ui/button';

// Helper component to render text with {table} highlighted
const HighlightedInput = ({ value, onChange, placeholder, rows, className }) => {
  const renderHighlightedText = (text) => {
    if (!text) return null;
    return text.split(/(\{table\})/g).map((part, index) =>
      part === '{table}' ? (
        <span
          key={index}
          className="inline-block px-1 rounded"
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
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
          className={`${className} absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden`}
          style={{ color: '#111827' }}
        >
          {renderHighlightedText(value || '')}
        </div>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`${className} relative`}
          style={{ color: 'transparent', caretColor: 'black', backgroundColor: 'transparent' }}
        />
      </div>
    );
  } else {
    return (
      <div className="relative">
        <div
          className={`${className} absolute inset-0 pointer-events-none whitespace-pre overflow-hidden`}
          style={{ color: '#111827' }}
        >
          {renderHighlightedText(value || '')}
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${className} relative`}
          style={{ color: 'transparent', caretColor: 'black', backgroundColor: 'transparent' }}
        />
      </div>
    );
  }
};

// Reusable SettingsCard component matching FeedbackSettings style
const SettingsCard = ({ title, description, children, onSave, loading, message }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <div className="p-6">
      {children}
    </div>
    <div className="px-6 py-4 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Changes are saved per venue
        </div>
        <Button
          variant="primary"
          onClick={onSave}
          loading={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
      {message && (
        <div className={`text-xs p-2 rounded-lg mt-3 ${
          message.includes('success')
            ? 'text-green-700 bg-green-50 border border-green-200'
            : 'text-red-700 bg-red-50 border border-red-200'
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

      const { error: updateError } = await supabase
        .from('venues')
        .update({ logo: publicUrl })
        .eq('id', venueId);

      if (updateError) {
        throw new Error('Failed to update logo: ' + updateError.message);
      }

      setLogo(publicUrl);
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

      const { error: updateError } = await supabase
        .from('venues')
        .update({ background_image: publicUrl })
        .eq('id', venueId);

      if (updateError) {
        throw new Error('Failed to update background: ' + updateError.message);
      }

      setBackgroundImage(publicUrl);
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
      {/* Logo Upload */}
      <SettingsCard
        title="Logo"
        description="Upload your venue's logo for branding"
        onSave={() => {}}
        loading={logoLoading}
        message={logoMessage}
      >
        <div className="flex items-center space-x-4">
          {logo && (
            <div className="flex-shrink-0">
              <img
                src={logo}
                alt="Logo"
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={logoLoading}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2548CC] file:text-white hover:file:bg-[#1e3ba8] cursor-pointer disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-2">
              Square image, minimum 100x100px recommended
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Background Image */}
      <SettingsCard
        title="Splash Page Background Image"
        description="Upload a background image for your feedback splash page (optional)"
        onSave={() => {}}
        loading={backgroundImageLoading}
        message={backgroundImageMessage}
      >
        <div className="flex items-center space-x-4">
          {backgroundImage && (
            <div className="flex-shrink-0">
              <img
                src={backgroundImage}
                alt="Background"
                className="w-32 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageUpload}
              disabled={backgroundImageLoading}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2548CC] file:text-white hover:file:bg-[#1e3ba8] cursor-pointer disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-2">
              Landscape image, 1920x1080px or larger recommended. Leave empty to use solid background color.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Brand Colors */}
      <SettingsCard
        title="Brand Colors"
        description="Customize the colors used on your feedback pages"
        onSave={saveColors}
        loading={colorsLoading}
        message={colorsMessage}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#111827"
                />
              </div>
            </div>

            {/* Button Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={buttonTextColor}
                  onChange={(e) => setButtonTextColor(e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={buttonTextColor}
                  onChange={(e) => setButtonTextColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div
              className="p-8 rounded-lg border border-gray-200 flex items-center justify-center min-h-[200px]"
              style={
                backgroundImage
                  ? {
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }
                  : { backgroundColor: backgroundColor }
              }
            >
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full">
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

      {/* Assistance Request Message */}
      <SettingsCard
        title="Assistance Request Message"
        description="Customize the message customers see after requesting assistance"
        onSave={saveAssistanceSettings}
        loading={assistanceLoading}
        message={assistanceUpdateMessage}
      >
        <div className="space-y-6">
          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Emoji</label>
            <div className="grid grid-cols-4 gap-3">
              {emojiOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAssistanceIcon(option.value)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    assistanceIcon === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-1">{option.value}</div>
                  <span className="text-xs font-medium text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <HighlightedInput
              value={assistanceTitle}
              onChange={(e) => setAssistanceTitle(e.target.value)}
              placeholder="Help is on the way!"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <HighlightedInput
              value={assistanceMessage}
              onChange={(e) => setAssistanceMessage(e.target.value)}
              placeholder="We've notified our team that you need assistance. Someone will be with you shortly."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {'{table}'} as a placeholder for the table number
            </p>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div
              className="rounded-lg p-8 border border-gray-200 flex items-center justify-center min-h-[250px]"
              style={
                backgroundImage
                  ? {
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }
                  : { backgroundColor: backgroundColor }
              }
            >
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full">
                <div className="flex flex-col items-center text-center">
                  <div className="text-5xl mb-4">
                    {assistanceIcon || '🙋'}
                  </div>
                  <h2 className="text-lg font-bold mb-2" style={{ color: textColor }}>
                    {(assistanceTitle || 'Help is on the way!')
                      .split(/(\{table\})/g)
                      .map((part, index) =>
                        part === '{table}' ? (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 rounded mx-1"
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              fontWeight: '600'
                            }}
                          >
                            14
                          </span>
                        ) : part
                      )
                    }
                  </h2>
                  <p className="text-sm" style={{ color: textColor, opacity: 0.8 }}>
                    {(assistanceMessage || 'We\'ve notified our team that you need assistance. Someone will be with you shortly.')
                      .split(/(\{table\})/g)
                      .map((part, index) =>
                        part === '{table}' ? (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 rounded mx-1"
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              fontWeight: '600'
                            }}
                          >
                            14
                          </span>
                        ) : part
                      )
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Thank You Message */}
      <SettingsCard
        title="Thank You Message"
        description="Customize the message customers see after submitting feedback"
        onSave={saveThankYouSettings}
        loading={thankYouLoading}
        message={thankYouUpdateMessage}
      >
        <div className="space-y-6">
          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Emoji</label>
            <div className="grid grid-cols-4 gap-3">
              {thankYouEmojiOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setThankYouIcon(option.value)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    thankYouIcon === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-1">{option.value}</div>
                  <span className="text-xs font-medium text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={thankYouTitle}
              onChange={(e) => setThankYouTitle(e.target.value)}
              placeholder="Thanks for your feedback!"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              placeholder="Your response has been submitted successfully."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div
              className="rounded-lg p-8 border border-gray-200 flex items-center justify-center min-h-[250px]"
              style={
                backgroundImage
                  ? {
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }
                  : { backgroundColor: backgroundColor }
              }
            >
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full">
                <div className="flex flex-col items-center text-center">
                  <div className="text-5xl mb-4">
                    {thankYouIcon || '✅'}
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: textColor }}>
                    {thankYouTitle || 'Thanks for your feedback!'}
                  </h2>
                  <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                    {thankYouMessage || 'Your response has been submitted successfully.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

export default BrandingTab;
