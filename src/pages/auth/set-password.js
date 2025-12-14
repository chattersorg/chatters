import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { getMarketingUrl } from '../../utils/domainUtils';

const SetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formReady, setFormReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationToken, setInvitationToken] = useState(null);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [isTokenBased, setIsTokenBased] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const validateInvitation = async () => {
      // First, check for new token-based invitation
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (token) {
        // New token-based invitation flow
        setIsTokenBased(true);
        setInvitationToken(token);

        try {
          // Validate token via API endpoint
          const response = await fetch('/api/validate-invitation-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });

          const data = await response.json();

          if (!response.ok || !data.valid) {
            setError(data.message || 'Invalid or expired invitation link.');
            setIsLoading(false);
            return;
          }

          // Token is valid, store email and show form
          setInvitationEmail(data.email);
          setFormReady(true);
          setIsLoading(false);
        } catch (err) {
          console.error('Error validating token:', err);
          setError('Failed to validate invitation. Please try again.');
          setIsLoading(false);
        }
        return;
      }

      // Fallback to old Supabase Auth hash-based invitation flow
      const hash = window.location.hash.substring(1); // Remove '#'
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      // Check if this is an invite link
      if (type !== 'invite') {
        setError('Invalid invitation link. This page is for invited users only.');
        setIsLoading(false);
        return;
      }

      if (!accessToken || !refreshToken) {
        setError('Invalid or missing token.');
        setIsLoading(false);
        return;
      }

      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setError('Token session failed.');
          } else {
            setFormReady(true);
          }
          setIsLoading(false);
        });
    };

    validateInvitation();
  }, []);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isTokenBased) {
        // New token-based invitation flow
        const response = await fetch('/api/create-account-from-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: invitationToken,
            password
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('[SetPassword] Token-based account creation error:', data);
          setError(data.message || 'Failed to create account. Please try again or request a new invitation.');
          setIsSubmitting(false);
          return;
        }

        setMessage('Account created successfully! Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        // Old Supabase Auth flow
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          console.error('[SetPassword] Password update error:', error.message);
          setError('Failed to set password. Please try again.');
          setIsSubmitting(false);
        } else {
          setMessage('Password successfully set! Redirecting...');
          setTimeout(() => navigate('/signin'), 2000);
        }
      }
    } catch (err) {
      console.error('[SetPassword] Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back to website link */}
      <div className="p-6">
        <a
          href={getMarketingUrl()}
          className="text-gray-500 hover:text-gray-700 flex items-center transition-colors text-sm font-medium"
        >
          <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
          Back to website
        </a>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={getMarketingUrl('/img/logo/chatters-logo-2025.svg')}
              alt="Chatters"
              className="h-8 w-auto"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Set your password
            </h1>
            <p className="text-gray-500">
              Create a password for your account
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#4E74FF]" />
              <span className="ml-3 text-gray-600">Validating invitation...</span>
            </div>
          )}

          {/* Form */}
          {!isLoading && formReady && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4E74FF] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4E74FF] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#4E74FF] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#2F5CFF] focus:outline-none focus:ring-2 focus:ring-[#4E74FF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Setting Password...
                  </>
                ) : (
                  'Set Password'
                )}
              </button>
            </form>
          )}

          {/* Back to sign in link */}
          <div className="mt-6 text-center">
            <Link to="/signin" className="text-sm font-medium text-[#4E74FF] hover:text-[#2F5CFF]">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;
