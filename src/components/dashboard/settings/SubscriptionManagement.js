import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import {
  CreditCard,
  Download,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../../ui/button';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Card brand logo components
const CardBrandLogo = ({ brand }) => {
  const brandName = brand?.toLowerCase();

  switch (brandName) {
    case 'visa':
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8">
          <rect width="48" height="32" rx="4" fill="#1434CB"/>
          <path d="M20.5 11h-3.2l-2 10h2l2-10zm7.7 6.4l1.1-3 .6 3h-1.7zm2.3 3.6h1.8l-1.6-10h-1.6c-.4 0-.7.2-.8.5l-2.8 9.5h2.1l.4-1.1h2.6l.2 1.1zm-5.5-3.3c0-2.6-3.6-2.8-3.6-4 0-.4.4-.7 1.2-.8.4 0 1.5.1 2.7.7l.5-2.3c-.7-.2-1.5-.5-2.6-.5-2.5 0-4.2 1.3-4.2 3.2 0 1.4 1.2 2.1 2.2 2.6 1 .5 1.4.8 1.4 1.2 0 .7-.8 1-1.6 1-1.3 0-2.1-.3-2.7-.6l-.5 2.4c.6.3 1.8.5 3 .5 2.6 0 4.3-1.3 4.3-3.3zm-10.8-6.7l-3.3 10h-2.1l-1.6-6.2c-.1-.4-.2-.5-.5-.7-.5-.3-1.4-.5-2.1-.7l.1-.4h3.6c.5 0 .9.3 1 .8l.9 4.9 2.2-5.7h2.1z" fill="white"/>
        </svg>
      );
    case 'mastercard':
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8">
          <rect width="48" height="32" rx="4" fill="#000000"/>
          <circle cx="18" cy="16" r="8" fill="#EB001B"/>
          <circle cx="30" cy="16" r="8" fill="#FF5F00"/>
          <path d="M24 9.6c-1.7 1.4-2.8 3.5-2.8 5.9s1.1 4.5 2.8 5.9c1.7-1.4 2.8-3.5 2.8-5.9s-1.1-4.5-2.8-5.9z" fill="#F79E1B"/>
        </svg>
      );
    case 'amex':
    case 'american express':
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8">
          <rect width="48" height="32" rx="4" fill="#006FCF"/>
          <path d="M15.5 13.5h-2.7l-.7 1.7-.7-1.7H8.7v4.8l-2.2-4.8H4l-2.5 5.5h1.5l.5-1.2h2.7l.5 1.2h2.8v-4.2l2 4.2h1.2l2-4.2v4.2h1.5v-5.5h-2.2zm-10.7 3.7l.9-2.1.9 2.1h-1.8zm15.7-3.7l-1.2 2.8-1.2-2.8h-2.2l2.2 4.3v1.2h1.5v-1.2l2.2-4.3h-1.3zm6.5 0h-4.5v5.5h4.5v-1.3h-3v-1h2.9v-1.2h-2.9v-1h3v-1zm5.5 2.3l1.5-2.3h-1.7l-.8 1.3-.8-1.3h-1.7l1.5 2.3-1.6 2.4h1.7l.9-1.4.9 1.4h1.7l-1.6-2.4z" fill="white"/>
        </svg>
      );
    case 'discover':
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8">
          <rect width="48" height="32" rx="4" fill="#FF6000"/>
          <circle cx="36" cy="16" r="8" fill="#FFAB00"/>
          <text x="8" y="20" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">DISCOVER</text>
        </svg>
      );
    case 'diners':
    case 'diners club':
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8">
          <rect width="48" height="32" rx="4" fill="#0079BE"/>
          <circle cx="18" cy="16" r="7" fill="white"/>
          <circle cx="30" cy="16" r="7" fill="white"/>
          <path d="M24 9v14" stroke="#0079BE" strokeWidth="14"/>
        </svg>
      );
    case 'jcb':
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8">
          <rect width="48" height="32" rx="4" fill="#0E4C96"/>
          <rect x="4" y="12" width="12" height="8" rx="1" fill="#CC0000"/>
          <rect x="18" y="12" width="12" height="8" rx="1" fill="#00A0E9"/>
          <rect x="32" y="12" width="12" height="8" rx="1" fill="#7FC04C"/>
        </svg>
      );
    case 'unionpay':
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8">
          <rect width="48" height="32" rx="4" fill="#002D72"/>
          <circle cx="14" cy="16" r="6" fill="#E21836"/>
          <circle cx="24" cy="16" r="6" fill="#00447C"/>
          <circle cx="34" cy="16" r="6" fill="#007B84"/>
        </svg>
      );
    default:
      // Generic card icon for unknown brands
      return (
        <div className="w-12 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
      );
  }
};


