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
import toast from 'react-hot-toast';
import {
  Search, X, Download, Upload, Eye,
  Users
} from 'lucide-react';

const StaffListPage = () => {
  usePageTitle('Employees');
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId, userRole, allVenues, loading: venueLoading } = useVenue();

  // Data states
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle success message from CSV import page
  useEffect(() => {
    if (location.state?.message) {
      if (location.state.success) {
        toast.success(location.state.message);
      } else {
        toast.error(location.state.message);
      }
      // Clear the state so message doesn't reappear on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Employee modals
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
  const [showEditEmployeeForm, setShowEditEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    fetchEmployeeData();
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

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      // For master users, fetch employees from all venues
      // For managers, fetch employees from current venue only
      if (userRole === 'master') {
        if (!allVenues || allVenues.length === 0) {
          setEmployees([]);
          return;
        }

        const venueIds = allVenues.map(v => v.id);
        const { data: employeesData } = await supabase
          .from('employees')
          .select(`id, venue_id, first_name, last_name, email, phone, role, location, created_at, venues (id, name)`)
          .in('venue_id', venueIds);

        setEmployees(employeesData || []);
      } else {
        const { data: employeesData } = await supabase
          .from('employees')
          .select(`id, venue_id, first_name, last_name, email, phone, role, location, created_at, venues (id, name)`)
          .eq('venue_id', venueId);

        setEmployees(employeesData || []);
      }
    } catch (error) {
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
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

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    if (!searchTerm.trim()) {
      return visibleEmployees;
    }

    return visibleEmployees.filter(emp =>
      emp.first_name?.toLowerCase().includes(searchLower) ||
      emp.last_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.role?.toLowerCase().includes(searchLower) ||
      emp.phone?.toLowerCase().includes(searchLower) ||
      emp.location?.toLowerCase().includes(searchLower)
    );
  }, [visibleEmployees, searchTerm]);

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

  const confirmDeleteEmployee = async (employeeId) => {
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) throw error;
      toast.success('Employee deleted successfully!');
      setEmployeeToDelete(null);
      await fetchEmployeeData();
    } catch (error) {
      toast.error('Failed to delete employee. Please try again.');
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
        toast.error(`CSV parsing errors: ${errors.join('; ')}`);
        setUploading(false);
        return;
      }
      if (parsedEmployees.length === 0) {
        toast.error('No valid employee data found in CSV file');
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
        toast.error(`CSV contains duplicate emails: ${csvDuplicateEmails.join(', ')}. Please remove duplicates and try again.`);
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
      toast.error(`Failed to process CSV: ${error.message}`);
      setUploading(false);
    }
  };

  if (venueLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading venues...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ChartCard
        title="Employees"
        subtitle="Manage employees at your venue"
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading staff data...</span>
          </div>
        )}

        {!loading && (
          <div className="w-full">
            {/* Header with Add button */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  View and manage employees at your venue
                </p>
              </div>
              <PermissionGate permission="staff.edit">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddEmployeeForm(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </PermissionGate>
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

              {/* CSV actions */}
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
            </div>

            {/* Employees Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[20%]" />
                    <col className="w-[25%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Employees */}
                    {filteredEmployees.map((employee, index) => (
                      <tr
                        key={`employee-${employee.id}`}
                        className={`hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-150 ${
                          index % 2 === 0
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
                          {employee.location ? (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={getLocationStyle(employee.location)}
                            >
                              {employee.location}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
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
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                              <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {searchTerm ? 'No results found' : 'No employees yet'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {searchTerm
                                ? `No employees match "${searchTerm}"`
                                : 'Add your first employee to get started'
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
        fetchStaffData={fetchEmployeeData}
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
        fetchStaffData={fetchEmployeeData}
      />

      {/* Delete Employee Modal */}
      <DeleteEmployeeModal
        employee={employeeToDelete}
        onConfirm={confirmDeleteEmployee}
        onCancel={() => setEmployeeToDelete(null)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StaffListPage;
