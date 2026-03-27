import React from 'react';
import { TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';

const NPSKPITile = ({ npsData, loading }) => {
  // Get gradient colors based on score
  const getScoreGradient = (score) => {
    if (score >= 50) return 'from-emerald-500 to-green-600';
    if (score >= 0) return 'from-amber-500 to-yellow-600';
    return 'from-rose-500 to-red-600';
  };

  const getScoreRingColor = (score) => {
    if (score >= 50) return '#10b981'; // emerald-500
    if (score >= 0) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  const getScoreLabel = (score) => {
    if (score >= 50) return 'Excellent';
    if (score >= 30) return 'Great';
    if (score >= 0) return 'Good';
    if (score >= -30) return 'Needs Work';
    return 'Critical';
  };

  const TrendIcon = npsData.trendDirection === 'up' ? TrendingUp :
                    npsData.trendDirection === 'down' ? TrendingDown : Minus;

  // Calculate the progress ring percentage (NPS ranges from -100 to 100, normalize to 0-100)
  const normalizedScore = ((npsData.score + 100) / 200) * 100;
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-200 dark:border-gray-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading NPS data...</p>
        </div>
      </div>
    );
  }

  if (npsData.total === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No NPS data yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">for this period</p>
        </div>
      </div>
    );
  }

  const promoterPercent = npsData.total > 0 ? Math.round((npsData.promoters / npsData.total) * 100) : 0;
  const passivePercent = npsData.total > 0 ? Math.round((npsData.passives / npsData.total) * 100) : 0;
  const detractorPercent = npsData.total > 0 ? Math.round((npsData.detractors / npsData.total) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Main Score Section */}
      <div className="flex items-center justify-center py-6">
        <div className="relative">
          {/* SVG Ring */}
          <svg className="w-36 h-36 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-100 dark:text-gray-800"
            />
            {/* Progress ring */}
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke={getScoreRingColor(npsData.score)}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease-in-out'
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black bg-gradient-to-br ${getScoreGradient(npsData.score)} bg-clip-text text-transparent`}>
              {npsData.score}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
              {getScoreLabel(npsData.score)}
            </span>
          </div>
        </div>
      </div>

      {/* Trend Badge */}
      {npsData.trend && (
        <div className="flex justify-center mb-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
            npsData.trendDirection === 'up'
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
              : npsData.trendDirection === 'down'
              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            <TrendIcon className="w-4 h-4" />
            <span>{npsData.trend} vs last period</span>
          </div>
        </div>
      )}

      {/* Category Breakdown - Horizontal Bar Style */}
      <div className="space-y-3 mt-auto">
        {/* Stacked bar visualization */}
        <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
          {promoterPercent > 0 && (
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${promoterPercent}%` }}
            />
          )}
          {passivePercent > 0 && (
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              style={{ width: `${passivePercent}%` }}
            />
          )}
          {detractorPercent > 0 && (
            <div
              className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500"
              style={{ width: `${detractorPercent}%` }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Promoters</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{npsData.promoters}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{promoterPercent}%</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Passives</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{npsData.passives}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{passivePercent}%</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Detractors</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{npsData.detractors}</div>
            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">{detractorPercent}%</div>
          </div>
        </div>

        {/* Total Responses */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{npsData.total}</span> responses
          </span>
        </div>
      </div>
    </div>
  );
};

export default NPSKPITile;
