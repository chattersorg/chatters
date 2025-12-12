import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  ImagePlus,
  X,
  Pencil
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const DIETARY_TAGS = [
  { code: 'V', label: 'Vegetarian', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { code: 'VG', label: 'Vegan', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { code: 'GF', label: 'Gluten Free', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { code: 'DF', label: 'Dairy Free', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { code: 'N', label: 'Contains Nuts', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
];

const MenuBuilderPage = () => {
  const navigate = useNavigate();
  const { venueId } = useVenue();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  useEffect(() => {
    if (venueId) {
      loadMenu();
    }
  }, [venueId]);

  const loadMenu = async () => {
    setLoading(true);

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select(`
        *,
        menu_items (*)
      `)
      .eq('venue_id', venueId)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error loading menu:', categoriesError);
      setLoading(false);
      return;
    }

    const sortedCategories = (categoriesData || []).map(cat => ({
      ...cat,
      menu_items: (cat.menu_items || []).sort((a, b) => a.display_order - b.display_order)
    }));

    setCategories(sortedCategories);

    // Set first category as active if none selected
    if (sortedCategories.length > 0 && !activeCategory) {
      setActiveCategory(sortedCategories[0].id);
    }

    setLoading(false);
  };

  const addCategory = async () => {
    const newOrder = categories.length;
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        venue_id: venueId,
        name: 'New Category',
        display_order: newOrder,
        is_visible: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      setMessage({ type: 'error', text: 'Failed to add category' });
      return;
    }

    const newCategories = [...categories, { ...data, menu_items: [] }];
    setCategories(newCategories);
    setActiveCategory(data.id);
    // Start editing the new category name
    setEditingCategoryId(data.id);
    setEditingCategoryName('New Category');
  };

  const updateCategory = async (categoryId, field, value) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId ? { ...cat, [field]: value } : cat
    ));

    const { error } = await supabase
      .from('menu_categories')
      .update({ [field]: value })
      .eq('id', categoryId);

    if (error) {
      console.error('Error updating category:', error);
      loadMenu();
    }
  };

  const startEditingCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const saveEditingCategory = async () => {
    if (editingCategoryId && editingCategoryName.trim()) {
      await updateCategory(editingCategoryId, 'name', editingCategoryName.trim());
    }
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category and all its items?')) return;

    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      setMessage({ type: 'error', text: 'Failed to delete category' });
      return;
    }

    const newCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(newCategories);

    // If we deleted the active category, switch to first available
    if (activeCategory === categoryId && newCategories.length > 0) {
      setActiveCategory(newCategories[0].id);
    } else if (newCategories.length === 0) {
      setActiveCategory(null);
    }
  };

  const addItem = async (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    const newOrder = category?.menu_items?.length || 0;

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        category_id: categoryId,
        name: 'New Item',
        description: '',
        price: null,
        dietary_tags: [],
        display_order: newOrder,
        is_available: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      setMessage({ type: 'error', text: 'Failed to add item' });
      return;
    }

    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, menu_items: [...(cat.menu_items || []), data] }
        : cat
    ));
  };

  const updateItem = async (categoryId, itemId, field, value) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            menu_items: cat.menu_items.map(item =>
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : cat
    ));

    const { error } = await supabase
      .from('menu_items')
      .update({ [field]: value })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating item:', error);
      loadMenu();
    }
  };

  const uploadItemImage = async (categoryId, itemId, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${venueId}/menu-items/${itemId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('venue-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('venue-assets')
        .getPublicUrl(fileName);

      await updateItem(categoryId, itemId, 'image_url', publicUrl);
      setMessage({ type: 'success', text: 'Image uploaded!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    }
  };

  const removeItemImage = async (categoryId, itemId, imageUrl) => {
    try {
      const urlParts = imageUrl.split('/venue-assets/');
      if (urlParts[1]) {
        await supabase.storage
          .from('venue-assets')
          .remove([urlParts[1]]);
      }
      await updateItem(categoryId, itemId, 'image_url', null);
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const deleteItem = async (categoryId, itemId) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      setMessage({ type: 'error', text: 'Failed to delete item' });
      return;
    }

    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, menu_items: cat.menu_items.filter(item => item.id !== itemId) }
        : cat
    ));
  };

  const toggleDietaryTag = (categoryId, itemId, tag) => {
    const category = categories.find(cat => cat.id === categoryId);
    const item = category?.menu_items?.find(i => i.id === itemId);
    if (!item) return;

    const currentTags = item.dietary_tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    updateItem(categoryId, itemId, 'dietary_tags', newTags);
  };

  const handleItemDragEnd = async (result) => {
    if (!result.destination || !activeCategory) return;

    setCategories(categories.map(cat => {
      if (cat.id !== activeCategory) return cat;

      const items = Array.from(cat.menu_items);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      const reordered = items.map((item, index) => ({
        ...item,
        display_order: index
      }));

      reordered.forEach(item => {
        supabase
          .from('menu_items')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
      });

      return { ...cat, menu_items: reordered };
    }));
  };

  const previewMenu = () => {
    window.open(`/menu/${venueId}`, '_blank');
  };

  const goBack = () => {
    navigate('/venue-settings/details');
  };

  const activeCategoryData = categories.find(cat => cat.id === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Menu Builder</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create and manage your digital menu</p>
          </div>
        </div>
        <button
          onClick={previewMenu}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ExternalLink className="w-4 h-4" />
          Preview Menu
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {/* Tab Bar */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {categories.map(category => (
            <div key={category.id} className="flex items-center">
              {editingCategoryId === category.id ? (
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  onBlur={saveEditingCategory}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditingCategory();
                    if (e.key === 'Escape') {
                      setEditingCategoryId(null);
                      setEditingCategoryName('');
                    }
                  }}
                  autoFocus
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              ) : (
                <button
                  onClick={() => setActiveCategory(category.id)}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {category.name}
                  {!category.is_visible && (
                    <EyeOff className="w-3 h-3 opacity-50" />
                  )}
                  <span className="text-xs opacity-60">
                    ({category.menu_items?.length || 0})
                  </span>
                </button>
              )}
            </div>
          ))}

          {/* Add Category Button */}
          <button
            onClick={addCategory}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {/* Category Controls (when a category is selected) */}
        {activeCategoryData && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {activeCategoryData.name}
              </span>
              <button
                onClick={() => startEditingCategory(activeCategoryData)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Edit name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateCategory(activeCategoryData.id, 'is_visible', !activeCategoryData.is_visible)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  activeCategoryData.is_visible
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                    : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {activeCategoryData.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {activeCategoryData.is_visible ? 'Visible' : 'Hidden'}
              </button>
              <button
                onClick={() => deleteCategory(activeCategoryData.id)}
                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="p-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No menu categories yet. Add your first category to get started.</p>
              <button
                onClick={addCategory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
          ) : !activeCategoryData ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Select a category to view items</p>
            </div>
          ) : (
            <>
              <DragDropContext onDragEnd={handleItemDragEnd}>
                <Droppable droppableId={`items-${activeCategory}`}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {(activeCategoryData.menu_items || []).map((item, itemIndex) => (
                        <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border rounded-lg p-4 ${
                                snapshot.isDragging
                                  ? 'shadow-md bg-white dark:bg-gray-800'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => updateItem(activeCategory, item.id, 'name', e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                      placeholder="Item name"
                                    />
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500 dark:text-gray-400 text-sm">£</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.price || ''}
                                        onChange={(e) => updateItem(activeCategory, item.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <button
                                      onClick={() => updateItem(activeCategory, item.id, 'is_available', !item.is_available)}
                                      className={`p-2 rounded ${
                                        item.is_available
                                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      }`}
                                      title={item.is_available ? 'Available' : 'Unavailable'}
                                    >
                                      {item.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                      onClick={() => deleteItem(activeCategory, item.id)}
                                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <textarea
                                    value={item.description || ''}
                                    onChange={(e) => updateItem(activeCategory, item.id, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="Short description (shown on menu cards)"
                                    rows={2}
                                  />

                                  <textarea
                                    value={item.long_description || ''}
                                    onChange={(e) => updateItem(activeCategory, item.id, 'long_description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="Detailed description (shown when item is clicked)"
                                    rows={3}
                                  />

                                  {/* Dietary Tags */}
                                  <div className="flex flex-wrap gap-2">
                                    {DIETARY_TAGS.map(tag => {
                                      const isSelected = (item.dietary_tags || []).includes(tag.code);
                                      return (
                                        <button
                                          key={tag.code}
                                          onClick={() => toggleDietaryTag(activeCategory, item.id, tag.code)}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                            isSelected
                                              ? tag.color
                                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                          }`}
                                          title={tag.label}
                                        >
                                          {tag.code}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Image Upload */}
                                  <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    {item.image_url ? (
                                      <div className="relative group">
                                        <img
                                          src={item.image_url}
                                          alt={item.name}
                                          className="w-16 h-16 object-cover rounded-lg"
                                        />
                                        <button
                                          onClick={() => removeItemImage(activeCategory, item.id, item.image_url)}
                                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Remove image"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                                        <ImagePlus className="w-4 h-4" />
                                        <span>Add photo</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => uploadItemImage(activeCategory, item.id, e.target.files?.[0])}
                                          className="hidden"
                                        />
                                      </label>
                                    )}
                                    <span className="text-xs text-gray-400">Optional - displayed on menu</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Add Item Button */}
              <button
                onClick={() => addItem(activeCategory)}
                className="mt-4 flex items-center gap-2 px-3 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-full justify-center border-2 border-dashed border-gray-200 dark:border-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add Item to {activeCategoryData.name}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Changes are saved automatically • Drag items to reorder
        </p>
      </div>
    </div>
  );
};

export default MenuBuilderPage;
