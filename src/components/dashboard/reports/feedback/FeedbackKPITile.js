import React from 'react';
import { MessageSquare, Star, CheckCircle2, AlertCircle } from 'lucide-react';

const FeedbackKPITile = ({ feedbackData, loading }) => {
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

  const resolutionRate = feedbackData.totalSessions > 0
    ? Math.round((feedbackData.resolvedCount / feedbackData.totalSessions) * 100)
    : 0;

  return (
    <>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Sessions */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{feedbackData.totalSessions}</div>
          <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">Total Sessions</div>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg p-4 border border-yellow-100 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
            {feedbackData.avgRating.toFixed(1)}
            <span className="text-sm text-yellow-700 dark:text-yellow-400 ml-1">/5</span>
          </div>
          <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Avg Rating</div>
        </div>

        {/* Resolved */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">{feedbackData.resolvedCount}</div>
          <div className="text-xs text-green-700 dark:text-green-400 mt-1">
            Resolved ({resolutionRate}%)
          </div>
        </div>

        {/* Unresolved */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-4 border border-red-100 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-300">{feedbackData.unresolvedCount}</div>
          <div className="text-xs text-red-700 dark:text-red-400 mt-1">Unresolved</div>
        </div>
      </div>

      {/* Venue Breakdown (if multiple venues) */}
      {feedbackData.venueBreakdown && feedbackData.venueBreakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Venue Breakdown</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {feedbackData.venueBreakdown.map(venue => (
              <div key={venue.venueId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{venue.venueName}</span>
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">{venue.sessionCount} sessions</span>
                  <span className="font-semibold text-gray-900 dark:text-white min-w-[3rem] text-right">
                    {venue.avgRating.toFixed(1)}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackKPITile;
