import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// Helper to calculate date ranges from presets
const getDateRangeFromPreset = (dateRange) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  if (dateRange?.preset === 'custom' && dateRange.from && dateRange.to) {
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return { start: from, end: to };
  }

  switch (dateRange?.preset) {
    case 'yesterday': {
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { start: yesterday, end: yesterdayEnd };
    }
    case 'last7': {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return { start: sevenDaysAgo, end: todayEnd };
    }
    case 'last14': {
      const fourteenDaysAgo = new Date(todayStart);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      return { start: fourteenDaysAgo, end: todayEnd };
    }
    case 'last30': {
      const thirtyDaysAgo = new Date(todayStart);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      return { start: thirtyDaysAgo, end: todayEnd };
    }
    case 'all': {
      // Go back 1 year for "all time"
      const oneYearAgo = new Date(todayStart);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return { start: oneYearAgo, end: todayEnd };
    }
    case 'today':
    default:
      return { start: todayStart, end: todayEnd };
  }
};

// Calculate comparison period (same duration, immediately before)
const getComparisonRange = (start, end) => {
  const duration = end - start;
  const comparisonEnd = new Date(start.getTime() - 1); // 1ms before start
  comparisonEnd.setHours(23, 59, 59, 999);
  const comparisonStart = new Date(comparisonEnd.getTime() - duration);
  comparisonStart.setHours(0, 0, 0, 0);
  return { start: comparisonStart, end: comparisonEnd };
};

