import React, { useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { Button } from '../../ui/button';

const ManagersTab = ({ 
  managers, 
  allVenues, 
  fetchStaffData,
  loading,
  setMessage 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assigningToVenue, setAssigningToVenue] = useState(null);
  const [editingManager, setEditingManager] = useState(null);
  const [addFormLoading, setAddFormLoading] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [assignFormLoading, setAssignFormLoading] = useState(false);
  const [deleteFormLoading, setDeleteFormLoading] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState(null);
  const [editingManagerDetails, setEditingManagerDetails] = useState(null);
  const [editDetailsLoading, setEditDetailsLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(null); // Track which user's email is being resent

  // Add manager form state
  const [newManager, setNewManager] = useState({
    firstName: '',
    lastName: '',
    email: '',
    venueIds: []
  });

  // Edit manager state
  const [editManagerVenues, setEditManagerVenues] = useState([]);
  
  // Selected managers for assignment
  const [selectedManagersForAssignment, setSelectedManagersForAssignment] = useState([]);

  // Group managers by venue for display
  const managersByVenue = {};
  allVenues.forEach(venue => {
    const venueManagers = managers.filter(manager => 
      manager.venue_id === venue.id
    );
    
    managersByVenue[venue.id] = {
      venue: venue,
      managers: venueManagers
    };
  });

  // Get unique managers (not grouped by venue)
  const uniqueManagers = [];
  const seenUserIds = new Set();
  
  managers.forEach(manager => {
    if (!seenUserIds.has(manager.user_id)) {
      seenUserIds.add(manager.user_id);
      uniqueManagers.push(manager);
    }
  });

  // Add new manager
  const handleAddManager = async (e) => {
    e.preventDefault();
    
    if (!newManager.firstName || !newManager.lastName || !newManager.email || newManager.venueIds.length === 0) {
      setMessage('Please fill in all fields and select at least one venue');
      return;
    }

    setAddFormLoading(true);
    
    try {
      // Get current user's account_id
      const { data: authUser } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', authUser.user.id)
        .single();

      // Call updated API with multiple venues
      const payload = {
        email: newManager.email,
        firstName: newManager.firstName,
        lastName: newManager.lastName,
        venueIds: newManager.venueIds, // Pass all venue IDs
        accountId: userData.account_id
      };

      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/invite-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to invite manager');
      }

      // Success!
      setMessage(`Manager invited successfully! An invitation email has been sent to ${newManager.email}.`);
      setNewManager({ firstName: '', lastName: '', email: '', venueIds: [] });
      setShowAddForm(false);
      await fetchStaffData();
      await fetchPendingInvitations();

    } catch (error) {
      setMessage('Failed to invite manager: ' + error.message);
    } finally {
      setAddFormLoading(false);
    }
  };

  // Handle venue selection for new manager
  const handleVenueToggle = (venueId) => {
    setNewManager(prev => ({
      ...prev,
      venueIds: prev.venueIds.includes(venueId)
        ? prev.venueIds.filter(id => id !== venueId)
        : [...prev.venueIds, venueId]
    }));
  };

  // Handle assign managers to venue
  const handleAssignToVenue = (venue) => {
    setAssigningToVenue(venue);
    setShowAssignForm(true);
    // Pre-select managers already assigned to this venue
    const assignedManagerIds = managers
      .filter(m => m.venue_id === venue.id)
      .map(m => m.user_id);
    setSelectedManagersForAssignment(assignedManagerIds);
  };

  // Handle manager selection for assignment
  const handleManagerAssignmentToggle = (managerId) => {
    setSelectedManagersForAssignment(prev => 
      prev.includes(managerId)
        ? prev.filter(id => id !== managerId)
        : [...prev, managerId]
    );
  };

  // Save manager assignments to venue
  const handleSaveManagerAssignments = async () => {
    setAssignFormLoading(true);
    
    try {
      // Delete existing assignments for this venue
      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('venue_id', assigningToVenue.id)
        .eq('role', 'manager');

      if (deleteError) {
        throw new Error('Failed to update manager assignments: ' + deleteError.message);
      }

      // Create new assignments for selected managers
      if (selectedManagersForAssignment.length > 0) {
        const assignmentRecords = selectedManagersForAssignment.map(managerId => {
          const manager = uniqueManagers.find(m => m.user_id === managerId);
          return {
            user_id: managerId,
            venue_id: assigningToVenue.id,
            role: 'manager'
          };
        });

        const { error: insertError } = await supabase
          .from('staff')
          .insert(assignmentRecords);

        if (insertError) {
          throw new Error('Failed to assign managers: ' + insertError.message);
        }
      }

      setMessage('Manager assignments updated successfully!');
      setShowAssignForm(false);
      setAssigningToVenue(null);
      await fetchStaffData();

    } catch (error) {
      setMessage('Failed to update manager assignments: ' + error.message);
    } finally {
      setAssignFormLoading(false);
    }
  };

  // Start editing manager venues
  const handleVenueAssignment = (manager) => {
    setEditingManager(manager);
    // Get current venue assignments for this manager
    const currentVenues = managers
      .filter(m => m.user_id === manager.user_id)
      .map(m => m.venue_id);
    setEditManagerVenues(currentVenues);
  };

  // Handle venue toggle for editing
  const handleEditVenueToggle = (venueId) => {
    setEditManagerVenues(prev => 
      prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    );
  };

  // Save venue assignments
  const handleSaveVenueAssignments = async () => {
    setEditFormLoading(true);
    
    try {
      // Delete existing staff records for this manager
      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('user_id', editingManager.user_id);

      if (deleteError) {
        throw new Error('Failed to update venue assignments: ' + deleteError.message);
      }

      // Create new staff records for selected venues
      if (editManagerVenues.length > 0) {
        const newStaffRecords = editManagerVenues.map(venueId => ({
          user_id: editingManager.user_id,
          venue_id: venueId,
          role: 'manager'
        }));

        const { error: insertError } = await supabase
          .from('staff')
          .insert(newStaffRecords);

        if (insertError) {
          throw new Error('Failed to assign venues: ' + insertError.message);
        }
      }

      setMessage('Venue assignments updated successfully!');
      setEditingManager(null);
      await fetchStaffData();

    } catch (error) {
      setMessage('Failed to update venue assignments: ' + error.message);
    } finally {
      setEditFormLoading(false);
    }
  };

  // Delete manager (soft delete - can be recovered within 14 days)
  const handleDeleteManager = async () => {
    if (!managerToDelete) return;

    setDeleteFormLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/delete-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ managerId: managerToDelete.user_id }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete manager');
      }

      setMessage('Manager deleted successfully. They can be recovered within 14 days.');
      setManagerToDelete(null);
      await fetchStaffData();
      await fetchPendingInvitations();
      await fetchDeletedManagers();

    } catch (error) {
      setMessage('Failed to delete manager: ' + error.message);
    } finally {
      setDeleteFormLoading(false);
    }
  };

  // Edit manager details (name, email, venues)
  const handleEditManagerDetails = (manager) => {
    const managerVenues = managers
      .filter(m => m.user_id === manager.user_id)
      .map(m => m.venue_id);
    
    setEditingManagerDetails({
      ...manager,
      first_name: manager.users?.first_name || '',
      last_name: manager.users?.last_name || '',
      email: manager.users?.email || '',
      venue_ids: managerVenues
    });
  };

  // Save manager venue assignments
  const handleSaveManagerDetails = async () => {
    if (!editingManagerDetails) return;
    
    setEditDetailsLoading(true);
    
    try {
      // Update venue assignments only
      // First, delete existing staff records for this manager
      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('user_id', editingManagerDetails.user_id);

      if (deleteError) {
        throw new Error('Failed to update venue assignments: ' + deleteError.message);
      }

      // Create new staff records for selected venues
      if (editingManagerDetails.venue_ids.length > 0) {
        const newStaffRecords = editingManagerDetails.venue_ids.map(venueId => ({
          user_id: editingManagerDetails.user_id,
          venue_id: venueId,
          role: 'manager'
        }));

        const { error: insertError } = await supabase
          .from('staff')
          .insert(newStaffRecords);

        if (insertError) {
          throw new Error('Failed to assign venues: ' + insertError.message);
        }
      }

      setMessage('Manager venue assignments updated successfully!');
      setEditingManagerDetails(null);
      await fetchStaffData();

    } catch (error) {
      setMessage('Failed to update venue assignments: ' + error.message);
    } finally {
      setEditDetailsLoading(false);
    }
  };

  // Cancel editing manager details
  const handleCancelEditManagerDetails = () => {
    setEditingManagerDetails(null);
  };

  // Check if manager has confirmed their email/set password
  const hasManagerConfirmedEmail = (manager) => {
    // If manager has staff records, they've been fully set up
    // If they don't, they're still in pending invitation status
    return !!manager.user_id;
  };

  // Check if there's a pending invitation for an email
  const [pendingInvitations, setPendingInvitations] = useState([]);

  // Deleted managers state
  const [deletedManagers, setDeletedManagers] = useState([]);
  const [recoveringManager, setRecoveringManager] = useState(null);
  const [showDeletedManagers, setShowDeletedManagers] = useState(false);

  // Fetch pending invitations and deleted managers
  React.useEffect(() => {
    fetchPendingInvitations();
    fetchDeletedManagers();
  }, []);

  const fetchPendingInvitations = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', authUser.user.id)
        .single();

      const { data: invitations } = await supabase
        .from('manager_invitations')
        .select('*')
        .eq('account_id', userData.account_id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      setPendingInvitations(invitations || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  // Fetch deleted managers (within 14 day recovery window)
  const fetchDeletedManagers = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', authUser.user.id)
        .single();

      // Calculate date 14 days ago
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: deleted } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, deleted_at, deleted_by')
        .eq('account_id', userData.account_id)
        .eq('role', 'manager')
        .not('deleted_at', 'is', null)
        .gt('deleted_at', fourteenDaysAgo.toISOString())
        .order('deleted_at', { ascending: false });

      setDeletedManagers(deleted || []);
    } catch (error) {
      console.error('Error fetching deleted managers:', error);
    }
  };

  // Check if manager has a pending invitation
  const hasPendingInvitation = (email) => {
    return pendingInvitations.some(inv => inv.email === email);
  };

  // Resend invitation email
  const handleResendInvitation = async (email) => {
    setResendingEmail(email);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/resend-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }

      setMessage(`Invitation resent to ${email} successfully!`);
      await fetchPendingInvitations();

    } catch (error) {
      setMessage('Failed to resend invitation: ' + error.message);
    } finally {
      setResendingEmail(null);
    }
  };

  // Recover deleted manager
  const handleRecoverManager = async (managerId) => {
    setRecoveringManager(managerId);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/recover-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ managerId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to recover manager');
      }

      setMessage(result.message);
      await fetchDeletedManagers();
      await fetchStaffData();

    } catch (error) {
      setMessage('Failed to recover manager: ' + error.message);
    } finally {
      setRecoveringManager(null);
    }
  };

  // Handle venue toggle for editing manager details
  const handleEditManagerVenueToggle = (venueId) => {
    setEditingManagerDetails(prev => ({
      ...prev,
      venue_ids: prev.venue_ids.includes(venueId)
        ? prev.venue_ids.filter(id => id !== venueId)
        : [...prev.venue_ids, venueId]
    }));
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="flex-1">
          </div>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto"
          >
            Add Manager
          </Button>
        </div>
      </div>

      {/* Managers List */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-base lg:text-lg font-medium text-gray-900">All Managers</h3>
          <span className="text-sm text-gray-500">
            {uniqueManagers.length} manager{uniqueManagers.length !== 1 ? 's' : ''} across all venues
          </span>
        </div>

        {uniqueManagers.length === 0 ? (
          <div className="text-center py-8 lg:py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No managers yet</h3>
            <p className="text-gray-600 mb-4">Add your first manager to get started</p>
            <Button
              variant="primary"
              onClick={() => setShowAddForm(true)}
            >
              Add First Manager
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Venues
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {uniqueManagers.map((manager, index) => {
                    // Get all venues for this manager
                    const managerVenues = managers
                      .filter(m => m.user_id === manager.user_id)
                      .map(m => allVenues.find(v => v.id === m.venue_id))
                      .filter(Boolean);
                    
                    const isActive = hasManagerConfirmedEmail(manager);
                    
                    return editingManagerDetails?.user_id === manager.user_id ? (
                      // Edit mode row
                      <tr key={`edit-${manager.user_id}`} className="bg-blue-50">
                        <td colSpan="4" className="px-6 py-4">
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm font-medium text-gray-900">
                                {manager.users?.first_name} {manager.users?.last_name}
                              </div>
                              <span className="text-xs text-gray-500">•</span>
                              <div className="text-xs text-gray-500">{manager.users?.email}</div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">Venue Access</label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                {allVenues.map(venue => (
                                  <label key={venue.id} className="flex items-center space-x-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={editingManagerDetails.venue_ids.includes(venue.id)}
                                      onChange={() => handleEditManagerVenueToggle(venue.id)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                      disabled={editDetailsLoading}
                                    />
                                    <span className="text-gray-700">{venue.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-blue-200">
                              <button
                                onClick={handleCancelEditManagerDetails}
                                disabled={editDetailsLoading}
                                className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveManagerDetails}
                                disabled={editDetailsLoading || editingManagerDetails.venue_ids.length === 0}
                                className="px-4 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {editDetailsLoading ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // View mode row
                      <tr 
                        key={manager.user_id}
                        className={`hover:bg-blue-50 transition-colors duration-150 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {/* Manager Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                              {((manager.users?.first_name || '') + ' ' + (manager.users?.last_name || '')).split(' ').map(word => word[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {manager.users?.first_name} {manager.users?.last_name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {manager.users?.email}
                          </div>
                        </td>


                        {/* Venues */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {managerVenues.length === 1 
                              ? managerVenues[0]?.name 
                              : `${managerVenues.length} venues`
                            }
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditManagerDetails(manager)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>

                            {hasPendingInvitation(manager.users?.email) && (
                              <button
                                onClick={() => handleResendInvitation(manager.users?.email)}
                                disabled={resendingEmail === manager.users?.email}
                                className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                              >
                                {resendingEmail === manager.users?.email ? 'Sending...' : 'Resend'}
                              </button>
                            )}

                            <button
                              onClick={() => setManagerToDelete(manager)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
              );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Deleted Managers Section */}
      {deletedManagers.length > 0 && (
        <div className="mt-6 lg:mt-8">
          <button
            onClick={() => setShowDeletedManagers(!showDeletedManagers)}
            className="w-full flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-yellow-900">
                  {deletedManagers.length} Deleted Manager{deletedManagers.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-yellow-700">Can be recovered within 14 days</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-yellow-700 transition-transform ${showDeletedManagers ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDeletedManagers && (
            <div className="mt-4 bg-white border border-yellow-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Deleted
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {deletedManagers.map((manager, index) => {
                      const deletedDate = new Date(manager.deleted_at);
                      const daysAgo = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                      const daysRemaining = 14 - daysAgo;

                      return (
                        <tr
                          key={manager.id}
                          className={`hover:bg-yellow-50 transition-colors duration-150 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                                {((manager.first_name || '') + ' ' + (manager.last_name || '')).split(' ').map(word => word[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {manager.first_name} {manager.last_name}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {manager.email}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleRecoverManager(manager.id)}
                              disabled={recoveringManager === manager.id}
                              className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {recoveringManager === manager.id ? 'Recovering...' : 'Recover'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Manager Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-medium mb-4 lg:mb-6">Add New Manager</h3>
              
              <form onSubmit={handleAddManager} className="space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={newManager.firstName}
                      onChange={(e) => setNewManager(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={newManager.lastName}
                      onChange={(e) => setNewManager(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newManager.email}
                    onChange={(e) => setNewManager(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Assign to Venues</label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {allVenues.map(venue => (
                        <label key={venue.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newManager.venueIds.includes(venue.id)}
                            onChange={() => handleVenueToggle(venue.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm text-gray-700 flex-1">{venue.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select at least one venue for this manager</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewManager({ firstName: '', lastName: '', email: '', venueIds: [] });
                    }}
                    className="w-full sm:w-auto px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addFormLoading}
                    className="w-full sm:w-auto px-6 py-2 bg-black text-white rounded-lg hover:bg-custom-black-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {addFormLoading ? 'Inviting...' : 'Invite Manager'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Managers to Venue Modal */}
      {showAssignForm && assigningToVenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-medium mb-4 lg:mb-6">
                Assign Managers to {assigningToVenue.name}
              </h3>
              
              <div className="space-y-4 lg:space-y-6">
                {uniqueManagers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm mb-2">No managers available</p>
                    <p className="text-xs text-gray-400">Create a manager first using the "Add Manager" button</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Managers</label>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {uniqueManagers.map(manager => (
                          <label key={manager.user_id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedManagersForAssignment.includes(manager.user_id)}
                              onChange={() => handleManagerAssignmentToggle(manager.user_id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-gray-700">
                                  {manager.users?.first_name?.[0]}{manager.users?.last_name?.[0]}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {manager.users?.first_name} {manager.users?.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{manager.users?.email}</p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Select managers to assign to this venue</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAssignForm(false);
                      setAssigningToVenue(null);
                    }}
                    className="w-full sm:w-auto px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  {uniqueManagers.length > 0 && (
                    <Button
                      variant="primary"
                      onClick={handleSaveManagerAssignments}
                      loading={assignFormLoading}
                      className="w-full sm:w-auto"
                    >
                      {assignFormLoading ? 'Saving...' : 'Save Assignments'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Manager Venues Modal */}
      {editingManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-medium mb-4 lg:mb-6">
                Edit Venues for {editingManager.users?.first_name} {editingManager.users?.last_name}
              </h3>
              
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Venue Access</label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {allVenues.map(venue => (
                        <label key={venue.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editManagerVenues.includes(venue.id)}
                            onChange={() => handleEditVenueToggle(venue.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm text-gray-700 flex-1">{venue.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select venues this manager should have access to</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setEditingManager(null)}
                    className="w-full sm:w-auto px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <Button
                    variant="primary"
                    onClick={handleSaveVenueAssignments}
                    loading={editFormLoading}
                    className="w-full sm:w-auto"
                  >
                    {editFormLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Manager Confirmation Modal */}
      {managerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 lg:p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.95-.833-2.72 0L4.094 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Manager
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to delete <strong>{managerToDelete.users?.first_name} {managerToDelete.users?.last_name}</strong>?
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This manager can be recovered within 14 days. After 14 days, they will be permanently deleted. All their data will be preserved during the recovery period.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setManagerToDelete(null)}
                  disabled={deleteFormLoading}
                  className="w-full sm:w-auto px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteManager}
                  disabled={deleteFormLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-custom-red text-white rounded-lg hover:bg-custom-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {deleteFormLoading ? 'Deleting...' : 'Delete Manager'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagersTab;