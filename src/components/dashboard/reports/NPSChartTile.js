import React, { useState, useEffect } from 'react';
import { supabase, logQuery } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { X, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { getDateRangeFromPreset } from '../../../utils/dateRangePresets';

// Import visualization components
import NPSDonutChart from './nps/NPSDonutChart';
import NPSBarChart from './nps/NPSBarChart';
import NPSLineChart from './nps/NPSLineChart';
import NPSKPITile from './nps/NPSKPITile';

const NPSChartTile = ({ config = {}, onRemove, onConfigure }) => {
  const { venueId, allVenues } = useVenue();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [npsData, setNpsData] = useState({
    score: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
    total: 0,
    trend: null,
    trendDirection: 'neutral'
  });
  // Cache data by date range and venue to avoid refetching when only chart type changes
  const [cachedData, setCachedData] = useState({});

  const dateRangePreset = config.date_range_preset || 'all_time';
  const chartType = config.chart_type || 'donut';
  // Default to current venue if venue_ids is null, undefined, or empty array
  const selectedVenueId = (config.venue_ids && config.venue_ids.length > 0)
    ? config.venue_ids[0]
    : venueId;
  const prevChartTypeRef = React.useRef(chartType);

  useEffect(() => {
    if (selectedVenueId) {
      // Check if we have cached data for this date range and venue
      const cacheKey = `${selectedVenueId}_${dateRangePreset}`;
      if (cachedData[cacheKey]) {
        setNpsData(cachedData[cacheKey]);
        setLoading(false);
      } else {
        fetchNPSData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId, dateRangePreset]);

  // Handle chart type changes with refreshing state
  useEffect(() => {
    if (prevChartTypeRef.current !== chartType) {
      setRefreshing(true);
      // Short delay to show transition
      const timer = setTimeout(() => {
        setRefreshing(false);
        prevChartTypeRef.current = chartType;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [chartType]);

  const fetchNPSData = async () => {
    try {
      setLoading(true);

      const dateRange = getDateRangeFromPreset(dateRangePreset);
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();

      // Fetch NPS responses for the selected date range
      const currentResult = await logQuery(
        'nps_submissions:current_period',
        supabase
          .from('nps_submissions')
          .select('score, responded_at')
          .eq('venue_id', selectedVenueId)
          .not('score', 'is', null)
          .gte('responded_at', startDate)
          .lte('responded_at', endDate)
          .order('responded_at', { ascending: true })
      );
      const currentData = currentResult.data;
      const currentError = currentResult.error;

      if (currentError) throw currentError;

      // Calculate previous period for trend
      const daysDiff = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24));
      const previousStart = new Date(dateRange.from);
      previousStart.setDate(previousStart.getDate() - daysDiff);
      const previousEnd = new Date(dateRange.from);

      const previousResult = await logQuery(
        'nps_submissions:previous_period',
        supabase
          .from('nps_submissions')
          .select('score')
          .eq('venue_id', selectedVenueId)
          .not('score', 'is', null)
          .gte('responded_at', previousStart.toISOString())
          .lt('responded_at', previousEnd.toISOString())
      );
      const previousData = previousResult.data;

      // Calculate current NPS
      const promoters = currentData?.filter(r => r.score >= 9).length || 0;
      const passives = currentData?.filter(r => r.score >= 7 && r.score <= 8).length || 0;
      const detractors = currentData?.filter(r => r.score <= 6).length || 0;
      const total = currentData?.length || 0;

      const npsScore = total > 0
        ? Math.round(((promoters - detractors) / total) * 100)
        : 0;

      // Calculate previous NPS for trend
      let trend = null;
      let trendDirection = 'neutral';

      if (previousData && previousData.length > 0) {
        const prevPromoters = previousData.filter(r => r.score >= 9).length;
        const prevDetractors = previousData.filter(r => r.score <= 6).length;
        const prevTotal = previousData.length;
        const prevNpsScore = Math.round(((prevPromoters - prevDetractors) / prevTotal) * 100);

        const difference = npsScore - prevNpsScore;
        if (Math.abs(difference) >= 1) {
          trend = `${difference > 0 ? '+' : ''}${difference}`;
          trendDirection = difference > 0 ? 'up' : 'down';
        }
      }

      // Generate time-series data for line chart
      // Group by appropriate interval based on date range
      const timeSeries = generateTimeSeries(currentData || [], dateRange.from, dateRange.to, daysDiff);

      const newData = {
        score: npsScore,
        promoters,
        passives,
        detractors,
        total,
        trend,
        trendDirection,
        timeSeries // Add time series data for line chart
      };

      setNpsData(newData);

      // Cache the data for this date range and venue
      const cacheKey = `${selectedVenueId}_${dateRangePreset}`;
      setCachedData(prev => ({ ...prev, [cacheKey]: newData }));
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  // Generate time-series data grouped by appropriate intervals
  const generateTimeSeries = (data, startDate, endDate, daysDiff) => {
    if (!data || data.length === 0) return [];

    // Determine grouping interval based on date range
    let interval = 'day';
    if (daysDiff > 365) {
      interval = 'month';
    } else if (daysDiff > 90) {
      interval = 'week';
    }

    // Group submissions by interval
    const groups = {};

    data.forEach(submission => {
      const date = new Date(submission.responded_at);
      let key;

      if (interval === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (interval === 'week') {
        // Get the Monday of the week
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        key = monday.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(submission.score);
    });

    // Calculate NPS for each group
    const timeSeries = Object.entries(groups)
      .map(([date, scores]) => {
        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const total = scores.length;
        const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

        return {
          date,
          nps,
          responses: total
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return timeSeries;
  };

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      npsData,
      loading,
      dateRangePreset
    };

    switch (chartType) {
      case 'kpi':
        return <NPSKPITile {...commonProps} />;
      case 'bar':
        return <NPSBarChart {...commonProps} />;
      case 'line':
        return <NPSLineChart {...commonProps} />;
      case 'donut':
      default:
        return <NPSDonutChart {...commonProps} />;
    }
  };

  const getPresetLabel = (preset) => {
    const labels = {
      '7_days': 'Last 7 Days',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'last_quarter': 'Last Quarter',
      'all_time': 'All Time'
    };
    return labels[preset] || 'All Time';
  };

  const getVenueLabel = () => {
    if (!selectedVenueId) return 'No venue selected';
    const venue = allVenues.find(v => v.id === selectedVenueId);
    return venue?.name || 'Unknown Venue';
  };

  const handleRefresh = () => {
    // Clear cache for this date range and venue, then refetch
    const cacheKey = `${selectedVenueId}_${dateRangePreset}`;
    setCachedData(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
    fetchNPSData();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors ${
              loading ? 'animate-spin cursor-not-allowed' : ''
            }`}
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">NPS Score</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getVenueLabel()} • {getPresetLabel(dateRangePreset)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onConfigure}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Configure chart"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Remove tile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {refreshing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Updating view...</p>
            </div>
          </div>
        )}
        {renderChart()}
      </div>
    </div>
  );
};

export default NPSChartTile;
