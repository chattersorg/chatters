import React from 'react';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import ModernCard from './ModernCard';

// Loading overlay component
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10 rounded-xl">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
  </div>
);

// Color palette for venues - distinct, accessible colors
const VENUE_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f97316', // Orange
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#06b6d4', // Cyan
];

const MultiVenueMetricCard = ({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  comparisonText = 'compared to last week',
  perVenueData = {}, // { venueId: [day1, day2, ...day7] }
  venues = [], // Full venue objects with id and name
  selectedVenueIds = [],
  sparklineDates = [], // Array of ISO date strings for X-axis labels
  viewMode = 'chart', // 'chart' or 'kpi'
  loading = false, // Show loading overlay
  className = ''
}) => {
  // Get all selected venues (for legend)
  const allSelectedVenues = selectedVenueIds
    .map(id => venues.find(v => v.id === id))
    .filter(Boolean);

  // Get venues that have actual data (not all zeros) - for chart lines
  const venuesWithData = allSelectedVenues
    .filter(venue => {
      const venueSparkline = perVenueData[venue.id] || [];
      // Check if venue has any non-zero data points
      return venueSparkline.some(val => val > 0);
    });

  // Format date for display on X-axis
  const formatDateLabel = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Build chart data - transform per-venue data into format for Recharts
  // Determine the number of data points from the first venue's data
  const firstVenueData = Object.values(perVenueData)[0] || [];
  const numDataPoints = firstVenueData.length || 7;

  const chartData = Array.from({ length: numDataPoints }, (_, dayIndex) => {
    const dateLabel = sparklineDates[dayIndex] ? formatDateLabel(sparklineDates[dayIndex]) : `Day ${dayIndex + 1}`;
    const dataPoint = { day: dayIndex + 1, dateLabel };
    venuesWithData.forEach((venue) => {
      const venueSparkline = perVenueData[venue.id] || [];
      dataPoint[venue.id] = venueSparkline[dayIndex] || 0;
    });
    return dataPoint;
  });

  // Calculate min/max for dramatized Y-axis domain
  const allValues = chartData.flatMap(d =>
    venuesWithData.map(v => d[v.id] || 0)
  ).filter(v => v > 0);

  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 10;
  const range = dataMax - dataMin;

  // Add padding to dramatize the chart (show 80% of range variation)
  // If all values are the same or very close, create a reasonable range
  // For percentage metrics (completion rate), cap at 100
  const isPercentageMetric = title === 'Avg Completion Rate';
  let yMin, yMax;
  if (range < 0.01 || allValues.length === 0) {
    // Flat data - center it with some padding
    yMin = Math.max(0, dataMin - 1);
    yMax = dataMax + 1;
  } else {
    // Dramatize by tightening the Y-axis around the data
    const padding = range * 0.15; // 15% padding above and below
    yMin = Math.max(0, dataMin - padding);
    yMax = dataMax + padding;
  }
  // Cap percentage metrics at 100
  if (isPercentageMetric) {
    yMax = Math.min(yMax, 100);
  }


  // Assign colors to all selected venues (consistent colors even if no data)
  const venueColorMap = {};
  allSelectedVenues.forEach((venue, idx) => {
    venueColorMap[venue.id] = VENUE_COLORS[idx % VENUE_COLORS.length];
  });

  // Format tooltip value based on metric type
  const formatTooltipValue = (val) => {
    if (typeof val !== 'number') return val;

    // Response time - show as minutes
    if (title === 'Avg Response Time') {
      if (val < 1) return '< 1m';
      return `${val.toFixed(1)}m`;
    }

    // Satisfaction - show as X/5
    if (title === 'Satisfaction Score') {
      return `${val.toFixed(1)}/5`;
    }

    // Completion rate - show as percentage
    if (title === 'Completion Rate') {
      return `${val.toFixed(0)}%`;
    }

    // Default
    return val.toFixed(1);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dateLabel = payload[0]?.payload?.dateLabel || '';

      return (
        <div className="rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-900 dark:bg-gray-900 px-3 py-2">
            <p className="text-xs font-medium text-white">{dateLabel}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-2">
            {payload.map((entry, index) => {
              const venue = venuesWithData.find(v => v.id === entry.dataKey);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                    {venue?.name || 'Unknown'}:
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatTooltipValue(entry.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate per-venue totals/averages for KPI view
  const getVenueTotal = (venueId) => {
    const data = perVenueData[venueId] || [];
    return data.reduce((sum, val) => sum + val, 0);
  };

  const getVenueAverage = (venueId) => {
    const data = perVenueData[venueId] || [];
    const nonZeroData = data.filter(v => v > 0);
    if (nonZeroData.length === 0) return 0;
    return nonZeroData.reduce((sum, val) => sum + val, 0) / nonZeroData.length;
  };

  // Format venue value based on metric type
  const formatVenueValue = (venueId) => {
    if (title === 'Total Sessions') {
      return getVenueTotal(venueId).toFixed(0);
    }
    if (title === 'Avg Satisfaction Score') {
      const avg = getVenueAverage(venueId);
      return avg > 0 ? `${avg.toFixed(1)}/5` : '--';
    }
    if (title === 'Avg Response Time') {
      const avg = getVenueAverage(venueId);
      if (avg === 0) return '--';
      if (avg < 1) return '< 1m';
      return `${avg.toFixed(1)}m`;
    }
    if (title === 'Avg Completion Rate') {
      const avg = getVenueAverage(venueId);
      return avg > 0 ? `${avg.toFixed(0)}%` : '--';
    }
    return getVenueTotal(venueId).toFixed(0);
  };

  // KPI View - compact tiles with venue breakdown
  if (viewMode === 'kpi') {
    return (
      <ModernCard className={`relative ${className}`} padding="p-5" shadow="shadow-sm">
        {loading && <LoadingOverlay />}
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </span>
              {trend && (
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  trendDirection === 'up'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : trendDirection === 'down'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {trendDirection === 'up' && <ArrowUp className="w-3 h-3" />}
                  {trendDirection === 'down' && <ArrowDown className="w-3 h-3" />}
                  {trend}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {comparisonText}
            </p>
          </div>
        </div>

        {/* Venue Breakdown List - show all selected venues */}
        {allSelectedVenues.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              By Venue
            </p>
            <div className="space-y-2">
              {allSelectedVenues.map((venue) => (
                <div key={venue.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: venueColorMap[venue.id] }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                      {venue.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatVenueValue(venue.id)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModernCard>
    );
  }

  // Chart View - full chart with legend
  return (
    <ModernCard className={`relative ${className}`} padding="p-5" shadow="shadow-sm">
      {loading && <LoadingOverlay />}
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
            {trend && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                trendDirection === 'up'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : trendDirection === 'down'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {trendDirection === 'up' && <ArrowUp className="w-3 h-3" />}
                {trendDirection === 'down' && <ArrowDown className="w-3 h-3" />}
                {trend}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {comparisonText}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              ticks={(() => {
                // Always show first and last, with consistent gaps in between
                const labels = chartData.map(d => d.dateLabel);
                if (labels.length <= 8) return labels; // Show all if 8 or fewer

                // Find an interval that gives us 6-10 ticks with even spacing
                // Try intervals of 3, 4, 5, 6 and pick the one that works best
                const len = labels.length;
                let bestInterval = 3;
                for (const interval of [3, 4, 5, 6]) {
                  const tickCount = Math.floor((len - 1) / interval) + 1;
                  if (tickCount >= 6 && tickCount <= 12) {
                    bestInterval = interval;
                    break;
                  }
                }

                // Generate indices: 0, interval, 2*interval, ..., and always include last
                const indices = [];
                for (let i = 0; i < len; i += bestInterval) {
                  indices.push(i);
                }
                // Always include the last one
                if (indices[indices.length - 1] !== len - 1) {
                  indices.push(len - 1);
                }

                return indices.map(i => labels[i]);
              })()}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              width={35}
              domain={[Math.floor(yMin), Math.ceil(yMax)]}
              allowDecimals={false}
              tickFormatter={(val) => {
                if (val >= 1000) return `${(val/1000).toFixed(0)}k`;
                return Math.round(val);
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {venuesWithData.map((venue) => (
              <Line
                key={venue.id}
                type="monotone"
                dataKey={venue.id}
                stroke={venueColorMap[venue.id]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - show all selected venues */}
      {allSelectedVenues.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {allSelectedVenues.map((venue) => (
              <div key={venue.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: venueColorMap[venue.id] }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                  {venue.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModernCard>
  );
};

export default MultiVenueMetricCard;
