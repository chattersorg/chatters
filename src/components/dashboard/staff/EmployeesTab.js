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
import DuplicateResolutionModal from './employeetabcomponents/DuplicateResolutionModal';

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

  // Bulk add state
  const [duplicateResolution, setDuplicateResolution] = useState(null);
  
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

  // Handle CSV upload - Bulk Add with duplicate detection
  const handleCSVUpload = async (file, targetVenueId = null) => {
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

      // Determine venue ID for import
      let targetVenueIdForImport;
      if (userRole === 'master' && targetVenueId) {
        targetVenueIdForImport = targetVenueId;
      } else if (userRole === 'manager') {
        targetVenueIdForImport = venueId;
      } else {
        setMessage('Unable to determine venue for employee import');
        setUploading(false);
        return;
      }

      // Get existing employees for this venue
      const existingEmployees = employees.filter(emp => emp.venue_id === targetVenueIdForImport);

      // Create a map of existing employees by email (lowercased for case-insensitive comparison)
      const existingByEmail = {};
      existingEmployees.forEach(emp => {
        if (emp.email) {
          existingByEmail[emp.email.toLowerCase()] = emp;
        }
      });

      // Categorize parsed employees into new and duplicates
      const newEmployees = [];
      const duplicates = [];

      parsedEmployees.forEach(emp => {
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
      });

      // If there are duplicates, show the resolution modal
      if (duplicates.length > 0) {
        setDuplicateResolution({
          duplicates,
          newEmployees,
          targetVenueId: targetVenueIdForImport
        });
        setUploading(false);
        return;
      }

      // No duplicates - just insert all new employees
      await performBulkImport(newEmployees, [], targetVenueIdForImport);

    } catch (error) {
      console.error('Error processing CSV:', error);
      setMessage(`Failed to process CSV: ${error.message}`);
      setUploading(false);
    }
  };

  // Handle duplicate resolution confirmation
  const handleDuplicateResolution = async (emailsToOverwrite) => {
    if (!duplicateResolution) return;

    setUploading(true);
    try {
      const { duplicates, newEmployees, targetVenueId } = duplicateResolution;

      // Get the duplicate entries that should be overwritten
      const duplicatesToOverwrite = duplicates.filter(d => emailsToOverwrite.includes(d.email));

      await performBulkImport(newEmployees, duplicatesToOverwrite, targetVenueId);

    } catch (error) {
      console.error('Error processing bulk import:', error);
      setMessage(`Failed to import employees: ${error.message}`);
    } finally {
      setUploading(false);
      setDuplicateResolution(null);
    }
  };

  // Perform the actual bulk import
  const performBulkImport = async (newEmployees, duplicatesToOverwrite, targetVenueId) => {
    let insertedCount = 0;
    let updatedCount = 0;

    // Insert new employees
    if (newEmployees.length > 0) {
      const employeesToInsert = newEmployees.map(emp => ({
        ...emp,
        venue_id: targetVenueId
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('employees')
        .insert(employeesToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting employees:', insertError);

        if (insertError.code === '23505') {
          setMessage('Import failed: Duplicate email addresses found within your CSV file.');
        } else {
          setMessage(`Failed to import employees: ${insertError.message}`);
        }
        setUploading(false);
        return;
      }

      insertedCount = insertedData?.length || 0;
    }

    // Update duplicate employees that user chose to overwrite
    if (duplicatesToOverwrite.length > 0) {
      for (const duplicate of duplicatesToOverwrite) {
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            first_name: duplicate.new.first_name,
            last_name: duplicate.new.last_name,
            role: duplicate.new.role,
            location: duplicate.new.location,
            phone: duplicate.new.phone
          })
          .eq('id', duplicate.existing.id);

        if (updateError) {
          console.error('Error updating employee:', updateError);
        } else {
          updatedCount++;
        }
      }
    }

    // Build success message
    const messageParts = [];
    if (insertedCount > 0) {
      messageParts.push(`${insertedCount} new employee${insertedCount !== 1 ? 's' : ''} added`);
    }
    if (updatedCount > 0) {
      messageParts.push(`${updatedCount} employee${updatedCount !== 1 ? 's' : ''} updated`);
    }

    if (messageParts.length > 0) {
      setMessage(`Successfully ${messageParts.join(' and ')}`);
    } else {
      setMessage('No changes made - all employees in CSV already exist');
    }

    // Refresh the staff data
    if (fetchStaffData) {
      await fetchStaffData();
    }

    setUploading(false);
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

      {/* Bulk Add Duplicate Resolution Modal */}
      <DuplicateResolutionModal
        isOpen={!!duplicateResolution}
        duplicates={duplicateResolution?.duplicates || []}
        newEmployeesCount={duplicateResolution?.newEmployees?.length || 0}
        onConfirm={handleDuplicateResolution}
        onCancel={() => setDuplicateResolution(null)}
        loading={uploading}
      />
    </div>
  );
};

export default EmployeesTab;