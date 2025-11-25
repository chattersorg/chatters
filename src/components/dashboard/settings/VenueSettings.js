import React, { useState } from 'react';
import { Button } from '../../ui/button';

const VenueSettings = ({ name, tableCount, address, onNameChange, onTableCountChange, onAddressChange, loading }) => {
  const [locked, setLocked] = useState(true);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Venue Settings</h2>
        <Button
          variant="primary"
          onClick={() => setLocked(!locked)}
        >
          {locked ? 'Unlock' : 'Lock'}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name</label>
          <input
            type="text"
            value={name}
            onChange={onNameChange}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={locked || loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Table Count</label>
          <input
            type="number"
            value={tableCount}
            onChange={onTableCountChange}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={locked || loading}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Address Line 1"
              value={address.line1}
              onChange={(e) => onAddressChange({ ...address, line1: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked || loading}
            />
            <input
              type="text"
              placeholder="Address Line 2"
              value={address.line2}
              onChange={(e) => onAddressChange({ ...address, line2: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked || loading}
            />
            <input
              type="text"
              placeholder="City"
              value={address.city}
              onChange={(e) => onAddressChange({ ...address, city: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked || loading}
            />
            <input
              type="text"
              placeholder="County"
              value={address.county}
              onChange={(e) => onAddressChange({ ...address, county: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked || loading}
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={address.postalCode}
              onChange={(e) => onAddressChange({ ...address, postalCode: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked || loading}
            />
            <input
              type="text"
              placeholder="Country"
              value={address.country}
              onChange={(e) => onAddressChange({ ...address, country: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked || loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueSettings;