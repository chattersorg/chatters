// src/components/dashboard/reports/SatisfactionTrendTile.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { supabase } from '../../../utils/supabase';

const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const eod = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

function getRange(preset, fromStr, toStr) {
  const now = new Date();
  switch (preset) {
    case 'today': {
      const s = sod(now), e = eod(now);
      return { startISO: s.toISOString(), endISO: e.toISOString(), hourly: true, monthly: false, baseDate: s };
    }
    case 'yesterday': {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      const s = sod(y), e = eod(y);
      return { startISO: s.toISOString(), endISO: e.toISOString(), hourly: true, monthly: false, baseDate: s };
    }
    case 'thisWeek': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return { startISO: sod(startOfWeek).toISOString(), endISO: eod(now).toISOString(), hourly: false, monthly: false };
    }
    case 'last7': {
      const s = new Date(now); s.setDate(now.getDate() - 6);
      return { startISO: sod(s).toISOString(), endISO: eod(now).toISOString(), hourly: false, monthly: false };
    }
    case 'last14': {
      const s = new Date(now); s.setDate(now.getDate() - 13);
      return { startISO: sod(s).toISOString(), endISO: eod(now).toISOString(), hourly: false, monthly: false };
    }
    case 'last30': {
      const s = new Date(now); s.setDate(now.getDate() - 29);
      return { startISO: sod(s).toISOString(), endISO: eod(now).toISOString(), hourly: false, monthly: false };
    }
    case 'all': {
      // For 'all' timeframe, start from 2 years ago instead of 1970 to avoid infinite loops
      const s = new Date(now); s.setFullYear(now.getFullYear() - 2);
      const e = eod(now);
      return { startISO: sod(s).toISOString(), endISO: e.toISOString(), hourly: false, monthly: true };
    }
    case 'custom': {
      const s = fromStr ? sod(new Date(fromStr)) : sod(new Date(0));
      const e = toStr ? eod(new Date(toStr)) : eod(now);
      const hourly = s.toDateString() === sod(new Date(e)).toDateString();
      const diffDays = Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24));
      const monthly = diffDays > 90; // Use monthly view for ranges > 90 days
      return { startISO: s.toISOString(), endISO: e.toISOString(), hourly, monthly, baseDate: s };
    }
    default: {
      const s = sod(new Date(0)), e = eod(now);
      return { startISO: s.toISOString(), endISO: e.toISOString(), hourly: false, monthly: false };
    }
  }
}

function buildHourBuckets(baseDate) {
  const base = sod(baseDate);
  const buckets = [];
  for (let h = 0; h <= 23; h++) {
    const label = new Date(base);
    label.setHours(h, 0, 0, 0);
    buckets.push({ hour: h, labelTs: label.getTime(), average: null });
  }
  return buckets;
}

function buildDayBuckets(startISO, endISO) {
  const start = sod(new Date(startISO));
  const end = eod(new Date(endISO));
  const buckets = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const label = new Date(d);
    label.setHours(12, 0, 0, 0);
    buckets.push({ labelTs: label.getTime(), average: null });
  }
  return buckets;
}

function buildMonthBuckets(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const buckets = [];
  
  // Start from the beginning of the first month
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  let monthCount = 0;
  const maxMonths = 120; // Safety limit: max 10 years of months
  
  while (current <= end && monthCount < maxMonths) {
    // Create label timestamp for middle of month for better chart positioning
    const label = new Date(current.getFullYear(), current.getMonth(), 15);
    buckets.push({ labelTs: label.getTime(), average: null });
    
    // Move to next month
    current.setMonth(current.getMonth() + 1);
    monthCount++;
  }
  
  return buckets;
}

