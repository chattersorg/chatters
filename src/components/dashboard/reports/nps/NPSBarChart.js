import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const NPSBarChart = ({ npsData, loading }) => {
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
    labels: ['Promoters\n(9-10)', 'Passives\n(7-8)', 'Detractors\n(0-6)'],
    datasets: [
      {
        label: 'Count',
        data: [npsData.promoters, npsData.passives, npsData.detractors],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
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
          label: function(context) {
            const value = context.parsed.y;
            const total = npsData.total;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `Count: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11
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
            size: 11
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
      {/* Score Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className={`text-3xl font-bold ${getScoreColor(npsData.score)}`}>
              {npsData.score}
            </div>
            {npsData.trend && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                npsData.trendDirection === 'up' ? 'text-green-600 bg-green-50' :
                npsData.trendDirection === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50'
              }`}>
                <TrendIcon className="w-3 h-3" />
                <span>{npsData.trend}</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">{getScoreLabel(npsData.score)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Total Responses</div>
          <div className="text-2xl font-bold text-gray-900">{npsData.total}</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex-1" style={{ minHeight: '200px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium text-gray-700">Promoters</span>
            </div>
            <div className="text-sm font-bold text-gray-900">{npsData.promoters}</div>
            <div className="text-gray-500">
              {npsData.total > 0 ? Math.round((npsData.promoters / npsData.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="font-medium text-gray-700">Passives</span>
            </div>
            <div className="text-sm font-bold text-gray-900">{npsData.passives}</div>
            <div className="text-gray-500">
              {npsData.total > 0 ? Math.round((npsData.passives / npsData.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="font-medium text-gray-700">Detractors</span>
            </div>
            <div className="text-sm font-bold text-gray-900">{npsData.detractors}</div>
            <div className="text-gray-500">
              {npsData.total > 0 ? Math.round((npsData.detractors / npsData.total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NPSBarChart;
