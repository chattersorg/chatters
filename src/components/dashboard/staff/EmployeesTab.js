// EmployeesTab.js - Main component that orchestrates all the smaller components

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { supabase } from '../../../utils/supabase';
import { downloadEmployeesCSV, parseEmployeesCSV } from '../../../utils/csvUtils';
import EmployeesList from './employeetabcomponents/EmployeesList';
import AddEmployeeModal from './employeetabcomponents/AddEmployeeModal';
import EmployeeSummary from './employeetabcomponents/EmployeeSummary';
import EditEmployeeModal from './employeetabcomponents/EditEmployeeModal';
import DeleteEmployeeModal from './employeetabcomponents/DeleteEmployeeModal';
import ConfirmationModal from '../../ui/ConfirmationModal';

const EmployeesTab = ({ 
  employees, 
  allVenues,
  venueId,
  userRole,
  loading,
  fetchStaffData,
  setMessage 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [csvConfirmation, setCsvConfirmation] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Color mappings from database
  const [roleColors, setRoleColors] = useState({});
  const [locationColors, setLocationColors] = useState({});

  // Fetch role and location colors from database
  const fetchColors = async () => {
    if (!venueId) return;

    try {
      // Fetch role colors
      const { data: rolesData } = await supabase
        .from('staff_roles')
        .select('name, color')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      // Fetch location colors  
      const { data: locationsData } = await supabase
        .from('staff_locations')
        .select('name, color')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      // Create color mappings
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

  // Fetch colors when venueId changes
  useEffect(() => {
    fetchColors();
  }, [venueId]);

  // Filter employees to only show current venue employees and sort alphabetically
  const visibleEmployees = employees
    .filter(emp => emp.venue_id === venueId)
    .sort((a, b) => {
      const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
      const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });


  // Filter employees for managers (single venue) - no pagination
  const managerData = useMemo(() => {
    if (userRole !== 'manager') return null;
    
    // Filter employees
    const filtered = searchTerm.trim() 
      ? visibleEmployees.filter(employee => 
          employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.location?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : visibleEmployees;
    
    return {
      filtered,
      paginated: filtered // Show all employees, no pagination
    };
  }, [userRole, visibleEmployees, searchTerm]);

  // Filter employees for masters (same as managers now since we only show current venue) - no pagination
  const masterData = useMemo(() => {
    if (userRole !== 'master') return null;
    
    // Filter employees
    const filtered = searchTerm.trim() 
      ? visibleEmployees.filter(employee => 
          employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.location?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : visibleEmployees;
    
    return {
      filtered,
      paginated: filtered // Show all employees, no pagination
    };
  }, [userRole, visibleEmployees, searchTerm]);

  // Calculate total stats for search results
  const searchStats = useMemo(() => {
    const data = userRole === 'manager' ? managerData : masterData;
    return data ? {
      totalFiltered: data.filtered.length,
      totalVisible: data.paginated.length
    } : { totalFiltered: 0, totalVisible: 0 };
  }, [userRole, managerData, masterData]);

  // Handle search changes
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEditForm(true);
  };

  // Handle delete employee - show modal
  const handleDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
  };

  // Confirm delete employee - actual deletion
  const confirmDeleteEmployee = async (employeeId, employeeName) => {
    setDeleteLoading(true);
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      setMessage('Employee deleted successfully!');
      setEmployeeToDelete(null);
      
      // Refresh the staff data
      if (fetchStaffData) {
        await fetchStaffData();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      setMessage('Failed to delete employee. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle CSV download
  const handleDownloadCSV = (selectedVenueId = null) => {
    let employeesToDownload;
    let venueName = null;
    
    if (userRole === 'master') {
      if (selectedVenueId) {
        // Download for specific venue
        const venue = allVenues.find(v => v.id === selectedVenueId);
        employeesToDownload = employees.filter(emp => emp.venue_id === selectedVenueId);
        venueName = venue?.name;
      } else {
        // Download all employees
        employeesToDownload = employees;
        venueName = 'all_venues';
      }
    } else {
      // Manager - download only their venue employees
      employeesToDownload = visibleEmployees;
      venueName = allVenues.find(v => v.id === venueId)?.name;
    }
    
    downloadEmployeesCSV(employeesToDownload, venueName);
  };

  // Handle CSV upload
  const handleCSVUpload = async (file, targetVenueId = null) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const { employees: parsedEmployees, errors } = await parseEmployeesCSV(file);
      
      if (errors.length > 0) {
        setMessage(`CSV parsing errors: ${errors.join('; ')}`);
        return;
      }
      
      if (parsedEmployees.length === 0) {
        setMessage('No valid employee data found in CSV file');
        return;
      }
      
      // Determine venue ID for replacement
      let targetVenueIdForReplace;
      if (userRole === 'master' && targetVenueId) {
        targetVenueIdForReplace = targetVenueId;
      } else if (userRole === 'manager') {
        targetVenueIdForReplace = venueId;
      } else {
        setMessage('Unable to determine venue for employee import');
        return;
      }
      
      // Confirm replacement action
      const venueName = allVenues.find(v => v.id === targetVenueIdForReplace)?.name || 'this venue';
      const existingEmployeesCount = employees.filter(emp => emp.venue_id === targetVenueIdForReplace).length;
      
      if (existingEmployeesCount > 0) {
        // Show confirmation modal instead of window.confirm
        await new Promise((resolve) => {
          setCsvConfirmation({
            message: (
              <div>
                <p className="mb-4 dark:text-gray-300">
                  This will replace all <strong>{existingEmployeesCount}</strong> existing employees at <strong>{venueName}</strong> with <strong>{parsedEmployees.length}</strong> new employees from your CSV.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-custom-yellow dark:text-yellow-400">
                    <strong>Warning:</strong> This action cannot be undone. All existing employee data will be permanently deleted.
                  </p>
                </div>
              </div>
            ),
            onConfirm: () => {
              setCsvConfirmation(null);
              resolve(true);
            },
            onCancel: () => {
              setCsvConfirmation(null);
              setUploading(false);
              resolve(false);
            }
          });
        }).then(confirmed => {
          if (!confirmed) return;
        });
      }
      
      // Delete all existing employees for this venue
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('venue_id', targetVenueIdForReplace);
      
      if (deleteError) {
        console.error('Error deleting existing employees:', deleteError);
        setMessage('Failed to remove existing employees');
        return;
      }
      
      // Add venue_id to each employee
      const employeesToInsert = parsedEmployees.map(emp => ({
        ...emp,
        venue_id: targetVenueIdForReplace
      }));
      
      // Insert all new employees
      const { data, error } = await supabase
        .from('employees')
        .insert(employeesToInsert)
        .select();
      
      if (error) {
        console.error('Error inserting employees:', error);
        
        // Handle specific error codes
        if (error.code === '23505') {
          setMessage('Import failed: Duplicate email addresses found within your CSV file.');
        } else {
          setMessage(`Failed to import employees: ${error.message}`);
        }
        return;
      }
      
      setMessage(`Successfully replaced all employees with ${data.length} new employee${data.length !== 1 ? 's' : ''} from CSV`);
      
      // Refresh the staff data
      if (fetchStaffData) {
        await fetchStaffData();
      }
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      setMessage(`Failed to process CSV: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event, targetVenueId = null) => {
    const file = event.target.files[0];
    if (file) {
      handleCSVUpload(file, targetVenueId);
    }
    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {userRole === 'master'
                ? 'View and manage employees across all venues.'
                : 'View and manage employees at your venue.'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Need a CSV template? <a
                href="/employee-template.csv"
                download="employee-template.csv"
                className="text-custom-blue dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
              >
                Download sample file
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Search and Pagination Controls */}
      <div className="mb-6">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees by name, email, role, phone, location..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-custom-blue focus:border-custom-blue text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {searchStats.totalFiltered > 0 ? (
              <>
                {`Found ${searchStats.totalFiltered} employee${searchStats.totalFiltered !== 1 ? 's' : ''} at this venue`}
                {searchTerm && (
                  <span className="ml-1">
                    for "{searchTerm}"
                  </span>
                )}
              </>
            ) : searchTerm ? (
              <>No employees found for "{searchTerm}"</>
            ) : (
              <>No employees found</>
            )}
          </div>
        </div>
      </div>

      {/* Employees List */}
      <EmployeesList
        userRole={userRole}
        visibleEmployees={userRole === 'manager' ? (managerData?.paginated || []) : (masterData?.paginated || [])}
        masterData={masterData}
        onAddEmployee={() => setShowAddForm(true)}
        onEditEmployee={handleEditEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onDownloadCSV={handleDownloadCSV}
        onUploadCSV={handleFileInputChange}
        uploading={uploading}
        roleColors={roleColors}
        locationColors={locationColors}
      />

      {/* Summary */}
      <EmployeeSummary
        visibleEmployees={visibleEmployees}
        userRole={userRole}
        allVenues={allVenues}
        filteredCount={searchStats.totalFiltered}
        searchTerm={searchTerm}
      />

      {/* Add Employee Modal */}
      <AddEmployeeModal
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        allVenues={allVenues}
        venueId={venueId}
        userRole={userRole}
        employees={employees}
        fetchStaffData={fetchStaffData}
        setMessage={setMessage}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        showEditForm={showEditForm}
        setShowEditForm={setShowEditForm}
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

      {/* CSV Upload Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!csvConfirmation}
        onConfirm={csvConfirmation?.onConfirm}
        onCancel={csvConfirmation?.onCancel}
        title="Replace All Employees"
        message={csvConfirmation?.message}
        confirmText="Replace Employees"
        cancelText="Cancel Upload"
        confirmButtonStyle="warning"
        icon="warning"
        loading={uploading}
      />
    </div>
  );
};

export default EmployeesTab;