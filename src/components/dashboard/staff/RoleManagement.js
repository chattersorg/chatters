import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../utils/supabase';

const RoleManagement = ({ venueId, onRoleUpdate }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', color: '#3B82F6', description: '' });
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

  const defaultRoles = [
    { name: 'Server', description: 'Front of house service staff' },
    { name: 'Bartender', description: 'Bar service and drink preparation' },
    { name: 'Host/Hostess', description: 'Guest seating and first impressions' },
    { name: 'Cook', description: 'Food preparation and cooking' },
    { name: 'Chef', description: 'Kitchen leadership and menu execution' },
    { name: 'Kitchen Assistant', description: 'Food prep and kitchen support' },
    { name: 'Busser', description: 'Table clearing and setup' },
    { name: 'Manager', description: 'Team leadership and operations' },
    { name: 'Assistant Manager', description: 'Management support and supervision' },
    { name: 'Cashier', description: 'Payment processing and customer checkout' }
  ];

  useEffect(() => {
    fetchRoles();
  }, [venueId]);

  const fetchRoles = async () => {
    if (!venueId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .eq('venue_id', venueId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name.trim()) return;

    try {
      const maxOrder = Math.max(...roles.map(r => r.display_order), 0);
      const { data, error } = await supabase
        .from('staff_roles')
        .insert({
          venue_id: venueId,
          name: newRole.name.trim(),
          description: newRole.description.trim(),
          color: newRole.color,
          display_order: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      setRoles(prev => [...prev, data]);
      setNewRole({ name: '', color: '#3B82F6', description: '' });
      setShowAddForm(false);
      onRoleUpdate?.();
    } catch (error) {
      console.error('Error adding role:', error);
    }
  };

  const handleUpdateRole = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRoles(prev => prev.map(r => r.id === id ? data : r));
      setEditingRole(null);
      onRoleUpdate?.();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteRole = (role) => {
    setDeleteConfirmation({
      role,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('staff_roles')
            .delete()
            .eq('id', role.id);

          if (error) throw error;

          setRoles(prev => prev.filter(r => r.id !== role.id));
          onRoleUpdate?.();
          setDeleteConfirmation(null);
        } catch (error) {
          console.error('Error deleting role:', error);
        }
      },
      onCancel: () => setDeleteConfirmation(null)
    });
  };

  const handleToggleActive = async (id, isActive) => {
    await handleUpdateRole(id, { is_active: !isActive });
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
      const reorderedRoles = [...roles];
      const draggedRole = reorderedRoles[draggedItem];
      
      // Remove dragged item
      reorderedRoles.splice(draggedItem, 1);
      // Insert at new position
      reorderedRoles.splice(overIndex, 0, draggedRole);
      
      setRoles(reorderedRoles);
      setDraggedItem(overIndex); // Update the dragged item index
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    // Update display_order for all items
    const updatedRoles = roles.map((role, index) => ({
      ...role,
      display_order: index + 1
    }));

    setRoles(updatedRoles);
    setDraggedItem(null);
    setDragOverItem(null);

    // Update in database
    try {
      const updates = updatedRoles.map(role => ({
        id: role.id,
        display_order: role.display_order
      }));

      for (const update of updates) {
        await supabase
          .from('staff_roles')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating role order:', error);
      // Revert on error
      fetchRoles();
    }
  };

  const addDefaultRoles = async () => {
    try {
      const rolesToAdd = defaultRoles.map((role, index) => ({
        venue_id: venueId,
        name: role.name,
        description: role.description,
        color: defaultColors[index % defaultColors.length],
        display_order: index + 1
      }));

      const { data, error } = await supabase
        .from('staff_roles')
        .insert(rolesToAdd)
        .select();

      if (error) throw error;

      setRoles(data);
      onRoleUpdate?.();
    } catch (error) {
      console.error('Error adding default roles:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading roles...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {roles.length === 0 && (
            <button
              onClick={addDefaultRoles}
              className="px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Default Roles
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Role
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Customise staff role categories for your venue. Drag to reorder.
      </p>

      {/* Add Role Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Role name (e.g., Server)"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole(prev => ({ ...prev, color: e.target.value }))}
                  className="w-10 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                />
                <div className="flex space-x-1">
                  {defaultColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewRole(prev => ({ ...prev, color }))}
                      className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Role description (optional)"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewRole({ name: '', color: '#3B82F6', description: '' });
                }}
                className="px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRole}
                disabled={!newRole.name.trim()}
                className="px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-2">
        {roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No roles configured yet.</p>
            <p className="text-sm">Add default roles or create your own to get started.</p>
          </div>
        ) : (
          roles.map((role, index) => (
            <div
              key={role.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-move transition-all duration-200 ${
                !role.is_active ? 'opacity-60' : ''
              } ${
                draggedItem === index ? 'shadow-lg scale-105 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : ''
              } ${
                dragOverItem === index ? 'border-blue-400 dark:border-blue-600 bg-blue-25 dark:bg-blue-900/20' : ''
              }`}
            >
              <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: role.color }}
              />
              
              <div className="flex-1">
                {editingRole === role.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={role.name}
                      onChange={(e) => {
                        setRoles(prev => prev.map(r =>
                          r.id === role.id ? { ...r, name: e.target.value } : r
                        ));
                      }}
                      onBlur={() => handleUpdateRole(role.id, { name: role.name, description: role.description })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateRole(role.id, { name: role.name, description: role.description });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={role.description || ''}
                      onChange={(e) => {
                        setRoles(prev => prev.map(r =>
                          r.id === role.id ? { ...r, description: e.target.value } : r
                        ));
                      }}
                      onBlur={() => handleUpdateRole(role.id, { name: role.name, description: role.description })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateRole(role.id, { name: role.name, description: role.description });
                        }
                      }}
                      placeholder="Role description"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 placeholder-gray-500 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </span>
                    {role.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{role.description}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleActive(role.id, role.is_active)}
                  className={`p-1 rounded transition-colors ${
                    role.is_active
                      ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={role.is_active ? 'Hide role' : 'Show role'}
                >
                  {role.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setEditingRole(role.id)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Edit role"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteRole(role)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete role"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Role</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <strong>"{deleteConfirmation.role.name}"</strong>?
                Employees assigned to this role will have their role cleared. This action cannot be undone.
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
                  Delete Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;