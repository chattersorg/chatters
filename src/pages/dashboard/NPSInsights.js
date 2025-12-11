import React, { useState, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Users,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Table2,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const NPSInsights = () => {
  usePageTitle('NPS Insights');
  const { venueId } = useVenue();

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!venueId) return;
    loadInsights();
  }, [venueId, dateRange]);

  const loadInsights = async () => {
    try {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Load NPS submissions first (without join to avoid FK issues)
      const { data: npsData, error: npsError } = await supabase
        .from('nps_submissions')
        .select('*')
        .eq('venue_id', venueId);

      if (npsError) throw npsError;

      // If we have session_ids, fetch the linked feedback separately
      const sessionIds = (npsData || []).filter(s => s.session_id).map(s => s.session_id);
      let feedbackBySession = {};

      if (sessionIds.length > 0) {
        const { data: feedbackData } = await supabase
          .from('feedback')
          .select('id, session_id, rating, table_number, created_at')
          .in('session_id', sessionIds);

        // Create a lookup map by session_id
        (feedbackData || []).forEach(f => {
          feedbackBySession[f.session_id] = f;
        });
      }

      // Attach feedback to NPS submissions
      const enrichedNpsData = (npsData || []).map(s => ({
        ...s,
        feedback: s.session_id ? feedbackBySession[s.session_id] : null
      }));

      // Calculate insights - filter for submissions that have a score (responded)
      const linkedSubmissions = enrichedNpsData.filter(s => s.session_id && s.feedback && s.score !== null);
      const allResponses = enrichedNpsData.filter(s => s.score !== null);

      // Only show insights if we have some responses
      if (allResponses.length === 0) {
        setInsights(null);
        return;
      }

      // NPS by original feedback rating correlation (only for linked submissions)
      const ratingCorrelation = calculateRatingCorrelation(linkedSubmissions);

      // NPS by table/location (use table_number from NPS submission or linked session)
      const tableAnalysis = calculateTableAnalysis(allResponses);

      // Response time analysis
      const responseTimeAnalysis = calculateResponseTime(allResponses);

      // NPS by day of week
      const dayOfWeekAnalysis = calculateDayOfWeek(allResponses);

      // Feedback text analysis (NPS feedback comments)
      const feedbackAnalysis = analyzeFeedbackText(allResponses);

      // Response rate by feedback sentiment (only for linked submissions)
      const sentimentResponseRate = calculateSentimentResponseRate(enrichedNpsData.filter(s => s.session_id && s.feedback));

      setInsights({
        totalLinked: linkedSubmissions.length,
        totalResponses: allResponses.length,
        ratingCorrelation,
        tableAnalysis,
        responseTimeAnalysis,
        dayOfWeekAnalysis,
        feedbackAnalysis,
        sentimentResponseRate
      });

    } catch (error) {
      console.error('Error loading NPS insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRatingCorrelation = (submissions) => {
    const byRating = {};

    submissions.forEach(s => {
      const rating = s.feedback?.rating;
      if (rating !== null && rating !== undefined) {
        if (!byRating[rating]) {
          byRating[rating] = { scores: [], count: 0 };
        }
        byRating[rating].scores.push(s.score);
        byRating[rating].count++;
      }
    });

    return Object.entries(byRating)
      .map(([rating, data]) => {
        const avgNPS = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const promoters = data.scores.filter(s => s >= 9).length;
        const detractors = data.scores.filter(s => s <= 6).length;
        const npsScore = Math.round(((promoters - detractors) / data.scores.length) * 100);

        return {
          rating: parseInt(rating),
          avgNPS: Math.round(avgNPS * 10) / 10,
          npsScore,
          count: data.count
        };
      })
      .sort((a, b) => a.rating - b.rating);
  };

  const calculateTableAnalysis = (submissions) => {
    const byTable = {};

    submissions.forEach(s => {
      // Try to get table from linked feedback first, then from NPS submission itself
      const table = s.feedback?.table_number || s.table_number;
      if (table) {
        if (!byTable[table]) {
          byTable[table] = { scores: [], count: 0 };
        }
        if (s.score !== null) {
          byTable[table].scores.push(s.score);
          byTable[table].count++;
        }
      }
    });

    return Object.entries(byTable)
      .filter(([_, data]) => data.scores.length > 0)
      .map(([table, data]) => {
        const promoters = data.scores.filter(s => s >= 9).length;
        const detractors = data.scores.filter(s => s <= 6).length;
        const npsScore = data.scores.length > 0
          ? Math.round(((promoters - detractors) / data.scores.length) * 100)
          : 0;

        return {
          table,
          npsScore,
          count: data.count,
          promoters,
          detractors
        };
      })
      .sort((a, b) => b.npsScore - a.npsScore)
      .slice(0, 10);
  };

  const calculateResponseTime = (submissions) => {
    const responseTimes = submissions
      .filter(s => s.sent_at && s.responded_at)
      .map(s => {
        const sent = new Date(s.sent_at);
        const responded = new Date(s.responded_at);
        return (responded - sent) / (1000 * 60 * 60); // hours
      });

    if (responseTimes.length === 0) {
      return { average: 0, median: 0, byHour: [] };
    }

    const sorted = [...responseTimes].sort((a, b) => a - b);
    const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    // Group by hour buckets
    const hourBuckets = [
      { label: '< 1 hour', min: 0, max: 1 },
      { label: '1-6 hours', min: 1, max: 6 },
      { label: '6-24 hours', min: 6, max: 24 },
      { label: '1-3 days', min: 24, max: 72 },
      { label: '> 3 days', min: 72, max: Infinity }
    ];

    const byHour = hourBuckets.map(bucket => ({
      label: bucket.label,
      count: responseTimes.filter(t => t >= bucket.min && t < bucket.max).length
    }));

    return {
      average: Math.round(average * 10) / 10,
      median: Math.round(median * 10) / 10,
      byHour
    };
  };

  const calculateDayOfWeek = (submissions) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const byDay = days.map(day => ({ day, scores: [] }));

    submissions.forEach(s => {
      if (s.responded_at) {
        const dayIndex = new Date(s.responded_at).getDay();
        byDay[dayIndex].scores.push(s.score);
      }
    });

    return byDay.map(d => {
      const promoters = d.scores.filter(s => s >= 9).length;
      const detractors = d.scores.filter(s => s <= 6).length;
      const npsScore = d.scores.length > 0
        ? Math.round(((promoters - detractors) / d.scores.length) * 100)
        : null;

      return {
        day: d.day.slice(0, 3),
        npsScore,
        count: d.scores.length
      };
    });
  };

  const analyzeFeedbackText = (submissions) => {
    const withFeedback = submissions.filter(s => s.feedback && s.feedback.trim());

    const promoterFeedback = withFeedback.filter(s => s.score >= 9);
    const passiveFeedback = withFeedback.filter(s => s.score >= 7 && s.score <= 8);
    const detractorFeedback = withFeedback.filter(s => s.score <= 6);

    return {
      total: withFeedback.length,
      promoters: promoterFeedback.length,
      passives: passiveFeedback.length,
      detractors: detractorFeedback.length,
      recentFeedback: withFeedback
        .sort((a, b) => new Date(b.responded_at) - new Date(a.responded_at))
        .slice(0, 5)
    };
  };

  const calculateSentimentResponseRate = (submissions) => {
    // Group by original feedback rating
    const byRating = {};

    submissions.forEach(s => {
      if (s.feedback?.rating) {
        const rating = s.feedback.rating;
        if (!byRating[rating]) {
          byRating[rating] = { sent: 0, responded: 0 };
        }
        if (s.sent_at) byRating[rating].sent++;
        if (s.responded_at) byRating[rating].responded++;
      }
    });

    return Object.entries(byRating)
      .map(([rating, data]) => ({
        rating: parseInt(rating),
        responseRate: data.sent > 0 ? Math.round((data.responded / data.sent) * 100) : 0,
        sent: data.sent,
        responded: data.responded
      }))
      .sort((a, b) => a.rating - b.rating);
  };

  const getNPSColor = (score) => {
    if (score === null) return '#9ca3af';
    if (score >= 50) return '#10b981';
    if (score >= 0) return '#f59e0b';
    return '#ef4444';
  };

  const getCategoryIcon = (score) => {
    if (score >= 50) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 0) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  if (!venueId) return null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 dark:text-gray-400 mb-2">No NPS responses yet</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Insights will appear once customers respond to NPS surveys.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Deep analysis correlating NPS with feedback data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{insights.totalResponses}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total NPS Responses</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{insights.totalLinked}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Linked to Feedback</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {insights.responseTimeAnalysis.average}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Correlation: Feedback Rating vs NPS */}
      {insights.ratingCorrelation.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback Rating vs NPS Score</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              How does the original feedback rating correlate with NPS responses?
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.ratingCorrelation} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis
                  dataKey="rating"
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(val) => `${val} star`}
                />
                <YAxis
                  domain={[-100, 100]}
                  stroke="#64748B"
                  fontSize={12}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name, props) => [
                    `NPS: ${value}`,
                    `${props.payload.count} responses`
                  ]}
                />
                <Bar dataKey="npsScore" radius={[4, 4, 0, 0]}>
                  {insights.ratingCorrelation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getNPSColor(entry.npsScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {insights.ratingCorrelation.map(item => (
              <div key={item.rating} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="text-lg font-bold" style={{ color: getNPSColor(item.npsScore) }}>
                  {item.npsScore}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{item.count} resp.</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS by Day of Week */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              NPS by Day of Week
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Which days generate the highest NPS scores?
            </p>
          </div>
          <div className="space-y-2">
            {insights.dayOfWeekAnalysis.map(day => (
              <div key={day.day} className="flex items-center gap-3">
                <div className="w-10 text-sm font-medium text-gray-600 dark:text-gray-400">{day.day}</div>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                  {day.npsScore !== null && (
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${Math.max(0, (day.npsScore + 100) / 2)}%`,
                        backgroundColor: getNPSColor(day.npsScore)
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.npsScore !== null ? day.npsScore : '—'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{day.count} resp.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Response Time Distribution
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              How quickly do customers respond to NPS surveys?
            </p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.responseTimeAnalysis.byHour} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={12} width={32} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-around text-center">
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {insights.responseTimeAnalysis.average}h
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {insights.responseTimeAnalysis.median}h
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Median</div>
            </div>
          </div>
        </div>
      </div>

      {/* NPS by Table/Location */}
      {insights.tableAnalysis.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Table2 className="w-5 h-5 text-gray-500" />
              NPS by Table/Location
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Which tables or locations generate the best NPS scores?
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Table</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">NPS Score</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Responses</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Promoters</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Detractors</th>
                </tr>
              </thead>
              <tbody>
                {insights.tableAnalysis.map((row) => (
                  <tr key={row.table} className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Table {row.table}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-flex items-center gap-1 font-bold"
                        style={{ color: getNPSColor(row.npsScore) }}
                      >
                        {getCategoryIcon(row.npsScore)}
                        {row.npsScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-center text-green-600">{row.promoters}</td>
                    <td className="py-3 px-4 text-center text-red-600">{row.detractors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent NPS Feedback Comments */}
      {insights.feedbackAnalysis.total > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              Recent NPS Feedback Comments
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {insights.feedbackAnalysis.total} responses included additional feedback
            </p>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
              {insights.feedbackAnalysis.promoters} Promoters
            </div>
            <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
              {insights.feedbackAnalysis.passives} Passives
            </div>
            <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
              {insights.feedbackAnalysis.detractors} Detractors
            </div>
          </div>

          <div className="space-y-3">
            {insights.feedbackAnalysis.recentFeedback.map((item) => {
              const category = item.score >= 9 ? 'promoter' : item.score >= 7 ? 'passive' : 'detractor';
              const colors = {
                promoter: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
                passive: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
                detractor: 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
              };

              return (
                <div key={item.id} className={`p-4 rounded-lg border-l-4 ${colors[category]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${
                      category === 'promoter' ? 'text-green-600' :
                      category === 'passive' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Score: {item.score}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.responded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{item.feedback}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Response Rate by Original Sentiment */}
      {insights.sentimentResponseRate.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Response Rate by Original Feedback Rating
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Do happier customers respond to NPS surveys more often?
            </p>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {insights.sentimentResponseRate.map(item => (
              <div key={item.rating} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.responseRate}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.responded}/{item.sent} responded
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NPSInsights;
