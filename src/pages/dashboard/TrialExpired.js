import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { Helmet } from 'react-helmet';
import {
  CreditCard,
  LogOut,
  AlertTriangle,
  Calendar,
  Building2,
  Mail
} from 'lucide-react';
import StripeCheckoutModal from '../../components/dashboard/settings/StripeCheckoutModal';

// Pricing configuration (must match BillingTab)
const PRICE_PER_VENUE_MONTHLY = 149;
const PRICE_PER_VENUE_YEARLY = 1430;

const TrialExpired = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState(null);
  const [venueCount, setVenueCount] = useState(1);
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
        return;
      }

      setUserEmail(session.user.email);

      // Get user's account info
      const { data: user } = await supabase
        .from('users')
        .select('account_id, first_name, role, accounts(id, name, trial_ends_at, is_paid, stripe_customer_id)')
        .eq('id', session.user.id)
        .single();

      setUserRole(user?.role);

      let accountIdToUse = user?.account_id;
      let accountData = user?.accounts;

      // For managers, get account through staff table if no direct account_id
      if (user?.role === 'manager' && !accountIdToUse) {
        const { data: staffRow } = await supabase
          .from('staff')
          .select('venues!inner(account_id, accounts(id, name, trial_ends_at, is_paid, stripe_customer_id))')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();

        if (staffRow?.venues) {
          accountIdToUse = staffRow.venues.account_id;
          accountData = staffRow.venues.accounts;
        }
      }

      if (accountData) {
        setAccountId(accountIdToUse);
        setAccountInfo({
          userName: user.first_name,
          accountName: accountData.name,
          trialEndedAt: accountData.trial_ends_at,
          hasStripeCustomer: !!accountData.stripe_customer_id,
          isPaid: accountData.is_paid
        });

        // Get venue count
        const { count } = await supabase
          .from('venues')
          .select('id', { count: 'exact' })
          .eq('account_id', accountIdToUse);

        setVenueCount(count || 1);

        // If they're actually paid, redirect to dashboard
        if (accountData.is_paid) {
          navigate('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Error loading account info:', error);
    } finally {
      setPageLoading(false);
    }
  };

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
        alert('Please sign in again to continue.');
        setLoading(false);
        navigate('/signin');
        return;
      }

      const response = await fetch('/api/create-subscription-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ priceId }), // venueCount fetched from DB on backend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to process payment');
      }

      if (!data.clientSecret) {
        throw new Error('No client secret returned');
      }

      setClientSecret(data.clientSecret);
      setCheckoutModalOpen(true);
      setLoading(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Checkout failed: ${error.message}`);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (status = 'succeeded') => {
    setCheckoutModalOpen(false);
    setClientSecret(null);

    if (status === 'processing') {
      alert('Direct Debit setup successful! Your payment will be processed within 3-5 business days.');
    } else {
      alert('Payment successful! Your subscription is now active.');
    }

    // Redirect to dashboard
    navigate('/dashboard');
  };

  const handleCloseModal = () => {
    setCheckoutModalOpen(false);
    setClientSecret(null);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calculate totals
  const monthlyTotal = venueCount * PRICE_PER_VENUE_MONTHLY;
  const yearlyTotal = venueCount * PRICE_PER_VENUE_YEARLY;
  const yearlyMonthlyEquivalent = yearlyTotal / 12;
  const yearlyDiscount = ((monthlyTotal * 12 - yearlyTotal) / (monthlyTotal * 12) * 100).toFixed(0);

  // Check if user is a manager (not master)
  const isManager = userRole === 'manager';

  // Loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>{isManager ? 'Account Expired' : 'Upgrade Your Account'} - Chatters</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/img/logo.svg" alt="Chatters" className="h-8" />
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Trial Expired Banner */}
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-800">Your Trial Has Expired</h1>
              {accountInfo?.trialEndedAt && (
                <p className="text-red-700 mt-1">
                  Trial ended on {formatDate(accountInfo.trialEndedAt)}
                </p>
              )}
              {accountInfo?.userName && (
                <p className="text-red-600 mt-2">
                  Hi {accountInfo.userName}, {isManager
                    ? `your account's trial for ${accountInfo.accountName} has expired.`
                    : `upgrade now to continue using Chatters for ${accountInfo.accountName}.`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Manager View - Contact Account Owner */}
          {isManager ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Your Account Owner</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Only account owners can manage billing and subscriptions. Please contact your account administrator to upgrade and restore access to Chatters.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500">Account</p>
                  <p className="font-semibold text-gray-900">{accountInfo?.accountName}</p>
                </div>
                <p className="text-sm text-gray-500">
                  Need help? Contact us at{' '}
                  <a href="mailto:support@getchatters.com" className="text-blue-600 hover:underline">
                    support@getchatters.com
                  </a>
                </p>
              </div>
            </div>
          ) : (
            /* Master View - Billing Options */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>

              {/* Account Info */}
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Venues</p>
                    <p className="font-semibold text-gray-900">{venueCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trial Ended</p>
                    <p className="font-semibold text-gray-900">{formatDate(accountInfo?.trialEndedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Plans */}
              <div className="space-y-4 mb-8">
                {/* Monthly Plan */}
                <label className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-2 rounded-xl p-5 cursor-pointer transition
                  ${subscriptionType === 'monthly' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <div className="flex-1 mb-3 sm:mb-0">
                    <h3 className="font-semibold text-gray-800 text-lg">Monthly Plan</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      £{PRICE_PER_VENUE_MONTHLY} per venue per month · Cancel anytime
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:ml-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Total for {venueCount} venue{venueCount !== 1 ? 's' : ''}
                      </div>
                      <span className="text-2xl font-bold text-gray-800">£{monthlyTotal.toLocaleString()}</span>
                      <span className="text-gray-600">/mo</span>
                    </div>
                    <input
                      type="radio"
                      value="monthly"
                      checked={subscriptionType === 'monthly'}
                      onChange={() => setSubscriptionType('monthly')}
                      className="ml-4 h-5 w-5 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </label>

                {/* Yearly Plan */}
                <label className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-2 rounded-xl p-5 cursor-pointer transition relative
                  ${subscriptionType === 'yearly' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <div className="absolute -top-3 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    SAVE {yearlyDiscount}%
                  </div>
                  <div className="flex-1 mb-3 sm:mb-0">
                    <h3 className="font-semibold text-gray-800 text-lg">Yearly Plan</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      £{PRICE_PER_VENUE_YEARLY} per venue per year · Best value
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:ml-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Total for {venueCount} venue{venueCount !== 1 ? 's' : ''}
                      </div>
                      <span className="text-2xl font-bold text-gray-800">£{yearlyTotal.toLocaleString()}</span>
                      <span className="text-gray-600">/yr</span>
                      <p className="text-xs text-green-600 font-medium mt-1">
                        £{yearlyMonthlyEquivalent.toFixed(2)}/mo equivalent
                      </p>
                    </div>
                    <input
                      type="radio"
                      value="yearly"
                      checked={subscriptionType === 'yearly'}
                      onChange={() => setSubscriptionType('yearly')}
                      className="ml-4 h-5 w-5 text-green-600 focus:ring-green-500"
                    />
                  </div>
                </label>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 font-semibold disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Subscribe Now - £{subscriptionType === 'monthly' ? monthlyTotal.toLocaleString() : yearlyTotal.toLocaleString()}{subscriptionType === 'monthly' ? '/mo' : '/yr'}
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-500">
                  Secured checkout powered by Stripe
                </p>
              </div>

              <p className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
                Questions? Contact us at{' '}
                <a href="mailto:support@getchatters.com" className="text-blue-600 hover:underline">
                  support@getchatters.com
                </a>
              </p>
            </div>
          )}

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Your data is safe and will be available once {isManager ? 'your account is upgraded' : 'you upgrade'}.
          </p>
        </div>
      </div>

      {/* Stripe Checkout Modal - only for masters */}
      {!isManager && (
        <StripeCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={handleCloseModal}
          onSuccess={handlePaymentSuccess}
          clientSecret={clientSecret}
          total={subscriptionType === 'monthly' ? monthlyTotal : yearlyTotal}
          billingPeriod={subscriptionType}
          venueCount={venueCount}
          isSetupMode={false}
        />
      )}
    </div>
  );
};

export default TrialExpired;
