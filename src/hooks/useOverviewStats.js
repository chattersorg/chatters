import { useState, useEffect } from 'react';
import { supabase, logQuery } from '../utils/supabase';

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

      console.log('%c⏱️  [PERF] Starting: Overview Stats Fetch', 'color: #3b82f6; font-weight: bold', { venueId });
      const pageStartTime = performance.now();

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

      // Calculate stats - count unique sessions
      const todaySessionIds = new Set(todayFeedback?.map(f => f.session_id) || []);
      const todaySessions = todaySessionIds.size;

      const yesterdaySessionIds = new Set(yesterdayFeedback?.map(f => f.session_id) || []);
      const yesterdaySessions = yesterdaySessionIds.size;
      
      // Average satisfaction
      const todayRatings = todayFeedback?.filter(f => f.rating).map(f => f.rating) || [];
      const avgSatisfaction = todayRatings.length > 0 
        ? (todayRatings.reduce((a, b) => a + b, 0) / todayRatings.length).toFixed(1)
        : null;

      const yesterdayRatings = yesterdayFeedback?.filter(f => f.rating).map(f => f.rating) || [];
      const yesterdayAvgSatisfaction = yesterdayRatings.length > 0 
        ? yesterdayRatings.reduce((a, b) => a + b, 0) / yesterdayRatings.length
        : null;

      // Response time calculation - include both feedback and assistance
      const resolvedAssistanceToday = todayAssistance?.filter(a => a.resolved_at) || [];
      const resolvedFeedbackToday = todayFeedback?.filter(f => f.resolved_at && f.is_actioned) || [];
      const allResolvedToday = [...resolvedAssistanceToday, ...resolvedFeedbackToday];

      const avgResponseTime = allResolvedToday.length > 0
        ? calculateAverageResponseTime(allResolvedToday)
        : null;

      const resolvedAssistanceYesterday = yesterdayAssistance?.filter(a => a.resolved_at) || [];
      const resolvedFeedbackYesterday = yesterdayFeedback?.filter(f => f.resolved_at && f.is_actioned) || [];
      const allResolvedYesterday = [...resolvedAssistanceYesterday, ...resolvedFeedbackYesterday];

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

      // Peak hour analysis
      const peakHour = calculatePeakHour(todayFeedback || []);

      // Activity level
      const currentActivity = calculateActivityLevel(todaySessions);

      // Calculate trends
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

      // Calculate 7-day sparkline data
      const sessionsSparkline = calculate7DaySparkline(sevenDayFeedback, sevenDayAssistance, 'sessions');
      const satisfactionSparkline = calculate7DaySparkline(sevenDayFeedback, sevenDayAssistance, 'satisfaction');
      const responseTimeSparkline = calculate7DaySparkline(sevenDayFeedback, sevenDayAssistance, 'responseTime');
      const completionRateSparkline = calculate7DaySparkline(sevenDayFeedback, sevenDayAssistance, 'completionRate');

      setStats({
        todaySessions,
        avgSatisfaction,
        avgResponseTime,
        completionRate,
        activeAlerts,
        resolvedToday: completedToday,
        currentActivity,
        peakHour,
        sessionsTrend: sessionsTrend?.value,
        sessionsTrendDirection: sessionsTrend?.direction,
        satisfactionTrend: satisfactionTrend?.value,
        satisfactionTrendDirection: satisfactionTrend?.direction,
        responseTimeTrend: responseTimeTrend?.value,
        responseTimeTrendDirection: responseTimeTrend?.direction,
        completionTrend: completionTrend?.value,
        completionTrendDirection: completionTrend?.direction,
        sessionsSparkline,
        satisfactionSparkline,
        responseTimeSparkline,
        completionRateSparkline
      });

      const totalDuration = performance.now() - pageStartTime;
      const color = totalDuration < 500 ? '#22c55e' : totalDuration < 1000 ? '#eab308' : totalDuration < 2000 ? '#f97316' : '#ef4444';
      console.log(
        `%c✓ [PERF] Overview Stats Fetch Complete: ${totalDuration.toFixed(2)}ms`,
        `color: ${color}; font-weight: bold`
      );

    } catch (err) {
      console.error('%c❌ [PERF] Overview Stats Fetch Failed', 'color: #ef4444; font-weight: bold', err);
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
    if (current === null || previous === null || previous === 0) return null;

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
          value = sessionIds.size;
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