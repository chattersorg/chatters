import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { getMarketingUrl } from '../../utils/domainUtils';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const VerifyEmailChange = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmailChange(token);
  }, [searchParams]);

  const verifyEmailChange = async (token) => {
    try {
      setStatus('verifying');
      setMessage('Verifying your new email address...');

      // Validate the token and get the email change request
      const { data: request, error: fetchError } = await supabase
        .from('email_change_requests')
        .select('*')
        .eq('token', token)
        .single();

      if (fetchError || !request) {
        setStatus('error');
        setMessage('Invalid or expired verification link.');
        return;
      }

      // Check if already verified
      if (request.verified) {
        setStatus('error');
        setMessage('This email change has already been verified.');
        return;
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(request.expires_at);
      if (now > expiresAt) {
        setStatus('expired');
        setMessage('This verification link has expired. Please request a new email change.');
        return;
      }

      setNewEmail(request.new_email);

      // Update the user's email in both auth.users and users table
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        request.user_id,
        { email: request.new_email }
      );

      if (updateAuthError) {
        // If admin update fails, try using service role directly via edge function
        const { data, error: edgeFunctionError } = await supabase.functions.invoke('verify-email-change', {
          body: { token }
        });

        if (edgeFunctionError) {
          console.error('Error updating email:', edgeFunctionError);
          setStatus('error');
          setMessage('Failed to update email address. Please contact support.');
          return;
        }

        if (!data.success) {
          setStatus('error');
          setMessage(data.error || 'Failed to update email address.');
          return;
        }
      } else {
        // Also update the users table
        const { error: updateUsersError } = await supabase
          .from('users')
          .update({ email: request.new_email })
          .eq('id', request.user_id);

        if (updateUsersError) {
          console.error('Error updating users table:', updateUsersError);
        }

        // Mark the request as verified
        const { error: markVerifiedError } = await supabase
          .from('email_change_requests')
          .update({
            verified: true,
            verified_at: new Date().toISOString()
          })
          .eq('token', token);

        if (markVerifiedError) {
          console.error('Error marking request as verified:', markVerifiedError);
        }
      }

      setStatus('success');
      setMessage('Your email address has been successfully updated!');

      // Redirect to account profile after 3 seconds
      setTimeout(() => {
        navigate('/account/profile');
      }, 3000);

    } catch (error) {
      console.error('Error in verifyEmailChange:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again or contact support.');
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

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <Loader2 className="w-16 h-16 text-[#4E74FF] animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
            {(status === 'error' || status === 'expired') && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'verifying' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'expired' && 'Link Expired'}
            </h1>
            <p className="text-gray-500">
              {message}
            </p>
          </div>

          {/* Success message with new email */}
          {status === 'success' && newEmail && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 text-center">
                Your new email address is now:
              </p>
              <p className="text-green-700 font-semibold text-center mt-1">
                {newEmail}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Redirecting you to your account profile in a few seconds...
                </p>
                <button
                  onClick={() => navigate('/account/profile')}
                  className="w-full bg-[#4E74FF] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#2F5CFF] focus:outline-none focus:ring-2 focus:ring-[#4E74FF] focus:ring-offset-2 transition-colors"
                >
                  Go to Account Profile
                </button>
              </>
            )}

            {(status === 'error' || status === 'expired') && (
              <>
                <button
                  onClick={() => navigate('/account/profile')}
                  className="w-full bg-[#4E74FF] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#2F5CFF] focus:outline-none focus:ring-2 focus:ring-[#4E74FF] focus:ring-offset-2 transition-colors"
                >
                  Back to Account Settings
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4E74FF] focus:ring-offset-2 transition-colors"
                >
                  Go to Dashboard
                </button>
              </>
            )}

            {status === 'verifying' && (
              <p className="text-sm text-gray-500 text-center">
                Please wait while we verify your email address...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailChange;
