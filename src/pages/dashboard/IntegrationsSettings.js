import React from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import IntegrationsTab from '../../components/dashboard/settings/IntegrationsTab';

const IntegrationsSettingsPage = () => {
  usePageTitle('Integrations');
  const { venueId } = useVenue();

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">Connect external platforms to enhance your venue's online presence</p>
      </div>

      <IntegrationsTab />
    </div>
  );
};

export default IntegrationsSettingsPage;
