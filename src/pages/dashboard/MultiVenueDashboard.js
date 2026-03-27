import React, { useState, useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { BarChart3, LayoutGrid, ChevronDown, BarChart2 } from 'lucide-react';
import VenueSelectorFilter from '../../components/ui/VenueSelectorFilter';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import MultiVenueMetricCard from '../../components/dashboard/layout/MultiVenueMetricCard';
import MultiVenueNPSCard from '../../components/dashboard/layout/MultiVenueNPSCard';
import useMultiVenueOverviewStats from '../../hooks/useMultiVenueOverviewStats';
import useMultiVenueNPSStats from '../../hooks/useMultiVenueNPSStats';

// Reusable section header with controls and collapse toggle
const SectionHeader = ({ title, viewMode, onViewModeChange, dateRange, onDateRangeChange, isCollapsed, onToggleCollapse }) => (
  <div className="flex items-center justify-between h-10">
    <button
      onClick={onToggleCollapse}
      className="flex items-center gap-2 text-left group"
    >
      <ChevronDown
        className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform duration-200 ${
          isCollapsed ? '-rotate-90' : ''
        }`}
      />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
        {title}
      </h2>
    </button>
    {!isCollapsed && (
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onViewModeChange('chart')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'chart'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Chart</span>
          </button>
          <button
            onClick={() => onViewModeChange('kpi')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'kpi'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>KPI</span>
          </button>
        </div>

        <DateRangeFilter
          value={dateRange}
          onChange={onDateRangeChange}
        />
      </div>
    )}
  </div>
);

// NPS section header with Bar option
const NPSSectionHeader = ({ title, viewMode, onViewModeChange, dateRange, onDateRangeChange, isCollapsed, onToggleCollapse }) => (
  <div className="flex items-center justify-between h-10">
    <button
      onClick={onToggleCollapse}
      className="flex items-center gap-2 text-left group"
    >
      <ChevronDown
        className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform duration-200 ${
          isCollapsed ? '-rotate-90' : ''
        }`}
      />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
        {title}
      </h2>
    </button>
    {!isCollapsed && (
      <div className="flex items-center gap-2">
        {/* View Mode Toggle with Bar option */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onViewModeChange('chart')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'chart'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Chart</span>
          </button>
          <button
            onClick={() => onViewModeChange('bar')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'bar'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Bar</span>
          </button>
          <button
            onClick={() => onViewModeChange('kpi')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'kpi'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>KPI</span>
          </button>
        </div>

        <DateRangeFilter
          value={dateRange}
          onChange={onDateRangeChange}
        />
      </div>
    )}
  </div>
);

const MultiVenueDashboard = () => {
  usePageTitle('Multi-Venue Dashboard');
  const { allVenues } = useVenue();

  // Initialize with all venue IDs selected
  const [selectedVenueIds, setSelectedVenueIds] = useState([]);

  // Overview section state
  const [overviewDateRange, setOverviewDateRange] = useState({ preset: 'last30' });
  const [overviewViewMode, setOverviewViewMode] = useState('chart');
  const [overviewCollapsed, setOverviewCollapsed] = useState(false);

  // NPS section state
  const [npsDateRange, setNpsDateRange] = useState({ preset: 'last30' });
  const [npsViewMode, setNpsViewMode] = useState('chart');
  const [npsCollapsed, setNpsCollapsed] = useState(false);

  // Track if we've done the initial load (to show skeleton vs overlay)
  const [hasInitialData, setHasInitialData] = useState(false);

  // Set all venues as selected on initial load
  useEffect(() => {
    if (allVenues?.length > 0 && selectedVenueIds.length === 0) {
      setSelectedVenueIds(allVenues.map(v => v.id));
    }
  }, [allVenues, selectedVenueIds.length]);

  // Fetch multi-venue stats with date range
  const { stats, loading } = useMultiVenueOverviewStats(selectedVenueIds, overviewDateRange);

  // Fetch NPS stats with its own date range
  const { stats: npsStats, loading: npsLoading } = useMultiVenueNPSStats(selectedVenueIds, npsDateRange);

  // Mark initial data as loaded once we have stats
  useEffect(() => {
    if (stats && !hasInitialData) {
      setHasInitialData(true);
    }
  }, [stats, hasInitialData]);

  // Get NPS per-venue data for charts
  const getNPSPerVenueData = () => {
    if (!npsStats?.perVenueSparklines) return {};
    return npsStats.perVenueSparklines;
  };

  // Get selected venue names for display
  const getSelectedVenuesText = () => {
    if (selectedVenueIds.length === allVenues?.length) {
      return 'all venues';
    }
    if (selectedVenueIds.length === 1) {
      const venue = allVenues?.find(v => v.id === selectedVenueIds[0]);
      return venue?.name || '1 venue';
    }
    return `${selectedVenueIds.length} venues`;
  };

  // Get per-venue data for each metric
  const getPerVenueData = (metric) => {
    if (!stats?.perVenueSparklines) return {};
    const result = {};
    Object.keys(stats.perVenueSparklines).forEach(venueId => {
      result[venueId] = stats.perVenueSparklines[venueId]?.[metric] || [];
    });
    return result;
  };

  // Get comparison text based on selected date range
  const getComparisonText = (dateRange) => {
    if (dateRange.preset === 'custom') {
      return 'compared to previous period';
    }
    switch (dateRange.preset) {
      case 'last7':
        return 'compared to previous 7 days';
      case 'last14':
        return 'compared to previous 14 days';
      case 'last30':
        return 'compared to previous 30 days';
      case 'all':
        return 'compared to previous period';
      default:
        return 'compared to previous period';
    }
  };

  // Loading skeleton - only show on initial load
  if (loading && !hasInitialData) {
    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Multi-Venue Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Overview across {getSelectedVenuesText()}
            </p>
          </div>
          <VenueSelectorFilter
            venues={allVenues || []}
            selectedVenueIds={selectedVenueIds}
            onChange={setSelectedVenueIds}
          />
        </div>

        {/* Loading skeleton for metrics - 2 column grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h2>
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading skeleton for NPS - 3 column grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Net Promoter Score (NPS)</h2>
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header with Venue Selector only */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Multi-Venue Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview across {getSelectedVenuesText()}
          </p>
        </div>

        <VenueSelectorFilter
          venues={allVenues || []}
          selectedVenueIds={selectedVenueIds}
          onChange={setSelectedVenueIds}
        />
      </div>

      {/* Overview Section */}
      <div>
        <SectionHeader
          title="Overview"
          viewMode={overviewViewMode}
          onViewModeChange={setOverviewViewMode}
          dateRange={overviewDateRange}
          onDateRangeChange={setOverviewDateRange}
          isCollapsed={overviewCollapsed}
          onToggleCollapse={() => setOverviewCollapsed(!overviewCollapsed)}
        />
        {!overviewCollapsed && (
          <div className={`grid grid-cols-1 gap-6 mt-4 ${
            overviewViewMode === 'kpi'
              ? 'md:grid-cols-2 xl:grid-cols-4'
              : 'lg:grid-cols-2'
          }`}>
            <MultiVenueMetricCard
              title="Total Sessions"
              value={stats?.todaySessions || '0'}
              trend={stats?.sessionsTrend}
              trendDirection={stats?.sessionsTrendDirection}
              comparisonText={getComparisonText(overviewDateRange)}
              perVenueData={getPerVenueData('sessions')}
              venues={allVenues || []}
              selectedVenueIds={selectedVenueIds}
              sparklineDates={stats?.sparklineDates || []}
              viewMode={overviewViewMode}
              loading={loading}
            />

            <MultiVenueMetricCard
              title="Avg Satisfaction Score"
              value={stats?.avgSatisfaction ? `${stats.avgSatisfaction}/5` : '--'}
              trend={stats?.satisfactionTrend}
              trendDirection={stats?.satisfactionTrendDirection}
              comparisonText={getComparisonText(overviewDateRange)}
              perVenueData={getPerVenueData('satisfaction')}
              venues={allVenues || []}
              selectedVenueIds={selectedVenueIds}
              sparklineDates={stats?.sparklineDates || []}
              viewMode={overviewViewMode}
              loading={loading}
            />

            <MultiVenueMetricCard
              title="Avg Response Time"
              value={stats?.avgResponseTime || '--'}
              trend={stats?.responseTimeTrend}
              trendDirection={stats?.responseTimeTrendDirection}
              comparisonText={getComparisonText(overviewDateRange)}
              perVenueData={getPerVenueData('responseTime')}
              venues={allVenues || []}
              selectedVenueIds={selectedVenueIds}
              sparklineDates={stats?.sparklineDates || []}
              viewMode={overviewViewMode}
              loading={loading}
            />

            <MultiVenueMetricCard
              title="Avg Completion Rate"
              value={stats?.completionRate ? `${stats.completionRate}%` : '--'}
              trend={stats?.completionTrend}
              trendDirection={stats?.completionTrendDirection}
              comparisonText={getComparisonText(overviewDateRange)}
              perVenueData={getPerVenueData('completionRate')}
              venues={allVenues || []}
              selectedVenueIds={selectedVenueIds}
              sparklineDates={stats?.sparklineDates || []}
              viewMode={overviewViewMode}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* NPS Section */}
      <div>
        <NPSSectionHeader
          title="Net Promoter Score (NPS)"
          viewMode={npsViewMode}
          onViewModeChange={setNpsViewMode}
          dateRange={npsDateRange}
          onDateRangeChange={setNpsDateRange}
          isCollapsed={npsCollapsed}
          onToggleCollapse={() => setNpsCollapsed(!npsCollapsed)}
        />
        {!npsCollapsed && (
          <div className={`grid grid-cols-1 gap-6 mt-4 ${
            npsViewMode === 'kpi'
              ? 'md:grid-cols-3'
              : 'lg:grid-cols-3'
          }`}>
            <MultiVenueNPSCard
              title={selectedVenueIds.length > 1 ? "Avg NPS Score" : "NPS Score"}
              value={npsStats?.npsScore !== null && npsStats?.npsScore !== undefined
                ? (npsStats.npsScore >= 0 ? `+${npsStats.npsScore}` : `${npsStats.npsScore}`)
                : '--'}
              trend={npsStats?.npsTrend}
              trendDirection={npsStats?.npsTrendDirection}
              comparisonText={getComparisonText(npsDateRange)}
              perVenueData={getNPSPerVenueData()}
              perVenueTotals={npsStats?.perVenueTotals || {}}
              venues={allVenues || []}
              selectedVenueIds={selectedVenueIds}
              sparklineDates={npsStats?.sparklineDates || []}
              viewMode={npsViewMode}
              loading={npsLoading}
              metricKey="nps"
              barData={{
                promoters: npsStats?.promoters || 0,
                passives: npsStats?.passives || 0,
                detractors: npsStats?.detractors || 0
              }}
            />

            <MultiVenueNPSCard
              title="Emails Sent"
              value={npsStats?.emailsSent?.toString() || '0'}
              trend={npsStats?.emailsTrend}
              trendDirection={npsStats?.emailsTrendDirection}
              comparisonText={getComparisonText(npsDateRange)}
              perVenueData={getNPSPerVenueData()}
              perVenueTotals={npsStats?.perVenueTotals || {}}
              venues={allVenues || []}
              selectedVenueIds={selectedVenueIds}
              sparklineDates={npsStats?.sparklineDates || []}
              viewMode={npsViewMode}
              loading={npsLoading}
              metricKey="emailsSent"
              barData={{
                sent: npsStats?.emailsSent || 0,
                delivered: npsStats?.emailsDelivered || 0,
                failed: npsStats?.emailsFailed || 0
              }}
            />

            <MultiVenueNPSCard
              title={selectedVenueIds.length > 1 ? "Avg Response Rate" : "Response Rate"}
              value={npsStats?.responseRate !== null && npsStats?.responseRate !== undefined
                ? `${npsStats.responseRate}%`
                : '--'}
              trend={npsStats?.responseRateTrend}
              trendDirection={npsStats?.responseRateTrendDirection}
              comparisonText={getComparisonText(npsDateRange)}
              perVenueData={getNPSPerVenueData()}
              perVenueTotals={npsStats?.perVenueTotals || {}}
              venues={allVenues || []}
              selectedVenueIds={selectedVenueIds}
              sparklineDates={npsStats?.sparklineDates || []}
              viewMode={npsViewMode}
              loading={npsLoading}
              metricKey="responseRate"
              barData={{
                responded: npsStats?.responded || 0,
                notResponded: npsStats?.notResponded || 0
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiVenueDashboard;
