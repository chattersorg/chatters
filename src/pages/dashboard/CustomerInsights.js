import React, { useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import CustomerInsightsTab from '../../components/dashboard/reports/CustomerInsightsTab';

const CustomerInsightsPage = () => {
  usePageTitle('Satisfaction');
  const { venueId } = useVenue();
  const [timeframe, setTimeframe] = useState('last14');

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Satisfaction</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rating distribution and table performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last14">Last 14 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="all">All-time</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <CustomerInsightsTab venueId={venueId} timeframe={timeframe} />
      </div>
    </div>
  );
};

export default CustomerInsightsPage;