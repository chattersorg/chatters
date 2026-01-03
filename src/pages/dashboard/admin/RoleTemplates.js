import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import usePageTitle from '../../../hooks/usePageTitle';
import { Button } from '../../../components/ui/button';
import {
  Key,
  Check,
  Plus,
  Trash2,
  X,
  Save,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { permissionSections } from '../../../config/permissions';

const RoleTemplates = () => {
  usePageTitle('Role Templates');
  const navigate = useNavigate();
  const { userRole } = useVenue();

  const [templates, setTemplates] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPermission, setSavingPermission] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);
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

      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!userData?.account_id) return;
      setAccountId(userData.account_id);

      // Fetch all permissions (excluding billing)
      const { data: perms } = await supabase
        .from('permissions')
        .select('*')
        .neq('category', 'billing')
        .order('category', { ascending: true });

      setAllPermissions(perms || []);

      // Fetch role templates
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

      const transformedTemplates = (templatesData || []).map(t => ({
        ...t,
        permissions: t.role_template_permissions?.map(rtp => rtp.permissions?.code).filter(Boolean) || []
      }));

      setTemplates(transformedTemplates);

      if (transformedTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(transformedTemplates[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Get permission details by code
  const getPermission = useCallback((code) => {
    return allPermissions.find(p => p.code === code);
  }, [allPermissions]);

  // Handle permission toggle with dependency logic
  const handlePermissionToggle = useCallback(async (templateId, permissionCode, requiresBase) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.is_system) return;

    const hasPermission = template.permissions.includes(permissionCode);
    const perm = getPermission(permissionCode);
    if (!perm) return;

    setSavingPermission(permissionCode);

    // Minimum delay to show loading state
    const minDelay = new Promise(resolve => setTimeout(resolve, 400));

    try {
      const dbOperation = async () => {
        if (hasPermission) {
          // Removing permission
          const permissionsToRemove = [permissionCode];

          // If removing a base permission, also remove all permissions that depend on it
          const dependentPermissions = permissionSections
            .flatMap(s => s.permissions)
            .filter(p => p.requiresBase === permissionCode)
            .map(p => p.code)
            .filter(code => template.permissions.includes(code));

          permissionsToRemove.push(...dependentPermissions);

          // Remove from database
          for (const code of permissionsToRemove) {
            const p = getPermission(code);
            if (p) {
              await supabase
                .from('role_template_permissions')
                .delete()
                .eq('role_template_id', templateId)
                .eq('permission_id', p.id);
            }
          }

          // Update local state
          setTemplates(prev => prev.map(t =>
            t.id === templateId
              ? { ...t, permissions: t.permissions.filter(p => !permissionsToRemove.includes(p)) }
              : t
          ));
        } else {
          // Adding permission
          await supabase
            .from('role_template_permissions')
            .insert({
              role_template_id: templateId,
              permission_id: perm.id
            });

          setTemplates(prev => prev.map(t =>
            t.id === templateId
              ? { ...t, permissions: [...t.permissions, permissionCode] }
              : t
          ));
        }
      };

      // Wait for both the database operation and minimum delay
      await Promise.all([dbOperation(), minDelay]);
    } catch (error) {
      console.error('Error toggling permission:', error);
      setMessage('Failed to update permission');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSavingPermission(null);
    }
  }, [templates, getPermission]);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !accountId) return;

    try {
      setSaving(true);

      const baseCode = newTemplate.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      const uniqueCode = `custom_${baseCode}_${Date.now()}`;

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

      if (newTemplate.permissions.length > 0) {
        const permissionInserts = newTemplate.permissions.map(code => {
          const perm = allPermissions.find(p => p.code === code);
          return perm ? {
            role_template_id: createdTemplate.id,
            permission_id: perm.id
          } : null;
        }).filter(Boolean);

        if (permissionInserts.length > 0) {
          await supabase
            .from('role_template_permissions')
            .insert(permissionInserts);
        }
      }

      setMessage('Template created successfully!');
      setTimeout(() => setMessage(''), 3000);
      setNewTemplate({ name: '', description: '', permissions: [] });
      setShowCreateModal(false);
      await fetchData();
      setSelectedTemplate(createdTemplate.id);
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
      await supabase
        .from('role_template_permissions')
        .delete()
        .eq('role_template_id', templateId);

      await supabase
        .from('role_templates')
        .delete()
        .eq('id', templateId);

      setMessage('Template deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      setTemplates(prev => prev.filter(t => t.id !== templateId));

      const remaining = templates.filter(t => t.id !== templateId);
      if (remaining.length > 0) {
        setSelectedTemplate(remaining[0].id);
      } else {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage('Failed to delete template: ' + error.message);
    }
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  // Render a permission row with checkbox, label and description
  const PermissionRow = ({ code, label, description, requiresBase }) => {
    if (!currentTemplate) return null;

    const hasPermission = currentTemplate.permissions.includes(code);
    const isSaving = savingPermission === code;
    const isSystemTemplate = currentTemplate.is_system;
    // Disable if requires a base permission that isn't granted
    const isDisabled = requiresBase && !currentTemplate.permissions.includes(requiresBase);
    const permissionExists = getPermission(code);
    const isChild = !!requiresBase;

    // Don't render if permission doesn't exist in database
    if (!permissionExists) return null;

    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
          isChild ? 'ml-6' : ''
        } ${
          isDisabled
            ? 'cursor-not-allowed opacity-50 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'
            : isSystemTemplate
              ? 'cursor-default border-gray-200 dark:border-gray-700'
              : 'cursor-pointer border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        onClick={(e) => {
          e.preventDefault();
          if (!isDisabled && !isSystemTemplate && !isSaving) {
            handlePermissionToggle(currentTemplate.id, code, requiresBase);
          }
        }}
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          hasPermission && !isDisabled
            ? 'bg-blue-500'
            : isDisabled
              ? 'border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
              : 'border-2 border-gray-300 dark:border-gray-600'
        }`}>
          {isSaving ? (
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          ) : hasPermission && !isDisabled ? (
            <Check className="w-3 h-3 text-white" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${
            isDisabled
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-gray-900 dark:text-white'
          }`}>
            {label}
          </div>
          <div className={`text-xs mt-0.5 ${
            isDisabled
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {description}
          </div>
        </div>
      </div>
    );
  };

  if (userRole !== 'master') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Role Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Define reusable permission sets for your managers
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('success')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex min-h-[600px]">
            {/* Left Sidebar - Template Tabs */}
            <div className="w-56 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Templates
                </h3>
              </div>
              <div className="p-2 space-y-1">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      selectedTemplate === template.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Key className={`w-4 h-4 flex-shrink-0 ${
                        selectedTemplate === template.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{template.name}</span>
                          {template.is_system && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded flex-shrink-0">
                              System
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {template.permissions.length} permissions
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel - Hierarchical Permissions */}
            <div className="flex-1 overflow-auto">
              {currentTemplate ? (
                <div className="p-4">
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentTemplate.name}
                      </h2>
                      {currentTemplate.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {currentTemplate.description}
                        </p>
                      )}
                    </div>
                    {!currentTemplate.is_system && (
                      <button
                        onClick={() => handleDeleteTemplate(currentTemplate.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {currentTemplate.is_system && (
                    <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                      System templates cannot be modified. Create a custom template to customize permissions.
                    </div>
                  )}

                  {/* Permissions List */}
                  <div className="space-y-6">
                    {permissionSections.map((section) => {
                      // Check if any permission in this section exists in the database
                      const hasAnyPermission = section.permissions.some(p => getPermission(p.code));
                      if (!hasAnyPermission) return null;

                      return (
                        <div key={section.title}>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            {section.title}
                          </h3>
                          <div className="space-y-2">
                            {section.permissions.map(perm => (
                              <PermissionRow
                                key={perm.code}
                                code={perm.code}
                                label={perm.label}
                                description={perm.description}
                                requiresBase={perm.requiresBase}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  Select a template to view permissions
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
