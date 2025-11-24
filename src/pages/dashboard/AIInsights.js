import React, { useState, useEffect, useCallback } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { Sparkles, RefreshCw, AlertCircle, ChevronRight, ChevronLeft, ChevronDown, FileText, ThumbsUp, Target, TrendingUp, TrendingDown } from 'lucide-react';
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
  const [strengthsOpen, setStrengthsOpen] = useState(true);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(true);

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
      console.error('[AI Insights] Error loading insights:', err);
    }
  }, [venueId, currentWeekStart]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Generate insight for a specific week
  const generateInsightForWeek = async (weekStart) => {
    if (!venueId) return;

    setLoading(true);
    setError(null);

    try {
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
      console.error('[AI Insights] Error generating insights:', err);
      setError(err.message || 'Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate for current week if missing
  const generateCurrentWeekInsight = () => {
    generateInsightForWeek(currentWeekStart);
  };

  // Select a week from history
  const selectWeek = (insight) => {
    setCurrentInsight(insight);
    setSelectedWeek(insight.week_start);
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
      // No insight exists, just update the selected week (will show generate option)
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

    // Check if we have an insight for this week
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">AI Insights</h1>
        <p className="text-sm text-gray-500 mt-1">Weekly AI-powered analysis of your customer feedback</p>
      </div>

      {/* Week Navigator */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatWeekDisplay(displayedWeek)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {displayedWeek === currentWeekStart ? 'This week' :
               dayjs(displayedWeek).isSame(dayjs(currentWeekStart).subtract(7, 'day'), 'day') ? 'Last week' :
               `${dayjs(currentWeekStart).diff(dayjs(displayedWeek), 'week')} weeks ago`}
            </div>
          </div>

          <button
            onClick={goToNextWeek}
            disabled={!canGoNext}
            className={`p-2 rounded-lg transition-colors ${
              canGoNext ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'
            }`}
            title="Next week"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Generate Button if selected week has no insight */}
      {!currentInsight && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate Insights for This Week</h3>
              <p className="text-sm text-gray-600 mb-4">
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
        <div className="bg-white border border-gray-200 rounded-xl p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysing Feedback...</h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm">
              Our AI is reviewing your customer feedback. This usually takes a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* Main 3-Column Layout */}
      {!loading && currentInsight && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: AI Summary */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">AI Summary</h3>
                </div>
              </div>
              <div className="p-6">
                {currentInsight?.actionable_recommendation ? (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {currentInsight.actionable_recommendation}
                  </p>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No summary available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column: AI Score */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">AI Score</h3>
                </div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center">
                {currentInsight?.ai_score != null ? (
                  <>
                    <div className={`text-6xl font-bold ${
                      currentInsight.ai_score >= 7 ? 'text-green-600' :
                      currentInsight.ai_score >= 5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {currentInsight.ai_score}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">out of 10</p>

                    {/* Score difference from last week */}
                    {scoreDiff !== null && (
                      <div className={`flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                        scoreDiff > 0 ? 'bg-green-50 text-green-700' :
                        scoreDiff < 0 ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {scoreDiff > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : scoreDiff < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        <span>
                          {scoreDiff > 0 ? '+' : ''}{scoreDiff} from last week
                        </span>
                      </div>
                    )}
                    {scoreDiff === null && previousInsight === null && (
                      <p className="text-xs text-gray-400 mt-3">
                        Generate more insights to see trends
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No score available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights (Strengths & Opportunities) */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">AI Insights</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {/* Strengths Accordion */}
                <div>
                  <button
                    onClick={() => setStrengthsOpen(!strengthsOpen)}
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Strengths</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${strengthsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {strengthsOpen && (
                    <div className="px-6 pb-4">
                      {currentInsight?.strengths && currentInsight.strengths.length > 0 ? (
                        <ul className="space-y-2">
                          {currentInsight.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">+</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No strengths identified.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Opportunities Accordion */}
                <div>
                  <button
                    onClick={() => setOpportunitiesOpen(!opportunitiesOpen)}
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-gray-900">Opportunities</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${opportunitiesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {opportunitiesOpen && (
                    <div className="px-6 pb-4">
                      {currentInsight?.areas_for_improvement && currentInsight.areas_for_improvement.length > 0 ? (
                        <ul className="space-y-2">
                          {currentInsight.areas_for_improvement.map((area, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">!</span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No opportunities identified.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - only show when no history at all */}
      {!loading && weeklyHistory.length === 0 && !currentInsight && (
        <div className="bg-white border border-gray-200 rounded-xl p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Insights Generated Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm mb-6">
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
