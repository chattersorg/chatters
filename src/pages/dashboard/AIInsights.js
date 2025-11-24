import React, { useState, useEffect, useCallback } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, Calendar, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const start = dayjs(weekStart);
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
  const [timeframeWeeks, setTimeframeWeeks] = useState(8); // Default 8 weeks for graph

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

      setWeeklyHistory(data || []);

      // Set current insight to the most recent one or the current week
      const currentWeekInsight = (data || []).find(
        insight => insight.week_start === currentWeekStart
      );

      if (currentWeekInsight) {
        setCurrentInsight(currentWeekInsight);
        setSelectedWeek(currentWeekStart);
      } else if (data && data.length > 0) {
        // No insight for current week, show most recent
        setCurrentInsight(data[0]);
        setSelectedWeek(data[0].week_start);
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

      // Reload history to include new insight
      await loadInsights();

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

  // Prepare graph data
  const graphData = weeklyHistory
    .slice(0, timeframeWeeks)
    .reverse()
    .map(insight => ({
      week: dayjs(insight.week_start).format('D MMM'),
      score: insight.ai_score,
      fullDate: insight.week_start,
    }));

  // Check if current week has insight
  const hasCurrentWeekInsight = weeklyHistory.some(
    insight => insight.week_start === currentWeekStart
  );

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
      {!loading && (currentInsight || weeklyHistory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Action Items */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-semibold text-gray-900">This Week's Focus</h3>
                </div>
                {currentInsight && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatWeekDisplay(currentInsight.week_start)}
                  </p>
                )}
              </div>
              <div className="p-4">
                {currentInsight?.improvement_tips && currentInsight.improvement_tips.length > 0 ? (
                  <ul className="space-y-3">
                    {currentInsight.improvement_tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          {idx + 1}
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No improvement tips available. Generate insights to see your action items.
                  </div>
                )}

                {/* Show AI Score Badge */}
                {currentInsight?.ai_score && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">AI Score</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${
                          currentInsight.ai_score >= 7 ? 'text-green-600' :
                          currentInsight.ai_score >= 5 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {currentInsight.ai_score}
                        </span>
                        <span className="text-sm text-gray-500">/ 10</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column: Score Graph */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">Score History</h3>
                  </div>
                  <select
                    value={timeframeWeeks}
                    onChange={(e) => setTimeframeWeeks(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={4}>4 weeks</option>
                    <option value={8}>8 weeks</option>
                    <option value={12}>12 weeks</option>
                  </select>
                </div>
              </div>
              <div className="p-4">
                {graphData.length > 1 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={graphData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="week"
                          stroke="#64748B"
                          fontSize={12}
                          tick={{ fill: '#64748B' }}
                        />
                        <YAxis
                          domain={[0, 10]}
                          stroke="#64748B"
                          fontSize={12}
                          tick={{ fill: '#64748B' }}
                          width={32}
                          ticks={[0, 2, 4, 6, 8, 10]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 'bold',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                          formatter={(value) => [`${value}/10`, 'AI Score']}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                              return `Week of ${formatWeekDisplay(payload[0].payload.fullDate)}`;
                            }
                            return label;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : graphData.length === 1 ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-5xl font-bold mb-2 ${
                        graphData[0].score >= 7 ? 'text-green-600' :
                        graphData[0].score >= 5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {graphData[0].score}
                      </div>
                      <p className="text-sm text-gray-500">/ 10</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Generate more weekly insights to see trends
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                    No data available. Generate insights to see your score history.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly History */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-base font-semibold text-gray-900">Weekly History</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {weeklyHistory.length > 0 ? (
                  weeklyHistory.slice(0, 12).map((insight) => (
                    <button
                      key={insight.id}
                      onClick={() => selectWeek(insight)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedWeek === insight.week_start ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dayjs(insight.week_start).format('D MMM')} - {dayjs(insight.week_start).add(6, 'day').format('D MMM')}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {insight.week_start === currentWeekStart ? 'This week' : dayjs(insight.week_start).format('YYYY')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          insight.ai_score >= 7 ? 'text-green-600' :
                          insight.ai_score >= 5 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {insight.ai_score}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No weekly insights yet. Generate your first insight to get started.
                  </div>
                )}
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
