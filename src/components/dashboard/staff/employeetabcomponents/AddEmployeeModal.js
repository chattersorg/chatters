// AddEmployeeModal.js - Modal for adding new employees

import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../../utils/supabase';
import { Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../ui/button';
import toast from 'react-hot-toast';

const AddEmployeeModal = ({
  showAddForm,
  setShowAddForm,
  allVenues,
  venueId,
  userRole,
  employees,
  fetchStaffData
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    location: '',
    venue_id: venueId || ''
  });
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Fetch available locations for the venue
  const fetchLocations = useCallback(async (venueIdToFetch) => {
    if (!venueIdToFetch) {
      setAvailableLocations([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('staff_locations')
        .select('*')
        .eq('venue_id', venueIdToFetch)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAvailableLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setAvailableLocations([]);
    }
  }, []);

  // Fetch available roles for the venue
  const fetchRoles = useCallback(async (venueIdToFetch) => {
    if (!venueIdToFetch) {
      setAvailableRoles([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .eq('venue_id', venueIdToFetch)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAvailableRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setAvailableRoles([]);
    }
  }, []);

  // Reset form when venueId changes
  useEffect(() => {
    if (venueId) {
      setFormData(prev => ({ ...prev, venue_id: venueId }));
      fetchLocations(venueId);
      fetchRoles(venueId);
    }
  }, [venueId, fetchLocations, fetchRoles]);

  // Fetch locations and roles when venue_id changes in form (for master users)
  useEffect(() => {
    if (formData.venue_id) {
      fetchLocations(formData.venue_id);
      fetchRoles(formData.venue_id);
    } else {
      setAvailableLocations([]);
      setAvailableRoles([]);
    }
  }, [formData.venue_id, fetchLocations, fetchRoles]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.venue_id) errors.venue_id = 'Please select a venue';
    if (!formData.role.trim()) errors.role = 'Role is required';
    
    // Check for duplicate email
    const emailExists = employees.some(emp => 
      emp.email.toLowerCase() === formData.email.toLowerCase()
    );
    if (emailExists) {
      errors.email = 'An employee with this email already exists';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Prepare employee data
      const employeeData = {
        ...formData,
        email: formData.email.toLowerCase(),
      };

      // Remove empty strings
      Object.keys(employeeData).forEach(key => {
        if (employeeData[key] === '') {
          employeeData[key] = null;
        }
      });

      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select();

      if (error) throw error;

      // Success
      toast.success('Employee added successfully!');
      setShowAddForm(false);
      resetForm();

      // Refresh the staff data
      if (fetchStaffData) {
        await fetchStaffData();
      }

    } catch (error) {
      console.error('Error adding employee:', error);
      if (error.code === '23505') {
        setFormErrors({ email: 'An employee with this email already exists' });
      } else {
        toast.error('Failed to add employee. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: '',
      location: '',
      venue_id: venueId || ''
    });
    setFormErrors({});
  }, [venueId]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    setFormErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  if (!showAddForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Employee
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                    formErrors.first_name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  placeholder="Enter first name"
                />
                {formErrors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                    formErrors.last_name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  placeholder="Enter last name"
                />
                {formErrors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.last_name}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                  formErrors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="employee@example.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+44 7XXX XXXXXX"
              />
            </div>

            {/* Role and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white ${
                    formErrors.role ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  disabled={!formData.venue_id}
                >
                  <option value="">Select a role</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
                )}
                {!formData.venue_id && (
                  <p className="mt-1 text-xs text-gray-500">Select a venue first</p>
                )}
                {formData.venue_id && availableRoles.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No roles configured for this venue</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                {availableLocations.length > 0 ? (
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a location</option>
                    {availableLocations.map(location => (
                      <option key={location.id} value={location.name}>{location.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter location (e.g., Kitchen, Bar, Front of House)"
                  />
                )}
                {!formData.venue_id && (
                  <p className="mt-1 text-xs text-gray-500">Select a venue first</p>
                )}
                {formData.venue_id && availableLocations.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">Enter location manually - no predefined locations found</p>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="w-full sm:w-auto px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  'Adding...'
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Add Employee
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;