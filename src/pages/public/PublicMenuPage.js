import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ArrowLeft, Loader2, Search, X } from 'lucide-react';

const DIETARY_TAGS = {
  V: { label: 'Vegetarian', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  VG: { label: 'Vegan', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  GF: { label: 'Gluten Free', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  DF: { label: 'Dairy Free', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  N: { label: 'Contains Nuts', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
};

const PublicMenuPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const categoryTabsRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadMenu();
  }, [venueId]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);

    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .select('name, logo, primary_color, background_color, text_color, menu_type, menu_url, menu_pdf_url, menu_show_images')
      .eq('id', venueId)
      .single();

    if (venueError || !venueData) {
      setError('Menu not found');
      setLoading(false);
      return;
    }

    setVenue(venueData);

    if (venueData.menu_type === 'link' && venueData.menu_url) {
      window.location.href = venueData.menu_url.startsWith('http')
        ? venueData.menu_url
        : `https://${venueData.menu_url}`;
      return;
    }

    if (venueData.menu_type === 'pdf' && venueData.menu_pdf_url) {
      window.location.href = venueData.menu_pdf_url;
      return;
    }

    if (venueData.menu_type === 'builder') {
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

      const processedCategories = (categoriesData || [])
        .map(cat => ({
          ...cat,
          menu_items: (cat.menu_items || [])
            .filter(item => item.is_available)
            .sort((a, b) => a.display_order - b.display_order)
        }))
        .filter(cat => cat.menu_items.length > 0);

      setCategories(processedCategories);
    }

    setLoading(false);
  };

  const goBack = () => {
    navigate(`/feedback/${venueId}`);
  };

  const getAllItems = () => {
    return categories.flatMap(cat =>
      cat.menu_items.map(item => ({ ...item, categoryName: cat.name }))
    );
  };

  const getFilteredItems = () => {
    let items = activeCategory === 'all'
      ? getAllItems()
      : categories.find(c => c.id === activeCategory)?.menu_items || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    return items;
  };

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={goBack}
            className="text-gray-900 hover:text-gray-700 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!venue || venue.menu_type === 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No menu available</p>
          <button
            onClick={goBack}
            className="text-gray-900 hover:text-gray-700 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
              </div>
            </div>
            {venue.logo && (
              <img
                src={venue.logo}
                alt={venue.name}
                className="h-10 w-auto object-contain"
              />
            )}
          </div>

          {/* Search Bar */}
          <div className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div
            ref={categoryTabsRef}
            className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => scrollToCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Dietary Legend - Compact */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(DIETARY_TAGS).map(([code, tag]) => (
            <div key={code} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${tag.dot}`}></span>
              <span className="text-xs text-gray-500">{code}</span>
            </div>
          ))}
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? 'No items match your search' : 'No menu items available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Item Image - only show if venue has images enabled */}
                {venue.menu_show_images && (
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">🍽️</span>
                    )}
                  </div>
                )}

                {/* Item Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                    {item.name}
                  </h3>

                  {/* Dietary Tags */}
                  {item.dietary_tags && item.dietary_tags.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {item.dietary_tags.map(tag => (
                        <span
                          key={tag}
                          className={`w-2 h-2 rounded-full ${DIETARY_TAGS[tag]?.dot || 'bg-gray-400'}`}
                          title={DIETARY_TAGS[tag]?.label}
                        />
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  {item.price !== null && (
                    <p className="text-lg font-bold text-gray-900">
                      £{item.price.toFixed(2)}
                    </p>
                  )}
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
