// src/components/dashboard/reports/PeakHoursAnalysisTile.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { Clock, BarChart3 } from 'lucide-react';

const WEEK_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function PeakHoursAnalysisTile({ venueId }) {
  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [peakHour, setPeakHour] = useState(null);
  const [peakDay, setPeakDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    fetchPeakHoursData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  async function fetchPeakHoursData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select('created_at, rating')
      .eq('venue_id', venueId)
      .not('created_at', 'is', null);

    if (error) {
      console.error('Error fetching peak hours data:', error);
      setHourlyData([]); setWeeklyData([]);
      setPeakHour(null); setPeakDay(null);
      setLoading(false);
      return;
    }

    const hourCounts = Array(24).fill(0);
    const hourRatingSum = Array(24).fill(0);
    const hourRatingCnt = Array(24).fill(0);

    const dayCounts = Array(7).fill(0);
    const dayRatingSum = Array(7).fill(0);
    const dayRatingCnt = Array(7).fill(0);

    (data || []).forEach(row => {
      const d = new Date(row.created_at);
      const h = d.getHours();
      const w = d.getDay();
      hourCounts[h] += 1;
      dayCounts[w]  += 1;
      const r = Number(row.rating);
      if (Number.isFinite(r) && r >= 1 && r <= 5) {
        hourRatingSum[h] += r; hourRatingCnt[h] += 1;
        dayRatingSum[w]  += r; dayRatingCnt[w]  += 1;
      }
    });

    const hourly = hourCounts.map((count, h) => ({
      hour: h,
      label: `${String(h).padStart(2,'0')}:00`,
      count,
      avgSatisfaction: hourRatingCnt[h] ? +(hourRatingSum[h] / hourRatingCnt[h]).toFixed(2) : 0,
    }));

    const weekly = dayCounts.map((count, w) => ({
      dayIndex: w,
      day: WEEK_DAYS[w],
      count,
      avgSatisfaction: dayRatingCnt[w] ? +(dayRatingSum[w] / dayRatingCnt[w]).toFixed(2) : 0,
    }));

    const peakH = hourly.reduce((m,c) => c.count > m.count ? c : m, hourly[0] || {count:0});
    const peakD = weekly.reduce((m,c) => c.count > m.count ? c : m, weekly[0] || {count:0});

    setHourlyData(hourly);
    setWeeklyData(weekly);
    setPeakHour(peakH?.count ? peakH : null);
    setPeakDay(peakD?.count ? peakD : null);
    setLoading(false);
  }

  const maxHourly = Math.max(0, ...hourlyData.map(h => h.count));
  const maxDaily  = Math.max(0, ...weeklyData.map(d => d.count));

  // Greyscale intensity (matches the black/neutral aesthetic)
  const cellStyle = (count, max) => {
    const t = max ? count / max : 0;
    // interpolate 0 → 0.08, 1 → 1 for nicer visibility
    const alpha = t === 0 ? 0.08 : 0.15 + 0.85 * t;
    return { backgroundColor: `rgba(15, 23, 42, ${alpha})` }; // slate-900 with variable alpha
  };

  const noData = !loading && hourlyData.every(h => h.count === 0);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Peak Hours Analysis</h3>
          <p className="text-xs text-gray-600 mt-1">When customers are most likely to leave feedback</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-5 w-40 bg-gray-100 rounded-md animate-pulse" />
          <div className="grid [grid-template-columns:repeat(24,minmax(0,1fr))] gap-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-7 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-5 w-28 bg-gray-100 rounded-md animate-pulse" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      ) : noData ? (
        <div className="text-center py-10">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <div className="text-sm text-gray-600">No feedback yet - peak hours will appear once data comes in.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Peak summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md p-3 border border-gray-100">
              <div className="text-xs font-medium text-gray-700 mb-1">Peak Hour</div>
              <div className="text-2xl font-bold text-gray-900">{peakHour?.label ?? '-'}</div>
              <div className="text-xs text-gray-600 mt-1">
                {peakHour?.count ?? 0} responses • {peakHour?.avgSatisfaction ?? 0}★ avg
              </div>
            </div>
            <div className="rounded-md p-3 border border-gray-100">
              <div className="text-xs font-medium text-gray-700 mb-1">Peak Day</div>
              <div className="text-2xl font-bold text-gray-900">{peakDay?.day ?? '-'}</div>
              <div className="text-xs text-gray-600 mt-1">
                {peakDay?.count ?? 0} responses • {peakDay?.avgSatisfaction ?? 0}★ avg
              </div>
            </div>
          </div>

          {/* Hourly heatmap (24 cells) */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-1 text-gray-600" /> Hourly Activity
            </h4>
            <div className="grid [grid-template-columns:repeat(24,minmax(0,1fr))] gap-1">
              {hourlyData.map(h => (
                <div key={h.hour} className="flex flex-col items-center">
                  <div
                    className="w-full h-7 rounded transition-transform duration-150 hover:scale-105"
                    style={cellStyle(h.count, maxHourly)}
                    title={`${h.label}: ${h.count} responses (${h.avgSatisfaction}★)`}
                  />
                  <div className="text-[10px] text-gray-500 mt-1">
                    {h.hour % 6 === 0 ? h.hour : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
          </div>

          {/* Weekly bars (Monochrome) */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <BarChart3 className="w-4 h-4 mr-1 text-gray-600" /> Weekly Pattern
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {weeklyData.map(d => (
                <div key={d.day} className="text-center">
                  <div
                    className="h-16 rounded-md flex items-end justify-center p-2 border border-gray-100"
                    style={cellStyle(d.count, maxDaily)}
                    title={`${d.day}: ${d.count} responses (${d.avgSatisfaction}★)`}
                  >
                    <span className="text-white text-xs font-semibold drop-shadow">
                      {d.count}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">
                    {d.day.slice(0,3)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend / Hint */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-[11px] text-gray-600">
              <span>Activity:</span>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 rounded" style={{background:'rgba(15,23,42,0.1)'}} />
                <span>Low</span>
                <span className="inline-block w-4 h-3 rounded" style={{background:'rgba(15,23,42,0.5)'}} />
                <span>Medium</span>
                <span className="inline-block w-4 h-3 rounded" style={{background:'rgba(15,23,42,1)'}} />
                <span>High</span>
              </div>
            </div>
            {peakHour && (
              <div className="text-[11px] text-gray-600">
                Consider staffing around <span className="font-medium">{peakHour.label}</span>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}