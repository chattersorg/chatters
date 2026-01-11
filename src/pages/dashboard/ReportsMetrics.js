import React, { useState, useEffect } from 'react';
import ModernCard from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { Star } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import FilterSelect from '../../components/ui/FilterSelect';

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

const ReportsMetricsPage = () => {
  usePageTitle('Metrics');
  const { venueId } = useVenue();
  const [timeframe, setTimeframe] = useState('last14');
  const [metrics, setMetrics] = useState({
    totalResponses: 0,
    feedbackCount: 0,
    assistanceCount: 0,
    avgResponseTime: 0,
    overallScore: 0,
    happyCustomers: 0,
    resolutionRate: 0,
    topStaffMember: null,
    avgStaffResponseTime: 0,
    staffResolutionCount: 0,
    peakHour: null,
    busiestDay: null,
    hourlyPattern: [],
    dailyPattern: [],
    daysInPeriod: 1,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    commentRate: 0,
    totalWithComments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    fetchMetrics();
  }, [venueId, timeframe]);

  const fetchMetrics = async () => {
    setLoading(true);
    const { start, end } = rangeISO(timeframe);

    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('id, created_at, rating, resolution_type, resolved_at, resolved_by, co_resolver_id, additional_feedback')
        .eq('venue_id', venueId)
        .gte('created_at', start)
        .lte('created_at', end);

      if (feedbackError) throw feedbackError;

      const { data: assistanceData, error: assistanceError } = await supabase
        .from('assistance_requests')
        .select('id, created_at, status, resolved_at, acknowledged_at, resolved_by, acknowledged_by')
        .eq('venue_id', venueId)
        .gte('created_at', start)
        .lte('created_at', end);

      if (assistanceError) throw assistanceError;

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, venue_id')
        .eq('venue_id', venueId);

      if (employeeError) throw employeeError;

      const employeeMap = {};
      (employeeData || []).forEach(emp => {
        employeeMap[emp.id] = `${emp.first_name} ${emp.last_name}`;
      });

      const feedbackCount = feedbackData?.length || 0;
      const assistanceCount = assistanceData?.length || 0;
      const totalResponses = feedbackCount + assistanceCount;

      const resolvedFeedback = (feedbackData || []).filter(item => item.resolution_type && item.resolved_at);
      const resolvedAssistance = (assistanceData || []).filter(item => item.status === 'resolved' && item.resolved_at);
      const resolvedItems = [...resolvedFeedback, ...resolvedAssistance];

      const avgResponseTime = resolvedItems.length > 0
        ? resolvedItems.reduce((sum, item) => {
            const responseTime = new Date(item.resolved_at) - new Date(item.created_at);
            return sum + (responseTime / (1000 * 60));
          }, 0) / resolvedItems.length
        : 0;

      const ratingsData = (feedbackData || []).filter(item => item.rating && !isNaN(parseFloat(item.rating)));
      const overallScore = ratingsData.length > 0
        ? ratingsData.reduce((sum, item) => sum + parseFloat(item.rating), 0) / ratingsData.length
        : 0;

      const happyCustomers = ratingsData.length > 0
        ? Math.round((ratingsData.filter(item => parseFloat(item.rating) >= 4).length / ratingsData.length) * 100)
        : 0;

      const resolutionRate = totalResponses > 0
        ? Math.round((resolvedItems.length / totalResponses) * 100)
        : 0;

      // Rating distribution
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratingsData.forEach(item => {
        const rating = Math.round(parseFloat(item.rating));
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++;
        }
      });

      // Comment rate
      const feedbackWithComments = (feedbackData || []).filter(
        item => item.additional_feedback && item.additional_feedback.trim().length > 0
      );
      const commentRate = feedbackCount > 0
        ? Math.round((feedbackWithComments.length / feedbackCount) * 100)
        : 0;

      const staffPerformance = {};

      (feedbackData || []).forEach(item => {
        if (item.resolved_by && item.resolved_at && employeeMap[item.resolved_by]) {
          const staffName = employeeMap[item.resolved_by];
          if (!staffPerformance[staffName]) {
            staffPerformance[staffName] = { resolutions: 0, coResolutions: 0, totalTime: 0, feedbackResolutions: 0 };
          }
          staffPerformance[staffName].resolutions++;
          staffPerformance[staffName].feedbackResolutions++;
          const responseTime = new Date(item.resolved_at) - new Date(item.created_at);
          staffPerformance[staffName].totalTime += responseTime / (1000 * 60);
        }

        if (item.co_resolver_id && item.resolved_at && employeeMap[item.co_resolver_id]) {
          const coResolverName = employeeMap[item.co_resolver_id];
          if (!staffPerformance[coResolverName]) {
            staffPerformance[coResolverName] = { resolutions: 0, coResolutions: 0, totalTime: 0, feedbackResolutions: 0 };
          }
          staffPerformance[coResolverName].coResolutions++;
          const responseTime = new Date(item.resolved_at) - new Date(item.created_at);
          staffPerformance[coResolverName].totalTime += responseTime / (1000 * 60);
        }
      });

      (assistanceData || []).forEach(item => {
        if (item.resolved_by && item.resolved_at && employeeMap[item.resolved_by]) {
          const staffName = employeeMap[item.resolved_by];
          if (!staffPerformance[staffName]) {
            staffPerformance[staffName] = { resolutions: 0, coResolutions: 0, totalTime: 0, feedbackResolutions: 0 };
          }
          staffPerformance[staffName].resolutions++;
          const responseTime = new Date(item.resolved_at) - new Date(item.created_at);
          staffPerformance[staffName].totalTime += responseTime / (1000 * 60);
        }
      });

      const topStaffMember = Object.keys(staffPerformance).length > 0
        ? Object.entries(staffPerformance).reduce((top, [name, data]) => {
            const total = data.resolutions + data.coResolutions;
            const topTotal = (top.resolutions || 0) + (top.coResolutions || 0);
            return total > topTotal ? { name, ...data, totalResolutions: total } : top;
          }, {})
        : null;

      const avgStaffResponseTime = Object.values(staffPerformance).length > 0
        ? Object.values(staffPerformance).reduce((sum, staff) =>
            sum + (staff.resolutions > 0 ? staff.totalTime / staff.resolutions : 0), 0) / Object.values(staffPerformance).length
        : 0;

      const staffResolutionCount = Object.values(staffPerformance).reduce(
        (sum, staff) => sum + staff.resolutions, 0
      );

      const allItems = [...(feedbackData || []), ...(assistanceData || [])];

      const hourlyData = {};
      allItems.forEach(item => {
        const hour = new Date(item.created_at).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      });

      const peakHour = Object.keys(hourlyData).length > 0
        ? Object.entries(hourlyData).reduce((peak, [hour, count]) =>
            count > (peak.count || 0) ? { hour: parseInt(hour), count } : peak, {})
        : null;

      const dailyData = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      allItems.forEach(item => {
        const dayIndex = new Date(item.created_at).getDay();
        const dayName = dayNames[dayIndex];
        dailyData[dayName] = (dailyData[dayName] || 0) + 1;
      });

      const busiestDay = Object.keys(dailyData).length > 0
        ? Object.entries(dailyData).reduce((busiest, [day, count]) =>
            count > (busiest.count || 0) ? { day, count } : busiest, {})
        : null;

      const hourlyPattern = Array.from({length: 24}, (_, hour) => ({
        hour: hour,
        count: hourlyData[hour] || 0,
        label: `${hour}:00`
      }));

      const dailyPattern = dayNames.map(day => ({
        day,
        count: dailyData[day] || 0
      }));

      // For "all time", calculate days from earliest actual data point, not from Unix epoch
      let effectiveStartDate;
      if (timeframe === 'all' && allItems.length > 0) {
        // Find the earliest created_at from the actual data
        const earliestDate = allItems.reduce((earliest, item) => {
          const itemDate = new Date(item.created_at);
          return itemDate < earliest ? itemDate : earliest;
        }, new Date());
        effectiveStartDate = earliestDate;
      } else {
        effectiveStartDate = new Date(start);
      }
      const endDate = new Date(end);
      const daysDiff = Math.max(1, Math.ceil((endDate - effectiveStartDate) / (1000 * 60 * 60 * 24)));

      setMetrics({
        totalResponses,
        feedbackCount,
        assistanceCount,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        overallScore: Math.round(overallScore * 10) / 10,
        happyCustomers,
        resolutionRate,
        topStaffMember,
        avgStaffResponseTime: Math.round(avgStaffResponseTime * 10) / 10,
        staffResolutionCount,
        peakHour,
        busiestDay,
        hourlyPattern,
        dailyPattern,
        daysInPeriod: daysDiff,
        ratingDistribution,
        commentRate,
        totalWithComments: feedbackWithComments.length
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => num.toLocaleString();

  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = minutes / 60;
      return `${hours.toFixed(1)}h`;
    }
    return `${minutes.toFixed(0)}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 4) return 'text-green-600 dark:text-green-400';
    if (score >= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPercentageColor = (pct) => {
    if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 60) return 'text-green-600 dark:text-green-400';
    if (pct >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!venueId) {
    return null;
  }

  const dailyAvg = Math.round((metrics.totalResponses || 0) / (metrics.daysInPeriod || 1));
  const totalRatings = Object.values(metrics.ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Metrics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Performance overview and key metrics
          </p>
        </div>
        <FilterSelect
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'last7', label: 'Last 7 days' },
            { value: 'last14', label: 'Last 14 days' },
            { value: 'last30', label: 'Last 30 days' },
            { value: 'all', label: 'All time' }
          ]}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Responses */}
        <ModernCard padding="p-4" shadow="shadow-sm">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Responses</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? '—' : formatNumber(metrics.totalResponses)}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{loading ? '' : `${dailyAvg}/day`}</p>
        </ModernCard>

        {/* Avg Rating */}
        <ModernCard padding="p-4" shadow="shadow-sm">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Rating</p>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className={`text-2xl font-bold ${loading ? 'text-gray-900 dark:text-white' : getScoreColor(metrics.overallScore)}`}>
              {loading ? '—' : metrics.overallScore.toFixed(1)}
            </span>
          </div>
        </ModernCard>

        {/* Happy Customers */}
        <ModernCard padding="p-4" shadow="shadow-sm">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Happy (4+)</p>
          <div className={`text-2xl font-bold ${loading ? 'text-gray-900 dark:text-white' : getPercentageColor(metrics.happyCustomers)}`}>
            {loading ? '—' : `${metrics.happyCustomers}%`}
          </div>
        </ModernCard>

        {/* Resolution Rate */}
        <ModernCard padding="p-4" shadow="shadow-sm">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Resolved</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? '—' : `${metrics.resolutionRate}%`}
          </div>
        </ModernCard>

        {/* Avg Response Time */}
        <ModernCard padding="p-4" shadow="shadow-sm">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Response</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? '—' : formatTime(metrics.avgResponseTime)}
          </div>
        </ModernCard>

        {/* Comment Rate */}
        <ModernCard padding="p-4" shadow="shadow-sm">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">With Comments</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? '—' : `${metrics.commentRate}%`}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{loading ? '' : `${metrics.totalWithComments} total`}</p>
        </ModernCard>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <ModernCard padding="p-5" shadow="shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Rating Distribution
          </h3>

          {totalRatings > 0 && !loading ? (
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = metrics.ratingDistribution[rating];
                const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                const barColors = {
                  5: 'bg-emerald-500',
                  4: 'bg-emerald-400',
                  3: 'bg-amber-500',
                  2: 'bg-orange-500',
                  1: 'bg-rose-500'
                };
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-8">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[rating]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
                      <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : loading ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">No ratings yet</p>
            </div>
          )}
        </ModernCard>

        {/* Response Breakdown */}
        <ModernCard padding="p-5" shadow="shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Response Breakdown
          </h3>

          {metrics.totalResponses > 0 && !loading ? (
            <div className="space-y-4">
              {/* Visual bar */}
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                {metrics.feedbackCount > 0 && (
                  <div
                    className="bg-gray-900 dark:bg-white"
                    style={{ width: `${(metrics.feedbackCount / metrics.totalResponses) * 100}%` }}
                  />
                )}
                {metrics.assistanceCount > 0 && (
                  <div
                    className="bg-gray-400 dark:bg-gray-500"
                    style={{ width: `${(metrics.assistanceCount / metrics.totalResponses) * 100}%` }}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-900 dark:bg-white" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Feedback</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.feedbackCount}</span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({Math.round((metrics.feedbackCount / metrics.totalResponses) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Assistance</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.assistanceCount}</span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({Math.round((metrics.assistanceCount / metrics.totalResponses) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Staff Actions</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(metrics.staffResolutionCount)}
                  </span>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">No responses yet</p>
            </div>
          )}
        </ModernCard>

        {/* Top Performer */}
        <ModernCard padding="p-5" shadow="shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Top Performer
          </h3>

          {metrics.topStaffMember && !loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {metrics.topStaffMember.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {metrics.topStaffMember.resolutions} resolved · {metrics.topStaffMember.coResolutions} co-resolved
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.topStaffMember.totalResolutions}
                  </p>
                  <p className="text-xs text-gray-400">total</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg staff response</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(metrics.avgStaffResponseTime)}
                  </span>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">No staff resolutions yet</p>
            </div>
          )}
        </ModernCard>
      </div>

      {/* Activity Patterns - Full Width */}
      <ModernCard padding="p-5" shadow="shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Activity Patterns
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peak Hour</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {loading ? '—' : (metrics.peakHour ? `${metrics.peakHour.hour}:00` : '—')}
              </p>
              <p className="text-xs text-gray-400">
                {loading ? '' : (metrics.peakHour ? `${metrics.peakHour.count} activities` : '')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Busiest Day</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {loading ? '—' : (metrics.busiestDay ? metrics.busiestDay.day : '—')}
              </p>
              <p className="text-xs text-gray-400">
                {loading ? '' : (metrics.busiestDay ? `${metrics.busiestDay.count} activities` : '')}
              </p>
            </div>
          </div>

          {/* Hourly Distribution */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Hourly Distribution</p>
            <div className="flex items-end gap-0.5 h-12">
              {metrics.hourlyPattern.map((hour, idx) => {
                const maxCount = Math.max(...metrics.hourlyPattern.map(h => h.count), 1);
                const height = (hour.count / maxCount) * 100;
                const isPeak = metrics.peakHour && hour.hour === metrics.peakHour.hour;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t ${
                      isPeak
                        ? 'bg-gray-900 dark:bg-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${hour.label}: ${hour.count} activities`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">12am</span>
              <span className="text-[10px] text-gray-400">12pm</span>
              <span className="text-[10px] text-gray-400">11pm</span>
            </div>
          </div>
        </div>
      </ModernCard>
    </div>
  );
};

export default ReportsMetricsPage;
