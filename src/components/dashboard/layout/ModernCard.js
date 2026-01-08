import React from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const ModernCard = ({
  children,
  className = '',
  padding = 'p-6',
  shadow = 'shadow-sm hover:shadow-md',
  border = 'border border-gray-100 dark:border-gray-800',
  rounded = 'rounded-xl',
  background = 'bg-white dark:bg-gray-900',
  transition = 'transition-all duration-200'
}) => {
  return (
    <div
      className={`${background} ${rounded} ${padding} ${border} ${shadow} ${transition} ${className}`}
    >
      {children}
    </div>
  );
};

const MetricCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'up',
  yesterdayValue,
  color = 'blue',
  comparison,
  venueBreakdowns,
  allVenues,
  field,
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  const hasBreakdowns = venueBreakdowns && Object.keys(venueBreakdowns).length > 1 && field;

  return (
    <ModernCard className={`${className}`} padding="p-4">
      {/* Header with Icon and Title */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
      </div>

      {/* Main Value and Trend Side by Side */}
      <div className="flex items-start justify-between mb-1">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value || '0'}
        </div>
        {trend && (
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
              trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend}{yesterdayValue !== undefined ? ` (${yesterdayValue})` : ''}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">vs yesterday</p>
          </div>
        )}
      </div>

      {/* Subtitle for cards without trends */}
      {subtitle && !trend && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{subtitle}</p>
      )}

      {/* Venue Breakdowns */}
      {hasBreakdowns && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              By Venue
            </h4>
            <div className="space-y-1">
              {Object.entries(venueBreakdowns).map(([venueId, breakdown]) => {
                const venue = allVenues?.find(v => v.id === venueId);
                if (!venue || !breakdown) return null;

                let breakdownValue = breakdown[field];
                if (field === 'avgSatisfaction' && breakdownValue) {
                  breakdownValue = `${breakdownValue}/5`;
                }

                return (
                  <div key={venueId} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                      {venue.name}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-shrink-0">
                      {breakdownValue || '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </ModernCard>
  );
};

const SparklineMetricCard = ({
  title,
  value,
  trend,
  trendDirection = 'up',
  yesterdayValue,
  sparklineData = [],
  className = ''
}) => {
  // Transform sparklineData to format needed by Recharts
  const chartData = sparklineData.map((val, idx) => ({
    index: idx,
    value: val
  }));

  return (
    <ModernCard className={`${className}`} padding="p-4">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
      </div>

      {/* Main Value and Trend Side by Side */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value || '0'}
        </div>
        {trend && (
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
              trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend}{yesterdayValue !== undefined ? ` (${yesterdayValue})` : ''}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">vs yesterday</p>
          </div>
        )}
      </div>

      {/* Sparkline Graph */}
      {chartData.length > 0 && (
        <div className="h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ModernCard>
  );
};

// Single metric item for the unified row
const UnifiedMetricItem = ({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  comparisonText = 'compared to last week',
  sparklineData = [],
  color = 'purple',
  isLast = false,
  index = 0
}) => {
  // Normalize sparkline data - proportional to actual variation
  const normalizeData = (data) => {
    if (!data || data.length === 0) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const avg = data.reduce((a, b) => a + b, 0) / data.length;

    // If all values are the same or very close, create a flat line at 50%
    if (range < 0.001) {
      return data.map((_, idx) => ({ index: idx, value: 50 }));
    }

    // Calculate coefficient of variation (how much variation relative to average)
    const coefficientOfVariation = avg > 0 ? range / avg : 0;

    // Scale visual variation proportionally to actual variation
    // Max visual swing of 40 points (30-70) only for high variation data
    // Small variations (like 98-100%) get proportionally smaller visual swings
    const maxVisualSwing = Math.min(40, coefficientOfVariation * 200);
    const visualBaseline = 50 - (maxVisualSwing / 2);

    return data.map((val, idx) => ({
      index: idx,
      value: visualBaseline + ((val - min) / range) * maxVisualSwing
    }));
  };

  const chartData = normalizeData(sparklineData);

  // Unique gradient ID for each metric
  const gradientId = `gradient-${color}-${index}`;

  // Color configurations for sparklines
  const colorConfig = {
    purple: { stroke: '#8b5cf6', fill: '#8b5cf6' },
    orange: { stroke: '#f97316', fill: '#f97316' },
    green: { stroke: '#22c55e', fill: '#22c55e' },
    blue: { stroke: '#3b82f6', fill: '#3b82f6' }
  };

  const sparkColor = colorConfig[color] || colorConfig.purple;

  return (
    <div className={`flex-1 px-6 py-5 ${!isLast ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="flex items-stretch justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </p>

          {/* Value and Badge */}
          <div className="flex items-center gap-2 mb-1">
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

          {/* Comparison text */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {comparisonText}
          </p>
        </div>

        {/* Sparkline - Full height from title to comparison text */}
        {chartData.length > 0 && (
          <div className="w-28 ml-4 self-stretch">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor.fill} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparkColor.fill} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor.stroke}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// Unified metrics row component - shows multiple metrics in one card with dividers
const UnifiedMetricsRow = ({ metrics = [], className = '' }) => {
  return (
    <ModernCard
      className={className}
      padding="p-0"
      shadow="shadow-sm"
    >
      <div className="flex flex-col lg:flex-row">
        {metrics.map((metric, index) => (
          <UnifiedMetricItem
            key={index}
            index={index}
            title={metric.title}
            value={metric.value}
            trend={metric.trend}
            trendDirection={metric.trendDirection}
            comparisonText={metric.comparisonText}
            sparklineData={metric.sparklineData}
            color={metric.color}
            isLast={index === metrics.length - 1}
          />
        ))}
      </div>
    </ModernCard>
  );
};

const ChartCard = ({
  title,
  subtitle,
  children,
  className = '',
  actions,
  titleRight
}) => {
  return (
    <ModernCard className={className} padding="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {titleRight && (
            <div className="flex items-center">
              {titleRight}
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        {children}
      </div>
    </ModernCard>
  );
};

const ActivityCard = ({ 
  title, 
  items = [], 
  loading = false,
  className = '',
  emptyState
}) => {
  return (
    <ModernCard className={className} padding="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {item}
            </div>
          ))}
        </div>
      ) : (
        emptyState || (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="text-sm">No recent activity</p>
            </div>
          </div>
        )
      )}
    </ModernCard>
  );
};

const StatsGrid = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  );
};

export default ModernCard;
export { MetricCard, SparklineMetricCard, ChartCard, ActivityCard, StatsGrid, UnifiedMetricsRow };