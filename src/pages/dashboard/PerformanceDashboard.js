import React, { useState, useEffect } from 'react';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import PerformanceDashboardTab from '../../components/dashboard/reports/PerformanceDashboardTab';
import FilterSelect from '../../components/ui/FilterSelect';

const PerformanceDashboardPage = () => {
  usePageTitle('Performance Dashboard');
  const { venueId } = useVenue();
  const [timeframe, setTimeframe] = useState('last14');

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ChartCard
        title="Performance Dashboard"
        subtitle="Track key performance metrics and trends"
        actions={
          <FilterSelect
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'last7', label: 'Last 7 Days' },
              { value: 'last14', label: 'Last 14 Days' },
              { value: 'last30', label: 'Last 30 Days' },
              { value: 'all', label: 'All-time' }
            ]}
          />
        }
      >
        <PerformanceDashboardTab venueId={venueId} timeframe={timeframe} />
      </ChartCard>
    </div>
  );
};

export default PerformanceDashboardPage;