import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { ArrowUp, ArrowDown, Star } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { DateRangeSelector } from '../../ui/date-range-selector';
import ModernCard from '../layout/ModernCard';

// Google logo SVG component
const GoogleLogo = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
  </svg>
);

const GoogleRatingTrendCard = ({ venueId }) => {
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

      const { data: googleRatings } = await supabase
        .from('historical_ratings')
        .select('rating, ratings_count, recorded_at')
        .eq('venue_id', venueId)
        .eq('source', 'google')
        .gte('recorded_at', dateRange.from.toISOString())
        .lte('recorded_at', dateRange.to.toISOString())
        .order('recorded_at', { ascending: true });

      if (googleRatings && googleRatings.length > 0) {
        const current = googleRatings[googleRatings.length - 1];
        setCurrentRating(current);
        setHistoricalData(googleRatings);

        // Calculate trend - compare first rating in range to last rating in range
        if (googleRatings.length > 1) {
          const first = googleRatings[0];
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
      console.error('Error loading Google rating data:', error);
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

  // Render star icons
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <GoogleLogo />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Google Rating</h3>
          </div>
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-3">
              <Star className="w-10 h-10 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No rating data available</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Connect your Google Business Profile</p>
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
              <GoogleLogo />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Google Rating</h3>
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
                    <linearGradient id="googleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4285F4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4285F4" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} hide />
                  <Tooltip content={() => null} cursor={{ stroke: '#4285F4', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4285F4"
                    strokeWidth={2}
                    fill="url(#googleGradient)"
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{ r: 4, fill: '#4285F4', stroke: '#fff', strokeWidth: 2 }}
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

export default GoogleRatingTrendCard;
