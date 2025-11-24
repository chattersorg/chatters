import React, { useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { Button } from '../../ui/button';
import { useDarkMode } from '../../../context/DarkModeContext';
import { Moon, Sun } from 'lucide-react';

const ProfileTab = ({
  firstName, setFirstName,
  lastName, setLastName,
  email, setEmail,
  venueId
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);

  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const saveSettings = async () => {
    if (!venueId) return;

    setLoading(true);
    setMessage('');

    try {
      // Get current user ID
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Update users table (profile data)
      const userUpdates = {
        first_name: firstName,
        last_name: lastName,
      };

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userError) {
        throw userError;
      }

      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async () => {
    setPasswordResetLoading(true);
    setPasswordResetMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      setPasswordResetMessage('Password reset email sent! Please check your inbox (and spam folder).');
    } catch (error) {
      console.error('Error sending password reset:', error);
      setPasswordResetMessage(`Error: ${error.message}`);
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const sendEmailChangeVerification = async () => {
    if (!newEmail || !newEmail.trim()) {
      setEmailChangeMessage('Please enter a new email address');
      return;
    }

    if (newEmail.toLowerCase() === email.toLowerCase()) {
      setEmailChangeMessage('New email must be different from current email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailChangeMessage('Please enter a valid email address');
      return;
    }

    setEmailChangeLoading(true);
    setEmailChangeMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('send-email-change', {
        body: { currentEmail: email, newEmail: newEmail }
      });

      if (error) {
        console.error('Email change error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setEmailChangeMessage(`Verification email sent to ${newEmail}! Please check your inbox to confirm the change.`);
      setNewEmail('');
      setShowEmailChange(false);
    } catch (error) {
      console.error('Error sending email change:', error);
      setEmailChangeMessage(`Error: ${error.message}`);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Personal Information</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your name and email address</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-xs text-gray-500">Your display name</p>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-xs text-gray-500">Your login email address</p>
            </div>
            <div className="lg:col-span-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@example.com"
                  value={email}
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                />
                <Button
                  variant="primary"
                  onClick={() => setShowEmailChange(!showEmailChange)}
                >
                  Change
                </Button>
              </div>

              {showEmailChange && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <p className="text-sm text-blue-900 font-medium">Enter your new email address</p>
                  <p className="text-xs text-blue-700">
                    We'll send a verification link to the new email address. Your current email will remain active until you verify the new one.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="new@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Button
                      variant="primary"
                      onClick={sendEmailChangeVerification}
                      loading={emailChangeLoading}
                    >
                      {emailChangeLoading ? 'Sending...' : 'Send Verification'}
                    </Button>
                  </div>
                  <button
                    onClick={() => {
                      setShowEmailChange(false);
                      setNewEmail('');
                      setEmailChangeMessage('');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {emailChangeMessage && (
                <div className={`text-xs mt-2 p-3 rounded-lg ${
                  emailChangeMessage.includes('sent') || emailChangeMessage.includes('Verification')
                    ? 'text-green-700 bg-green-50 border border-green-200'
                    : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  {emailChangeMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Changes are saved to your account
            </div>
            <Button
              variant="primary"
              onClick={saveSettings}
              loading={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
          {message && (
            <div className={`text-xs p-2 rounded-lg mt-3 ${
              message.includes('success')
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Appearance Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your dashboard appearance</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose light or dark mode</p>
            </div>
            <div className="lg:col-span-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-between w-full sm:w-auto px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <>
                      <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium text-gray-900">Light Mode</span>
                    </>
                  )}
                </div>
                <div className={`ml-8 w-11 h-6 rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {isDarkMode ? 'Using dark mode for reduced eye strain' : 'Using light mode for better visibility'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password & Security Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Password & Security</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your password and security settings</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <p className="text-xs text-gray-500">Reset your account password</p>
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-600 mb-3">
                For security reasons, we'll send you an email with a link to reset your password.
              </p>
              <Button
                variant="primary"
                onClick={sendPasswordResetEmail}
                loading={passwordResetLoading}
              >
                {passwordResetLoading ? 'Sending...' : 'Send password reset email'}
              </Button>

              {passwordResetMessage && (
                <div className={`text-xs mt-3 p-3 rounded-lg ${
                  passwordResetMessage.includes('sent')
                    ? 'text-green-700 bg-green-50 border border-green-200'
                    : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  {passwordResetMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
