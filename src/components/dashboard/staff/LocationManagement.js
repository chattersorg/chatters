import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../utils/supabase';

const LocationManagement = ({ venueId, onLocationUpdate }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: '', color: '#3B82F6' });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const defaultColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#6B7280', // Gray
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#84CC16', // Lime
    '#EC4899'  // Pink
  ];

  useEffect(() => {
    fetchLocations();
  }, [venueId]);

  const fetchLocations = async () => {
    if (!venueId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_locations')
        .select('*')
        .eq('venue_id', venueId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) return;

    try {
      const maxOrder = Math.max(...locations.map(l => l.display_order), 0);
      const { data, error } = await supabase
        .from('staff_locations')
        .insert({
          venue_id: venueId,
          name: newLocation.name.trim(),
          color: newLocation.color,
          display_order: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => [...prev, data]);
      setNewLocation({ name: '', color: '#3B82F6' });
      setShowAddForm(false);
      onLocationUpdate?.();
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  const handleUpdateLocation = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('staff_locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => prev.map(l => l.id === id ? data : l));
      setEditingLocation(null);
      onLocationUpdate?.();
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleDeleteLocation = (location) => {
    setDeleteConfirmation({
      location,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('staff_locations')
            .delete()
            .eq('id', location.id);

          if (error) throw error;

          setLocations(prev => prev.filter(l => l.id !== location.id));
          onLocationUpdate?.();
          setDeleteConfirmation(null);
        } catch (error) {
          console.error('Error deleting location:', error);
        }
      },
      onCancel: () => setDeleteConfirmation(null)
    });
  };

  const handleToggleActive = async (id, isActive) => {
    await handleUpdateLocation(id, { is_active: !isActive });
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, overIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItem !== null && draggedItem !== overIndex) {
      setDragOverItem(overIndex);
      
      // Create a temporary reordered array for visual feedback
      const reorderedLocations = [...locations];
      const draggedLocation = reorderedLocations[draggedItem];
      
      // Remove dragged item
      reorderedLocations.splice(draggedItem, 1);
      // Insert at new position
      reorderedLocations.splice(overIndex, 0, draggedLocation);
      
      setLocations(reorderedLocations);
      setDraggedItem(overIndex); // Update the dragged item index
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    // Update display_order for all items
    const updatedLocations = locations.map((location, index) => ({
      ...location,
      display_order: index + 1
    }));

    setLocations(updatedLocations);
    setDraggedItem(null);
    setDragOverItem(null);

    // Update in database
    try {
      const updates = updatedLocations.map(location => ({
        id: location.id,
        display_order: location.display_order
      }));

      for (const update of updates) {
        await supabase
          .from('staff_locations')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating location order:', error);
      // Revert on error
      fetchLocations();
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading locations...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Location
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Customise staff location categories for your venue. Drag to reorder.
      </p>

      {/* Add Location Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Location name (e.g., Front of House)"
                value={newLocation.name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newLocation.color}
                onChange={(e) => setNewLocation(prev => ({ ...prev, color: e.target.value }))}
                className="w-10 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
              />
              <div className="flex space-x-1">
                {defaultColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewLocation(prev => ({ ...prev, color }))}
                    className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleAddLocation}
              disabled={!newLocation.name.trim()}
              className="px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewLocation({ name: '', color: '#3B82F6' });
              }}
              className="px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="space-y-2">
        {locations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No locations configured yet.</p>
            <p className="text-sm">Add your first location to get started.</p>
          </div>
        ) : (
          locations.map((location, index) => (
            <div
              key={location.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-move transition-all duration-200 ${
                !location.is_active ? 'opacity-60' : ''
              } ${
                draggedItem === index ? 'shadow-lg scale-105 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : ''
              } ${
                dragOverItem === index ? 'border-blue-400 dark:border-blue-600 bg-blue-25 dark:bg-blue-900/20' : ''
              }`}
            >
              <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />

              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: location.color }}
              />

              <div className="flex-1">
                {editingLocation === location.id ? (
                  <input
                    type="text"
                    value={location.name}
                    onChange={(e) => {
                      setLocations(prev => prev.map(l =>
                        l.id === location.id ? { ...l, name: e.target.value } : l
                      ));
                    }}
                    onBlur={() => handleUpdateLocation(location.id, { name: location.name })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateLocation(location.id, { name: location.name });
                      }
                    }}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {location.name}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleActive(location.id, location.is_active)}
                  className={`p-1 rounded transition-colors ${
                    location.is_active
                      ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={location.is_active ? 'Hide location' : 'Show location'}
                >
                  {location.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setEditingLocation(location.id)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Edit location"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteLocation(location)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete location"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Location</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <strong>"{deleteConfirmation.location.name}"</strong>?
                Employees assigned to this location will have their location cleared. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={deleteConfirmation.onCancel}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteConfirmation.onConfirm}
                  className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  Delete Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;