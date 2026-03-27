import React from 'react';
import useOverviewStats from '../../../hooks/useOverviewStats';
import { useVenue } from '../../../context/VenueContext';
import { UnifiedMetricsRow } from '../layout/ModernCard';

// StatCard component removed - using MetricCard from ModernCard instead

const OverviewStats = ({ 
  multiVenueStats = null, 
  venueBreakdowns = {}, 
  allVenues = [], 
  isMultiSite = false,
  selectedVenues = [],
  onSelectionChange = () => {}
}) => {
  const { venueId } = useVenue();
  
  // Use passed multi-venue stats or fetch single venue stats
  const { stats: singleStats, loading: singleLoading } = useOverviewStats(venueId);
  
  const stats = isMultiSite ? multiVenueStats : singleStats;
  const loading = isMultiSite ? !multiVenueStats : singleLoading;
  // Show loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }


  // Prepare metrics for unified row
  const unifiedMetrics = [
    {
      title: "Today's Sessions",
      value: stats?.todaySessions || '0',
      trend: stats?.sessionsTrend,
      trendDirection: stats?.sessionsTrendDirection,
      comparisonText: 'compared to last week',
      sparklineData: stats?.sessionsSparkline || [],
      color: 'purple'
    },
    {
      title: 'Satisfaction Score',
      value: stats?.avgSatisfaction ? `${stats.avgSatisfaction}/5` : '--',
      trend: stats?.satisfactionTrend,
      trendDirection: stats?.satisfactionTrendDirection,
      comparisonText: 'compared to last week',
      sparklineData: stats?.satisfactionSparkline || [],
      color: 'orange'
    },
    {
      title: 'Avg Response Time',
      value: stats?.avgResponseTime || '--',
      trend: stats?.responseTimeTrend,
      trendDirection: stats?.responseTimeTrendDirection,
      comparisonText: 'compared to last week',
      sparklineData: stats?.responseTimeSparkline || [],
      color: 'green'
    },
    {
      title: 'Completion Rate',
      value: stats?.completionRate ? `${stats.completionRate}%` : '--',
      trend: stats?.completionTrend,
      trendDirection: stats?.completionTrendDirection,
      comparisonText: 'compared to last week',
      sparklineData: stats?.completionRateSparkline || [],
      color: 'blue'
    }
  ];

  // Prepare activity & alerts metrics for unified row
  const activityMetrics = [
    {
      title: 'Active Alerts',
      value: stats?.activeAlerts || '0',
      trend: stats?.alertsTrend,
      trendDirection: stats?.alertsTrendDirection,
      comparisonText: 'compared to last week',
      color: 'orange'
    },
    {
      title: 'Resolved Today',
      value: stats?.resolvedToday || '0',
      trend: stats?.resolvedTrend,
      trendDirection: stats?.resolvedTrendDirection,
      comparisonText: 'compared to last week',
      color: 'green'
    },
    {
      title: 'NPS Score',
      value: stats?.npsScore !== null && stats?.npsScore !== undefined ? stats.npsScore : '--',
      trend: stats?.npsTrend,
      trendDirection: stats?.npsTrendDirection,
      comparisonText: 'compared to last week',
      color: 'purple'
    },
    {
      title: "Today's Peak",
      value: stats?.peakHour || '--',
      comparisonText: `Last week: ${stats?.lastWeekPeakHour || 'N/A'}`,
      color: 'blue'
    }
  ];

  return (
    <div>
      {/* Today's Overview - Unified metrics row */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Overview</h2>
        <UnifiedMetricsRow metrics={unifiedMetrics} />
      </div>

      {/* Activity & Alerts - Unified metrics row */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity & Alerts</h2>
        <UnifiedMetricsRow metrics={activityMetrics} />
      </div>
    </div>
  );
};

export default OverviewStats;