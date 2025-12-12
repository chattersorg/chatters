import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

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
          setIsLoading(false);
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
          setIsLoading(false);
        } else {
          setMessage('Password successfully set! Redirecting...');
          setTimeout(() => navigate('/signin'), 2000);
        }
      }
    } catch (err) {
      console.error('[SetPassword] Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-100 via-orange-100 to-purple-100 flex items-center justify-center p-4 sm:p-6">
      {/* Mobile Layout - Dark theme with spacing */}
      <div className="lg:hidden w-full bg-gray-900 rounded-2xl shadow-2xl flex flex-col min-h-[80vh] my-8">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6">
          <a
            href={getMarketingUrl()}
            className="text-gray-300 hover:text-white flex items-center transition-colors text-sm"
          >
            <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
            Back to website
          </a>
        </div>
        
        {/* Mobile Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={getMarketingUrl('/img/Logo.svg')}
            alt="Chatters Logo"
            className="h-8 w-auto filter invert brightness-0 invert"
          />
        </div>

        {/* Mobile Form */}
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 text-center">
                Set Your Password
              </h2>
              <p className="text-gray-300 text-center text-sm">
                Enter a new password for your account
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                {message}
              </div>
            )}

            {!isLoading && formReady && (
              <form onSubmit={handleSetPassword} className="space-y-6">
                <div>
                  <label htmlFor="password-mobile" className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password-mobile"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword-mobile" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword-mobile"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
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

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <span className="ml-3 text-white">Validating reset link...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout - Original design */}
      <div className="hidden lg:block w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Panel - Brand */}
          <div className="w-full lg:w-1/2 bg-white p-6 sm:p-8 lg:p-12 flex flex-col justify-center relative">
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
              <a
                href={getMarketingUrl()}
                className="text-gray-600 hover:text-gray-900 flex items-center transition-colors text-sm"
              >
                <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
                Back to website
              </a>
            </div>

            <div className="mb-6 lg:mb-8 mt-12 sm:mt-8 lg:mt-0">
              <div className="flex items-center mb-4 lg:mb-6">
                <img
                  src={getMarketingUrl('/img/Logo.svg')}
                  alt="Chatters Logo"
                  className="h-6 sm:h-8 w-auto"
                />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4 leading-tight">
                  Set your new password
                </h1>
                <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
                  Create a secure password for your account to complete the setup process.
                </p>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center text-gray-600 text-sm lg:text-base">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                <span>Secure password setup</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm lg:text-base">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                <span>Encrypted data protection</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm lg:text-base">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                <span>Instant account activation</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-full lg:w-1/2 bg-gray-900 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-6 lg:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Set Your Password
                </h2>
                <p className="text-gray-300 text-sm">
                  Enter a new password for your account
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                  {message}
                </div>
              )}

              {!isLoading && formReady && (
                <form onSubmit={handleSetPassword} className="space-y-4 lg:space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 pr-12 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 pr-12 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
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

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="ml-3 text-white">Validating reset link...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;
