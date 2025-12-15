// src/components/dashboard/reports/ActionCompletionRateTile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
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

export default function ActionCompletionRateTile({
  venueId,
  timeframe = 'today',
  fromDate,
  toDate,
  actionedCount: propActionedCount,
  totalCount: propTotalCount,
}) {
  const preset = timeframe;

  // data
  const [actionedCount, setActionedCount] = useState(propActionedCount ?? 0);
  const [dismissedCount, setDismissedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(propTotalCount ?? 0);
  const [prevActionedCount, setPrevActionedCount] = useState(0);
  const [prevTotalCount, setPrevTotalCount] = useState(0);
  const [loading, setLoading] = useState(!(propActionedCount || propTotalCount));

  useEffect(() => {
    // If parent provided numbers, just show them (no fetching)
    if (propActionedCount != null && propTotalCount != null) {
      setActionedCount(propActionedCount);
      setTotalCount(propTotalCount);
      setLoading(false);
      return;
    }
    if (!venueId) return;

    const run = async () => {
      setLoading(true);
      try {
        const { start, end } = rangeISO(preset, fromDate, toDate);

        // Fetch ALL feedback sessions CREATED in this period
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('session_id, is_actioned, dismissed, resolution_type, created_at, resolved_at')
          .eq('venue_id', venueId)
          .gte('created_at', start)
          .lte('created_at', end);

        // Fetch ALL assistance requests CREATED in this period
        const { data: assistanceData, error: assistanceError } = await supabase
          .from('assistance_requests')
          .select('id, status, created_at, resolved_at')
          .eq('venue_id', venueId)
          .gte('created_at', start)
          .lte('created_at', end);

        if (feedbackError || assistanceError) throw feedbackError || assistanceError;

        let total = 0;
        let resolved = 0;
        let dismissed = 0;

        // Process feedback sessions - group by session_id
        if (feedbackData?.length) {
          const sessions = new Map();
          for (const row of feedbackData) {
            if (!sessions.has(row.session_id)) sessions.set(row.session_id, []);
            sessions.get(row.session_id).push(row);
          }

          for (const rows of sessions.values()) {
            total += 1;

            // Check if session is resolved (has resolved_at on any item)
            const hasResolvedAt = rows.some(x => x.resolved_at !== null);
            // Check if all items in session are dismissed
            const allDismissed = rows.every(x => x.dismissed === true || x.resolution_type === 'dismissed');

            if (hasResolvedAt) {
              if (allDismissed) {
                dismissed += 1;
              } else {
                resolved += 1;
              }
            }
          }
        }

        // Process assistance requests
        if (assistanceData?.length) {
          for (const request of assistanceData) {
            total += 1;

            if (request.resolved_at !== null) {
              resolved += 1;
            }
          }
        }

        setActionedCount(resolved);
        setDismissedCount(dismissed);
        setTotalCount(total);

        // Fetch previous period data for comparison (only for preset timeframes)
        const prevPeriod = preset !== 'custom' ? getPreviousPeriodRange(preset) : null;
        if (prevPeriod) {
          const { start: pStart, end: pEnd } = prevPeriod;

          // Fetch previous period's feedback sessions CREATED in that period
          const { data: prevFeedbackData } = await supabase
            .from('feedback')
            .select('session_id, dismissed, resolution_type, resolved_at')
            .eq('venue_id', venueId)
            .gte('created_at', pStart)
            .lte('created_at', pEnd);

          // Fetch previous period's assistance requests CREATED in that period
          const { data: prevAssistanceData } = await supabase
            .from('assistance_requests')
            .select('id, resolved_at')
            .eq('venue_id', venueId)
            .gte('created_at', pStart)
            .lte('created_at', pEnd);

          let prevTotal = 0;
          let prevResolved = 0;

          // Process previous period's feedback sessions
          if (prevFeedbackData?.length) {
            const prevSessions = new Map();
            for (const row of prevFeedbackData) {
              if (!prevSessions.has(row.session_id)) prevSessions.set(row.session_id, []);
              prevSessions.get(row.session_id).push(row);
            }

            for (const rows of prevSessions.values()) {
              prevTotal += 1;

              const hasResolvedAt = rows.some(x => x.resolved_at !== null);
              if (hasResolvedAt) {
                prevResolved += 1;
              }
            }
          }

          // Process previous period's assistance requests
          if (prevAssistanceData?.length) {
            for (const request of prevAssistanceData) {
              prevTotal += 1;

              if (request.resolved_at !== null) {
                prevResolved += 1;
              }
            }
          }

          setPrevActionedCount(prevResolved);
          setPrevTotalCount(prevTotal);
        } else {
          setPrevActionedCount(0);
          setPrevTotalCount(0);
        }
      } catch (e) {
        console.error('ActionCompletionRateTile fetch error:', e);
        setActionedCount(0);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [venueId, timeframe, fromDate, toDate, propActionedCount, propTotalCount]);

  const rate = useMemo(() => {
    if (!totalCount) return 0;
    return (actionedCount / totalCount) * 100;
  }, [actionedCount, totalCount]);

  const prevRate = useMemo(() => {
    if (!prevTotalCount) return 0;
    return (prevActionedCount / prevTotalCount) * 100;
  }, [prevActionedCount, prevTotalCount]);

  const calculateTrend = () => {
    // Only show trend if we have previous period data
    if (prevTotalCount === 0) return null;

    // If current period has no data but previous did, show the full drop
    // rate is 0, prevRate was e.g. 98.1%, so difference is 0 - 98.1 = -98.1%
    if (totalCount === 0 && prevTotalCount > 0) {
      const difference = 0 - prevRate; // rate is 0 when totalCount is 0
      return {
        direction: "down",
        positive: false, // Lower completion rate is bad
        value: `${difference.toFixed(1)}%`,
        text: "vs previous period"
      };
    }

    const difference = rate - prevRate;

    if (Math.abs(difference) < 0.5) {
      return {
        direction: "neutral",
        positive: true,
        value: "0%",
        text: "vs previous period"
      };
    }

    return {
      direction: difference > 0 ? "up" : "down",
      positive: difference > 0, // Higher completion rate is positive
      value: `${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`,
      text: "vs previous period"
    };
  };

  const description = useMemo(() => {
    const unresolved = totalCount - actionedCount - dismissedCount;
    if (dismissedCount > 0 && unresolved > 0) {
      return `${actionedCount} resolved, ${dismissedCount} dismissed, ${unresolved} pending`;
    }
    if (dismissedCount > 0) {
      return `${actionedCount} resolved, ${dismissedCount} dismissed of ${totalCount}`;
    }
    if (unresolved > 0) {
      return `${actionedCount} resolved, ${unresolved} pending of ${totalCount}`;
    }
    return `${actionedCount}/${totalCount} items resolved`;
  }, [actionedCount, dismissedCount, totalCount]);

  return (
    <MetricCard
      title="Completion Rate"
      value={loading ? ' - ' : `${rate.toFixed(1)}%`}
      description={description}
      icon={CheckCircle}
      variant={rate >= 80 ? "success" : rate >= 60 ? "neutral" : "warning"}
      loading={loading}
      trend={calculateTrend()}
    />
  );
}