import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// Helper to calculate date ranges from presets
const getDateRangeFromPreset = (dateRange) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  if (dateRange?.preset === 'custom' && dateRange.from && dateRange.to) {
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return { start: from, end: to };
  }

  switch (dateRange?.preset) {
    case 'last7': {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return { start: sevenDaysAgo, end: todayEnd };
    }
    case 'last14': {
      const fourteenDaysAgo = new Date(todayStart);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      return { start: fourteenDaysAgo, end: todayEnd };
    }
    case 'last30': {
      const thirtyDaysAgo = new Date(todayStart);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      return { start: thirtyDaysAgo, end: todayEnd };
    }
    case 'all': {
      const oneYearAgo = new Date(todayStart);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return { start: oneYearAgo, end: todayEnd };
    }
    default:
      return { start: todayStart, end: todayEnd };
  }
};

// Calculate comparison period
const getComparisonRange = (start, end) => {
  const duration = end - start;
  const comparisonEnd = new Date(start.getTime() - 1);
  comparisonEnd.setHours(23, 59, 59, 999);
  const comparisonStart = new Date(comparisonEnd.getTime() - duration);
  comparisonStart.setHours(0, 0, 0, 0);
  return { start: comparisonStart, end: comparisonEnd };
};

const useMultiVenueNPSStats = (venueIds = [], dateRange = { preset: 'last7' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dateRangeKey = JSON.stringify(dateRange);

  useEffect(() => {
    if (!venueIds || venueIds.length === 0) {
      setStats(null);
      setLoading(false);
      return;
    }

    fetchStats();
  }, [venueIds.join(','), dateRangeKey]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start: rangeStart, end: rangeEnd } = getDateRangeFromPreset(dateRange);
      const { start: comparisonStart, end: comparisonEnd } = getComparisonRange(rangeStart, rangeEnd);
      const rangeDays = Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));

      // Fetch NPS submissions for current period
      const { data: currentNPS, error: npsError } = await supabase
        .from('nps_submissions')
        .select('id, venue_id, score, sent_at, responded_at, created_at, send_error')
        .in('venue_id', venueIds)
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString());

      if (npsError) throw npsError;

      // Fetch comparison period NPS
      const { data: comparisonNPS } = await supabase
        .from('nps_submissions')
        .select('id, venue_id, score, sent_at, responded_at')
        .in('venue_id', venueIds)
        .gte('created_at', comparisonStart.toISOString())
        .lte('created_at', comparisonEnd.toISOString());

      // Calculate NPS Score
      const responsesWithScore = currentNPS?.filter(n => n.score !== null && n.responded_at) || [];
      const promoters = responsesWithScore.filter(r => r.score >= 9).length;
      const passives = responsesWithScore.filter(r => r.score >= 7 && r.score <= 8).length;
      const detractors = responsesWithScore.filter(r => r.score <= 6).length;
      const totalResponses = responsesWithScore.length;

      const npsScore = totalResponses > 0
        ? Math.round(((promoters - detractors) / totalResponses) * 100)
        : null;

      // Comparison NPS
      const comparisonResponsesWithScore = comparisonNPS?.filter(n => n.score !== null && n.responded_at) || [];
      const compPromoters = comparisonResponsesWithScore.filter(r => r.score >= 9).length;
      const compDetractors = comparisonResponsesWithScore.filter(r => r.score <= 6).length;
      const compTotal = comparisonResponsesWithScore.length;
      const comparisonNPSScore = compTotal > 0
        ? Math.round(((compPromoters - compDetractors) / compTotal) * 100)
        : null;

      // Emails Sent
      const emailsSent = currentNPS?.filter(n => n.sent_at).length || 0;
      const comparisonEmailsSent = comparisonNPS?.filter(n => n.sent_at).length || 0;

      // Email delivery stats for bar chart
      const emailsFailed = currentNPS?.filter(n => n.send_error).length || 0;
      const emailsDelivered = emailsSent - emailsFailed;

      // Response stats for bar chart
      const notResponded = emailsSent - totalResponses;

      // Response Rate
      const responseRate = emailsSent > 0
        ? Math.round((totalResponses / emailsSent) * 100)
        : null;
      const comparisonResponseRate = comparisonEmailsSent > 0
        ? Math.round((comparisonResponsesWithScore.length / comparisonEmailsSent) * 100)
        : null;

      // Calculate trends
      const npsTrend = calculateTrend(npsScore, comparisonNPSScore);
      const emailsTrend = calculateTrend(emailsSent, comparisonEmailsSent);
      const responseRateTrend = calculateTrend(responseRate, comparisonResponseRate);

      // Calculate sparklines
      const { numPoints, intervalMs } = getSparklineIntervals(rangeStart, rangeEnd, rangeDays);

      // Per-venue sparklines
      const perVenueSparklines = {};
      for (const venueId of venueIds) {
        const venueData = currentNPS?.filter(n => n.venue_id === venueId) || [];
        perVenueSparklines[venueId] = {
          nps: calculateNPSSparkline(venueData, rangeStart, numPoints, intervalMs),
          emailsSent: calculateEmailsSparkline(venueData, rangeStart, numPoints, intervalMs),
          responseRate: calculateResponseRateSparkline(venueData, rangeStart, numPoints, intervalMs)
        };
      }

      // Sparkline dates
      const sparklineDates = [];
      for (let i = 0; i < numPoints; i++) {
        const bucketStart = new Date(rangeStart.getTime() + (i * intervalMs));
        sparklineDates.push(bucketStart.toISOString());
      }

      // Per-venue totals for KPI view and bar chart
      const perVenueTotals = {};
      for (const venueId of venueIds) {
        const venueData = currentNPS?.filter(n => n.venue_id === venueId) || [];
        const venueResponses = venueData.filter(n => n.score !== null && n.responded_at);
        const venuePromoters = venueResponses.filter(r => r.score >= 9).length;
        const venuePassives = venueResponses.filter(r => r.score >= 7 && r.score <= 8).length;
        const venueDetractors = venueResponses.filter(r => r.score <= 6).length;
        const venueTotalResponses = venueResponses.length;
        const venueEmailsSent = venueData.filter(n => n.sent_at).length;
        const venueEmailsFailed = venueData.filter(n => n.send_error).length;
        const venueEmailsDelivered = venueEmailsSent - venueEmailsFailed;
        const venueNotResponded = venueEmailsSent - venueTotalResponses;

        perVenueTotals[venueId] = {
          nps: venueTotalResponses > 0
            ? Math.round(((venuePromoters - venueDetractors) / venueTotalResponses) * 100)
            : null,
          emailsSent: venueEmailsSent,
          responseRate: venueEmailsSent > 0
            ? Math.round((venueTotalResponses / venueEmailsSent) * 100)
            : null,
          responses: venueTotalResponses,
          // Bar chart data per venue
          promoters: venuePromoters,
          passives: venuePassives,
          detractors: venueDetractors,
          emailsDelivered: venueEmailsDelivered,
          emailsFailed: venueEmailsFailed,
          responded: venueTotalResponses,
          notResponded: venueNotResponded
        };
      }

      setStats({
        // NPS
        npsScore,
        npsTrend: npsTrend?.value,
        npsTrendDirection: npsTrend?.direction,
        promoters,
        passives,
        detractors,
        totalResponses,
        // Emails
        emailsSent,
        emailsDelivered,
        emailsFailed,
        emailsTrend: emailsTrend?.value,
        emailsTrendDirection: emailsTrend?.direction,
        // Response Rate
        responseRate,
        responded: totalResponses,
        notResponded,
        responseRateTrend: responseRateTrend?.value,
        responseRateTrendDirection: responseRateTrend?.direction,
        // Sparklines
        perVenueSparklines,
        sparklineDates,
        // Per-venue totals
        perVenueTotals
      });

    } catch (err) {
      console.error('Error fetching NPS stats:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current, previous) => {
    if (current === null || previous === null) return null;
    if (previous === 0) {
      if (current === 0) return { value: '~0%', direction: 'neutral' };
      return { value: `+${current}`, direction: current > 0 ? 'up' : 'down' };
    }

    const percentChange = ((current - previous) / Math.abs(previous)) * 100;
    if (Math.abs(percentChange) < 1) return { value: '~0%', direction: 'neutral' };

    return {
      value: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(0)}%`,
      direction: percentChange > 0 ? 'up' : 'down'
    };
  };

  const getSparklineIntervals = (rangeStart, rangeEnd, rangeDays) => {
    let numPoints = rangeDays;
    let intervalMs = 24 * 60 * 60 * 1000;

    if (rangeDays > 60) {
      numPoints = Math.ceil(rangeDays / 7);
      intervalMs = 7 * 24 * 60 * 60 * 1000;
    } else if (rangeDays > 30) {
      numPoints = Math.ceil(rangeDays / 2);
      intervalMs = 2 * 24 * 60 * 60 * 1000;
    }

    if (numPoints > 30) {
      const factor = Math.ceil(numPoints / 30);
      numPoints = Math.ceil(numPoints / factor);
      intervalMs = intervalMs * factor;
    }

    return { numPoints, intervalMs };
  };

  const calculateNPSSparkline = (data, rangeStart, numPoints, intervalMs) => {
    const sparkline = [];
    for (let i = 0; i < numPoints; i++) {
      const bucketStart = new Date(rangeStart.getTime() + (i * intervalMs));
      const bucketEnd = new Date(bucketStart.getTime() + intervalMs);

      const bucketData = data.filter(n => {
        const created = new Date(n.created_at);
        return created >= bucketStart && created < bucketEnd && n.score !== null && n.responded_at;
      });

      if (bucketData.length === 0) {
        sparkline.push(0);
      } else {
        const promoters = bucketData.filter(r => r.score >= 9).length;
        const detractors = bucketData.filter(r => r.score <= 6).length;
        // Normalize NPS from -100..100 to 0..100 for chart display
        const nps = ((promoters - detractors) / bucketData.length) * 100;
        sparkline.push((nps + 100) / 2);
      }
    }
    return sparkline;
  };

  const calculateEmailsSparkline = (data, rangeStart, numPoints, intervalMs) => {
    const sparkline = [];
    for (let i = 0; i < numPoints; i++) {
      const bucketStart = new Date(rangeStart.getTime() + (i * intervalMs));
      const bucketEnd = new Date(bucketStart.getTime() + intervalMs);

      const count = data.filter(n => {
        if (!n.sent_at) return false;
        const sent = new Date(n.sent_at);
        return sent >= bucketStart && sent < bucketEnd;
      }).length;

      sparkline.push(count);
    }
    return sparkline;
  };

  const calculateResponseRateSparkline = (data, rangeStart, numPoints, intervalMs) => {
    const sparkline = [];
    for (let i = 0; i < numPoints; i++) {
      const bucketStart = new Date(rangeStart.getTime() + (i * intervalMs));
      const bucketEnd = new Date(bucketStart.getTime() + intervalMs);

      const bucketData = data.filter(n => {
        const created = new Date(n.created_at);
        return created >= bucketStart && created < bucketEnd;
      });

      const sent = bucketData.filter(n => n.sent_at).length;
      const responded = bucketData.filter(n => n.responded_at && n.score !== null).length;

      sparkline.push(sent > 0 ? (responded / sent) * 100 : 0);
    }
    return sparkline;
  };

  return { stats, loading, error, refetch: fetchStats };
};

export default useMultiVenueNPSStats;
