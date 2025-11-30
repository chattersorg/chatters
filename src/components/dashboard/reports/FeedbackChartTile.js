import React, { useState, useEffect } from 'react';
import { supabase, logQuery } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { X, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { getDateRangeFromPreset } from '../../../utils/dateRangePresets';

// Import visualization components
import FeedbackDonutChart from './feedback/FeedbackDonutChart';
import FeedbackBarChart from './feedback/FeedbackBarChart';
import FeedbackKPITile from './feedback/FeedbackKPITile';

const FeedbackChartTile = ({ config = {}, onRemove, onConfigure }) => {
  const { venueId, allVenues } = useVenue();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    totalSessions: 0,
    avgRating: 0,
    resolvedCount: 0,
    unresolvedCount: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    },
    venueBreakdown: []
  });
  // Cache data by date range and venue selection to avoid refetching
  const [cachedData, setCachedData] = useState({});

  const dateRangePreset = config.date_range_preset || 'all_time';
  const chartType = config.chart_type || 'kpi';
  // Default to current venue if venue_ids is null, undefined, or empty array
  const selectedVenueIds = (config.venue_ids && config.venue_ids.length > 0)
    ? config.venue_ids
    : (venueId ? [venueId] : []);
  const prevChartTypeRef = React.useRef(chartType);

  useEffect(() => {
    if (selectedVenueIds.length > 0) {
      // Check if we have cached data for this configuration
      const cacheKey = `${selectedVenueIds.sort().join(',')}_${dateRangePreset}`;
      if (cachedData[cacheKey]) {
        setFeedbackData(cachedData[cacheKey]);
        setLoading(false);
      } else {
        fetchFeedbackData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueIds, dateRangePreset]);

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

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      console.log('%c⏱️  [PERF] Starting: Feedback Tile Data Fetch', 'color: #3b82f6; font-weight: bold', { dateRangePreset, venueCount: selectedVenueIds.length });
      const startTime = performance.now();

      const dateRange = getDateRangeFromPreset(dateRangePreset);
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();

      // Fetch feedback for selected venues
      const feedbackResult = await logQuery(
        'feedback:chart_tile',
        supabase
          .from('feedback')
          .select('id, session_id, venue_id, rating, created_at, resolved_at, is_actioned, dismissed')
          .in('venue_id', selectedVenueIds)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      );
      const feedbackItems = feedbackResult.data || [];

      // Group feedback by session
      const sessionMap = {};
      feedbackItems.forEach(item => {
        if (!sessionMap[item.session_id]) {
          sessionMap[item.session_id] = {
            venue_id: item.venue_id,
            items: [],
            created_at: item.created_at
          };
        }
        sessionMap[item.session_id].items.push(item);
      });

      const sessions = Object.values(sessionMap);
      const totalSessions = sessions.length;

      // Calculate resolved vs unresolved
      const resolvedSessions = sessions.filter(session =>
        session.items.every(item => item.is_actioned === true || item.dismissed === true)
      );
      const resolvedCount = resolvedSessions.length;
      const unresolvedCount = totalSessions - resolvedCount;

      // Calculate average rating
      const ratingsArray = feedbackItems.filter(item => item.rating !== null).map(item => item.rating);
      const avgRating = ratingsArray.length > 0
        ? ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length
        : 0;

      // Calculate rating distribution
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratingsArray.forEach(rating => {
        const roundedRating = Math.round(rating);
        if (roundedRating >= 1 && roundedRating <= 5) {
          ratingDistribution[roundedRating]++;
        }
      });

      // Calculate venue breakdown (if multiple venues selected)
      const venueBreakdown = [];
      if (selectedVenueIds.length > 1) {
        selectedVenueIds.forEach(vId => {
          const venueSessions = sessions.filter(s => s.venue_id === vId);
          const venueRatings = feedbackItems
            .filter(item => item.venue_id === vId && item.rating !== null)
            .map(item => item.rating);
          const venueAvg = venueRatings.length > 0
            ? venueRatings.reduce((sum, r) => sum + r, 0) / venueRatings.length
            : 0;

          const venue = allVenues.find(v => v.id === vId);
          venueBreakdown.push({
            venueId: vId,
            venueName: venue?.name || 'Unknown',
            sessionCount: venueSessions.length,
            avgRating: venueAvg
          });
        });
      }

      const newData = {
        totalSessions,
        avgRating,
        resolvedCount,
        unresolvedCount,
        ratingDistribution,
        venueBreakdown
      };

      setFeedbackData(newData);

      // Cache the data for this configuration
      const cacheKey = `${selectedVenueIds.sort().join(',')}_${dateRangePreset}`;
      setCachedData(prev => ({ ...prev, [cacheKey]: newData }));

      const totalDuration = performance.now() - startTime;
      const color = totalDuration < 500 ? '#22c55e' : totalDuration < 1000 ? '#eab308' : totalDuration < 2000 ? '#f97316' : '#ef4444';
      console.log(
        `%c✓ [PERF] Feedback Tile Data Fetch Complete: ${totalDuration.toFixed(2)}ms`,
        `color: ${color}; font-weight: bold`
      );
    } catch (error) {
      console.error('%c❌ [PERF] Feedback Tile Data Fetch Failed', 'color: #ef4444; font-weight: bold', error);
    } finally {
      setLoading(false);
    }
  };

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      feedbackData,
      loading,
      dateRangePreset
    };

    switch (chartType) {
      case 'bar':
        return <FeedbackBarChart {...commonProps} />;
      case 'donut':
        return <FeedbackDonutChart {...commonProps} />;
      case 'kpi':
      default:
        return <FeedbackKPITile {...commonProps} />;
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
    if (selectedVenueIds.length === 0) return 'No venues selected';
    if (selectedVenueIds.length === 1) {
      const venue = allVenues.find(v => v.id === selectedVenueIds[0]);
      return venue?.name || 'Unknown Venue';
    }
    return `${selectedVenueIds.length} venues`;
  };

  const handleRefresh = () => {
    // Clear cache for this configuration and refetch
    const cacheKey = `${selectedVenueIds.sort().join(',')}_${dateRangePreset}`;
    setCachedData(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
    fetchFeedbackData();
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Feedback</h3>
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

export default FeedbackChartTile;
