import React, { useEffect, useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../../utils/supabase';
import { MetricCard } from '../../ui/metric-card';

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function toISO(d) { return d.toISOString(); }

function rangeISO(preset, fromStr, toStr) {
  const now = new Date();
  switch (preset) {
    case 'today': {
      return { start: toISO(startOfDay(now)), end: toISO(endOfDay(now)) };
    }
    case 'yesterday': {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      return { start: toISO(startOfDay(y)), end: toISO(endOfDay(y)) };
    }
    case 'thisWeek': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return { start: toISO(startOfDay(startOfWeek)), end: toISO(endOfDay(now)) };
    }
    case 'last7': {
      const s = new Date(now); s.setDate(now.getDate() - 6);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(now)) };
    }
    case 'last14': {
      const s = new Date(now); s.setDate(now.getDate() - 13);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(now)) };
    }
    case 'last30': {
      const s = new Date(now); s.setDate(now.getDate() - 29);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(now)) };
    }
    case 'all': {
      return { start: toISO(startOfDay(new Date(0))), end: toISO(endOfDay(now)) };
    }
    case 'custom': {
      const s = fromStr ? startOfDay(new Date(fromStr)) : startOfDay(new Date(0));
      const e = toStr ? endOfDay(new Date(toStr)) : endOfDay(now);
      return { start: toISO(s), end: toISO(e) };
    }
    default:
      return { start: toISO(startOfDay(new Date(0))), end: toISO(endOfDay(now)) };
  }
}

async function fetchExpiredFeedback(venueId, startISO, endISO) {
  // First get the venue's session timeout setting
  const { data: venueData, error: venueError } = await supabase
    .from('venues')
    .select('session_timeout_hours')
    .eq('id', venueId)
    .single();

  if (venueError || !venueData) {
    console.error('Error fetching venue timeout settings:', venueError);
    return { expiredCount: 0, totalCount: 0 };
  }

  const timeoutHours = venueData.session_timeout_hours || 2;
  const timeoutMs = timeoutHours * 60 * 60 * 1000;

  // Fetch ALL feedback sessions within timeframe (resolved or not)
  // We want to know: how many items took longer than the timeout to resolve?
  const { data: feedbackData, error: feedbackError } = await supabase
    .from('feedback')
    .select('session_id, created_at, resolved_at, is_actioned, dismissed')
    .eq('venue_id', venueId)
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  // Fetch ALL assistance requests within timeframe
  const { data: assistanceData, error: assistanceError } = await supabase
    .from('assistance_requests')
    .select('id, created_at, resolved_at, status')
    .eq('venue_id', venueId)
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  if (feedbackError || assistanceError) {
    console.error('Error fetching expired feedback:', feedbackError || assistanceError);
    return { expiredCount: 0, totalCount: 0 };
  }

  // Group feedback by session_id and check for expiration
  let expiredFeedbackSessions = 0;
  let totalFeedbackSessions = 0;

  if (feedbackData?.length) {
    const sessionMap = new Map();
    feedbackData.forEach(item => {
      if (!sessionMap.has(item.session_id)) {
        sessionMap.set(item.session_id, {
          created_at: item.created_at,
          resolved_at: item.resolved_at,
          is_actioned: item.is_actioned,
          dismissed: item.dismissed
        });
      } else {
        // Update session with earliest created_at and latest resolved_at
        const existing = sessionMap.get(item.session_id);
        if (new Date(item.created_at) < new Date(existing.created_at)) {
          existing.created_at = item.created_at;
        }
        if (item.resolved_at && (!existing.resolved_at || new Date(item.resolved_at) > new Date(existing.resolved_at))) {
          existing.resolved_at = item.resolved_at;
        }
        existing.is_actioned = existing.is_actioned || item.is_actioned;
        existing.dismissed = existing.dismissed || item.dismissed;
      }
    });

    const now = new Date();
    sessionMap.forEach(session => {
      totalFeedbackSessions++;
      const createdTime = new Date(session.created_at);

      // Check if this item expired (took too long to resolve OR still unresolved past timeout)
      if (session.resolved_at) {
        // Item was resolved - check if it took longer than timeout
        const resolvedTime = new Date(session.resolved_at);
        const resolutionTime = resolvedTime - createdTime;
        if (resolutionTime > timeoutMs) {
          expiredFeedbackSessions++;
        }
      } else {
        // Item still unresolved - check if it's past the timeout
        const waitTime = now - createdTime;
        if (waitTime > timeoutMs) {
          expiredFeedbackSessions++;
        }
      }
    });
  }

  // Check assistance requests for expiration
  let expiredAssistanceRequests = 0;
  let totalAssistanceRequests = 0;

  if (assistanceData?.length) {
    const now = new Date();
    assistanceData.forEach(request => {
      totalAssistanceRequests++;
      const createdTime = new Date(request.created_at);

      if (request.resolved_at) {
        // Request was resolved - check if it took longer than timeout
        const resolvedTime = new Date(request.resolved_at);
        const resolutionTime = resolvedTime - createdTime;
        if (resolutionTime > timeoutMs) {
          expiredAssistanceRequests++;
        }
      } else {
        // Request still unresolved - check if it's past the timeout
        const waitTime = now - createdTime;
        if (waitTime > timeoutMs) {
          expiredAssistanceRequests++;
        }
      }
    });
  }

  return {
    expiredCount: expiredFeedbackSessions + expiredAssistanceRequests,
    totalCount: totalFeedbackSessions + totalAssistanceRequests,
    timeoutHours
  };
}

