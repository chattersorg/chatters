import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { Settings, X, BarChart3, Star, AlertTriangle, Award, ThumbsUp, Activity, Target, PieChart } from 'lucide-react';

const METRIC_CONFIG = {
  total_feedback: {
    title: 'Total Feedback Count',
    icon: BarChart3,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('session_id, venue_id')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Group by venue and count unique sessions
      const venueStats = {};
      venueIds.forEach(id => venueStats[id] = new Set());

      (data || []).forEach(item => {
        if (venueStats[item.venue_id]) {
          venueStats[item.venue_id].add(item.session_id);
        }
      });

      return Object.entries(venueStats).map(([venueId, sessions]) => ({
        venueId,
        value: sessions.size,
        displayValue: sessions.size.toString()
      }));
    }
  },

  resolved_feedback: {
    title: 'Total Resolved Feedback',
    icon: ThumbsUp,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('session_id, venue_id, is_actioned, dismissed')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Group by venue and session
      const venueSessions = {};
      venueIds.forEach(id => venueSessions[id] = {});

      (data || []).forEach(item => {
        if (!venueSessions[item.venue_id][item.session_id]) {
          venueSessions[item.venue_id][item.session_id] = [];
        }
        venueSessions[item.venue_id][item.session_id].push(item);
      });

      return Object.entries(venueSessions).map(([venueId, sessions]) => {
        const sessionArray = Object.values(sessions);
        const total = sessionArray.length;
        const resolved = sessionArray.filter(session =>
          session.every(item => item.is_actioned === true || item.dismissed === true)
        ).length;
        const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

        return {
          venueId,
          value: resolved,
          displayValue: `${resolved} (${percentage}%)`
        };
      });
    }
  },

  avg_satisfaction: {
    title: 'Average Satisfaction',
    icon: Star,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .not('rating', 'is', null);

      // Group by venue and calculate average
      const venueRatings = {};
      venueIds.forEach(id => venueRatings[id] = []);

      (data || []).forEach(item => {
        if (venueRatings[item.venue_id]) {
          venueRatings[item.venue_id].push(item.rating);
        }
      });

      return Object.entries(venueRatings).map(([venueId, ratings]) => {
        const avg = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : 'N/A';

        return {
          venueId,
          value: ratings.length > 0 ? parseFloat(avg) : 0,
          displayValue: avg !== 'N/A' ? `${avg}/5` : 'N/A'
        };
      });
    }
  },

  unresolved_alerts: {
    title: 'Unresolved Alerts',
    icon: AlertTriangle,
    fetchData: async (venueIds, dateRange) => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('session_id, venue_id, created_at, rating, is_actioned, dismissed')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const { data: assistanceData } = await supabase
        .from('assistance_requests')
        .select('id, venue_id, created_at, status, resolved_at')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .neq('status', 'resolved')
        .is('resolved_at', null);

      // Process feedback by venue
      const venueSessions = {};
      venueIds.forEach(id => venueSessions[id] = {});

      (feedbackData || []).forEach(item => {
        if (!venueSessions[item.venue_id][item.session_id]) {
          venueSessions[item.venue_id][item.session_id] = [];
        }
        venueSessions[item.venue_id][item.session_id].push(item);
      });

      // Count urgent feedback per venue
      const venueAlerts = {};
      venueIds.forEach(id => venueAlerts[id] = 0);

      Object.entries(venueSessions).forEach(([venueId, sessions]) => {
        const sessionArray = Object.values(sessions);
        const urgentCount = sessionArray.filter(session => {
          const createdAt = new Date(session[0].created_at);
          const isExpired = createdAt < twoHoursAgo;
          const hasLowScore = session.some(i => i.rating !== null && i.rating < 3);
          const isUnresolved = !session.every(i => i.is_actioned === true || i.dismissed === true);
          return !isExpired && hasLowScore && isUnresolved;
        }).length;
        venueAlerts[venueId] += urgentCount;
      });

      // Count urgent assistance requests per venue
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      (assistanceData || []).forEach(request => {
        const createdAt = new Date(request.created_at);
        if (createdAt < thirtyMinutesAgo) {
          venueAlerts[request.venue_id] = (venueAlerts[request.venue_id] || 0) + 1;
        }
      });

      return Object.entries(venueAlerts).map(([venueId, count]) => ({
        venueId,
        value: count,
        displayValue: count.toString()
      }));
    }
  },

  best_staff: {
    title: 'Best Staff Member',
    icon: Award,
    fetchData: async (venueIds, dateRange) => {
      // Fetch both feedback sessions and assistance requests (like staff leaderboard)
      const [
        { data: feedbackData, error: feedbackError },
        { data: assistanceData, error: assistanceError }
      ] = await Promise.all([
        supabase
          .from('feedback')
          .select('venue_id, session_id, resolved_by, co_resolver_id')
          .in('venue_id', venueIds)
          .not('resolved_by', 'is', null)
          .gte('resolved_at', dateRange.from.toISOString())
          .lte('resolved_at', dateRange.to.toISOString()),
        supabase
          .from('assistance_requests')
          .select('venue_id, id, resolved_by')
          .in('venue_id', venueIds)
          .not('resolved_by', 'is', null)
          .gte('resolved_at', dateRange.from.toISOString())
          .lte('resolved_at', dateRange.to.toISOString())
      ]);

      if (feedbackError || assistanceError) {
        console.error('Error fetching staff data:', feedbackError || assistanceError);
        return venueIds.map(venueId => ({
          venueId,
          value: 0,
          displayValue: 'No data'
        }));
      }

      // Initialize counts per venue per staff member
      const venueFeedbackCounts = {};
      const venueFeedbackCoResolvedCounts = {};
      const venueAssistanceCounts = {};
      venueIds.forEach(id => {
        venueFeedbackCounts[id] = {};
        venueFeedbackCoResolvedCounts[id] = {};
        venueAssistanceCounts[id] = {};
      });

      // Count feedback sessions per staff member per venue
      if (feedbackData?.length) {
        const venueSessionMap = {};
        const venueCoResolverMap = {};
        venueIds.forEach(id => {
          venueSessionMap[id] = {};
          venueCoResolverMap[id] = {};
        });

        feedbackData.forEach(item => {
          if (item.session_id && item.resolved_by) {
            venueSessionMap[item.venue_id][item.session_id] = item.resolved_by;
          }
          // Track co-resolver per session
          if (item.session_id && item.co_resolver_id) {
            venueCoResolverMap[item.venue_id][item.session_id] = item.co_resolver_id;
          }
        });

        // Count main resolvers
        Object.entries(venueSessionMap).forEach(([venueId, sessions]) => {
          Object.values(sessions).forEach(employeeId => {
            venueFeedbackCounts[venueId][employeeId] = (venueFeedbackCounts[venueId][employeeId] || 0) + 1;
          });
        });

        // Count co-resolvers
        Object.entries(venueCoResolverMap).forEach(([venueId, sessions]) => {
          Object.values(sessions).forEach(employeeId => {
            venueFeedbackCoResolvedCounts[venueId][employeeId] = (venueFeedbackCoResolvedCounts[venueId][employeeId] || 0) + 1;
          });
        });
      }

      // Count assistance requests per staff member per venue
      if (assistanceData?.length) {
        assistanceData.forEach(request => {
          if (request.resolved_by) {
            venueAssistanceCounts[request.venue_id][request.resolved_by] =
              (venueAssistanceCounts[request.venue_id][request.resolved_by] || 0) + 1;
          }
        });
      }

      // Get all unique staff IDs
      const staffIds = new Set();
      Object.values(venueFeedbackCounts).forEach(counts => {
        Object.keys(counts).forEach(id => staffIds.add(id));
      });
      Object.values(venueFeedbackCoResolvedCounts).forEach(counts => {
        Object.keys(counts).forEach(id => staffIds.add(id));
      });
      Object.values(venueAssistanceCounts).forEach(counts => {
        Object.keys(counts).forEach(id => staffIds.add(id));
      });

      // Fetch employee names
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', [...staffIds]);

      const employeeMap = {};
      (employeeData || []).forEach(employee => {
        employeeMap[employee.id] = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown';
      });

      // Calculate best staff member for each venue
      return venueIds.map(venueId => {
        const feedbackCounts = venueFeedbackCounts[venueId] || {};
        const coResolvedCounts = venueFeedbackCoResolvedCounts[venueId] || {};
        const assistanceCounts = venueAssistanceCounts[venueId] || {};

        // Combine counts - include co-resolved in total
        const allStaffIds = new Set([
          ...Object.keys(feedbackCounts),
          ...Object.keys(coResolvedCounts),
          ...Object.keys(assistanceCounts)
        ]);
        const staffArray = Array.from(allStaffIds).map(staffId => ({
          staffId,
          count: (feedbackCounts[staffId] || 0) + (coResolvedCounts[staffId] || 0) + (assistanceCounts[staffId] || 0),
          name: employeeMap[staffId] || 'Unknown'
        }));

        if (staffArray.length === 0) {
          return {
            venueId,
            value: 0,
            displayValue: 'No data'
          };
        }

        const best = staffArray.reduce((max, current) =>
          current.count > max.count ? current : max
        );

        return {
          venueId,
          value: best.count,
          displayValue: `${best.name} (${best.count})`
        };
      });
    }
  },

  google_rating: {
    title: 'Google Rating',
    icon: Star,
    fetchData: async (venueIds, dateRange) => {
      // Get all ratings in date range for each venue
      const { data } = await supabase
        .from('historical_ratings')
        .select('venue_id, rating, recorded_at')
        .in('venue_id', venueIds)
        .eq('source', 'google')
        .gte('recorded_at', dateRange.from.toISOString())
        .lte('recorded_at', dateRange.to.toISOString())
        .order('recorded_at', { ascending: true });

      const venueRatings = {};
      venueIds.forEach(id => venueRatings[id] = []);

      (data || []).forEach(item => {
        venueRatings[item.venue_id].push(item);
      });

      return venueIds.map(venueId => {
        const ratings = venueRatings[venueId];

        if (ratings.length === 0) {
          return {
            venueId,
            value: 0,
            displayValue: 'No data'
          };
        }

        // Calculate change from first to last rating in period
        const firstRating = ratings[0].rating;
        const lastRating = ratings[ratings.length - 1].rating;
        const change = lastRating - firstRating;

        return {
          venueId,
          value: change,
          displayValue: change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1)
        };
      });
    }
  },

  tripadvisor_rating: {
    title: 'TripAdvisor Rating',
    icon: Star,
    fetchData: async (venueIds, dateRange) => {
      // Get all ratings in date range for each venue
      const { data } = await supabase
        .from('historical_ratings')
        .select('venue_id, rating, recorded_at')
        .in('venue_id', venueIds)
        .eq('source', 'tripadvisor')
        .gte('recorded_at', dateRange.from.toISOString())
        .lte('recorded_at', dateRange.to.toISOString())
        .order('recorded_at', { ascending: true });

      const venueRatings = {};
      venueIds.forEach(id => venueRatings[id] = []);

      (data || []).forEach(item => {
        venueRatings[item.venue_id].push(item);
      });

      return venueIds.map(venueId => {
        const ratings = venueRatings[venueId];

        if (ratings.length === 0) {
          return {
            venueId,
            value: 0,
            displayValue: 'No data'
          };
        }

        // Calculate change from first to last rating in period
        const firstRating = ratings[0].rating;
        const lastRating = ratings[ratings.length - 1].rating;
        const change = lastRating - firstRating;

        return {
          venueId,
          value: change,
          displayValue: change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1)
        };
      });
    }
  },

  venue_activity: {
    title: 'Venue Activity Heatmap',
    icon: Activity,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('session_id, venue_id')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Group by venue and count unique sessions
      const venueStats = {};
      venueIds.forEach(id => venueStats[id] = new Set());

      (data || []).forEach(item => {
        if (venueStats[item.venue_id]) {
          venueStats[item.venue_id].add(item.session_id);
        }
      });

      // Convert to array with counts
      const statsArray = Object.entries(venueStats).map(([venueId, sessions]) => ({
        venueId,
        value: sessions.size
      }));

      // Calculate activity levels (low, medium, high, very high)
      const counts = statsArray.map(s => s.value);
      const maxCount = Math.max(...counts, 1);

      return statsArray.map(stat => {
        const percentage = (stat.value / maxCount) * 100;
        let activityLevel = 'Low';
        let activityColor = 'bg-gray-100 text-gray-700';

        if (percentage >= 75) {
          activityLevel = 'Very High';
          activityColor = 'bg-green-500 text-white';
        } else if (percentage >= 50) {
          activityLevel = 'High';
          activityColor = 'bg-green-400 text-white';
        } else if (percentage >= 25) {
          activityLevel = 'Medium';
          activityColor = 'bg-yellow-400 text-gray-900';
        } else if (stat.value > 0) {
          activityLevel = 'Low';
          activityColor = 'bg-orange-400 text-white';
        }

        return {
          venueId: stat.venueId,
          value: stat.value,
          displayValue: `${stat.value} sessions`,
          activityLevel,
          activityColor
        };
      });
    }
  },

  venue_nps_comparison: {
    title: 'Venue NPS Comparison',
    icon: PieChart,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .not('rating', 'is', null);

      // Group ratings by venue
      const venueRatings = {};
      venueIds.forEach(id => venueRatings[id] = []);

      (data || []).forEach(item => {
        if (venueRatings[item.venue_id]) {
          venueRatings[item.venue_id].push(item.rating);
        }
      });

      // Calculate NPS for each venue
      return Object.entries(venueRatings).map(([venueId, ratings]) => {
        if (ratings.length === 0) {
          return {
            venueId,
            value: 0,
            displayValue: 'No data',
            npsScore: null
          };
        }

        // NPS calculation: Promoters (4-5) - Detractors (1-2), Passives (3) are neutral
        const promoters = ratings.filter(r => r >= 4).length;
        const detractors = ratings.filter(r => r <= 2).length;
        const total = ratings.length;

        const promoterPercent = (promoters / total) * 100;
        const detractorPercent = (detractors / total) * 100;
        const nps = Math.round(promoterPercent - detractorPercent);

        // Determine NPS category and color
        let npsCategory = 'Poor';
        let npsColor = 'bg-red-500 text-white';

        if (nps >= 50) {
          npsCategory = 'Excellent';
          npsColor = 'bg-green-500 text-white';
        } else if (nps >= 30) {
          npsCategory = 'Great';
          npsColor = 'bg-green-400 text-white';
        } else if (nps >= 0) {
          npsCategory = 'Good';
          npsColor = 'bg-blue-500 text-white';
        } else if (nps >= -30) {
          npsCategory = 'Fair';
          npsColor = 'bg-yellow-500 text-gray-900';
        }

        return {
          venueId,
          value: nps,
          displayValue: nps >= 0 ? `+${nps}` : `${nps}`,
          npsScore: nps,
          npsCategory,
          npsColor,
          totalResponses: total
        };
      });
    }
  },

  resolution_rate: {
    title: 'Resolution Rate',
    icon: Target,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('session_id, venue_id, is_actioned, dismissed')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Group by venue and session
      const venueSessions = {};
      venueIds.forEach(id => venueSessions[id] = {});

      (data || []).forEach(item => {
        if (!venueSessions[item.venue_id][item.session_id]) {
          venueSessions[item.venue_id][item.session_id] = [];
        }
        venueSessions[item.venue_id][item.session_id].push(item);
      });

      return Object.entries(venueSessions).map(([venueId, sessions]) => {
        const sessionArray = Object.values(sessions);
        const total = sessionArray.length;
        const resolved = sessionArray.filter(session =>
          session.every(item => item.is_actioned === true || item.dismissed === true)
        ).length;
        const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

        // Determine performance level and color
        let performanceLevel = 'Poor';
        let performanceColor = 'bg-red-500 text-white';
        let progressBarColor = 'bg-red-500';

        if (percentage >= 90) {
          performanceLevel = 'Excellent';
          performanceColor = 'bg-green-500 text-white';
          progressBarColor = 'bg-green-500';
        } else if (percentage >= 75) {
          performanceLevel = 'Good';
          performanceColor = 'bg-blue-500 text-white';
          progressBarColor = 'bg-blue-500';
        } else if (percentage >= 60) {
          performanceLevel = 'Fair';
          performanceColor = 'bg-yellow-500 text-gray-900';
          progressBarColor = 'bg-yellow-500';
        } else if (percentage >= 40) {
          performanceLevel = 'Below Average';
          performanceColor = 'bg-orange-500 text-white';
          progressBarColor = 'bg-orange-500';
        }

        return {
          venueId,
          value: percentage,
          displayValue: `${percentage}%`,
          resolvedCount: resolved,
          totalCount: total,
          performanceLevel,
          performanceColor,
          progressBarColor
        };
      });
    }
  }
};

