// AlertModal.js - Reusable alert modal component for validation messages

import React from 'react';

const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'error', // 'error', 'warning', 'info', 'success'
  buttonText = 'OK'
}) => {
  if (!isOpen) return null;

  const getIconComponent = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-custom-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-custom-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-custom-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.95-.833-2.72 0L4.094 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default: // 'error'
        return (
          <svg className="w-6 h-6 text-custom-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  const getIconBgClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      default: // 'error'
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  const getButtonClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-custom-green hover:bg-custom-green-hover';
      case 'info':
        return 'bg-custom-blue hover:bg-custom-blue-hover';
      case 'warning':
        return 'bg-custom-yellow hover:bg-custom-yellow-hover';
      default: // 'error'
        return 'bg-custom-red hover:bg-custom-red-hover';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md border border-gray-200 dark:border-gray-800">
        <div className="p-4 lg:p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 ${getIconBgClasses()} rounded-full flex items-center justify-center flex-shrink-0`}>
              {getIconComponent()}
            </div>
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {title}
                </h3>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {typeof message === 'string' ? (
                  <p>{message}</p>
                ) : (
                  message
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 lg:px-6 py-2 lg:py-3 text-white rounded-md text-sm lg:text-base font-medium ${getButtonClasses()}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;