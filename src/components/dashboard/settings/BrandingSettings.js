import React, { useState } from 'react';
import { ColorPicker, Tooltip } from 'antd';
import { Button } from '../../ui/button';

const BrandingSettings = ({ logo, onLogoUpload, primaryColor, secondaryColor, onColorChange, colorsUpdated, onSaveColors, colorsMessage, loading }) => {
  const [locked, setLocked] = useState(true);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Branding Settings</h2>
        <Button
          variant="primary"
          onClick={() => setLocked(!locked)}
        >
          {locked ? 'Unlock' : 'Lock'}
        </Button>
      </div>
      <div className="flex items-center gap-6">
        {logo && (
          <img
            src={logo}
            alt="Venue Logo"
            className="max-w-[200px] max-h-[200px] object-contain"
          />
        )}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={onLogoUpload}
            className="hidden"
            id="logo-upload"
            disabled={locked}
          />
          <label
            htmlFor="logo-upload"
            className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium px-4 py-2 bg-[#2548CC] text-white hover:bg-[#1e3ba8] transition-colors cursor-pointer ${
              locked ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {loading ? 'Uploading...' : 'Upload Logo'}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Recommended size: 200x200 pixels
          </p>
        </div>
      </div>
      {colorsMessage && <p className="text-sm text-red-500 mt-2">{colorsMessage}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        {/* Primary Color */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Primary Color
            </label>
            <Tooltip title="Primary color is used for text on the feedback collection page.">
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </Tooltip>
          </div>
          <ColorPicker
            value={primaryColor}
            onChange={(color) => onColorChange('primary', color.toHexString())}
            disabled={locked}
          />
        </div>

        {/* Secondary Color */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Secondary Color
            </label>
            <Tooltip title="Secondary color is used for the background on the feedback collection page.">
              <span className="text-gray-400 cursor-help">ⓘ</span>
            </Tooltip>
          </div>
          <ColorPicker
            value={secondaryColor}
            onChange={(color) => onColorChange('secondary', color.toHexString())}
            disabled={locked}
          />
        </div>
      </div>
      {colorsUpdated && (
        <Button
          variant="primary"
          onClick={onSaveColors}
          loading={loading}
          disabled={locked}
          className="mt-4"
        >
          {loading ? 'Saving...' : 'Save Colors'}
        </Button>
      )}
      {colorsMessage && <p className="text-sm text-red-500 mt-2">{colorsMessage}</p>}
    </div>
  );
};

export default BrandingSettings;