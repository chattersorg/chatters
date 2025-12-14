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

const CURRENCY_SYMBOLS = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  RON: 'lei',
};

// Item Detail Modal Component
const ItemDetailModal = ({ item, onClose, currencySymbol = '£' }) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal Content */}
      <div
        className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Image */}
        {item.image_url && (
          <div className="w-full aspect-[4/3] bg-gray-100">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            {item.price !== null && (
              <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
                {currencySymbol}{item.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Dietary Tags */}
          {item.dietary_tags && item.dietary_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.dietary_tags.map(tag => (
                <span
                  key={tag}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${DIETARY_TAGS[tag]?.color || 'bg-gray-100 text-gray-600'}`}
                >
                  {DIETARY_TAGS[tag]?.label || tag}
                </span>
              ))}
            </div>
          )}

          {/* Short Description */}
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}

          {/* Long Description / Additional Info */}
          {item.long_description && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-gray-600 whitespace-pre-wrap">{item.long_description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('£');
  const categoryTabsRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadMenu();
  }, [venueId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);

    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .select('name, logo, primary_color, background_color, text_color, menu_type, menu_url, menu_pdf_url, menu_currency')
      .eq('id', venueId)
      .single();

    if (venueError || !venueData) {
      setError('Menu not found');
      setLoading(false);
      return;
    }

    setVenue(venueData);

    // Set currency symbol from venue settings
    if (venueData.menu_currency) {
      setCurrencySymbol(CURRENCY_SYMBOLS[venueData.menu_currency] || '£');
    }

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
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
              >
                {/* Item Image - only show if item has an image */}
                {item.image_url && (
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Item Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                    {item.name}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

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
                      {currencySymbol}{item.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </button>
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

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};

export default PublicMenuPage;
