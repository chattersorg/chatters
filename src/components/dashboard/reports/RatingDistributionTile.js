import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { BarChart3, Star } from 'lucide-react';

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

export default function RatingDistributionTile({ venueId, timeframe = 'last30' }) {
  const [rows, setRows] = useState([]); // [{rating, count, pct}]
  const [total, setTotal] = useState(0);
  const [avg, setAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    fetchRatingDistribution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, timeframe]);

  async function fetchRatingDistribution() {
    setLoading(true);

    const { start, end } = rangeISO(timeframe);

    const { data, error } = await supabase
      .from('feedback')
      .select('rating')
      .eq('venue_id', venueId)
      .gte('created_at', start)
      .lte('created_at', end)
      .not('rating', 'is', null)
      .gte('rating', 1)
      .lte('rating', 5);

    if (error) {
      console.error('Error fetching rating distribution:', error);
      setRows([]); setTotal(0); setAvg(0);
      setLoading(false);
      return;
    }

    const counts = [0,0,0,0,0,0]; // index 1..5
    let n = 0, sum = 0;

    (data || []).forEach(({ rating }) => {
      const r = Number(rating);
      if (Number.isFinite(r) && r >= 1 && r <= 5) {
        counts[r] += 1; n += 1; sum += r;
      }
    });

    const dist = [5,4,3,2,1].map(r => ({
      rating: r,
      count: counts[r],
      pct: n ? +( (counts[r] / n) * 100 ).toFixed(1) : 0,
    }));

    setRows(dist);
    setTotal(n);
    setAvg(n ? +(sum / n).toFixed(2) : 0);
    setLoading(false);
  }

  const satisfied = (rows.find(d => d.rating === 5)?.count || 0) + (rows.find(d => d.rating === 4)?.count || 0);
  const neutral    = rows.find(d => d.rating === 3)?.count || 0;
  const detractors = (rows.find(d => d.rating === 2)?.count || 0) + (rows.find(d => d.rating === 1)?.count || 0);
  const satRate    = total ? Math.round((satisfied / total) * 100) : 0;

  const maxCount = Math.max(0, ...rows.map(d => d.count));

  // Response time analytics color scheme
  const fillWidth = (count) => (maxCount ? (count / maxCount) * 100 : 0);
  const getRatingColor = (rating) => {
    switch(rating) {
      case 5: return 'bg-green-500';
      case 4: return 'bg-green-400';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-orange-500';
      case 1: return 'bg-red-600';
      default: return 'bg-gray-200';
    }
  };

  const noData = !loading && total === 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Customer Satisfaction
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">How guests rate their experience (1–5)</p>
        </div>

        {/* Compact overall card */}
        <div className="rounded-md border border-gray-100 dark:border-gray-700 p-3 text-right min-w-[132px]">
          <div className="flex items-center justify-end gap-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{avg}</span>
          </div>
          <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 flex items-center justify-end gap-1">
            {total} reviews
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
          ))}
        </div>
      ) : noData ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">No ratings yet - distribution will appear once feedback comes in.</div>
        </div>
      ) : (
        <>
          {/* Distribution rows 5 → 1 */}
          <div className="space-y-2 mb-4">
            {rows.map(({ rating, count, pct }) => (
              <div key={rating} className="rounded-md border border-gray-100 dark:border-gray-700 p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < rating ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{rating} star{rating > 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{count}</span>
                    <span className="text-gray-500 dark:text-gray-400"> ({pct}%)</span>
                  </div>
                </div>
                <div className="relative bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getRatingColor(rating)}`}
                    style={{
                      width: `${fillWidth(count)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary cards (neutral, compact) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Satisfied (4–5★)</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{satRate}%</div>
            </div>
            <div className="rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Neutral (3★)</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{neutral}</div>
            </div>
            <div className="rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Detractors (1–2★)</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{detractors}</div>
            </div>
          </div>

          {/* Legend / hint */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
              <span>Rating colors:</span>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-green-500" />
                <span>5★</span>
                <span className="inline-block w-3 h-3 rounded bg-green-400" />
                <span>4★</span>
                <span className="inline-block w-3 h-3 rounded bg-yellow-500" />
                <span>3★</span>
                <span className="inline-block w-3 h-3 rounded bg-orange-500" />
                <span>2★</span>
                <span className="inline-block w-3 h-3 rounded bg-red-600" />
                <span>1★</span>
              </div>
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              Bars scale to the most common rating.
            </div>
          </div>
        </>
      )}
    </div>
  );
}