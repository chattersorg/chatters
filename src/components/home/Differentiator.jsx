import React from 'react';
import { Check } from 'lucide-react';

const points = [
  'Most venues are fully operational within 5 minutes of signing up. No onboarding calls. No implementation fees. No training days.',
  'Works instantly with your existing workflow. Staff understand it at a glance.',
  'Real-time alerts built for hospitality speed. Fix issues in seconds, not hours.',
  'Enterprise-level capabilities without enterprise complexity.',
];

const Differentiator = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Why Venues Switch to Chatters
            </h2>
          </div>

          {/* Intro Paragraph */}
          <p className="text-xl text-gray-600 text-center mb-12 leading-relaxed">
            Most feedback tools are slow, complicated, or designed for corporate analysts — not fast-moving hospitality teams. Chatters is different:
          </p>

          {/* Points */}
          <div className="space-y-6">
            {points.map((point, index) => (
              <div
                key={index}
                className="flex gap-4 items-start bg-gray-50 rounded-xl p-6"
              >
                {/* Checkmark */}
                <div className="flex-shrink-0 w-8 h-8 bg-[#41C74E] rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>

                {/* Text */}
                <p className="text-gray-700 text-lg leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Differentiator;