// Helper function to get config with fallback for unimplemented metrics
const getMetricConfig = (metricType) => {
  if (METRIC_CONFIG[metricType]) {
    return METRIC_CONFIG[metricType];
  }

  // Return placeholder config for unimplemented metrics
  return {
    title: metricType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    icon: BarChart3,
    isComingSoon: true,
    fetchData: async (venueIds) => {
      return venueIds.map(venueId => ({
        venueId,
        value: 0,
        displayValue: 'Coming Soon'
      }));
    }
  };
};

const ConfigurableMultiVenueTile = ({ metricType, position, onRemove, onChangeMetric, dateRange }) => {
  const { allVenues } = useVenue();
  const [venueStats, setVenueStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = getMetricConfig(metricType);
  const Icon = config.icon;

  useEffect(() => {
    if (!allVenues || allVenues.length === 0 || !dateRange) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const venueIds = allVenues.map(v => v.id);
        const stats = await config.fetchData(venueIds, dateRange);

        // Sort by value descending
        const sortedStats = stats.sort((a, b) => b.value - a.value);

        // Add venue names
        const statsWithNames = sortedStats.map(stat => {
          const venue = allVenues.find(v => v.id === stat.venueId);
          return {
            ...stat,
            venueName: venue?.name || 'Unknown Venue'
          };
        });

        setVenueStats(statsWithNames);
      } catch (error) {
        console.error('Error fetching venue stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [allVenues, metricType, dateRange]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="flex gap-2">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border ${config.isComingSoon ? 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-900/20' : 'border-gray-100 dark:border-gray-800'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.isComingSoon ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{config.title}</h3>
          {config.isComingSoon && (
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onChangeMetric}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Change metric"
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Remove tile"
          >
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* Venue Breakdown */}
      {config.isComingSoon ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">This report is coming soon!</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">We're working on bringing you this analytics feature.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {venueStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            venueStats.map((stat) => {
              // Special rendering for venue_nps_comparison
              if (metricType === 'venue_nps_comparison') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        {stat.npsCategory && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.npsColor}`}>
                            {stat.npsCategory}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {stat.totalResponses && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Based on {stat.totalResponses} response{stat.totalResponses !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              // Special rendering for resolution_rate with progress bar
              if (metricType === 'resolution_rate') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${stat.performanceColor}`}>
                          {stat.performanceLevel}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${stat.progressBarColor} transition-all duration-500`}
                        style={{ width: `${stat.value}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.resolvedCount} of {stat.totalCount} resolved
                      </span>
                    </div>
                  </div>
                );
              }

              // Default rendering for other metrics
              return (
                <div
                  key={stat.venueId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                  <div className="flex items-center gap-2">
                    {stat.activityLevel && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${stat.activityColor}`}>
                        {stat.activityLevel}
                      </span>
                    )}
                    {stat.performanceLevel && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${stat.performanceColor}`}>
                        {stat.performanceLevel}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.displayValue}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigurableMultiVenueTile;
