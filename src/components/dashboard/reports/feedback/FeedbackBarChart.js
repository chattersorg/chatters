import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FeedbackBarChart = ({ feedbackData, loading }) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  if (feedbackData.totalSessions === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No feedback data available</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">for this period</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [
      {
        label: 'Number of Ratings',
        data: [
          feedbackData.ratingDistribution[5],
          feedbackData.ratingDistribution[4],
          feedbackData.ratingDistribution[3],
          feedbackData.ratingDistribution[2],
          feedbackData.ratingDistribution[1]
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for 5
          'rgba(132, 204, 22, 0.8)',  // Lime for 4
          'rgba(234, 179, 8, 0.8)',   // Yellow for 3
          'rgba(251, 146, 60, 0.8)',  // Orange for 2
          'rgba(239, 68, 68, 0.8)'    // Red for 1
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(132, 204, 22, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${value} ratings (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <>
      {/* Chart Container */}
      <div className="flex-1 flex flex-col">
        {/* Stats Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackData.avgRating.toFixed(1)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackData.totalSessions}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{feedbackData.resolvedCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Resolved</div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1" style={{ minHeight: '200px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Venue Breakdown (if multiple venues) */}
      {feedbackData.venueBreakdown && feedbackData.venueBreakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Venue Breakdown</h4>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {feedbackData.venueBreakdown.map(venue => (
              <div key={venue.venueId} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{venue.venueName}</span>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-gray-600 dark:text-gray-400">{venue.sessionCount}</span>
                  <span className="font-semibold text-gray-900 dark:text-white min-w-[3rem] text-right">{venue.avgRating.toFixed(1)}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackBarChart;
