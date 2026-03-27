import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { TableProperties } from 'lucide-react';

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
      return { table, average: avg, totalFeedback: total };
    });

    // Sort: avg desc, then volume desc, then table asc
    stats.sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      if (b.totalFeedback !== a.totalFeedback) return b.totalFeedback - a.totalFeedback;
      return a.table.localeCompare(b.table, undefined, { numeric: true, sensitivity: 'base' });
    });

    setRows(stats);
    setLoading(false);
  }

  const noData = !loading && rows.length === 0;
  const maxAvg = Math.max(...rows.map(r => r.average), 0);

  const getRatingColor = (avg) => {
    if (avg >= 4.5) return 'bg-green-500';
    if (avg >= 4) return 'bg-green-400';
    if (avg >= 3.5) return 'bg-yellow-500';
    if (avg >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Table Performance
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ranked by average rating</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{rows.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">tables</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : noData ? (
        <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <TableProperties className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No table data yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '400px' }}>
          {rows.map((r, idx) => (
            <div
              key={r.table}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {/* Rank */}
              <div className="w-6 text-center">
                <span className={`text-sm font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {idx + 1}
                </span>
              </div>

              {/* Table info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Table {r.table}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">({r.totalFeedback} rating{r.totalFeedback !== 1 ? 's' : ''})</span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 relative bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getRatingColor(r.average)}`}
                    style={{ width: `${maxAvg ? (r.average / 5) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Average */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{r.average}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
