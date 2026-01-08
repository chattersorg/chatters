import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import ModernCard from '../../components/dashboard/layout/ModernCard';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import VenueSelectorFilter from '../../components/ui/VenueSelectorFilter';
import {
  Building2, TrendingUp, TrendingDown, MessageSquare, Star,
  AlertCircle, ThumbsUp, Target, ChevronRight,
  RefreshCw, ChevronDown, Minus, Loader2
} from 'lucide-react';

const OverviewDetails = () => {
  usePageTitle('Portfolio Overview');
  const navigate = useNavigate();
  const { allVenues, setCurrentVenue } = useVenue();
  const [venueStats, setVenueStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({ preset: 'last30' });
  const [selectedVenueIds, setSelectedVenueIds] = useState([]);

  // Section collapse state
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [performersCollapsed, setPerformersCollapsed] = useState(false);
  const [venuesCollapsed, setVenuesCollapsed] = useState(false);

  // Initialize with all venue IDs selected
  useEffect(() => {
    if (allVenues?.length > 0 && selectedVenueIds.length === 0) {
      setSelectedVenueIds(allVenues.map(v => v.id));
    }
  }, [allVenues, selectedVenueIds.length]);

  // Convert dateRange to days for query
  const getDaysFromDateRange = useCallback(() => {
    if (dateRange.preset === 'custom' && dateRange.from && dateRange.to) {
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      return { from, to };
    }

    const to = new Date();
    const from = new Date();

    switch (dateRange.preset) {
      case 'last7':
        from.setDate(from.getDate() - 7);
        break;
      case 'last14':
        from.setDate(from.getDate() - 14);
        break;
      case 'last30':
        from.setDate(from.getDate() - 30);
        break;
      case 'all':
        from.setFullYear(from.getFullYear() - 10);
        break;
      default:
        from.setDate(from.getDate() - 30);
    }

    return { from, to };
  }, [dateRange]);

  // Fetch comprehensive stats for all venues
  const fetchVenueStats = useCallback(async () => {
    if (selectedVenueIds.length === 0) return;

    const stats = {};
    const { from: daysAgo, to: endDate } = getDaysFromDateRange();

    try {
      const venueIds = selectedVenueIds;

      // Fetch NPS submissions
      const { data: npsData } = await supabase
        .from('nps_submissions')
        .select('venue_id, score, created_at')
        .in('venue_id', venueIds)
        .gte('created_at', daysAgo.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('venue_id, rating, additional_feedback, created_at')
        .in('venue_id', venueIds)
        .gte('created_at', daysAgo.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch AI insights (most recent per venue)
      const { data: aiInsights } = await supabase
        .from('ai_insights')
        .select('venue_id, ai_score, week_start, strengths, areas_for_improvement')
        .in('venue_id', venueIds)
        .order('week_start', { ascending: false });

      // Fetch assistance requests
      const { data: assistanceData } = await supabase
        .from('assistance_requests')
        .select('venue_id, created_at, resolved_at')
        .in('venue_id', venueIds)
        .gte('created_at', daysAgo.toISOString())
        .lte('created_at', endDate.toISOString());

      // Process data for each venue
      for (const venueId of venueIds) {
        const venue = allVenues.find(v => v.id === venueId);
        if (!venue) continue;

        // NPS calculations
        const venueNPS = (npsData || []).filter(n => n.venue_id === venueId);
        const npsScores = venueNPS.map(s => s.score).filter(s => s !== null);
        let nps = null;
        let promoters = 0;
        let passives = 0;
        let detractors = 0;

        if (npsScores.length > 0) {
          promoters = npsScores.filter(s => s >= 9).length;
          passives = npsScores.filter(s => s >= 7 && s <= 8).length;
          detractors = npsScores.filter(s => s <= 6).length;
          nps = Math.round(((promoters - detractors) / npsScores.length) * 100);
        }

        // Feedback calculations
        const venueFeedback = (feedbackData || []).filter(f => f.venue_id === venueId);
        const ratings = venueFeedback.map(f => f.rating).filter(r => r !== null);
        const avgRating = ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : null;
        const feedbackWithComments = venueFeedback.filter(f => f.additional_feedback?.trim()).length;

        // Rating distribution
        const rating5 = ratings.filter(r => r === 5).length;
        const rating4 = ratings.filter(r => r === 4).length;
        const rating3 = ratings.filter(r => r === 3).length;
        const rating2 = ratings.filter(r => r === 2).length;
        const rating1 = ratings.filter(r => r === 1).length;

        // AI score (most recent)
        const venueAI = (aiInsights || []).find(a => a.venue_id === venueId);

        // Assistance stats
        const venueAssistance = (assistanceData || []).filter(a => a.venue_id === venueId);
        const resolvedCount = venueAssistance.filter(a => a.resolved_at).length;
        const pendingCount = venueAssistance.filter(a => !a.resolved_at).length;

        // Calculate trends (compare first half vs second half of period)
        const midPoint = new Date(daysAgo.getTime() + (endDate.getTime() - daysAgo.getTime()) / 2);

        const firstHalfFeedback = venueFeedback.filter(f => new Date(f.created_at) < midPoint);
        const secondHalfFeedback = venueFeedback.filter(f => new Date(f.created_at) >= midPoint);

        const firstHalfAvg = firstHalfFeedback.length > 0
          ? firstHalfFeedback.reduce((a, f) => a + (f.rating || 0), 0) / firstHalfFeedback.length
          : null;
        const secondHalfAvg = secondHalfFeedback.length > 0
          ? secondHalfFeedback.reduce((a, f) => a + (f.rating || 0), 0) / secondHalfFeedback.length
          : null;

        let trend = null;
        if (firstHalfAvg && secondHalfAvg) {
          const diff = secondHalfAvg - firstHalfAvg;
          if (diff > 0.1) trend = 'up';
          else if (diff < -0.1) trend = 'down';
          else trend = 'stable';
        }

        stats[venueId] = {
          name: venue.name,
          nps,
          npsCount: npsScores.length,
          promoters,
          passives,
          detractors,
          avgRating: avgRating ? parseFloat(avgRating) : null,
          feedbackCount: venueFeedback.length,
          feedbackWithComments,
          ratingDistribution: { 5: rating5, 4: rating4, 3: rating3, 2: rating2, 1: rating1 },
          aiScore: venueAI?.ai_score || null,
          strengthsCount: venueAI?.strengths?.length || 0,
          areasCount: venueAI?.areas_for_improvement?.length || 0,
          resolvedRequests: resolvedCount,
          pendingRequests: pendingCount,
          trend
        };
      }

      setVenueStats(stats);
    } catch (error) {
      console.error('Error fetching venue stats:', error);
    }
  }, [selectedVenueIds, getDaysFromDateRange, allVenues]);

  useEffect(() => {
    if (selectedVenueIds.length > 0) {
      setLoading(true);
      fetchVenueStats().finally(() => setLoading(false));
    }
  }, [fetchVenueStats, selectedVenueIds.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVenueStats();
    setRefreshing(false);
  };

  // Calculate portfolio-wide stats
  const portfolioStats = useMemo(() => {
    const venues = Object.values(venueStats);
    if (venues.length === 0) return null;

    const venuesWithNPS = venues.filter(v => v.nps !== null);
    const venuesWithRating = venues.filter(v => v.avgRating !== null);
    const venuesWithAI = venues.filter(v => v.aiScore !== null);

    const avgNPS = venuesWithNPS.length > 0
      ? Math.round(venuesWithNPS.reduce((a, v) => a + v.nps, 0) / venuesWithNPS.length)
      : null;

    const avgRating = venuesWithRating.length > 0
      ? (venuesWithRating.reduce((a, v) => a + v.avgRating, 0) / venuesWithRating.length).toFixed(1)
      : null;

    const avgAIScore = venuesWithAI.length > 0
      ? (venuesWithAI.reduce((a, v) => a + v.aiScore, 0) / venuesWithAI.length).toFixed(1)
      : null;

    const totalFeedback = venues.reduce((a, v) => a + v.feedbackCount, 0);
    const totalNPS = venues.reduce((a, v) => a + v.npsCount, 0);

    // Find top and bottom performers
    const sortedByNPS = [...venuesWithNPS].sort((a, b) => b.nps - a.nps);
    const sortedByRating = [...venuesWithRating].sort((a, b) => b.avgRating - a.avgRating);

    return {
      avgNPS,
      avgRating: avgRating ? parseFloat(avgRating) : null,
      avgAIScore: avgAIScore ? parseFloat(avgAIScore) : null,
      totalFeedback,
      totalNPS,
      venueCount: venues.length,
      topNPS: sortedByNPS[0] || null,
      bottomNPS: sortedByNPS[sortedByNPS.length - 1] || null,
      topRating: sortedByRating[0] || null,
      bottomRating: sortedByRating[sortedByRating.length - 1] || null
    };
  }, [venueStats]);

  // Helper functions
  const getNPSColor = (nps) => {
    if (nps === null) return 'text-gray-400 dark:text-gray-500';
    if (nps >= 50) return 'text-emerald-600 dark:text-emerald-400';
    if (nps >= 0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getNPSBgColor = (nps) => {
    if (nps === null) return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    if (nps >= 50) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    if (nps >= 0) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
  };

  const getRatingColor = (rating) => {
    if (rating === null) return 'text-gray-400 dark:text-gray-500';
    if (rating >= 4) return 'text-emerald-600 dark:text-emerald-400';
    if (rating >= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getAIScoreColor = (score) => {
    if (score === null) return 'text-gray-400 dark:text-gray-500';
    if (score >= 7) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const handleVenueClick = (venueId) => {
    setCurrentVenue(venueId);
    navigate('/dashboard');
  };

  // Get selected venues text for subtitle
  const getSelectedVenuesText = () => {
    if (selectedVenueIds.length === allVenues?.length) {
      return 'all venues';
    }
    if (selectedVenueIds.length === 1) {
      const venue = allVenues?.find(v => v.id === selectedVenueIds[0]);
      return venue?.name || '1 venue';
    }
    return `${selectedVenueIds.length} venues`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Performance across {getSelectedVenuesText()}
            </p>
          </div>
          <VenueSelectorFilter
            venues={allVenues || []}
            selectedVenueIds={selectedVenueIds}
            onChange={setSelectedVenueIds}
          />
        </div>

        {/* Loading skeleton */}
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  const sortedVenues = Object.entries(venueStats)
    .sort(([, a], [, b]) => {
      if (a.nps !== null && b.nps !== null) return b.nps - a.nps;
      if (a.nps !== null) return -1;
      if (b.nps !== null) return 1;
      return b.feedbackCount - a.feedbackCount;
    });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Performance across {getSelectedVenuesText()}
          </p>
        </div>

        <VenueSelectorFilter
          venues={allVenues || []}
          selectedVenueIds={selectedVenueIds}
          onChange={setSelectedVenueIds}
        />
      </div>

      {/* Portfolio Summary Section */}
      {portfolioStats && (
        <div>
          <div className="flex items-center justify-between h-10 mb-4">
            <button
              onClick={() => setSummaryCollapsed(!summaryCollapsed)}
              className="flex items-center gap-2 text-left group"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform duration-200 ${
                  summaryCollapsed ? '-rotate-90' : ''
                }`}
              />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                Summary
              </h2>
            </button>
            {!summaryCollapsed && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <DateRangeFilter
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
            )}
          </div>

          {!summaryCollapsed && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Total Venues */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Venues</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolioStats.venueCount}
                </div>
              </ModernCard>

              {/* Total Feedback */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Feedback</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolioStats.totalFeedback}
                </div>
              </ModernCard>

              {/* Total NPS */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">NPS Responses</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolioStats.totalNPS}
                </div>
              </ModernCard>

              {/* Average NPS */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg NPS</p>
                <div className={`text-2xl font-bold ${getNPSColor(portfolioStats.avgNPS)}`}>
                  {portfolioStats.avgNPS !== null ? (portfolioStats.avgNPS >= 0 ? `+${portfolioStats.avgNPS}` : portfolioStats.avgNPS) : '—'}
                </div>
              </ModernCard>

              {/* Average Rating */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Rating</p>
                <div className={`text-2xl font-bold ${getRatingColor(portfolioStats.avgRating)}`}>
                  {portfolioStats.avgRating !== null ? `${portfolioStats.avgRating}/5` : '—'}
                </div>
              </ModernCard>

              {/* Average AI Score */}
              <ModernCard padding="p-4" shadow="shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg AI Score</p>
                <div className={`text-2xl font-bold ${getAIScoreColor(portfolioStats.avgAIScore)}`}>
                  {portfolioStats.avgAIScore !== null ? `${portfolioStats.avgAIScore}/10` : '—'}
                </div>
              </ModernCard>
            </div>
          )}
        </div>
      )}

      {/* Top & Bottom Performers Section */}
      {portfolioStats && (portfolioStats.topNPS || portfolioStats.topRating) && (
        <div>
          <div className="flex items-center justify-between h-10 mb-4">
            <button
              onClick={() => setPerformersCollapsed(!performersCollapsed)}
              className="flex items-center gap-2 text-left group"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform duration-200 ${
                  performersCollapsed ? '-rotate-90' : ''
                }`}
              />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                Performance Highlights
              </h2>
            </button>
          </div>

          {!performersCollapsed && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <ModernCard padding="p-0" shadow="shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-emerald-50 dark:bg-emerald-900/10 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top Performers</h3>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {portfolioStats.topNPS && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Highest NPS</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{portfolioStats.topNPS.name}</div>
                      </div>
                      <div className={`text-xl font-bold ${getNPSColor(portfolioStats.topNPS.nps)}`}>
                        {portfolioStats.topNPS.nps >= 0 ? `+${portfolioStats.topNPS.nps}` : portfolioStats.topNPS.nps}
                      </div>
                    </div>
                  )}
                  {portfolioStats.topRating && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Highest Rating</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{portfolioStats.topRating.name}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className={`text-xl font-bold ${getRatingColor(portfolioStats.topRating.avgRating)}`}>
                          {portfolioStats.topRating.avgRating}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </ModernCard>

              {/* Needs Attention */}
              <ModernCard padding="p-0" shadow="shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/10 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Needs Attention</h3>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {portfolioStats.bottomNPS && portfolioStats.bottomNPS.name !== portfolioStats.topNPS?.name && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lowest NPS</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{portfolioStats.bottomNPS.name}</div>
                      </div>
                      <div className={`text-xl font-bold ${getNPSColor(portfolioStats.bottomNPS.nps)}`}>
                        {portfolioStats.bottomNPS.nps >= 0 ? `+${portfolioStats.bottomNPS.nps}` : portfolioStats.bottomNPS.nps}
                      </div>
                    </div>
                  )}
                  {portfolioStats.bottomRating && portfolioStats.bottomRating.name !== portfolioStats.topRating?.name && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lowest Rating</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{portfolioStats.bottomRating.name}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className={`text-xl font-bold ${getRatingColor(portfolioStats.bottomRating.avgRating)}`}>
                          {portfolioStats.bottomRating.avgRating}
                        </span>
                      </div>
                    </div>
                  )}
                  {(!portfolioStats.bottomNPS || portfolioStats.bottomNPS.name === portfolioStats.topNPS?.name) &&
                   (!portfolioStats.bottomRating || portfolioStats.bottomRating.name === portfolioStats.topRating?.name) && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      All venues performing well!
                    </div>
                  )}
                </div>
              </ModernCard>
            </div>
          )}
        </div>
      )}

      {/* All Venues Section */}
      <div>
        <div className="flex items-center justify-between h-10 mb-4">
          <button
            onClick={() => setVenuesCollapsed(!venuesCollapsed)}
            className="flex items-center gap-2 text-left group"
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform duration-200 ${
                venuesCollapsed ? '-rotate-90' : ''
              }`}
            />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
              All Venues
            </h2>
            <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {sortedVenues.length}
            </span>
          </button>
        </div>

        {!venuesCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedVenues.map(([venueId, stats]) => (
              <ModernCard
                key={venueId}
                padding="p-5"
                shadow="shadow-sm"
                className="hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer group"
                onClick={() => handleVenueClick(venueId)}
              >
                {/* Venue Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {stats.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {stats.trend === 'up' && (
                        <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          Improving
                        </span>
                      )}
                      {stats.trend === 'down' && (
                        <span className="inline-flex items-center text-xs text-rose-600 dark:text-rose-400">
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                          Declining
                        </span>
                      )}
                      {stats.trend === 'stable' && (
                        <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Minus className="w-3 h-3 mr-0.5" />
                          Stable
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* NPS */}
                  <div className={`rounded-lg p-3 border ${getNPSBgColor(stats.nps)}`}>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NPS</div>
                    <div className={`text-xl font-bold ${getNPSColor(stats.nps)}`}>
                      {stats.nps !== null ? (stats.nps >= 0 ? `+${stats.nps}` : stats.nps) : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{stats.npsCount} resp.</div>
                  </div>

                  {/* Rating */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rating</div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className={`text-xl font-bold ${getRatingColor(stats.avgRating)}`}>
                        {stats.avgRating !== null ? stats.avgRating : '—'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{stats.feedbackCount} reviews</div>
                  </div>

                  {/* AI Score */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">AI Score</div>
                    <div className={`text-xl font-bold ${getAIScoreColor(stats.aiScore)}`}>
                      {stats.aiScore !== null ? stats.aiScore : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">/10</div>
                  </div>
                </div>

                {/* Rating Distribution Mini Bar */}
                {stats.feedbackCount > 0 && (
                  <div className="mb-3">
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats.ratingDistribution[rating] || 0;
                        const pct = stats.feedbackCount > 0 ? (count / stats.feedbackCount) * 100 : 0;
                        const colors = {
                          5: 'bg-emerald-500',
                          4: 'bg-emerald-400',
                          3: 'bg-amber-500',
                          2: 'bg-orange-500',
                          1: 'bg-rose-500'
                        };
                        return pct > 0 ? (
                          <div
                            key={rating}
                            className={`${colors[rating]}`}
                            style={{ width: `${pct}%` }}
                            title={`${rating}★: ${count} (${Math.round(pct)}%)`}
                          />
                        ) : null;
                      })}
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{stats.ratingDistribution[5] || 0} × 5★</span>
                      <span>{stats.ratingDistribution[1] || 0} × 1★</span>
                    </div>
                  </div>
                )}

                {/* Bottom Stats Row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {stats.feedbackWithComments} comments
                    </span>
                    {stats.pendingRequests > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        {stats.pendingRequests} pending
                      </span>
                    )}
                  </div>
                  {stats.nps !== null && (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {stats.promoters}P / {stats.passives}N / {stats.detractors}D
                    </div>
                  )}
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {sortedVenues.length === 0 && (
        <ModernCard padding="p-12" shadow="shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Venues Found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm">
              You don't have access to any venues yet. Contact your administrator to get access.
            </p>
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default OverviewDetails;
