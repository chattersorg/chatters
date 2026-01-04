import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import usePageTitle from '../../../hooks/usePageTitle';
import { Button } from '../../../components/ui/button';
import {
  FolderKanban,
  Plus,
  Trash2,
  X,
  Save,
  RefreshCw,
  Pencil,
  Building2,
  Check,
  ChevronRight
} from 'lucide-react';

const VenueGroups = () => {
  usePageTitle('Venue Groups');
  const navigate = useNavigate();
  const { userRole, allVenues } = useVenue();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [editGroup, setEditGroup] = useState({ id: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [accountId, setAccountId] = useState(null);

  useEffect(() => {
    if (userRole !== 'master') {
      navigate('/dashboard');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!userData?.account_id) return;
      setAccountId(userData.account_id);

      // Fetch venue groups with their members
      const { data: groupsData, error } = await supabase
        .from('venue_groups')
        .select(`
          *,
          venue_group_members (
            venue_id,
            venues (id, name, address)
          )
        `)
        .eq('account_id', userData.account_id)
        .order('name', { ascending: true });

      if (error) throw error;

      const transformedGroups = (groupsData || []).map(g => ({
        ...g,
        venues: g.venue_group_members?.map(m => m.venues).filter(Boolean) || []
      }));

      setGroups(transformedGroups);

      if (transformedGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(transformedGroups[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Failed to load venue groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      setMessage('Please enter a group name');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('venue_groups')
        .insert({
          account_id: accountId,
          name: newGroup.name.trim(),
          description: newGroup.description.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setGroups(prev => [...prev, { ...data, venues: [] }]);
      setSelectedGroup(data.id);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '' });
      setMessage('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      setMessage('Failed to create group: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditGroup = async () => {
    if (!editGroup.name.trim()) {
      setMessage('Please enter a group name');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('venue_groups')
        .update({
          name: editGroup.name.trim(),
          description: editGroup.description.trim() || null
        })
        .eq('id', editGroup.id);

      if (error) throw error;

      setGroups(prev => prev.map(g =>
        g.id === editGroup.id
          ? { ...g, name: editGroup.name.trim(), description: editGroup.description.trim() || null }
          : g
      ));
      setShowEditModal(false);
      setMessage('Group updated successfully!');
    } catch (error) {
      console.error('Error updating group:', error);
      setMessage('Failed to update group: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('venue_groups')
        .delete()
        .eq('id', selectedGroup);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== selectedGroup));
      setSelectedGroup(groups.length > 1 ? groups.find(g => g.id !== selectedGroup)?.id : null);
      setShowDeleteModal(false);
      setMessage('Group deleted successfully!');
    } catch (error) {
      console.error('Error deleting group:', error);
      setMessage('Failed to delete group: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleVenueInGroup = async (venueId) => {
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return;

    const isInGroup = group.venues.some(v => v.id === venueId);

    try {
      if (isInGroup) {
        // Remove venue from group
        const { error } = await supabase
          .from('venue_group_members')
          .delete()
          .eq('venue_group_id', selectedGroup)
          .eq('venue_id', venueId);

        if (error) throw error;

        setGroups(prev => prev.map(g =>
          g.id === selectedGroup
            ? { ...g, venues: g.venues.filter(v => v.id !== venueId) }
            : g
        ));
      } else {
        // Add venue to group
        const { error } = await supabase
          .from('venue_group_members')
          .insert({
            venue_group_id: selectedGroup,
            venue_id: venueId
          });

        if (error) throw error;

        const venue = allVenues.find(v => v.id === venueId);
        setGroups(prev => prev.map(g =>
          g.id === selectedGroup
            ? { ...g, venues: [...g.venues, venue] }
            : g
        ));
      }
    } catch (error) {
      console.error('Error toggling venue:', error);
      setMessage('Failed to update venue: ' + error.message);
    }
  };

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Venue Groups</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organise venues into groups for easier manager assignment
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.includes('success')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {groups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No venue groups yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Create groups to organise your venues by region, type, or any category you choose.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="flex">
            {/* Groups List */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Groups ({groups.length})
                </h3>
              </div>
              <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedGroup === group.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderKanban className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        selectedGroup === group.id
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {group.venues.length}
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Group Details */}
            <div className="flex-1 p-6">
              {selectedGroupData ? (
                <div className="space-y-6">
                  {/* Group Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedGroupData.name}
                      </h2>
                      {selectedGroupData.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {selectedGroupData.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditGroup({
                            id: selectedGroupData.id,
                            name: selectedGroupData.name,
                            description: selectedGroupData.description || ''
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edit group"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Venues in this group */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Venues in this group ({selectedGroupData.venues.length})
                    </h3>
                    {selectedGroupData.venues.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No venues in this group yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedGroupData.venues.map(venue => (
                          <div
                            key={venue.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          >
                            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 self-start" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {venue.name}
                              </span>
                              {venue.address && (venue.address.line1 || venue.address.city) && (
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                  {[
                                    venue.address.line1,
                                    venue.address.city,
                                    venue.address.county,
                                    venue.address.postalCode
                                  ].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => toggleVenueInGroup(venue.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Remove from group"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Venues not in this group */}
                  {(() => {
                    const venuesNotInGroup = allVenues.filter(
                      v => !selectedGroupData.venues.some(gv => gv.id === v.id)
                    );
                    if (venuesNotInGroup.length === 0) return null;

                    return (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Other venues
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Click a venue to add it to this group
                        </p>
                        <div className="space-y-2">
                          {venuesNotInGroup.map(venue => (
                            <button
                              key={venue.id}
                              onClick={() => toggleVenueInGroup(venue.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left"
                            >
                              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 self-start" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {venue.name}
                                </span>
                                {venue.address && (venue.address.line1 || venue.address.city) && (
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                    {[
                                      venue.address.line1,
                                      venue.address.city,
                                      venue.address.county,
                                      venue.address.postalCode
                                    ].filter(Boolean).join(', ')}
                                  </p>
                                )}
                              </div>
                              <Plus className="w-4 h-4 text-gray-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  Select a group to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Venue Group</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroup({ name: '', description: '' });
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., London Venues"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of this group..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroup({ name: '', description: '' });
                }}
                disabled={saving}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <Button variant="primary" onClick={handleCreateGroup} disabled={saving} loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Venue Group</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={editGroup.name}
                  onChange={(e) => setEditGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={editGroup.description}
                  onChange={(e) => setEditGroup(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <Button variant="primary" onClick={handleEditGroup} disabled={saving} loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Group
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete <strong>{selectedGroupData?.name}</strong>?
                    This will not delete the venues, only the group.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {deleting ? 'Deleting...' : 'Delete Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueGroups;
