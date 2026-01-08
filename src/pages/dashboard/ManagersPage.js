import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import { usePermissions, PermissionGate } from '../../context/PermissionsContext';
import usePageTitle from '../../hooks/usePageTitle';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Building2,
  Calendar,
  UserPlus,
  Settings,
  X,
  UserCheck,
  Clock,
  Mail,
  RotateCcw,
  FolderKanban
} from 'lucide-react';

const ManagersPage = () => {
  usePageTitle('Managers');
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, venueId, venueName, allVenues } = useVenue();
  const { hasPermission } = usePermissions();

  // Check if we're on the admin route (shows all org managers) vs staff route (venue-specific)
  const isAdminRoute = location.pathname.startsWith('/admin/');

  const [managers, setManagers] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Pending invitations
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [resendingEmail, setResendingEmail] = useState(null);
  const [revokingInvitation, setRevokingInvitation] = useState(null);

  // Deleted managers
  const [deletedManagers, setDeletedManagers] = useState([]);
  const [showDeletedManagers, setShowDeletedManagers] = useState(false);
  const [recoveringManager, setRecoveringManager] = useState(null);

  // Venue groups
  const [venueGroups, setVenueGroups] = useState([]);

  const fetchManagers = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Only filter by venue on the staff route, not on admin route
      const url = isAdminRoute
        ? '/api/managers/list'
        : `/api/managers/list?venueId=${venueId}`;

      const response = await fetch(url, {
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
  }, [venueId, isAdminRoute]);

  useEffect(() => {
    if (hasPermission('managers.view')) {
      fetchManagers();
      fetchPendingInvitations();
      fetchDeletedManagers();
      fetchVenueGroups();
    }
  }, [hasPermission, fetchManagers]);

  const fetchPendingInvitations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get account_id from venues for impersonation support
      let accountId = '';
      if (allVenues && allVenues.length > 0) {
        const { data: venueData } = await supabase
          .from('venues')
          .select('account_id')
          .eq('id', allVenues[0].id)
          .single();
        accountId = venueData?.account_id || '';
      }

      const url = accountId
        ? `/api/admin/get-pending-invitations?accountId=${accountId}`
        : '/api/admin/get-pending-invitations';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter by venue if not on admin route
        let invitations = data.invitations || [];
        if (!isAdminRoute && venueId) {
          invitations = invitations.filter(inv =>
            inv.venue_ids?.includes(venueId)
          );
        }
        setPendingInvitations(invitations);
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const fetchDeletedManagers = async () => {
    try {
      if (!allVenues || allVenues.length === 0) {
        setDeletedManagers([]);
        return;
      }

      const { data: venueData } = await supabase
        .from('venues')
        .select('account_id')
        .eq('id', allVenues[0].id)
        .single();

      if (!venueData?.account_id) {
        setDeletedManagers([]);
        return;
      }

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: deleted } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, deleted_at, deleted_by')
        .eq('account_id', venueData.account_id)
        .eq('role', 'manager')
        .not('deleted_at', 'is', null)
        .gt('deleted_at', fourteenDaysAgo.toISOString())
        .order('deleted_at', { ascending: false });

      setDeletedManagers(deleted || []);
    } catch (error) {
      console.error('Error fetching deleted managers:', error);
    }
  };

  const fetchVenueGroups = async () => {
    try {
      if (!allVenues || allVenues.length === 0) return;

      const { data: venueData } = await supabase
        .from('venues')
        .select('account_id')
        .eq('id', allVenues[0].id)
        .single();

      if (!venueData?.account_id) return;

      const { data: groupsData } = await supabase
        .from('venue_groups')
        .select(`
          *,
          venue_group_members (
            venue_id
          )
        `)
        .eq('account_id', venueData.account_id)
        .order('name', { ascending: true });

      const transformedGroups = (groupsData || []).map(g => ({
        ...g,
        venueIds: g.venue_group_members?.map(m => m.venue_id) || []
      }));

      setVenueGroups(transformedGroups);
    } catch (error) {
      console.error('Error fetching venue groups:', error);
    }
  };

  // Check if manager's venues match a complete group
  const getMatchingGroup = (managerVenues) => {
    if (!managerVenues || managerVenues.length === 0) return null;

    const managerVenueIds = managerVenues.map(v => v.id).sort();

    for (const group of venueGroups) {
      if (group.venueIds.length === 0) continue;

      const groupVenueIds = [...group.venueIds].sort();

      // Check if manager has exactly all venues in this group
      if (managerVenueIds.length === groupVenueIds.length &&
          managerVenueIds.every((id, idx) => id === groupVenueIds[idx])) {
        return group;
      }
    }

    return null;
  };

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
      if (!res.ok) throw new Error(result.error || 'Failed to resend invitation');

      toast.success(`Invitation resent to ${email}`);
    } catch (error) {
      toast.error('Failed to resend: ' + error.message);
    } finally {
      setResendingEmail(null);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    setRevokingInvitation(invitationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/revoke-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ invitationId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to revoke invitation');

      toast.success('Invitation revoked');
      await fetchPendingInvitations();
    } catch (error) {
      toast.error('Failed to revoke: ' + error.message);
    } finally {
      setRevokingInvitation(null);
    }
  };

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
      if (!res.ok) throw new Error(result.error || 'Failed to recover manager');

      toast.success(result.message || 'Manager recovered');
      await fetchDeletedManagers();
      await fetchManagers();
    } catch (error) {
      toast.error('Failed to recover: ' + error.message);
    } finally {
      setRecoveringManager(null);
    }
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get avatar background color based on hierarchy level (darker at top, lighter as you go down)
  const getAvatarStyle = (level) => {
    const shades = [
      'bg-gray-700 text-white',      // Level 0 - Darkest
      'bg-gray-500 text-white',      // Level 1
      'bg-gray-400 text-white',      // Level 2
      'bg-gray-300 text-gray-700',   // Level 3
      'bg-gray-200 text-gray-600',   // Level 4+
    ];
    return shades[Math.min(level, shades.length - 1)];
  };

  // Filter hierarchy based on search term
  const filterHierarchy = (nodes, searchLower) => {
    if (!searchLower) return nodes;

    return nodes.reduce((acc, node) => {
      const fullName = `${node.first_name || ''} ${node.last_name || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchLower) ||
                           node.email?.toLowerCase().includes(searchLower) ||
                           node.venues?.some(v => v.name?.toLowerCase().includes(searchLower));

      const filteredChildren = node.children ? filterHierarchy(node.children, searchLower) : [];

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren
        });
      }

      return acc;
    }, []);
  };

  const filteredHierarchy = hierarchy ? filterHierarchy(hierarchy, searchTerm.toLowerCase()) : [];

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
            <div className="flex items-center" style={{ paddingLeft: `${level * 28}px` }}>
              {/* Expand/Collapse Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-3 ${!hasChildren ? 'invisible' : ''}`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Avatar - grey shades based on level */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm mr-3 flex-shrink-0 ${getAvatarStyle(level)}`}>
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
            {(() => {
              const matchingGroup = getMatchingGroup(node.venues);
              if (matchingGroup) {
                return (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      <FolderKanban className="w-3 h-3" />
                      {matchingGroup.name}
                    </span>
                  </div>
                );
              }
              return (
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
              );
            })()}
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
            {isAdminRoute
              ? 'All managers in your organisation'
              : `Managers with access to ${venueName}`}
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

      {/* Search */}
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
        ) : filteredHierarchy.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No managers match "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              Clear search
            </button>
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
                    Joined
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {filteredHierarchy.map(node => renderHierarchyNode(node))}

                {/* Pending Invitations */}
                {pendingInvitations.map((invitation) => (
                  <tr
                    key={`pending-${invitation.id}`}
                    className="bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-medium text-amber-600 dark:text-amber-400 mr-3">
                          {`${invitation.first_name?.[0] || ''}${invitation.last_name?.[0] || ''}`.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invitation.first_name} {invitation.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {invitation.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Invitation
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        Invited {formatDate(invitation.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <PermissionGate permission="managers.invite">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleResendInvitation(invitation.email)}
                            disabled={resendingEmail === invitation.email}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
                          >
                            {resendingEmail === invitation.email ? 'Sending...' : 'Resend'}
                          </button>
                          <span className="text-gray-300 dark:text-gray-600">|</span>
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            disabled={revokingInvitation === invitation.id}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                          >
                            {revokingInvitation === invitation.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        </div>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count footer */}
        {!loading && managers.length > 0 && filteredHierarchy.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {managers.length} manager{managers.length !== 1 ? 's' : ''}
              {pendingInvitations.length > 0 && `, ${pendingInvitations.length} pending`}
              {isAdminRoute ? ' in your organisation' : ' with access to this venue'}
              {searchTerm && ` (filtered)`}
            </p>
          </div>
        )}
      </div>

      {/* Deleted Managers Section */}
      {deletedManagers.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowDeletedManagers(!showDeletedManagers)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {deletedManagers.length} Recently Deleted Manager{deletedManagers.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Can be recovered within 14 days</p>
              </div>
            </div>
            {showDeletedManagers ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showDeletedManagers && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Manager</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Deleted</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {deletedManagers.map((manager) => {
                    const deletedDate = new Date(manager.deleted_at);
                    const daysAgo = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                    const daysRemaining = 14 - daysAgo;

                    return (
                      <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 mr-3">
                              {`${manager.first_name?.[0] || ''}${manager.last_name?.[0] || ''}`.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {manager.first_name} {manager.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{manager.email}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRecoverManager(manager.id)}
                            disabled={recoveringManager === manager.id}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium disabled:opacity-50"
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
          )}
        </div>
      )}
    </div>
  );
};

export default ManagersPage;
