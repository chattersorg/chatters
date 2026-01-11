import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import usePageTitle from '../../../hooks/usePageTitle';
import PageContainer from '../../../components/dashboard/layout/PageContainer';
import toast from 'react-hot-toast';
import {
  Puzzle,
  Check,
  Star,
  MessageSquare,
  Loader2,
  AlertCircle,
  Crown,
  Building2,
  ChevronRight,
  Settings
} from 'lucide-react';

// Module icons mapping
const MODULE_ICONS = {
  feedback: MessageSquare,
  nps: Star,
};

const FeatureManagement = () => {
  usePageTitle('Feature Management');
  const navigate = useNavigate();
  const { userRole, accountId, enabledModules, isLegacyPricing } = useVenue();

  const [modules, setModules] = useState([]);
  const [accountModules, setAccountModules] = useState([]);
  const [venueCount, setVenueCount] = useState(0);
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (userRole !== 'master') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [userRole, navigate, accountId]);

  const fetchData = async () => {
    if (!accountId) {
      console.log('FeatureManagement: No accountId yet, waiting...');
      return;
    }

    try {
      setLoading(true);
      console.log('FeatureManagement: Fetching data for accountId:', accountId);

      // Fetch all available modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('display_order');

      if (modulesError) throw modulesError;

      // Fetch account's enabled modules
      const { data: accountModulesData, error: accountModulesError } = await supabase
        .from('account_modules')
        .select('*')
        .eq('account_id', accountId);

      if (accountModulesError) throw accountModulesError;

      // Fetch venue count for pricing calculations
      const { count: venueCountData, error: venueError } = await supabase
        .from('venues')
        .select('id', { count: 'exact' })
        .eq('account_id', accountId);

      console.log('FeatureManagement: Venue count result:', venueCountData, 'error:', venueError);

      if (venueError) throw venueError;

      // Fetch account data (trial status, etc.)
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('trial_ends_at, is_paid, is_legacy_pricing')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      setModules(modulesData || []);
      setAccountModules(accountModulesData || []);
      setVenueCount(venueCountData || 1);
      setAccountData(account);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load feature data');
    } finally {
      setLoading(false);
    }
  };

  // Check if a module is currently enabled for the account
  const isModuleEnabled = (moduleCode) => {
    const accountModule = accountModules.find(am => am.module_code === moduleCode);
    if (!accountModule) return false;

    // Check if disabled_at is set and in the past
    if (accountModule.disabled_at) {
      return new Date(accountModule.disabled_at) > new Date();
    }
    return true;
  };

  // Check if module is scheduled to be disabled
  const isModuleScheduledForDisable = (moduleCode) => {
    const accountModule = accountModules.find(am => am.module_code === moduleCode);
    if (!accountModule) return false;

    if (accountModule.disabled_at) {
      return new Date(accountModule.disabled_at) > new Date();
    }
    return false;
  };

  // Get disabled_at date for a module
  const getDisabledAt = (moduleCode) => {
    const accountModule = accountModules.find(am => am.module_code === moduleCode);
    return accountModule?.disabled_at;
  };

  // Calculate price display
  const formatPrice = (pence) => {
    return `£${(pence / 100).toFixed(0)}`;
  };

  // Calculate monthly equivalent for yearly price
  const getMonthlyEquivalent = (yearlyPence) => {
    return Math.round(yearlyPence / 12);
  };

  // Handle enabling a module via API
  const handleEnableModule = async (moduleCode) => {
    setActionLoading(moduleCode);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/modules/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ moduleCode })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to enable module');
      }

      toast.success(`${moduleCode.toUpperCase()} module enabled`);
      fetchData(); // Refresh data

      // Trigger a page reload to update VenueContext
      window.location.reload();
    } catch (error) {
      console.error('Error enabling module:', error);
      toast.error(error.message || 'Failed to enable module');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle disabling a module via API (schedules for end of period)
  const handleDisableModule = async (moduleCode) => {
    setActionLoading(moduleCode);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/modules/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ moduleCode })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to disable module');
      }

      toast.success(result.message || `${moduleCode.toUpperCase()} module will be disabled`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error disabling module:', error);
      toast.error(error.message || 'Failed to disable module');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate trial days remaining
  const getTrialDaysRemaining = () => {
    if (!accountData?.trial_ends_at) return null;
    const now = new Date();
    const trialEnd = new Date(accountData.trial_ends_at);
    const days = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Calculate current total based on enabled modules
  const calculateTotal = (includeModule = null) => {
    const isYearly = accountData?.billing_period === 'yearly';
    let total = 0;

    modules.forEach(module => {
      const isEnabled = isModuleEnabled(module.code) || module.code === includeModule;
      if (isEnabled) {
        total += isYearly ? getMonthlyEquivalent(module.price_yearly_pence) : module.price_monthly_pence;
      }
    });

    return total * venueCount;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </PageContainer>
    );
  }

  const trialDays = getTrialDaysRemaining();
  const isOnTrial = trialDays !== null && trialDays > 0 && !accountData?.is_paid;

  return (
    <PageContainer>
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Settings className="w-4 h-4" />
          <span>Administration</span>
          <ChevronRight className="w-4 h-4" />
          <span>Features</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account's modules and features
          </p>
        </div>

        {/* Legacy Pricing Banner */}
        {isLegacyPricing && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Legacy Plan</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your account is on a legacy plan with full access to all features at your original pricing.
                  This includes Feedback and NPS modules.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trial Banner */}
        {isOnTrial && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Trial - {trialDays} day{trialDays !== 1 ? 's' : ''} remaining
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  When your trial ends, you'll be billed for your enabled modules.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Venue Count Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{venueCount}</span> venue{venueCount !== 1 ? 's' : ''} on this account
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
            Module pricing is per venue per month
          </p>
        </div>

        {/* Modules List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Modules</h2>
          </div>

          {modules.length === 0 ? (
            <div className="p-8 text-center">
              <Puzzle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No modules available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Contact support if you believe this is an error</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {modules.map((module) => {
                const Icon = MODULE_ICONS[module.code] || Puzzle;
                const enabled = isModuleEnabled(module.code);
                const scheduledDisable = isModuleScheduledForDisable(module.code);
                const disabledAt = getDisabledAt(module.code);
                const isYearly = accountData?.billing_period === 'yearly';
                const pricePerVenue = isYearly
                  ? getMonthlyEquivalent(module.price_yearly_pence)
                  : module.price_monthly_pence;
                const totalPrice = pricePerVenue * venueCount;
                const isActionLoading = actionLoading === module.code;

                return (
                  <div
                    key={module.id}
                    className={`px-6 py-5 transition-colors ${
                      enabled
                        ? 'bg-green-50/50 dark:bg-green-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          enabled
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            enabled
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {module.name}
                            </h3>
                            {module.is_core && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                Core
                              </span>
                            )}
                            {enabled && !scheduledDisable && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Active
                              </span>
                            )}
                            {scheduledDisable && disabledAt && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                                Ends {new Date(disabledAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {module.description}
                          </p>
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatPrice(pricePerVenue)}/venue/mo
                            </span>
                            {venueCount > 1 && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2">
                                ({venueCount} venues = {formatPrice(totalPrice)}/mo)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0 sm:ml-4">
                        {isLegacyPricing ? (
                          <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Crown className="w-4 h-4 mr-1.5" />
                            Included
                          </span>
                        ) : module.is_core ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">Required</span>
                        ) : scheduledDisable && disabledAt ? (
                          <button
                            onClick={() => handleEnableModule(module.code)}
                            disabled={isActionLoading}
                            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Keep Active'
                            )}
                          </button>
                        ) : enabled ? (
                          <button
                            onClick={() => handleDisableModule(module.code)}
                            disabled={isActionLoading}
                            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Disable'
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnableModule(module.code)}
                            disabled={isActionLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Enable'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Billing Total - Simplified */}
        {!isLegacyPricing && modules.filter(m => isModuleEnabled(m.code)).length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Monthly total ({venueCount} venue{venueCount !== 1 ? 's' : ''})
              </span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {formatPrice(calculateTotal())}/mo
              </span>
            </div>
            {accountData?.billing_period === 'yearly' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                Billed annually at {formatPrice(calculateTotal() * 12)}/yr
              </p>
            )}
          </div>
        )}

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Questions about features? Contact us at{' '}
          <a href="mailto:support@getchatters.com" className="text-blue-600 dark:text-blue-400 hover:underline">
            support@getchatters.com
          </a>
        </p>
      </div>
    </PageContainer>
  );
};

export default FeatureManagement;
