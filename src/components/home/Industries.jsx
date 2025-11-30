import React from 'react';
import { UtensilsCrossed, Beer, Building, Network } from 'lucide-react';

const industries = [
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    description: 'Catch service issues before they become complaints.',
  },
  {
    icon: Beer,
    title: 'Pubs',
    description: 'During busy shifts, staff instantly know which tables need attention.',
  },
  {
    icon: Building,
    title: 'Hotels',
    description: 'Resolve room or service issues during the stay — not after the review.',
  },
  {
    icon: Network,
    title: 'Groups & Chains',
    description: 'Compare performance across locations with centralised oversight.',
  },
];

const Industries = () => {
  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Every Corner of Hospitality
          </h2>
        </div>

        {/* Industry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#4E74FF]/50 hover:shadow-md transition-all duration-300"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#4E74FF]/10 rounded-xl mb-4">
                <industry.icon className="w-7 h-7 text-[#4E74FF]" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {industry.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {industry.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Industries;
