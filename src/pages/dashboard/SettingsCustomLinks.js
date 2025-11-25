import React from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import CustomLinksTab from '../../components/dashboard/settings/CustomLinksTab';

const SettingsCustomLinksPage = () => {
  usePageTitle('Custom Links');
  const { venueId } = useVenue();

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Custom Action Links</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add links to your ordering, payment, and booking systems
        </p>
      </div>

      <CustomLinksTab venueId={venueId} />
    </div>
  );
};

export default SettingsCustomLinksPage;
