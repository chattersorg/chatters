import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import { usePermissions } from '../../context/PermissionsContext';
import usePageTitle from '../../hooks/usePageTitle';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2,
  Check,
  Send,
  RefreshCw,
  Info,
  Users,
  ChevronDown,
  UserPlus
} from 'lucide-react';

const AddManager = () => {
  usePageTitle('Add Manager');
  const navigate = useNavigate();
  const { allVenues, userRole } = useVenue();
  const { hasPermission, permissions, initialized: permissionsInitialized } = usePermissions();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    venueIds: [],
    permissionTemplateId: null,
    reportsTo: null // Will default to current user's ID
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [availableVenues, setAvailableVenues] = useState([]);
  const [allManagersWithVenues, setAllManagersWithVenues] = useState([]); // All managers with their venue access
  const [currentUserId, setCurrentUserId] = useState(null);

  // Check if user can invite managers
  const canInvite = hasPermission('managers.invite');
  // Check if user can assign permissions (if not, invitee defaults to Viewer)
  const canAssignPermissions = hasPermission('managers.permissions');

  // Filter available managers based on selected venues
  // A manager can only be selected as "Reports To" if they have access to at least one of the selected venues
  const availableManagers = useMemo(() => {
    const selectedVenueIds = new Set(formData.venueIds);

    // Always include current user as an option (they're the inviter)
    const currentUserOption = {
      id: currentUserId,
      first_name: 'Me',
      last_name: '(Direct Report)',
      email: '',
      isCurrentUser: true,
      venueIds: [] // Current user is always valid regardless of venues
    };

    // If no venues selected, only show current user
    if (selectedVenueIds.size === 0) {
      return currentUserId ? [currentUserOption] : [];
    }

    // Filter managers who have access to at least one of the selected venues
    const filteredManagers = allManagersWithVenues.filter(manager => {
      // Check if manager has access to any of the selected venues
      return manager.venueIds.some(venueId => selectedVenueIds.has(venueId));
    });

    return currentUserId ? [currentUserOption, ...filteredManagers] : filteredManagers;
  }, [formData.venueIds, allManagersWithVenues, currentUserId]);

  // Reset reportsTo to current user if the selected manager is no longer in the available list
  useEffect(() => {
    if (formData.reportsTo && availableManagers.length > 0) {
      const isCurrentSelectionValid = availableManagers.some(m => m.id === formData.reportsTo);
      if (!isCurrentSelectionValid) {
        setFormData(prev => ({ ...prev, reportsTo: currentUserId }));
      }
    }
  }, [availableManagers, formData.reportsTo, currentUserId]);

  // Build a mini hierarchy preview showing where the new manager will be placed
  const hierarchyPreview = useMemo(() => {
    if (!formData.reportsTo) return null;

    const selectedManager = availableManagers.find(m => m.id === formData.reportsTo);
    if (!selectedManager) return null;

    // Find the path to the selected manager (for context)
    const buildPath = (managerId, visited = new Set()) => {
      if (visited.has(managerId)) return [];
      visited.add(managerId);

      const manager = allManagersWithVenues.find(m => m.id === managerId);
      if (!manager) return [];

      const parentId = manager.reports_to || manager.invited_by;
      if (parentId && parentId !== currentUserId) {
        const parentPath = buildPath(parentId, visited);
        return [...parentPath, manager];
      }
      return [manager];
    };

    // Get siblings (other managers who report to the same person)
    const getSiblings = () => {
      if (selectedManager.isCurrentUser) {
        // Siblings are managers who report directly to current user
        return allManagersWithVenues.filter(m => {
          const parentId = m.reports_to || m.invited_by;
          return parentId === currentUserId;
        }).slice(0, 3); // Limit to 3 siblings for preview
      } else {
        // Siblings are other managers who report to the same parent
        const parentId = selectedManager.reports_to || selectedManager.invited_by;
        return allManagersWithVenues.filter(m => {
          const mParentId = m.reports_to || m.invited_by;
          return mParentId === parentId && m.id !== selectedManager.id;
        }).slice(0, 2); // Limit to 2 siblings for preview
      }
    };

    // Get children of the selected manager (current subordinates)
    const getChildren = () => {
      const managerId = selectedManager.isCurrentUser ? currentUserId : selectedManager.id;
      return allManagersWithVenues.filter(m => {
        const parentId = m.reports_to || m.invited_by;
        return parentId === managerId;
      }).slice(0, 2); // Limit to 2 for preview
    };

    return {
      parent: selectedManager,
      siblings: getSiblings(),
      existingChildren: getChildren(),
      path: selectedManager.isCurrentUser ? [] : buildPath(selectedManager.id)
    };
  }, [formData.reportsTo, availableManagers, allManagersWithVenues, currentUserId]);

  // Get avatar background color based on hierarchy level
  const getAvatarStyle = (level, isNew = false) => {
    if (isNew) {
      return 'bg-blue-500 text-white ring-2 ring-blue-300';
    }
    const shades = [
      'bg-gray-700 text-white',
      'bg-gray-500 text-white',
      'bg-gray-400 text-white',
      'bg-gray-300 text-gray-700',
      'bg-gray-200 text-gray-600',
    ];
    return shades[Math.min(level, shades.length - 1)];
  };

  // Redirect if user doesn't have permission to invite
  useEffect(() => {
    if (!canInvite) {
      navigate('/staff/managers');
    }
  }, [canInvite, navigate]);

  // Fetch role templates and account info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingTemplates(true);

        // Get current user's account
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData } = await supabase
          .from('users')
          .select('account_id')
          .eq('id', user.id)
          .single();

        if (userData?.account_id) {
          setAccountId(userData.account_id);
        }

        setCurrentUserId(user.id);

        // Set default reportsTo to current user
        setFormData(prev => ({
          ...prev,
          reportsTo: user.id
        }));

        // Set available venues based on user role
        // Masters can assign to any venue, managers can only assign to their venues
        if (userRole === 'master') {
          setAvailableVenues(allVenues);
        } else {
          // For managers, they can only invite to venues they have access to
          setAvailableVenues(allVenues);
        }

        // Fetch all managers with their venue access for the "Reports To" dropdown
        // We'll filter this dynamically based on selected venues
        const { data: allManagersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, reports_to, invited_by')
          .eq('account_id', userData?.account_id)
          .eq('role', 'manager')
          .is('deleted_at', null)
          .order('first_name');

        // Get venue access for all managers via staff table
        const managerIds = (allManagersData || []).map(m => m.id);
        const { data: staffData } = await supabase
          .from('staff')
          .select('user_id, venue_id')
          .in('user_id', managerIds);

        // Build a map of manager ID to their venue IDs
        const venuesByManager = new Map();
        (staffData || []).forEach(staff => {
          if (!venuesByManager.has(staff.user_id)) {
            venuesByManager.set(staff.user_id, new Set());
          }
          venuesByManager.get(staff.user_id).add(staff.venue_id);
        });

        // Enrich managers with their venue IDs
        const managersWithVenues = (allManagersData || []).map(m => ({
          ...m,
          venueIds: Array.from(venuesByManager.get(m.id) || [])
        }));

        // For managers (not masters), filter to only subordinates
        if (userRole !== 'master' && userRole !== 'admin') {
          const subordinateIds = new Set();
          const findSubordinates = (managerId) => {
            managersWithVenues.forEach(m => {
              const parentId = m.reports_to || m.invited_by;
              if (parentId === managerId && !subordinateIds.has(m.id)) {
                subordinateIds.add(m.id);
                findSubordinates(m.id);
              }
            });
          };
          findSubordinates(user.id);

          // Filter to only include subordinates
          const filteredManagers = managersWithVenues.filter(m => subordinateIds.has(m.id));
          setAllManagersWithVenues(filteredManagers);
        } else {
          setAllManagersWithVenues(managersWithVenues);
        }

        // Fetch role templates (system + account-specific)
        const { data: templates } = await supabase
          .from('role_templates')
          .select(`
            *,
            role_template_permissions (
              permissions (code, name, master_only)
            )
          `)
          .or(`is_system.eq.true,account_id.eq.${userData?.account_id}`)
          .order('is_system', { ascending: false })
          .order('name', { ascending: true });

        setRoleTemplates(templates || []);

        // Filter templates based on user's permissions
        // Masters can assign any template
        // Managers can only assign templates where all permissions are ones they have
        // AND no master_only permissions are included
        console.log('Filtering templates - userRole:', userRole, 'permissions:', permissions);

        if (userRole === 'master') {
          setAvailableTemplates(templates || []);
        } else {
          const filtered = (templates || []).filter(template => {
            const templatePerms = template.role_template_permissions || [];

            // Check each permission in the template
            const canAssign = templatePerms.every(rtp => {
              const perm = rtp.permissions;
              if (!perm) return true;

              // Reject if it's a master-only permission (like billing)
              if (perm.master_only) {
                console.log(`Template "${template.name}" rejected: contains master_only permission ${perm.code}`);
                return false;
              }

              // Reject if the inviter doesn't have this permission
              if (!permissions.includes(perm.code)) {
                console.log(`Template "${template.name}" rejected: user lacks permission ${perm.code}`);
                return false;
              }

              return true;
            });

            if (canAssign) {
              console.log(`Template "${template.name}" allowed`);
            }
            return canAssign;
          });
          setAvailableTemplates(filtered);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: 'Failed to load templates' });
      } finally {
        setLoadingTemplates(false);
      }
    };

    // Only run when permissions are loaded (to avoid race condition)
    if (permissionsInitialized) {
      fetchData();
    }
  }, [userRole, allVenues, permissions, permissionsInitialized]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  // Handle venue toggle
  const handleVenueToggle = (venueId) => {
    setFormData(prev => ({
      ...prev,
      venueIds: prev.venueIds.includes(venueId)
        ? prev.venueIds.filter(id => id !== venueId)
        : [...prev.venueIds, venueId]
    }));
  };

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setFormData(prev => ({
      ...prev,
      permissionTemplateId: prev.permissionTemplateId === templateId ? null : templateId
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setMessage({ type: 'error', text: 'First name is required' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'Last name is required' });
      return false;
    }
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }
    if (formData.venueIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one venue' });
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const payload = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        venueIds: formData.venueIds,
        accountId: accountId,
        permissionTemplateId: formData.permissionTemplateId,
        reportsTo: formData.reportsTo
      };

      const res = await fetch('/api/admin/invite-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to invite manager');
      }

      setMessage({
        type: 'success',
        text: `Invitation sent successfully to ${formData.email}`
      });

      // Navigate back after short delay
      setTimeout(() => {
        navigate('/staff/managers');
      }, 2000);

    } catch (error) {
      console.error('Error inviting manager:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!canInvite) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/staff/managers')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Invite a new manager to your account
          </p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <ChartCard
          title="Personal Details"
          subtitle="Basic information about the manager"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Enter first name"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Enter last name"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="manager@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+44 7123 456789"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </ChartCard>

        {/* Venue Assignment */}
        <ChartCard
          title="Venue Assignment"
          subtitle={userRole === 'master'
            ? "Select which venues this manager can access"
            : "Select which of your venues this manager can access"}
        >
          <div className="space-y-3">
            {availableVenues.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No venues available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableVenues.map(venue => (
                  <label
                    key={venue.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.venueIds.includes(venue.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      formData.venueIds.includes(venue.id)
                        ? 'bg-blue-500 text-white'
                        : 'border-2 border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.venueIds.includes(venue.id) && <Check className="w-3 h-3" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.venueIds.includes(venue.id)}
                      onChange={() => handleVenueToggle(venue.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {venue.name}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span className="text-red-500">*</span> Select at least one venue
            </p>
          </div>
        </ChartCard>

        {/* Reports To */}
        <ChartCard
          title="Reports To"
          subtitle="Select which manager this person will report to in the hierarchy"
        >
          <div className="space-y-4">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formData.reportsTo || ''}
                onChange={(e) => handleChange('reportsTo', e.target.value || null)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
              >
                {availableManagers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.isCurrentUser
                      ? 'Me (Direct Report)'
                      : `${manager.first_name} ${manager.last_name}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Visual Hierarchy Preview */}
            {hierarchyPreview && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Hierarchy Preview
                </p>
                <div className="space-y-1">
                  {/* Show the parent (selected manager) */}
                  <div className="flex items-center py-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarStyle(0)}`}>
                      {hierarchyPreview.parent.isCurrentUser
                        ? 'ME'
                        : `${hierarchyPreview.parent.first_name?.[0] || ''}${hierarchyPreview.parent.last_name?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {hierarchyPreview.parent.isCurrentUser
                          ? 'You'
                          : `${hierarchyPreview.parent.first_name} ${hierarchyPreview.parent.last_name}`}
                      </span>
                      {!hierarchyPreview.parent.isCurrentUser && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          (Selected)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Existing children of the selected manager */}
                  {hierarchyPreview.existingChildren.map((child, idx) => (
                    <div key={child.id} className="flex items-center py-2" style={{ paddingLeft: '28px' }}>
                      <div className="w-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 h-4 -mt-4 mr-2 rounded-bl"></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarStyle(1)}`}>
                        {`${child.first_name?.[0] || ''}${child.last_name?.[0] || ''}`.toUpperCase()}
                      </div>
                      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                        {child.first_name} {child.last_name}
                      </span>
                    </div>
                  ))}

                  {/* The NEW manager being added */}
                  <div className="flex items-center py-2" style={{ paddingLeft: '28px' }}>
                    <div className="w-4 border-l-2 border-b-2 border-blue-400 dark:border-blue-500 h-4 -mt-4 mr-2 rounded-bl"></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarStyle(1, true)}`}>
                      {formData.firstName && formData.lastName
                        ? `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
                        : <UserPlus className="w-4 h-4" />}
                    </div>
                    <div className="ml-3">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {formData.firstName && formData.lastName
                          ? `${formData.firstName} ${formData.lastName}`
                          : 'New Manager'}
                      </span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        NEW
                      </span>
                    </div>
                  </div>

                  {/* Show more indicator if there are hidden siblings */}
                  {hierarchyPreview.existingChildren.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 pl-10 pt-1">
                      {hierarchyPreview.existingChildren.length === 2 && '...and other direct reports'}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {availableManagers.length <= 1
                ? 'The new manager will report directly to you'
                : 'Choose where in the hierarchy this manager should be placed'}
            </p>
          </div>
        </ChartCard>

        {/* Permissions Template */}
        <ChartCard
          title="Permissions Template"
          subtitle={canAssignPermissions
            ? "Assign a role template to define what this manager can access"
            : "This manager will be assigned Viewer permissions by default"}
        >
          {!canAssignPermissions ? (
            // User doesn't have managers.permissions - show info message
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                  Viewer permissions will be assigned
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  You don't have permission to assign custom roles. The invited manager will receive Viewer permissions which allow them to view data but not make changes.
                </p>
              </div>
            </div>
          ) : loadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : availableTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No permission templates available</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                The manager will receive Viewer permissions by default
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableTemplates.map(template => {
                  const permissionCount = template.role_template_permissions?.length || 0;
                  const isSelected = formData.permissionTemplateId === template.id;

                  return (
                    <label
                      key={template.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTemplateSelect(template.id)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 flex-shrink-0 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {template.name}
                          </span>
                          {template.is_system && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                              System
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Optional - If not selected, the manager will receive Viewer permissions by default
              </p>
            </div>
          )}
        </ChartCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/staff/managers')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddManager;
