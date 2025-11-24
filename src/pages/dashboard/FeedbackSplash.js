import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { MessageSquare, ExternalLink as ExternalLinkIcon } from 'lucide-react';

const FeedbackSplashPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenueData();
  }, [venueId]);

  const loadVenueData = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('name, logo, primary_color, background_color, text_color, button_text_color, custom_links, background_image')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error loading venue:', error);
      // If error, go straight to feedback
      navigate(`/feedback/${venueId}/form`, { replace: true });
      return;
    }

    const enabledLinks = (data.custom_links || []).filter(link => link.enabled && link.url);

    console.log('Venue data:', data);
    console.log('Enabled links:', enabledLinks);

    // If no custom links are enabled, go straight to feedback
    if (enabledLinks.length === 0) {
      console.log('No enabled links, redirecting to form');
      navigate(`/feedback/${venueId}/form`, { replace: true });
      return;
    }

    setVenue({ ...data, enabledLinks });
    setLoading(false);
  };

  const handleLeaveFeedback = () => {
    navigate(`/feedback/${venueId}/form`);
  };

  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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
              Welcome to {venue.name}
            </h1>
            <p className="text-sm text-gray-600">
              What would you like to do?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Leave Feedback Button - Always First */}
            <button
              onClick={handleLeaveFeedback}
              className="w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-3"
              style={{
                backgroundColor: primaryColor,
                color: buttonTextColor
              }}
            >
              <MessageSquare className="w-6 h-6" />
              Leave Feedback
            </button>

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
              Powered by Chatters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSplashPage;
