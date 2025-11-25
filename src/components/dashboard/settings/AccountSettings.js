import React, { useState } from 'react';
import { Button } from '../../ui/button';

const AccountSettings = ({ name, email, firstName, lastName, onNameChange, onEmailChange, onFirstNameChange, onLastNameChange, profileMessage }) => {
  const [locked, setLocked] = useState(true);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
        <Button
          variant="primary"
          onClick={() => setLocked(!locked)}
        >
          {locked ? 'Unlock' : 'Lock'}
        </Button>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={onNameChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={onEmailChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={onFirstNameChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={onLastNameChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={locked}
            />
          </div>
        </div>
      </form>
      {profileMessage && <p className="text-sm text-red-500 mt-2">{profileMessage}</p>}
    </div>
  );
};

export default AccountSettings;