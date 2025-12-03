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
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [permissionsSaving, setPermissionsSaving] = useState(false);

  usePageTitle(manager ? `${manager.first_name} ${manager.last_name}` : 'Manager Details');

  useEffect(() => {
    if (!managerId) return;
    fetchManager();
    fetchPermissionsData();
  }, [managerId]);

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

      // Get current user's account
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      // Fetch all permissions
      const { data: perms } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      // Fetch role templates with their permissions (system + account-specific)
      const { data: templates } = await supabase
        .from('role_templates')
        .select(`
          *,
          role_template_permissions (
            permissions (code)
          )
        `)
        .or(`is_system.eq.true,account_id.eq.${userData?.account_id}`)
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });

      // Fetch existing user permissions (account-wide only)
      const { data: existingPerm } = await supabase
        .from('user_permissions')
        .select(`
          *,
          role_templates (code, name)
        `)
        .eq('user_id', managerId)
        .maybeSingle();

      setAllPermissions(perms || []);
      setRoleTemplates(templates || []);

      // Set up existing permissions
      if (existingPerm) {
        setUserPermissions(existingPerm);

        if (existingPerm.role_template_id) {
          setSelectedTemplate(existingPerm.role_template_id);
          setCustomPermissions([]);
        } else {
          setSelectedTemplate(null);
          setCustomPermissions(existingPerm.custom_permissions || []);
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
      <div className="flex items-center justify-center py-12">
        <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading manager details...</span>
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

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Sticky Manager Info */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {/* Manager Header */}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 border-2 border-white/30">
                  {`${manager.first_name?.[0] || ''}${manager.last_name?.[0] || ''}`.toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {manager.first_name} {manager.last_name}
                </h2>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                  Manager
                </span>
              </div>

              {/* Manager Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{manager.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {managerVenues.length} venue{managerVenues.length !== 1 ? 's' : ''} assigned
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedTemplate
                      ? roleTemplates.find(t => t.id === selectedTemplate)?.name || 'Template'
                      : `${customPermissions.length} custom permissions`
                    }
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <PermissionGate permission="managers.remove">
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={saving || deleting}
                    className="w-full px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Manager
                  </button>
                </div>
              </PermissionGate>
            </div>
          </div>
        </div>

        {/* Right Column - Configurable Sections */}
        <div className="flex-1 space-y-6">
          {/* Venue Access Section */}
          <ChartCard
            title="Venue Access"
            subtitle="Select which venues this manager can access"
          >
            <PermissionGate permission="managers.invite">
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                  {allVenues.map(venue => (
                    <label
                      key={venue.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={editedVenueIds.includes(venue.id)}
                        onChange={() => handleVenueToggle(venue.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 h-4 w-4"
                        disabled={saving}
                      />
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{venue.name}</span>
                      {editedVenueIds.includes(venue.id) && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </label>
                  ))}
                </div>

                {hasChanges && (
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      onClick={handleSaveVenues}
                      loading={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Venue Access
                    </Button>
                  </div>
                )}
              </div>
            </PermissionGate>
          </ChartCard>

          {/* Permissions Section */}
          <PermissionGate permission="managers.permissions">
            <ChartCard
              title="Permissions"
              subtitle="Configure what this manager can access in the dashboard"
            >
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
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

                    {/* System Templates */}
                    {roleTemplates.filter(t => t.is_system).length > 0 && (
                      <>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          System Templates
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
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
                      </>
                    )}

                    {/* Custom Templates */}
                    {roleTemplates.filter(t => !t.is_system).length > 0 && (
                      <>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          Custom Templates
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {roleTemplates.filter(t => !t.is_system).map(template => (
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
                      </>
                    )}
                  </div>

                  {/* Individual Permissions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Individual Permissions
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedTemplate ? 'Based on selected role template - click "Edit Permissions" to customise' : 'Custom permissions selected'}
                        </p>
                      </div>
                      {selectedTemplate ? (
                        <button
                          onClick={() => {
                            setSelectedTemplate(null);
                            setCustomPermissions(templatePermissions);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Permissions
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const firstTemplate = roleTemplates[0];
                            if (firstTemplate) {
                              setSelectedTemplate(firstTemplate.id);
                              setCustomPermissions([]);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Use Template
                        </button>
                      )}
                    </div>

                    {/* Custom mode info banner */}
                    {!selectedTemplate && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 flex items-start gap-3 mb-3">
                        <Edit2 className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            Custom Permissions Mode
                          </p>
                          <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                            Toggle individual permissions below. Click "Use Template" to switch back to a predefined role.
                          </p>
                        </div>
                      </div>
                    )}

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
                                  const isLocked = !!selectedTemplate;
                                  return (
                                    <label
                                      key={perm.code}
                                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                        isLocked
                                          ? 'cursor-default'
                                          : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                      } ${enabled ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={() => !isLocked && togglePermission(perm.code)}
                                        disabled={isLocked}
                                        className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                                          isLocked ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                      />
                                      <div className="flex-1">
                                        <div className={`text-sm font-medium ${
                                          isLocked
                                            ? 'text-gray-500 dark:text-gray-400'
                                            : 'text-gray-900 dark:text-white'
                                        }`}>
                                          {perm.name}
                                        </div>
                                        {perm.description && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {perm.description}
                                          </div>
                                        )}
                                      </div>
                                      {isLocked && (
                                        <Shield className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                      )}
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
                      disabled={permissionsSaving}
                      loading={permissionsSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Permissions
                    </Button>
                  </div>
                </div>
              )}
            </ChartCard>
          </PermissionGate>
        </div>
      </div>

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
