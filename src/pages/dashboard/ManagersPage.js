import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import { usePermissions, PermissionGate } from '../../context/PermissionsContext';
import usePageTitle from '../../hooks/usePageTitle';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import { Button } from '../../components/ui/button';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Building2,
  Mail,
  Calendar,
  UserPlus,
  Settings,
  Trash2,
  MoreVertical
} from 'lucide-react';

const ManagersPage = () => {
  usePageTitle('Managers');
  const navigate = useNavigate();
  const { userRole, allVenues } = useVenue();
  const { hasPermission } = usePermissions();

  const [managers, setManagers] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'hierarchy'

  const fetchManagers = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/managers/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch managers');
      }

      const data = await response.json();
      setManagers(data.managers || []);
      setHierarchy(data.hierarchy);

      // Expand all nodes by default for hierarchy view
      if (data.hierarchy) {
        const allIds = new Set();
        const collectIds = (nodes) => {
          nodes.forEach(node => {
            allIds.add(node.id);
            if (node.children) collectIds(node.children);
          });
        };
        collectIds(data.hierarchy);
        setExpandedNodes(allIds);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission('managers.view')) {
      fetchManagers();
    }
  }, [hasPermission, fetchManagers]);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const filteredManagers = managers.filter(manager => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${manager.first_name || ''} ${manager.last_name || ''}`.toLowerCase();
    return fullName.includes(searchLower) ||
           manager.email?.toLowerCase().includes(searchLower) ||
           manager.venues?.some(v => v.name.toLowerCase().includes(searchLower));
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderHierarchyNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-3 py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          onClick={() => navigate(`/staff/managers/${node.id}`)}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node.id);
            }}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${!hasChildren ? 'invisible' : ''}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {`${node.first_name?.[0] || ''}${node.last_name?.[0] || ''}`.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {node.first_name} {node.last_name}
              </span>
              {node.invited_by_name && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  invited by {node.invited_by_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="truncate">{node.email}</span>
              {node.venues && node.venues.length > 0 && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {node.venues.length} venue{node.venues.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <PermissionGate permission="managers.permissions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/staff/managers/${node.id}`);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Manage permissions"
              >
                <Settings className="w-4 h-4" />
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderHierarchyNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!hasPermission('managers.view')) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view managers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Managers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {userRole === 'master'
              ? 'Manage all managers in your organisation'
              : 'View and manage your team members'}
          </p>
        </div>
        <PermissionGate permission="managers.invite">
          <Button
            variant="primary"
            onClick={() => navigate('/staff/managers/add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Manager
          </Button>
        </PermissionGate>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search managers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {hierarchy && userRole === 'master' && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'hierarchy'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Hierarchy
            </button>
          </div>
        )}
      </div>

      {/* Managers Content */}
      <ChartCard>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : managers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No managers found</p>
            <PermissionGate permission="managers.invite">
              <Button
                variant="secondary"
                onClick={() => navigate('/staff/managers/add')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite your first manager
              </Button>
            </PermissionGate>
          </div>
        ) : viewMode === 'hierarchy' && hierarchy ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {hierarchy.map(node => renderHierarchyNode(node))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredManagers.map((manager) => (
              <div
                key={manager.id}
                className="flex items-center gap-4 py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/staff/managers/${manager.id}`)}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {`${manager.first_name?.[0] || ''}${manager.last_name?.[0] || ''}`.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {manager.first_name} {manager.last_name}
                    </span>
                    {manager.invited_by_name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        invited by {manager.invited_by_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {manager.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {formatDate(manager.created_at)}
                    </span>
                  </div>
                </div>

                {/* Venues */}
                <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
                  {manager.venues?.slice(0, 2).map((venue) => (
                    <span
                      key={venue.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    >
                      <Building2 className="w-3 h-3" />
                      {venue.name}
                    </span>
                  ))}
                  {manager.venues?.length > 2 && (
                    <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                      +{manager.venues.length - 2} more
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
};

export default ManagersPage;
