import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft, Mail, Building2, Save, Trash2, Shield, User,
  ChevronDown, ChevronRight, Check, RefreshCw,
  MessageSquare, Edit2, BarChart3, Users, Map, Settings,
  QrCode, Sparkles, Star, CreditCard
} from 'lucide-react';

// Permission category icons
const categoryIcons = {
  feedback: MessageSquare,
  questions: Edit2,
  reports: BarChart3,
  nps: Star,
  staff: Users,
  managers: Shield,
  venue: Settings,
  floorplan: Map,
  qr: QrCode,
  ai: Sparkles,
  reviews: Star,
  billing: CreditCard,
  multivenue: Building2
};

// Permission category labels
const categoryLabels = {
  feedback: 'Feedback',
  questions: 'Questions',
  reports: 'Reports',
  nps: 'NPS',
  staff: 'Staff',
  managers: 'Managers',
  venue: 'Venue Settings',
  floorplan: 'Floor Plan',
  qr: 'QR Codes',
  ai: 'AI Features',
  reviews: 'Reviews',
  billing: 'Billing',
  multivenue: 'Multi-Venue'
};

const ManagerDetail = () => {
  const { managerId } = useParams();
  const navigate = useNavigate();
  const { allVenues } = useVenue();

  const [manager, setManager] = useState(null);
  const [managerVenues, setManagerVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Manager edit state
  const [editedVenueIds, setEditedVenueIds] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Permissions state
  const [allPermissions, setAllPermissions] = useState([]);
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [userPermissions, setUserPermissions] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customPermissions, setCustomPermissions] = useState([]);
  const [permissionScope, setPermissionScope] = useState('account');
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [permissionsSaving, setPermissionsSaving] = useState(false);

  usePageTitle(manager ? `${manager.first_name} ${manager.last_name}` : 'Manager Details');

  useEffect(() => {
    if (!managerId) return;
    fetchManager();
  }, [managerId]);

  useEffect(() => {
    if (!managerId) return;
    if (activeTab === 'permissions') {
      fetchPermissionsData();
    }
  }, [managerId, activeTab]);

  const fetchManager = async () => {
    setLoading(true);
    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, created_at')
        .eq('id', managerId)
        .is('deleted_at', null)
        .single();

      if (userError) throw userError;

      // Fetch venue assignments
      const { data: staffData } = await supabase
        .from('staff')
        .select('venue_id')
        .eq('user_id', managerId)
        .eq('role', 'manager');

      const venueIds = staffData?.map(s => s.venue_id) || [];

      setManager(userData);
      setManagerVenues(venueIds);
      setEditedVenueIds(venueIds);
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

      // Fetch all permissions
      const { data: perms } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      // Fetch role templates with their permissions
      const { data: templates } = await supabase
        .from('role_templates')
        .select(`
          *,
          role_template_permissions (
            permissions (code)
          )
        `)
        .or('is_system.eq.true,account_id.is.null')
        .order('name', { ascending: true });

      // Fetch existing user permissions
      const { data: existingPerms } = await supabase
        .from('user_permissions')
        .select(`
          *,
          role_templates (code, name)
        `)
        .eq('user_id', managerId);

      setAllPermissions(perms || []);
      setRoleTemplates(templates || []);

      // Set up existing permissions
      if (existingPerms && existingPerms.length > 0) {
        const venueSpecific = existingPerms.find(p => p.venue_id);
        const accountWide = existingPerms.find(p => !p.venue_id);
        const currentPerm = venueSpecific || accountWide;

        setUserPermissions(currentPerm);
        setPermissionScope(venueSpecific ? 'venue' : 'account');
        setSelectedVenueId(venueSpecific?.venue_id || null);

        if (currentPerm.role_template_id) {
          setSelectedTemplate(currentPerm.role_template_id);
          setCustomPermissions([]);
        } else {
          setSelectedTemplate(null);
          setCustomPermissions(currentPerm.custom_permissions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching permissions data:', err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const grouped = {};
    allPermissions.forEach(perm => {
      if (!grouped[perm.category]) grouped[perm.category] = [];
      grouped[perm.category].push(perm);
    });
    return grouped;
  }, [allPermissions]);

  // Get permissions for selected template
  const templatePermissions = useMemo(() => {
    if (!selectedTemplate) return [];
    const template = roleTemplates.find(t => t.id === selectedTemplate);
    return template?.role_template_permissions?.map(rtp => rtp.permissions?.code).filter(Boolean) || [];
  }, [selectedTemplate, roleTemplates]);

  const handleVenueToggle = (venueId) => {
    setEditedVenueIds(prev => {
      const newIds = prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId];
      setHasChanges(JSON.stringify(newIds.sort()) !== JSON.stringify(managerVenues.sort()));
      return newIds;
    });
  };

  const handleSaveVenues = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Delete existing staff records for this manager
      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('user_id', managerId);

      if (deleteError) throw deleteError;

      // Create new staff records for selected venues
      if (editedVenueIds.length > 0) {
        const newStaffRecords = editedVenueIds.map(vid => ({
          user_id: managerId,
          venue_id: vid,
          role: 'manager'
        }));

        const { error: insertError } = await supabase.from('staff').insert(newStaffRecords);
        if (insertError) throw insertError;
      }

      setMessage('Manager venue assignments updated successfully!');
      setManagerVenues(editedVenueIds);
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating manager venues:', error);
      setMessage('Failed to update venue assignments. Please try again.');
    } finally {
      setSaving(false);
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
        body: JSON.stringify({ managerId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete manager');

      navigate('/staff/list');
    } catch (error) {
      console.error('Error deleting manager:', error);
      setMessage('Failed to delete manager: ' + error.message);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Permission handlers
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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
      const currentUserId = session?.user?.id;

      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', currentUserId)
        .single();

      if (!userData?.account_id) {
        throw new Error('Could not determine account');
      }

      const permissionData = {
        user_id: managerId,
        account_id: userData.account_id,
        venue_id: permissionScope === 'venue' ? selectedVenueId : null,
        role_template_id: selectedTemplate || null,
        custom_permissions: selectedTemplate ? [] : customPermissions,
        created_by: currentUserId
      };

      if (userPermissions?.id) {
        const { error } = await supabase
          .from('user_permissions')
          .update(permissionData)
          .eq('id', userPermissions.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionData);

        if (error) throw error;
      }

      setMessage('Permissions saved successfully!');
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
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading manager details...</span>
        </div>
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="space-y-6">
        <ChartCard title="Manager Not Found">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">The manager you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => navigate('/staff/list')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              ← Back to Staff List
            </button>
          </div>
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/staff/list')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Staff List
      </button>

      <ChartCard
        title="Manager Details"
        subtitle={`Manage information for ${manager.first_name} ${manager.last_name}`}
        actions={
          <PermissionGate permission="managers.remove">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={saving || deleting}
              className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </PermissionGate>
        }
      >
        <div className="space-y-6">
          {/* Manager Preview Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {`${manager.first_name?.[0] || ''}${manager.last_name?.[0] || ''}`.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {manager.first_name} {manager.last_name}
                  </h2>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-full">
                    Manager
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{manager.email}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm">
                    <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {managerVenues.length} venue{managerVenues.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <User className={`w-4 h-4 mr-2 ${
                  activeTab === 'details' ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                Details
              </button>
              <PermissionGate permission="managers.permissions">
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'permissions'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Shield className={`w-4 h-4 mr-2 ${
                    activeTab === 'permissions' ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  Permissions
                </button>
              </PermissionGate>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Venue Assignments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Venue Access</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Select which venues this manager can access
                </p>
                <PermissionGate permission="managers.invite">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {allVenues.map(venue => (
                        <label key={venue.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editedVenueIds.includes(venue.id)}
                            onChange={() => handleVenueToggle(venue.id)}
                            className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 h-4 w-4"
                            disabled={saving}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{venue.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {hasChanges && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="primary"
                        onClick={handleSaveVenues}
                        loading={saving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </PermissionGate>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Permission Scope */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permission Scope
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPermissionScope('account')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                          permissionScope === 'account'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="font-medium text-sm">Account-wide</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Same permissions for all venues
                        </div>
                      </button>
                      <button
                        onClick={() => setPermissionScope('venue')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                          permissionScope === 'venue'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="font-medium text-sm">Venue-specific</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Different permissions per venue
                        </div>
                      </button>
                    </div>

                    {permissionScope === 'venue' && (
                      <div className="mt-3">
                        <select
                          value={selectedVenueId || ''}
                          onChange={(e) => setSelectedVenueId(e.target.value || null)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select a venue...</option>
                          {allVenues.map(venue => (
                            <option key={venue.id} value={venue.id}>{venue.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Role Templates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role Template
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Select a predefined role or customise individual permissions below
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {roleTemplates.filter(t => t.is_system).map(template => (
                        <button
                          key={template.id}
                          onClick={() => selectTemplate(template.id)}
                          className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                            selectedTemplate === template.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {template.name}
                            </span>
                            {selectedTemplate === template.id && (
                              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {template.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Permissions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Permissions
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedTemplate ? 'Based on selected role template' : 'Custom permissions selected'}
                        </p>
                      </div>
                      {selectedTemplate && (
                        <button
                          onClick={() => {
                            setSelectedTemplate(null);
                            setCustomPermissions(templatePermissions);
                          }}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Customise
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {Object.entries(permissionsByCategory).map(([category, perms]) => {
                        const CategoryIcon = categoryIcons[category] || Shield;
                        const enabledCount = perms.filter(p => isPermissionEnabled(p.code)).length;
                        const isExpanded = expandedCategories[category];

                        return (
                          <div
                            key={category}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <CategoryIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  {categoryLabels[category] || category}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  enabledCount === perms.length
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : enabledCount > 0
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {enabledCount}/{perms.length}
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="px-4 py-2 space-y-1 bg-white dark:bg-gray-900">
                                {perms.map(perm => {
                                  const enabled = isPermissionEnabled(perm.code);
                                  return (
                                    <label
                                      key={perm.code}
                                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                        enabled
                                          ? 'bg-green-50 dark:bg-green-900/10'
                                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                      } ${selectedTemplate ? 'opacity-75 cursor-default' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={() => !selectedTemplate && togglePermission(perm.code)}
                                        disabled={!!selectedTemplate}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                                      />
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                          {perm.name}
                                        </div>
                                        {perm.description && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {perm.description}
                                          </div>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Permissions Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedTemplate ? (
                        <span>Using template: <strong>{roleTemplates.find(t => t.id === selectedTemplate)?.name}</strong></span>
                      ) : (
                        <span><strong>{customPermissions.length}</strong> custom permissions selected</span>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleSavePermissions}
                      disabled={permissionsSaving || (permissionScope === 'venue' && !selectedVenueId)}
                      loading={permissionsSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Permissions
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success/Error Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </ChartCard>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Manager
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete <strong>{manager.first_name} {manager.last_name}</strong>?
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Note:</strong> This manager can be recovered within 14 days.
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
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {deleting ? 'Deleting...' : 'Delete Manager'}
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
