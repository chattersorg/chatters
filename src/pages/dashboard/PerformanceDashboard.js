import React, { useState } from 'react';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import PerformanceDashboardTab from '../../components/dashboard/reports/PerformanceDashboardTab';
import DateRangeFilter from '../../components/ui/DateRangeFilter';

const PerformanceDashboardPage = () => {
  usePageTitle('Performance Dashboard');
  const { venueId } = useVenue();
  const [dateFilter, setDateFilter] = useState({ preset: 'last14' });

  if (!venueId) {
    return null;
  }

  // Convert dateFilter to timeframe format for child components
  const getTimeframeProps = () => {
    if (dateFilter.preset === 'custom') {
      return {
        timeframe: 'custom',
        fromDate: dateFilter.from,
        toDate: dateFilter.to
      };
    }
    return { timeframe: dateFilter.preset };
  };

  return (
    <div className="space-y-6">
      <ChartCard
        title="Performance Dashboard"
        subtitle="Track key performance metrics and trends"
        actions={
          <DateRangeFilter
            value={dateFilter}
            onChange={setDateFilter}
          />
        }
      >
        <PerformanceDashboardTab venueId={venueId} {...getTimeframeProps()} />
      </ChartCard>
    </div>
  );
};

export default PerformanceDashboardPage;