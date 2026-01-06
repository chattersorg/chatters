import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { ArrowUp, ArrowDown, Star } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { DateRangeSelector } from '../../ui/date-range-selector';
import ModernCard from '../layout/ModernCard';

// TripAdvisor logo component - official SVG
const TripAdvisorLogo = () => (
  <svg width="24" height="24" viewBox="0 -96 512.2 512.2" xmlns="http://www.w3.org/2000/svg">
    <path fill="#00AA6C" d="M128.2 127.9C92.7 127.9 64 156.6 64 192c0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1.1-35.4-28.6-64.1-64-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S174 166.7 174 192s-20.5 45.9-45.8 45.9z"/>
    <circle fill="#00AA6C" cx="128.4" cy="191.9" r="31.9"/>
    <path fill="#00AA6C" d="M384.2 127.9c-35.4 0-64.1 28.7-64.1 64.1 0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1 0-35.4-28.7-64.1-64.1-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S430 166.7 430 192s-20.5 45.9-45.8 45.9z"/>
    <circle fill="#00AA6C" cx="384.4" cy="191.9" r="31.9"/>
    <path fill="#00AA6C" d="M474.4 101.2l37.7-37.4h-76.4C392.9 29 321.8 0 255.9 0c-66 0-136.5 29-179.3 63.8H0l37.7 37.4C14.4 124.4 0 156.5 0 192c0 70.8 57.4 128.2 128.2 128.2 32.5 0 62.2-12.1 84.8-32.1l43.4 31.9 42.9-31.2-.5-1.2c22.7 20.2 52.5 32.5 85.3 32.5 70.8 0 128.2-57.4 128.2-128.2-.1-35.4-14.6-67.5-37.9-90.7zM368 64.8c-60.7 7.6-108.3 57.6-111.9 119.5-3.7-62-51.4-112.1-112.3-119.5 30.6-22 69.6-32.8 112.1-32.8S337.4 42.8 368 64.8zM128.2 288.2C75 288.2 32 245.1 32 192s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2zm256 0c-53.1 0-96.2-43.1-96.2-96.2s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2z"/>
  </svg>
);

const TripAdvisorRatingTrendCard = ({ venueId }) => {
  const [currentRating, setCurrentRating] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState(null);
  const [dateRangePreset, setDateRangePreset] = useState('alltime');
  const [hoveredData, setHoveredData] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    twoYearsAgo.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return { from: twoYearsAgo, to: endOfDay };
  });

  useEffect(() => {
    if (venueId && dateRange) {
      loadRatingData();
    }
  }, [venueId, dateRange]);

  const handleDateRangeChange = ({ preset, range }) => {
    setDateRangePreset(preset);
    const endOfDay = new Date(range.to);
    endOfDay.setHours(23, 59, 59, 999);
    setDateRange({ from: range.from, to: endOfDay });
  };

  const loadRatingData = async () => {
    try {
      setLoading(true);

      const { data: tripadvisorRatings } = await supabase
        .from('historical_ratings')
        .select('rating, ratings_count, recorded_at')
        .eq('venue_id', venueId)
        .eq('source', 'tripadvisor')
        .gte('recorded_at', dateRange.from.toISOString())
        .lte('recorded_at', dateRange.to.toISOString())
        .order('recorded_at', { ascending: true });

      if (tripadvisorRatings && tripadvisorRatings.length > 0) {
        const current = tripadvisorRatings[tripadvisorRatings.length - 1];
        setCurrentRating(current);
        setHistoricalData(tripadvisorRatings);

        // Calculate trend - compare first rating in range to last rating in range
        if (tripadvisorRatings.length > 1) {
          const first = tripadvisorRatings[0];
          const change = current.rating - first.rating;
          const percentChange = ((change / first.rating) * 100);

          setTrend({
            change: change,
            percentChange: percentChange,
            direction: change >= 0 ? 'up' : 'down'
          });
        } else {
          setTrend(null);
        }
      } else {
        setTrend(null);
      }
    } catch (error) {
      console.error('Error loading TripAdvisor rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for Recharts
  const chartData = historicalData.map((d, idx) => ({
    index: idx,
    value: parseFloat(d.rating),
    date: new Date(d.recorded_at).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric'
    }),
    reviews: d.ratings_count
  }));

  // Format last updated date
  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Render star icons (TripAdvisor uses circles/bubbles but we'll use stars for consistency)
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <ModernCard padding="p-0" shadow="shadow-sm">
        <div className="p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-6"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </ModernCard>
    );
  }

  if (!currentRating) {
    return (
      <ModernCard padding="p-0" shadow="shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
              <TripAdvisorLogo />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">TripAdvisor Rating</h3>
          </div>
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-3">
              <Star className="w-10 h-10 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No rating data available</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Connect your TripAdvisor listing</p>
          </div>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard padding="p-0" shadow="shadow-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
              <TripAdvisorLogo />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">TripAdvisor Rating</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Updated {formatLastUpdated(currentRating.recorded_at)}
              </p>
            </div>
          </div>
          <DateRangeSelector
            value={dateRangePreset}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-6">
          {/* Rating and Details */}
          <div className="flex-shrink-0 min-w-[140px]">
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
                {(hoveredData?.value || currentRating.rating).toFixed(1)}
              </span>
              <span className="text-lg text-gray-400 dark:text-gray-500">/5</span>
              {trend && (
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${
                  hoveredData ? 'invisible' : ''
                } ${
                  trend.direction === 'up'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                }`}>
                  {trend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(2)}
                </span>
              )}
            </div>
            {renderStars(hoveredData?.value || currentRating.rating)}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {hoveredData
                ? hoveredData.date
                : `${currentRating.ratings_count?.toLocaleString() || 0} reviews`
              }
            </p>
          </div>

          {/* Sparkline Chart - Expanded */}
          {chartData.length > 1 && (
            <div className="flex-1 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  onMouseMove={(e) => {
                    if (e.activePayload && e.activePayload[0]) {
                      setHoveredData(e.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredData(null)}
                >
                  <defs>
                    <linearGradient id="tripadvisorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00AA6C" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00AA6C" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} hide />
                  <Tooltip content={() => null} cursor={{ stroke: '#00AA6C', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00AA6C"
                    strokeWidth={2}
                    fill="url(#tripadvisorGradient)"
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{ r: 4, fill: '#00AA6C', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Period indicator */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-xl">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {dateRangePreset === 'last7' ? 'Last 7 days' :
           dateRangePreset === 'last14' ? 'Last 14 days' :
           dateRangePreset === 'last30' ? 'Last 30 days' :
           dateRangePreset === 'last60' ? 'Last 60 days' :
           dateRangePreset === 'alltime' ? 'All time' : 'Custom range'}
        </p>
      </div>
    </ModernCard>
  );
};

export default TripAdvisorRatingTrendCard;
