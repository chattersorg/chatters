import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2 } from 'lucide-react';
import { PermissionGate } from '../../../context/PermissionsContext';
import { supabase } from '../../../utils/supabase';

const QRCodeSection = ({ feedbackUrl, venueId }) => {
  const qrCodeRef = useRef(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  // Fetch venue logo and convert to base64 data URL to avoid CORS issues
  useEffect(() => {
    const fetchVenueLogo = async () => {
      if (!venueId) return;

      const { data, error } = await supabase
        .from('venues')
        .select('logo')
        .eq('id', venueId)
        .single();

      if (!error && data?.logo) {
        // Convert external URL to base64 data URL to avoid canvas tainting
        try {
          const response = await fetch(data.logo);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setLogoDataUrl(reader.result);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error('Failed to load logo for QR code:', err);
        }
      }
    };

    fetchVenueLogo();
  }, [venueId]);

  const downloadQRCode = () => {
    const qrCodeElement = qrCodeRef.current;
    if (!qrCodeElement) return;

    const canvas = qrCodeElement.querySelector('canvas');
    if (!canvas) return;

    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = 'feedback-qr-code.png';
    downloadLink.href = pngFile;
    downloadLink.click();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      // You might want to add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="w-full mb-6 lg:mb-8">
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Share this QR code or link with customers to collect feedback.
            </p>
          </div>
          <PermissionGate permission="qr.generate">
            <button
              onClick={downloadQRCode}
              className="w-full sm:w-auto bg-black dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
          {/* QR Code Container */}
          <div className="flex-shrink-0 p-4 lg:p-6 bg-gray-50 dark:bg-white rounded-lg border border-gray-200 dark:border-gray-700 mx-auto lg:mx-0" ref={qrCodeRef}>
            <QRCodeCanvas
              value={feedbackUrl}
              size={160}
              level="H"
              imageSettings={logoDataUrl ? {
                src: logoDataUrl,
                height: 40,
                width: 40,
                excavate: true,
              } : undefined}
            />
          </div>

          {/* Text and Link Container */}
          <div className="flex-1 w-full lg:w-auto">
            <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white mb-3">Share Feedback Link</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Customers can scan the QR code or visit the link below to leave feedback about their experience.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    <a
                      href={feedbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-900 dark:text-gray-200 hover:text-black dark:hover:text-white break-all"
                    >
                      {feedbackUrl}
                    </a>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="w-full sm:w-auto text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-4 lg:mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-medium text-blue-900 dark:text-blue-300 mb-2 lg:mb-3">Usage Tips</h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <p>• Print the QR code and place it on tables, receipts, or near your entrance</p>
          <p>• Share the link via email, social media, or your website</p>
          <p>• The QR code works on all smartphones with camera apps</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeSection;