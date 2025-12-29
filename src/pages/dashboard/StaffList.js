import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { Button } from '../../components/ui/button';
import AddEmployeeModal from '../../components/dashboard/staff/employeetabcomponents/AddEmployeeModal';
import EditEmployeeModal from '../../components/dashboard/staff/employeetabcomponents/EditEmployeeModal';
import DeleteEmployeeModal from '../../components/dashboard/staff/employeetabcomponents/DeleteEmployeeModal';
import { downloadEmployeesCSV, parseEmployeesCSV } from '../../utils/csvUtils';
import {
  Search, X, Download, Upload, Eye,
  UserCheck, Users, ChevronDown, ChevronRight, Building2
} from 'lucide-react';

const StaffListPage = () => {
  usePageTitle('Staff List');
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId, userRole, allVenues, loading: venueLoading } = useVenue();

  // Data states
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Handle success message from CSV import page
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setMessageType(location.state.success ? 'success' : 'error');
      // Clear the state so message doesn't reappear on refresh
      window.history.replaceState({}, document.title);
      // Auto-clear message after 5 seconds
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Tab state - 'all', 'employees', 'managers'
  const [activeTab, setActiveTab] = useState('all');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Employee modals
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
  const [showEditEmployeeForm, setShowEditEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Manager state
  const [managerToDelete, setManagerToDelete] = useState(null);
  const [deleteManagerLoading, setDeleteManagerLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(null);

  // Deleted managers
  const [deletedManagers, setDeletedManagers] = useState([]);
  const [showDeletedManagers, setShowDeletedManagers] = useState(false);
  const [recoveringManager, setRecoveringManager] = useState(null);

  // Pending invitations
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [revokingInvitation, setRevokingInvitation] = useState(null);

  // CSV states
  const [uploading, setUploading] = useState(false);

  // Color mappings for employees
  const [roleColors, setRoleColors] = useState({});
  const [locationColors, setLocationColors] = useState({});

  // Fetch data on mount
  useEffect(() => {
    if (venueLoading) return;
    if (userRole === 'master' && (!allVenues || allVenues.length === 0)) return;
    if (userRole !== 'master' && !venueId) return;
    fetchStaffData();
    fetchPendingInvitations();
    fetchDeletedManagers();
    fetchColors();
  }, [venueId, userRole, allVenues, venueLoading]);

  const fetchColors = async () => {
    if (!venueId) return;
    try {
      const { data: rolesData } = await supabase
        .from('staff_roles')
        .select('name, color')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      const { data: locationsData } = await supabase
        .from('staff_locations')
        .select('name, color')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      const roleColorMap = {};
      rolesData?.forEach(role => {
        roleColorMap[role.name.toLowerCase()] = role.color;
      });

      const locationColorMap = {};
      locationsData?.forEach(location => {
        locationColorMap[location.name.toLowerCase()] = location.color;
      });

      setRoleColors(roleColorMap);
      setLocationColors(locationColorMap);
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      // For master users (including impersonation), use allVenues from context
      // This handles impersonation correctly since VenueContext populates allVenues
      if (userRole === 'master') {
        await fetchAllStaffForAccount();
      } else {
        await fetchStaffForManager(userId);
      }
    } catch (error) {
      setMessage('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStaffForAccount = async () => {
    if (!allVenues || allVenues.length === 0) {
      setManagers([]);
      setEmployees([]);
      return;
    }

    const venueIds = allVenues.map(v => v.id);

    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select(`id, user_id, venue_id, role, created_at`)
      .in('venue_id', venueIds);

    if (staffError || !staffData) {
      // Staff query failed, but continue to fetch employees
    }

    const userIds = [...new Set((staffData || []).map(s => s.user_id))].filter(id => id !== null && id !== undefined);

    let usersData = [];
    let venuesData = [];

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, role, first_name, last_name, password_hash, created_at')
        .in('id', userIds)
        .is('deleted_at', null);
      usersData = users || [];
    }

    const { data: venues } = await supabase
      .from('venues')
      .select('id, name')
      .in('id', venueIds);
    venuesData = venues || [];

    const staffWithJoins = (staffData || []).map(staff => {
      const foundUser = usersData?.find(u => u.id === staff.user_id);
      const foundVenue = venuesData?.find(v => v.id === staff.venue_id);
      return {
        ...staff,
        users: foundUser || null,
        venues: foundVenue || null
      };
    });

    const activeStaffWithJoins = staffWithJoins.filter(staff => staff.users !== null);

    const { data: employeesData } = await supabase
      .from('employees')
      .select(`id, venue_id, first_name, last_name, email, phone, role, location, created_at, venues (id, name)`)
      .in('venue_id', venueIds);

    const managersData = activeStaffWithJoins?.filter(staff => staff.role === 'manager') || [];

    setManagers(managersData);
    setEmployees(employeesData || []);
  };

  const fetchStaffForManager = async (userId) => {
    const { data: staffData } = await supabase
      .from('staff')
      .select(`id, user_id, venue_id, role, created_at, venues!inner (id, name), users!inner (id, email, role, first_name, last_name, deleted_at, invited_by)`)
      .eq('venue_id', venueId)
      .neq('user_id', userId)
      .is('users.deleted_at', null);

    const { data: employeesData } = await supabase
      .from('employees')
      .select(`id, venue_id, first_name, last_name, email, phone, role, location, created_at, venues (id, name)`)
      .eq('venue_id', venueId);

    // Filter managers to only show those the current user invited (directly or indirectly)
    const allManagerStaff = staffData?.filter(staff => staff.role === 'manager') || [];

    // Build a set of user IDs that the current user can manage (those they invited)
    const canManageUserIds = new Set();

    // Helper to check if userId is in the invitation chain of inviterId
    const isInInvitationChain = (targetUserId) => {
      let current = allManagerStaff.find(m => m.user_id === targetUserId);
      const visited = new Set();

      while (current && !visited.has(current.user_id)) {
        visited.add(current.user_id);
        if (current.users?.invited_by === userId) {
          return true;
        }
        // Move up the chain - find the staff record for the inviter
        current = allManagerStaff.find(m => m.user_id === current.users?.invited_by);
      }
      return false;
    };

    // Check each manager
    allManagerStaff.forEach(manager => {
      if (isInInvitationChain(manager.user_id)) {
        canManageUserIds.add(manager.user_id);
      }
    });

    const managersData = allManagerStaff.filter(m => canManageUserIds.has(m.user_id));
    setManagers(managersData);
    setEmployees(employeesData || []);
  };

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
        setPendingInvitations(data.invitations || []);
      } else {
        console.error('Failed to fetch pending invitations');
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const fetchDeletedManagers = async () => {
    try {
      // Get account_id from allVenues (handles impersonation correctly)
      if (!allVenues || allVenues.length === 0) {
        setDeletedManagers([]);
        return;
      }

      // Get account_id from first venue
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

  // Filter employees to current venue
  const visibleEmployees = employees
    .filter(emp => emp.venue_id === venueId)
    .sort((a, b) => {
      const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
      const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Get unique managers for the current venue
  const uniqueManagers = useMemo(() => {
    // First filter to only managers assigned to the current venue
    const managersInVenue = managers.filter(m => m.venue_id === venueId);

    // Then deduplicate by user_id
    const unique = [];
    const seenUserIds = new Set();
    managersInVenue.forEach(manager => {
      if (!seenUserIds.has(manager.user_id)) {
        seenUserIds.add(manager.user_id);
        unique.push(manager);
      }
    });
    return unique;
  }, [managers, venueId]);

  // Filter data based on search and active tab
  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    let filteredEmployees = visibleEmployees;
    let filteredManagers = uniqueManagers;

    if (searchTerm.trim()) {
      filteredEmployees = visibleEmployees.filter(emp =>
        emp.first_name?.toLowerCase().includes(searchLower) ||
        emp.last_name?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.role?.toLowerCase().includes(searchLower) ||
        emp.phone?.toLowerCase().includes(searchLower) ||
        emp.location?.toLowerCase().includes(searchLower)
      );

      filteredManagers = uniqueManagers.filter(mgr =>
        mgr.users?.first_name?.toLowerCase().includes(searchLower) ||
        mgr.users?.last_name?.toLowerCase().includes(searchLower) ||
        mgr.users?.email?.toLowerCase().includes(searchLower)
      );
    }

    return { employees: filteredEmployees, managers: filteredManagers };
  }, [visibleEmployees, uniqueManagers, searchTerm]);

  // Helper functions for badge styling
  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const createBadgeStyle = (hexColor) => {
    if (!hexColor) return {};
    return {
      backgroundColor: hexToRgba(hexColor, 0.1),
      color: hexColor,
      border: `1px solid ${hexToRgba(hexColor, 0.2)}`
    };
  };

  const getRoleStyle = (role) => {
    if (!role || !roleColors) return {};
    const normalizedRole = role.toLowerCase().trim();
    const hexColor = roleColors[normalizedRole];
    if (hexColor) return createBadgeStyle(hexColor);
    return { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' };
  };

  const getLocationStyle = (location) => {
    if (!location || !locationColors) return {};
    const normalizedLocation = location.toLowerCase().trim();
    const hexColor = locationColors[normalizedLocation];
    if (hexColor) return createBadgeStyle(hexColor);
    return { backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5' };
  };

  // Employee handlers
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEditEmployeeForm(true);
  };

  const handleDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
  };

  const confirmDeleteEmployee = async (employeeId) => {
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) throw error;
      setMessage('Employee deleted successfully!');
      setEmployeeToDelete(null);
      await fetchStaffData();
    } catch (error) {
      setMessage('Failed to delete employee. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // CSV handlers
  const handleDownloadCSV = () => {
    const venueName = allVenues.find(v => v.id === venueId)?.name;
    downloadEmployeesCSV(visibleEmployees, venueName);
  };

  const handleCSVUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { employees: parsedEmployees, errors } = await parseEmployeesCSV(file);
      if (errors.length > 0) {
        setMessage(`CSV parsing errors: ${errors.join('; ')}`);
        setUploading(false);
        return;
      }
      if (parsedEmployees.length === 0) {
        setMessage('No valid employee data found in CSV file');
        setUploading(false);
        return;
      }

      // Check for duplicate emails within the CSV itself
      const csvEmailCounts = {};
      const csvDuplicateEmails = [];
      parsedEmployees.forEach(emp => {
        const emailKey = emp.email?.toLowerCase();
        if (emailKey) {
          csvEmailCounts[emailKey] = (csvEmailCounts[emailKey] || 0) + 1;
          if (csvEmailCounts[emailKey] === 2) {
            csvDuplicateEmails.push(emp.email);
          }
        }
      });

      if (csvDuplicateEmails.length > 0) {
        setMessage(`CSV contains duplicate emails: ${csvDuplicateEmails.join(', ')}. Please remove duplicates and try again.`);
        setUploading(false);
        return;
      }

      const targetVenueId = venueId;
      const venueName = allVenues.find(v => v.id === venueId)?.name;

      // Get existing employees for this venue
      const existingEmployees = employees.filter(emp => emp.venue_id === targetVenueId);

      // Create maps of existing employees by ID and email for matching
      const existingById = {};
      const existingByEmail = {};
      existingEmployees.forEach(emp => {
        if (emp.id) {
          existingById[emp.id] = emp;
        }
        if (emp.email) {
          existingByEmail[emp.email.toLowerCase()] = emp;
        }
      });

      // Categorize parsed employees into new and duplicates
      // Priority: Match by ID first, then by email
      const newEmployees = [];
      const duplicates = [];

      parsedEmployees.forEach(emp => {
        // First try to match by ID (if provided in CSV)
        if (emp.id && existingById[emp.id]) {
          duplicates.push({
            email: emp.email,
            existing: existingById[emp.id],
            new: emp
          });
        }
        // Then try to match by email
        else {
          const emailKey = emp.email?.toLowerCase();
          if (emailKey && existingByEmail[emailKey]) {
            duplicates.push({
              email: emp.email,
              existing: existingByEmail[emailKey],
              new: emp
            });
          } else {
            newEmployees.push(emp);
          }
        }
      });

      // Navigate to the review page
      navigate('/staff/import', {
        state: {
          parsedEmployees,
          duplicates,
          newEmployees,
          targetVenueId,
          venueName
        }
      });

      setUploading(false);

    } catch (error) {
      setMessage(`Failed to process CSV: ${error.message}`);
      setUploading(false);
    }
  };

  // Manager handlers
  const handleDeleteManager = async () => {
    if (!managerToDelete) return;
    setDeleteManagerLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/delete-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ managerId: managerToDelete.user_id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete manager');

      setMessage('Manager deleted successfully. They can be recovered within 14 days.');
      setManagerToDelete(null);
      await fetchStaffData();
      await fetchPendingInvitations();
      await fetchDeletedManagers();
    } catch (error) {
      setMessage('Failed to delete manager: ' + error.message);
    } finally {
      setDeleteManagerLoading(false);
    }
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

      setMessage(`Invitation resent to ${email} successfully!`);
      await fetchPendingInvitations();
    } catch (error) {
      setMessage('Failed to resend invitation: ' + error.message);
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

      setMessage('Invitation revoked successfully');
      await fetchPendingInvitations();
    } catch (error) {
      setMessage('Failed to revoke invitation: ' + error.message);
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

      setMessage(result.message);
      await fetchDeletedManagers();
      await fetchStaffData();
    } catch (error) {
      setMessage('Failed to recover manager: ' + error.message);
    } finally {
      setRecoveringManager(null);
    }
  };

  const hasPendingInvitation = (email) => pendingInvitations.some(inv => inv.email === email);

  if (venueLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading venues...</span>
        </div>
      </div>
    );
  }

  const tabCounts = {
    all: filteredData.employees.length + filteredData.managers.length,
    employees: filteredData.employees.length,
    managers: filteredData.managers.length
  };

  return (
    <div className="space-y-6">
      <ChartCard
        title="Staff List"
        subtitle="Manage all staff members - employees and managers"
        titleRight={
          message && (
            <span className={`text-sm font-medium ${
              messageType === 'success' || message.includes('success') || message.includes('recovered')
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {message}
            </span>
          )
        }
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading staff data...</span>
          </div>
        )}

        {!loading && (
          <div className="w-full">
            {/* Header with Add buttons */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  View and manage all staff at your venue
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PermissionGate permission="staff.edit">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddEmployeeForm(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                </PermissionGate>
                <PermissionGate permission="managers.invite">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/staff/managers/add')}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Add Manager
                  </Button>
                </PermissionGate>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'all', label: 'All Staff', icon: Users },
                  { id: 'employees', label: 'Employees', icon: Users },
                  { id: 'managers', label: 'Managers', icon: UserCheck }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 mr-2 ${
                      activeTab === tab.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.label}
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tabCounts[tab.id]}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Search and Actions */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* CSV actions for employees tab */}
              {(activeTab === 'all' || activeTab === 'employees') && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadCSV}
                    className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center font-medium"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Export
                  </button>
                  <PermissionGate permission="staff.edit">
                    <label className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center cursor-pointer font-medium">
                      <Upload className="w-4 h-4 mr-1.5" />
                      {uploading ? 'Uploading...' : 'Import CSV'}
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          handleCSVUpload(e.target.files[0]);
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </PermissionGate>
                </div>
              )}
            </div>

            {/* Staff Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[12%]" />
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Role / Venues
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Managers */}
                    {(activeTab === 'all' || activeTab === 'managers') && filteredData.managers.map((manager, index) => {
                      const managerVenues = managers
                        .filter(m => m.user_id === manager.user_id)
                        .map(m => allVenues.find(v => v.id === m.venue_id))
                        .filter(Boolean);

                      return (
                        <tr
                          key={`manager-${manager.user_id}`}
                          className={`hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-150 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-medium text-purple-600 dark:text-purple-400 mr-3">
                                {((manager.users?.first_name || '') + ' ' + (manager.users?.last_name || '')).split(' ').map(word => word[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <button
                                  onClick={() => navigate(`/staff/managers/${manager.user_id}`)}
                                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  {manager.users?.first_name} {manager.users?.last_name}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Manager
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                              <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {managerVenues.length === 1
                                ? managerVenues[0]?.name
                                : `${managerVenues.length} venues`
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {manager.users?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => navigate(`/staff/managers/${manager.user_id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>

                              {hasPendingInvitation(manager.users?.email) && (
                                <PermissionGate permission="managers.invite">
                                  <button
                                    onClick={() => handleResendInvitation(manager.users?.email)}
                                    disabled={resendingEmail === manager.users?.email}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium disabled:opacity-50"
                                  >
                                    {resendingEmail === manager.users?.email ? 'Sending...' : 'Resend'}
                                  </button>
                                </PermissionGate>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Pending Manager Invitations */}
                    {(activeTab === 'all' || activeTab === 'managers') && pendingInvitations.map((invitation, index) => {
                      const invitationVenues = (invitation.venue_ids || [])
                        .map(vid => allVenues.find(v => v.id === vid))
                        .filter(Boolean);

                      return (
                        <tr
                          key={`pending-${invitation.id}`}
                          className={`hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors duration-150 bg-amber-50/50 dark:bg-amber-900/10`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-medium text-amber-600 dark:text-amber-400 mr-3">
                                {((invitation.first_name || '') + ' ' + (invitation.last_name || '')).split(' ').map(word => word[0]).join('').toUpperCase() || '?'}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {invitation.first_name} {invitation.last_name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Manager
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                              <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {invitationVenues.length === 1
                                ? invitationVenues[0]?.name
                                : invitationVenues.length > 1
                                  ? `${invitationVenues.length} venues`
                                  : '-'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {invitation.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              Pending
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <PermissionGate permission="managers.invite">
                                <button
                                  onClick={() => handleResendInvitation(invitation.email)}
                                  disabled={resendingEmail === invitation.email}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
                                >
                                  {resendingEmail === invitation.email ? 'Sending...' : 'Resend'}
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="managers.invite">
                                <button
                                  onClick={() => handleRevokeInvitation(invitation.id)}
                                  disabled={revokingInvitation === invitation.id}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                                >
                                  {revokingInvitation === invitation.id ? 'Revoking...' : 'Revoke'}
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Employees */}
                    {(activeTab === 'all' || activeTab === 'employees') && filteredData.employees.map((employee, index) => (
                      <tr
                        key={`employee-${employee.id}`}
                        className={`hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-150 ${
                          (activeTab === 'all' ? filteredData.managers.length + index : index) % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 mr-3">
                              {`${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => navigate(`/staff/employees/${employee.id}`)}
                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {employee.first_name} {employee.last_name}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            <Users className="w-3 h-3 mr-1" />
                            Employee
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.role ? (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={getRoleStyle(employee.role)}
                            >
                              {employee.role}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.email ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">{employee.email}</span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => navigate(`/staff/employees/${employee.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Empty state */}
                    {((activeTab === 'all' && tabCounts.all === 0) ||
                      (activeTab === 'employees' && tabCounts.employees === 0) ||
                      (activeTab === 'managers' && tabCounts.managers === 0)) && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                              <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {searchTerm ? 'No results found' : 'No staff members yet'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {searchTerm
                                ? `No staff members match "${searchTerm}"`
                                : 'Add your first staff member to get started'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deleted Managers Section */}
            {deletedManagers.length > 0 && (activeTab === 'all' || activeTab === 'managers') && (
              <div className="mt-6">
                <button
                  onClick={() => setShowDeletedManagers(!showDeletedManagers)}
                  className="w-full flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-700 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                        {deletedManagers.length} Deleted Manager{deletedManagers.length !== 1 ? 's' : ''}
                      </h3>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">Can be recovered within 14 days</p>
                    </div>
                  </div>
                  {showDeletedManagers ? (
                    <ChevronDown className="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
                  )}
                </button>

                {showDeletedManagers && (
                  <div className="mt-4 bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
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
                              <tr key={manager.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 mr-3">
                                      {((manager.first_name || '') + ' ' + (manager.last_name || '')).split(' ').map(w => w[0]).join('').toUpperCase()}
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
                                  <div className="text-xs text-gray-500">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleRecoverManager(manager.id)}
                                    disabled={recoveringManager === manager.id}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 text-sm font-medium disabled:opacity-50"
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
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ChartCard>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        showAddForm={showAddEmployeeForm}
        setShowAddForm={setShowAddEmployeeForm}
        allVenues={allVenues}
        venueId={venueId}
        userRole={userRole}
        employees={employees}
        fetchStaffData={fetchStaffData}
        setMessage={setMessage}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        showEditForm={showEditEmployeeForm}
        setShowEditForm={setShowEditEmployeeForm}
        editingEmployee={editingEmployee}
        setEditingEmployee={setEditingEmployee}
        allVenues={allVenues}
        userRole={userRole}
        employees={employees}
        fetchStaffData={fetchStaffData}
        setMessage={setMessage}
      />

      {/* Delete Employee Modal */}
      <DeleteEmployeeModal
        employee={employeeToDelete}
        onConfirm={confirmDeleteEmployee}
        onCancel={() => setEmployeeToDelete(null)}
        loading={deleteLoading}
      />

      {/* Delete Manager Confirmation Modal */}
      {managerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md">
            <div className="p-4 lg:p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.95-.833-2.72 0L4.094 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Manager</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete <strong>{managerToDelete.users?.first_name} {managerToDelete.users?.last_name}</strong>?
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Note:</strong> This manager can be recovered within 14 days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setManagerToDelete(null)}
                  disabled={deleteManagerLoading}
                  className="w-full sm:w-auto px-6 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteManager}
                  disabled={deleteManagerLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {deleteManagerLoading ? 'Deleting...' : 'Delete Manager'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffListPage;
