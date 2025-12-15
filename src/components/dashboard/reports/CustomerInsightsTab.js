// CustomerInsightsTab.js - Detailed customer feedback analysis

import React from 'react';
import RatingDistributionTile from './RatingDistributionTile';
import TablePerformanceRankingTile from './TablePerformanceRankingTile';

const CustomerInsightsTab = ({ venueId, timeframe }) => {
  return (
    <div className="max-w-none">
      <div className="space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <RatingDistributionTile 
            venueId={venueId}
            timeframe={timeframe}
          />
          
          <TablePerformanceRankingTile 
            venueId={venueId}
            timeframe={timeframe}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerInsightsTab;