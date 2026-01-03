import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate, usePermissions } from '../../context/PermissionsContext';
import { Button } from '../../components/ui/button';
import { permissionSections } from '../../config/permissions';
import {
  ArrowLeft, Mail, Building2, Save, Trash2, Shield,
  Check, RefreshCw, Phone, Calendar, User, Archive, AlertTriangle
} from 'lucide-react';

const TABS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'venues', label: 'Venues', icon: Building2 },
  { id: 'permissions', label: 'Permissions', icon: Shield },
];

const ManagerDetail = () => {
  const { managerId } = useParams();
  const navigate = useNavigate();
  const { allVenues, impersonatedAccountId, userRole } = useVenue();
  const { permissions: currentUserPermissions } = usePermissions();

  const [activeTab, setActiveTab] = useState('personal');
  const [manager, setManager] = useState(null);
  const [managerVenues, setManagerVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Manager edit state
  const [editedVenueIds, setEditedVenueIds] = useState([]);
  const [hasVenueChanges, setHasVenueChanges] = useState(false);

  // Delete/Archive state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit details state
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedDateOfBirth, setEditedDateOfBirth] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [hasDetailsChanges, setHasDetailsChanges] = useState(false);

  // Permissions state
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [userPermissions, setUserPermissions] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customPermissions, setCustomPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [hasPermissionChanges, setHasPermissionChanges] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState(null);
  const [originalCustomPermissions, setOriginalCustomPermissions] = useState([]);

  // Check if user can manage billing permissions
  const canManageBilling = userRole === 'master' || userRole === 'admin';

  usePageTitle(manager ? `${manager.first_name} ${manager.last_name}` : 'Manager Details');

  useEffect(() => {
    if (!managerId) return;
    fetchManager();
    fetchPermissionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerId]);

  // Track details changes
  useEffect(() => {
    if (!manager) return;
    const changed =
      editedFirstName !== (manager.first_name || '') ||
      editedLastName !== (manager.last_name || '') ||
      editedPhone !== (manager.phone || '') ||
      editedDateOfBirth !== (manager.date_of_birth || '');
    setHasDetailsChanges(changed);
  }, [editedFirstName, editedLastName, editedPhone, editedDateOfBirth, manager]);

  // Track permission changes
  useEffect(() => {
    const templateChanged = selectedTemplate !== originalTemplate;
    const customChanged = JSON.stringify(customPermissions.sort()) !== JSON.stringify(originalCustomPermissions.sort());
    setHasPermissionChanges(templateChanged || customChanged);
  }, [selectedTemplate, customPermissions, originalTemplate, originalCustomPermissions]);

  const fetchManager = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, date_of_birth, role, created_at')
        .eq('id', managerId)
        .is('deleted_at', null)
        .single();

      if (userError) throw userError;

      const { data: staffData } = await supabase
        .from('staff')
        .select('venue_id')
        .eq('user_id', managerId)
        .eq('role', 'manager');

      const venueIds = staffData?.map(s => s.venue_id) || [];

      setManager(userData);
      setManagerVenues(venueIds);
      setEditedVenueIds(venueIds);
      setEditedFirstName(userData.first_name || '');
      setEditedLastName(userData.last_name || '');
      setEditedPhone(userData.phone || '');
      setEditedDateOfBirth(userData.date_of_birth || '');
    } catch (error) {
      console.error('Error fetching manager:', error);
      setMessage('Failed to load manager details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionsData = async () => {
    try {
      setPermissionsLoading(true);

      let accountId = impersonatedAccountId;

      if (!accountId && allVenues && allVenues.length > 0) {
        const { data: venueData } = await supabase
          .from('venues')
          .select('account_id')
          .eq('id', allVenues[0].id)
          .single();
        accountId = venueData?.account_id;
      }

      const { data: templates } = await supabase
        .from('role_templates')
        .select(`
          *,
          role_template_permissions (
            permissions (code)
          )
        `)
        .or(`is_system.eq.true,account_id.eq.${accountId}`)
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });

      const { data: existingPerm } = await supabase
        .from('user_permissions')
        .select(`
          *,
          role_templates (code, name)
        `)
        .eq('user_id', managerId)
        .maybeSingle();

      setRoleTemplates(templates || []);

      if (existingPerm) {
        setUserPermissions(existingPerm);

        if (existingPerm.role_template_id) {
          setSelectedTemplate(existingPerm.role_template_id);
          setOriginalTemplate(existingPerm.role_template_id);
          setCustomPermissions([]);
          setOriginalCustomPermissions([]);
        } else {
          setSelectedTemplate(null);
          setOriginalTemplate(null);
          setCustomPermissions(existingPerm.custom_permissions || []);
          setOriginalCustomPermissions(existingPerm.custom_permissions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching permissions data:', err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const templatePermissions = useMemo(() => {
    if (!selectedTemplate) return [];
    const template = roleTemplates.find(t => t.id === selectedTemplate);
    return template?.role_template_permissions?.map(rtp => rtp.permissions?.code).filter(Boolean) || [];
  }, [selectedTemplate, roleTemplates]);

  // Filter role templates - managers can only see templates where they have all the permissions
  const filteredRoleTemplates = useMemo(() => {
    // Masters and admins can see all templates
    if (userRole === 'master' || userRole === 'admin') {
      return roleTemplates;
    }

    // For managers, filter to templates where they have ALL the permissions
    return roleTemplates.filter(template => {
      const templatePerms = template.role_template_permissions
        ?.map(rtp => rtp.permissions?.code)
        .filter(Boolean) || [];

      // Check if current user has all permissions in this template
      return templatePerms.every(code => currentUserPermissions.includes(code));
    });
  }, [userRole, roleTemplates, currentUserPermissions]);

  // Filter permission sections based on user role and what permissions they have
  // Masters/admins see all permissions, managers only see permissions they have
  const filteredPermissionSections = useMemo(() => {
    // Masters and admins can assign any permission
    if (userRole === 'master' || userRole === 'admin') {
      return permissionSections;
    }

    // For managers, filter to only show permissions they have
    return permissionSections
      .map(section => ({
        ...section,
        permissions: section.permissions.filter(perm =>
          currentUserPermissions.includes(perm.code)
        )
      }))
      .filter(section => section.permissions.length > 0); // Remove empty sections
  }, [userRole, currentUserPermissions]);

  const handleVenueToggle = (venueId) => {
    setEditedVenueIds(prev => {
      const newIds = prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId];
      setHasVenueChanges(JSON.stringify(newIds.sort()) !== JSON.stringify(managerVenues.sort()));
      return newIds;
    });
  };

  const handleSaveVenues = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('user_id', managerId);

      if (deleteError) throw deleteError;

      if (editedVenueIds.length > 0) {
        const newStaffRecords = editedVenueIds.map(vid => ({
          user_id: managerId,
          venue_id: vid,
          role: 'manager'
        }));

        const { error: insertError } = await supabase.from('staff').insert(newStaffRecords);
        if (insertError) throw insertError;
      }

      setMessage('Venue assignments updated successfully!');
      setManagerVenues(editedVenueIds);
      setHasVenueChanges(false);
    } catch (error) {
      console.error('Error updating manager venues:', error);
      setMessage('Failed to update venue assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveManager = async () => {
    setArchiving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/delete-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ managerId, softDelete: true }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to archive manager');

      navigate('/staff/managers');
    } catch (error) {
      console.error('Error archiving manager:', error);
      setMessage('Failed to archive manager: ' + error.message);
      setArchiving(false);
      setShowArchiveModal(false);
    }
  };

  const handleDeleteManager = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/delete-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ managerId, hardDelete: true }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete manager');

      navigate('/staff/managers');
    } catch (error) {
      console.error('Error deleting manager:', error);
      setMessage('Failed to delete manager: ' + error.message);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!editedFirstName.trim() || !editedLastName.trim()) {
      setMessage('First name and last name are required');
      return;
    }

    setSavingDetails(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/update-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          managerId,
          firstName: editedFirstName.trim(),
          lastName: editedLastName.trim(),
          phone: editedPhone.trim() || null,
          dateOfBirth: editedDateOfBirth || null
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update manager');

      setMessage('Personal information updated successfully!');
      await fetchManager();
    } catch (error) {
      console.error('Error updating manager:', error);
      setMessage('Failed to update manager: ' + error.message);
    } finally {
      setSavingDetails(false);
    }
  };

  const togglePermission = (code) => {
    setSelectedTemplate(null);
    setCustomPermissions(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
  };

  const isPermissionEnabled = (code) => {
    if (selectedTemplate) {
      return templatePermissions.includes(code);
    }
    return customPermissions.includes(code);
  };

  const selectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    setCustomPermissions([]);
  };

  const handleSavePermissions = async () => {
    try {
      setPermissionsSaving(true);

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/update-manager-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          managerId,
          roleTemplateId: selectedTemplate || null,
          customPermissions: selectedTemplate ? [] : customPermissions
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update permissions');
      }

      setMessage('Permissions saved successfully!');
      setOriginalTemplate(selectedTemplate);
      setOriginalCustomPermissions([...customPermissions]);
      setHasPermissionChanges(false);
      await fetchPermissionsData();
    } catch (err) {
      console.error('Error saving permissions:', err);
      setMessage('Failed to save permissions: ' + err.message);
    } finally {
      setPermissionsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">The manager you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/staff/managers')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Staff List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/staff/managers')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {manager.first_name} {manager.last_name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              {manager.email}
            </div>
          </div>
        </div>
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="p-6">
            <div className="max-w-lg space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editedFirstName}
                    onChange={(e) => setEditedFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editedLastName}
                    onChange={(e) => setEditedLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  {manager.email}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={editedDateOfBirth}
                    onChange={(e) => setEditedDateOfBirth(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {hasDetailsChanges && (
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSaveDetails}
                    disabled={savingDetails}
                    loading={savingDetails}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <PermissionGate permission="managers.invite" fallback={
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              You don't have permission to manage venue assignments.
            </div>
          }>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select which venues this manager can access
                </p>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allVenues.map(venue => {
                  const isChecked = editedVenueIds.includes(venue.id);
                  // Can't uncheck if it's the last selected venue
                  const isLastVenue = isChecked && editedVenueIds.length === 1;
                  const isDisabled = saving || isLastVenue;

                  return (
                    <label
                      key={venue.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isDisabled && isLastVenue
                          ? 'cursor-not-allowed opacity-60 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isChecked
                          ? 'cursor-pointer border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'cursor-pointer border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      title={isLastVenue ? 'Manager must have at least one venue' : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => !isDisabled && handleVenueToggle(venue.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        disabled={isDisabled}
                      />
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{venue.name}</span>
                      {isChecked && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </label>
                  );
                })}
              </div>

              {editedVenueIds.length === 1 && allVenues.length === 1 && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Manager must have at least one venue assigned
                </p>
              )}

              {hasVenueChanges && (
                <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSaveVenues}
                    disabled={saving}
                    loading={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Venue Access
                  </Button>
                </div>
              )}
            </div>
          </PermissionGate>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <PermissionGate permission="managers.permissions" fallback={
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              You don't have permission to manage permissions.
            </div>
          }>
            <div className="p-6">
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Role Templates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role Template
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Select a predefined role or customise individual permissions below
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredRoleTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => selectTemplate(template.id)}
                          className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                            selectedTemplate === template.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {template.name}
                            </span>
                            {selectedTemplate === template.id && (
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          {template.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {template.description}
                            </div>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          // When switching to custom, start with empty permissions
                          // User must explicitly select what they want
                          setSelectedTemplate(null);
                          setCustomPermissions([]);
                        }}
                        className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                          !selectedTemplate
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            Custom
                          </span>
                          {!selectedTemplate && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Select individual permissions
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Individual Permissions - Flat List */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Individual Permissions
                    </label>

                    <div className="space-y-6">
                      {filteredPermissionSections.map((section) => (
                        <div key={section.category}>
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            {section.title}
                          </h4>
                          <div className="space-y-1">
                            {section.permissions.map(perm => {
                              const enabled = isPermissionEnabled(perm.code);
                              const isLocked = !!selectedTemplate;
                              const isBillingPerm = perm.code.startsWith('billing.');
                              const isDisabled = isLocked || (isBillingPerm && !canManageBilling);

                              return (
                                <label
                                  key={perm.code}
                                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                    isDisabled
                                      ? 'cursor-not-allowed opacity-60'
                                      : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={() => !isDisabled && togglePermission(perm.code)}
                                    disabled={isDisabled}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      {perm.label}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Permissions Button */}
                  {hasPermissionChanges && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedTemplate ? (
                          <span>Using template: <strong>{roleTemplates.find(t => t.id === selectedTemplate)?.name}</strong></span>
                        ) : (
                          <span><strong>{customPermissions.length}</strong> permissions selected</span>
                        )}
                      </div>
                      <Button
                        onClick={handleSavePermissions}
                        disabled={permissionsSaving}
                        loading={permissionsSaving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Permissions
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </PermissionGate>
        )}
      </div>

      {/* Danger Zone */}
      <PermissionGate permission="managers.remove">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Danger Zone</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowArchiveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            >
              <Archive className="w-4 h-4" />
              Archive Manager
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Permanently
            </button>
          </div>
        </div>
      </PermissionGate>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Archive className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Archive Manager
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to archive <strong>{manager.first_name} {manager.last_name}</strong>?
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      This manager can be restored within 14 days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  disabled={archiving}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveManager}
                  disabled={archiving}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
                >
                  {archiving ? 'Archiving...' : 'Archive'}
                </button>
              </div>
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
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Permanently
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to permanently delete <strong>{manager.first_name} {manager.last_name}</strong>?
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      <strong>Warning:</strong> This action cannot be undone. All data associated with this manager will be permanently deleted.
                    </p>
                  </div>
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
                  onClick={handleDeleteManager}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDetail;