// Get the previous period range for comparison
function getPreviousPeriodRange(preset) {
  const now = new Date();
  switch (preset) {
    case 'today': {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      return { start: toISO(startOfDay(y)), end: toISO(endOfDay(y)) };
    }
    case 'yesterday': {
      const d = new Date(now); d.setDate(now.getDate() - 2);
      return { start: toISO(startOfDay(d)), end: toISO(endOfDay(d)) };
    }
    case 'thisWeek': {
      const endOfLastWeek = new Date(now);
      endOfLastWeek.setDate(now.getDate() - now.getDay() - 1);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      return { start: toISO(startOfDay(startOfLastWeek)), end: toISO(endOfDay(endOfLastWeek)) };
    }
    case 'last7': {
      const e = new Date(now); e.setDate(now.getDate() - 7);
      const s = new Date(now); s.setDate(now.getDate() - 13);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(e)) };
    }
    case 'last14': {
      const e = new Date(now); e.setDate(now.getDate() - 14);
      const s = new Date(now); s.setDate(now.getDate() - 27);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(e)) };
    }
    case 'last30': {
      const e = new Date(now); e.setDate(now.getDate() - 30);
      const s = new Date(now); s.setDate(now.getDate() - 59);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(e)) };
    }
    default:
      return null;
  }
}

export default function ExpiredFeedbackTile({ venueId, timeframe = 'today', fromDate, toDate }) {
  const [expiredCount, setExpiredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [prevExpiredCount, setPrevExpiredCount] = useState(0);
  const [prevTotalCount, setPrevTotalCount] = useState(0);
  const [timeoutHours, setTimeoutHours] = useState(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;

    const run = async () => {
      setLoading(true);
      const { start, end } = rangeISO(timeframe, fromDate, toDate);
      const result = await fetchExpiredFeedback(venueId, start, end);

      setExpiredCount(result.expiredCount || 0);
      setTotalCount(result.totalCount || 0);
      setTimeoutHours(result.timeoutHours || 2);

      // Fetch previous period data (only for preset timeframes, not custom)
      const prevPeriod = timeframe !== 'custom' ? getPreviousPeriodRange(timeframe) : null;
      if (prevPeriod) {
        const prevResult = await fetchExpiredFeedback(venueId, prevPeriod.start, prevPeriod.end);
        setPrevExpiredCount(prevResult.expiredCount || 0);
        setPrevTotalCount(prevResult.totalCount || 0);
      } else {
        setPrevExpiredCount(0);
        setPrevTotalCount(0);
      }

      setLoading(false);
    };

    run();
  }, [venueId, timeframe, fromDate, toDate]);

  const expiredPercentage = totalCount > 0 ? ((expiredCount / totalCount) * 100) : 0;

  const calculateTrend = () => {
    // No previous data to compare
    if (prevTotalCount === 0) return null;

    // If current period has no data at all but previous did, show red (no activity is bad)
    if (totalCount === 0 && prevTotalCount > 0) {
      return {
        direction: "down",
        positive: false, // No data today is bad
        value: "-100%",
        text: "vs previous period"
      };
    }

    // Both periods have 0 expired - neutral
    if (prevExpiredCount === 0 && expiredCount === 0) {
      return {
        direction: "neutral",
        positive: true,
        value: "0%",
        text: "vs previous period"
      };
    }

    // Previous had 0 expired but now we have some - bad
    if (prevExpiredCount === 0 && expiredCount > 0) {
      return {
        direction: "up",
        positive: false, // More expired items is bad
        value: `+${expiredCount}`,
        text: "vs previous period"
      };
    }

    const delta = ((expiredCount - prevExpiredCount) / prevExpiredCount) * 100;

    if (Math.abs(delta) < 0.5) {
      return {
        direction: "neutral",
        positive: true,
        value: "0%",
        text: "vs previous period"
      };
    }

    return {
      direction: delta > 0 ? "up" : "down",
      positive: delta < 0, // Fewer expired items is positive
      value: `${delta > 0 ? '+' : ''}${Math.round(delta)}%`,
      text: "vs previous period"
    };
  };

  // Determine variant based on expired count
  const getVariant = () => {
    if (expiredCount === 0) return "success";
    if (expiredPercentage < 20) return "warning";
    return "danger";
  };

  const getDescription = () => {
    if (totalCount === 0) return 'No items in period';
    const resolvedLate = expiredCount;
    const onTime = totalCount - expiredCount;
    return `${onTime} on time, ${resolvedLate} exceeded ${timeoutHours}h target`;
  };

  return (
    <MetricCard
      title="Expired Feedback"
      value={loading ? ' - ' : expiredCount}
      description={getDescription()}
      icon={AlertTriangle}
      variant={getVariant()}
      loading={loading}
      trend={calculateTrend()}
    />
  );
}