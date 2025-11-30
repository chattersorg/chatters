import React from 'react';

const MobileNotice = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Desktop Required
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          Floor plan editing works best on desktop and tablet devices. Please use a larger screen to design your layout.
        </p>

        {/* Features list */}
        <div className="text-left mb-8 space-y-3">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Drag and drop table positioning
          </div>
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Multi-zone layout management
          </div>
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save and load layouts from your account
          </div>
        </div>

        {/* Minimum screen size info */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Recommended:</strong> Screen width of at least 1024px for the best experience
          </p>
        </div>

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="w-full bg-gray-900 dark:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default MobileNotice;