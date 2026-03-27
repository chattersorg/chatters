import React, { useState, useEffect } from 'react';
import { supabase, logQuery } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { X, Settings as SettingsIcon, RefreshCw, MessageSquare, Star, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { getDateRangeFromPreset } from '../../../utils/dateRangePresets';
import ModernCard from '../layout/ModernCard';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const FeedbackChartTile = ({ config = {}, onRemove, onConfigure }) => {
  const { venueId, allVenues } = useVenue();
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState({
    totalSessions: 0,
    avgRating: 0,
    resolvedCount: 0,
    unresolvedCount: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    trend: null,
    trendDirection: 'neutral',
    sparklineData: []
  });
  const [cachedData, setCachedData] = useState({});

  const dateRangePreset = config.date_range_preset || 'all_time';
  const selectedVenueIds = (config.venue_ids && config.venue_ids.length > 0)
    ? config.venue_ids
    : (venueId ? [venueId] : []);

  useEffect(() => {
    if (selectedVenueIds.length > 0) {
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

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);

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
          .order('created_at', { ascending: true })
      );
      const feedbackItems = feedbackResult.data || [];

      // Calculate previous period for trend
      const daysDiff = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24));
      const previousStart = new Date(dateRange.from);
      previousStart.setDate(previousStart.getDate() - daysDiff);
      const previousEnd = new Date(dateRange.from);

      const previousResult = await logQuery(
        'feedback:previous_period',
        supabase
          .from('feedback')
          .select('rating')
          .in('venue_id', selectedVenueIds)
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString())
      );
      const previousData = previousResult.data || [];

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

      // Calculate trend
      let trend = null;
      let trendDirection = 'neutral';
      if (previousData && previousData.length > 0) {
        const prevRatings = previousData.filter(item => item.rating !== null).map(item => item.rating);
        const prevAvg = prevRatings.length > 0
          ? prevRatings.reduce((sum, r) => sum + r, 0) / prevRatings.length
          : 0;
        const difference = avgRating - prevAvg;
        if (Math.abs(difference) >= 0.1) {
          trend = `${difference > 0 ? '+' : ''}${difference.toFixed(1)}`;
          trendDirection = difference > 0 ? 'up' : 'down';
        }
      }

      // Generate sparkline data
      const sparklineData = generateSparklineData(feedbackItems, daysDiff);

      const newData = {
        totalSessions,
        avgRating,
        resolvedCount,
        unresolvedCount,
        ratingDistribution,
        trend,
        trendDirection,
        sparklineData
      };

      setFeedbackData(newData);

      const cacheKey = `${selectedVenueIds.sort().join(',')}_${dateRangePreset}`;
      setCachedData(prev => ({ ...prev, [cacheKey]: newData }));
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const generateSparklineData = (data, daysDiff) => {
    if (!data || data.length === 0) return [];

    let interval = 'day';
    if (daysDiff > 365) interval = 'month';
    else if (daysDiff > 90) interval = 'week';

    const groups = {};
    data.forEach(item => {
      if (item.rating === null) return;
      const date = new Date(item.created_at);
      let key;
      if (interval === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (interval === 'week') {
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        key = monday.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(item.rating);
    });

    return Object.entries(groups)
      .map(([date, ratings]) => {
        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        // Normalize rating (1-5) to (0-100) for chart
        return { date, value: ((avg - 1) / 4) * 100 };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
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
    const cacheKey = `${selectedVenueIds.sort().join(',')}_${dateRangePreset}`;
    setCachedData(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
    fetchFeedbackData();
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-emerald-600 dark:text-emerald-400';
    if (rating >= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getSparklineColor = (rating) => {
    if (rating >= 4) return '#10b981';
    if (rating >= 3) return '#f59e0b';
    return '#f43f5e';
  };

  const resolutionPercent = feedbackData.totalSessions > 0
    ? Math.round((feedbackData.resolvedCount / feedbackData.totalSessions) * 100)
    : 0;

  return (
    <ModernCard padding="p-0" shadow="shadow-sm" className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Feedback</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getVenueLabel()}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onConfigure} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[180px]">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : feedbackData.totalSessions === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rating Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${getRatingColor(feedbackData.avgRating)}`}>
                    {feedbackData.avgRating.toFixed(1)}
                  </span>
                  <span className="text-lg text-gray-400 dark:text-gray-500">/5</span>
                </div>
                {feedbackData.trend && (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold ${
                    feedbackData.trendDirection === 'up'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : feedbackData.trendDirection === 'down'
                      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {feedbackData.trendDirection === 'up' && <ArrowUp className="w-3 h-3" />}
                    {feedbackData.trendDirection === 'down' && <ArrowDown className="w-3 h-3" />}
                    {feedbackData.trend}
                  </span>
                )}
              </div>

              {/* Sparkline */}
              {feedbackData.sparklineData.length > 1 && (
                <div className="w-24 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={feedbackData.sparklineData}>
                      <defs>
                        <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={getSparklineColor(feedbackData.avgRating)} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={getSparklineColor(feedbackData.avgRating)} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={[0, 100]} hide />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={getSparklineColor(feedbackData.avgRating)}
                        strokeWidth={2}
                        fill="url(#feedbackGradient)"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Resolution Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Resolution Rate</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{resolutionPercent}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full bg-emerald-500 transition-all rounded-full"
                  style={{ width: `${resolutionPercent}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <MessageSquare className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Sessions</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedbackData.totalSessions}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Resolved</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedbackData.resolvedCount}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedbackData.unresolvedCount}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-xl flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">{getPresetLabel(dateRangePreset)}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{feedbackData.totalSessions} sessions</span>
      </div>
    </ModernCard>
  );
};

export default FeedbackChartTile;
