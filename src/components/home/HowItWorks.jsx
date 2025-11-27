import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Star, Bell, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: QrCode,
    title: 'Scan',
    description: 'Guest scans a QR code at the table.',
  },
  {
    icon: Star,
    title: 'Rate',
    description: '30-second feedback, no app required.',
  },
  {
    icon: Bell,
    title: 'Alert',
    description: 'Low scores trigger instant staff alerts.',
  },
  {
    icon: CheckCircle,
    title: 'Fix',
    description: 'Your team resolves the issue while the guest is still seated.',
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
              className="relative text-center p-6"
            >
              {/* Step number connector line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gray-200">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
              )}

              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#41C74E]/10 rounded-2xl mb-4">
                <step.icon className="w-8 h-8 text-[#41C74E]" />
              </div>

              {/* Step Number */}
              <div className="absolute top-4 right-4 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-500">{index + 1}</span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Link */}
        <div className="text-center">
          <Link
            to="/demo"
            className="inline-flex items-center text-[#41C74E] font-semibold hover:text-[#38b043] transition-colors"
          >
            See It In Action
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
