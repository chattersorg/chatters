import React from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import BillingTab from '../../components/dashboard/settings/BillingTab';

const AccountBillingPage = () => {
  usePageTitle('Billing & Subscription');
  const { venueId } = useVenue();

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your subscription, billing details, and payment methods</p>
      </div>

      <BillingTab />
    </div>
  );
};

export default AccountBillingPage;