import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const navigate = useNavigate();
  
  const handleSignUp = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  if (password !== confirmPassword) {
    setError('Passwords do not match.');
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch('/api/create-trial-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, venueName }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error);

    navigate('/dashboard'); // or show success screen
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 p-6 md:p-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Sign Up</h2>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Join Chatters and start transforming customer feedback into actionable insights.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="first-name"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 md:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                  required
                />
              </div>

              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last-name"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 md:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="venue-name" className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name
              </label>
              <input
                type="text"
                id="venue-name"
                placeholder="Enter your venue name"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-4 py-2 md:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 md:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 md:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 md:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="monthly"
                    checked={subscriptionType === 'monthly'}
                    onChange={() => setSubscriptionType('monthly')}
                    className="mr-2"
                  />
                  Monthly
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="yearly"
                    checked={subscriptionType === 'yearly'}
                    onChange={() => setSubscriptionType('yearly')}
                    className="mr-2"
                  />
                  Yearly
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 md:px-6 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
            >
              {isLoading ? 'Loading...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;