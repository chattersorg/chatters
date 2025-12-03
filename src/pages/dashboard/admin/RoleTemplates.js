import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import usePageTitle from '../../../hooks/usePageTitle';
import { ChartCard } from '../../../components/dashboard/layout/ModernCard';
import { Button } from '../../../components/ui/button';
import {
  Key,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  X,
  Save,
  RefreshCw
} from 'lucide-react';

const RoleTemplates = () => {
  usePageTitle('Role Templates');
  const navigate = useNavigate();
  const { userRole } = useVenue();

  const [templates, setTemplates] = useState([]);
  const [originalTemplates, setOriginalTemplates] = useState([]); // Track original state for comparison
  const [allPermissions, setAllPermissions] = useState([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTemplateId, setSavingTemplateId] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', permissions: [] });
  const [message, setMessage] = useState('');
  const [accountId, setAccountId] = useState(null);

  useEffect(() => {
    if (userRole !== 'master') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [userRole, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user's account
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!userData?.account_id) return;
      setAccountId(userData.account_id);

      // Fetch all permissions
      const { data: perms } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      setAllPermissions(perms || []);

      // Group permissions by category
      const grouped = {};
      (perms || []).forEach(perm => {
        if (!grouped[perm.category]) grouped[perm.category] = [];
        grouped[perm.category].push(perm);
      });
      setPermissionsByCategory(grouped);

      // Fetch role templates (system + account-specific)
      const { data: templatesData } = await supabase
        .from('role_templates')
        .select(`
          *,
          role_template_permissions (
            permission_id,
            permissions (code)
          )
        `)
        .or(`is_system.eq.true,account_id.eq.${userData.account_id}`)
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });

      // Transform templates to include permissions array
      const transformedTemplates = (templatesData || []).map(t => ({
        ...t,
        permissions: t.role_template_permissions?.map(rtp => rtp.permissions?.code).filter(Boolean) || []
      }));

      setTemplates(transformedTemplates);
      setOriginalTemplates(JSON.parse(JSON.stringify(transformedTemplates))); // Deep copy for comparison
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplateExpanded = (templateId) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  // Check if a template has unsaved changes
  const hasUnsavedChanges = (templateId) => {
    const current = templates.find(t => t.id === templateId);
    const original = originalTemplates.find(t => t.id === templateId);
    if (!current || !original) return false;

    const currentPerms = [...current.permissions].sort();
    const originalPerms = [...original.permissions].sort();
    return JSON.stringify(currentPerms) !== JSON.stringify(originalPerms);
  };

  const handlePermissionToggle = (templateId, permissionCode) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.is_system) return;

    const hasPermission = template.permissions.includes(permissionCode);
    const newPermissions = hasPermission
      ? template.permissions.filter(p => p !== permissionCode)
      : [...template.permissions, permissionCode];

    // Update locally only - no database save yet
    setTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, permissions: newPermissions } : t
    ));
  };

  const handleSaveTemplate = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    const original = originalTemplates.find(t => t.id === templateId);
    if (!template || template.is_system) return;

    try {
      setSavingTemplateId(templateId);

      // Get current permissions from database
      const currentPerms = new Set(original.permissions);
      const newPerms = new Set(template.permissions);

      // Find permissions to add
      const toAdd = template.permissions.filter(p => !currentPerms.has(p));
      // Find permissions to remove
      const toRemove = original.permissions.filter(p => !newPerms.has(p));

      // Remove permissions
      for (const code of toRemove) {
        const perm = allPermissions.find(p => p.code === code);
        if (perm) {
          await supabase
            .from('role_template_permissions')
            .delete()
            .eq('role_template_id', templateId)
            .eq('permission_id', perm.id);
        }
      }

      // Add permissions
      for (const code of toAdd) {
        const perm = allPermissions.find(p => p.code === code);
        if (perm) {
          await supabase
            .from('role_template_permissions')
            .insert({
              role_template_id: templateId,
              permission_id: perm.id
            });
        }
      }

      // Update original state to match current
      setOriginalTemplates(prev => prev.map(t =>
        t.id === templateId ? { ...t, permissions: [...template.permissions] } : t
      ));

      setMessage('Template saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage('Failed to save template: ' + error.message);
    } finally {
      setSavingTemplateId(null);
    }
  };

  const handleDiscardChanges = (templateId) => {
    const original = originalTemplates.find(t => t.id === templateId);
    if (!original) return;

    setTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, permissions: [...original.permissions] } : t
    ));
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !accountId) return;

    try {
      setSaving(true);

      // Generate a unique code from the name
      const baseCode = newTemplate.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      const uniqueCode = `custom_${baseCode}_${Date.now()}`;

      // Create the template
      const { data: createdTemplate, error: templateError } = await supabase
        .from('role_templates')
        .insert({
          code: uniqueCode,
          name: newTemplate.name,
          description: newTemplate.description,
          account_id: accountId,
          is_system: false
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Add permissions to the template
      if (newTemplate.permissions.length > 0) {
        const permissionInserts = newTemplate.permissions.map(code => {
          const perm = allPermissions.find(p => p.code === code);
          return perm ? {
            role_template_id: createdTemplate.id,
            permission_id: perm.id
          } : null;
        }).filter(Boolean);

        if (permissionInserts.length > 0) {
          const { error: permsError } = await supabase
            .from('role_template_permissions')
            .insert(permissionInserts);

          if (permsError) throw permsError;
        }
      }

      setMessage('Template created successfully!');
      setNewTemplate({ name: '', description: '', permissions: [] });
      setShowCreateModal(false);
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error creating template:', error);
      setMessage('Failed to create template: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.is_system) return;

    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      // Delete permissions first (foreign key)
      await supabase
        .from('role_template_permissions')
        .delete()
        .eq('role_template_id', templateId);

      // Delete the template
      const { error } = await supabase
        .from('role_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setMessage('Template deleted successfully!');
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setOriginalTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage('Failed to delete template: ' + error.message);
    }
  };

  // Get category labels
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

  if (userRole !== 'master') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Role Templates</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create and manage permission templates for quick manager setup
        </p>
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

      {/* Main Content Card */}
      <ChartCard
        title="Permission Templates"
        subtitle="Define reusable permission sets for your managers"
        actions={
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No templates found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => {
              const templateHasChanges = hasUnsavedChanges(template.id);

              return (
                <div
                  key={template.id}
                  className={`border rounded-lg overflow-hidden ${
                    templateHasChanges
                      ? 'border-yellow-400 dark:border-yellow-600'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Template Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => toggleTemplateExpanded(template.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        template.is_system
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <Key className={`w-5 h-5 ${
                          template.is_system
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                          {template.is_system && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                              System
                            </span>
                          )}
                          {templateHasChanges && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                              Unsaved
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {template.permissions.length} permissions
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedTemplate === template.id ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Expanded Permissions */}
                  {expandedTemplate === template.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30">
                      <div className="space-y-4">
                        {Object.entries(permissionsByCategory).map(([categoryKey, perms]) => (
                          <div key={categoryKey}>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {categoryLabels[categoryKey] || categoryKey}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {perms.map((permission) => {
                                const hasPermission = template.permissions.includes(permission.code);
                                return (
                                  <label
                                    key={permission.code}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                      template.is_system
                                        ? 'cursor-not-allowed opacity-75'
                                        : 'cursor-pointer hover:bg-white dark:hover:bg-gray-800'
                                    } ${
                                      hasPermission
                                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!template.is_system) {
                                        handlePermissionToggle(template.id, permission.code);
                                      }
                                    }}
                                  >
                                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                      hasPermission
                                        ? 'bg-green-500'
                                        : 'border border-gray-300 dark:border-gray-600'
                                    }`}>
                                      {hasPermission && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {permission.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons for custom templates */}
                      {!template.is_system && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Template
                          </button>

                          <div className="flex items-center gap-2">
                            {templateHasChanges && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDiscardChanges(template.id);
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                Discard
                              </button>
                            )}
                            <Button
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveTemplate(template.id);
                              }}
                              disabled={!templateHasChanges || savingTemplateId === template.id}
                              loading={savingTemplateId === template.id}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {savingTemplateId === template.id ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Role Template
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Area Manager"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this role"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start with permissions from:
                </label>
                <div className="space-y-2">
                  {templates.filter(t => t.is_system).map((t) => (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        JSON.stringify(newTemplate.permissions.sort()) === JSON.stringify([...t.permissions].sort())
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setNewTemplate(prev => ({ ...prev, permissions: [...t.permissions] }))}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t.description}</div>
                      </div>
                    </label>
                  ))}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      newTemplate.permissions.length === 0
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setNewTemplate(prev => ({ ...prev, permissions: [] }))}
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Start Empty</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">No permissions selected</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name || saving}
                loading={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleTemplates;
