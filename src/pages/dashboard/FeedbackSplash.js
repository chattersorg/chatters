import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { MessageSquare, ExternalLink as ExternalLinkIcon, Utensils } from 'lucide-react';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../../components/ui/LanguageSelector';

const FeedbackSplashContent = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenueData();
  }, [venueId]);

  const loadVenueData = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('name, logo, primary_color, background_color, text_color, button_text_color, custom_links, background_image, menu_type, menu_url, menu_pdf_url')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error loading venue:', error);
      // If error, go straight to feedback
      navigate(`/feedback/${venueId}/form`, { replace: true });
      return;
    }

    // Filter out the old 'menu' link (now handled separately) and only include enabled links with URLs
    const enabledLinks = (data.custom_links || []).filter(link => link.id !== 'menu' && link.enabled && link.url);
    const hasMenu = data.menu_type && data.menu_type !== 'none';

    // If no custom links are enabled AND no menu configured, go straight to feedback
    if (enabledLinks.length === 0 && !hasMenu) {
      navigate(`/feedback/${venueId}/form`, { replace: true });
      return;
    }

    setVenue({ ...data, enabledLinks, hasMenu });
    setLoading(false);
  };

  const handleLeaveFeedback = () => {
    navigate(`/feedback/${venueId}/form`);
  };

  const handleViewMenu = () => {
    if (venue.menu_type === 'link' && venue.menu_url) {
      // External link - open in new tab
      const url = venue.menu_url.startsWith('http')
        ? venue.menu_url
        : `https://${venue.menu_url}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (venue.menu_type === 'pdf' && venue.menu_pdf_url) {
      // PDF - open in new tab
      window.open(venue.menu_pdf_url, '_blank', 'noopener,noreferrer');
    } else if (venue.menu_type === 'builder') {
      // Built-in menu - navigate to menu page
      navigate(`/menu/${venueId}`);
    }
  };

  const handleLinkClick = (url) => {
    // Ensure URL has a protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!venue) return null;

  const primaryColor = venue.primary_color || '#1890ff';
  const backgroundColor = venue.background_color || '#ffffff';
  const textColor = venue.text_color || '#111827';
  const buttonTextColor = venue.button_text_color || '#ffffff';
  const backgroundImage = venue.background_image;

  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : { backgroundColor };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={backgroundStyle}
    >
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Venue Logo and Name */}
          <div className="text-center space-y-4">
            {venue.logo && (
              <img
                src={venue.logo}
                alt={venue.name}
                className="h-20 w-auto mx-auto object-contain"
              />
            )}
            <h1 className="text-2xl font-bold" style={{ color: textColor }}>
              {t('welcomeTo')} {venue.name}
            </h1>
            <p className="text-sm text-gray-600">
              {t('whatWouldYouLikeToDo')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Leave Feedback Button - Always first */}
            <button
              onClick={handleLeaveFeedback}
              className="w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-3"
              style={{
                backgroundColor: primaryColor,
                color: buttonTextColor
              }}
            >
              <MessageSquare className="w-6 h-6" />
              {t('leaveFeedback')}
            </button>

            {/* View Menu Button */}
            {venue.hasMenu && (
              <button
                onClick={handleViewMenu}
                className="w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-3"
                style={{
                  backgroundColor: primaryColor,
                  color: buttonTextColor
                }}
              >
                <Utensils className="w-6 h-6" />
                {t('viewMenu')}
                {(venue.menu_type === 'link' || venue.menu_type === 'pdf') && (
                  <ExternalLinkIcon className="w-5 h-5 opacity-70" />
                )}
              </button>
            )}

            {/* Custom Links */}
            {venue.enabledLinks
              .sort((a, b) => a.order - b.order)
              .map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.url)}
                  className="w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-3"
                  style={{
                    backgroundColor: primaryColor,
                    color: buttonTextColor
                  }}
                >
                  {link.label}
                  <ExternalLinkIcon className="w-5 h-5 opacity-70" />
                </button>
              ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500">
              {t('poweredBy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with LanguageProvider
const FeedbackSplashPage = () => (
  <LanguageProvider>
    <FeedbackSplashContent />
  </LanguageProvider>
);

export default FeedbackSplashPage;
