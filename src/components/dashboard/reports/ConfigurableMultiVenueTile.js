import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { Settings, X, BarChart3, Star, AlertTriangle, Award, ThumbsUp, Activity, Target, PieChart, Clock, Timer, Trophy, Heart, Calendar } from 'lucide-react';

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
    title: 'Total Resolved',
    icon: ThumbsUp,
    fetchData: async (venueIds, dateRange) => {
      // Fetch both feedback sessions and assistance requests (to match overview stats)
      const [{ data: feedbackData }, { data: assistanceData }] = await Promise.all([
        supabase
          .from('feedback')
          .select('session_id, venue_id, is_actioned, resolved_at')
          .in('venue_id', venueIds)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString()),
        supabase
          .from('assistance_requests')
          .select('id, venue_id, status, resolved_at')
          .in('venue_id', venueIds)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
      ]);

      // Group feedback by venue - count unique sessions
      // Overview counts a session as resolved if ANY item has resolved_at && is_actioned
      const venueTotalSessions = {};
      const venueResolvedSessions = {};
      venueIds.forEach(id => {
        venueTotalSessions[id] = new Set();
        venueResolvedSessions[id] = new Set();
      });

      (feedbackData || []).forEach(item => {
        if (venueTotalSessions[item.venue_id]) {
          venueTotalSessions[item.venue_id].add(item.session_id);
          // A session is resolved if ANY feedback has resolved_at && is_actioned (matching overview)
          if (item.resolved_at && item.is_actioned) {
            venueResolvedSessions[item.venue_id].add(item.session_id);
          }
        }
      });

      // Group assistance requests by venue
      const venueAssistance = {};
      venueIds.forEach(id => venueAssistance[id] = []);

      (assistanceData || []).forEach(item => {
        if (venueAssistance[item.venue_id]) {
          venueAssistance[item.venue_id].push(item);
        }
      });

      return venueIds.map(venueId => {
        // Count feedback sessions
        const totalFeedback = venueTotalSessions[venueId].size;
        const resolvedFeedback = venueResolvedSessions[venueId].size;

        // Count assistance requests
        const assistanceRequests = venueAssistance[venueId] || [];
        const totalAssistance = assistanceRequests.length;
        const resolvedAssistance = assistanceRequests.filter(req =>
          req.resolved_at !== null
        ).length;

        // Combined totals
        const total = totalFeedback + totalAssistance;
        const resolved = resolvedFeedback + resolvedAssistance;
        const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

        // Determine performance level based on resolution percentage
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
          value: resolved,
          displayValue: `${resolved}`,
          percentage,
          resolvedCount: resolved,
          totalCount: total,
          performanceLevel,
          performanceColor,
          progressBarColor
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
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
          : null;

        // Determine performance level based on average rating
        let performanceLevel = 'Poor';
        let performanceColor = 'bg-red-500 text-white';
        let progressBarColor = 'bg-red-500';

        if (avg !== null) {
          if (avg >= 4.5) {
            performanceLevel = 'Excellent';
            performanceColor = 'bg-green-500 text-white';
            progressBarColor = 'bg-green-500';
          } else if (avg >= 4.0) {
            performanceLevel = 'Great';
            performanceColor = 'bg-green-400 text-white';
            progressBarColor = 'bg-green-400';
          } else if (avg >= 3.5) {
            performanceLevel = 'Good';
            performanceColor = 'bg-blue-500 text-white';
            progressBarColor = 'bg-blue-500';
          } else if (avg >= 3.0) {
            performanceLevel = 'Fair';
            performanceColor = 'bg-yellow-500 text-gray-900';
            progressBarColor = 'bg-yellow-500';
          } else if (avg >= 2.0) {
            performanceLevel = 'Below Average';
            performanceColor = 'bg-orange-500 text-white';
            progressBarColor = 'bg-orange-500';
          }
        }

        return {
          venueId,
          value: avg !== null ? avg : 0,
          displayValue: avg !== null ? `${avg.toFixed(1)}/5` : 'No data',
          avgRating: avg,
          totalResponses: ratings.length,
          performanceLevel: avg !== null ? performanceLevel : null,
          performanceColor,
          progressBarColor
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
            displayValue: 'No data',
            staffName: null,
            resolutionCount: 0
          };
        }

        // Sort by count descending to get ranking
        staffArray.sort((a, b) => b.count - a.count);
        const best = staffArray[0];

        // Determine performance level based on resolution count
        let performanceLevel = 'Active';
        let performanceColor = 'bg-yellow-500 text-gray-900';

        if (best.count >= 50) {
          performanceLevel = 'Star Performer';
          performanceColor = 'bg-green-500 text-white';
        } else if (best.count >= 25) {
          performanceLevel = 'Top Performer';
          performanceColor = 'bg-yellow-500 text-gray-900';
        } else if (best.count >= 10) {
          performanceLevel = 'Great';
          performanceColor = 'bg-yellow-500 text-gray-900';
        } else if (best.count >= 5) {
          performanceLevel = 'Good';
          performanceColor = 'bg-yellow-500 text-gray-900';
        }

        return {
          venueId,
          value: best.count,
          displayValue: best.name,
          staffName: best.name,
          resolutionCount: best.count,
          performanceLevel,
          performanceColor,
          totalStaff: staffArray.length
        };
      });
    }
  },

  google_rating: {
    title: 'Google Rating Change',
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
            displayValue: 'No data',
            hasData: false
          };
        }

        // Calculate change from first to last rating in period
        const firstRating = ratings[0].rating;
        const lastRating = ratings[ratings.length - 1].rating;
        const change = lastRating - firstRating;

        // Determine trend level and color
        let trendLevel = 'No Change';
        let trendColor = 'bg-gray-500 text-white';
        let trendIcon = '→';

        if (change > 0.3) {
          trendLevel = 'Rising';
          trendColor = 'bg-green-500 text-white';
          trendIcon = '↑';
        } else if (change > 0) {
          trendLevel = 'Slight Rise';
          trendColor = 'bg-green-400 text-white';
          trendIcon = '↗';
        } else if (change < -0.3) {
          trendLevel = 'Falling';
          trendColor = 'bg-red-500 text-white';
          trendIcon = '↓';
        } else if (change < 0) {
          trendLevel = 'Slight Drop';
          trendColor = 'bg-orange-500 text-white';
          trendIcon = '↘';
        }

        return {
          venueId,
          value: change,
          displayValue: change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1),
          currentRating: lastRating,
          previousRating: firstRating,
          trendLevel,
          trendColor,
          trendIcon,
          hasData: true,
          dataPoints: ratings.length
        };
      });
    }
  },

  tripadvisor_rating: {
    title: 'TripAdvisor Rating Change',
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
            displayValue: 'No data',
            hasData: false
          };
        }

        // Calculate change from first to last rating in period
        const firstRating = ratings[0].rating;
        const lastRating = ratings[ratings.length - 1].rating;
        const change = lastRating - firstRating;

        // Determine trend level and color
        let trendLevel = 'No Change';
        let trendColor = 'bg-gray-500 text-white';
        let trendIcon = '→';

        if (change > 0.3) {
          trendLevel = 'Rising';
          trendColor = 'bg-green-500 text-white';
          trendIcon = '↑';
        } else if (change > 0) {
          trendLevel = 'Slight Rise';
          trendColor = 'bg-green-400 text-white';
          trendIcon = '↗';
        } else if (change < -0.3) {
          trendLevel = 'Falling';
          trendColor = 'bg-red-500 text-white';
          trendIcon = '↓';
        } else if (change < 0) {
          trendLevel = 'Slight Drop';
          trendColor = 'bg-orange-500 text-white';
          trendIcon = '↘';
        }

        return {
          venueId,
          value: change,
          displayValue: change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1),
          currentRating: lastRating,
          previousRating: firstRating,
          trendLevel,
          trendColor,
          trendIcon,
          hasData: true,
          dataPoints: ratings.length
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
  },

  response_time: {
    title: 'Average Response Time',
    icon: Clock,
    fetchData: async (venueIds, dateRange) => {
      // Fetch both feedback sessions and assistance requests with timestamps
      // For feedback: must have resolved_at AND is_actioned = true (to match overview stats)
      const [{ data: feedbackData }, { data: assistanceData }] = await Promise.all([
        supabase
          .from('feedback')
          .select('session_id, venue_id, created_at, resolved_at, is_actioned')
          .in('venue_id', venueIds)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
          .not('resolved_at', 'is', null)
          .eq('is_actioned', true),
        supabase
          .from('assistance_requests')
          .select('id, venue_id, created_at, resolved_at')
          .in('venue_id', venueIds)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
          .not('resolved_at', 'is', null)
      ]);

      // Group by venue and calculate response times per SESSION (not per feedback item)
      const venueResponseTimes = {};
      venueIds.forEach(id => venueResponseTimes[id] = []);

      // Group feedback by venue and session to get earliest created_at and latest resolved_at
      const venueFeedbackSessions = {};
      venueIds.forEach(id => venueFeedbackSessions[id] = {});

      (feedbackData || []).forEach(item => {
        if (!venueFeedbackSessions[item.venue_id][item.session_id]) {
          venueFeedbackSessions[item.venue_id][item.session_id] = {
            created_at: item.created_at,
            resolved_at: item.resolved_at
          };
        } else {
          // Use earliest created_at and latest resolved_at for the session
          const existing = venueFeedbackSessions[item.venue_id][item.session_id];
          if (new Date(item.created_at) < new Date(existing.created_at)) {
            existing.created_at = item.created_at;
          }
          if (new Date(item.resolved_at) > new Date(existing.resolved_at)) {
            existing.resolved_at = item.resolved_at;
          }
        }
      });

      // Calculate response times from feedback sessions
      Object.entries(venueFeedbackSessions).forEach(([venueId, sessions]) => {
        Object.values(sessions).forEach(session => {
          const created = new Date(session.created_at);
          const resolved = new Date(session.resolved_at);
          const responseTimeMs = resolved - created;
          if (responseTimeMs > 0) {
            venueResponseTimes[venueId].push(responseTimeMs);
          }
        });
      });

      // Add response times from assistance requests
      (assistanceData || []).forEach(item => {
        if (venueResponseTimes[item.venue_id]) {
          const created = new Date(item.created_at);
          const resolved = new Date(item.resolved_at);
          const responseTimeMs = resolved - created;
          if (responseTimeMs > 0) {
            venueResponseTimes[item.venue_id].push(responseTimeMs);
          }
        }
      });

      return Object.entries(venueResponseTimes).map(([venueId, responseTimes]) => {
        if (responseTimes.length === 0) {
          return {
            venueId,
            value: Infinity, // Sort venues with no data to the end
            displayValue: 'No data',
            responseCount: 0
          };
        }

        const avgMs = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
        const minutes = Math.round(avgMs / 60000);

        // Format display value
        let displayValue;
        if (minutes < 1) {
          displayValue = '< 1m';
        } else if (minutes < 60) {
          displayValue = `${minutes}m`;
        } else {
          const hours = Math.floor(minutes / 60);
          const remainingMins = minutes % 60;
          displayValue = remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
        }

        // Determine performance level (lower is better)
        let performanceLevel = 'Needs Improvement';
        let performanceColor = 'bg-red-500 text-white';

        if (minutes <= 5) {
          performanceLevel = 'Excellent';
          performanceColor = 'bg-green-500 text-white';
        } else if (minutes <= 15) {
          performanceLevel = 'Good';
          performanceColor = 'bg-blue-500 text-white';
        } else if (minutes <= 30) {
          performanceLevel = 'Fair';
          performanceColor = 'bg-yellow-500 text-gray-900';
        } else if (minutes <= 60) {
          performanceLevel = 'Slow';
          performanceColor = 'bg-orange-500 text-white';
        }

        return {
          venueId,
          value: avgMs, // Use milliseconds for sorting (ascending - faster is better)
          displayValue,
          responseCount: responseTimes.length,
          performanceLevel,
          performanceColor
        };
      });
    }
  },

  response_rate: {
    title: 'Response Rate',
    icon: Clock,
    fetchData: async (venueIds, dateRange) => {
      // Fetch all feedback sessions and check which have been responded to
      const { data } = await supabase
        .from('feedback')
        .select('session_id, venue_id, is_actioned, dismissed, resolved_by, resolved_at')
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

        if (total === 0) {
          return {
            venueId,
            value: 0,
            displayValue: 'No data',
            respondedCount: 0,
            totalCount: 0
          };
        }

        // A session has been responded to if any item has resolved_by or resolved_at
        const responded = sessionArray.filter(session =>
          session.some(item => item.resolved_by || item.resolved_at)
        ).length;

        const percentage = Math.round((responded / total) * 100);

        // Determine performance level
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
          respondedCount: responded,
          totalCount: total,
          performanceLevel,
          performanceColor,
          progressBarColor
        };
      });
    }
  },

  pending_feedback: {
    title: 'Pending Feedback',
    icon: Timer,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('session_id, venue_id, is_actioned, dismissed, resolved_at')
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

        // Pending = not all items resolved or dismissed
        const pending = sessionArray.filter(session =>
          !session.every(item => item.is_actioned === true || item.dismissed === true)
        ).length;

        const pendingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0;

        // Determine urgency level (lower pending is better)
        let urgencyLevel = 'Critical';
        let urgencyColor = 'bg-red-500 text-white';
        let progressBarColor = 'bg-red-500';

        if (pendingPercentage === 0) {
          urgencyLevel = 'All Clear';
          urgencyColor = 'bg-green-500 text-white';
          progressBarColor = 'bg-green-500';
        } else if (pendingPercentage <= 10) {
          urgencyLevel = 'Low';
          urgencyColor = 'bg-green-400 text-white';
          progressBarColor = 'bg-green-400';
        } else if (pendingPercentage <= 25) {
          urgencyLevel = 'Moderate';
          urgencyColor = 'bg-yellow-500 text-gray-900';
          progressBarColor = 'bg-yellow-500';
        } else if (pendingPercentage <= 50) {
          urgencyLevel = 'High';
          urgencyColor = 'bg-orange-500 text-white';
          progressBarColor = 'bg-orange-500';
        }

        return {
          venueId,
          value: pending,
          displayValue: pending.toString(),
          pendingCount: pending,
          totalCount: total,
          pendingPercentage,
          urgencyLevel,
          urgencyColor,
          progressBarColor
        };
      });
    }
  },

  staff_leaderboard: {
    title: 'Staff Leaderboard',
    icon: Trophy,
    fetchData: async (venueIds, dateRange) => {
      // Fetch both feedback sessions and assistance requests
      const [
        { data: feedbackData },
        { data: assistanceData }
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

      // Count resolutions per staff member across all venues
      const staffCounts = {};
      const staffVenues = {};

      // Process feedback sessions
      const processedSessions = new Set();
      (feedbackData || []).forEach(item => {
        const sessionKey = `${item.venue_id}-${item.session_id}`;
        if (!processedSessions.has(sessionKey)) {
          processedSessions.add(sessionKey);
          if (item.resolved_by) {
            staffCounts[item.resolved_by] = (staffCounts[item.resolved_by] || 0) + 1;
            if (!staffVenues[item.resolved_by]) staffVenues[item.resolved_by] = new Set();
            staffVenues[item.resolved_by].add(item.venue_id);
          }
        }
        if (item.co_resolver_id) {
          staffCounts[item.co_resolver_id] = (staffCounts[item.co_resolver_id] || 0) + 1;
          if (!staffVenues[item.co_resolver_id]) staffVenues[item.co_resolver_id] = new Set();
          staffVenues[item.co_resolver_id].add(item.venue_id);
        }
      });

      // Process assistance requests
      (assistanceData || []).forEach(request => {
        if (request.resolved_by) {
          staffCounts[request.resolved_by] = (staffCounts[request.resolved_by] || 0) + 1;
          if (!staffVenues[request.resolved_by]) staffVenues[request.resolved_by] = new Set();
          staffVenues[request.resolved_by].add(request.venue_id);
        }
      });

      // Get staff names
      const staffIds = Object.keys(staffCounts);
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', staffIds);

      const employeeMap = {};
      (employeeData || []).forEach(emp => {
        employeeMap[emp.id] = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown';
      });

      // Sort and get top 5
      const sortedStaff = Object.entries(staffCounts)
        .map(([id, count]) => ({
          staffId: id,
          name: employeeMap[id] || 'Unknown',
          count,
          venueCount: staffVenues[id]?.size || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const maxCount = sortedStaff.length > 0 ? sortedStaff[0].count : 1;

      // Return as venue-like format but it's actually staff leaderboard
      return sortedStaff.map((staff, index) => {
        let rankBadge = '';
        let rankColor = 'bg-gray-500 text-white';

        if (index === 0) {
          rankBadge = '1st';
          rankColor = 'bg-yellow-500 text-gray-900';
        } else if (index === 1) {
          rankBadge = '2nd';
          rankColor = 'bg-gray-300 text-gray-800';
        } else if (index === 2) {
          rankBadge = '3rd';
          rankColor = 'bg-orange-400 text-white';
        } else {
          rankBadge = `${index + 1}th`;
        }

        return {
          venueId: staff.staffId,
          venueName: staff.name,
          value: staff.count,
          displayValue: `${staff.count}`,
          rank: index + 1,
          rankBadge,
          rankColor,
          venueCount: staff.venueCount,
          relativePercentage: Math.round((staff.count / maxCount) * 100)
        };
      });
    }
  },

  recognition_count: {
    title: 'Staff Recognition Count',
    icon: Heart,
    fetchData: async (venueIds, dateRange) => {
      // Fetch feedback with staff recognition
      const { data } = await supabase
        .from('feedback')
        .select('venue_id, session_id, employee_id')
        .in('venue_id', venueIds)
        .not('employee_id', 'is', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Group by venue and count unique sessions with staff recognition
      const venueRecognitions = {};
      venueIds.forEach(id => venueRecognitions[id] = new Set());

      (data || []).forEach(item => {
        if (venueRecognitions[item.venue_id]) {
          venueRecognitions[item.venue_id].add(item.session_id);
        }
      });

      // Get max for relative comparison
      const counts = Object.values(venueRecognitions).map(s => s.size);
      const maxCount = Math.max(...counts, 1);

      return Object.entries(venueRecognitions).map(([venueId, sessions]) => {
        const count = sessions.size;
        const relativePercentage = Math.round((count / maxCount) * 100);

        // Determine recognition level
        let recognitionLevel = 'Low';
        let recognitionColor = 'bg-gray-400 text-white';

        if (count >= 50) {
          recognitionLevel = 'Excellent';
          recognitionColor = 'bg-pink-500 text-white';
        } else if (count >= 25) {
          recognitionLevel = 'Great';
          recognitionColor = 'bg-pink-400 text-white';
        } else if (count >= 10) {
          recognitionLevel = 'Good';
          recognitionColor = 'bg-blue-500 text-white';
        } else if (count >= 5) {
          recognitionLevel = 'Moderate';
          recognitionColor = 'bg-yellow-500 text-gray-900';
        }

        return {
          venueId,
          value: count,
          displayValue: count.toString(),
          recognitionCount: count,
          recognitionLevel,
          recognitionColor,
          relativePercentage
        };
      });
    }
  },

  feedback_by_venue: {
    title: 'Feedback by Venue',
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

      // Get max for relative comparison
      const counts = Object.values(venueStats).map(s => s.size);
      const maxCount = Math.max(...counts, 1);

      return Object.entries(venueStats).map(([venueId, sessions]) => {
        const count = sessions.size;
        const relativePercentage = Math.round((count / maxCount) * 100);

        // Determine volume level
        let volumeLevel = 'Low';
        let volumeColor = 'bg-gray-400 text-white';

        if (relativePercentage >= 75) {
          volumeLevel = 'Very High';
          volumeColor = 'bg-blue-600 text-white';
        } else if (relativePercentage >= 50) {
          volumeLevel = 'High';
          volumeColor = 'bg-blue-500 text-white';
        } else if (relativePercentage >= 25) {
          volumeLevel = 'Medium';
          volumeColor = 'bg-blue-400 text-white';
        } else if (count > 0) {
          volumeLevel = 'Low';
          volumeColor = 'bg-gray-500 text-white';
        }

        return {
          venueId,
          value: count,
          displayValue: count.toString(),
          feedbackCount: count,
          volumeLevel,
          volumeColor,
          relativePercentage
        };
      });
    }
  },

  top_performing_venue: {
    title: 'Top Performing Venue',
    icon: Trophy,
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

      // Calculate averages and sort
      const venueScores = Object.entries(venueRatings).map(([venueId, ratings]) => {
        const avg = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
          : null;
        return { venueId, avg, count: ratings.length };
      }).sort((a, b) => (b.avg || 0) - (a.avg || 0));

      const maxScore = venueScores.length > 0 && venueScores[0].avg ? venueScores[0].avg : 5;

      return venueScores.map((venue, index) => {
        let rankBadge = '';
        let rankColor = 'bg-gray-500 text-white';

        if (index === 0 && venue.avg) {
          rankBadge = '1st';
          rankColor = 'bg-yellow-500 text-gray-900';
        } else if (index === 1 && venue.avg) {
          rankBadge = '2nd';
          rankColor = 'bg-gray-300 text-gray-800';
        } else if (index === 2 && venue.avg) {
          rankBadge = '3rd';
          rankColor = 'bg-orange-400 text-white';
        } else if (venue.avg) {
          rankBadge = `${index + 1}th`;
        }

        return {
          venueId: venue.venueId,
          value: venue.avg || 0,
          displayValue: venue.avg ? `${venue.avg.toFixed(1)}/5` : 'No data',
          avgRating: venue.avg,
          totalResponses: venue.count,
          rank: index + 1,
          rankBadge,
          rankColor,
          relativePercentage: venue.avg ? Math.round((venue.avg / 5) * 100) : 0
        };
      });
    }
  },

  satisfaction_distribution: {
    title: 'Satisfaction Distribution',
    icon: BarChart3,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .not('rating', 'is', null);

      // Group by venue
      const venueDistributions = {};
      venueIds.forEach(id => venueDistributions[id] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      (data || []).forEach(item => {
        if (venueDistributions[item.venue_id] && item.rating >= 1 && item.rating <= 5) {
          venueDistributions[item.venue_id][item.rating]++;
        }
      });

      return Object.entries(venueDistributions).map(([venueId, distribution]) => {
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        const positiveCount = distribution[4] + distribution[5];
        const neutralCount = distribution[3];
        const negativeCount = distribution[1] + distribution[2];

        const positivePercent = total > 0 ? Math.round((positiveCount / total) * 100) : 0;
        const neutralPercent = total > 0 ? Math.round((neutralCount / total) * 100) : 0;
        const negativePercent = total > 0 ? Math.round((negativeCount / total) * 100) : 0;

        // Determine overall sentiment
        let sentiment = 'Neutral';
        let sentimentColor = 'bg-gray-500 text-white';

        if (positivePercent >= 70) {
          sentiment = 'Very Positive';
          sentimentColor = 'bg-green-500 text-white';
        } else if (positivePercent >= 50) {
          sentiment = 'Positive';
          sentimentColor = 'bg-green-400 text-white';
        } else if (negativePercent >= 50) {
          sentiment = 'Negative';
          sentimentColor = 'bg-red-500 text-white';
        } else if (negativePercent >= 30) {
          sentiment = 'Mixed';
          sentimentColor = 'bg-yellow-500 text-gray-900';
        }

        return {
          venueId,
          value: positivePercent,
          displayValue: total > 0 ? `${positivePercent}% positive` : 'No data',
          distribution,
          totalResponses: total,
          positivePercent,
          neutralPercent,
          negativePercent,
          sentiment,
          sentimentColor
        };
      });
    }
  },

  peak_hours: {
    title: 'Peak Feedback Hours',
    icon: Clock,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('venue_id, session_id, created_at')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Group by venue and hour
      const venueHours = {};
      venueIds.forEach(id => venueHours[id] = {});

      // Track unique sessions per hour
      const venueSessionsPerHour = {};
      venueIds.forEach(id => venueSessionsPerHour[id] = {});

      (data || []).forEach(item => {
        const hour = new Date(item.created_at).getHours();
        if (!venueSessionsPerHour[item.venue_id][hour]) {
          venueSessionsPerHour[item.venue_id][hour] = new Set();
        }
        venueSessionsPerHour[item.venue_id][hour].add(item.session_id);
      });

      // Convert sets to counts
      Object.entries(venueSessionsPerHour).forEach(([venueId, hours]) => {
        Object.entries(hours).forEach(([hour, sessions]) => {
          venueHours[venueId][hour] = sessions.size;
        });
      });

      return Object.entries(venueHours).map(([venueId, hours]) => {
        // Find peak hour
        let peakHour = null;
        let peakCount = 0;
        let totalFeedback = 0;

        Object.entries(hours).forEach(([hour, count]) => {
          totalFeedback += count;
          if (count > peakCount) {
            peakCount = count;
            peakHour = parseInt(hour);
          }
        });

        // Format hour for display
        const formatHour = (h) => {
          if (h === null) return 'No data';
          const period = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 || 12;
          return `${hour12}${period}`;
        };

        // Calculate busy level
        let busyLevel = 'Low';
        let busyColor = 'bg-gray-400 text-white';

        if (peakCount >= 20) {
          busyLevel = 'Very Busy';
          busyColor = 'bg-red-500 text-white';
        } else if (peakCount >= 10) {
          busyLevel = 'Busy';
          busyColor = 'bg-orange-500 text-white';
        } else if (peakCount >= 5) {
          busyLevel = 'Moderate';
          busyColor = 'bg-yellow-500 text-gray-900';
        } else if (peakCount > 0) {
          busyLevel = 'Light';
          busyColor = 'bg-green-500 text-white';
        }

        return {
          venueId,
          value: peakCount,
          displayValue: peakHour !== null ? `${formatHour(peakHour)}` : 'No data',
          peakHour,
          peakCount,
          totalFeedback,
          busyLevel,
          busyColor,
          hourlyData: hours
        };
      });
    }
  },

  day_comparison: {
    title: 'Day-by-Day Comparison',
    icon: Calendar,
    fetchData: async (venueIds, dateRange) => {
      const { data } = await supabase
        .from('feedback')
        .select('venue_id, session_id, created_at')
        .in('venue_id', venueIds)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Group by venue and day
      const venueDays = {};
      venueIds.forEach(id => venueDays[id] = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set() });

      (data || []).forEach(item => {
        const day = new Date(item.created_at).getDay();
        if (venueDays[item.venue_id]) {
          venueDays[item.venue_id][day].add(item.session_id);
        }
      });

      return Object.entries(venueDays).map(([venueId, days]) => {
        // Find busiest day
        let busiestDay = null;
        let busiestCount = 0;
        let totalFeedback = 0;

        Object.entries(days).forEach(([day, sessions]) => {
          const count = sessions.size;
          totalFeedback += count;
          if (count > busiestCount) {
            busiestCount = count;
            busiestDay = parseInt(day);
          }
        });

        // Calculate day distribution
        const dayDistribution = Object.entries(days).map(([day, sessions]) => ({
          day: parseInt(day),
          name: shortDays[parseInt(day)],
          count: sessions.size
        }));

        return {
          venueId,
          value: busiestCount,
          displayValue: busiestDay !== null ? dayNames[busiestDay] : 'No data',
          busiestDay,
          busiestDayName: busiestDay !== null ? dayNames[busiestDay] : null,
          busiestCount,
          totalFeedback,
          dayDistribution
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

        // Sort by value - ascending for response_time (faster is better), descending for others
        const sortedStats = stats.sort((a, b) => {
          if (metricType === 'response_time') {
            return a.value - b.value; // Ascending - faster times first
          }
          return b.value - a.value; // Descending - higher values first
        });

        // Calculate max value for relative progress bars (for best_staff)
        const maxResolutionCount = Math.max(...sortedStats.map(s => s.resolutionCount || s.value || 0), 1);

        // For response_time, we need min value (fastest) for inverted calculation
        const validResponseTimes = sortedStats.filter(s => s.value !== Infinity && s.value > 0).map(s => s.value);
        const minResponseTime = validResponseTimes.length > 0 ? Math.min(...validResponseTimes) : 1;
        const maxResponseTime = validResponseTimes.length > 0 ? Math.max(...validResponseTimes) : 1;

        // Add venue names and relative percentage
        const statsWithNames = sortedStats.map(stat => {
          const venue = allVenues.find(v => v.id === stat.venueId);

          // For response_time, invert the percentage so faster times = longer bars
          let relativePercentage;
          if (metricType === 'response_time') {
            if (stat.value === Infinity || stat.value === 0) {
              relativePercentage = 0;
            } else if (minResponseTime === maxResponseTime) {
              relativePercentage = 100; // All same time
            } else {
              // Invert: fastest (min) = 100%, slowest (max) = proportionally less
              relativePercentage = Math.round((minResponseTime / stat.value) * 100);
            }
          } else {
            relativePercentage = maxResolutionCount > 0
              ? Math.round(((stat.resolutionCount || stat.value || 0) / maxResolutionCount) * 100)
              : 0;
          }

          return {
            ...stat,
            venueName: venue?.name || 'Unknown Venue',
            relativePercentage
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 min-h-[320px]">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="flex gap-2">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border min-h-[320px] flex flex-col ${config.isComingSoon ? 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-900/20' : 'border-gray-100 dark:border-gray-800'}`}>
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
        <div className="flex-1 flex items-center justify-center text-center py-8">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">This report is coming soon!</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">We're working on bringing you this analytics feature.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {venueStats.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            venueStats.map((stat) => {
              // Special rendering for avg_satisfaction with progress bar
              if (metricType === 'avg_satisfaction') {
                // Rating is out of 5, convert to percentage for progress bar
                const satisfactionPercentage = stat.avgRating !== null ? Math.round((stat.avgRating / 5) * 100) : 0;
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        {stat.performanceLevel && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.performanceColor}`}>
                            {stat.performanceLevel}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${stat.progressBarColor} transition-all duration-500`}
                        style={{ width: `${satisfactionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.totalResponses > 0 ? `Based on ${stat.totalResponses} response${stat.totalResponses !== 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for venue_nps_comparison
              if (metricType === 'venue_nps_comparison') {
                // NPS ranges from -100 to +100, normalize to 0-100% for progress bar
                const npsPercentage = stat.npsScore !== null ? Math.round(((stat.npsScore + 100) / 200) * 100) : 0;
                // Determine bar color based on NPS category
                const npsBarColor = stat.npsColor?.includes('green') ? 'bg-green-500' :
                                   stat.npsColor?.includes('blue') ? 'bg-blue-500' :
                                   stat.npsColor?.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
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
                    {/* NPS Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${npsBarColor} transition-all duration-500`}
                        style={{ width: `${npsPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.totalResponses ? `Based on ${stat.totalResponses} response${stat.totalResponses !== 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for resolved_feedback with progress bar
              if (metricType === 'resolved_feedback') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        {stat.performanceLevel && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.performanceColor}`}>
                            {stat.performanceLevel}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${stat.progressBarColor} transition-all duration-500`}
                        style={{ width: `${stat.percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.resolvedCount} of {stat.totalCount} resolved ({stat.percentage}%)
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for best_staff with trophy styling
              if (metricType === 'best_staff') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-shrink min-w-0">{stat.venueName}</span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {stat.performanceLevel && (
                          <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${stat.performanceColor}`}>
                            {stat.performanceLevel}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {stat.staffName || 'No data'}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar relative to top performer */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${stat.performanceColor?.includes('green') ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${stat.relativePercentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.staffName ? `${stat.resolutionCount} resolution${stat.resolutionCount !== 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
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

              // Special rendering for response_time
              if (metricType === 'response_time') {
                // For response time, faster is better - invert the percentage
                // relativePercentage is based on fastest time = 100%, we want to show progress inversely
                const responseBarColor = stat.performanceColor?.includes('green') ? 'bg-green-500' :
                                        stat.performanceColor?.includes('blue') ? 'bg-blue-500' :
                                        stat.performanceColor?.includes('yellow') ? 'bg-yellow-500' :
                                        stat.performanceColor?.includes('orange') ? 'bg-orange-500' : 'bg-red-500';
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        {stat.performanceLevel && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.performanceColor}`}>
                            {stat.performanceLevel}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Progress bar - inverted so faster times show longer bars */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${responseBarColor} transition-all duration-500`}
                        style={{ width: `${stat.relativePercentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.responseCount > 0 ? `Based on ${stat.responseCount} resolved request${stat.responseCount !== 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for response_rate with progress bar
              if (metricType === 'response_rate') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        {stat.performanceLevel && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.performanceColor}`}>
                            {stat.performanceLevel}
                          </span>
                        )}
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
                        {stat.respondedCount} of {stat.totalCount} responded
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for pending_feedback
              if (metricType === 'pending_feedback') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${stat.urgencyColor}`}>
                          {stat.urgencyLevel}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Progress bar - shows pending percentage (inverted: less pending = better) */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${stat.progressBarColor} transition-all duration-500`}
                        style={{ width: `${stat.pendingPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.pendingCount} of {stat.totalCount} pending ({stat.pendingPercentage}%)
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for staff_leaderboard
              if (metricType === 'staff_leaderboard') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${stat.rankColor}`}>
                          {stat.rankBadge}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                    </div>
                    {/* Progress bar relative to top performer */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${stat.rank === 1 ? 'bg-yellow-500' : stat.rank === 2 ? 'bg-gray-400' : stat.rank === 3 ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${stat.relativePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.value} resolution{stat.value !== 1 ? 's' : ''} across {stat.venueCount} venue{stat.venueCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for recognition_count
              if (metricType === 'recognition_count') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${stat.recognitionColor}`}>
                          {stat.recognitionLevel}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-pink-500 transition-all duration-500"
                        style={{ width: `${stat.relativePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.recognitionCount} staff recognition{stat.recognitionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for feedback_by_venue
              if (metricType === 'feedback_by_venue') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${stat.volumeColor}`}>
                          {stat.volumeLevel}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${stat.relativePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.feedbackCount} feedback session{stat.feedbackCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for top_performing_venue
              if (metricType === 'top_performing_venue') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {stat.rankBadge && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.rankColor}`}>
                            {stat.rankBadge}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${stat.rank === 1 ? 'bg-yellow-500' : stat.rank === 2 ? 'bg-gray-400' : stat.rank === 3 ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${stat.relativePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.totalResponses > 0 ? `Based on ${stat.totalResponses} response${stat.totalResponses !== 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for satisfaction_distribution
              if (metricType === 'satisfaction_distribution') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${stat.sentimentColor}`}>
                          {stat.sentiment}
                        </span>
                      </div>
                    </div>
                    {/* Stacked progress bar for distribution */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${stat.positivePercent}%` }}
                      ></div>
                      <div
                        className="h-full bg-gray-400 transition-all duration-500"
                        style={{ width: `${stat.neutralPercent}%` }}
                      ></div>
                      <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: `${stat.negativePercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.totalResponses > 0 ? `${stat.positivePercent}% positive, ${stat.neutralPercent}% neutral, ${stat.negativePercent}% negative` : 'No data'}
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for peak_hours
              if (metricType === 'peak_hours') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${stat.busyColor}`}>
                          {stat.busyLevel}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.peakCount > 0 ? `${stat.peakCount} feedback during peak hour` : ''}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.totalFeedback} total
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for day_comparison
              if (metricType === 'day_comparison') {
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-500 text-white">
                          Busiest
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.displayValue}</span>
                      </div>
                    </div>
                    {/* Mini day distribution */}
                    <div className="flex gap-1 mt-2">
                      {stat.dayDistribution?.map(day => {
                        const maxDayCount = Math.max(...(stat.dayDistribution?.map(d => d.count) || [1]), 1);
                        const height = day.count > 0 ? Math.max(20, Math.round((day.count / maxDayCount) * 100)) : 10;
                        return (
                          <div key={day.day} className="flex-1 flex flex-col items-center">
                            <div
                              className={`w-full rounded-t ${day.day === stat.busiestDay ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                              style={{ height: `${height}%`, minHeight: '4px', maxHeight: '24px' }}
                            ></div>
                            <span className="text-[10px] text-gray-400 mt-1">{day.name}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.busiestCount > 0 ? `${stat.busiestCount} on ${stat.busiestDayName}` : ''}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.totalFeedback} total
                      </span>
                    </div>
                  </div>
                );
              }

              // Special rendering for google_rating
              if (metricType === 'google_rating') {
                const ratingPercentage = stat.currentRating ? Math.round((stat.currentRating / 5) * 100) : 0;
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        {stat.hasData && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.trendColor}`}>
                            {stat.trendIcon} {stat.trendLevel}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {stat.hasData ? stat.displayValue : 'No data'}
                        </span>
                      </div>
                    </div>
                    {stat.hasData && (
                      <>
                        {/* Progress bar showing current rating */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${ratingPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Current: {stat.currentRating?.toFixed(1)}/5
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            From: {stat.previousRating?.toFixed(1)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              }

              // Special rendering for tripadvisor_rating
              if (metricType === 'tripadvisor_rating') {
                const ratingPercentage = stat.currentRating ? Math.round((stat.currentRating / 5) * 100) : 0;
                return (
                  <div
                    key={stat.venueId}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.venueName}</span>
                      <div className="flex items-center gap-2">
                        {stat.hasData && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${stat.trendColor}`}>
                            {stat.trendIcon} {stat.trendLevel}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {stat.hasData ? stat.displayValue : 'No data'}
                        </span>
                      </div>
                    </div>
                    {stat.hasData && (
                      <>
                        {/* Progress bar showing current rating */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${ratingPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Current: {stat.currentRating?.toFixed(1)}/5
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            From: {stat.previousRating?.toFixed(1)}
                          </span>
                        </div>
                      </>
                    )}
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
