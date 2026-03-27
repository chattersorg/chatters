import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { PermissionGate } from '../../../context/PermissionsContext';
import toast from 'react-hot-toast';
import { Calendar, AlertCircle, Crown, Puzzle, ChevronRight } from 'lucide-react';
import StripeCheckoutModal from './StripeCheckoutModal';
import SubscriptionManagement from './SubscriptionManagement';
import { Button } from '../../ui/button';

// Legacy pricing (grandfathered accounts)
const LEGACY_PRICE_PER_VENUE_MONTHLY = 149; // £149 per venue per month
const LEGACY_PRICE_PER_VENUE_YEARLY = 1430; // £1,430 per venue per year

// New module-based pricing
const MODULE_PRICING = {
  feedback: { monthly: 99, yearly: 1008 },  // £99/mo or £1,008/yr per venue
  nps: { monthly: 49, yearly: 492 },        // £49/mo or £492/yr per venue
};

// Module display names
const MODULE_NAMES = {
  feedback: 'Feedback',
  nps: 'NPS',
};

const BillingTab = ({ allowExpiredAccess = false }) => {
  const navigate = useNavigate();
  const { userRole } = useVenue();
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [venueCount, setVenueCount] = useState(0);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [isLegacyPricing, setIsLegacyPricing] = useState(false);
  const [enabledModules, setEnabledModules] = useState([]);

  useEffect(() => {
    const fetchBillingInfo = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData?.user?.email;
      const userId = authData?.user?.id;

      if (!email || !userId) return;

      setUserEmail(email);

      // Get user info
      const { data: userRow } = await supabase
        .from('users')
        .select('account_id, role')
        .eq('id', userId)
        .single();

      if (!userRow) return;

      // For managers, get account_id through their venue
      let accountIdToCheck = userRow.account_id;
      if (userRow.role === 'manager' && !accountIdToCheck) {
        const { data: staffRow } = await supabase
          .from('staff')
          .select('venues!inner(account_id)')
          .eq('user_id', userId)
          .limit(1)
          .single();

        accountIdToCheck = staffRow?.venues?.account_id;
      }

      if (accountIdToCheck) {
        // Store account ID for later use
        setAccountId(accountIdToCheck);

        // Get account data including legacy pricing flag
        const { data: account } = await supabase
          .from('accounts')
          .select('trial_ends_at, is_paid, demo_account, stripe_customer_id, stripe_subscription_id, name, account_type, stripe_subscription_status, is_legacy_pricing')
          .eq('id', accountIdToCheck)
          .single();

        // Get venue count for this account
        const { data: venues, count } = await supabase
          .from('venues')
          .select('id, name', { count: 'exact' })
          .eq('account_id', accountIdToCheck);

        setVenueCount(count || 0);

        // Fetch enabled modules for this account
        const { data: accountModules } = await supabase
          .from('account_modules')
          .select('module_code, disabled_at')
          .eq('account_id', accountIdToCheck);

        // Filter out disabled modules
        const now = new Date();
        const activeModules = (accountModules || [])
          .filter(m => !m.disabled_at || new Date(m.disabled_at) > now)
          .map(m => m.module_code);

        // Ensure feedback is always included
        if (!activeModules.includes('feedback')) {
          activeModules.unshift('feedback');
        }

        setEnabledModules(activeModules);
        setIsLegacyPricing(account?.is_legacy_pricing || false);

        if (account) {
          const trialEndDate = new Date(account.trial_ends_at);
          const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

          setAccountData({
            ...account,
            daysLeft,
            isExpired: daysLeft <= 0 && !account.is_paid && !account.demo_account,
            venues: venues || []
          });
        }
      }
    };

    fetchBillingInfo();
  }, []);

  const handleCheckout = async () => {
    setLoading(true);

    const priceId =
      subscriptionType === 'monthly'
        ? process.env.REACT_APP_STRIPE_PRICE_MONTHLY
        : process.env.REACT_APP_STRIPE_PRICE_YEARLY;

    try {
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in again to continue.');
        setLoading(false);
        return;
      }

      // IMPORTANT: Different flow for trial vs expired trial
      const endpoint = !accountData?.isExpired
        ? '/api/setup-payment-method'  // Trial: Just save card, NO CHARGE
        : '/api/create-subscription-intent';  // Expired: Charge immediately

      const body = !accountData?.isExpired
        ? {}  // Setup only needs auth token (backend gets account from token)
        : { priceId };  // Subscription needs pricing (venueCount fetched from DB on backend)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Failed to process payment';
        const errorDetails = data.details ? ` (${data.details})` : '';
        throw new Error(errorMessage + errorDetails);
      }

      if (!data.clientSecret) {
        throw new Error('No client secret returned');
      }

      // Open modal with client secret
      setClientSecret(data.clientSecret);
      setCheckoutModalOpen(true);
      setLoading(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(`Checkout failed: ${error.message}`);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (status = 'succeeded') => {
    // Close modal
    setCheckoutModalOpen(false);
    setClientSecret(null);

    // Show appropriate success message based on status
    if (status === 'setup_succeeded') {
      // Setup mode - card saved, no charge
      toast.success('Payment details saved! You won\'t be charged until your trial ends.');
    } else if (status === 'processing') {
      // Direct Debit payment processing
      toast.success('Direct Debit setup successful! Payment will process within 3-5 business days.');
    } else {
      // Payment succeeded
      toast.success('Payment successful! Your subscription is now active.');
    }

    // Refresh billing info
    window.location.reload();
  };

  const handleCloseModal = () => {
    setCheckoutModalOpen(false);
    setClientSecret(null);
    setLoading(false);
  };

  // Calculate pricing based on venue count and pricing model
  // Legacy accounts use the old single price, new accounts use module-based pricing
  const calculateModuleTotal = (period) => {
    return enabledModules.reduce((total, moduleCode) => {
      const pricing = MODULE_PRICING[moduleCode];
      if (pricing) {
        return total + (period === 'monthly' ? pricing.monthly : pricing.yearly);
      }
      return total;
    }, 0) * venueCount;
  };

  // For legacy pricing or if no modules set yet, use legacy prices
  const monthlySubtotal = isLegacyPricing || enabledModules.length === 0
    ? venueCount * LEGACY_PRICE_PER_VENUE_MONTHLY
    : calculateModuleTotal('monthly');
  const yearlySubtotal = isLegacyPricing || enabledModules.length === 0
    ? venueCount * LEGACY_PRICE_PER_VENUE_YEARLY
    : calculateModuleTotal('yearly');
  const yearlyDiscount = monthlySubtotal > 0
    ? ((monthlySubtotal * 12 - yearlySubtotal) / (monthlySubtotal * 12) * 100).toFixed(0)
    : '20';

  // Show loading state while data is being fetched
  if (!accountData && userRole !== 'admin') {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only masters can access
  if (userRole !== 'master' && !accountData?.isExpired) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Restricted</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Only account owners can view billing information.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Contact your account owner if you need access to billing details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Demo account - show special message and disable billing
  if (accountData?.demo_account) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Demo Account</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This is a demonstration account</p>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This is a demonstration account with full access to all features. Billing is disabled for demo accounts.
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <li>• Unlimited venue access</li>
            <li>• All premium features enabled</li>
            <li>• No billing or payment required</li>
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
            For questions about your demo account, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banners */}
      {accountData?.isExpired && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-800 dark:text-red-300 text-sm">
            <span className="font-medium">Trial expired.</span> Upgrade to continue using Chatters.
          </p>
        </div>
      )}

      {accountData && !accountData.isExpired && accountData.daysLeft !== null && !accountData.is_paid && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
          <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-800 dark:text-yellow-300 text-sm">
            Trial ends in <strong>{accountData.daysLeft}</strong> day{accountData.daysLeft !== 1 ? 's' : ''}. Add payment details for uninterrupted access.
          </p>
        </div>
      )}

      {/* Pricing Plans Card */}
      {!accountData?.is_paid && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {!accountData?.isExpired ? 'Add Payment Details' : 'Choose Your Plan'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {!accountData?.isExpired
                ? `No charge until your trial ends. Cancel anytime before ${new Date(accountData?.trial_ends_at).toLocaleDateString()}.`
                : 'Select a subscription plan to continue using Chatters'
              }
            </p>
          </div>

          <div className="p-6">
            {/* Plan Options */}
            <div className="space-y-3">
              {/* Monthly Plan */}
              <label className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition
                ${subscriptionType === 'monthly' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="monthly"
                    checked={subscriptionType === 'monthly'}
                    onChange={() => setSubscriptionType('monthly')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Monthly</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      £{venueCount > 0 ? Math.round(monthlySubtotal / venueCount) : 0}/venue/mo
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">£{monthlySubtotal.toLocaleString()}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/mo</span>
                </div>
              </label>

              {/* Yearly Plan */}
              <label className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition relative
                ${subscriptionType === 'yearly' ? 'border-green-600 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}>
                <span className="absolute -top-2 left-3 bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                  Save {yearlyDiscount}%
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="yearly"
                    checked={subscriptionType === 'yearly'}
                    onChange={() => setSubscriptionType('yearly')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Yearly</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      £{venueCount > 0 ? Math.round(yearlySubtotal / venueCount).toLocaleString() : 0}/venue/yr
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">£{yearlySubtotal.toLocaleString()}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/yr</span>
                </div>
              </label>
            </div>

            {/* Module breakdown for non-legacy accounts */}
            {!isLegacyPricing && enabledModules.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Includes:</p>
                <div className="space-y-1">
                  {enabledModules.map(moduleCode => (
                    <div key={moduleCode} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{MODULE_NAMES[moduleCode] || moduleCode}</span>
                      <span>
                        £{MODULE_PRICING[moduleCode]?.[subscriptionType === 'monthly' ? 'monthly' : 'yearly'] || 0}/venue/{subscriptionType === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {venueCount} venue{venueCount !== 1 ? 's' : ''} • Tax calculated based on your location • Secured by Stripe
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {!accountData?.isExpired ? 'No charge today' : 'Billed immediately'}
              </div>
              <PermissionGate permission="billing.manage">
                <Button
                  variant="primary"
                  onClick={handleCheckout}
                  loading={loading}
                >
                  {loading ? 'Processing...' : !accountData?.isExpired
                    ? 'Add Payment Details'
                    : `Subscribe - £${subscriptionType === 'monthly' ? monthlySubtotal.toLocaleString() : yearlySubtotal.toLocaleString()}${subscriptionType === 'monthly' ? '/mo' : '/yr'} + tax`
                  }
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>
      )}

      {/* Active Subscription Management */}
      {accountData?.is_paid && accountData.stripe_customer_id && accountId && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Subscription Details</h3>
                  {isLegacyPricing && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      <Crown className="w-3 h-3" />
                      Legacy Plan
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isLegacyPricing
                    ? 'Your pricing and features are locked in'
                    : 'Manage your active subscription and billing'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Legacy plan info banner */}
          {isLegacyPricing && (
            <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Legacy Plan Benefits</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    You're on a legacy plan with full access to all features (Feedback + NPS) at your original pricing. These benefits are locked in for as long as you maintain your subscription.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Module breakdown for non-legacy accounts */}
          {!isLegacyPricing && enabledModules.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Modules</p>
                <button
                  onClick={() => navigate('/admin/features')}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  <Puzzle className="w-4 h-4" />
                  Manage Features
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {enabledModules.map(moduleCode => (
                  <div key={moduleCode} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {MODULE_NAMES[moduleCode] || moduleCode}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      £{MODULE_PRICING[moduleCode]?.monthly || 0}/venue/mo
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {venueCount} venue{venueCount !== 1 ? 's' : ''} • Total: £{calculateModuleTotal('monthly').toLocaleString()}/mo
              </p>
            </div>
          )}

          <div className="p-6">
            <SubscriptionManagement
              accountId={accountId}
              userEmail={userEmail}
              isLegacyPricing={isLegacyPricing}
            />
          </div>
        </div>
      )}

      {/* Stripe Checkout Modal */}
      <StripeCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={handleCloseModal}
        onSuccess={handlePaymentSuccess}
        clientSecret={clientSecret}
        subtotal={subscriptionType === 'monthly' ? monthlySubtotal : yearlySubtotal}
        billingPeriod={subscriptionType}
        venueCount={venueCount}
        isSetupMode={!accountData?.isExpired}
      />
    </div>
  );
};

export default BillingTab;
