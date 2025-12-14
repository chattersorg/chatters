// src/components/dashboard/reports/ResponseTimeAnalyticsTile.jsx
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

const ResponseTimeAnalyticsTile = ({ venueId, timeframe = 'all', fromDate, toDate }) => {
  const [responseData, setResponseData] = useState([]);
  const [averageTime, setAverageTime] = useState(0);
  const [medianTime, setMedianTime] = useState(0);
  const [slaCompliance, setSlaCompliance] = useState(0);
  const [timeDistribution, setTimeDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    fetchResponseTimeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, timeframe, fromDate, toDate]);

  const fetchResponseTimeData = async () => {
    setLoading(true);

    const { start, end } = rangeISO(timeframe, fromDate, toDate);

    // Fetch feedback sessions CREATED in this period that have been resolved
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('session_id, created_at, resolved_at')
      .eq('venue_id', venueId)
      .not('resolved_at', 'is', null)
      .gte('created_at', start)
      .lte('created_at', end);

    // Fetch assistance requests CREATED in this period that have been resolved
    const { data: assistanceData, error: assistanceError } = await supabase
      .from('assistance_requests')
      .select('created_at, resolved_at')
      .eq('venue_id', venueId)
      .not('resolved_at', 'is', null)
      .gte('created_at', start)
      .lte('created_at', end);

    if (feedbackError || assistanceError) {
      console.error('Error fetching response time data:', feedbackError || assistanceError);
      setLoading(false);
      return;
    }

    // Group feedback by session_id to get one resolution time per session (same as AverageResolutionTimeTile)
    const sessionResolutions = [];
    if (feedbackData?.length) {
      const sessionMap = new Map();
      feedbackData.forEach(item => {
        if (!sessionMap.has(item.session_id)) {
          sessionMap.set(item.session_id, {
            created_at: item.created_at,
            resolved_at: item.resolved_at
          });
        }
      });
      sessionResolutions.push(...sessionMap.values());
    }

    // Combine session resolutions with assistance request resolutions (same as AverageResolutionTimeTile)
    const allResolutions = [
      ...sessionResolutions,
      ...(assistanceData || [])
    ];

    const responseTimes = allResolutions
      .map(item => {
        const created = new Date(item.created_at);
        const resolved = new Date(item.resolved_at);
        const responseTimeMinutes = (resolved - created) / (1000 * 60);
        return { responseTime: responseTimeMinutes };
      })
      .filter(item => Number.isFinite(item.responseTime) && item.responseTime >= 0);

    if (responseTimes.length === 0) {
      setResponseData({ totalResponses: 0, rawTimes: [] });
      setAverageTime(0);
      setMedianTime(0);
      setSlaCompliance(0);
      setTimeDistribution([]);
      setLoading(false);
      return;
    }

    const times = responseTimes.map(rt => rt.responseTime);
    const avgTime = times.reduce((s, t) => s + t, 0) / times.length;

    const sorted = [...times].sort((a, b) => a - b);
    const medTime =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const SLA_TARGET_MIN = 120;
    const compliance = (times.filter(t => t <= SLA_TARGET_MIN).length / times.length) * 100;

    const buckets = [
      { label: '< 15 min', min: 0, max: 15, count: 0, bar: 'bg-green-500' },
      { label: '15–30 min', min: 15, max: 30, count: 0, bar: 'bg-green-400' },
      { label: '30–60 min', min: 30, max: 60, count: 0, bar: 'bg-yellow-500' },
      { label: '1–2 hrs', min: 60, max: 120, count: 0, bar: 'bg-orange-500' },
      { label: '2–4 hrs', min: 120, max: 240, count: 0, bar: 'bg-red-400' },
      { label: '> 4 hrs', min: 240, max: Infinity, count: 0, bar: 'bg-red-600' },
    ];
    times.forEach(t => {
      const b = buckets.find(bk => t >= bk.min && t < bk.max);
      if (b) b.count++;
    });
    const distributionData = buckets.map(bk => ({
      ...bk,
      percentage: (bk.count / times.length) * 100,
    }));

    setResponseData({ totalResponses: responseTimes.length });
    setAverageTime(avgTime);
    setMedianTime(medTime);
    setSlaCompliance(compliance);
    setTimeDistribution(distributionData);
    setLoading(false);
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    if (minutes < 1440) {
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return m ? `${h}h ${m}m` : `${h}h`;
    }
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    return h ? `${d}d ${h}h` : `${d}d`;
  };

  const performanceColor = (minutes) => {
    if (minutes <= 15) return 'text-green-600 dark:text-green-400';
    if (minutes <= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (minutes <= 120) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Response Time Analytics
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          How quickly your team responds to customer feedback and assistance requests
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
            ))}
          </div>
          <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
        </div>
      ) : !responseData.totalResponses ? (
        <div className="text-center py-8">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No Response Data</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Analytics will appear once feedback is resolved.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Average</div>
              <div className={`text-2xl font-bold ${performanceColor(averageTime)}`}>
                {formatTime(averageTime)}
              </div>
            </div>

            <div className="rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Median</div>
              <div className={`text-2xl font-bold ${performanceColor(medianTime)}`}>
                {formatTime(medianTime)}
              </div>
            </div>

            <div className="rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SLA Compliance</div>
              <div className={`text-2xl font-bold ${slaCompliance >= 80 ? 'text-green-600 dark:text-green-400' : slaCompliance >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {slaCompliance.toFixed(0)}%
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{'< 2 hrs'}</div>
            </div>

            <div className="rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Responses Tracked</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {responseData.totalResponses}
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Response Time Distribution
            </h4>
            <div className="space-y-2">
              {timeDistribution.map((bucket, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-xs font-medium text-gray-700 dark:text-gray-300">{bucket.label}</div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full ${bucket.bar}`}
                        style={{ width: `${Math.max(bucket.percentage, 2)}%` }}
                        title={`${bucket.count} responses`}
                      />
                    </div>
                  </div>
                  <div className="w-14 text-right text-xs text-gray-600 dark:text-gray-400">
                    {bucket.percentage.toFixed(0)}%
                  </div>
                  <div className="w-10 text-right text-xs font-medium text-gray-900 dark:text-white">
                    {bucket.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseTimeAnalyticsTile;