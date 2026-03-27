import React, { useState, useEffect } from 'react';
import { supabase, logQuery } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { X, Settings as SettingsIcon, RefreshCw, TrendingUp, TrendingDown, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { getDateRangeFromPreset } from '../../../utils/dateRangePresets';
import ModernCard from '../layout/ModernCard';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

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
    trendDirection: 'neutral',
    sparklineData: []
  });
  const [cachedData, setCachedData] = useState({});

  const dateRangePreset = config.date_range_preset || 'all_time';
  const chartType = config.chart_type || 'kpi';
  const selectedVenueId = (config.venue_ids && config.venue_ids.length > 0)
    ? config.venue_ids[0]
    : venueId;

  useEffect(() => {
    if (selectedVenueId) {
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

  const fetchNPSData = async () => {
    try {
      setLoading(true);

      const dateRange = getDateRangeFromPreset(dateRangePreset);
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();

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

      // Generate sparkline data
      const sparklineData = generateSparklineData(currentData || [], dateRange.from, dateRange.to, daysDiff);

      const newData = {
        score: npsScore,
        promoters,
        passives,
        detractors,
        total,
        trend,
        trendDirection,
        sparklineData
      };

      setNpsData(newData);

      const cacheKey = `${selectedVenueId}_${dateRangePreset}`;
      setCachedData(prev => ({ ...prev, [cacheKey]: newData }));
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const generateSparklineData = (data, startDate, endDate, daysDiff) => {
    if (!data || data.length === 0) return [];

    let interval = 'day';
    if (daysDiff > 365) interval = 'month';
    else if (daysDiff > 90) interval = 'week';

    const groups = {};
    data.forEach(submission => {
      const date = new Date(submission.responded_at);
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
      groups[key].push(submission.score);
    });

    return Object.entries(groups)
      .map(([date, scores]) => {
        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const total = scores.length;
        const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
        // Normalize NPS (-100 to 100) to (0 to 100) for chart
        return { date, value: ((nps + 100) / 200) * 100 };
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
    if (!selectedVenueId) return 'No venue selected';
    const venue = allVenues.find(v => v.id === selectedVenueId);
    return venue?.name || 'Unknown Venue';
  };

  const handleRefresh = () => {
    const cacheKey = `${selectedVenueId}_${dateRangePreset}`;
    setCachedData(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
    fetchNPSData();
  };

  // Get score color class
  const getScoreColor = (score) => {
    if (score >= 50) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getSparklineColor = (score) => {
    if (score >= 50) return '#10b981';
    if (score >= 0) return '#f59e0b';
    return '#f43f5e';
  };

  const promoterPercent = npsData.total > 0 ? Math.round((npsData.promoters / npsData.total) * 100) : 0;
  const passivePercent = npsData.total > 0 ? Math.round((npsData.passives / npsData.total) * 100) : 0;
  const detractorPercent = npsData.total > 0 ? Math.round((npsData.detractors / npsData.total) * 100) : 0;

  return (
    <ModernCard padding="p-0" shadow="shadow-sm" className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">N</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">NPS Score</h3>
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
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : npsData.total === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No responses yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Score Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-black ${getScoreColor(npsData.score)}`}>
                  {npsData.score}
                </span>
                {npsData.trend && (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold ${
                    npsData.trendDirection === 'up'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : npsData.trendDirection === 'down'
                      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {npsData.trendDirection === 'up' && <ArrowUp className="w-3 h-3" />}
                    {npsData.trendDirection === 'down' && <ArrowDown className="w-3 h-3" />}
                    {npsData.trend}
                  </span>
                )}
              </div>

              {/* Sparkline */}
              {npsData.sparklineData.length > 1 && (
                <div className="w-24 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={npsData.sparklineData}>
                      <defs>
                        <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={getSparklineColor(npsData.score)} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={getSparklineColor(npsData.score)} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={[0, 100]} hide />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={getSparklineColor(npsData.score)}
                        strokeWidth={2}
                        fill="url(#npsGradient)"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Stacked Bar */}
            <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
              {promoterPercent > 0 && (
                <div className="bg-emerald-500 transition-all" style={{ width: `${promoterPercent}%` }} />
              )}
              {passivePercent > 0 && (
                <div className="bg-amber-500 transition-all" style={{ width: `${passivePercent}%` }} />
              )}
              {detractorPercent > 0 && (
                <div className="bg-rose-500 transition-all" style={{ width: `${detractorPercent}%` }} />
              )}
            </div>

            {/* Legend Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Promoters</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{npsData.promoters}</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Passives</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{npsData.passives}</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Detractors</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{npsData.detractors}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-xl flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">{getPresetLabel(dateRangePreset)}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{npsData.total} responses</span>
      </div>
    </ModernCard>
  );
};

export default NPSChartTile;
