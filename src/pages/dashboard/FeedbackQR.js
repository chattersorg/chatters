import React from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import QRCodeSection from '../../components/dashboard/feedback/QRCodeSection';

const FeedbackQRPage = () => {
  usePageTitle('QR Code & Sharing');
  const { venueId } = useVenue();

  const feedbackUrl = `${window.location.origin}/feedback/${venueId}`;

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">QR Code & Sharing</h1>
        <p className="text-sm text-gray-500 mt-1">Generate QR codes and share feedback links with your customers</p>
      </div>

      <QRCodeSection feedbackUrl={feedbackUrl} venueId={venueId} />
    </div>
  );
};

export default FeedbackQRPage;