// Update Payment Method Component
const UpdatePaymentMethodForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/billing`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message);
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe}
          loading={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Updating...' : 'Save Payment Method'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

// Pricing configuration (must match BillingTab)
const PRICE_PER_VENUE_MONTHLY = 149;
const PRICE_PER_VENUE_YEARLY = 1430;

const SubscriptionManagement = ({ accountId, userEmail }) => {
  const [subscription, setSubscription] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdatePayment, setShowUpdatePayment] = useState(false);
  const [setupSecret, setSetupSecret] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [changePlanLoading, setChangePlanLoading] = useState(false);
  const [venueCount, setVenueCount] = useState(1);

  useEffect(() => {
    loadSubscriptionData();
  }, [accountId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      // Get venue count for this account
      const { count } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId);

      setVenueCount(count || 1);

      const response = await fetch('/api/get-subscription-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.subscription) {
        setSubscription(data.subscription);
      }

      if (data.paymentMethod) {
        setPaymentMethod(data.paymentMethod);
      }

      if (data.invoices) {
        // Filter out void/draft invoices, show paid and open (unpaid) invoices
        const relevantInvoices = data.invoices.filter(
          invoice => invoice.status === 'paid' || invoice.status === 'open'
        );
        setInvoices(relevantInvoices);
      }

    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in again to update your payment method.');
        return;
      }

      const response = await fetch('/api/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setSetupSecret(data.clientSecret);
        setShowUpdatePayment(true);
      }
    } catch (error) {
      console.error('Error creating setup intent:', error);
      alert('Failed to initialize payment update. Please try again.');
    }
  };

  const handlePaymentUpdateSuccess = () => {
    setShowUpdatePayment(false);
    setSetupSecret(null);
    alert('Payment method updated successfully!');
    loadSubscriptionData();
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in again to cancel your subscription.');
        setCancelLoading(false);
        return;
      }

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription cancelled. You\'ll have access until the end of your current billing period.');
        setShowCancelConfirm(false);
        loadSubscriptionData();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleChangePlan = async (newPlan) => {
    setChangePlanLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in again to change your plan.');
        setChangePlanLoading(false);
        return;
      }

      const newPriceId = newPlan === 'yearly'
        ? process.env.REACT_APP_STRIPE_PRICE_YEARLY
        : process.env.REACT_APP_STRIPE_PRICE_MONTHLY;

      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ newPriceId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully switched to ${newPlan} plan! Your next invoice will be prorated.`);
        setShowChangePlan(false);
        loadSubscriptionData();
      } else {
        alert(data.error || 'Failed to change plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan. Please try again.');
    } finally {
      setChangePlanLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in again to download invoices.');
        return;
      }

      const response = await fetch('/api/download-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Loading subscription details...</p>
      </div>
    );
  }

  // Check for unpaid invoices
  const unpaidInvoices = invoices.filter(inv => inv.status === 'open');
  const hasUnpaidInvoices = unpaidInvoices.length > 0;

  return (
    <div className="space-y-4">
      {/* Unpaid Invoice Warning */}
      {hasUnpaidInvoices && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">
              <strong>Payment required:</strong> £{(unpaidInvoices.reduce((sum, inv) => sum + inv.amount_due, 0) / 100).toFixed(2)} overdue
            </span>
          </div>
          {unpaidInvoices[0]?.hosted_invoice_url && (
            <a
              href={unpaidInvoices[0].hosted_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            >
              Pay Now
            </a>
          )}
        </div>
      )}

      {/* Subscription Summary Row */}
      {subscription && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Plan:</span>
            <span className="text-sm font-medium text-gray-900">
              £{(subscription.amount / 100).toFixed(2)}/{subscription.interval === 'month' ? 'mo' : 'yr'}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {subscription.status === 'active' ? 'Active' : 'Past Due'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Next bill:</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          {!subscription.cancel_at_period_end && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowChangePlan(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Change
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Cancel
              </button>
            </div>
          )}
          {subscription.cancel_at_period_end && (
            <span className="text-xs text-red-600 ml-auto">
              Cancels {new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB')}
            </span>
          )}
        </div>
      )}

      {/* Payment Method Row */}
      {paymentMethod && !showUpdatePayment && (
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <CardBrandLogo brand={paymentMethod.brand} />
            <div>
              <span className="text-sm font-medium text-gray-900 capitalize">{paymentMethod.brand}</span>
              <span className="text-sm text-gray-500"> •••• {paymentMethod.last4}</span>
              <span className="text-sm text-gray-400 ml-2">Exp {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}</span>
            </div>
          </div>
          <button
            onClick={handleUpdatePaymentMethod}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Update
          </button>
        </div>
      )}

      {/* Update Payment Method Form */}
      {showUpdatePayment && setupSecret && (
        <div className="py-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Update Payment Method</h4>
          <Elements stripe={stripePromise} options={{ clientSecret: setupSecret }}>
            <UpdatePaymentMethodForm
              onSuccess={handlePaymentUpdateSuccess}
              onCancel={() => {
                setShowUpdatePayment(false);
                setSetupSecret(null);
              }}
            />
          </Elements>
        </div>
      )}

      {/* Billing History - Compact */}
      {invoices.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recent Invoices</h4>
          <div className="space-y-1">
            {invoices.slice(0, 3).map((invoice) => {
              const isUnpaid = invoice.status === 'open';
              return (
                <div
                  key={invoice.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${isUnpaid ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      £{((isUnpaid ? invoice.amount_due : invoice.amount_paid) / 100).toFixed(2)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      isUnpaid ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {isUnpaid ? 'Due' : 'Paid'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(invoice.created * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnpaid && invoice.hosted_invoice_url && (
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-600 font-medium hover:text-red-700"
                      >
                        Pay
                      </a>
                    )}
                    <button
                      onClick={() => downloadInvoice(invoice.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cancel Subscription?</h3>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              You'll continue to have access until <strong>{subscription ? new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</strong>.
              After that, your subscription will end.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Keep Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showChangePlan && subscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Your Plan</h3>
              <button
                onClick={() => setShowChangePlan(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Switch between monthly and yearly billing. Changes are prorated automatically.
            </p>

            {/* Current Plan Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Current Plan</p>
              <p className="font-semibold text-gray-900">
                {subscription.interval === 'month' ? 'Monthly' : 'Yearly'} - £{(subscription.amount / 100).toFixed(2)}/{subscription.interval === 'month' ? 'mo' : 'yr'}
              </p>
            </div>

            {/* Plan Options */}
            <div className="space-y-3 mb-6">
              {/* Monthly Option */}
              <button
                onClick={() => handleChangePlan('monthly')}
                disabled={subscription.interval === 'month' || changePlanLoading}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  subscription.interval === 'month'
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Monthly Plan</p>
                    <p className="text-sm text-gray-600">
                      £{PRICE_PER_VENUE_MONTHLY} per venue/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      £{(venueCount * PRICE_PER_VENUE_MONTHLY).toLocaleString()}/mo
                    </p>
                    {subscription.interval === 'month' && (
                      <span className="text-xs text-gray-500">Current</span>
                    )}
                  </div>
                </div>
              </button>

              {/* Yearly Option */}
              <button
                onClick={() => handleChangePlan('yearly')}
                disabled={subscription.interval === 'year' || changePlanLoading}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                  subscription.interval === 'year'
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-green-200 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                <div className="absolute -top-2 left-4 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  SAVE 20%
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Yearly Plan</p>
                    <p className="text-sm text-gray-600">
                      £{PRICE_PER_VENUE_YEARLY} per venue/year
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      £{(venueCount * PRICE_PER_VENUE_YEARLY).toLocaleString()}/yr
                    </p>
                    {subscription.interval === 'year' && (
                      <span className="text-xs text-gray-500">Current</span>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {changePlanLoading && (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Updating your plan...</p>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center">
              Plan changes are prorated. You'll be charged or credited the difference.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
