import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Lock, Sparkles, ArrowRight, BarChart3 } from 'lucide-react';
import { useVenue } from '../../context/VenueContext';

// Module info configuration
const MODULE_INFO = {
  nps: {
    name: 'NPS',
    fullName: 'Net Promoter Score',
    description: 'Measure customer loyalty and gather actionable insights with automated NPS surveys.',
    icon: BarChart3,
    features: [
      'Automated follow-up emails after visits',
      'NPS score tracking and trends',
      'Customer feedback collection',
      'Promoter, passive, and detractor insights',
    ],
    price: {
      monthly: 49,
      yearly: 41,
    },
  },
};

const ModuleUpgradePage = ({ module = 'nps' }) => {
  const navigate = useNavigate();
  const { userRole } = useVenue();
  const moduleInfo = MODULE_INFO[module] || MODULE_INFO.nps;
  const Icon = moduleInfo.icon;

  const isMaster = userRole === 'master';

  return (
    <>
      <Helmet>
        <title>Upgrade to {moduleInfo.name} - Chatters</title>
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-10 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Unlock {moduleInfo.fullName}
              </h1>
              <p className="text-blue-100">
                {moduleInfo.description}
              </p>
            </div>

            {/* Features */}
            <div className="px-8 py-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                What's included
              </h2>
              <ul className="space-y-3">
                {moduleInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Section */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              {isMaster ? (
                <>
                  <button
                    onClick={() => navigate('/admin/features')}
                    className="w-full bg-blue-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-4"
                  >
                    Enable {moduleInfo.name}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Pricing below CTA */}
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <span className="font-semibold text-gray-900">
                      £{moduleInfo.price.monthly}/venue/mo
                    </span>
                    <span className="text-gray-400">or</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 font-semibold rounded-full text-xs">
                      Save 16% yearly (£{moduleInfo.price.yearly}/mo)
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-gray-100 rounded-xl mb-4">
                    <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">Contact your account owner</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Only account administrators can manage features
                    </p>
                  </div>

                  {/* Pricing info for non-masters */}
                  <div className="text-center text-sm text-gray-500">
                    Starting at £{moduleInfo.price.yearly}/venue/mo (billed yearly)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Help link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Questions? Contact us at{' '}
            <a href="mailto:support@getchatters.com" className="text-blue-600 hover:underline">
              support@getchatters.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default ModuleUpgradePage;
