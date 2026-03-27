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
  MessageSquare,
  Star,
  Database
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
  const [trialEndDate, setTrialEndDate] = useState('');
  const [trialExtendMode, setTrialExtendMode] = useState('days'); // 'days' or 'date'
  const [extending, setExtending] = useState(false);
  const [showFeedbackDemoPicker, setShowFeedbackDemoPicker] = useState(false);
  const [feedbackDemoDateRange, setFeedbackDemoDateRange] = useState({ startDate: '', endDate: '' });
  const [seedingFeedbackDemo, setSeedingFeedbackDemo] = useState(false);
  const [showRatingsDemoPicker, setShowRatingsDemoPicker] = useState(false);
  const [ratingsDemoDateRange, setRatingsDemoDateRange] = useState({ startDate: '', endDate: '' });
  const [seedingRatingsDemo, setSeedingRatingsDemo] = useState(false);
  const [showDemoTools, setShowDemoTools] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  // Full demo data state
  const [showFullDemoPicker, setShowFullDemoPicker] = useState(false);
  const [fullDemoConfig, setFullDemoConfig] = useState({ days: 60, clearExisting: false });
  const [seedingFullDemo, setSeedingFullDemo] = useState(false);

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

      // Get venue IDs for this account
      const venueIds = venuesData?.map(v => v.id) || [];

      // Load actual table counts from table_positions (excluding soft-deleted)
      let tableCounts = {};
      if (venueIds.length > 0) {
        const { data: tablePositionsData } = await supabase
          .from('table_positions')
          .select('venue_id')
          .in('venue_id', venueIds)
          .is('deleted_at', null);

        tableCounts = (tablePositionsData || []).reduce((acc, item) => {
          acc[item.venue_id] = (acc[item.venue_id] || 0) + 1;
          return acc;
        }, {});
      }

      // Add actual table counts to venues
      const venuesWithTableCounts = venuesData?.map(venue => ({
        ...venue,
        actual_table_count: tableCounts[venue.id] || 0
      })) || [];

      setVenues(venuesWithTableCounts);

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
    let newTrialEnd;

    if (trialExtendMode === 'days') {
      if (!extendDays || parseInt(extendDays) <= 0) {
        toast.error('Please enter a valid number of days');
        return;
      }
      // Calculate new trial end date from current trial end
      const currentTrialEnd = account.trial_ends_at ? new Date(account.trial_ends_at) : new Date();
      newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + parseInt(extendDays));
    } else {
      if (!trialEndDate) {
        toast.error('Please select a date');
        return;
      }
      newTrialEnd = new Date(trialEndDate);
      // Set to end of day
      newTrialEnd.setHours(23, 59, 59, 999);
    }

    setExtending(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          trial_ends_at: newTrialEnd.toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;

      setAccount({ ...account, trial_ends_at: newTrialEnd.toISOString() });
      setExtendDays('');
      setTrialEndDate('');

      if (trialExtendMode === 'days') {
        toast.success(`Trial extended by ${extendDays} days!`);
      } else {
        toast.success(`Trial end date set to ${newTrialEnd.toLocaleDateString()}`);
      }
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

  const openFeedbackDemoPicker = () => {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);

    setFeedbackDemoDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    setShowFeedbackDemoPicker(true);
  };

  const closeFeedbackDemoPicker = () => {
    setShowFeedbackDemoPicker(false);
    setFeedbackDemoDateRange({ startDate: '', endDate: '' });
  };

  const populateFeedbackDemoData = async () => {
    if (!feedbackDemoDateRange.startDate || !feedbackDemoDateRange.endDate) {
      toast.error('Please select a valid date range');
      return;
    }

    const dayCount = Math.ceil((new Date(feedbackDemoDateRange.endDate) - new Date(feedbackDemoDateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1;

    if (dayCount > 30) {
      toast.error(`Date range too large (${dayCount} days). Maximum 30 days.`);
      return;
    }

    if (!window.confirm(
      `Populate high-quality feedback demo data for "${account.name}"?\n\n` +
      `Date Range: ${feedbackDemoDateRange.startDate} to ${feedbackDemoDateRange.endDate} (${dayCount} days)\n\n` +
      `Per venue, per day:\n` +
      `• 45-50 feedback sessions (~180-200 feedback items)\n` +
      `• 5-10 assistance requests\n` +
      `• ~95% completion rate\n` +
      `• 7-10 min avg resolution time\n` +
      `• 4.0-4.5 avg satisfaction score\n\n` +
      `⚠️ Existing data in this date range will be REPLACED.\n` +
      `Processing: ~2-3 seconds per day`
    )) {
      return;
    }

    setSeedingFeedbackDemo(true);
    setShowFeedbackDemoPicker(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = '/api/admin/seed-demo-feedback';

      // Generate array of dates to process
      const allDates = [];
      const startDate = new Date(feedbackDemoDateRange.startDate);
      const endDate = new Date(feedbackDemoDateRange.endDate);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        allDates.push(new Date(d).toISOString().split('T')[0]);
      }

      // Split dates into chunks of 5 for batch processing
      const chunks = [];
      for (let i = 0; i < allDates.length; i += 5) {
        chunks.push(allDates.slice(i, i + 5));
      }

      const totalStats = {
        feedbackCreated: 0,
        assistanceCreated: 0,
        daysProcessed: 0
      };

      let failedChunks = [];

      // Process in chunks of 5 days
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkStart = i * 5 + 1;
        const chunkEnd = Math.min((i + 1) * 5, allDates.length);

        const progressToast = toast.loading(
          `Processing days ${chunkStart}-${chunkEnd} of ${allDates.length}...`,
          { duration: Infinity }
        );

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              accountId: account.id,
              dates: chunk
            })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'API request failed');
          }

          totalStats.feedbackCreated += result.stats.feedbackCreated || 0;
          totalStats.assistanceCreated += result.stats.assistanceCreated || 0;
          totalStats.daysProcessed += result.stats.daysProcessed || chunk.length;

          toast.dismiss(progressToast);
          toast.success(`Days ${chunkStart}-${chunkEnd} done`, { duration: 1500 });

        } catch (chunkError) {
          console.error(`Chunk ${i + 1} failed:`, chunkError);
          failedChunks.push({ dates: chunk.join(', '), error: chunkError.message });
          toast.dismiss(progressToast);
          toast.error(`Days ${chunkStart}-${chunkEnd} failed`, { duration: 2000 });
        }

        // Short delay between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      const failedDays = failedChunks;

      // Final summary
      if (failedDays.length > 0) {
        toast.error(
          `Completed with ${failedDays.length} failed days.\n${totalStats.feedbackCreated} feedback, ${totalStats.assistanceCreated} assistance requests`,
          { duration: 8000 }
        );
      } else {
        toast.success(
          `Demo data created!\n${totalStats.feedbackCreated} feedback items, ${totalStats.assistanceCreated} assistance requests`,
          { duration: 6000 }
        );
      }

      closeFeedbackDemoPicker();

    } catch (error) {
      console.error('Error populating feedback demo data:', error);
      toast.error('Failed to populate demo data: ' + error.message);
    } finally {
      setSeedingFeedbackDemo(false);
    }
  };

  const openRatingsDemoPicker = () => {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);

    setRatingsDemoDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    setShowRatingsDemoPicker(true);
  };

  const closeRatingsDemoPicker = () => {
    setShowRatingsDemoPicker(false);
    setRatingsDemoDateRange({ startDate: '', endDate: '' });
  };

  const populateRatingsDemoData = async () => {
    if (!ratingsDemoDateRange.startDate || !ratingsDemoDateRange.endDate) {
      toast.error('Please select a valid date range');
      return;
    }

    const dayCount = Math.ceil((new Date(ratingsDemoDateRange.endDate) - new Date(ratingsDemoDateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1;

    if (dayCount > 60) {
      toast.error(`Date range too large (${dayCount} days). Maximum 60 days.`);
      return;
    }

    if (!window.confirm(
      `Populate Google & TripAdvisor ratings demo for "${account.name}"?\n\n` +
      `Date Range: ${ratingsDemoDateRange.startDate} to ${ratingsDemoDateRange.endDate} (${dayCount} days)\n\n` +
      `This will create:\n` +
      `• Daily Google ratings with upward trend (~3.7 → ~4.5)\n` +
      `• Daily TripAdvisor ratings with upward trend (~3.6 → ~4.4)\n` +
      `• Historical rating snapshots for each day\n` +
      `• Updated current external_ratings values\n\n` +
      `⚠️ Existing ratings data in this date range will be REPLACED.`
    )) {
      return;
    }

    setSeedingRatingsDemo(true);
    setShowRatingsDemoPicker(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = '/api/admin/seed-demo-ratings';

      const progressToast = toast.loading(
        `Processing ${dayCount} days of ratings data...`,
        { duration: Infinity }
      );

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          accountId: account.id,
          startDate: ratingsDemoDateRange.startDate,
          endDate: ratingsDemoDateRange.endDate
        })
      });

      const result = await response.json();

      toast.dismiss(progressToast);

      if (!response.ok) {
        throw new Error(result.error || 'API request failed');
      }

      // Show results per venue
      const venueDetails = result.stats.venueResults
        .map(v => `${v.name}: Google ${v.googleStart}→${v.googleEnd}, TripAdvisor ${v.tripStart}→${v.tripEnd}`)
        .join('\n');

      toast.success(
        `Ratings data created!\n${result.stats.historicalRecordsCreated} historical records\n${result.stats.venuesProcessed} venues, ${result.stats.daysProcessed} days`,
        { duration: 6000 }
      );

      console.log('Ratings demo results:', result.stats);

      closeRatingsDemoPicker();

    } catch (error) {
      console.error('Error populating ratings demo data:', error);
      toast.error('Failed to populate ratings data: ' + error.message);
    } finally {
      setSeedingRatingsDemo(false);
    }
  };

  const populateFullDemoData = async () => {
    if (fullDemoConfig.days < 7 || fullDemoConfig.days > 90) {
      toast.error('Please enter a number between 7 and 90');
      return;
    }

    if (!window.confirm(
      `Generate full demo data for "${account.name}"?\n\n` +
      `Days: ${fullDemoConfig.days}\n` +
      `Clear existing: ${fullDemoConfig.clearExisting ? 'Yes' : 'No'}\n\n` +
      `This will generate:\n` +
      `• Feedback with resolutions & co-resolvers\n` +
      `• NPS submissions (linked + standalone)\n` +
      `• Tag responses for low ratings\n` +
      `• Assistance requests\n\n` +
      `Using existing employees & questions from the account.\n\n` +
      `This may take 1-2 minutes.`
    )) {
      return;
    }

    setSeedingFullDemo(true);
    setShowFullDemoPicker(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = '/api/admin/generate-demo-data';

      const progressToast = toast.loading(
        `Generating ${fullDemoConfig.days} days of demo data...`,
        { duration: Infinity }
      );

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          accountId: account.id,
          days: fullDemoConfig.days,
          clearExisting: fullDemoConfig.clearExisting
        })
      });

      const result = await response.json();

      toast.dismiss(progressToast);

      if (!response.ok) {
        throw new Error(result.error || 'API request failed');
      }

      toast.success(
        `Demo data created!\n` +
        `${result.summary.feedbackRecords.toLocaleString()} feedback, ` +
        `${result.summary.npsSubmissions.toLocaleString()} NPS (score: ${result.summary.npsScore}), ` +
        `${result.summary.tagResponses.toLocaleString()} tags`,
        { duration: 6000 }
      );

      console.log('Full demo results:', result.summary);

    } catch (error) {
      console.error('Error populating full demo data:', error);
      toast.error('Failed to generate demo data: ' + error.message);
    } finally {
      setSeedingFullDemo(false);
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

      <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-8">
        {/* Tabbed Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('venues')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'venues'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Venues ({venues.length})
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'billing'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Billing
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tools'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tools
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Master User</h3>
                  {account.masterUser ? (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {account.masterUser.first_name?.[0]}{account.masterUser.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.masterUser.first_name} {account.masterUser.last_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4" />
                          {account.masterUser.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No master user assigned</p>
                  )}
                </div>
              </div>
            )}

            {/* Venues Tab */}
            {activeTab === 'venues' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Venues</h3>
                  <button
                    onClick={() => navigate(`/admin/accounts/${accountId}/venues/new`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Venue
                  </button>
                </div>

                {venues.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                              {venue.actual_table_count || 0}
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
                  <div className="text-center py-12 border border-gray-200 rounded-lg">
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
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Billing & Stripe</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">Paid Status</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        account.is_paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.is_paid ? 'Paid' : 'Not Paid'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">Trial End</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {account.trial_ends_at ? new Date(account.trial_ends_at).toLocaleDateString() : 'No trial'}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {stripeDashboardUrl && (
                        <a
                          href={stripeDashboardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View in Stripe
                        </a>
                      )}

                      {account.stripe_customer_id && (
                        <button
                          onClick={getStripePortalUrl}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Customer Portal
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trial Extension */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Extend Trial</h3>
                  <div className="max-w-sm space-y-3">
                    {/* Mode Toggle */}
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTrialExtendMode('days')}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                          trialExtendMode === 'days'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Add Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrialExtendMode('date')}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                          trialExtendMode === 'date'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Set End Date
                      </button>
                    </div>

                    {/* Input based on mode */}
                    {trialExtendMode === 'days' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Number of Days
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
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Trial End Date
                        </label>
                        <input
                          type="date"
                          value={trialEndDate}
                          onChange={(e) => setTrialEndDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleExtendTrial}
                      disabled={(trialExtendMode === 'days' ? !extendDays : !trialEndDate) || extending}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {extending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {trialExtendMode === 'days' ? 'Extending...' : 'Setting...'}
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          {trialExtendMode === 'days' ? 'Extend Trial' : 'Set Trial End'}
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500">
                      Current trial end: {account.trial_ends_at ? new Date(account.trial_ends_at).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Demo Data Tools</h3>
                  <p className="text-sm text-gray-500 mb-4">Populate realistic demo data for demos and testing</p>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p className="text-sm text-amber-800">
                      <strong>Warning:</strong> These tools will add demo data to the account. Use with caution.
                    </p>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setShowFullDemoPicker(true)}
                      disabled={seedingFullDemo || seedingFeedbackDemo || seedingRatingsDemo}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                      title="Full demo data: feedback, NPS, tags, resolutions - uses existing employees & questions"
                    >
                      {seedingFullDemo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4" />
                          Full Demo
                        </>
                      )}
                    </button>
                    <button
                      onClick={openFeedbackDemoPicker}
                      disabled={seedingFeedbackDemo || seedingRatingsDemo || seedingFullDemo}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                      title="High-quality feedback & assistance data (45-50 sessions/day, 95% resolution)"
                    >
                      {seedingFeedbackDemo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Feedback Demo
                        </>
                      )}
                    </button>
                    <button
                      onClick={openRatingsDemoPicker}
                      disabled={seedingRatingsDemo || seedingFeedbackDemo || seedingFullDemo}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                      title="Google & TripAdvisor ratings with upward trend"
                    >
                      {seedingRatingsDemo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Ratings Demo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Demo Data Date Picker Modal */}
      {showFeedbackDemoPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Feedback Demo Data
              </h3>
              <button
                onClick={closeFeedbackDemoPicker}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select date range for {account?.name} (max 30 days)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={feedbackDemoDateRange.startDate}
                  onChange={(e) => setFeedbackDemoDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={feedbackDemoDateRange.endDate}
                  onChange={(e) => setFeedbackDemoDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-sm text-gray-700 font-medium mb-2">Per venue, per day:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 45-50 feedback sessions (~180 items)</li>
                  <li>• 5-10 assistance requests</li>
                  <li>• ~95% completion rate</li>
                  <li>• 7-10 min avg resolution time</li>
                  <li>• 4.0-4.5 avg satisfaction score</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Note:</strong> Existing data in selected range will be replaced.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeFeedbackDemoPicker}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={populateFeedbackDemoData}
                disabled={!feedbackDemoDateRange.startDate || !feedbackDemoDateRange.endDate || seedingFeedbackDemo}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seedingFeedbackDemo ? 'Populating...' : 'Populate Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ratings Demo Data Date Picker Modal */}
      {showRatingsDemoPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ratings Demo Data
              </h3>
              <button
                onClick={closeRatingsDemoPicker}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select date range for {account?.name} (max 60 days)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={ratingsDemoDateRange.startDate}
                  onChange={(e) => setRatingsDemoDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={ratingsDemoDateRange.endDate}
                  onChange={(e) => setRatingsDemoDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="p-3 rounded-lg bg-orange-50">
                <p className="text-sm text-gray-700 font-medium mb-2">Per venue:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Google rating: ~3.7 → ~4.5 (upward trend)</li>
                  <li>• TripAdvisor rating: ~3.6 → ~4.4 (upward trend)</li>
                  <li>• Daily rating snapshots with small variations</li>
                  <li>• Review count growth over time</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Note:</strong> Existing ratings in selected range will be replaced.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeRatingsDemoPicker}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={populateRatingsDemoData}
                disabled={!ratingsDemoDateRange.startDate || !ratingsDemoDateRange.endDate || seedingRatingsDemo}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seedingRatingsDemo ? 'Populating...' : 'Populate Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Demo Data Modal */}
      {showFullDemoPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Full Demo Data
              </h3>
              <button
                onClick={() => setShowFullDemoPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Generate comprehensive demo data for {account?.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Days
                </label>
                <input
                  type="number"
                  min="7"
                  max="90"
                  value={fullDemoConfig.days}
                  onChange={(e) => setFullDemoConfig(prev => ({ ...prev, days: parseInt(e.target.value) || 60 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Historical data range (7-90 days)</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clearExisting"
                  checked={fullDemoConfig.clearExisting}
                  onChange={(e) => setFullDemoConfig(prev => ({ ...prev, clearExisting: e.target.checked }))}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="clearExisting" className="text-sm text-gray-700">
                  Clear existing demo data first
                </label>
              </div>

              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-sm text-gray-700 font-medium mb-2">Per venue, this generates:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 35-70 feedback items per day</li>
                  <li>• NPS submissions (linked + standalone)</li>
                  <li>• Tag responses for low ratings</li>
                  <li>• Resolution data with co-resolvers</li>
                  <li>• Assistance requests</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Uses existing employees & questions from the account.</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFullDemoPicker(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={populateFullDemoData}
                disabled={seedingFullDemo}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seedingFullDemo ? 'Generating...' : 'Generate Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountDetail;