const useMultiVenueOverviewStats = (venueIds = [], dateRange = { preset: 'today' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create a stable string representation of dateRange for dependency
  const dateRangeKey = JSON.stringify(dateRange);

  useEffect(() => {
    if (!venueIds || venueIds.length === 0) {
      setStats(null);
      setLoading(false);
      return;
    }

    fetchStats();
  }, [venueIds.join(','), dateRangeKey]); // Re-fetch when venue selection or date range changes

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date ranges based on preset or custom selection
      const { start: rangeStart, end: rangeEnd } = getDateRangeFromPreset(dateRange);
      const { start: comparisonStart, end: comparisonEnd } = getComparisonRange(rangeStart, rangeEnd);

      // Calculate number of days in the range for sparkline
      const rangeDays = Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));

      // Fetch feedback for selected date range
      const { data: rangeFeedback, error: rangeFeedbackError } = await supabase
        .from('feedback')
        .select('id, session_id, rating, created_at, resolved_at, is_actioned, venue_id')
        .in('venue_id', venueIds)
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())
        .order('created_at', { ascending: false });

      if (rangeFeedbackError) throw rangeFeedbackError;

      // Fetch comparison period feedback
      const { data: comparisonFeedback } = await supabase
        .from('feedback')
        .select('id, session_id, rating, resolved_at, is_actioned, venue_id')
        .in('venue_id', venueIds)
        .gte('created_at', comparisonStart.toISOString())
        .lte('created_at', comparisonEnd.toISOString());

      // Fetch assistance requests for selected date range
      const { data: rangeAssistance } = await supabase
        .from('assistance_requests')
        .select('id, created_at, acknowledged_at, resolved_at, venue_id')
        .in('venue_id', venueIds)
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())
        .order('created_at', { ascending: false });

      // Fetch comparison period assistance
      const { data: comparisonAssistance } = await supabase
        .from('assistance_requests')
        .select('id, created_at, acknowledged_at, resolved_at, venue_id')
        .in('venue_id', venueIds)
        .gte('created_at', comparisonStart.toISOString())
        .lte('created_at', comparisonEnd.toISOString());

      // For sparklines, use the selected range data (already fetched above)
      // We'll calculate daily breakdowns from rangeFeedback and rangeAssistance

      // Calculate aggregated stats
      const rangeSessionIds = new Set(rangeFeedback?.map(f => f.session_id) || []);
      const rangeAssistanceCount = rangeAssistance?.length || 0;
      const rangeSessions = rangeSessionIds.size + rangeAssistanceCount;

      const comparisonSessionIds = new Set(comparisonFeedback?.map(f => f.session_id) || []);
      const comparisonAssistanceCount = comparisonAssistance?.length || 0;
      const comparisonSessions = comparisonSessionIds.size + comparisonAssistanceCount;

      // Average satisfaction
      const rangeRatings = rangeFeedback?.filter(f => f.rating).map(f => f.rating) || [];
      const avgSatisfaction = rangeRatings.length > 0
        ? (rangeRatings.reduce((a, b) => a + b, 0) / rangeRatings.length).toFixed(1)
        : null;

      const comparisonRatings = comparisonFeedback?.filter(f => f.rating).map(f => f.rating) || [];
      const comparisonAvgSatisfaction = comparisonRatings.length > 0
        ? comparisonRatings.reduce((a, b) => a + b, 0) / comparisonRatings.length
        : null;

      // Response time calculation
      const resolvedAssistanceRange = rangeAssistance?.filter(a => a.resolved_at) || [];
      const resolvedFeedbackSessionsMap = {};
      (rangeFeedback?.filter(f => f.resolved_at && f.is_actioned) || []).forEach(f => {
        if (!resolvedFeedbackSessionsMap[f.session_id]) {
          resolvedFeedbackSessionsMap[f.session_id] = { created_at: f.created_at, resolved_at: f.resolved_at };
        } else {
          if (new Date(f.created_at) < new Date(resolvedFeedbackSessionsMap[f.session_id].created_at)) {
            resolvedFeedbackSessionsMap[f.session_id].created_at = f.created_at;
          }
          if (new Date(f.resolved_at) > new Date(resolvedFeedbackSessionsMap[f.session_id].resolved_at)) {
            resolvedFeedbackSessionsMap[f.session_id].resolved_at = f.resolved_at;
          }
        }
      });
      const resolvedFeedbackSessionsForResponseTime = Object.values(resolvedFeedbackSessionsMap);
      const allResolvedRange = [...resolvedAssistanceRange, ...resolvedFeedbackSessionsForResponseTime];

      const avgResponseTime = allResolvedRange.length > 0
        ? calculateAverageResponseTime(allResolvedRange)
        : null;

      // Comparison period response time for trend
      const resolvedAssistanceComparison = comparisonAssistance?.filter(a => a.resolved_at) || [];
      const resolvedFeedbackSessionsMapComparison = {};
      (comparisonFeedback?.filter(f => f.resolved_at && f.is_actioned) || []).forEach(f => {
        if (!resolvedFeedbackSessionsMapComparison[f.session_id]) {
          resolvedFeedbackSessionsMapComparison[f.session_id] = { created_at: f.created_at, resolved_at: f.resolved_at };
        }
      });
      const allResolvedComparison = [...resolvedAssistanceComparison, ...Object.values(resolvedFeedbackSessionsMapComparison)];
      const comparisonAvgResponseTime = allResolvedComparison.length > 0
        ? calculateAverageResponseTimeMs(allResolvedComparison)
        : null;

      // Completion rate
      const totalFeedbackSessionsRange = rangeSessionIds.size;
      const resolvedFeedbackSessionsRange = new Set(
        rangeFeedback?.filter(f => f.resolved_at && f.is_actioned).map(f => f.session_id) || []
      ).size;

      const totalAssistanceRange = rangeAssistance?.length || 0;
      const resolvedAssistanceCountRange = resolvedAssistanceRange.length;

      const totalRange = totalFeedbackSessionsRange + totalAssistanceRange;
      const completedRange = resolvedFeedbackSessionsRange + resolvedAssistanceCountRange;
      const completionRate = totalRange > 0 ? Math.round((completedRange / totalRange) * 100) : null;

      // Comparison completion rate
      const totalFeedbackSessionsComparison = comparisonSessionIds.size;
      const resolvedFeedbackSessionsComparison = new Set(
        comparisonFeedback?.filter(f => f.resolved_at && f.is_actioned).map(f => f.session_id) || []
      ).size;
      const totalAssistanceComparison = comparisonAssistance?.length || 0;
      const resolvedAssistanceCountComparison = resolvedAssistanceComparison.length;
      const totalComparison = totalFeedbackSessionsComparison + totalAssistanceComparison;
      const completedComparison = resolvedFeedbackSessionsComparison + resolvedAssistanceCountComparison;
      const comparisonCompletionRate = totalComparison > 0 ? (completedComparison / totalComparison) * 100 : null;

      // Active alerts
      const activeAlerts = rangeAssistance?.filter(a => !a.resolved_at).length || 0;
      const comparisonActiveAlerts = comparisonAssistance?.filter(a => !a.resolved_at).length || 0;

      // NPS Score
      const calculateNPS = (ratings) => {
        if (!ratings || ratings.length === 0) return null;
        const promoters = ratings.filter(r => r === 5).length;
        const detractors = ratings.filter(r => r <= 3).length;
        const total = ratings.length;
        return Math.round(((promoters - detractors) / total) * 100);
      };

      const rangeNPS = calculateNPS(rangeRatings);
      const comparisonNPS = calculateNPS(comparisonRatings);

      // Peak hour
      const peakHour = calculatePeakHour(rangeFeedback || []);

      // Calculate trends
      const sessionsTrend = calculateTrend(rangeSessions, comparisonSessions);
      const satisfactionTrend = avgSatisfaction && comparisonAvgSatisfaction
        ? calculateTrend(parseFloat(avgSatisfaction), comparisonAvgSatisfaction, true)
        : null;

      const rangeResponseTimeMs = allResolvedRange.length > 0 ? calculateAverageResponseTimeMs(allResolvedRange) : null;
      const responseTimeTrend = rangeResponseTimeMs !== null && comparisonAvgResponseTime !== null
        ? calculateTrend(rangeResponseTimeMs, comparisonAvgResponseTime, false, true)
        : null;

      const completionTrend = completionRate && comparisonCompletionRate
        ? calculateTrend(completionRate, comparisonCompletionRate, true)
        : null;

      const alertsTrend = calculateTrend(activeAlerts, comparisonActiveAlerts, false, true);
      const resolvedTrend = calculateTrend(completedRange, completedComparison, true);

      const npsTrend = rangeNPS !== null && comparisonNPS !== null
        ? {
            value: rangeNPS - comparisonNPS >= 0 ? `+${rangeNPS - comparisonNPS}` : `${rangeNPS - comparisonNPS}`,
            direction: rangeNPS > comparisonNPS ? 'up' : rangeNPS < comparisonNPS ? 'down' : 'neutral'
          }
        : null;

      // Calculate sparklines using the range data
      const sessionsSparkline = calculateSparkline(rangeFeedback, rangeAssistance, 'sessions', rangeStart, rangeEnd, rangeDays);
      const satisfactionSparkline = calculateSparkline(rangeFeedback, rangeAssistance, 'satisfaction', rangeStart, rangeEnd, rangeDays);
      const responseTimeSparkline = calculateSparkline(rangeFeedback, rangeAssistance, 'responseTime', rangeStart, rangeEnd, rangeDays);
      const completionRateSparkline = calculateSparkline(rangeFeedback, rangeAssistance, 'completionRate', rangeStart, rangeEnd, rangeDays);

      // Calculate sparkline dates for X-axis labels
      const { numPoints, intervalMs } = getSparklineIntervals(rangeStart, rangeEnd, rangeDays);
      const sparklineDates = [];
      for (let i = 0; i < numPoints; i++) {
        const bucketStart = new Date(rangeStart.getTime() + (i * intervalMs));
        sparklineDates.push(bucketStart.toISOString());
      }

      // Calculate per-venue sparklines for multi-venue charts
      const perVenueSparklines = {};
      for (const venueId of venueIds) {
        const venueFeedback = rangeFeedback?.filter(f => f.venue_id === venueId) || [];
        const venueAssistance = rangeAssistance?.filter(a => a.venue_id === venueId) || [];

        perVenueSparklines[venueId] = {
          sessions: calculateSparkline(venueFeedback, venueAssistance, 'sessions', rangeStart, rangeEnd, rangeDays),
          satisfaction: calculateSparkline(venueFeedback, venueAssistance, 'satisfaction', rangeStart, rangeEnd, rangeDays),
          responseTime: calculateSparkline(venueFeedback, venueAssistance, 'responseTime', rangeStart, rangeEnd, rangeDays),
          completionRate: calculateSparkline(venueFeedback, venueAssistance, 'completionRate', rangeStart, rangeEnd, rangeDays)
        };
      }

      setStats({
        todaySessions: rangeSessions,
        lastWeekSessions: comparisonSessions,
        avgSatisfaction,
        avgResponseTime,
        completionRate,
        activeAlerts,
        lastWeekActiveAlerts: comparisonActiveAlerts,
        resolvedToday: completedRange,
        lastWeekResolved: completedComparison,
        peakHour,
        // NPS
        npsScore: rangeNPS,
        lastWeekNPS: comparisonNPS,
        npsTrend: npsTrend?.value,
        npsTrendDirection: npsTrend?.direction,
        // Trends
        sessionsTrend: sessionsTrend?.value,
        sessionsTrendDirection: sessionsTrend?.direction,
        satisfactionTrend: satisfactionTrend?.value,
        satisfactionTrendDirection: satisfactionTrend?.direction,
        responseTimeTrend: responseTimeTrend?.value,
        responseTimeTrendDirection: responseTimeTrend?.direction,
        completionTrend: completionTrend?.value,
        completionTrendDirection: completionTrend?.direction,
        alertsTrend: alertsTrend?.value,
        alertsTrendDirection: alertsTrend?.direction,
        resolvedTrend: resolvedTrend?.value,
        resolvedTrendDirection: resolvedTrend?.direction,
        // Sparklines
        sessionsSparkline,
        satisfactionSparkline,
        responseTimeSparkline,
        completionRateSparkline,
        // Per-venue sparklines for multi-venue charts
        perVenueSparklines,
        // Sparkline dates for X-axis labels
        sparklineDates
      });

    } catch (err) {
      console.error('Error fetching multi-venue stats:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageResponseTime = (resolvedRequests) => {
    if (!resolvedRequests.length) return null;

    const totalMs = resolvedRequests.reduce((sum, request) => {
      const created = new Date(request.created_at);
      const resolved = new Date(request.resolved_at);
      return sum + (resolved - created);
    }, 0);

    const avgMs = totalMs / resolvedRequests.length;
    const minutes = Math.round(avgMs / 60000);

    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${minutes}m`;
    return `${Math.round(minutes / 60)}h ${minutes % 60}m`;
  };

  const calculateAverageResponseTimeMs = (resolvedRequests) => {
    if (!resolvedRequests.length) return null;

    let validCount = 0;
    const totalMs = resolvedRequests.reduce((sum, request) => {
      const created = new Date(request.created_at);
      const resolved = new Date(request.resolved_at);
      const diff = resolved - created;
      if (!isNaN(diff) && diff >= 0) {
        validCount++;
        return sum + diff;
      }
      return sum;
    }, 0);

    return validCount > 0 ? totalMs / validCount : null;
  };

  const calculatePeakHour = (feedback) => {
    if (!feedback.length) return null;

    const hourCounts = {};
    feedback.forEach(f => {
      const hour = new Date(f.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[a] > hourCounts[b] ? a : b
    );

    const hour12 = parseInt(peakHour) % 12 || 12;
    const ampm = parseInt(peakHour) < 12 ? 'AM' : 'PM';
    return `${hour12}${ampm}`;
  };

  const calculateTrend = (current, previous, higherIsBetter = true, lowerIsBetter = false) => {
    if (current === null || previous === null) return null;
    if (isNaN(current) || isNaN(previous)) return null;

    if (previous === 0) {
      if (current === 0) {
        return { value: '~0%', direction: 'neutral' };
      }
      const direction = lowerIsBetter
        ? (current > 0 ? 'down' : 'up')
        : (current > 0 ? 'up' : 'down');
      return { value: `+${current}`, direction };
    }

    const percentChange = ((current - previous) / previous) * 100;
    const absChange = Math.abs(percentChange);

    if (absChange < 1) return { value: '~0%', direction: 'neutral' };

    const value = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(0)}%`;

    let direction;
    if (lowerIsBetter) {
      direction = percentChange < 0 ? 'up' : 'down';
    } else {
      direction = percentChange > 0 ? 'up' : 'down';
    }

    return { value, direction };
  };

  // Calculate sparkline intervals for a given date range
  const getSparklineIntervals = (rangeStart, rangeEnd, rangeDays) => {
    let numPoints = rangeDays;
    let intervalMs = 24 * 60 * 60 * 1000; // 1 day in ms

    if (rangeDays > 60) {
      numPoints = Math.ceil(rangeDays / 7);
      intervalMs = 7 * 24 * 60 * 60 * 1000;
    } else if (rangeDays > 30) {
      numPoints = Math.ceil(rangeDays / 2);
      intervalMs = 2 * 24 * 60 * 60 * 1000;
    }

    if (numPoints > 30) {
      const factor = Math.ceil(numPoints / 30);
      numPoints = Math.ceil(numPoints / factor);
      intervalMs = intervalMs * factor;
    }

    return { numPoints, intervalMs };
  };

  // Calculate sparkline for a given date range, dividing into appropriate intervals
  const calculateSparkline = (feedback, assistance, metric, rangeStart, rangeEnd, rangeDays) => {
    const sparklineData = [];
    const { numPoints, intervalMs } = getSparklineIntervals(rangeStart, rangeEnd, rangeDays);

    for (let i = 0; i < numPoints; i++) {
      const bucketStart = new Date(rangeStart.getTime() + (i * intervalMs));
      const bucketEnd = new Date(Math.min(bucketStart.getTime() + intervalMs - 1, rangeEnd.getTime()));

      const bucketFeedback = feedback?.filter(f => {
        const createdAt = new Date(f.created_at);
        return createdAt >= bucketStart && createdAt <= bucketEnd;
      }) || [];

      const bucketAssistance = assistance?.filter(a => {
        const createdAt = new Date(a.created_at);
        return createdAt >= bucketStart && createdAt <= bucketEnd;
      }) || [];

      let value = 0;

      switch (metric) {
        case 'sessions':
          const sessionIds = new Set(bucketFeedback.map(f => f.session_id));
          value = sessionIds.size + bucketAssistance.length;
          break;

        case 'satisfaction':
          const ratings = bucketFeedback.filter(f => f.rating).map(f => f.rating);
          value = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
          break;

        case 'responseTime':
          const resolvedAssistance = bucketAssistance.filter(a => a.resolved_at);
          const resolvedFeedback = bucketFeedback.filter(f => f.resolved_at && f.is_actioned);
          const allResolved = [...resolvedAssistance, ...resolvedFeedback];

          if (allResolved.length > 0) {
            const totalMs = allResolved.reduce((sum, request) => {
              const created = new Date(request.created_at);
              const resolved = new Date(request.resolved_at);
              return sum + (resolved - created);
            }, 0);
            value = totalMs / allResolved.length / 60000;
          }
          break;

        case 'completionRate':
          const totalFeedbackSessions = new Set(bucketFeedback.map(f => f.session_id)).size;
          const resolvedFeedbackSessions = new Set(
            bucketFeedback.filter(f => f.resolved_at && f.is_actioned).map(f => f.session_id)
          ).size;
          const totalAssistance = bucketAssistance.length;
          const resolvedAssistanceCount = bucketAssistance.filter(a => a.resolved_at).length;

          const total = totalFeedbackSessions + totalAssistance;
          const completed = resolvedFeedbackSessions + resolvedAssistanceCount;
          value = total > 0 ? (completed / total) * 100 : 0;
          break;

        default:
          value = 0;
      }

      sparklineData.push(value);
    }

    return sparklineData;
  };

  return { stats, loading, error, refetch: fetchStats };
};

export default useMultiVenueOverviewStats;
