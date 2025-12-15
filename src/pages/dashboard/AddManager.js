import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import usePageTitle from '../../hooks/usePageTitle';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import { Button } from '../../components/ui/button';
import DatePicker from '../../components/dashboard/inputs/DatePicker';
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
  RefreshCw
} from 'lucide-react';

const AddManager = () => {
  usePageTitle('Add Manager');
  const navigate = useNavigate();
  const { allVenues, userRole } = useVenue();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    venueIds: [],
    permissionTemplateId: null
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [accountId, setAccountId] = useState(null);

  // Redirect if not master
  useEffect(() => {
    if (userRole && userRole !== 'master') {
      navigate('/staff/list');
    }
  }, [userRole, navigate]);

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

        // Fetch role templates (system + account-specific)
        const { data: templates } = await supabase
          .from('role_templates')
          .select(`
            *,
            role_template_permissions (
              permissions (code, name)
            )
          `)
          .or(`is_system.eq.true,account_id.eq.${userData?.account_id}`)
          .order('is_system', { ascending: false })
          .order('name', { ascending: true });

        setRoleTemplates(templates || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: 'Failed to load templates' });
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchData();
  }, []);

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
        permissionTemplateId: formData.permissionTemplateId
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
        navigate('/staff/list');
      }, 2000);

    } catch (error) {
      console.error('Error inviting manager:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'master') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/staff/list')}
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
              <DatePicker
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </ChartCard>

        {/* Venue Assignment */}
        <ChartCard
          title="Venue Assignment"
          subtitle="Select which venues this manager can access"
        >
          <div className="space-y-3">
            {allVenues.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No venues available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allVenues.map(venue => (
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

        {/* Permissions Template */}
        <ChartCard
          title="Permissions Template"
          subtitle="Assign a role template to define what this manager can access"
        >
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : roleTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No permission templates available</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                You can set permissions after the manager accepts the invitation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roleTemplates.map(template => {
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
                Optional - You can also set permissions after the manager accepts the invitation
              </p>
            </div>
          )}
        </ChartCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/staff/list')}
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
