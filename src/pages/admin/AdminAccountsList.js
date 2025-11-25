import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import { supabase } from '../../utils/supabase';
import {
  Search,
  Settings,
  Building2,
  Users,
  RefreshCw,
  Plus,
  X,
  ChevronRight,
  CreditCard,
  Calendar,
  ExternalLink,
  Clock,
  Loader2,
  LogOut,
  MessageSquare,
  Star,
  TrendingUp
} from 'lucide-react';

const AdminAccountsList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mrrData, setMrrData] = useState({ mrrByAccount: {}, totalMRR: 0, loading: true });
  const [stats, setStats] = useState({
    totalAccounts: 0,
    paidAccounts: 0,
    trialAccounts: 0,
    expiredAccounts: 0,
    totalVenues: 0,
    totalFeedback: 0,
    loading: true
  });

  useEffect(() => {
    loadAccounts();
    loadMRRData();
  }, []);

  const loadMRRData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin-get-mrr', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMrrData({
          mrrByAccount: data.mrrByAccount || {},
          totalMRR: data.totalMRR || 0,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error loading MRR data:', error);
      setMrrData(prev => ({ ...prev, loading: false }));
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);

      // Load accounts with master user and venue count
      const { data: accountsData, error: accountsError} = await supabase
        .from('accounts')
        .select(`
          *,
          users(id, email, first_name, last_name, role),
          venues(id, name, table_count)
        `)
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;

      // Get all venue IDs for feedback counts
      const allVenueIds = accountsData?.flatMap(a => a.venues?.map(v => v.id) || []) || [];

      // Load feedback counts per venue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let feedbackCounts = {};
      if (allVenueIds.length > 0) {
        const { data: feedbackData } = await supabase
          .from('feedback')
          .select('venue_id')
          .in('venue_id', allVenueIds)
          .gte('created_at', thirtyDaysAgo.toISOString());

        feedbackCounts = (feedbackData || []).reduce((acc, item) => {
          acc[item.venue_id] = (acc[item.venue_id] || 0) + 1;
          return acc;
        }, {});
      }

      // Process accounts to include venue count and feedback
      const processedAccounts = accountsData?.map(account => {
        // Find master user - prefer ones with complete profile (first_name and last_name)
        const masterUsers = account.users?.filter(u => u.role === 'master') || [];
        const masterUser = masterUsers.find(u => u.first_name && u.last_name) || masterUsers[0] || account.users?.[0];

        // Calculate total feedback for this account
        const accountFeedback = account.venues?.reduce((sum, v) => sum + (feedbackCounts[v.id] || 0), 0) || 0;

        // Calculate total tables
        const totalTables = account.venues?.reduce((sum, v) => sum + (v.table_count || 0), 0) || 0;

        const venueCount = account.venues?.length || 0;

        return {
          ...account,
          venueCount,
          totalTables,
          feedbackCount: accountFeedback,
          masterUser
        };
      }) || [];

      setAccounts(processedAccounts);

      // Calculate statistics
      const now = new Date();
      const paidCount = processedAccounts.filter(a => a.is_paid).length;
      const trialCount = processedAccounts.filter(a =>
        !a.is_paid && a.trial_ends_at && new Date(a.trial_ends_at) > now
      ).length;
      const expiredCount = processedAccounts.filter(a =>
        !a.is_paid && (!a.trial_ends_at || new Date(a.trial_ends_at) <= now)
      ).length;
      const totalVenueCount = processedAccounts.reduce((sum, a) => sum + a.venueCount, 0);
      const totalFeedbackCount = processedAccounts.reduce((sum, a) => sum + a.feedbackCount, 0);

      setStats({
        totalAccounts: processedAccounts.length,
        paidAccounts: paidCount,
        trialAccounts: trialCount,
        expiredAccounts: expiredCount,
        totalVenues: totalVenueCount,
        totalFeedback: totalFeedbackCount,
        loading: false
      });

    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const getAccountStatus = (account) => {
    const now = new Date();

    if (account.is_paid) {
      return {
        status: 'paid',
        color: 'green',
        label: 'Paid',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      };
    }

    if (account.trial_ends_at && new Date(account.trial_ends_at) > now) {
      return {
        status: 'trial',
        color: 'blue',
        label: 'Trial',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      };
    }

    return {
      status: 'expired',
      color: 'red',
      label: 'Expired',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    };
  };

  const filteredAccounts = accounts.filter(account => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    return (
      account.name?.toLowerCase().includes(search) ||
      account.masterUser?.email?.toLowerCase().includes(search) ||
      account.masterUser?.first_name?.toLowerCase().includes(search) ||
      account.masterUser?.last_name?.toLowerCase().includes(search)
    );
  });

  const getStripeCustomerUrl = (stripeCustomerId) => {
    if (!stripeCustomerId) return null;
    const isLive = !stripeCustomerId.startsWith('cus_test_');
    const mode = isLive ? '' : 'test/';
    return `https://dashboard.stripe.com/${mode}customers/${stripeCustomerId}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();

    // Get ordinal suffix (st, nd, rd, th)
    const suffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${suffix(day)} ${month} ${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Admin Center - Chatters</title>
      </Helmet>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Settings className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Admin Center
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage accounts, users, and billing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { loadAccounts(); loadMRRData(); }}
                disabled={loading || mrrData.loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading || mrrData.loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/admin/create')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Account
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        {/* Statistics Cards - More Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-gray-500 uppercase">Accounts</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalAccounts}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-green-600" />
              <p className="text-xs font-medium text-gray-500 uppercase">Paid</p>
            </div>
            <p className="text-2xl font-semibold text-green-600">{stats.paidAccounts}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-gray-500 uppercase">Trial</p>
            </div>
            <p className="text-2xl font-semibold text-blue-600">{stats.trialAccounts}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <X className="h-4 w-4 text-red-600" />
              <p className="text-xs font-medium text-gray-500 uppercase">Expired</p>
            </div>
            <p className="text-2xl font-semibold text-red-600">{stats.expiredAccounts}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-medium text-gray-500 uppercase">Venues</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalVenues}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <p className="text-xs font-medium text-gray-500 uppercase">Feedback (30d)</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalFeedback}</p>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-green-50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs font-medium text-green-700 uppercase">MRR</p>
            </div>
            {mrrData.loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                <span className="text-sm text-green-600">Loading...</span>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-green-700">£{mrrData.totalMRR.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-xl mb-6">
          <div className="p-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search accounts by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{filteredAccounts.length}</span> of <span className="font-medium text-gray-900">{accounts.length}</span> accounts
              </p>
            </div>
          </div>
        </div>

        {/* Accounts Table - More Compact */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Master User
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venues
                  </th>
                  <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tables
                  </th>
                  <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial/Billing
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRR
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stripe
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">

                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => {
                  const status = getAccountStatus(account);
                  const stripeUrl = getStripeCustomerUrl(account.stripe_customer_id);

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/accounts/${account.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {account.name || 'Unnamed'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {account.masterUser ? (
                            <>
                              <div className="font-medium">
                                {account.masterUser.first_name} {account.masterUser.last_name}
                              </div>
                              <div className="text-gray-500 truncate max-w-[150px]" title={account.masterUser.email}>
                                {account.masterUser.email}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${status.bgColor} ${status.textColor} ${status.borderColor}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {account.venueCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {account.totalTables}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`text-sm ${account.feedbackCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {account.feedbackCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                        {account.is_paid && account.subscription_period_end ? (
                          formatDate(account.subscription_period_end)
                        ) : account.trial_ends_at ? (
                          formatDate(account.trial_ends_at)
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {mrrData.loading ? (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400 inline" />
                        ) : mrrData.mrrByAccount[account.id] > 0 ? (
                          <span className="text-sm font-medium text-green-600">
                            £{mrrData.mrrByAccount[account.id].toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(account.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {stripeUrl ? (
                          <a
                            href={stripeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 rounded-2xl w-fit mx-auto mb-4">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No accounts found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first account to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminAccountsList;
