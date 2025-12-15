// QRCodeTab.js - QR code generation and sharing

import React from 'react';
import QRCodeSection from './QRCodeSection';

const QRCodeTab = ({ feedbackUrl, venueId }) => {
  return (
    <div className="max-w-none">
      <div className="mb-6">
        <h2 className="text-base lg:text-lg font-medium text-gray-900 mb-1">QR Code & Sharing</h2>
        <p className="text-sm text-gray-600">
          Generate and download QR codes for customers to access your feedback form
        </p>
      </div>

      <QRCodeSection feedbackUrl={feedbackUrl} venueId={venueId} />
    </div>
  );
};

export default QRCodeTab;