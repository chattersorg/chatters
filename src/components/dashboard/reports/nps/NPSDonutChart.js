import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const NPSDonutChart = ({ npsData, loading }) => {
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

  const chartData = {
    labels: ['Promoters (9-10)', 'Passives (7-8)', 'Detractors (0-6)'],
    datasets: [
      {
        data: [npsData.promoters, npsData.passives, npsData.detractors],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for promoters
          'rgba(234, 179, 8, 0.8)',    // Yellow for passives
          'rgba(239, 68, 68, 0.8)'     // Red for detractors
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
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
      {/* Chart Container */}
      <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: '220px' }}>
        <div className="relative w-full h-full" style={{ maxWidth: '280px', maxHeight: '280px' }}>
          <Doughnut data={chartData} options={chartOptions} />

          {/* Center Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className={`text-4xl font-bold ${getScoreColor(npsData.score)}`}>
              {npsData.score}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getScoreLabel(npsData.score)}
            </div>
            {npsData.trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                npsData.trendDirection === 'up' ? 'text-green-600' :
                npsData.trendDirection === 'down' ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <TrendIcon className="w-3 h-3" />
                <span>{npsData.trend}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Promoters</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{npsData.promoters}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {npsData.total > 0 ? Math.round((npsData.promoters / npsData.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Passives</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{npsData.passives}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {npsData.total > 0 ? Math.round((npsData.passives / npsData.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Detractors</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{npsData.detractors}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {npsData.total > 0 ? Math.round((npsData.detractors / npsData.total) * 100) : 0}%
            </div>
          </div>
        </div>
        <div className="text-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">Total Responses: </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{npsData.total}</span>
        </div>
      </div>
    </>
  );
};

export default NPSDonutChart;
