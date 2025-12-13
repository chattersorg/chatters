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

export default function ActionCompletionRateTile({
  venueId,
  timeframe = 'today',
  actionedCount: propActionedCount,
  totalCount: propTotalCount,
}) {
  const preset = timeframe;

  // data
  const [actionedCount, setActionedCount] = useState(propActionedCount ?? 0);
  const [dismissedCount, setDismissedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(propTotalCount ?? 0);
  const [yesterdayActionedCount, setYesterdayActionedCount] = useState(0);
  const [yesterdayTotalCount, setYesterdayTotalCount] = useState(0);
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
        const { start, end } = rangeISO(preset);

        // Fetch feedback sessions
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('session_id, is_actioned, dismissed, resolution_type, created_at, resolved_at')
          .eq('venue_id', venueId)
          .or(`and(resolved_at.gte.${start},resolved_at.lte.${end}),and(resolved_at.is.null,created_at.gte.${start},created_at.lte.${end})`);

        // Fetch assistance requests
        const { data: assistanceData, error: assistanceError } = await supabase
          .from('assistance_requests')
          .select('id, status, created_at, resolved_at')
          .eq('venue_id', venueId)
          .or(`and(resolved_at.gte.${start},resolved_at.lte.${end}),and(resolved_at.is.null,created_at.gte.${start},created_at.lte.${end})`);

        if (feedbackError || assistanceError) throw feedbackError || assistanceError;

        let total = 0;
        let resolved = 0;
        let dismissed = 0;

        // Process feedback sessions
        if (feedbackData?.length) {
          const sessions = new Map();
          for (const row of feedbackData) {
            if (!sessions.has(row.session_id)) sessions.set(row.session_id, []);
            sessions.get(row.session_id).push(row);
          }

          for (const rows of sessions.values()) {
            // effective timestamp
            let latestTs = 0;
            for (const r of rows) {
              const ts = new Date(r.resolved_at ?? r.created_at).getTime();
              if (ts > latestTs) latestTs = ts;
            }

            // Make sure the session actually falls in range
            const { start: sISO, end: eISO } = rangeISO(preset);
            const sMs = new Date(sISO).getTime();
            const eMs = new Date(eISO).getTime();
            if (latestTs < sMs || latestTs > eMs) continue;

            total += 1;

            // Check if all items in session are dismissed
            const allDismissed = rows.every(x => x.dismissed === true || x.resolution_type === 'dismissed');
            // Check if all items are actioned (resolved or positive cleared)
            const allActioned = rows.every(x => x.is_actioned === true);
            const isResolved = rows.some(x => x.resolution_type === 'staff_resolved' || x.resolution_type === 'positive_feedback_cleared');

            if (allDismissed) {
              dismissed += 1;
            } else if (allActioned || isResolved) {
              resolved += 1;
            }
          }
        }

        // Process assistance requests
        if (assistanceData?.length) {
          for (const request of assistanceData) {
            const ts = new Date(request.resolved_at ?? request.created_at).getTime();

            // Make sure the request falls in range
            const { start: sISO, end: eISO } = rangeISO(preset);
            const sMs = new Date(sISO).getTime();
            const eMs = new Date(eISO).getTime();
            if (ts < sMs || ts > eMs) continue;

            total += 1;

            if (request.status === 'resolved' || request.resolved_at !== null) {
              resolved += 1;
            }
          }
        }

        setActionedCount(resolved);
        setDismissedCount(dismissed);
        setTotalCount(total);

        // Fetch yesterday's data only if timeframe is 'today'
        if (preset === 'today') {
          const { start: yStart, end: yEnd } = rangeISO('yesterday');

          // Fetch YESTERDAY's feedback sessions
          const { data: yesterdayFeedbackData } = await supabase
            .from('feedback')
            .select('session_id, is_actioned, dismissed, created_at, resolved_at')
            .eq('venue_id', venueId)
            .or(`and(resolved_at.gte.${yStart},resolved_at.lte.${yEnd}),and(resolved_at.is.null,created_at.gte.${yStart},created_at.lte.${yEnd})`);

          // Fetch YESTERDAY's assistance requests
          const { data: yesterdayAssistanceData } = await supabase
            .from('assistance_requests')
            .select('id, status, created_at, resolved_at')
            .eq('venue_id', venueId)
            .or(`and(resolved_at.gte.${yStart},resolved_at.lte.${yEnd}),and(resolved_at.is.null,created_at.gte.${yStart},created_at.lte.${yEnd})`);

          let yesterdayTotal = 0;
          let yesterdayResolved = 0;

          // Process YESTERDAY's feedback sessions
          if (yesterdayFeedbackData?.length) {
            const yesterdaySessions = new Map();
            for (const row of yesterdayFeedbackData) {
              if (!yesterdaySessions.has(row.session_id)) yesterdaySessions.set(row.session_id, []);
              yesterdaySessions.get(row.session_id).push(row);
            }

            for (const rows of yesterdaySessions.values()) {
              let latestTs = 0;
              for (const r of rows) {
                const ts = new Date(r.resolved_at ?? r.created_at).getTime();
                if (ts > latestTs) latestTs = ts;
              }

              const yStartMs = new Date(yStart).getTime();
              const yEndMs = new Date(yEnd).getTime();
              if (latestTs < yStartMs || latestTs > yEndMs) continue;

              yesterdayTotal += 1;

              const allActioned = rows.every(x => x.is_actioned === true);
              const allDismissed = rows.every(x => x.dismissed === true);
              if (allActioned || allDismissed) yesterdayResolved += 1;
            }
          }

          // Process YESTERDAY's assistance requests
          if (yesterdayAssistanceData?.length) {
            for (const request of yesterdayAssistanceData) {
              const ts = new Date(request.resolved_at ?? request.created_at).getTime();

              const yStartMs = new Date(yStart).getTime();
              const yEndMs = new Date(yEnd).getTime();
              if (ts < yStartMs || ts > yEndMs) continue;

              yesterdayTotal += 1;

              if (request.status === 'resolved' || request.resolved_at !== null) {
                yesterdayResolved += 1;
              }
            }
          }

          setYesterdayActionedCount(yesterdayResolved);
          setYesterdayTotalCount(yesterdayTotal);
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
  }, [venueId, timeframe, propActionedCount, propTotalCount]);

  const rate = useMemo(() => {
    if (!totalCount) return 0;
    return (actionedCount / totalCount) * 100;
  }, [actionedCount, totalCount]);

  const yesterdayRate = useMemo(() => {
    if (!yesterdayTotalCount) return 0;
    return (yesterdayActionedCount / yesterdayTotalCount) * 100;
  }, [yesterdayActionedCount, yesterdayTotalCount]);

  const calculateTrend = () => {
    // Only show trend if we're on 'today' timeframe and have yesterday data
    if (preset !== 'today' || yesterdayTotalCount === 0) return null;

    const difference = rate - yesterdayRate;

    if (Math.abs(difference) < 0.5) {
      return {
        direction: "neutral",
        positive: true,
        value: "0%",
        text: "vs yesterday"
      };
    }

    return {
      direction: difference > 0 ? "up" : "down",
      positive: difference > 0, // Higher completion rate is positive
      value: `${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`,
      text: "vs yesterday"
    };
  };

  const description = useMemo(() => {
    if (dismissedCount > 0) {
      return `${actionedCount} resolved, ${dismissedCount} dismissed of ${totalCount}`;
    }
    return `${actionedCount}/${totalCount} items resolved`;
  }, [actionedCount, dismissedCount, totalCount]);

  return (
    <MetricCard
      title="Completion Rate"
      value={loading ? '—' : `${rate.toFixed(1)}%`}
      description={description}
      icon={CheckCircle}
      variant={rate >= 80 ? "success" : rate >= 60 ? "neutral" : "warning"}
      loading={loading}
      trend={calculateTrend()}
    />
  );
}