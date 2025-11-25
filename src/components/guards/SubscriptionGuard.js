import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

/**
 * SubscriptionGuard
 *
 * Checks if the user's account has an active subscription or valid trial.
 * If not, redirects to the trial-expired page.
 *
 * Allows access if:
 * - Account is paid (is_paid = true)
 * - Account has an active trial (trial_ends_at > now)
 * - User is an admin (admins bypass this check)
 * - Account is a demo account
 */
const SubscriptionGuard = ({ children }) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'active' | 'expired' | 'error'
  const location = useLocation();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Not logged in - redirect to signin
        setStatus('no_session');
        return;
      }

      // Check for impersonation - impersonating users bypass subscription check
      const impersonationData = localStorage.getItem('impersonation');
      if (impersonationData) {
        setStatus('active');
        return;
      }

      // Get user's role and account info
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          role,
          account_id,
          accounts (
            id,
            is_paid,
            trial_ends_at,
            demo_account
          )
        `)
        .eq('id', session.user.id)
        .single();

      if (userError || !user) {
        console.error('Error fetching user for subscription check:', userError);
        setStatus('error');
        return;
      }

      // Admins bypass subscription check
      if (user.role === 'admin') {
        setStatus('active');
        return;
      }

      let account = user.accounts;

      // For managers without direct account_id, get account through staff table
      if (!account && user.role === 'manager') {
        const { data: staffRow } = await supabase
          .from('staff')
          .select('venues!inner(accounts(id, is_paid, trial_ends_at, demo_account))')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();

        account = staffRow?.venues?.accounts;
      }

      // No account linked - this shouldn't happen but allow access
      if (!account) {
        console.warn('User has no account linked');
        setStatus('active');
        return;
      }

      // Demo accounts bypass subscription check
      if (account.demo_account) {
        setStatus('active');
        return;
      }

      // Paid accounts have access
      if (account.is_paid) {
        setStatus('active');
        return;
      }

      // Check trial status
      if (account.trial_ends_at) {
        const trialEnd = new Date(account.trial_ends_at);
        const now = new Date();

        if (trialEnd > now) {
          // Trial is still active
          setStatus('active');
          return;
        }
        // Trial has expired - block access
        setStatus('expired');
        return;
      }

      // No trial_ends_at set and not paid - this is unusual, allow access
      // (Account may be in setup or have a different billing arrangement)
      console.warn('Account has no trial_ends_at set and is not paid');
      setStatus('active');

    } catch (error) {
      console.error('Error checking subscription status:', error);
      setStatus('error');
    }
  };

  // While checking, show a loading state (or nothing to avoid flash)
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to signin
  if (status === 'no_session') {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If subscription expired, redirect to trial-expired page
  if (status === 'expired') {
    // Preserve the intended destination for after upgrade
    return <Navigate to="/trial-expired" state={{ from: location }} replace />;
  }

  // On error, allow access but log the issue (fail open)
  if (status === 'error') {
    console.warn('Subscription check failed, allowing access');
  }

  // Active subscription or trial - render children
  return children;
};

export default SubscriptionGuard;
