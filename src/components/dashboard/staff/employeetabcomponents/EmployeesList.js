// EmployeesList.js - Handles displaying the list of employees

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Plus, Eye } from 'lucide-react';
import EmptyEmployeeState from './EmptyEmployeeState';

const EmployeesList = ({
  userRole,
  visibleEmployees,
  masterData,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onDownloadCSV,
  onUploadCSV,
  uploading,
  roleColors,
  locationColors
}) => {

  const navigate = useNavigate();

  // Both masters and managers now see only current venue employees, so treat them the same way
  const currentEmployees = userRole === 'master' && masterData ? masterData.paginated : visibleEmployees;

  // Helper function to convert hex color to lighter background and darker text
  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper function to create badge styles from hex color
  const createBadgeStyle = (hexColor) => {
    if (!hexColor) return {};
    
    return {
      backgroundColor: hexToRgba(hexColor, 0.1),
      color: hexColor,
      border: `1px solid ${hexToRgba(hexColor, 0.2)}`
    };
  };

  // Function to get role styling from database colors
  const getRoleStyle = (role) => {
    if (!role || !roleColors) return {};
    
    const normalizedRole = role.toLowerCase().trim();
    const hexColor = roleColors[normalizedRole];
    
    if (hexColor) {
      return createBadgeStyle(hexColor);
    }
    
    // Fallback to default gray
    return {
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
      border: '1px solid #e5e7eb'
    };
  };

  // Function to get location styling from database colors
  const getLocationStyle = (location) => {
    if (!location || !locationColors) return {};
    
    const normalizedLocation = location.toLowerCase().trim();
    const hexColor = locationColors[normalizedLocation];
    
    if (hexColor) {
      return createBadgeStyle(hexColor);
    }
    
    // Fallback to default cyan
    return {
      backgroundColor: '#ecfdf5',
      color: '#059669',
      border: '1px solid #d1fae5'
    };
  };

  // Single venue view for both masters and managers
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white">
          {userRole === 'master' ? 'Current Venue Employees' : 'Your Venue Employees'}
        </h3>
        
        {/* Employee actions */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => onAddEmployee && onAddEmployee()}
            className="text-sm sm:text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 sm:px-3 sm:py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200 flex items-center justify-center font-medium"
          >
            <Plus className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
            Add Employee
          </button>

          <button
            onClick={() => onDownloadCSV && onDownloadCSV()}
            className="text-sm sm:text-xs bg-green-100 dark:bg-green-900/30 text-custom-green dark:text-green-400 px-4 py-2 sm:px-3 sm:py-1 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200 flex items-center justify-center font-medium"
          >
            <Download className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
            Download
          </button>

          <label className="text-sm sm:text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 sm:px-3 sm:py-1 rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors duration-200 flex items-center justify-center cursor-pointer font-medium">
            <Upload className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
            {uploading ? 'Uploading...' : 'Replace'}
            <input
              type="file"
              accept=".csv"
              onChange={(e) => onUploadCSV && onUploadCSV(e)}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {currentEmployees.length === 0 ? (
        <EmptyEmployeeState 
          onAddEmployee={onAddEmployee}
          message="No employees yet"
          description="Add your first employee to get started"
          buttonText="Add Employee"
          showLargeButton={true}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {currentEmployees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={`hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 mr-4">
                        {`${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.first_name} {employee.last_name}
                        </div>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.email ? (
                      <span className="text-sm text-gray-900 dark:text-gray-200">{employee.email}</span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.phone ? (
                      <span className="text-sm text-gray-900 dark:text-gray-200">{employee.phone}</span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => navigate(`/staff/employees/${employee.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeesList;