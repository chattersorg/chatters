import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'verifying' && (
              <Loader className="w-16 h-16 text-blue-600 mx-auto animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            )}
            {(status === 'error' || status === 'expired') && (
              <XCircle className="w-16 h-16 text-red-600 mx-auto" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'expired' && 'Link Expired'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {status === 'success' && newEmail && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Your new email address is now:
              </p>
              <p className="text-green-900 font-semibold mt-1">
                {newEmail}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <>
                <p className="text-sm text-gray-500">
                  Redirecting you to your account profile in a few seconds...
                </p>
                <button
                  onClick={() => navigate('/account/profile')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Go to Account Profile
                </button>
              </>
            )}

            {(status === 'error' || status === 'expired') && (
              <>
                <button
                  onClick={() => navigate('/account/profile')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Back to Account Settings
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  Go to Dashboard
                </button>
              </>
            )}

            {status === 'verifying' && (
              <p className="text-sm text-gray-500">
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
