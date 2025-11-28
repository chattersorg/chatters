import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <div className="order-2 lg:order-1">
            {/* Eyebrow */}
            <p className="text-sm font-semibold uppercase tracking-wide text-[#41C74E] mb-4">
              Built for UK Hospitality
            </p>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Catch Problems Before They Become 1-Star Reviews
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Real-time guest feedback that alerts your team instantly — so you can fix issues while customers are still at the table.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Link
                to="/try"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#41C74E] rounded-lg hover:bg-[#38b043] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Book Demo
              </Link>
            </div>

            {/* Microcopy */}
            <p className="text-sm text-gray-500">
              No credit card required • Go live in 5 minutes
            </p>
          </div>

          {/* Right Column - Visuals */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative">
              {/* Main dashboard image */}
              <img
                src="/img/homepage/homepage-hero-2.png"
                alt="Chatters dashboard showing real-time guest feedback alerts"
                className="w-full rounded-2xl shadow-2xl"
              />

              {/* Floating phone mockup */}
              <div className="absolute -bottom-6 -left-6 w-40 sm:w-48">
                <img
                  src="/img/homepage/homepage-phone.png"
                  alt="Guest feedback form on mobile"
                  className="w-full"
                />
              </div>

              {/* Floating notification */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">New Alert: Table 12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
