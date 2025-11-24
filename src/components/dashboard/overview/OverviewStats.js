import React from 'react';
import { TrendingUp, Users, Star, Clock, AlertTriangle, CheckCircle, Activity, Target } from 'lucide-react';
import useOverviewStats from '../../../hooks/useOverviewStats';
import { useVenue } from '../../../context/VenueContext';
import { MetricCard, SparklineMetricCard, ChartCard } from '../layout/ModernCard';

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


  return (
    <div>
      {/* Header */}
      <ChartCard
        title="Today's Overview"
        className="mb-8"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Sessions */}
          <SparklineMetricCard
            title="Today's Sessions"
            value={stats?.todaySessions || '0'}
            subtitle="Customer interactions"
            trend={stats?.sessionsTrend}
            trendDirection={stats?.sessionsTrendDirection}
            sparklineData={stats?.sessionsSparkline || []}
          />

          {/* Average Satisfaction */}
          <SparklineMetricCard
            title="Satisfaction Score"
            value={stats?.avgSatisfaction ? `${stats.avgSatisfaction}/5` : '--'}
            subtitle="Today's average"
            trend={stats?.satisfactionTrend}
            trendDirection={stats?.satisfactionTrendDirection}
            sparklineData={stats?.satisfactionSparkline || []}
          />

          {/* Response Time */}
          <SparklineMetricCard
            title="Avg Response Time"
            value={stats?.avgResponseTime || '--'}
            subtitle="To all feedback"
            trend={stats?.responseTimeTrend}
            trendDirection={stats?.responseTimeTrendDirection}
            sparklineData={stats?.responseTimeSparkline || []}
          />

          {/* Completion Rate */}
          <SparklineMetricCard
            title="Completion Rate"
            value={stats?.completionRate ? `${stats.completionRate}%` : '--'}
            subtitle="Issues resolved"
            trend={stats?.completionTrend}
            trendDirection={stats?.completionTrendDirection}
            sparklineData={stats?.completionRateSparkline || []}
          />

          {/* Active Alerts */}
          <MetricCard
            icon={AlertTriangle}
            title="Active Alerts"
            value={stats?.activeAlerts || '0'}
            subtitle="Requiring attention"
            color={stats?.activeAlerts > 0 ? 'red' : 'green'}
            venueBreakdowns={venueBreakdowns}
            allVenues={allVenues}
            field="activeAlerts"
          />

          {/* Resolved Today */}
          <MetricCard
            icon={CheckCircle}
            title="Resolved Today"
            value={stats?.resolvedToday || '0'}
            subtitle="Issues closed"
            color="green"
            venueBreakdowns={venueBreakdowns}
            allVenues={allVenues}
            field="resolvedToday"
          />

          {/* Current Activity */}
          <MetricCard
            icon={Activity}
            title="Current Activity"
            value={stats?.currentActivity || 'Low'}
            subtitle="Traffic level"
            color="indigo"
            venueBreakdowns={venueBreakdowns}
            allVenues={allVenues}
            field="currentActivity"
          />

          {/* Peak Hour */}
          <MetricCard
            icon={TrendingUp}
            title="Today's Peak"
            value={stats?.peakHour || '--'}
            subtitle="Busiest time"
            color="purple"
            venueBreakdowns={venueBreakdowns}
            allVenues={allVenues}
            field="peakHour"
          />
        </div>
      </ChartCard>
    </div>
  );
};

export default OverviewStats;