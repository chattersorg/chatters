// ImpactDashboardTab.js - Ratings impact and progression metrics

import React from 'react';
import GoogleRatingKPITile from './GoogleRatingKPITile';
import TripAdvisorRatingKPITile from './TripAdvisorRatingKPITile';
import RatingsTrendChart from './RatingsTrendChart';

const ImpactDashboardTab = ({
  venueId,
  timeframe
}) => {
  return (
    <div className="max-w-none">
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
    </div>
  );
};

export default ImpactDashboardTab;