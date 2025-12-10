import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';

const DIETARY_TAGS = {
  V: { label: 'Vegetarian', color: 'bg-green-100 text-green-700' },
  VG: { label: 'Vegan', color: 'bg-emerald-100 text-emerald-700' },
  GF: { label: 'Gluten Free', color: 'bg-amber-100 text-amber-700' },
  DF: { label: 'Dairy Free', color: 'bg-blue-100 text-blue-700' },
  N: { label: 'Contains Nuts', color: 'bg-red-100 text-red-700' }
};

const PublicMenuPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenu();
  }, [venueId]);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);

    // Load venue info
    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .select('name, logo, primary_color, background_color, text_color, menu_type, menu_url, menu_pdf_url')
      .eq('id', venueId)
      .single();

    if (venueError || !venueData) {
      setError('Menu not found');
      setLoading(false);
      return;
    }

    setVenue(venueData);

    // Handle different menu types
    if (venueData.menu_type === 'link' && venueData.menu_url) {
      // Redirect to external menu
      window.location.href = venueData.menu_url.startsWith('http')
        ? venueData.menu_url
        : `https://${venueData.menu_url}`;
      return;
    }

    if (venueData.menu_type === 'pdf' && venueData.menu_pdf_url) {
      // Redirect to PDF
      window.location.href = venueData.menu_pdf_url;
      return;
    }

    if (venueData.menu_type === 'builder') {
      // Load menu categories and items
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('venue_id', venueId)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (categoriesError) {
        console.error('Error loading menu:', categoriesError);
        setError('Failed to load menu');
        setLoading(false);
        return;
      }

      // Filter to only available items and sort them
      const processedCategories = (categoriesData || [])
        .map(cat => ({
          ...cat,
          menu_items: (cat.menu_items || [])
            .filter(item => item.is_available)
            .sort((a, b) => a.display_order - b.display_order)
        }))
        .filter(cat => cat.menu_items.length > 0); // Only show categories with items

      setCategories(processedCategories);
    }

    setLoading(false);
  };

  const goBack = () => {
    navigate(`/feedback/${venueId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={goBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!venue || venue.menu_type === 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No menu available</p>
          <button
            onClick={goBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = venue.primary_color || '#1890ff';
  const backgroundColor = venue.background_color || '#ffffff';
  const textColor = venue.text_color || '#111827';

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={goBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: textColor }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {venue.logo && (
            <img
              src={venue.logo}
              alt={venue.name}
              className="h-10 w-auto object-contain"
            />
          )}
          <div className="flex-1">
            <h1 className="font-semibold" style={{ color: textColor }}>
              {venue.name}
            </h1>
            <p className="text-sm text-gray-500">Menu</p>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Dietary Legend */}
        <div className="mb-6 p-4 bg-white rounded-xl border">
          <p className="text-xs font-medium text-gray-500 mb-2">Dietary Information</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DIETARY_TAGS).map(([code, tag]) => (
              <span
                key={code}
                className={`px-2 py-1 rounded text-xs font-medium ${tag.color}`}
              >
                {code} = {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No menu items available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(category => (
              <div key={category.id}>
                <h2
                  className="text-xl font-bold mb-4 pb-2 border-b-2"
                  style={{ color: textColor, borderColor: primaryColor }}
                >
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                )}
                <div className="space-y-4">
                  {category.menu_items.map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-4 border shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className="font-semibold"
                              style={{ color: textColor }}
                            >
                              {item.name}
                            </h3>
                            {(item.dietary_tags || []).map(tag => (
                              <span
                                key={tag}
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${DIETARY_TAGS[tag]?.color || 'bg-gray-100 text-gray-600'}`}
                                title={DIETARY_TAGS[tag]?.label}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.price !== null && (
                          <div
                            className="text-lg font-bold whitespace-nowrap"
                            style={{ color: primaryColor }}
                          >
                            £{item.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center pb-8">
          <p className="text-xs text-gray-400">
            Powered by Chatters
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicMenuPage;
