import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink
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
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

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

    const expanded = {};
    sortedCategories.forEach(cat => {
      expanded[cat.id] = true;
    });
    setExpandedCategories(expanded);

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

    setCategories([...categories, { ...data, menu_items: [] }]);
    setExpandedCategories({ ...expandedCategories, [data.id]: true });
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

    setCategories(categories.filter(cat => cat.id !== categoryId));
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

  const handleCategoryDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reordered = items.map((item, index) => ({
      ...item,
      display_order: index
    }));

    setCategories(reordered);

    for (const cat of reordered) {
      await supabase
        .from('menu_categories')
        .update({ display_order: cat.display_order })
        .eq('id', cat.id);
    }
  };

  const handleItemDragEnd = async (categoryId, result) => {
    if (!result.destination) return;

    setCategories(categories.map(cat => {
      if (cat.id !== categoryId) return cat;

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

  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId]
    });
  };

  const previewMenu = () => {
    window.open(`/menu/${venueId}`, '_blank');
  };

  const goBack = () => {
    navigate('/settings/venue-details');
  };

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

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <strong>Tip:</strong> Changes are saved automatically. Drag categories and items to reorder them.
          Toggle the eye icon to show/hide items from customers.
        </p>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No menu categories yet. Add your first category to get started.</p>
          <button
            onClick={addCategory}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleCategoryDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {categories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden ${
                          snapshot.isDragging ? 'shadow-lg' : 'border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        {/* Category Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <div
                            {...provided.dragHandleProps}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                            className="flex-1 font-medium text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0"
                            placeholder="Category name"
                          />
                          <button
                            onClick={() => updateCategory(category.id, 'is_visible', !category.is_visible)}
                            className={`p-1.5 rounded ${
                              category.is_visible
                                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={category.is_visible ? 'Visible' : 'Hidden'}
                          >
                            {category.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleCategoryExpanded(category.id)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {expandedCategories[category.id] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Category Items */}
                        {expandedCategories[category.id] && (
                          <div className="p-4">
                            <DragDropContext onDragEnd={(result) => handleItemDragEnd(category.id, result)}>
                              <Droppable droppableId={`items-${category.id}`}>
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-3"
                                  >
                                    {(category.menu_items || []).map((item, itemIndex) => (
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
                                                    onChange={(e) => updateItem(category.id, item.id, 'name', e.target.value)}
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
                                                      onChange={(e) => updateItem(category.id, item.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                                                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                      placeholder="0.00"
                                                    />
                                                  </div>
                                                  <button
                                                    onClick={() => updateItem(category.id, item.id, 'is_available', !item.is_available)}
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
                                                    onClick={() => deleteItem(category.id, item.id)}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                    title="Delete item"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>

                                                <textarea
                                                  value={item.description || ''}
                                                  onChange={(e) => updateItem(category.id, item.id, 'description', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                  placeholder="Description (optional)"
                                                  rows={2}
                                                />

                                                {/* Dietary Tags */}
                                                <div className="flex flex-wrap gap-2">
                                                  {DIETARY_TAGS.map(tag => {
                                                    const isSelected = (item.dietary_tags || []).includes(tag.code);
                                                    return (
                                                      <button
                                                        key={tag.code}
                                                        onClick={() => toggleDietaryTag(category.id, item.id, tag.code)}
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

                            <button
                              onClick={() => addItem(category.id)}
                              className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-full justify-center border-2 border-dashed border-gray-200 dark:border-gray-700"
                            >
                              <Plus className="w-4 h-4" />
                              Add Item
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {categories.length > 0 && (
        <button
          onClick={addCategory}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl w-full justify-center border-2 border-dashed border-gray-300 dark:border-gray-700"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      )}

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Changes are saved automatically
        </p>
      </div>
    </div>
  );
};

export default MenuBuilderPage;
