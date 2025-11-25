import React, { useState } from 'react';
import { Button } from '../../ui/button';

const NotificationsTab = ({ 
  saveSettings,
  loading,
  message 
}) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <div className="max-w-none lg:max-w-2xl">
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600 text-sm">Manage your notification preferences. This does NOT do anything at the moment</p>
      </div>

      <div className="space-y-4 lg:space-y-6">
        {/* Email Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 space-y-2 sm:space-y-0">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">Receive notifications via email</p>
          </div>
          <div className="flex-shrink-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-custom-blue"></div>
            </label>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 space-y-2 sm:space-y-0">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-700">SMS Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">Receive notifications via SMS</p>
          </div>
          <div className="flex-shrink-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-custom-blue"></div>
            </label>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 space-y-2 sm:space-y-0">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-700">Push Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">Receive browser push notifications</p>
          </div>
          <div className="flex-shrink-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-custom-blue"></div>
            </label>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-start">
            <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                Notification Settings
              </h3>
              <div className="text-sm text-yellow-700">
                <p>
                  These settings control how you receive alerts about feedback and important venue updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Notification Types</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>New customer feedback and reviews</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>System updates and maintenance notices</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Billing and subscription updates</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Feature announcements and tips</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={saveSettings}
            loading={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`text-sm p-3 rounded-md ${
            message.includes('success') 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;