import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { X, CreditCard, Lock } from 'lucide-react';
import { Button } from '../../ui/button';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ onSuccess, onCancel, total, billingPeriod, venueCount, isSetupMode }) => {
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

    // CRITICAL: Different flow for setup (trial) vs payment (expired trial)
    if (isSetupMode) {
      // SETUP MODE: Just save card, NO CHARGE
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account/billing?setup_success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        setIsProcessing(false);
      } else {
        // Setup succeeded - card saved, no charge
        onSuccess('setup_succeeded');
      }
    } else {
      // PAYMENT MODE: Charge immediately
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        setIsProcessing(false);
      } else {
        // Payment succeeded or is processing
        if (paymentIntent?.status === 'processing') {
          onSuccess('processing');
        } else {
          onSuccess('succeeded');
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Order Summary or Setup Notice */}
      {isSetupMode ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">No Charge Today</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                We're securely saving your payment method. <strong>You will not be charged</strong> until your trial period expires.
              </p>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  After trial: <strong>£{total.toLocaleString()}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</strong> for {venueCount} venue{venueCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <span className="text-gray-600 text-xs">Plan</span>
              <p className="font-semibold text-gray-900">
                {billingPeriod === 'monthly' ? 'Monthly' : 'Annual'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-600 text-xs">Venues</span>
              <p className="font-semibold text-gray-900">{venueCount}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-blue-200 flex justify-between items-baseline">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">£{total.toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-1">
                /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Element */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-700">
          <CreditCard className="w-4 h-4" />
          <h3 className="text-sm font-medium">{isSetupMode ? 'Card Details' : 'Payment Method'}</h3>
        </div>
        <PaymentElement
          options={{
            layout: isSetupMode ? 'accordion' : 'tabs',
            defaultValues: {
              billingDetails: {
                address: {
                  country: 'GB',
                }
              }
            }
          }}
        />
        {!isSetupMode && (
          <p className="text-xs text-gray-500 mt-2">
            💳 Pay by card
          </p>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Security Badge & Action Buttons Combined */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!stripe}
            loading={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              isSetupMode ? 'Saving...' : 'Processing...'
            ) : isSetupMode ? (
              'Save Card (No Charge)'
            ) : (
              `Pay £${total.toLocaleString()}`
            )}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock className="w-3 h-3" />
          <span>Secured by Stripe • PCI DSS compliant</span>
        </div>
      </div>
    </form>
  );
};

const StripeCheckoutModal = ({ isOpen, onClose, onSuccess, clientSecret, total, billingPeriod, venueCount, isSetupMode = false }) => {
  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '8px',
      },
    },
    paymentMethodOrder: ['card', 'bacs_debit'],
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-5 transform transition-all max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - More Compact */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isSetupMode ? 'Add Payment Details' : 'Complete Subscription'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isSetupMode ? 'No charge during trial' : 'Secure payment via Stripe'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors -mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stripe Elements Form */}
          {clientSecret && (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                onSuccess={onSuccess}
                onCancel={onClose}
                total={total}
                billingPeriod={billingPeriod}
                venueCount={venueCount}
                isSetupMode={isSetupMode}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeCheckoutModal;
