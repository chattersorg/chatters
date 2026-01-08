import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const NPSLineChart = ({ npsData, loading, dateRangePreset }) => {
  const getScoreColor = (score) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 50) return 'Excellent';
    if (score >= 30) return 'Great';
    if (score >= 0) return 'Good';
    if (score >= -30) return 'Needs Work';
    return 'Critical';
  };

  // Format date labels based on the date range
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';

    // Check if it's a month format (YYYY-MM)
    if (dateStr.length === 7) {
      const [year, month] = dateStr.split('-');
      // Use local date constructor to avoid timezone issues
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    // Regular date format (YYYY-MM-DD) - parse manually to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Show month and day
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Use time-series data if available, otherwise fall back to simple 2-point chart
  const hasTimeSeries = npsData.timeSeries && npsData.timeSeries.length > 0;

  const chartData = hasTimeSeries ? {
    labels: npsData.timeSeries.map(point => formatDateLabel(point.date)),
    datasets: [
      {
        label: 'NPS Score',
        data: npsData.timeSeries.map(point => point.nps),
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: npsData.timeSeries.length > 20 ? 2 : 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
    ],
  } : {
    labels: ['Previous Period', 'Current Period'],
    datasets: [
      {
        label: 'NPS Score',
        data: [
          npsData.trend ? npsData.score - parseInt(npsData.trend.replace('+', '')) : npsData.score,
          npsData.score
        ],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            if (hasTimeSeries && npsData.timeSeries[context[0].dataIndex]) {
              const point = npsData.timeSeries[context[0].dataIndex];
              return `${formatDateLabel(point.date)} (${point.responses} responses)`;
            }
            return context[0].label;
          },
          label: function(context) {
            return `NPS Score: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: -100,
        max: 100,
        ticks: {
          stepSize: 25,
          font: {
            size: 11
          },
          callback: function(value) {
            return value;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: hasTimeSeries && npsData.timeSeries.length > 15 ? 10 : undefined
        }
      }
    },
  };

  const TrendIcon = npsData.trendDirection === 'up' ? TrendingUp :
                    npsData.trendDirection === 'down' ? TrendingDown : Minus;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading NPS data...</p>
        </div>
      </div>
    );
  }

  if (npsData.total === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No NPS data available</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">for this period</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Score Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <div className={`text-3xl font-bold ${getScoreColor(npsData.score)}`}>
              {npsData.score}
            </div>
            {npsData.trend && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                npsData.trendDirection === 'up' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' :
                npsData.trendDirection === 'down' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
              }`}>
                <TrendIcon className="w-3 h-3" />
                <span>{npsData.trend}</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getScoreLabel(npsData.score)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Responses</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{npsData.total}</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="flex-1" style={{ minHeight: '200px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Promoters</span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{npsData.promoters}</div>
            <div className="text-gray-500 dark:text-gray-400">
              {npsData.total > 0 ? Math.round((npsData.promoters / npsData.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Passives</span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{npsData.passives}</div>
            <div className="text-gray-500 dark:text-gray-400">
              {npsData.total > 0 ? Math.round((npsData.passives / npsData.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Detractors</span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{npsData.detractors}</div>
            <div className="text-gray-500 dark:text-gray-400">
              {npsData.total > 0 ? Math.round((npsData.detractors / npsData.total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NPSLineChart;
