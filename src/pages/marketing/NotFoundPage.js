import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Navbar from '../../components/marketing/layout/Navbar';
import Footer from '../../components/marketing/layout/Footer';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Page Not Found | Chatters</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navbar />

      <main className="flex flex-col items-center justify-center px-6 py-24 sm:py-32 lg:px-8 relative overflow-hidden">
        {/* Floating chat bubbles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Bubble 1 */}
          <div className="absolute top-20 left-[10%] animate-float-slow opacity-20">
            <div className="w-16 h-16 bg-[#2F5CFF] rounded-full rounded-bl-none" />
          </div>
          {/* Bubble 2 */}
          <div className="absolute top-40 right-[15%] animate-float-medium opacity-15">
            <div className="w-12 h-12 bg-[#2F5CFF] rounded-full rounded-br-none" />
          </div>
          {/* Bubble 3 */}
          <div className="absolute bottom-32 left-[20%] animate-float-fast opacity-10">
            <div className="w-20 h-20 bg-[#2F5CFF] rounded-full rounded-bl-none" />
          </div>
          {/* Bubble 4 */}
          <div className="absolute top-60 left-[5%] animate-float-medium opacity-15">
            <div className="w-8 h-8 bg-[#2F5CFF] rounded-full rounded-tl-none" />
          </div>
          {/* Bubble 5 */}
          <div className="absolute bottom-48 right-[10%] animate-float-slow opacity-20">
            <div className="w-14 h-14 bg-[#2F5CFF] rounded-full rounded-tr-none" />
          </div>
          {/* Bubble 6 */}
          <div className="absolute top-32 right-[30%] animate-float-fast opacity-10">
            <div className="w-10 h-10 bg-[#2F5CFF] rounded-full rounded-bl-none" />
          </div>
        </div>

        <div className="text-center relative z-10">
          {/* Animated 404 with chat bubble styling */}
          <div className="relative inline-block mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#2F5CFF] rounded-full rounded-bl-none flex items-center justify-center animate-bounce-gentle">
                  <span className="text-4xl sm:text-5xl font-bold text-white">4</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-full flex items-center justify-center animate-bounce-gentle-delayed border-4 border-[#2F5CFF]">
                  <span className="text-4xl sm:text-5xl font-bold text-[#2F5CFF]">0</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#2F5CFF] rounded-full rounded-br-none flex items-center justify-center animate-bounce-gentle">
                  <span className="text-4xl sm:text-5xl font-bold text-white">4</span>
                </div>
              </div>
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Oops! No feedback here
          </h1>
          <p className="mt-4 text-lg leading-7 text-gray-600 max-w-md mx-auto">
            Looks like this page left without leaving a review. Let's get you back on track.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#2F5CFF] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#2548CC] transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F5CFF]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Home
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#2F5CFF] transition-colors"
            >
              Need help?
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Popular pages</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/features" className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-[#2F5CFF] hover:text-white transition-all">
                Features
              </Link>
              <Link to="/pricing" className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-[#2F5CFF] hover:text-white transition-all">
                Pricing
              </Link>
              <Link to="/demo" className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-[#2F5CFF] hover:text-white transition-all">
                Book a Demo
              </Link>
              <Link to="/help" className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-[#2F5CFF] hover:text-white transition-all">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 3s ease-in-out infinite;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        .animate-bounce-gentle-delayed {
          animation: bounce-gentle 2s ease-in-out infinite 0.3s;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
