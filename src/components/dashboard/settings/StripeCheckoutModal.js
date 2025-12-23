import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { X, CreditCard, Lock, MapPin, Receipt, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';

// Wrap loadStripe with error handling to gracefully handle blocked scripts
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY).catch((error) => {
  console.warn('Failed to load Stripe.js:', error.message);
  return null;
});

// EU country codes for VAT number display
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// VAT number prefixes by country
const VAT_PREFIXES = {
  AT: 'ATU', BE: 'BE', BG: 'BG', HR: 'HR', CY: 'CY', CZ: 'CZ',
  DK: 'DK', EE: 'EE', FI: 'FI', FR: 'FR', DE: 'DE', GR: 'EL',
  HU: 'HU', IE: 'IE', IT: 'IT', LV: 'LV', LT: 'LT', LU: 'LU',
  MT: 'MT', NL: 'NL', PL: 'PL', PT: 'PT', RO: 'RO', SK: 'SK',
  SI: 'SI', ES: 'ES', SE: 'SE', GB: 'GB'
};

const CheckoutForm = ({ onSuccess, onCancel, subtotal = 0, billingPeriod, venueCount = 1, isSetupMode }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [addressComplete, setAddressComplete] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);
  const [taxInfo, setTaxInfo] = useState(null);
  const [taxLoading, setTaxLoading] = useState(false);

  // VAT number state
  const [vatNumber, setVatNumber] = useState('');
  const [vatValidating, setVatValidating] = useState(false);
  const [vatValidation, setVatValidation] = useState(null); // { valid: boolean, message: string }
  const [showVatField, setShowVatField] = useState(false);

  // Debounce VAT validation
  const [vatDebounceTimer, setVatDebounceTimer] = useState(null);

  // Check if we should show VAT field based on country (EU only, not UK)
  // UK VAT numbers don't change the tax rate - UK businesses still pay 20% VAT
  // Only EU businesses with valid VAT qualify for reverse charge (0% VAT)
  useEffect(() => {
    if (billingAddress?.country) {
      const isEU = EU_COUNTRIES.includes(billingAddress.country);
      setShowVatField(isEU);

      // Reset VAT state when country changes to non-EU
      if (!isEU) {
        setVatNumber('');
        setVatValidation(null);
      }
    } else {
      setShowVatField(false);
    }
  }, [billingAddress?.country]);

  // Validate VAT number with debounce
  const validateVatNumber = useCallback(async (vat, country) => {
    if (!vat || vat.length < 5) {
      setVatValidation(null);
      return;
    }

    setVatValidating(true);
    try {
      const { data: { session } } = await import('../../../utils/supabase').then(m => m.supabase.auth.getSession());

      const response = await fetch('/api/validate-vat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          vatNumber: vat,
          country: country
        })
      });

      const data = await response.json();
      const isEU = EU_COUNTRIES.includes(country);
      setVatValidation({
        valid: data.valid,
        message: data.valid
          ? (isEU ? 'Valid VAT number - reverse charge applies' : 'Valid VAT number')
          : (data.message || 'Invalid VAT number')
      });

      // If valid, recalculate tax with VAT exemption
      if (data.valid) {
        calculateTax(country, vat);
      }
    } catch (error) {
      console.error('VAT validation failed:', error);
      setVatValidation({ valid: false, message: 'Could not validate VAT number' });
    } finally {
      setVatValidating(false);
    }
  }, []);

  // Handle VAT number input
  const handleVatChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setVatNumber(value);
    setVatValidation(null);

    // Clear existing timer
    if (vatDebounceTimer) {
      clearTimeout(vatDebounceTimer);
    }

    // Set new debounce timer
    if (value.length >= 5 && billingAddress?.country) {
      const timer = setTimeout(() => {
        validateVatNumber(value, billingAddress.country);
      }, 500);
      setVatDebounceTimer(timer);
    }
  };

  // Calculate tax function
  const calculateTax = async (country, validVatNumber = null) => {
    if (!country) return;

    setTaxLoading(true);
    try {
      const { data: { session } } = await import('../../../utils/supabase').then(m => m.supabase.auth.getSession());

      const response = await fetch('/api/calculate-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          billingPeriod,
          address: billingAddress,
          vatNumber: validVatNumber
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTaxInfo(data);
      }
    } catch (error) {
      console.error('Failed to calculate tax:', error);
    } finally {
      setTaxLoading(false);
    }
  };

  // Fetch tax calculation when address is complete (for both setup and payment modes)
  useEffect(() => {
    if (addressComplete && billingAddress) {
      // Only recalculate if we don't have a valid VAT number
      // (valid VAT triggers its own recalculation)
      if (!vatValidation?.valid) {
        calculateTax(billingAddress.country);
      }
    }
  }, [addressComplete, billingAddress, billingPeriod]);

  const handleAddressChange = (event) => {
    setAddressComplete(event.complete);
    if (event.complete && event.value) {
      setBillingAddress(event.value.address);
    } else {
      setBillingAddress(null);
      setTaxInfo(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // First, save the VAT number and billing address to the customer if provided
    if (vatNumber && vatValidation?.valid) {
      try {
        const { data: { session } } = await import('../../../utils/supabase').then(m => m.supabase.auth.getSession());

        await fetch('/api/update-customer-tax-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            vatNumber,
            country: billingAddress?.country,
            address: billingAddress
          })
        });
      } catch (error) {
        console.error('Failed to save tax info:', error);
        // Don't block the payment if this fails
      }
    }

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

  const period = billingPeriod === 'monthly' ? 'mo' : 'yr';
  const vatPrefix = billingAddress?.country ? VAT_PREFIXES[billingAddress.country] || '' : '';

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Receipt className="w-4 h-4" />
            <h3 className="text-sm font-medium">Order Summary</h3>
          </div>

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
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {venueCount} venue{venueCount !== 1 ? 's' : ''} × £{(subtotal / venueCount).toLocaleString()}/{period}
              </span>
              <span className="font-medium text-gray-900">£{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              {taxLoading ? (
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Calculating...
                </span>
              ) : taxInfo ? (
                <span className="font-medium text-gray-900">
                  {taxInfo.taxAmount === 0 && vatValidation?.valid ? (
                    <span className="text-green-600">£0.00 (Reverse charge)</span>
                  ) : (
                    <>
                      £{taxInfo.taxAmount.toLocaleString()}
                      {taxInfo.taxRate > 0 && (
                        <span className="text-gray-500 text-xs ml-1">({taxInfo.taxRate}%)</span>
                      )}
                    </>
                  )}
                </span>
              ) : (
                <span className="text-gray-500 text-xs">Enter billing address</span>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">{isSetupMode ? 'After trial' : 'Total'}</span>
              {taxInfo ? (
                <div className="text-right">
                  <span className="font-bold text-gray-900">£{taxInfo.total.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs">/{period}</span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="font-bold text-gray-900">£{subtotal.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs">/{period} + tax</span>
                </div>
              )}
            </div>

            {isSetupMode && (
              <div className="flex justify-between text-sm pt-2">
                <span className="font-semibold text-green-700">Due today</span>
                <span className="font-bold text-green-700">£0.00</span>
              </div>
            )}
          </div>

          {/* Security Badge - Desktop only */}
          <div className="hidden lg:flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
            <Lock className="w-3 h-3" />
            <span>Secured by Stripe • PCI DSS compliant</span>
          </div>
        </div>

        {/* Right Column - Payment Form */}
        <div className="space-y-4">
          {/* Billing Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4" />
              <h3 className="text-sm font-medium">Billing Address</h3>
            </div>
            <AddressElement
              options={{
                mode: 'billing',
                display: {
                  name: 'full'
                },
                fields: {
                  phone: 'never'
                }
              }}
              onChange={handleAddressChange}
            />
          </div>

          {/* VAT Number - Required for EU countries */}
          {showVatField && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4" />
                <h3 className="text-sm font-medium">VAT Number <span className="text-red-500">*</span></h3>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={vatNumber}
                  onChange={handleVatChange}
                  placeholder={`e.g. ${vatPrefix}123456789`}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    vatValidation?.valid
                      ? 'border-green-300 bg-green-50'
                      : vatValidation?.valid === false
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                  }`}
                />
                {vatValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {!vatValidating && vatValidation?.valid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
                {!vatValidating && vatValidation?.valid === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                )}
              </div>
              {vatValidation ? (
                <p className={`text-xs ${vatValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                  {vatValidation.message}
                </p>
              ) : !vatNumber && (
                <p className="text-xs text-gray-500">
                  Required for EU business customers
                </p>
              )}
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
                fields: {
                  billingDetails: {
                    address: 'never' // We're using AddressElement instead
                  }
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto'
                }
              }}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
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
                disabled={!stripe || (showVatField && !vatValidation?.valid)}
                loading={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  isSetupMode ? 'Saving...' : 'Processing...'
                ) : isSetupMode ? (
                  'Save Card'
                ) : taxInfo ? (
                  `Pay £${taxInfo.total.toLocaleString()}`
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
            {/* Security Badge - Mobile only */}
            <div className="lg:hidden flex items-center justify-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Secured by Stripe • PCI DSS compliant</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

const StripeCheckoutModal = ({ isOpen, onClose, onSuccess, clientSecret, subtotal = 0, billingPeriod, venueCount = 1, isSetupMode = false }) => {
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
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
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
          className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isSetupMode ? 'Add Payment Details' : 'Complete Subscription'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
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
                subtotal={subtotal}
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
