import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

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

export default function TablePerformanceRankingTile({ venueId, timeframe = 'last30' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    fetchTablePerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, timeframe]);

  async function fetchTablePerformance() {
    setLoading(true);

    const { start, end } = rangeISO(timeframe);

    const { data, error } = await supabase
      .from('feedback')
      .select('table_number, rating')
      .eq('venue_id', venueId)
      .gte('created_at', start)
      .lte('created_at', end)
      .not('rating', 'is', null)
      .not('table_number', 'is', null);

    if (error) {
      console.error('Error fetching table performance:', error);
      setRows([]);
      setLoading(false);
      return;
    }

    // Group by table
    const byTable = new Map();
    (data || []).forEach(r => {
      const t = String(r.table_number);
      const val = Number(r.rating);
      if (!Number.isFinite(val)) return;
      if (!byTable.has(t)) byTable.set(t, []);
      byTable.get(t).push(val);
    });

    // Compute stats
    const stats = Array.from(byTable.entries()).map(([table, ratings]) => {
      const total = ratings.length;
      const avg = total ? +(ratings.reduce((s, v) => s + v, 0) / total).toFixed(2) : 0;
      // Count distribution 5→1
      const dist = [5,4,3,2,1].map(star => ratings.filter(v => v === star).length);
      return { table, average: avg, totalFeedback: total, dist };
    });

    // Sort: avg desc, then volume desc, then table asc (stable-ish)
    stats.sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      if (b.totalFeedback !== a.totalFeedback) return b.totalFeedback - a.totalFeedback;
      return a.table.localeCompare(b.table, undefined, { numeric: true, sensitivity: 'base' });
    });

    setRows(stats);
    setLoading(false);
  }

  const noData = !loading && rows.length === 0;

  // Greyscale accent blocks (match PeakHoursAnalysisTile aesthetic)
  const band = (intensity) => {
    // intensity 0..1 → alpha 0.1..1 for visibility
    const a = intensity === 0 ? 0.08 : 0.15 + 0.85 * Math.min(1, Math.max(0, intensity));
    return { backgroundColor: `rgba(15, 23, 42, ${a})` }; // slate-900 w/ variable alpha
  };

  // Footer quick facts
  const best = rows[0];
  const worst = rows[rows.length - 1];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Table Performance Ranking
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Ranked by average rating
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
          ))}
        </div>
      ) : noData ? (
        <div className="text-center py-10">
          <div className="text-sm text-gray-600 dark:text-gray-400">No table data yet - rankings will appear once feedback comes in.</div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '300px' }}>
          {rows.map((r, idx) => (
            <div
              key={r.table}
              className="rounded-md border border-gray-100 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title={`Table ${r.table} • ${r.average}★ avg from ${r.totalFeedback} responses`}
            >
              <div className="grid grid-cols-3 gap-3 items-center">
                {/* Left: table number */}
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Table {r.table}</div>
                </div>

                {/* Center: rating count - aligned column */}
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">{r.totalFeedback}</div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400">rating{r.totalFeedback !== 1 ? 's' : ''}</div>
                </div>

                {/* Right: average */}
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{r.average}</div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400">avg rating</div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}