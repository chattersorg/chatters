// src/pages/SignIn.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { getMarketingUrl } from '../../utils/domainUtils';

// Ensures there's a row in public.users so role checks don't fail on first login.
// Adjust the inserted default role if you prefer something else.
async function ensureUsersRow(user) {
  // Try to read existing row
  const { data, error, status } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!error && data) return data;

  // If not found or blocked by RLS, attempt to create a minimal row.
  // Requires an INSERT policy (or do this via your admin API).
  const { data: inserted, error: insertErr } = await supabase
    .from('users')
    .insert([{ id: user.id, email: user.email, role: 'master' }]) // default role you want
    .select('id, role')
    .single();

  if (insertErr) {
    // If insert fails due to RLS, we'll fall back to email-domain admin check later.
    // Surface the error for observability but don't throw to avoid blocking login.
    console.warn('[SignIn] ensureUsersRow insert failed:', insertErr);
    return { id: user.id, role: null };
  }

  return inserted;
}

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('chatters_remember_email');
    const rememberMeEnabled = localStorage.getItem('chatters_remember_me') === 'true';

    if (rememberMeEnabled && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 🔑 1) Store remember me preference + email
      if (rememberMe) {
        localStorage.setItem('chatters_remember_email', email);
        localStorage.setItem('chatters_remember_me', 'true');
      } else {
        localStorage.removeItem('chatters_remember_email');
        localStorage.removeItem('chatters_remember_me');
      }

      // 2) Attempt sign in
      console.log('[SignIn] Starting sign in...');
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInErr) throw new Error(signInErr.message);
      console.log('[SignIn] Sign in successful');

      // 3) Get user
      console.log('[SignIn] Getting user...');
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('No authenticated user returned');
      console.log('[SignIn] User retrieved:', user.id);

      // 4) Ensure users row exists, then read role
      console.log('[SignIn] Ensuring users row...');
      const ensured = await Promise.race([
        ensureUsersRow(user),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout checking user role')), 5000)
        )
      ]);
      console.log('[SignIn] Users row ensured:', ensured);
      const role = ensured?.role ?? null;

      // 5) Admin fallback by email domain
      const isAdminByEmail = (user.email || '').toLowerCase().endsWith('@getchatters.com');
      const isAdmin = role === 'admin' || isAdminByEmail;
      console.log('[SignIn] Role determined:', { role, isAdmin });

      // 6) If remember me is NOT checked, set up a session that expires when browser closes
      // We do this by storing a flag that App.js will check on load
      if (!rememberMe) {
        sessionStorage.setItem('chatters_temp_session', 'true');
      }

      // 7) Route to dashboard/admin
      console.log('[SignIn] Navigating to:', isAdmin ? '/admin' : '/dashboard');
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      console.error('[SignIn] Error:', err);
      setError(err.message || 'Sign-in failed');
    } finally {
      setIsLoading(false);
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
              Welcome back
            </h1>
            <p className="text-gray-500">
              Sign in to your account
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4E74FF] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#4E74FF] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#4E74FF] focus:ring-[#4E74FF] border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm font-medium text-[#4E74FF] hover:text-[#2F5CFF]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4E74FF] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#2F5CFF] focus:outline-none focus:ring-2 focus:ring-[#4E74FF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
