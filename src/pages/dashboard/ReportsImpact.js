import React, { useState } from 'react';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import GoogleRatingKPITile from '../../components/dashboard/reports/GoogleRatingKPITile';
import TripAdvisorRatingKPITile from '../../components/dashboard/reports/TripAdvisorRatingKPITile';
import RatingsTrendChart from '../../components/dashboard/reports/RatingsTrendChart';
// Removed unused icon imports

const ReportsImpactPage = () => {
  usePageTitle('Impact Reports');
  const { venueId } = useVenue();
  const [timeframe, setTimeframe] = useState('last14');

  // Removed static metrics to focus on real ratings data

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ChartCard
        title="Impact Analysis"
        subtitle="Measure the real-world impact of your feedback initiatives"
        actions={
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last14">Last 14 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="all">All-time</option>
            </select>
          </div>
        }
      >
        <div className="space-y-6 lg:space-y-8">
          {/* Row 1: Ratings KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-1 h-full">
              <GoogleRatingKPITile venueId={venueId} />
            </div>
            <div className="lg:col-span-1 h-full">
              <TripAdvisorRatingKPITile venueId={venueId} />
            </div>
          </div>

          {/* Row 2: Ratings trend chart */}
          <div>
            <RatingsTrendChart venueId={venueId} timeframe={timeframe} />
          </div>
        </div>
      </ChartCard>
    </div>
  );
};

export default ReportsImpactPage;