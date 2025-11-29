import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Star, Bell, CheckCircle, ArrowRight, Smartphone, MessageSquare } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// STEP 1: Scan QR Code Mockup
// ─────────────────────────────────────────────────────────────
const ScanMockup = () => {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanning(true);
      setTimeout(() => setScanning(false), 1500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      {/* QR Code */}
      <div className={`relative transition-all duration-500 ${scanning ? 'scale-95' : 'scale-100'}`}>
        <div className="w-16 h-16 bg-white rounded-lg p-1.5 shadow-lg border border-gray-200">
          <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-0.5">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${
                  [0, 1, 2, 4, 5, 6, 10, 14, 18, 19, 20, 22, 23, 24].includes(i)
                    ? 'bg-slate-900'
                    : 'bg-white'
                }`}
              />
            ))}
          </div>
        </div>
        {/* Scan line animation */}
        {scanning && (
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute left-0 right-0 h-0.5 bg-[#4E74FF] animate-scan-line"></div>
          </div>
        )}
      </div>

      {/* Phone */}
      <div className={`absolute transition-all duration-700 ${scanning ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-70'}`} style={{ left: '15%' }}>
        <div className="w-10 h-16 bg-slate-800 rounded-lg border-2 border-slate-700 flex items-center justify-center">
          <div className={`w-6 h-6 rounded transition-colors duration-300 ${scanning ? 'bg-[#4E74FF]' : 'bg-slate-600'}`}>
            <QrCode className="w-full h-full p-0.5 text-white" />
          </div>
        </div>
      </div>

      {/* Success indicator */}
      <div className={`absolute right-[15%] transition-all duration-300 ${scanning ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STEP 2: Rate Experience Mockup
// ─────────────────────────────────────────────────────────────
const RateMockup = () => {
  const [rating, setRating] = useState(0);
  const [showThank, setShowThank] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRating(0);
      setShowThank(false);

      // Animate stars filling in
      [1, 2, 3, 4, 5].forEach((star, i) => {
        setTimeout(() => setRating(star), (i + 1) * 300);
      });

      // Show thank you
      setTimeout(() => setShowThank(true), 2000);
    }, 4000);

    // Initial animation
    [1, 2, 3, 4, 5].forEach((star, i) => {
      setTimeout(() => setRating(star), (i + 1) * 300 + 500);
    });
    setTimeout(() => setShowThank(true), 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      {/* Phone with rating UI */}
      <div className="w-24 bg-white rounded-2xl shadow-xl border border-gray-200 p-3">
        {!showThank ? (
          <>
            <p className="text-[8px] text-slate-500 text-center mb-2">How was your meal?</p>
            <div className="flex justify-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 transition-all duration-200 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400 scale-110'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="h-4 bg-slate-100 rounded text-[6px] text-slate-400 flex items-center justify-center">
              Add comment...
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[8px] font-semibold text-slate-800">Thanks!</p>
          </div>
        )}
      </div>

      {/* Time indicator */}
      <div className="absolute bottom-2 right-4 text-[10px] text-slate-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
        30 sec
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STEP 3: Alert Staff Mockup
// ─────────────────────────────────────────────────────────────
const AlertMockup = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertPulse, setAlertPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowAlert(false);
      setTimeout(() => {
        setShowAlert(true);
        setAlertPulse(true);
        setTimeout(() => setAlertPulse(false), 1000);
      }, 500);
    }, 3500);

    // Initial
    setTimeout(() => {
      setShowAlert(true);
      setAlertPulse(true);
      setTimeout(() => setAlertPulse(false), 1000);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      {/* Alert notification */}
      <div className={`transition-all duration-500 ${showAlert ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}`}>
        <div className={`bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-36 ${alertPulse ? 'ring-4 ring-red-200' : ''}`}>
          <div className="flex items-start gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alertPulse ? 'bg-red-500 animate-pulse' : 'bg-red-100'}`}>
              <Bell className={`w-4 h-4 ${alertPulse ? 'text-white' : 'text-red-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-slate-800">Table 8 needs help</p>
              <p className="text-[8px] text-slate-500">Rating: 2/5</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[8px] text-slate-400">Just now</span>
            <span className="text-[8px] font-medium text-[#4E74FF]">View</span>
          </div>
        </div>
      </div>

      {/* Staff device indicators */}
      <div className="absolute bottom-2 left-4 flex -space-x-2">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className={`w-5 h-5 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${showAlert ? 'bg-[#4E74FF]' : 'bg-slate-300'}`} style={{ transitionDelay: `${i * 100}ms` }}>
            <Smartphone className="w-full h-full p-1 text-white" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STEP 4: Fix Issue Mockup
// ─────────────────────────────────────────────────────────────
const FixMockup = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <div className="w-36 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
        {/* Progress steps */}
        <div className="flex items-center justify-between mb-3">
          {['Alerted', 'Acknowledged', 'Resolved'].map((label, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                i <= step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {i <= step ? <CheckCircle className="w-3 h-3" /> : i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        {/* Status text */}
        <div className="text-center">
          <p className="text-[9px] font-semibold text-slate-800">
            {step === 0 && 'Manager notified'}
            {step === 1 && 'On their way'}
            {step === 2 && 'Issue resolved'}
          </p>
          <p className="text-[8px] text-slate-500">Table 8</p>
        </div>

        {/* Resolved badge */}
        {step === 2 && (
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            Fixed!
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const steps = [
  {
    icon: QrCode,
    title: 'Scan',
    description: 'Guest scans a QR code at the table.',
    mockup: ScanMockup,
  },
  {
    icon: Star,
    title: 'Rate',
    description: '30-second feedback, no app required.',
    mockup: RateMockup,
  },
  {
    icon: Bell,
    title: 'Alert',
    description: 'Low scores trigger instant staff alerts.',
    mockup: AlertMockup,
  },
  {
    icon: CheckCircle,
    title: 'Fix',
    description: 'Your team resolves the issue while the guest is still seated.',
    mockup: FixMockup,
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            How Chatters Prevents Bad Reviews
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              {/* Step number connector line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200 z-10">
                  <ArrowRight className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              )}

              {/* Mockup */}
              <div className="mb-4">
                <step.mockup />
              </div>

              {/* Step Number Badge */}
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#4E74FF] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{index + 1}</span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-center text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Link */}
        <div className="text-center">
          <Link
            to="/demo"
            className="inline-flex items-center text-[#4E74FF] font-semibold hover:text-[#2F5CFF] transition-colors"
          >
            See It In Action
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 1.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
