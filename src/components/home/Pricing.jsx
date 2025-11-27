import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Pricing = () => {
  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h2>
        </div>

        {/* Pricing Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
            <div className="space-y-4 mb-8">
              <p className="text-xl text-gray-700">
                No complicated tiers.
              </p>
              <p className="text-xl text-gray-700">
                No per-staff fees.
              </p>
              <p className="text-xl text-gray-700">
                No hidden charges.
              </p>
            </div>

            <p className="text-gray-600 mb-8 text-lg">
              We'll walk you through the right plan for your venue during your demo.
            </p>

            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#41C74E] rounded-lg hover:bg-[#38b043] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Book a Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
