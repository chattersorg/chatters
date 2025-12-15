import React, { useState, useEffect, useCallback } from 'react';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import {
  Sparkles, RefreshCw, AlertCircle, ChevronRight, ChevronLeft,
  FileText, ThumbsUp, Target, TrendingUp, TrendingDown, Lightbulb,
  MessageSquare, Users, Star, Zap, BarChart3, CheckCircle2
} from 'lucide-react';
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

      // Filter to only include entries with valid week_start
      const validData = (data || []).filter(i => i.week_start);
      setWeeklyHistory(validData);

      // Set current insight to the most recent one or the current week
      const currentWeekInsight = validData.find(
        insight => insight.week_start === currentWeekStart
      );

      if (currentWeekInsight) {
        setCurrentInsight(currentWeekInsight);
        setSelectedWeek(currentWeekStart);
      } else if (validData.length > 0) {
        // No insight for current week, show most recent
        setCurrentInsight(validData[0]);
        setSelectedWeek(validData[0].week_start);
      } else {
        setCurrentInsight(null);
        setSelectedWeek(currentWeekStart);
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
      // If force regenerate, delete existing insight first
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

      // Fetch feedback with questions
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

      // Fetch NPS submissions
      const { data: npsData, error: npsError } = await supabase
        .from('nps_submissions')
        .select('score, created_at')
        .eq('venue_id', venueId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (npsError) throw npsError;

      // Check if we have data
      const totalFeedback = (feedbackData || []).length;
      const totalNPS = (npsData || []).length;

      if (totalFeedback === 0 && totalNPS === 0) {
        setError('No feedback data available for this week. Please try a different week.');
        setLoading(false);
        return;
      }

      // Call our secure API endpoint
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Reload history to include new insight (without resetting selection)
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

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const currentDate = dayjs(selectedWeek || currentWeekStart);
    const previousWeek = currentDate.subtract(7, 'day').format('YYYY-MM-DD');

    // Check if we have an insight for this week
    const existingInsight = weeklyHistory.find(i => i.week_start === previousWeek);
    if (existingInsight) {
      setCurrentInsight(existingInsight);
      setSelectedWeek(previousWeek);
    } else {
      setCurrentInsight(null);
      setSelectedWeek(previousWeek);
    }
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const currentDate = dayjs(selectedWeek || currentWeekStart);
    const nextWeek = currentDate.add(7, 'day').format('YYYY-MM-DD');

    // Don't go beyond current week
    if (nextWeek > currentWeekStart) return;

    const existingInsight = weeklyHistory.find(i => i.week_start === nextWeek);
    if (existingInsight) {
      setCurrentInsight(existingInsight);
      setSelectedWeek(nextWeek);
    } else {
      setCurrentInsight(null);
      setSelectedWeek(nextWeek);
    }
  };

  // Check if we can navigate
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

  // Score colour
  const getScoreColor = (score) => {
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 7) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 5) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">AI Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weekly AI-powered analysis of your customer feedback</p>
        </div>

        {/* Regenerate Button */}
        {currentInsight && !loading && (
          <PermissionGate permission="ai.regenerate">
            <button
              onClick={() => generateInsightForWeek(displayedWeek, true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Insights
            </button>
          </PermissionGate>
        )}
      </div>

      {/* Week Navigator */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatWeekDisplay(displayedWeek)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {displayedWeek === currentWeekStart ? 'This week' :
               dayjs(displayedWeek).isSame(dayjs(currentWeekStart).subtract(7, 'day'), 'day') ? 'Last week' :
               `${dayjs(currentWeekStart).diff(dayjs(displayedWeek), 'week')} weeks ago`}
            </div>
          </div>

          <button
            onClick={goToNextWeek}
            disabled={!canGoNext}
            className={`p-2 rounded-lg transition-colors ${
              canGoNext ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-30 cursor-not-allowed'
            }`}
            title="Next week"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">Error</h4>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Generate Button if selected week has no insight */}
      {!currentInsight && !loading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Generate Insights for This Week</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                No insights have been generated for the week of {formatWeekDisplay(displayedWeek)} yet.
              </p>
              <button
                onClick={() => generateInsightForWeek(displayedWeek)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analysing Feedback...</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm">
              Our AI is reviewing your customer feedback. This usually takes a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* Main Content - Only show when insight exists */}
      {!loading && currentInsight && (
        <>
          {/* Top Row: AI Score + Summary Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* AI Score - Large Card */}
            <div className={`lg:col-span-1 rounded-xl border p-6 ${getScoreBgColor(currentInsight.ai_score)}`}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Score</h3>
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(currentInsight.ai_score)}`}>
                  {currentInsight.ai_score}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">out of 10</p>

                {/* Score difference from last week */}
                {scoreDiff !== null && (
                  <div className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                    scoreDiff > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    scoreDiff < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {scoreDiff > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : scoreDiff < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    <span>
                      {scoreDiff > 0 ? '+' : ''}{scoreDiff} vs last week
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Feedback Count */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Feedback</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentInsight.feedback_count || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">responses</div>
              </div>

              {/* NPS Count */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NPS</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentInsight.nps_count || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">submissions</div>
              </div>

              {/* NPS Score */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NPS Score</span>
                </div>
                <div className={`text-2xl font-bold ${
                  currentInsight.nps_score >= 50 ? 'text-green-600 dark:text-green-400' :
                  currentInsight.nps_score >= 0 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {currentInsight.nps_score !== null ? currentInsight.nps_score : ' - '}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentInsight.nps_score >= 50 ? 'Excellent' :
                   currentInsight.nps_score >= 0 ? 'Good' :
                   currentInsight.nps_score !== null ? 'Needs work' : 'No data'}
                </div>
              </div>

              {/* Strengths Count */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Insights</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(currentInsight.strengths?.length || 0) + (currentInsight.areas_for_improvement?.length || 0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">identified</div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Summary</h3>
              </div>
            </div>
            <div className="p-6">
              {currentInsight?.actionable_recommendation ? (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {currentInsight.actionable_recommendation}
                </p>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No summary available.
                </div>
              )}
            </div>
          </div>

          {/* Critical Insights */}
          {currentInsight?.critical_insights && currentInsight.critical_insights.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Critical Insights</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentInsight.critical_insights.map((insight, idx) => (
                  <div key={idx} className="p-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {insight.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths and Opportunities - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Strengths</h3>
                  {currentInsight?.strengths && (
                    <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      {currentInsight.strengths.length} identified
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                {currentInsight?.strengths && currentInsight.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {currentInsight.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No strengths identified.</p>
                )}
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/10">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Opportunities</h3>
                  {currentInsight?.areas_for_improvement && (
                    <span className="ml-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                      {currentInsight.areas_for_improvement.length} identified
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                {currentInsight?.areas_for_improvement && currentInsight.areas_for_improvement.length > 0 ? (
                  <ul className="space-y-3">
                    {currentInsight.areas_for_improvement.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No opportunities identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Improvement Tips */}
          {currentInsight?.improvement_tips && currentInsight.improvement_tips.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/10">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Improvement Tips</h3>
                  <span className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    {currentInsight.improvement_tips.length} actionable tips
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentInsight.improvement_tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
                        {idx + 1}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Historical Insights */}
          {weeklyHistory.length > 1 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Historical Insights</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {weeklyHistory.slice(0, 8).map((insight, idx) => (
                    <button
                      key={insight.id}
                      onClick={() => {
                        setCurrentInsight(insight);
                        setSelectedWeek(insight.week_start);
                      }}
                      className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-colors ${
                        insight.week_start === selectedWeek
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {dayjs(insight.week_start).format('D MMM')}
                      </div>
                      <div className={`text-lg font-bold ${getScoreColor(insight.ai_score)}`}>
                        {insight.ai_score}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State - only show when no history at all */}
      {!loading && weeklyHistory.length === 0 && !currentInsight && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Insights Generated Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm mb-6">
              Get AI-powered weekly insights about your customer feedback. Insights are automatically generated each week to help you improve.
            </p>
            <button
              onClick={() => generateInsightForWeek(displayedWeek)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate First Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
