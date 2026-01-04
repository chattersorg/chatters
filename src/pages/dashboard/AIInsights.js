import React, { useState, useEffect, useCallback } from 'react';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

// Helper to get Monday of a given week
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// Helper to get Sunday of a given week
function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

// Format week display
function formatWeekDisplay(weekStart) {
  if (!weekStart) return 'Unknown week';
  const start = dayjs(weekStart);
  if (!start.isValid()) return 'Unknown week';
  const end = start.add(6, 'day');
  return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
}

const AIInsights = () => {
  usePageTitle('AI Insights');
  const { venueId, allVenues } = useVenue();

  // State
  const [loading, setLoading] = useState(false);
  const [currentInsight, setCurrentInsight] = useState(null);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [error, setError] = useState(null);

  // Get current venue name
  const currentVenue = allVenues.find(v => v.id === venueId);
  const venueName = currentVenue?.name || 'your venue';

  // Calculate current week start (Monday)
  const currentWeekStart = getWeekStart(new Date());

  // Load all insights for this venue
  const loadInsights = useCallback(async () => {
    if (!venueId) return;

    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('venue_id', venueId)
        .order('week_start', { ascending: false });

      if (error) throw error;

      const validData = (data || []).filter(i => i.week_start);
      setWeeklyHistory(validData);

      if (validData.length > 0) {
        setCurrentInsight(validData[0]);
        setSelectedWeek(validData[0].week_start);
      } else {
        const previousWeekStart = dayjs(currentWeekStart).subtract(7, 'day').format('YYYY-MM-DD');
        setCurrentInsight(null);
        setSelectedWeek(previousWeekStart);
      }
    } catch (err) {
      // Error loading insights silently
    }
  }, [venueId, currentWeekStart]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Generate insight for a specific week
  const generateInsightForWeek = async (weekStart, forceRegenerate = false) => {
    if (!venueId) return;

    setLoading(true);
    setError(null);

    try {
      if (forceRegenerate) {
        await supabase
          .from('ai_insights')
          .delete()
          .eq('venue_id', venueId)
          .eq('week_start', weekStart);
      }

      const dateFrom = weekStart;
      const dateTo = getWeekEnd(weekStart);
      const startDate = dayjs(dateFrom).startOf('day').toISOString();
      const endDate = dayjs(dateTo).endOf('day').toISOString();

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select(`
          id,
          rating,
          additional_feedback,
          created_at,
          questions (
            question
          )
        `)
        .eq('venue_id', venueId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      const { data: npsData, error: npsError } = await supabase
        .from('nps_submissions')
        .select('score, created_at')
        .eq('venue_id', venueId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (npsError) throw npsError;

      const totalFeedback = (feedbackData || []).length;
      const totalNPS = (npsData || []).length;

      if (totalFeedback === 0 && totalNPS === 0) {
        setError('No feedback data available for this week.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackData: feedbackData || [],
          npsData: npsData || [],
          venueName,
          venueId,
          dateFrom,
          dateTo,
          weekStart,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const result = await response.json();

      if (result.saved === false) {
        setError(`Insight generated but failed to save: ${result.saveError || 'Unknown error'}`);
      }

      setCurrentInsight(result);
      setSelectedWeek(weekStart);

      const { data } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('venue_id', venueId)
        .order('week_start', { ascending: false });

      const validData = (data || []).filter(i => i.week_start);
      setWeeklyHistory(validData);

    } catch (err) {
      setError(err.message || 'Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const goToPreviousWeek = () => {
    const currentDate = dayjs(selectedWeek || currentWeekStart);
    const previousWeek = currentDate.subtract(7, 'day').format('YYYY-MM-DD');
    const existingInsight = weeklyHistory.find(i => i.week_start === previousWeek);
    setCurrentInsight(existingInsight || null);
    setSelectedWeek(previousWeek);
  };

  const goToNextWeek = () => {
    const currentDate = dayjs(selectedWeek || currentWeekStart);
    const nextWeek = currentDate.add(7, 'day').format('YYYY-MM-DD');
    if (nextWeek > currentWeekStart) return;
    const existingInsight = weeklyHistory.find(i => i.week_start === nextWeek);
    setCurrentInsight(existingInsight || null);
    setSelectedWeek(nextWeek);
  };

  const canGoNext = selectedWeek && selectedWeek < currentWeekStart;
  const displayedWeek = selectedWeek || currentWeekStart;

  // Get previous week's insight for comparison
  const getPreviousWeekInsight = () => {
    if (!currentInsight?.week_start) return null;
    const prevWeekStart = dayjs(currentInsight.week_start).subtract(7, 'day').format('YYYY-MM-DD');
    return weeklyHistory.find(i => i.week_start === prevWeekStart);
  };

  const previousInsight = getPreviousWeekInsight();
  const scoreDiff = currentInsight?.ai_score && previousInsight?.ai_score
    ? currentInsight.ai_score - previousInsight.ai_score
    : null;

  // Score styling
  const getScoreColor = (score) => {
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered analysis of your customer feedback
          </p>
        </div>
        {currentInsight && !loading && (
          <PermissionGate permission="ai.regenerate">
            <button
              onClick={() => generateInsightForWeek(displayedWeek, true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Regenerate
            </button>
          </PermissionGate>
        )}
      </div>

      {/* Week Selector */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatWeekDisplay(displayedWeek)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {displayedWeek === currentWeekStart ? 'This week' :
               dayjs(displayedWeek).isSame(dayjs(currentWeekStart).subtract(7, 'day'), 'day') ? 'Last week' :
               `${dayjs(currentWeekStart).diff(dayjs(displayedWeek), 'week')} weeks ago`}
            </div>
          </div>
          <button
            onClick={goToNextWeek}
            disabled={!canGoNext}
            className={`p-2 rounded-lg transition-colors ${canGoNext ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-30 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Week History Pills */}
        {weeklyHistory.length > 1 && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {weeklyHistory.slice(0, 8).map((insight) => (
                <button
                  key={insight.id}
                  onClick={() => {
                    setCurrentInsight(insight);
                    setSelectedWeek(insight.week_start);
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    insight.week_start === selectedWeek
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {dayjs(insight.week_start).format('D MMM')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Analysing feedback...</p>
          </div>
        </div>
      )}

      {/* No Insight State */}
      {!loading && !currentInsight && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No insights for this week
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Insights are automatically generated at the end of each week. You can also generate them manually.
          </p>
          <button
            onClick={() => generateInsightForWeek(displayedWeek)}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Generate Insights
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && currentInsight && (
        <div className="space-y-6">
          {/* Score & Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI Score */}
            <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                AI Score
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getScoreColor(currentInsight.ai_score)}`}>
                  {currentInsight.ai_score}
                </span>
                <span className="text-gray-400 dark:text-gray-500">/10</span>
              </div>
              {scoreDiff !== null && (
                <div className={`text-sm mt-2 ${scoreDiff > 0 ? 'text-green-600 dark:text-green-400' : scoreDiff < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                  {scoreDiff > 0 ? '↑' : scoreDiff < 0 ? '↓' : '→'} {scoreDiff > 0 ? '+' : ''}{scoreDiff} from last week
                </div>
              )}
            </div>

            {/* Feedback Count */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Feedback
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentInsight.feedback_count || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">responses</div>
            </div>

            {/* NPS Count */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                NPS Responses
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentInsight.nps_count || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">submissions</div>
            </div>

            {/* NPS Score */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                NPS Score
              </div>
              <div className={`text-2xl font-bold ${
                currentInsight.nps_score >= 50 ? 'text-green-600 dark:text-green-400' :
                currentInsight.nps_score >= 0 ? 'text-amber-600 dark:text-amber-400' :
                currentInsight.nps_score !== null ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
              }`}>
                {currentInsight.nps_score !== null ? currentInsight.nps_score : '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentInsight.nps_score >= 50 ? 'Excellent' :
                 currentInsight.nps_score >= 0 ? 'Good' :
                 currentInsight.nps_score !== null ? 'Needs improvement' : 'No data'}
              </div>
            </div>
          </div>

          {/* Summary */}
          {currentInsight.actionable_recommendation && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                Summary
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {currentInsight.actionable_recommendation}
              </p>
            </div>
          )}

          {/* Critical Insights */}
          {currentInsight.critical_insights && currentInsight.critical_insights.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
                Key Findings
              </h2>
              <div className="space-y-4">
                {currentInsight.critical_insights.map((insight, idx) => (
                  <div key={idx} className="border-l-2 border-amber-400 pl-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {insight.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Strengths
                </h2>
                {currentInsight.strengths && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    {currentInsight.strengths.length}
                  </span>
                )}
              </div>
              {currentInsight.strengths && currentInsight.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {currentInsight.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No strengths identified.</p>
              )}
            </div>

            {/* Opportunities */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Areas to Improve
                </h2>
                {currentInsight.areas_for_improvement && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    {currentInsight.areas_for_improvement.length}
                  </span>
                )}
              </div>
              {currentInsight.areas_for_improvement && currentInsight.areas_for_improvement.length > 0 ? (
                <ul className="space-y-3">
                  {currentInsight.areas_for_improvement.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No areas for improvement identified.</p>
              )}
            </div>
          </div>

          {/* Action Items */}
          {currentInsight.improvement_tips && currentInsight.improvement_tips.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
                Recommended Actions
              </h2>
              <div className="space-y-3">
                {currentInsight.improvement_tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
