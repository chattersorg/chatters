import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import {
  X,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const DIETARY_TAGS = [
  { code: 'V', label: 'Vegetarian', color: 'bg-green-100 text-green-700' },
  { code: 'VG', label: 'Vegan', color: 'bg-emerald-100 text-emerald-700' },
  { code: 'GF', label: 'Gluten Free', color: 'bg-amber-100 text-amber-700' },
  { code: 'DF', label: 'Dairy Free', color: 'bg-blue-100 text-blue-700' },
  { code: 'N', label: 'Contains Nuts', color: 'bg-red-100 text-red-700' }
];

const MenuBuilder = ({ venueId, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadMenu();
  }, [venueId]);

  const loadMenu = async () => {
    setLoading(true);

    // Load categories with their items
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

    // Sort items within each category
    const sortedCategories = (categoriesData || []).map(cat => ({
      ...cat,
      menu_items: (cat.menu_items || []).sort((a, b) => a.display_order - b.display_order)
    }));

    setCategories(sortedCategories);

    // Expand all categories by default
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
    // Optimistic update
    setCategories(categories.map(cat =>
      cat.id === categoryId ? { ...cat, [field]: value } : cat
    ));

    const { error } = await supabase
      .from('menu_categories')
      .update({ [field]: value })
      .eq('id', categoryId);

    if (error) {
      console.error('Error updating category:', error);
      loadMenu(); // Reload on error
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
    // Optimistic update
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
      loadMenu(); // Reload on error
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

    // Update display order
    const reordered = items.map((item, index) => ({
      ...item,
      display_order: index
    }));

    setCategories(reordered);

    // Save to database
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

      // Save to database (async, don't await)
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Menu Builder</h2>
            <p className="text-sm text-gray-500">Create and manage your digital menu</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={previewMenu}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No menu categories yet. Add your first category to get started.</p>
              <button
                onClick={addCategory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
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
                            className={`bg-white border rounded-xl overflow-hidden ${
                              snapshot.isDragging ? 'shadow-lg' : 'border-gray-200'
                            }`}
                          >
                            {/* Category Header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600 cursor-grab"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <input
                                type="text"
                                value={category.name}
                                onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                                className="flex-1 font-medium text-gray-900 bg-transparent border-none focus:ring-0 p-0"
                                placeholder="Category name"
                              />
                              <button
                                onClick={() => updateCategory(category.id, 'is_visible', !category.is_visible)}
                                className={`p-1.5 rounded ${
                                  category.is_visible
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={category.is_visible ? 'Visible' : 'Hidden'}
                              >
                                {category.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteCategory(category.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Delete category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleCategoryExpanded(category.id)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
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
                                                  snapshot.isDragging ? 'shadow-md bg-white' : 'bg-gray-50'
                                                }`}
                                              >
                                                <div className="flex items-start gap-3">
                                                  <div
                                                    {...provided.dragHandleProps}
                                                    className="mt-2 text-gray-400 hover:text-gray-600 cursor-grab"
                                                  >
                                                    <GripVertical className="w-4 h-4" />
                                                  </div>

                                                  <div className="flex-1 space-y-3">
                                                    <div className="flex items-start gap-3">
                                                      <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(category.id, item.id, 'name', e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Item name"
                                                      />
                                                      <div className="flex items-center gap-1">
                                                        <span className="text-gray-500 text-sm">£</span>
                                                        <input
                                                          type="number"
                                                          step="0.01"
                                                          min="0"
                                                          value={item.price || ''}
                                                          onChange={(e) => updateItem(category.id, item.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                                                          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                                          placeholder="0.00"
                                                        />
                                                      </div>
                                                      <button
                                                        onClick={() => updateItem(category.id, item.id, 'is_available', !item.is_available)}
                                                        className={`p-2 rounded ${
                                                          item.is_available
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                        title={item.is_available ? 'Available' : 'Unavailable'}
                                                      >
                                                        {item.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                      </button>
                                                      <button
                                                        onClick={() => deleteItem(category.id, item.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete item"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    </div>

                                                    <textarea
                                                      value={item.description || ''}
                                                      onChange={(e) => updateItem(category.id, item.id, 'description', e.target.value)}
                                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none"
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
                                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
                                  className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-full justify-center border-2 border-dashed border-gray-200"
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
              className="mt-4 flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl w-full justify-center border-2 border-dashed border-gray-300"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500">
            Changes are saved automatically
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuBuilder;
