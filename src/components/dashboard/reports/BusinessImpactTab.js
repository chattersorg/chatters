// BusinessImpactTab.js — Ratings impact and progression metrics

import React, { useState } from 'react';
import GoogleRatingKPITile from './GoogleRatingKPITile';
import TripAdvisorRatingKPITile from './TripAdvisorRatingKPITile';
import RatingsTrendChart from './RatingsTrendChart';

const BusinessImpactTab = ({
  venueId,
  totalCount,
  recentCount,
  completionRate,
  alertsCount
}) => {
  const [timeframe, setTimeframe] = useState('last30');

  return (
    <div className="max-w-none">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white mb-1">Impact Analysis</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Measure the real-world impact of your feedback initiatives
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="last7">Last 7 Days</option>
              <option value="last14">Last 14 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Row 1: Ratings KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GoogleRatingKPITile venueId={venueId} />
          <TripAdvisorRatingKPITile venueId={venueId} />
          {/* Placeholder tiles to match the 4-column grid shown in your image */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 text-purple-600 dark:text-purple-400">⏱</div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                -45%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              2.3 hours
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Issue Resolution Time
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 text-green-600 dark:text-green-400">📈</div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                +0.3
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              4.6/5
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Overall Satisfaction
            </div>
          </div>
        </div>

        {/* Row 2: Ratings trend chart */}
        <div>
          <RatingsTrendChart venueId={venueId} timeframe={timeframe} />
        </div>
      </div>
    </div>
  );
};

export default BusinessImpactTab;