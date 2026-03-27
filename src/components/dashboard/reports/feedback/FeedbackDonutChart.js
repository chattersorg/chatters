import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const FeedbackDonutChart = ({ feedbackData, loading }) => {
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

  return (
    <>
      {/* Chart Container */}
      <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: '220px' }}>
        <div className="relative w-full h-full" style={{ maxWidth: '280px', maxHeight: '280px' }}>
          <Doughnut data={chartData} options={chartOptions} />

          {/* Center Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {feedbackData.avgRating.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Rating</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {feedbackData.totalSessions} sessions
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-5 gap-2 text-center">
          {[5, 4, 3, 2, 1].map((rating, idx) => {
            const colors = ['green', 'lime', 'yellow', 'orange', 'red'];
            const color = colors[idx];
            const count = feedbackData.ratingDistribution[rating];
            const total = Object.values(feedbackData.ratingDistribution).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={rating}>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{rating}★</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</div>
              </div>
            );
          })}
        </div>

        {/* Venue Breakdown (if multiple venues) */}
        {feedbackData.venueBreakdown && feedbackData.venueBreakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Venue Breakdown</h4>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {feedbackData.venueBreakdown.map(venue => (
                <div key={venue.venueId} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{venue.venueName}</span>
                  <span className="font-semibold text-gray-900 dark:text-white ml-2">{venue.avgRating.toFixed(1)}/5</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackDonutChart;
