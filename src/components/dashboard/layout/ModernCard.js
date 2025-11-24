import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const ModernCard = ({
  children,
  className = '',
  padding = 'p-6',
  shadow = 'shadow-sm hover:shadow-md',
  border = 'border border-gray-100 dark:border-gray-700',
  rounded = 'rounded-xl',
  background = 'bg-white dark:bg-gray-800',
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {value || '0'}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
              trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
              {trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        {comparison && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {comparison}
          </div>
        )}
      </div>

      {/* Venue Breakdowns */}
      {hasBreakdowns && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
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
  subtitle,
  trend,
  trendDirection = 'up',
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
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Main Value and Trend */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value || '0'}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
            trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-gray-500 dark:text-gray-400'
          }`}>
            {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend}</span>
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
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
export { MetricCard, SparklineMetricCard, ChartCard, ActivityCard, StatsGrid };