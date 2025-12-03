import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenue } from '../../../context/VenueContext';
import usePageTitle from '../../../hooks/usePageTitle';
import {
  Key,
  Shield,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  X
} from 'lucide-react';

// Default permission categories and actions
const PERMISSION_CATEGORIES = {
  dashboard: {
    label: 'Dashboard',
    permissions: [
      { code: 'dashboard.view', label: 'View Dashboard' }
    ]
  },
  feedback: {
    label: 'Feedback',
    permissions: [
      { code: 'feedback.view', label: 'View Feedback' },
      { code: 'feedback.edit', label: 'Edit Questions' },
      { code: 'feedback.export', label: 'Export Data' }
    ]
  },
  reports: {
    label: 'Reports',
    permissions: [
      { code: 'reports.view', label: 'View Reports' },
      { code: 'reports.export', label: 'Export Reports' }
    ]
  },
  staff: {
    label: 'Staff',
    permissions: [
      { code: 'staff.view', label: 'View Staff' },
      { code: 'staff.edit', label: 'Edit Employees' }
    ]
  },
  managers: {
    label: 'Managers',
    permissions: [
      { code: 'managers.view', label: 'View Managers' },
      { code: 'managers.invite', label: 'Invite Managers' },
      { code: 'managers.delete', label: 'Delete Managers' },
      { code: 'managers.permissions', label: 'Manage Permissions' }
    ]
  },
  settings: {
    label: 'Settings',
    permissions: [
      { code: 'settings.view', label: 'View Settings' },
      { code: 'settings.edit', label: 'Edit Settings' },
      { code: 'settings.branding', label: 'Edit Branding' }
    ]
  }
};

// Default templates
const DEFAULT_TEMPLATES = [
  {
    id: 'full-access',
    name: 'Full Access',
    description: 'Complete access to all features',
    isDefault: true,
    permissions: Object.values(PERMISSION_CATEGORIES).flatMap(cat => cat.permissions.map(p => p.code))
  },
  {
    id: 'standard',
    name: 'Standard Manager',
    description: 'View and edit most features, no manager management',
    isDefault: true,
    permissions: [
      'dashboard.view',
      'feedback.view', 'feedback.edit', 'feedback.export',
      'reports.view', 'reports.export',
      'staff.view', 'staff.edit',
      'managers.view',
      'settings.view'
    ]
  },
  {
    id: 'view-only',
    name: 'View Only',
    description: 'Read-only access to view data',
    isDefault: true,
    permissions: [
      'dashboard.view',
      'feedback.view',
      'reports.view',
      'staff.view',
      'managers.view',
      'settings.view'
    ]
  }
];

const RoleTemplates = () => {
  usePageTitle('Role Templates');
  const navigate = useNavigate();
  const { userRole } = useVenue();

  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', permissions: [] });

  useEffect(() => {
    if (userRole !== 'master') {
      navigate('/dashboard');
      return;
    }
    // In a real implementation, fetch custom templates from database
  }, [userRole, navigate]);

  const toggleTemplateExpanded = (templateId) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  const handlePermissionToggle = (templateId, permissionCode) => {
    if (templates.find(t => t.id === templateId)?.isDefault) return;

    setTemplates(prev => prev.map(template => {
      if (template.id !== templateId) return template;

      const hasPermission = template.permissions.includes(permissionCode);
      return {
        ...template,
        permissions: hasPermission
          ? template.permissions.filter(p => p !== permissionCode)
          : [...template.permissions, permissionCode]
      };
    }));
  };

  const handleCreateTemplate = () => {
    const id = `custom-${Date.now()}`;
    setTemplates(prev => [...prev, { ...newTemplate, id, isDefault: false }]);
    setNewTemplate({ name: '', description: '', permissions: [] });
    setShowCreateModal(false);
  };

  const handleDeleteTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) return;

    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  if (userRole !== 'master') {
    return null;
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Shield className="w-4 h-4" />
          <span>Administration</span>
          <ChevronRight className="w-4 h-4" />
          <span>Permissions</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Templates</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage permission templates for quick manager setup
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
          >
            {/* Template Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => toggleTemplateExpanded(template.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  template.isDefault
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'bg-rose-100 dark:bg-rose-900/30'
                }`}>
                  <Key className={`w-5 h-5 ${
                    template.isDefault
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                    {template.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="space-y-4">
                  {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                    <div key={categoryKey}>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {category.label}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {category.permissions.map((permission) => {
                          const hasPermission = template.permissions.includes(permission.code);
                          return (
                            <label
                              key={permission.code}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                template.isDefault
                                  ? 'cursor-not-allowed opacity-75'
                                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                              } ${
                                hasPermission
                                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => handlePermissionToggle(template.id, permission.code)}
                                disabled={template.isDefault}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                hasPermission
                                  ? 'bg-green-500'
                                  : 'border border-gray-300 dark:border-gray-600'
                              }`}>
                                {hasPermission && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {permission.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delete button for custom templates */}
                {!template.isDefault && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Template
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
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
                  placeholder="e.g., Shift Supervisor"
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
                  {DEFAULT_TEMPLATES.map((t) => (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        JSON.stringify(newTemplate.permissions) === JSON.stringify(t.permissions)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="baseTemplate"
                        checked={JSON.stringify(newTemplate.permissions) === JSON.stringify(t.permissions)}
                        onChange={() => setNewTemplate(prev => ({ ...prev, permissions: [...t.permissions] }))}
                        className="sr-only"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleTemplates;