export default function SatisfactionTrendTile({ venueId, timeframe = 'last7' }) {
  const preset = timeframe;
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState([]); // [{labelTs:number, average:number|null, hour?:number}]
  const pollRef = useRef(null);

  async function fetchData() {
    if (!venueId) return;

    const { startISO, endISO, hourly, monthly, baseDate } = getRange(preset);
    setLoading(true);

    const { data, error } = await supabase
      .from('feedback')
      .select('created_at, rating')
      .eq('venue_id', venueId)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .not('rating', 'is', null)
      .order('created_at');

    if (error) {
      console.error('SatisfactionTrend fetch error:', error);
      setSeries([]);
      setLoading(false);
      return;
    }

    const rows = data || [];

    if (hourly) {
      const buckets = buildHourBuckets(baseDate);
      const sums = new Array(24).fill(0);
      const counts = new Array(24).fill(0);

      for (const row of rows) {
        const hr = new Date(row.created_at).getHours();
        sums[hr] += Number(row.rating);
        counts[hr] += 1;
      }

      const built = buckets.map((b, hr) => ({
        hour: hr,
        labelTs: b.labelTs,
        average: counts[hr] ? +(sums[hr] / counts[hr]).toFixed(2) : null,
      }));

      setSeries(built);
    } else if (monthly) {
      const buckets = buildMonthBuckets(startISO, endISO);
      const index = new Map(); // 'YYYY-MM' -> {sum,count}

      for (const row of rows) {
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const cur = index.get(key) || { sum: 0, count: 0 };
        cur.sum += Number(row.rating);
        cur.count += 1;
        index.set(key, cur);
      }

      const built = buckets.map(b => {
        const d = new Date(b.labelTs);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const cur = index.get(key);
        return { labelTs: b.labelTs, average: cur ? +(cur.sum / cur.count).toFixed(2) : null };
      });

      setSeries(built);
    } else {
      const buckets = buildDayBuckets(startISO, endISO);
      const index = new Map(); // 'YYYY-MM-DD' -> {sum,count}

      for (const row of rows) {
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const cur = index.get(key) || { sum: 0, count: 0 };
        cur.sum += Number(row.rating);
        cur.count += 1;
        index.set(key, cur);
      }

      const built = buckets.map(b => {
        const d = new Date(b.labelTs);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const cur = index.get(key);
        return { labelTs: b.labelTs, average: cur ? +(cur.sum / cur.count).toFixed(2) : null };
      });

      setSeries(built);
    }

    setLoading(false);
  }

  // Fetch whenever inputs change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, timeframe]);

  const { hourly: isHourly, monthly: isMonthly } = getRange(preset);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Satisfaction Trend</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{isHourly ? 'Hourly' : isMonthly ? 'Monthly' : 'Daily'} average satisfaction trends</p>
      </div>

      {/* Chart */}
      <div className="mt-4 h-64">
        {loading ? (
          <div className="h-full bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-md animate-pulse" />
        ) : series.length && series.some(d => d.average != null) ? (

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
            >
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="0" vertical={false} className="dark:opacity-20" />

              <XAxis
                dataKey="labelTs"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts) => {
                  const d = new Date(ts);
                  if (isHourly) {
                    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  } else if (isMonthly) {
                    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
                  } else {
                    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                  }
                }}
                stroke="#64748B"
                fontSize={12}
                tick={{ fill: '#64748B' }}
                allowDuplicatedCategory={false}
                tickCount={6}
              />

              <YAxis
                domain={[0, 5]}   // 👈 start from 0
                stroke="#64748B"
                fontSize={12}
                tick={{ fill: '#64748B' }}
                allowDecimals={false}
                width={32}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  color: '#F9FAFB',
                }}
                formatter={(v) => [v, isHourly ? 'Hourly Avg' : isMonthly ? 'Monthly Avg' : 'Daily Avg']}
                labelFormatter={(ts) => {
                  const d = new Date(ts);
                  if (isHourly) {
                    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                  } else if (isMonthly) {
                    return d.toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric',
                    });
                  } else {
                    return d.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                  }
                }}
              />

              <Area
                type="linear"
                dataKey="average"
                stroke="#3b82f6"        // blue line
                fill="url(#colorBlue)" // blue gradient fill
                strokeWidth={2}
                connectNulls={true}     // 👈 draw continuous line, no gaps
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                name={isHourly ? 'Hourly Avg' : isMonthly ? 'Monthly Avg' : 'Daily Avg'}
              />

              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>


        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-md">
            <div className="text-center">
              <p className="text-sm mb-1 text-slate-600 dark:text-gray-400">No trend data available</p>
              <p className="text-xs text-slate-500 dark:text-gray-500">Trends will appear as feedback is collected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}