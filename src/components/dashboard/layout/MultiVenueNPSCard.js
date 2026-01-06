import React from 'react';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import ModernCard from './ModernCard';

// Loading overlay component
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10 rounded-xl">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
  </div>
);

// Color palette for venues
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

const MultiVenueNPSCard = ({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  comparisonText = 'compared to previous period',
  perVenueData = {},
  perVenueTotals = {},
  venues = [],
  selectedVenueIds = [],
  sparklineDates = [],
  viewMode = 'chart',
  loading = false,
  metricKey = 'nps', // 'nps', 'emailsSent', 'responseRate'
  barData = {},
  className = ''
}) => {
  // Get venues that have data
  const venuesWithData = selectedVenueIds
    .map(id => venues.find(v => v.id === id))
    .filter(Boolean)
    .filter(venue => {
      const venueSparkline = perVenueData[venue.id]?.[metricKey] || [];
      return venueSparkline.some(val => val > 0);
    });

  // Format date for display
  const formatDateLabel = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Build chart data
  const firstVenueData = Object.values(perVenueData)[0]?.[metricKey] || [];
  const numDataPoints = firstVenueData.length || 7;

  const chartData = Array.from({ length: numDataPoints }, (_, dayIndex) => {
    const dateLabel = sparklineDates[dayIndex] ? formatDateLabel(sparklineDates[dayIndex]) : `Day ${dayIndex + 1}`;
    const dataPoint = { day: dayIndex + 1, dateLabel };
    venuesWithData.forEach((venue) => {
      const venueSparkline = perVenueData[venue.id]?.[metricKey] || [];
      dataPoint[venue.id] = venueSparkline[dayIndex] || 0;
    });
    return dataPoint;
  });

  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d =>
    venuesWithData.map(v => d[v.id] || 0)
  ).filter(v => v > 0);

  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 10;
  const range = dataMax - dataMin;

  // For percentage metrics (responseRate), cap at 100
  const isPercentageMetric = metricKey === 'responseRate';
  let yMin, yMax;
  if (range < 0.01 || allValues.length === 0) {
    yMin = Math.max(0, dataMin - 1);
    yMax = dataMax + 1;
  } else {
    const padding = range * 0.15;
    yMin = Math.max(0, dataMin - padding);
    yMax = dataMax + padding;
  }
  // Cap percentage metrics at 100
  if (isPercentageMetric) {
    yMax = Math.min(yMax, 100);
  }

  // Assign colors to venues
  const venueColorMap = {};
  venuesWithData.forEach((venue, idx) => {
    venueColorMap[venue.id] = VENUE_COLORS[idx % VENUE_COLORS.length];
  });

  // Format tooltip value based on metric
  const formatTooltipValue = (val) => {
    if (typeof val !== 'number') return val;

    if (metricKey === 'nps') {
      // Convert from normalized (0-100) back to NPS (-100 to 100)
      const nps = Math.round((val * 2) - 100);
      return nps >= 0 ? `+${nps}` : `${nps}`;
    }
    if (metricKey === 'responseRate') {
      return `${val.toFixed(0)}%`;
    }
    return val.toFixed(0);
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
                <div key={index} className="flex items-center gap-2 text-sm">
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

  // Format venue value for KPI view
  const formatVenueValue = (venueId) => {
    const totals = perVenueTotals[venueId];
    if (!totals) return '--';

    if (metricKey === 'nps') {
      if (totals.nps === null) return '--';
      return totals.nps >= 0 ? `+${totals.nps}` : `${totals.nps}`;
    }
    if (metricKey === 'emailsSent') {
      return totals.emailsSent.toString();
    }
    if (metricKey === 'responseRate') {
      if (totals.responseRate === null) return '--';
      return `${totals.responseRate}%`;
    }
    return '--';
  };

  // Get NPS score color
  const getNPSColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-900 dark:text-white';
    if (score >= 50) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  // Bar chart colors for each metric type
  const getBarChartData = () => {
    if (metricKey === 'nps') {
      return [
        { name: 'Promoters', value: barData.promoters || 0, color: '#22c55e' },
        { name: 'Passives', value: barData.passives || 0, color: '#f59e0b' },
        { name: 'Detractors', value: barData.detractors || 0, color: '#ef4444' }
      ];
    }
    if (metricKey === 'emailsSent') {
      return [
        { name: 'Delivered', value: barData.delivered || 0, color: '#22c55e' },
        { name: 'Failed', value: barData.failed || 0, color: '#ef4444' }
      ];
    }
    if (metricKey === 'responseRate') {
      return [
        { name: 'Responded', value: barData.responded || 0, color: '#22c55e' },
        { name: 'Not Responded', value: barData.notResponded || 0, color: '#9ca3af' }
      ];
    }
    return [];
  };

  // Get per-venue stacked bar data for multi-venue view
  const getStackedBarData = () => {
    const allVenuesSelected = selectedVenueIds.filter(id => venues.find(v => v.id === id));

    if (metricKey === 'nps') {
      return [
        {
          name: 'Promoters',
          total: barData.promoters || 0,
          ...Object.fromEntries(allVenuesSelected.map(id => [id, perVenueTotals[id]?.promoters || 0]))
        },
        {
          name: 'Passives',
          total: barData.passives || 0,
          ...Object.fromEntries(allVenuesSelected.map(id => [id, perVenueTotals[id]?.passives || 0]))
        },
        {
          name: 'Detractors',
          total: barData.detractors || 0,
          ...Object.fromEntries(allVenuesSelected.map(id => [id, perVenueTotals[id]?.detractors || 0]))
        }
      ];
    }
    if (metricKey === 'emailsSent') {
      return [
        {
          name: 'Delivered',
          total: barData.delivered || 0,
          ...Object.fromEntries(allVenuesSelected.map(id => [id, perVenueTotals[id]?.emailsDelivered || 0]))
        },
        {
          name: 'Failed',
          total: barData.failed || 0,
          ...Object.fromEntries(allVenuesSelected.map(id => [id, perVenueTotals[id]?.emailsFailed || 0]))
        }
      ];
    }
    if (metricKey === 'responseRate') {
      return [
        {
          name: 'Responded',
          total: barData.responded || 0,
          ...Object.fromEntries(allVenuesSelected.map(id => [id, perVenueTotals[id]?.responded || 0]))
        },
        {
          name: 'Not Responded',
          total: barData.notResponded || 0,
          ...Object.fromEntries(allVenuesSelected.map(id => [id, perVenueTotals[id]?.notResponded || 0]))
        }
      ];
    }
    return [];
  };

  // Bar View
  if (viewMode === 'bar') {
    const barChartData = getBarChartData();
    const total = barChartData.reduce((sum, item) => sum + item.value, 0);
    const isMultiVenue = selectedVenueIds.length > 1;
    const stackedData = isMultiVenue ? getStackedBarData() : null;
    const allVenuesSelected = selectedVenueIds.filter(id => venues.find(v => v.id === id));

    // Calculate bar size based on number of venues (smaller bars for more venues)
    const barSize = isMultiVenue ? Math.max(16, 32 - (allVenuesSelected.length * 2)) : 24;

    // Stacked bar tooltip for multi-venue
    const StackedBarTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const categoryName = label;
        const categoryTotal = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

        return (
          <div className="rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-900 dark:bg-gray-900 px-3 py-2">
              <p className="text-xs font-medium text-white">{categoryName}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 px-3 py-2 space-y-1">
              {payload.map((entry, index) => {
                const venue = venues.find(v => v.id === entry.dataKey);
                if (!venue || entry.value === 0) return null;
                return (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                      {venue?.name}:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {entry.value}
                    </span>
                    {categoryTotal > 0 && (
                      <span className="text-gray-500 dark:text-gray-400">
                        ({Math.round((entry.value / categoryTotal) * 100)}%)
                      </span>
                    )}
                  </div>
                );
              }).filter(Boolean)}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{categoryTotal}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <ModernCard className={`relative ${className}`} padding="p-5" shadow="shadow-sm">
        {loading && <LoadingOverlay />}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${metricKey === 'nps' ? getNPSColor(parseInt(value)) : 'text-gray-900 dark:text-white'}`}>
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

        {/* Bar Chart */}
        <div className="h-40 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            {isMultiVenue && stackedData ? (
              // Stacked bar chart for multi-venue
              <BarChart
                data={stackedData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={90}
                />
                <Tooltip content={<StackedBarTooltip />} cursor={false} />
                {allVenuesSelected.map((venueId, idx) => (
                  <Bar
                    key={venueId}
                    dataKey={venueId}
                    stackId="stack"
                    fill={VENUE_COLORS[idx % VENUE_COLORS.length]}
                    barSize={barSize}
                    radius={idx === allVenuesSelected.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                    background={false}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            ) : (
              // Single venue bar chart
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={90}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg shadow-lg overflow-hidden">
                          <div className="bg-gray-900 dark:bg-gray-900 px-3 py-2">
                            <p className="text-xs font-medium text-white">{item.name}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 px-3 py-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {item.value}
                              </span>
                              {total > 0 && (
                                <span className="text-gray-500 dark:text-gray-400">
                                  ({Math.round((item.value / total) * 100)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={barSize} background={false} isAnimationActive={false}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend with values */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          {isMultiVenue ? (
            // Multi-venue legend showing venues with colors
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {allVenuesSelected.map((venueId, idx) => {
                const venue = venues.find(v => v.id === venueId);
                if (!venue) return null;
                return (
                  <div key={venueId} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: VENUE_COLORS[idx % VENUE_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                      {venue.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            // Single venue legend showing categories
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {barChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {item.name}:
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                  {total > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({Math.round((item.value / total) * 100)}%)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ModernCard>
    );
  }

  // KPI View
  if (viewMode === 'kpi') {
    return (
      <ModernCard className={`relative ${className}`} padding="p-5" shadow="shadow-sm">
        {loading && <LoadingOverlay />}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${metricKey === 'nps' ? getNPSColor(parseInt(value)) : 'text-gray-900 dark:text-white'}`}>
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

        {venuesWithData.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              By Venue
            </p>
            <div className="space-y-2">
              {venuesWithData.map((venue) => (
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

  // Chart View
  return (
    <ModernCard className={`relative ${className}`} padding="p-5" shadow="shadow-sm">
      {loading && <LoadingOverlay />}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${metricKey === 'nps' ? getNPSColor(parseInt(value)) : 'text-gray-900 dark:text-white'}`}>
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
                const labels = chartData.map(d => d.dateLabel);
                if (labels.length <= 8) return labels;

                const len = labels.length;
                let bestInterval = 3;
                for (const interval of [3, 4, 5, 6]) {
                  const tickCount = Math.floor((len - 1) / interval) + 1;
                  if (tickCount >= 6 && tickCount <= 12) {
                    bestInterval = interval;
                    break;
                  }
                }

                const indices = [];
                for (let i = 0; i < len; i += bestInterval) {
                  indices.push(i);
                }
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

      {/* Legend */}
      {venuesWithData.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {venuesWithData.map((venue) => (
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

export default MultiVenueNPSCard;
