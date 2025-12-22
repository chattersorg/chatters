import { useState, useEffect } from 'react';
import { supabase, logQuery } from '../utils/supabase';

const IS_DEV = process.env.NODE_ENV === 'development';

const useOverviewStats = (venueId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!venueId) {
      setStats(null);
      setLoading(false);
      return;
    }

    fetchStats();
  }, [venueId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const pageStartTime = IS_DEV ? performance.now() : 0;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      // Calculate 7-day lookback for sparkline data
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      // Fetch today's feedback sessions (including resolution info)
      const todayFeedbackResult = await logQuery(
        'feedback:today',
        supabase
          .from('feedback')
          .select('id, session_id, rating, created_at, resolved_at, is_actioned')
          .eq('venue_id', venueId)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
      );
      const todayFeedback = todayFeedbackResult.data;

      // Fetch yesterday's feedback for comparison
      const yesterdayFeedbackResult = await logQuery(
        'feedback:yesterday',
        supabase
          .from('feedback')
          .select('id, session_id, rating, resolved_at, is_actioned')
          .eq('venue_id', venueId)
          .gte('created_at', yesterdayStart.toISOString())
          .lt('created_at', todayStart.toISOString())
      );
      const yesterdayFeedback = yesterdayFeedbackResult.data;

      // Fetch today's assistance requests
      const todayAssistanceResult = await logQuery(
        'assistance_requests:today',
        supabase
          .from('assistance_requests')
          .select('id, created_at, acknowledged_at, resolved_at')
          .eq('venue_id', venueId)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
      );
      const todayAssistance = todayAssistanceResult.data;

      // Fetch yesterday's assistance for comparison
      const yesterdayAssistanceResult = await logQuery(
        'assistance_requests:yesterday',
        supabase
          .from('assistance_requests')
          .select('id, created_at, acknowledged_at, resolved_at')
          .eq('venue_id', venueId)
          .gte('created_at', yesterdayStart.toISOString())
          .lt('created_at', todayStart.toISOString())
      );
      const yesterdayAssistance = yesterdayAssistanceResult.data;

      // Fetch 7-day data for sparklines
      const sevenDayFeedbackResult = await logQuery(
        'feedback:7days',
        supabase
          .from('feedback')
          .select('id, session_id, rating, created_at, resolved_at, is_actioned')
          .eq('venue_id', venueId)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: true })
      );
      const sevenDayFeedback = sevenDayFeedbackResult.data;

      const sevenDayAssistanceResult = await logQuery(
        'assistance_requests:7days',
        supabase
          .from('assistance_requests')
          .select('id, created_at, acknowledged_at, resolved_at')
          .eq('venue_id', venueId)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: true })
      );
      const sevenDayAssistance = sevenDayAssistanceResult.data;

      // Calculate stats - count unique feedback sessions + assistance requests
      const todaySessionIds = new Set(todayFeedback?.map(f => f.session_id) || []);
      const todayAssistanceCount = todayAssistance?.length || 0;
      const todaySessions = todaySessionIds.size + todayAssistanceCount;

      const yesterdaySessionIds = new Set(yesterdayFeedback?.map(f => f.session_id) || []);
      const yesterdayAssistanceCount = yesterdayAssistance?.length || 0;
      const yesterdaySessions = yesterdaySessionIds.size + yesterdayAssistanceCount;
      
      // Average satisfaction
      const todayRatings = todayFeedback?.filter(f => f.rating).map(f => f.rating) || [];
      const avgSatisfaction = todayRatings.length > 0 
        ? (todayRatings.reduce((a, b) => a + b, 0) / todayRatings.length).toFixed(1)
        : null;

      const yesterdayRatings = yesterdayFeedback?.filter(f => f.rating).map(f => f.rating) || [];
      const yesterdayAvgSatisfaction = yesterdayRatings.length > 0 
        ? yesterdayRatings.reduce((a, b) => a + b, 0) / yesterdayRatings.length
        : null;

      // Response time calculation - use sessions (not individual feedback items)
      // Group feedback by session to get earliest created_at and latest resolved_at per session
      const resolvedAssistanceToday = todayAssistance?.filter(a => a.resolved_at) || [];

      const resolvedFeedbackSessionsMap = {};
      (todayFeedback?.filter(f => f.resolved_at && f.is_actioned) || []).forEach(f => {
        if (!resolvedFeedbackSessionsMap[f.session_id]) {
          resolvedFeedbackSessionsMap[f.session_id] = { created_at: f.created_at, resolved_at: f.resolved_at };
        } else {
          // Use earliest created_at and latest resolved_at for the session
          if (new Date(f.created_at) < new Date(resolvedFeedbackSessionsMap[f.session_id].created_at)) {
            resolvedFeedbackSessionsMap[f.session_id].created_at = f.created_at;
          }
          if (new Date(f.resolved_at) > new Date(resolvedFeedbackSessionsMap[f.session_id].resolved_at)) {
            resolvedFeedbackSessionsMap[f.session_id].resolved_at = f.resolved_at;
          }
        }
      });
      const resolvedFeedbackSessionsForResponseTime = Object.values(resolvedFeedbackSessionsMap);
      const allResolvedToday = [...resolvedAssistanceToday, ...resolvedFeedbackSessionsForResponseTime];

      const avgResponseTime = allResolvedToday.length > 0
        ? calculateAverageResponseTime(allResolvedToday)
        : null;

      const resolvedAssistanceYesterday = yesterdayAssistance?.filter(a => a.resolved_at) || [];

      const resolvedFeedbackSessionsMapYesterday = {};
      (yesterdayFeedback?.filter(f => f.resolved_at && f.is_actioned) || []).forEach(f => {
        if (!resolvedFeedbackSessionsMapYesterday[f.session_id]) {
          resolvedFeedbackSessionsMapYesterday[f.session_id] = { created_at: f.created_at, resolved_at: f.resolved_at };
        } else {
          if (new Date(f.created_at) < new Date(resolvedFeedbackSessionsMapYesterday[f.session_id].created_at)) {
            resolvedFeedbackSessionsMapYesterday[f.session_id].created_at = f.created_at;
          }
          if (new Date(f.resolved_at) > new Date(resolvedFeedbackSessionsMapYesterday[f.session_id].resolved_at)) {
            resolvedFeedbackSessionsMapYesterday[f.session_id].resolved_at = f.resolved_at;
          }
        }
      });
      const resolvedFeedbackSessionsForResponseTimeYesterday = Object.values(resolvedFeedbackSessionsMapYesterday);
      const allResolvedYesterday = [...resolvedAssistanceYesterday, ...resolvedFeedbackSessionsForResponseTimeYesterday];

      const yesterdayAvgResponseTime = allResolvedYesterday.length > 0
        ? calculateAverageResponseTimeMs(allResolvedYesterday)
        : null;

      // Completion rate - include both feedback sessions and assistance
      const totalFeedbackSessionsToday = todaySessionIds.size;
      const resolvedFeedbackSessionsToday = new Set(
        todayFeedback?.filter(f => f.resolved_at && f.is_actioned).map(f => f.session_id) || []
      ).size;

      const totalAssistanceToday = todayAssistance?.length || 0;
      const resolvedAssistanceCountToday = resolvedAssistanceToday.length;

      const totalToday = totalFeedbackSessionsToday + totalAssistanceToday;
      const completedToday = resolvedFeedbackSessionsToday + resolvedAssistanceCountToday;
      const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : null;

      const totalFeedbackSessionsYesterday = yesterdaySessionIds.size;
      const resolvedFeedbackSessionsYesterday = new Set(
        yesterdayFeedback?.filter(f => f.resolved_at && f.is_actioned).map(f => f.session_id) || []
      ).size;

      const totalAssistanceYesterday = yesterdayAssistance?.length || 0;
      const resolvedAssistanceCountYesterday = resolvedAssistanceYesterday.length;

      const totalYesterday = totalFeedbackSessionsYesterday + totalAssistanceYesterday;
      const completedYesterday = resolvedFeedbackSessionsYesterday + resolvedAssistanceCountYesterday;
      const yesterdayCompletionRate = totalYesterday > 0 ? (completedYesterday / totalYesterday) * 100 : null;

      // Active alerts (unresolved assistance requests)
      const activeAlerts = todayAssistance?.filter(a => !a.resolved_at).length || 0;
      const yesterdayActiveAlerts = yesterdayAssistance?.filter(a => !a.resolved_at).length || 0;

      // Peak hour analysis
      const peakHour = calculatePeakHour(todayFeedback || []);
      const yesterdayPeakHour = calculatePeakHour(yesterdayFeedback || []);

      // Activity level
      const currentActivity = calculateActivityLevel(todaySessions);
      const yesterdayActivity = calculateActivityLevel(yesterdaySessions);

      // Calculate trends - all compared to yesterday
      const sessionsTrend = calculateTrend(todaySessions, yesterdaySessions);
      const satisfactionTrend = avgSatisfaction && yesterdayAvgSatisfaction
        ? calculateTrend(parseFloat(avgSatisfaction), yesterdayAvgSatisfaction, true)
        : null;
      const responseTimeTrend = avgResponseTime && yesterdayAvgResponseTime
        ? calculateTrend(calculateAverageResponseTimeMs(allResolvedToday), yesterdayAvgResponseTime, false, true)
        : null;
      const completionTrend = completionRate && yesterdayCompletionRate
        ? calculateTrend(completionRate, yesterdayCompletionRate, true)
        : null;

      // Additional trends for MetricCard stats
      const alertsTrend = calculateTrend(activeAlerts, yesterdayActiveAlerts, false, true); // Lower is better
      const resolvedTrend = calculateTrend(completedToday, completedYesterday, true);

      // Calculate hourly sparkline data for today (more dramatic visualization)
      const sessionsSparkline = calculateHourlySparkline(todayFeedback, todayAssistance, 'sessions');
      const satisfactionSparkline = calculateHourlySparkline(todayFeedback, todayAssistance, 'satisfaction');
      const responseTimeSparkline = calculateHourlySparkline(todayFeedback, todayAssistance, 'responseTime');
      const completionRateSparkline = calculateHourlySparkline(todayFeedback, todayAssistance, 'completionRate');

      setStats({
        todaySessions,
        yesterdaySessions,
        avgSatisfaction,
        avgResponseTime,
        completionRate,
        activeAlerts,
        yesterdayActiveAlerts,
        resolvedToday: completedToday,
        yesterdayResolved: completedYesterday,
        currentActivity,
        yesterdayActivity,
        peakHour,
        yesterdayPeakHour,
        // Session trends
        sessionsTrend: sessionsTrend?.value,
        sessionsTrendDirection: sessionsTrend?.direction,
        // Satisfaction trends
        satisfactionTrend: satisfactionTrend?.value,
        satisfactionTrendDirection: satisfactionTrend?.direction,
        // Response time trends
        responseTimeTrend: responseTimeTrend?.value,
        responseTimeTrendDirection: responseTimeTrend?.direction,
        // Completion rate trends
        completionTrend: completionTrend?.value,
        completionTrendDirection: completionTrend?.direction,
        // Alert trends
        alertsTrend: alertsTrend?.value,
        alertsTrendDirection: alertsTrend?.direction,
        // Resolved trends
        resolvedTrend: resolvedTrend?.value,
        resolvedTrendDirection: resolvedTrend?.direction,
        // Sparklines
        sessionsSparkline,
        satisfactionSparkline,
        responseTimeSparkline,
        completionRateSparkline
      });

    } catch (err) {
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
    
    const totalMs = resolvedRequests.reduce((sum, request) => {
      const created = new Date(request.created_at);
      const resolved = new Date(request.resolved_at);
      return sum + (resolved - created);
    }, 0);
    
    return totalMs / resolvedRequests.length;
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

  const calculateActivityLevel = (sessions) => {
    if (sessions >= 20) return 'High';
    if (sessions >= 10) return 'Medium';
    if (sessions >= 5) return 'Low';
    return 'Very Low';
  };

  const calculateTrend = (current, previous, higherIsBetter = true, lowerIsBetter = false) => {
    if (current === null || previous === null) return null;

    // Handle case where previous is 0
    if (previous === 0) {
      if (current === 0) {
        return { value: '~0%', direction: 'neutral' };
      }
      // Can't calculate percentage from 0, but we can show the direction
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

  const calculateHourlySparkline = (feedback, assistance, metric) => {
    const now = new Date();
    const currentHour = now.getHours();
    const sparklineData = [];

    // Generate data for each hour from midnight to current hour
    for (let hour = 0; hour <= currentHour; hour++) {
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
      const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 59, 59, 999);

      const hourFeedback = feedback?.filter(f => {
        const createdAt = new Date(f.created_at);
        return createdAt >= hourStart && createdAt <= hourEnd;
      }) || [];

      const hourAssistance = assistance?.filter(a => {
        const createdAt = new Date(a.created_at);
        return createdAt >= hourStart && createdAt <= hourEnd;
      }) || [];

      let value = 0;

      switch (metric) {
        case 'sessions':
          const sessionIds = new Set(hourFeedback.map(f => f.session_id));
          value = sessionIds.size + hourAssistance.length;
          break;

        case 'satisfaction':
          const ratings = hourFeedback.filter(f => f.rating).map(f => f.rating);
          value = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
          break;

        case 'responseTime':
          const resolvedAssistance = hourAssistance.filter(a => a.resolved_at);
          const resolvedFeedback = hourFeedback.filter(f => f.resolved_at && f.is_actioned);
          const allResolved = [...resolvedAssistance, ...resolvedFeedback];

          if (allResolved.length > 0) {
            const totalMs = allResolved.reduce((sum, request) => {
              const created = new Date(request.created_at);
              const resolved = new Date(request.resolved_at);
              return sum + (resolved - created);
            }, 0);
            value = totalMs / allResolved.length / 60000; // Convert to minutes
          }
          break;

        case 'completionRate':
          const totalFeedbackSessions = new Set(hourFeedback.map(f => f.session_id)).size;
          const resolvedFeedbackSessions = new Set(
            hourFeedback.filter(f => f.resolved_at && f.is_actioned).map(f => f.session_id)
          ).size;
          const totalAssistance = hourAssistance.length;
          const resolvedAssistanceCount = hourAssistance.filter(a => a.resolved_at).length;

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

  const calculate7DaySparkline = (feedback, assistance, metric) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sparklineData = [];

    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayFeedback = feedback?.filter(f => {
        const createdAt = new Date(f.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }) || [];

      const dayAssistance = assistance?.filter(a => {
        const createdAt = new Date(a.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }) || [];

      let value = 0;

      switch (metric) {
        case 'sessions':
          const sessionIds = new Set(dayFeedback.map(f => f.session_id));
          value = sessionIds.size + dayAssistance.length;
          break;

        case 'satisfaction':
          const ratings = dayFeedback.filter(f => f.rating).map(f => f.rating);
          value = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
          break;

        case 'responseTime':
          const resolvedAssistance = dayAssistance.filter(a => a.resolved_at);
          const resolvedFeedback = dayFeedback.filter(f => f.resolved_at && f.is_actioned);
          const allResolved = [...resolvedAssistance, ...resolvedFeedback];

          if (allResolved.length > 0) {
            const totalMs = allResolved.reduce((sum, request) => {
              const created = new Date(request.created_at);
              const resolved = new Date(request.resolved_at);
              return sum + (resolved - created);
            }, 0);
            value = totalMs / allResolved.length / 60000; // Convert to minutes
          }
          break;

        case 'completionRate':
          const totalFeedbackSessions = new Set(dayFeedback.map(f => f.session_id)).size;
          const resolvedFeedbackSessions = new Set(
            dayFeedback.filter(f => f.resolved_at && f.is_actioned).map(f => f.session_id)
          ).size;
          const totalAssistance = dayAssistance.length;
          const resolvedAssistanceCount = dayAssistance.filter(a => a.resolved_at).length;

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

export default useOverviewStats;