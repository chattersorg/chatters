import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import { supabase } from '../../utils/supabase';
import { useImpersonation } from '../../context/ImpersonationContext';
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Building2,
  Users,
  CreditCard,
  Calendar,
  ExternalLink,
  Clock,
  Plus,
  Loader2,
  Mail,
  UserCircle2,
  Sparkles
} from 'lucide-react';

const AdminAccountDetail = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { startImpersonation, isAdmin } = useImpersonation();
  const [account, setAccount] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [extendDays, setExtendDays] = useState('');
  const [extending, setExtending] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({ startDate: '', endDate: '' });
  const [dateRangeForAccount, setDateRangeForAccount] = useState(null);
  const [seedingDemoData, setSeedingDemoData] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, [accountId]);

  const loadAccountData = async () => {
    try {
      setLoading(true);

      // Load account with master user
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select(`
          *,
          users(id, email, first_name, last_name, role)
        `)
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      // Find master user - prefer ones with complete profile (first_name and last_name)
      const masterUsers = accountData.users?.filter(u => u.role === 'master') || [];
      const masterUser = masterUsers.find(u => u.first_name && u.last_name) || masterUsers[0] || accountData.users?.[0];
      setAccount({ ...accountData, masterUser });

      // Load venues for this account
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (venuesError) throw venuesError;

      setVenues(venuesData || []);

    } catch (error) {
      console.error('Error loading account:', error);
      toast.error('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const getAccountStatus = (account) => {
    if (!account) return null;
    const now = new Date();

    if (account.is_paid) {
      return {
        status: 'paid',
        label: 'Paid Account',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      };
    }

    if (account.trial_ends_at && new Date(account.trial_ends_at) > now) {
      const daysLeft = Math.ceil((new Date(account.trial_ends_at) - now) / (1000 * 60 * 60 * 24));
      return {
        status: 'trial',
        label: `Trial (${daysLeft} days left)`,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      };
    }

    return {
      status: 'expired',
      label: 'Trial Expired',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    };
  };

  const startEditing = () => {
    setEditingAccount({
      name: account.name || '',
      phone: account.phone || ''
    });
  };

  const saveAccountChanges = async () => {
    if (!editingAccount) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: editingAccount.name,
          phone: editingAccount.phone
        })
        .eq('id', accountId);

      if (error) throw error;

      setAccount({ ...account, ...editingAccount });
      setEditingAccount(null);
      toast.success('Account updated successfully!');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!extendDays || parseInt(extendDays) <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }

    setExtending(true);
    try {
      // Calculate new trial end date
      const currentTrialEnd = account.trial_ends_at ? new Date(account.trial_ends_at) : new Date();
      const newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + parseInt(extendDays));

      const { error } = await supabase
        .from('accounts')
        .update({
          trial_ends_at: newTrialEnd.toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;

      setAccount({ ...account, trial_ends_at: newTrialEnd.toISOString() });
      setExtendDays('');
      toast.success(`Trial extended by ${extendDays} days!`);
    } catch (error) {
      console.error('Error extending trial:', error);
      toast.error('Failed to extend trial');
    } finally {
      setExtending(false);
    }
  };

  const getStripePortalUrl = async () => {
    if (!account.stripe_customer_id) {
      toast.error('No Stripe customer associated with this account');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = window.location.hostname === 'localhost'
        ? 'https://my.getchatters.com/api/create-portal-session'
        : '/api/create-portal-session';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          customerId: account.stripe_customer_id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create portal session');
      }

      window.open(result.url, '_blank');
    } catch (error) {
      console.error('Error opening Stripe portal:', error);
      toast.error('Failed to open Stripe portal');
    }
  };

  const getStripeDashboardUrl = () => {
    if (!account.stripe_customer_id) return null;
    const isLive = !account.stripe_customer_id.startsWith('cus_test_');
    const mode = isLive ? '' : 'test/';
    return `https://dashboard.stripe.com/${mode}customers/${account.stripe_customer_id}`;
  };

  const showDemoDataPicker = (dataType = 'all') => {
    setDateRangeForAccount({ accountId: account.id, accountName: account.name, dataType });
    setShowDateRangePicker(true);

    // Set default date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    setSelectedDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const closeDateRangePicker = () => {
    setShowDateRangePicker(false);
    setDateRangeForAccount(null);
    setSelectedDateRange({ startDate: '', endDate: '' });
  };

  const populateDemoData = async () => {
    if (!dateRangeForAccount || !selectedDateRange.startDate || !selectedDateRange.endDate) {
      toast.error('Please select a valid date range');
      return;
    }

    const { accountId, accountName, dataType = 'all' } = dateRangeForAccount;
    const dayCount = Math.ceil((new Date(selectedDateRange.endDate) - new Date(selectedDateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1;

    const dataTypeLabels = {
      feedback: 'Feedback Sessions & Responses',
      reviews: 'Google & TripAdvisor Rating Scores',
      nps: 'NPS Email Submissions',
      all: 'All Demo Data'
    };

    const dataTypeDetails = {
      feedback: `- 30 feedback sessions per day\n- ~81 feedback items per day\n- Random staff resolution (60% of items older than 2 days)`,
      reviews: `- 1 Google rating per day (1-5 stars)\n- 1 TripAdvisor rating per day (1-5 stars)\n- Daily rating trend snapshots`,
      nps: `- 20 NPS submissions per day (0-10 scores)\n- Realistic email send/response timestamps`,
      all: `- 30 feedback sessions (~81 items, 60% resolved)\n- 20 NPS submissions\n- 2 rating scores (Google + TripAdvisor)\n- 2 rating snapshots`
    };

    if (!window.confirm(
      `Populate ${dataTypeLabels[dataType]} for "${accountName}"?\n\n` +
      `Date Range: ${selectedDateRange.startDate} to ${selectedDateRange.endDate} (${dayCount} days)\n\n` +
      `Per venue, per day:\n${dataTypeDetails[dataType]}\n\n` +
      `Dates with existing data will be SKIPPED.`
    )) {
      return;
    }

    setSeedingDemoData(true);
    setShowDateRangePicker(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Use production API URL for localhost, relative path for production
      const apiUrl = window.location.hostname === 'localhost'
        ? 'https://my.getchatters.com/api/admin/seed-demo-v2'
        : '/api/admin/seed-demo-v2';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          accountId,
          startDate: selectedDateRange.startDate,
          endDate: selectedDateRange.endDate,
          dataType
        })
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('API Response Status:', response.status);
      console.log('API Response Text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to populate demo data');
      }

      const successParts = [];
      if (result.stats.sessionsCreated) successParts.push(`${result.stats.sessionsCreated} sessions`);
      if (result.stats.feedbackCreated) successParts.push(`${result.stats.feedbackCreated} feedback items`);
      if (result.stats.feedbackResolved) successParts.push(`${result.stats.feedbackResolved} resolved`);
      if (result.stats.externalRatingsCreated) successParts.push(`${result.stats.externalRatingsCreated} rating snapshots`);
      if (result.stats.npsCreated) successParts.push(`${result.stats.npsCreated} NPS submissions`);
      if (result.stats.datesSkipped) successParts.push(`${result.stats.datesSkipped} dates skipped`);

      toast.success(
        `${dataTypeLabels[dataType]} created!\n${successParts.join(', ')}`,
        { duration: 6000 }
      );

      closeDateRangePicker();

    } catch (error) {
      console.error('Error populating demo data:', error);
      toast.error('Failed to populate demo data: ' + error.message);
    } finally {
      setSeedingDemoData(false);
    }
  };

  const handleImpersonate = async () => {
    if (!isAdmin || !account) {
      toast.error('Only Chatters admins can impersonate accounts');
      return;
    }

    if (venues.length === 0) {
      toast.error('This account has no venues to view');
      return;
    }

    const success = await startImpersonation(account.id, account.name);
    if (success) {
      toast.success(`Now viewing as ${account.name}`);
      // Clear venue selection to force reload with impersonated account
      localStorage.removeItem('chatters_currentVenueId');
      navigate('/dashboard');
    } else {
      toast.error('Failed to start impersonation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account not found</h2>
          <button
            onClick={() => navigate('/admin')}
            className="text-blue-600 hover:text-blue-800"
          >
            Return to accounts list
          </button>
        </div>
      </div>
    );
  }

  const status = getAccountStatus(account);
  const stripeDashboardUrl = getStripeDashboardUrl();

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{account.name || 'Account'} - Admin Center - Chatters</title>
      </Helmet>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Accounts
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {account.name || 'Unnamed Account'}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  {status && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${status.bgColor} ${status.textColor} ${status.borderColor}`}>
                      {status.label}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
                  </span>
                </div>
              </div>

              {!editingAccount ? (
                <div className="flex gap-2">
                  {isAdmin && venues.length > 0 && (
                    <button
                      onClick={handleImpersonate}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-purple-300 text-sm font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100"
                    >
                      <UserCircle2 className="w-4 h-4" />
                      Impersonate
                    </button>
                  )}
                  <button
                    onClick={startEditing}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Account
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={saveAccountChanges}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Account Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name
                  </label>
                  {editingAccount ? (
                    <input
                      type="text"
                      value={editingAccount.name}
                      onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      {account.name || 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone
                  </label>
                  {editingAccount ? (
                    <input
                      type="tel"
                      value={editingAccount.phone}
                      onChange={(e) => setEditingAccount({...editingAccount, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      {account.phone || 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Created
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {new Date(account.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Master User */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Master User</h3>

              {account.masterUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {account.masterUser.first_name?.[0]}{account.masterUser.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {account.masterUser.first_name} {account.masterUser.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{account.masterUser.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {account.masterUser.email}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No master user assigned</p>
              )}
            </div>

            {/* Billing & Stripe */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing & Stripe</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">Paid Status</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    account.is_paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.is_paid ? 'Paid' : 'Not Paid'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">Trial End</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {account.trial_ends_at ? new Date(account.trial_ends_at).toLocaleDateString() : 'No trial'}
                  </span>
                </div>

                {stripeDashboardUrl && (
                  <a
                    href={stripeDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View in Stripe Dashboard
                  </a>
                )}

                {account.stripe_customer_id && (
                  <button
                    onClick={getStripePortalUrl}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Customer Portal
                  </button>
                )}
              </div>
            </div>

            {/* Trial Extension */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Extend Trial</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Add Days to Trial
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    placeholder="Enter number of days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleExtendTrial}
                  disabled={!extendDays || extending}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {extending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extending...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      Extend Trial
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500">
                  Current trial end: {account.trial_ends_at ? new Date(account.trial_ends_at).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Venues */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Venues</h3>
                  <button
                    onClick={() => navigate(`/admin/accounts/${accountId}/venues/new`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Venue
                  </button>
                </div>
              </div>

              {/* Demo Data Population Section */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Demo Data Population</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => showDemoDataPicker('feedback')}
                    disabled={seedingDemoData}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    title="Populate feedback sessions and responses with random staff resolution"
                  >
                    {seedingDemoData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Feedback
                  </button>

                  <button
                    onClick={() => showDemoDataPicker('reviews')}
                    disabled={seedingDemoData}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    title="Populate Google & TripAdvisor rating scores"
                  >
                    {seedingDemoData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Reviews
                  </button>

                  <button
                    onClick={() => showDemoDataPicker('nps')}
                    disabled={seedingDemoData}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    title="Populate NPS email submissions"
                  >
                    {seedingDemoData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    NPS
                  </button>

                  <button
                    onClick={() => showDemoDataPicker('all')}
                    disabled={seedingDemoData}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                    title="Populate all demo data types at once"
                  >
                    {seedingDemoData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    All Data
                  </button>
                </div>
              </div>

              {venues.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Venue Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tables
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {venues.map((venue) => (
                        <tr key={venue.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{venue.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {venue.address ? (
                                <>
                                  {venue.address.line1 && <div>{venue.address.line1}</div>}
                                  {venue.address.line2 && <div>{venue.address.line2}</div>}
                                  {venue.address.city && <div>{venue.address.city}{venue.address.postcode && `, ${venue.address.postcode}`}</div>}
                                </>
                              ) : (
                                <span className="text-gray-400">No address</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {venue.table_count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(venue.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-50 rounded-2xl w-fit mx-auto mb-4">
                    <Building2 className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No venues yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create the first venue for this account
                  </p>
                  <button
                    onClick={() => navigate(`/admin/accounts/${accountId}/venues/new`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Venue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Picker Modal for Demo Data */}
      {showDateRangePicker && dateRangeForAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Populate Demo {dateRangeForAccount.dataType === 'all' ? 'All Data' :
                  dateRangeForAccount.dataType === 'feedback' ? 'Feedback' :
                  dateRangeForAccount.dataType === 'reviews' ? 'Reviews' : 'NPS'}
              </h3>
              <button
                onClick={closeDateRangePicker}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select date range for {dateRangeForAccount.accountName}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={selectedDateRange.startDate}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={selectedDateRange.endDate}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className={`p-3 rounded-lg ${
                dateRangeForAccount.dataType === 'feedback' ? 'bg-blue-50' :
                dateRangeForAccount.dataType === 'reviews' ? 'bg-orange-50' :
                dateRangeForAccount.dataType === 'nps' ? 'bg-green-50' : 'bg-purple-50'
              }`}>
                <p className="text-sm text-gray-700">
                  {dateRangeForAccount.dataType === 'feedback' && (
                    <>This will create feedback sessions and responses for each day in the range. Older feedback will be randomly resolved by staff members.</>
                  )}
                  {dateRangeForAccount.dataType === 'reviews' && (
                    <>This will create Google and TripAdvisor rating scores (1-5 stars only, no review text) for each day in the range.</>
                  )}
                  {dateRangeForAccount.dataType === 'nps' && (
                    <>This will create NPS submissions for each day in the range.</>
                  )}
                  {dateRangeForAccount.dataType === 'all' && (
                    <>This will create feedback, reviews, and NPS data for each day in the range.</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeDateRangePicker}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={populateDemoData}
                disabled={!selectedDateRange.startDate || !selectedDateRange.endDate || seedingDemoData}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  dateRangeForAccount.dataType === 'feedback' ? 'bg-blue-600 hover:bg-blue-700' :
                  dateRangeForAccount.dataType === 'reviews' ? 'bg-orange-600 hover:bg-orange-700' :
                  dateRangeForAccount.dataType === 'nps' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {seedingDemoData ? 'Populating...' : 'Populate Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountDetail;
