import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../../utils/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVenue } from '../../context/VenueContext';

// Wrap loadStripe with error handling to gracefully handle blocked scripts
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY).catch((error) => {
  console.warn('Failed to load Stripe.js:', error.message);
  return null;
});

const BillingPage = () => {
  const { userRole } = useVenue();
  const location = useLocation();
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const [userEmail, setUserEmail] = useState('');
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trialInfo, setTrialInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrialInfo = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData?.user?.email;
      const userId = authData?.user?.id;

      if (!email || !userId) {
        navigate('/signin');
        return;
      }

      setUserEmail(email);

      // Get user info
      const { data: userRow } = await supabase
        .from('users')
        .select('account_id, role')
        .eq('id', userId)
        .single();

      if (!userRow) {
        navigate('/signin');
        return;
      }

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
        const { data: account } = await supabase
          .from('accounts')
          .select('trial_ends_at, is_paid, demo_account, account_type, stripe_subscription_status')
          .eq('id', accountIdToCheck)
          .single();

        if (account?.trial_ends_at) {
          setTrialEndsAt(account.trial_ends_at);
          
          const trialEndDate = new Date(account.trial_ends_at);
          const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          
          setTrialInfo({
            isExpired: daysLeft <= 0 && !account.is_paid && !account.demo_account,
            daysLeft,
            isDemoAccount: account.demo_account || false
          });
        }
      }
    };

    fetchTrialInfo();
  }, [navigate]);

  const handleCheckout = async () => {
    setLoading(true);

    const priceId =
      subscriptionType === 'monthly'
        ? process.env.REACT_APP_STRIPE_PRICE_MONTHLY
        : process.env.REACT_APP_STRIPE_PRICE_YEARLY;

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, priceId }),
    });

    const { id } = await response.json();
    const stripe = await stripePromise;
    await stripe.redirectToCheckout({ sessionId: id });
  };

  const daysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null;

  // Allow access if user is master OR if trial is expired (special billing access)
  if (userRole !== 'master' && !trialInfo?.isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center px-4 py-10">
        <div className="bg-white dark:bg-gray-800 max-w-xl w-full rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-custom-red dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.95-.833-2.72 0L4.094 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Restricted</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Only account owners can access billing information and manage subscriptions.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Contact your account owner if you need access to billing details or want to upgrade your plan.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-custom-blue hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center px-4 py-10">
      <div className="bg-white dark:bg-gray-800 max-w-xl w-full rounded-2xl shadow-xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Plan</h1>

          {/* Expired trial banner */}
          {trialInfo?.isExpired && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-custom-red dark:text-red-400 text-sm font-medium">
                ⚠️ Your trial has expired. Please upgrade to continue using Chatters.
              </p>
            </div>
          )}

          {/* Active trial banner */}
          {daysLeft !== null && !trialInfo?.isExpired && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Your free trial ends in <strong>{daysLeft}</strong> day{daysLeft !== 1 && 's'}.
            </p>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {/* Monthly Plan */}
          <label className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition
            ${subscriptionType === 'monthly' ? 'border-custom-blue bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Monthly Plan</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pay as you go. Cancel anytime.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">£29/mo</span>
            </div>
            <input
              type="radio"
              value="monthly"
              checked={subscriptionType === 'monthly'}
              onChange={() => setSubscriptionType('monthly')}
              className="hidden"
            />
          </label>

          {/* Yearly Plan */}
          <label className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition relative
            ${subscriptionType === 'yearly' ? 'border-custom-green bg-green-50 dark:bg-green-900/30 dark:border-green-700' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                Yearly Plan
                <span className="ml-2 bg-green-100 dark:bg-green-900/50 text-custom-green dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  Best value
                </span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Save over 20% vs monthly. One payment for the year.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">£278/yr</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">£23.17/mo equivalent</p>
            </div>
            <input
              type="radio"
              value="yearly"
              checked={subscriptionType === 'yearly'}
              onChange={() => setSubscriptionType('yearly')}
              className="hidden"
            />
          </label>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-custom-green hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 transition text-white text-center font-medium py-3 px-6 rounded-lg"
        >
          {loading ? 'Redirecting…' : 'Upgrade and Continue'}
        </button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          Secured checkout powered by Stripe. You can cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default BillingPage;