import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import {
  Shield, ChevronDown, ChevronRight, Check, X, Save,
  AlertCircle, Eye, Edit2, MessageSquare, BarChart3,
  Users, Map, Settings, QrCode, Sparkles, Star, CreditCard,
  Building2, RefreshCw
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

const PermissionsManager = ({ userId, userName, onClose, onSave }) => {
  const { allVenues, venueId: currentVenueId } = useVenue();

  const [allPermissions, setAllPermissions] = useState([]);
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [userPermissions, setUserPermissions] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customPermissions, setCustomPermissions] = useState([]);
  const [permissionScope, setPermissionScope] = useState('account'); // 'account' or 'venue'
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Fetch all available permissions and role templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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
          .eq('user_id', userId);

        setAllPermissions(perms || []);
        setRoleTemplates(templates || []);

        // Set up existing permissions
        if (existingPerms && existingPerms.length > 0) {
          // Check for venue-specific or account-wide
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
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Group permissions by category
  const permissionsByCategory = React.useMemo(() => {
    const grouped = {};
    allPermissions.forEach(perm => {
      if (!grouped[perm.category]) grouped[perm.category] = [];
      grouped[perm.category].push(perm);
    });
    return grouped;
  }, [allPermissions]);

  // Get permissions for selected template
  const templatePermissions = React.useMemo(() => {
    if (!selectedTemplate) return [];
    const template = roleTemplates.find(t => t.id === selectedTemplate);
    return template?.role_template_permissions?.map(rtp => rtp.permissions?.code).filter(Boolean) || [];
  }, [selectedTemplate, roleTemplates]);

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle individual permission
  const togglePermission = (code) => {
    setSelectedTemplate(null); // Switch to custom mode
    setCustomPermissions(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
  };

  // Check if permission is enabled
  const isPermissionEnabled = (code) => {
    if (selectedTemplate) {
      return templatePermissions.includes(code);
    }
    return customPermissions.includes(code);
  };

  // Select role template
  const selectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    setCustomPermissions([]);
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      // Get account_id from current user
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', currentUserId)
        .single();

      if (!userData?.account_id) {
        throw new Error('Could not determine account');
      }

      // Prepare permission data
      const permissionData = {
        user_id: userId,
        account_id: userData.account_id,
        venue_id: permissionScope === 'venue' ? selectedVenueId : null,
        role_template_id: selectedTemplate || null,
        custom_permissions: selectedTemplate ? [] : customPermissions,
        created_by: currentUserId
      };

      if (userPermissions?.id) {
        // Update existing
        const { error } = await supabase
          .from('user_permissions')
          .update(permissionData)
          .eq('id', userPermissions.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionData);

        if (error) throw error;
      }

      onSave?.();
      onClose?.();
    } catch (err) {
      console.error('Error saving permissions:', err);
      alert('Failed to save permissions: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage Permissions
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-sm">Venue-specific</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Different permissions per venue
                </div>
              </button>
            </div>

            {/* Venue selector */}
            {permissionScope === 'venue' && (
              <div className="mt-3">
                <select
                  value={selectedVenueId || ''}
                  onChange={(e) => setSelectedVenueId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Customise
                </button>
              )}
            </div>

            <div className="space-y-2">
              {Object.entries(permissionsByCategory).map(([category, perms]) => {
                const CategoryIcon = categoryIcons[category] || Eye;
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
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedTemplate ? (
                <span>Using template: <strong>{roleTemplates.find(t => t.id === selectedTemplate)?.name}</strong></span>
              ) : (
                <span><strong>{customPermissions.length}</strong> custom permissions selected</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (permissionScope === 'venue' && !selectedVenueId)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManager;
