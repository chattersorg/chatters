import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { ArrowLeft, Save, ChevronDown, ChevronUp, History, User, Pause, Play, Trash2, BarChart3 } from 'lucide-react';

// Custom Select component to match site styling
const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 font-medium cursor-pointer flex items-center justify-between"
      >
        <span className={!selectedOption ? 'text-gray-400 dark:text-gray-500' : ''}>{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              !value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                value === option.value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { venueId } = useVenue();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [changeLogs, setChangeLogs] = useState([]);
  const [showChangeLogs, setShowChangeLogs] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    location: ''
  });

  usePageTitle(employee ? `${employee.first_name} ${employee.last_name}` : 'Employee Details');

  useEffect(() => {
    if (!employeeId || !venueId) return;
    fetchEmployee();
    fetchRolesAndLocations();
    fetchChangeLogs();
  }, [employeeId, venueId]);

  const fetchEmployee = async () => {
    if (!employeeId || !venueId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .eq('venue_id', venueId)
        .single();

      if (error) throw error;

      setEmployee(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || '',
        location: data.location || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      setMessage('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesAndLocations = async () => {
    if (!venueId) return;

    try {
      const { data: rolesData } = await supabase
        .from('staff_roles')
        .select('name, color')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('display_order');

      const { data: locationsData } = await supabase
        .from('staff_locations')
        .select('name, color')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('display_order');

      setRoles(rolesData || []);
      setLocations(locationsData || []);
    } catch (error) {
      console.error('Error fetching roles and locations:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setMessage(''); // Clear any previous messages
  };

  const fetchChangeLogs = async () => {
    if (!employeeId) return;

    try {
      const { data: logsData, error: logsError } = await supabase
        .from('employee_change_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .order('changed_at', { ascending: false });

      if (logsError) {
        throw logsError;
      }

      // Then get user info for each unique changed_by user
      if (logsData && logsData.length > 0) {
        const userIds = [...new Set(logsData.map(log => log.changed_by).filter(Boolean))];

        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', userIds);

          // Merge user data into logs
          const enrichedLogs = logsData.map(log => ({
            ...log,
            changed_by_user: log.changed_by
              ? usersData?.find(u => u.id === log.changed_by)
              : null
          }));

          setChangeLogs(enrichedLogs);
        } else {
          setChangeLogs(logsData);
        }
      } else {
        setChangeLogs([]);
      }
    } catch (error) {
      console.error('Error fetching change logs:', error);
      setChangeLogs([]);
    }
  };

  const logChange = async (fieldName, oldValue, newValue) => {
    try {
      const { data: authData } = await supabase.auth.getUser();

      const { data, error } = await supabase.from('employee_change_logs').insert({
        employee_id: employeeId,
        changed_by: authData?.user?.id,
        field_name: fieldName,
        old_value: oldValue?.toString() || null,
        new_value: newValue?.toString() || null,
        change_type: 'update'
      });

      // Silently handle change log errors
    } catch (error) {
      // Silently handle change log errors
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Log all changes before updating
      const changes = [];
      if (employee.first_name !== formData.first_name.trim()) {
        changes.push({ field: 'first_name', old: employee.first_name, new: formData.first_name.trim() });
      }
      if (employee.last_name !== formData.last_name.trim()) {
        changes.push({ field: 'last_name', old: employee.last_name, new: formData.last_name.trim() });
      }
      if (employee.email !== formData.email.trim()) {
        changes.push({ field: 'email', old: employee.email, new: formData.email.trim() });
      }
      if (employee.phone !== formData.phone.trim()) {
        changes.push({ field: 'phone', old: employee.phone, new: formData.phone.trim() });
      }
      if (employee.role !== formData.role) {
        changes.push({ field: 'role', old: employee.role, new: formData.role || null });
      }
      if (employee.location !== formData.location) {
        changes.push({ field: 'location', old: employee.location, new: formData.location || null });
      }

      // Update employee
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role || null,
          location: formData.location || null
        })
        .eq('id', employeeId);

      if (error) throw error;

      // Log all changes (wait for all to complete)
      if (changes.length > 0) {
        await Promise.all(
          changes.map(change => logChange(change.field, change.old, change.new))
        );
      }

      setMessage('Employee updated successfully!');
      setHasChanges(false);

      // Refresh employee and change logs after updates are complete
      await fetchEmployee();
      await fetchChangeLogs();
    } catch (error) {
      console.error('Error updating employee:', error);
      setMessage('Failed to update employee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    const newStatus = !employee.is_active;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: newStatus })
        .eq('id', employeeId);

      if (error) throw error;

      // Log the status change
      await logChange('is_active', employee.is_active ? 'active' : 'paused', newStatus ? 'active' : 'paused');

      setMessage(`Employee ${newStatus ? 'activated' : 'paused'} successfully!`);

      await fetchEmployee();
      await fetchChangeLogs();
    } catch (error) {
      console.error('Error updating employee status:', error);
      setMessage('Failed to update employee status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      navigate('/staff/employees');
    } catch (error) {
      console.error('Error deleting employee:', error);
      setMessage('Failed to delete employee. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading employee details...</span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
          <div className="text-center py-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Employee Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">The employee you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => navigate('/staff/employees')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Employees
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/staff/employees')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
              {`${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {formData.first_name || 'First'} {formData.last_name || 'Last'}
                </h1>
                {employee.is_active ? (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formData.role || 'No role assigned'} {formData.location && `• ${formData.location}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <button
            onClick={() => navigate(`/staff-member/${employeeId}`)}
            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Performance
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Form Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="First Name"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Last Name"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+44 7700 900000"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Role
              </label>
              <CustomSelect
                value={formData.role}
                onChange={(value) => handleInputChange('role', value)}
                options={roles.map((role) => ({ value: role.name, label: role.name }))}
                placeholder="Select a role"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Location
              </label>
              <CustomSelect
                value={formData.location}
                onChange={(value) => handleInputChange('location', value)}
                options={locations.map((location) => ({ value: location.name, label: location.name }))}
                placeholder="Select a location"
              />
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PermissionGate permission="staff.edit">
              <button
                onClick={handleTogglePause}
                disabled={saving}
                className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                  employee.is_active
                    ? 'text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    : 'text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {employee.is_active ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Activate
                  </>
                )}
              </button>
            </PermissionGate>
            <PermissionGate permission="staff.edit">
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={saving || deleting}
                className="px-3 py-2 rounded-lg text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </PermissionGate>
          </div>
          <PermissionGate permission="staff.edit">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Change History Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowChangeLogs(!showChangeLogs)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Change History</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {changeLogs.length} {changeLogs.length === 1 ? 'change' : 'changes'} recorded
              </p>
            </div>
          </div>
          {showChangeLogs ? (
            <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </button>

        {showChangeLogs && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {changeLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No changes recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {changeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded shrink-0">
                          {log.field_name.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <span className="text-gray-400 dark:text-gray-500 line-through truncate">
                            {log.old_value || '(empty)'}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600 shrink-0">→</span>
                          <span className="text-gray-900 dark:text-white font-medium truncate">
                            {log.new_value || '(empty)'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                        <span>
                          {new Date(log.changed_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.changed_by_user ? (
                            <span>{log.changed_by_user.first_name}</span>
                          ) : (
                            <span>System</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Employee
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to permanently delete <strong className="dark:text-white">{employee.first_name} {employee.last_name}</strong>?
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      <strong>Warning:</strong> This action cannot be undone. All employee data and change history will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {deleting ? 'Deleting...' : 'Delete Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
