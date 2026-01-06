import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import ModernCard from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import usePermissions from '../../hooks/usePermissions';
import VenueTab from '../../components/dashboard/settings/VenueTab';
import { ChevronRight, ChevronDown, Trash2, AlertTriangle, Info } from 'lucide-react';

const VenueSettingsPage = () => {
  const location = useLocation();
  const { venueId, allVenues, userRole } = useVenue();
  const { hasPermission } = usePermissions();

  // Determine if we're in multi-venue list mode (accessed from Multi Venue > Venues)
  // vs single-venue edit mode (accessed from Venue Settings submenu)
  // /multi-venue/venues = Multi Venue list view (only for multi-venue users)
  // /venue-settings/details = Single venue edit form (always)
  const isVenueDetailsRoute = location.pathname === '/venue-settings/details';
  const isMultiVenueRoute = location.pathname === '/multi-venue/venues';
  const initialViewMode = isVenueDetailsRoute ? 'edit' : 'list';
  const [viewMode, setViewMode] = useState(initialViewMode);
  const isMultiVenueMode = isMultiVenueRoute && allVenues.length > 1;

  usePageTitle(isMultiVenueMode ? 'Venues Management' : 'Venue Settings');

  // All state variables for VenueTab
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('GB');
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    county: '',
    postalCode: '',
    country: '',
  });
  const [message, setMessage] = useState('');
  const [venueMetrics, setVenueMetrics] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [expandedVenueId, setExpandedVenueId] = useState(null);
  const [venueDetails, setVenueDetails] = useState({}); // { venueId: { managers: [], employees: [] } }

  // Venue management state (for multi-venue mode)
  const [newVenue, setNewVenue] = useState({
    name: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      county: '',
      postalCode: '',
      country: '',
    },
    assignedManagerId: '',
  });
  const [venueLoading, setVenueLoading] = useState(false);
  const [venueMessage, setVenueMessage] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { venueId, venueName }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreateWarning, setShowCreateWarning] = useState(false);
  const [availableManagers, setAvailableManagers] = useState([]);

  // Fetch venue staff counts (managers and employees)
  useEffect(() => {
    if (!isMultiVenueMode) {
      return;
    }

    const fetchVenueMetrics = async () => {
      setLoadingMetrics(true);
      const metrics = {};

      for (const venue of allVenues) {
        // Fetch staff records for this venue (only those with valid user_id)
        const { data: staffData } = await supabase
          .from('staff')
          .select('user_id')
          .eq('venue_id', venue.id)
          .not('user_id', 'is', null);

        // Count actual managers by checking each user individually
        let managerCount = 0;
        if (staffData && staffData.length > 0) {
          const userIds = staffData.map(s => s.user_id);
          // Query each user to check if they're a valid manager (not deleted)
          const userPromises = userIds.map(async (userId) => {
            const { data } = await supabase
              .from('users')
              .select('id, role, deleted_at')
              .eq('id', userId)
              .single();
            return data;
          });
          const users = await Promise.all(userPromises);
          // Count users that exist, have manager role, and aren't deleted
          managerCount = users.filter(u =>
            u !== null &&
            u.role === 'manager' &&
            u.deleted_at === null
          ).length;
        }

        // Fetch employees for this venue
        const { data: employeesData } = await supabase
          .from('employees')
          .select('id')
          .eq('venue_id', venue.id);

        metrics[venue.id] = {
          managers: managerCount,
          employees: (employeesData || []).length
        };
      }

      setVenueMetrics(metrics);
      setLoadingMetrics(false);
    };

    fetchVenueMetrics();
  }, [allVenues, isMultiVenueMode]);

  // Fetch detailed venue data when expanding a venue
  const fetchVenueDetails = async (venueIdToFetch) => {
    // If already fetched, don't refetch
    if (venueDetails[venueIdToFetch]) return;

    // Get the account_id from the venue
    const venue = allVenues.find(v => v.id === venueIdToFetch);
    if (!venue) return;

    // Fetch managers (users with staff association to this venue)
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('user_id')
      .eq('venue_id', venueIdToFetch);

    console.log('Staff data for venue', venueIdToFetch, ':', staffData, 'Error:', staffError);

    const staffUserIds = (staffData || []).map(s => s.user_id).filter(id => id !== null);
    console.log('Staff user IDs:', staffUserIds);

    let managers = [];
    if (staffUserIds.length > 0) {
      // Query each user individually to work around RLS policies
      // that may restrict which users can be seen with .in() queries
      const userPromises = staffUserIds.map(async (userId) => {
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role, reports_to, invited_by, deleted_at')
          .eq('id', userId)
          .single();
        if (error) {
          console.log('Error fetching user', userId, ':', error);
        }
        return data;
      });

      const userResults = await Promise.all(userPromises);
      console.log('User results:', userResults);
      managers = userResults.filter(user => user !== null && user.deleted_at === null);
      console.log('Filtered managers:', managers);
    }

    // Fetch employees
    const { data: employeesData } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, role')
      .eq('venue_id', venueIdToFetch);

    // Build manager hierarchy
    const buildManagerHierarchy = (managersArray) => {
      // Find the master user (root) for this account
      const masterIds = managersArray.filter(m => m.role === 'master').map(m => m.id);

      // Organize managers by who they report to
      const tree = [];
      const managersById = {};
      managersArray.forEach(m => { managersById[m.id] = { ...m, children: [] }; });

      managersArray.forEach(m => {
        const parentId = m.reports_to || m.invited_by;
        if (!parentId || masterIds.includes(m.id) || !managersById[parentId]) {
          // Root level manager (reports to master or no parent in this venue)
          tree.push(managersById[m.id]);
        } else if (managersById[parentId]) {
          managersById[parentId].children.push(managersById[m.id]);
        }
      });

      return tree;
    };

    setVenueDetails(prev => ({
      ...prev,
      [venueIdToFetch]: {
        managers: buildManagerHierarchy(managers),
        employees: employeesData || [],
        rawManagers: managers
      }
    }));
  };

  // Handle venue row expansion toggle
  const handleVenueExpand = async (venueIdToExpand) => {
    if (expandedVenueId === venueIdToExpand) {
      setExpandedVenueId(null);
    } else {
      setExpandedVenueId(venueIdToExpand);
      await fetchVenueDetails(venueIdToExpand);
    }
  };

  // Recursive component to render manager hierarchy
  const ManagerNode = ({ manager, depth = 0 }) => {
    const hasChildren = manager.children && manager.children.length > 0;
    const displayName = manager.first_name && manager.last_name
      ? `${manager.first_name} ${manager.last_name}`
      : manager.email;

    return (
      <div>
        <div
          className="flex items-center gap-2 py-1.5"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          {depth > 0 && (
            <div className="w-4 h-px bg-gray-300 dark:bg-gray-600" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
              {displayName}
            </span>
            {manager.email && manager.first_name && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                {manager.email}
              </span>
            )}
          </div>
          {manager.role === 'master' && (
            <span className="px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900 rounded-full">
              Owner
            </span>
          )}
        </div>
        {hasChildren && (
          <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-3">
            {manager.children.map(child => (
              <ManagerNode key={child.id} manager={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Fetch venue data
  useEffect(() => {
    if (!venueId) {
      return;
    }

    const fetchVenueData = async () => {
      // Fetch venue data
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name, address, phone, website, country')
        .eq('id', venueId)
        .single();

      if (venueError) {
        console.error('Error fetching venue settings:', venueError);
        return;
      }

      // Set venue data
      setName(venueData.name || '');
      setPhone(venueData.phone || '');
      setWebsite(venueData.website || '');
      setCountry(venueData.country || 'GB');
      setAddress(venueData.address || {
        line1: '',
        line2: '',
        city: '',
        county: '',
        postalCode: '',
        country: '',
      });
    };

    fetchVenueData();
  }, [venueId]);

  // Save settings
  const saveSettings = async () => {
    if (!venueId) return;

    setLoading(true);
    setMessage('');

    try {
      // Update venues table
      const venueUpdates = {
        name,
        address,
        phone,
        website,
        country,
      };

      const { error: venueError } = await supabase
        .from('venues')
        .update(venueUpdates)
        .eq('id', venueId);

      if (venueError) {
        throw venueError;
      }

      setMessage('Venue settings updated successfully!');
    } catch (error) {
      console.error('Error updating venue settings:', error);
      const errorDetails = error.code ? `Error ${error.code}: ${error.message}` : error.message;
      setMessage(`Failed to update venue settings: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch account ID and user ID for venue management
  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!isMultiVenueMode || !userRole || userRole !== 'master') return;

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      setUserId(user.id);

      const { data: userRow } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (userRow) {
        setAccountId(userRow.account_id);

        // Fetch available managers for this account (include reports_to for hierarchy info)
        const { data: managers } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role, reports_to')
          .eq('account_id', userRow.account_id)
          .eq('role', 'manager')
          .is('deleted_at', null);

        setAvailableManagers(managers || []);
      }
    };

    fetchAccountInfo();
  }, [isMultiVenueMode, userRole]);

  // Update Stripe subscription quantity
  const updateStripeQuantity = async () => {
    try {
      const response = await fetch('/api/update-subscription-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      await response.json();
    } catch (error) {
      // Silently handle subscription update errors
    }
  };

  // Handle create venue form submit
  const handleCreateVenueSubmit = (e) => {
    e.preventDefault();
    if (!newVenue.name || !accountId || !userId) {
      setVenueMessage('Please fill in the venue name');
      return;
    }
    setShowCreateWarning(true);
  };

  // Create new venue
  const handleCreateVenue = async () => {
    setShowCreateWarning(false);
    setVenueLoading(true);
    setVenueMessage('');

    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .insert([
          {
            name: newVenue.name,
            account_id: accountId,
            logo: null,
            address: newVenue.address,
            primary_color: '#16A34A',
            background_color: '#ffffff',
            text_color: '#111827',
            button_text_color: '#ffffff',
          },
        ])
        .select()
        .single();

      if (venueError) {
        throw new Error(venueError.message);
      }

      // If a manager was selected, create a staff record to assign them to this venue
      if (newVenue.assignedManagerId && venueData?.id) {
        const { error: staffError } = await supabase
          .from('staff')
          .insert([
            {
              user_id: newVenue.assignedManagerId,
              venue_id: venueData.id,
            },
          ]);

        if (staffError) {
          console.error('Error assigning manager to venue:', staffError);
          // Don't fail the whole operation, just log the error
        }
      }

      await updateStripeQuantity();

      setVenueMessage('Venue created successfully! This venue will be added to your next billing cycle.');
      setNewVenue({
        name: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          county: '',
          postalCode: '',
          country: '',
        },
        assignedManagerId: '',
      });

      // Refresh the page or context to show new venue
      window.location.reload();

    } catch (error) {
      console.error('Error creating venue:', error);
      const errorDetails = error.code ? `Error ${error.code}: ${error.message}` : error.message;
      setVenueMessage(`Failed to create venue: ${errorDetails}. Please contact support.`);
    } finally {
      setVenueLoading(false);
    }
  };

  // Handle delete venue
  const handleDeleteVenue = async () => {
    if (!deleteConfirm) return;

    setDeleteLoading(true);
    setVenueMessage('');

    try {
      const { venueId: venueToDelete, venueName } = deleteConfirm;

      if (venueToDelete === venueId) {
        setVenueMessage('Cannot delete the venue you are currently viewing. Please switch to another venue first.');
        setDeleteConfirm(null);
        setDeleteLoading(false);
        return;
      }

      // Delete associated staff records first
      const { error: staffError } = await supabase
        .from('staff')
        .delete()
        .eq('venue_id', venueToDelete);

      if (staffError) {
        throw new Error(`Failed to delete staff records: ${staffError.message}`);
      }

      // Delete the venue
      const { error: venueError } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueToDelete)
        .eq('account_id', accountId);

      if (venueError) {
        throw new Error(`Failed to delete venue: ${venueError.message}`);
      }

      await updateStripeQuantity();

      setVenueMessage(`Venue "${venueName}" deleted successfully! This venue will be removed from your next billing cycle.`);
      setDeleteConfirm(null);

      // Refresh the page to update the venue list
      window.location.reload();

    } catch (error) {
      console.error('Error deleting venue:', error);
      setVenueMessage(`Failed to delete venue: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };


  if (!venueId) {
    return null;
  }

  // Multi-venue list mode: Show all venues with quick switcher
  if (isMultiVenueMode) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Venues</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick glance at your venues. Click to expand and see details.</p>
        </div>

        {loadingMetrics ? (
          <ModernCard padding="p-5" shadow="shadow-sm">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
                <span className="text-gray-600 dark:text-gray-400">Loading venue metrics...</span>
              </div>
            </div>
          </ModernCard>
        ) : (
          <div className="space-y-4">
            {allVenues.map((venue) => {
              const metrics = venueMetrics[venue.id] || {};
              const isExpanded = expandedVenueId === venue.id;
              const details = venueDetails[venue.id];

              return (
                <ModernCard key={venue.id} padding="p-0" shadow="shadow-sm">
                  {/* Venue Header - Clickable */}
                  <div
                    className={`p-5 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-gray-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
                    onClick={() => handleVenueExpand(venue.id)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side - Venue info */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVenueExpand(venue.id); }}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{venue.name}</div>
                          {venue.address && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {venue.address.city || venue.address.line1}
                              {venue.address.postalCode && `, ${venue.address.postalCode}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side - Stats and actions */}
                      <div className="flex items-center gap-6">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Managers</div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {metrics.managers || 0}
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Employees</div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {metrics.employees || 0}
                            </span>
                          </div>
                        </div>

                        {/* Delete action */}
                        {allVenues.length > 1 && (
                          <PermissionGate permission="venue.edit">
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ venueId: venue.id, venueName: venue.name }); }}
                              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Delete venue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        )}
                      </div>
                    </div>

                    {/* Mobile stats - shown below on small screens */}
                    <div className="sm:hidden mt-4 grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Managers</div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {metrics.managers || 0}
                        </span>
                      </div>
                      <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Employees</div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {metrics.employees || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-700 pt-4">
                      {!details ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading details...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Manager Hierarchy Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Manager Hierarchy</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({details.rawManagers?.length || 0})</span>
                            </div>
                            {details.managers && details.managers.length > 0 ? (
                              <div className="space-y-1">
                                {details.managers.map(manager => (
                                  <ManagerNode key={manager.id} manager={manager} />
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No managers assigned to this venue</p>
                            )}
                          </div>

                          {/* Employees Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Employees</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({details.employees?.length || 0})</span>
                            </div>
                            {details.employees && details.employees.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {details.employees.map(employee => (
                                  <div key={employee.id} className="flex items-center gap-2 py-1">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                                        {employee.first_name && employee.last_name
                                          ? `${employee.first_name} ${employee.last_name}`
                                          : employee.email || 'Unnamed Employee'}
                                      </span>
                                      {employee.role && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{employee.role}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No employees at this venue</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ModernCard>
              );
            })}
          </div>
        )}

        {/* Create Additional Venue - shown if master OR has venue.create permission */}
        {(userRole === 'master' || hasPermission('venue.create')) && (
          <ModernCard padding="p-0" shadow="shadow-sm">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Create Additional Venue</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expand your business by adding more venues to your account.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateVenueSubmit} className="p-5 space-y-6">
              {/* Venue Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Venue Name *</label>
                <input
                  type="text"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                  placeholder="e.g. The Golden Lion"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address *</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Address Line 1 *"
                    value={newVenue.address.line1}
                    onChange={(e) => setNewVenue(prev => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2 (optional)"
                    value={newVenue.address.line2}
                    onChange={(e) => setNewVenue(prev => ({
                      ...prev,
                      address: { ...prev.address, line2: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City *"
                      value={newVenue.address.city}
                      onChange={(e) => setNewVenue(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                      required
                    />
                    <input
                      type="text"
                      placeholder="County (optional)"
                      value={newVenue.address.county}
                      onChange={(e) => setNewVenue(prev => ({
                        ...prev,
                        address: { ...prev.address, county: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Postal Code *"
                      value={newVenue.address.postalCode}
                      onChange={(e) => setNewVenue(prev => ({
                        ...prev,
                        address: { ...prev.address, postalCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Country *"
                      value={newVenue.address.country}
                      onChange={(e) => setNewVenue(prev => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Assign Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign Manager (optional)</label>
                {(() => {
                  // Helper: Check if targetId is a subordinate of managerId (reports to them directly or indirectly)
                  const isSubordinate = (targetId, managerId, managersById) => {
                    let current = managersById.get(targetId);
                    const visited = new Set();
                    while (current && !visited.has(current.id)) {
                      visited.add(current.id);
                      if (current.reports_to === managerId) {
                        return true;
                      }
                      current = managersById.get(current.reports_to);
                    }
                    return false;
                  };

                  // Filter managers based on user role
                  // Masters can see all managers, managers can only see their subordinates
                  const managersById = new Map(availableManagers.map(m => [m.id, m]));
                  const filteredManagers = userRole === 'master'
                    ? availableManagers
                    : availableManagers.filter(m => isSubordinate(m.id, userId, managersById));

                  // Build hierarchy for dropdown display
                  const buildHierarchyOptions = () => {
                    const options = [];

                    // Find root managers within the filtered set
                    // For masters: managers who report to master or have no parent in the list
                    // For managers: managers who report directly to them
                    const rootManagers = filteredManagers.filter(m => {
                      if (userRole === 'master') {
                        return !m.reports_to || m.reports_to === userId || !managersById.has(m.reports_to);
                      } else {
                        // For non-masters, root managers are those who report directly to them
                        return m.reports_to === userId;
                      }
                    });

                    // Recursively add managers with their depth
                    const addManagerWithChildren = (manager, depth) => {
                      const displayName = manager.first_name && manager.last_name
                        ? `${manager.first_name} ${manager.last_name}`
                        : manager.email;

                      options.push({
                        id: manager.id,
                        name: displayName,
                        depth
                      });

                      // Find children (managers who report to this manager) within filtered set
                      const children = filteredManagers.filter(m => m.reports_to === manager.id);
                      children.forEach(child => addManagerWithChildren(child, depth + 1));
                    };

                    rootManagers.forEach(m => addManagerWithChildren(m, 0));
                    return options;
                  };

                  const hierarchyOptions = buildHierarchyOptions();
                  const selectedManager = filteredManagers.find(m => m.id === newVenue.assignedManagerId);
                  const selectedDisplayName = selectedManager
                    ? (selectedManager.first_name && selectedManager.last_name
                        ? `${selectedManager.first_name} ${selectedManager.last_name}`
                        : selectedManager.email)
                    : 'No manager assigned';

                  return (
                    <div className="relative">
                      <select
                        value={newVenue.assignedManagerId}
                        onChange={(e) => setNewVenue(prev => ({ ...prev, assignedManagerId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base appearance-none"
                        style={{ color: 'transparent' }}
                      >
                        <option value="">No manager assigned</option>
                        {hierarchyOptions.map(opt => {
                          const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(opt.depth);
                          const prefix = opt.depth > 0 ? '└ ' : '';
                          return (
                            <option key={opt.id} value={opt.id}>
                              {`${indent}${prefix}${opt.name}`}
                            </option>
                          );
                        })}
                      </select>
                      {/* Overlay to show clean name */}
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                        <span className={`text-sm lg:text-base ${newVenue.assignedManagerId ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {selectedDisplayName}
                        </span>
                      </div>
                      {/* Dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can assign additional managers later from the venue details.
                </p>
                {/* Supervisor access note - only show if supervisor is another manager, not the master */}
                {(() => {
                  const selectedManager = availableManagers.find(m => m.id === newVenue.assignedManagerId);
                  // Only show note if the manager reports to another manager (not to master/current user)
                  if (selectedManager?.reports_to && selectedManager.reports_to !== userId) {
                    const supervisor = availableManagers.find(m => m.id === selectedManager.reports_to);
                    // Only show if we found the supervisor in the managers list (meaning they're a manager, not master)
                    if (supervisor) {
                      const supervisorName = supervisor.first_name && supervisor.last_name
                        ? `${supervisor.first_name} ${supervisor.last_name}`
                        : supervisor.email;
                      return (
                        <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {supervisorName} does not have access to this venue. They will still see this manager in their hierarchy, but won't be able to manage their access to this venue until added.
                          </p>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>

              {/* Create Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={venueLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {venueLoading ? 'Creating Venue...' : 'Create New Venue'}
                </button>
              </div>

              {/* Venue Creation Message */}
              {venueMessage && (
                <div className={`text-sm p-3 rounded-lg ${
                  venueMessage.includes('success')
                    ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                    : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                }`}>
                  {venueMessage}
                </div>
              )}
            </form>
          </ModernCard>
        )}

        {/* Create Venue Confirmation Modal */}
        {showCreateWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Venue?</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                You're about to create <strong>"{newVenue.name}"</strong>.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Billing Information:</strong>
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 ml-4">
                  <li>• This venue will be added to your subscription</li>
                  <li>• You'll be charged on your next billing date</li>
                  <li>• Cost: £149/month or £1,430/year per venue</li>
                  <li>• Prorated amount will apply for partial months</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateVenue}
                  disabled={venueLoading}
                  className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {venueLoading ? 'Creating...' : 'Yes, Create Venue'}
                </button>
                <button
                  onClick={() => setShowCreateWarning(false)}
                  disabled={venueLoading}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Venue?</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                Are you sure you want to delete <strong>"{deleteConfirm.venueName}"</strong>?
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Important:</strong> This will:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 space-y-1 ml-4">
                  <li>• Permanently delete all venue data</li>
                  <li>• Remove all staff assignments</li>
                  <li>• Delete all feedback and analytics</li>
                  <li>• Reduce your next billing cycle amount</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteVenue}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 dark:bg-red-700 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete Venue'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteLoading}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single-venue edit mode: Show edit form for current venue
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Venue Details</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your venue information and location details</p>
      </div>

      <VenueTab
        name={name}
        setName={setName}
        address={address}
        setAddress={setAddress}
        phone={phone}
        setPhone={setPhone}
        website={website}
        setWebsite={setWebsite}
        country={country}
        setCountry={setCountry}
        saveSettings={saveSettings}
        loading={loading}
        message={message}
        venueId={venueId}
      />
    </div>
  );
};

export default VenueSettingsPage;