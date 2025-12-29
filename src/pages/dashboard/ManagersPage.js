import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import { usePermissions, PermissionGate } from '../../context/PermissionsContext';
import usePageTitle from '../../hooks/usePageTitle';
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
  X,
  UserCheck,
  Clock
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
           manager.venues?.some(v => v.name?.toLowerCase().includes(searchLower));
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
      <React.Fragment key={node.id}>
        <tr
          className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => navigate(`/staff/managers/${node.id}`)}
        >
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {/* Expand/Collapse Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2 ${!hasChildren ? 'invisible' : ''}`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm mr-3">
                {`${node.first_name?.[0] || ''}${node.last_name?.[0] || ''}`.toUpperCase() || '?'}
              </div>

              {/* Name and Email */}
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {node.first_name} {node.last_name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {node.email}
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-wrap gap-1.5">
              {node.venues?.slice(0, 3).map((venue) => (
                <span
                  key={venue.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                >
                  <Building2 className="w-3 h-3" />
                  {venue.name}
                </span>
              ))}
              {node.venues?.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  +{node.venues.length - 3} more
                </span>
              )}
              {(!node.venues || node.venues.length === 0) && (
                <span className="text-sm text-gray-400 dark:text-gray-500 italic">No venues assigned</span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {node.invited_by_name ? (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UserPlus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                {node.invited_by_name}
              </div>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              {formatDate(node.created_at)}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <PermissionGate permission="managers.permissions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/staff/managers/${node.id}`);
                }}
                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Manage permissions"
              >
                <Settings className="w-4 h-4" />
              </button>
            </PermissionGate>
          </td>
        </tr>

        {/* Children */}
        {hasChildren && isExpanded && node.children.map(child => renderHierarchyNode(child, level + 1))}
      </React.Fragment>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Managers</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {loading ? '-' : managers.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Venues</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {loading ? '-' : [...new Set(managers.flatMap(m => m.venues?.map(v => v.id) || []))].length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Added This Month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {loading ? '-' : managers.filter(m => {
                  const createdAt = new Date(m.created_at);
                  const now = new Date();
                  return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {hierarchy && userRole === 'master' && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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

      {/* Managers Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : managers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No managers yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Invite managers to help you run your venues. They'll be able to access the dashboard based on their permissions.
            </p>
            <PermissionGate permission="managers.invite">
              <Button
                variant="primary"
                onClick={() => navigate('/staff/managers/add')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite your first manager
              </Button>
            </PermissionGate>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Venues
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {viewMode === 'hierarchy' && hierarchy ? (
                  hierarchy.map(node => renderHierarchyNode(node))
                ) : (
                  filteredManagers.map((manager, index) => (
                    <tr
                      key={manager.id}
                      className={`hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'
                      }`}
                      onClick={() => navigate(`/staff/managers/${manager.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm mr-3 flex-shrink-0">
                            {`${manager.first_name?.[0] || ''}${manager.last_name?.[0] || ''}`.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {manager.first_name} {manager.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {manager.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {manager.venues?.slice(0, 3).map((venue) => (
                            <span
                              key={venue.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            >
                              <Building2 className="w-3 h-3" />
                              {venue.name}
                            </span>
                          ))}
                          {manager.venues?.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              +{manager.venues.length - 3} more
                            </span>
                          )}
                          {(!manager.venues || manager.venues.length === 0) && (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic">No venues assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {manager.invited_by_name ? (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <UserPlus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {manager.invited_by_name}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {formatDate(manager.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <PermissionGate permission="managers.permissions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/staff/managers/${manager.id}`);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Manage permissions"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count footer */}
        {!loading && managers.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredManagers.length} of {managers.length} manager{managers.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagersPage;
