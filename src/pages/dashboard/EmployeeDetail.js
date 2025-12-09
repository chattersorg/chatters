import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Save, X, ChevronDown, ChevronUp, History, User, Clock, Pause, Play, Trash2 } from 'lucide-react';

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
        console.error('Error fetching change logs:', logsError);
        throw logsError;
      }

      console.log('Successfully fetched change logs:', logsData);

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

      if (error) {
        console.error('Error inserting change log:', error);
      } else {
        console.log('Change logged successfully:', fieldName, oldValue, '->', newValue);
      }
    } catch (error) {
      console.error('Error logging change:', error);
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
          <span className="text-gray-500 text-sm lg:text-base">Loading employee details...</span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <ChartCard title="Employee Not Found">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">The employee you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => navigate('/staff/employees')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Employees
            </button>
          </div>
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/staff/employees')}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Employees
      </button>

      <ChartCard
        title="Employee Details"
        subtitle={`Manage information for ${employee.first_name} ${employee.last_name}`}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate permission="staff.edit">
              <button
                onClick={handleTogglePause}
                disabled={saving}
                className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                  employee.is_active
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
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
                className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </PermissionGate>
            <PermissionGate permission="staff.edit">
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                  hasChanges && !saving
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </PermissionGate>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Employee Preview Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {`${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {formData.first_name || 'First'} {formData.last_name || 'Last'}
                  </h2>
                  {employee.is_active ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                      Paused
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {formData.role && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">{formData.role}</span>
                    </div>
                  )}
                  {formData.location && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">{formData.location}</span>
                    </div>
                  )}
                  {formData.email && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">{formData.email}</span>
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">{formData.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="First Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+44 7700 900000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.name} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a location</option>
                    {locations.map((location) => (
                      <option key={location.name} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Change History Section */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowChangeLogs(!showChangeLogs)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Change History</h3>
                  <p className="text-sm text-gray-600">
                    {changeLogs.length} {changeLogs.length === 1 ? 'change' : 'changes'} recorded
                  </p>
                </div>
              </div>
              {showChangeLogs ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showChangeLogs && (
              <div className="mt-4 space-y-3">
                {changeLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No changes recorded yet</p>
                  </div>
                ) : (
                  changeLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {log.field_name.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.changed_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500 line-through">
                              {log.old_value || '(empty)'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-gray-900 font-medium">
                              {log.new_value || '(empty)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          {log.changed_by_user ? (
                            <span>
                              {log.changed_by_user.first_name} {log.changed_by_user.last_name}
                            </span>
                          ) : (
                            <span>System</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </ChartCard>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Employee
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to permanently delete <strong>{employee.first_name} {employee.last_name}</strong>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> This action cannot be undone. All employee data and change history will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
