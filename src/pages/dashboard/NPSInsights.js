import React, { useState, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { usePermissions } from '../../context/PermissionsContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import ModernCard from '../../components/dashboard/layout/ModernCard';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const NPSInsights = () => {
  usePageTitle('NPS Insights');
  const { venueId } = useVenue();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [npsGoal, setNpsGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [showAllDrivers, setShowAllDrivers] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!venueId) return;
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch venue to get current NPS goal
      const { data: venueData } = await supabase
        .from('venues')
        .select('nps_goal')
        .eq('id', venueId)
        .single();

      if (venueData?.nps_goal !== undefined) {
        setNpsGoal(venueData.nps_goal);
        setGoalInput(venueData.nps_goal?.toString() || '');
      }

      // Fetch all NPS data for this venue (last 6 months for prediction)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: npsData, error: npsError } = await supabase
        .from('nps_submissions')
        .select('*')
        .eq('venue_id', venueId)
        .gte('responded_at', sixMonthsAgo.toISOString())
        .order('responded_at', { ascending: true });

      if (npsError) throw npsError;

      const responses = (npsData || []).filter(s => s.score !== null);

      if (responses.length === 0) {
        setInsights(null);
        return;
      }

      // Calculate current NPS
      const promoters = responses.filter(s => s.score >= 9).length;
      const detractors = responses.filter(s => s.score <= 6).length;
      const currentNPS = Math.round(((promoters - detractors) / responses.length) * 100);

      // Calculate monthly NPS for prediction
      const monthlyNPS = calculateMonthlyNPS(responses);
      const prediction = calculatePrediction(monthlyNPS);

      // Analyze experience drivers from ALL responses with feedback
      const responsesWithFeedback = responses.filter(s => s.feedback);
      const experienceDrivers = analyzeExperienceDrivers(responsesWithFeedback);

      setInsights({
        currentNPS,
        totalResponses: responses.length,
        monthlyNPS,
        prediction,
        experienceDrivers,
        feedbackCount: responsesWithFeedback.length
      });
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error loading NPS insights:', err);
      setError('Failed to load NPS insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyNPS = (responses) => {
    const byMonth = {};

    responses.forEach(r => {
      if (!r.responded_at) return;
      const date = new Date(r.responded_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { promoters: 0, detractors: 0, total: 0 };
      }
      byMonth[monthKey].total++;
      if (r.score >= 9) byMonth[monthKey].promoters++;
      if (r.score <= 6) byMonth[monthKey].detractors++;
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthLabel: formatMonthLabel(month),
        nps: data.total > 0 ? Math.round(((data.promoters - data.detractors) / data.total) * 100) : 0,
        responses: data.total
      }));
  };

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  const calculatePrediction = (monthlyNPS) => {
    // Need at least 3 months of data for prediction
    if (monthlyNPS.length < 3) {
      return { canPredict: false, reason: 'Need at least 3 months of data' };
    }

    // Use last 3-6 months for trend calculation
    const recentMonths = monthlyNPS.slice(-6);

    // Simple linear regression
    const n = recentMonths.length;
    const xMean = (n - 1) / 2;
    const yMean = recentMonths.reduce((sum, m) => sum + m.nps, 0) / n;

    let numerator = 0;
    let denominator = 0;

    recentMonths.forEach((m, i) => {
      numerator += (i - xMean) * (m.nps - yMean);
      denominator += (i - xMean) ** 2;
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const monthlyChange = Math.round(slope * 10) / 10;

    // Predict 60 days forward (approximately 2 months)
    const currentNPS = recentMonths[recentMonths.length - 1].nps;
    const predictedNPS = Math.round(currentNPS + (slope * 2));

    // Clamp prediction to valid NPS range
    const clampedPrediction = Math.max(-100, Math.min(100, predictedNPS));

    // Calculate variance for confidence
    const variance = recentMonths.reduce((sum, m) => sum + (m.nps - yMean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const confidence = stdDev < 10 ? 'high' : stdDev < 25 ? 'medium' : 'low';

    return {
      canPredict: true,
      currentNPS,
      predictedNPS: clampedPrediction,
      monthlyChange,
      trend: monthlyChange > 0.5 ? 'improving' : monthlyChange < -0.5 ? 'declining' : 'stable',
      confidence
    };
  };

  // Analyze experience drivers - correlate themes with NPS scores
  const analyzeExperienceDrivers = (responsesWithFeedback) => {
    const themeKeywords = {
      'Wait Time': ['wait', 'slow', 'long', 'delayed', 'forever', 'ages', 'minutes', 'hour', 'quickly', 'fast'],
      'Service': ['service', 'staff', 'rude', 'attentive', 'ignored', 'unfriendly', 'attitude', 'waiter', 'waitress', 'friendly', 'helpful', 'polite'],
      'Food Quality': ['food', 'cold', 'taste', 'portion', 'quality', 'bland', 'overcooked', 'undercooked', 'stale', 'delicious', 'fresh', 'amazing'],
      'Price': ['price', 'expensive', 'value', 'cost', 'overpriced', 'money', 'worth', 'cheap', 'affordable'],
      'Cleanliness': ['clean', 'dirty', 'hygiene', 'mess', 'filthy', 'sticky', 'toilet', 'bathroom', 'spotless', 'tidy'],
      'Atmosphere': ['loud', 'noise', 'quiet', 'atmosphere', 'music', 'crowded', 'hot', 'cold', 'dark', 'cosy', 'ambient', 'vibe']
    };

    // Calculate overall average score for comparison
    const allScores = responsesWithFeedback.map(r => r.score);
    const overallAvgScore = allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
      : 0;

    const drivers = [];

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      // Find all responses mentioning this theme
      const matchingResponses = responsesWithFeedback.filter(r => {
        if (!r.feedback) return false;
        const lowerText = r.feedback.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
      });

      if (matchingResponses.length >= 3) { // Need at least 3 mentions for meaningful data
        const themeScores = matchingResponses.map(r => r.score);
        const avgScore = themeScores.reduce((sum, s) => sum + s, 0) / themeScores.length;

        // Calculate impact: difference from overall average
        const impact = avgScore - overallAvgScore;

        // Calculate what % of detractors mention this theme
        const detractorMentions = matchingResponses.filter(r => r.score <= 6).length;
        const totalDetractors = responsesWithFeedback.filter(r => r.score <= 6).length;
        const detractorShare = totalDetractors > 0 ? Math.round((detractorMentions / totalDetractors) * 100) : 0;

        drivers.push({
          theme,
          mentions: matchingResponses.length,
          avgScore: Math.round(avgScore * 10) / 10,
          impact: Math.round(impact * 10) / 10,
          isPositive: impact > 0,
          detractorShare
        });
      }
    });

    // Sort by absolute impact (most impactful first)
    return drivers
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 6);
  };

  const handleSaveGoal = async () => {
    const goalValue = parseInt(goalInput);
    if (isNaN(goalValue) || goalValue < -100 || goalValue > 100) {
      toast.error('Goal must be between -100 and 100');
      return;
    }

    setSavingGoal(true);
    try {
      const { error: saveError } = await supabase
        .from('venues')
        .update({ nps_goal: goalValue })
        .eq('id', venueId);

      if (saveError) throw saveError;

      setNpsGoal(goalValue);
      setEditingGoal(false);
      toast.success('NPS goal saved');
    } catch (err) {
      console.error('Error saving NPS goal:', err);
      toast.error('Failed to save goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleClearGoal = async () => {
    setSavingGoal(true);
    try {
      const { error: clearError } = await supabase
        .from('venues')
        .update({ nps_goal: null })
        .eq('id', venueId);

      if (clearError) throw clearError;

      setNpsGoal(null);
      setGoalInput('');
      setEditingGoal(false);
      toast.success('NPS goal cleared');
    } catch (err) {
      console.error('Error clearing NPS goal:', err);
      toast.error('Failed to clear goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const getNPSColorClass = (score) => {
    if (score === null) return 'text-gray-400';
    if (score >= 50) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getBenchmarkTier = (score) => {
    if (score >= 70) return { label: 'Excellent', tier: 'Top 10%' };
    if (score >= 50) return { label: 'Great', tier: 'Top 25%' };
    if (score >= 30) return { label: 'Good', tier: 'Above Average' };
    if (score >= 0) return { label: 'Fair', tier: 'Average' };
    return { label: 'Needs Work', tier: 'Below Average' };
  };

  // Format time ago for freshness indicator
  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return 'Updated today';
  };

  // Generate daily insight - the key intelligence
  const getDailyInsight = () => {
    if (!insights) return null;

    const negativeDriver = insights.experienceDrivers.find(d => !d.isPositive);
    const hasGoal = npsGoal !== null;
    const prediction = insights.prediction;

    // Priority 1: Off track with identifiable cause
    if (hasGoal && prediction.canPredict && prediction.monthlyChange <= 0 && negativeDriver) {
      return `${negativeDriver.theme} complaints are impacting your score, putting your NPS goal at risk.`;
    }

    // Priority 2: Declining trend with cause
    if (prediction.canPredict && prediction.trend === 'declining' && negativeDriver) {
      return `Your NPS is declining. ${negativeDriver.theme} is the primary driver — customers mentioning it score ${Math.abs(negativeDriver.impact).toFixed(1)} points lower.`;
    }

    // Priority 3: Below benchmark with cause
    if (insights.currentNPS < 30 && negativeDriver) {
      return `You're below industry average (+30). Addressing ${negativeDriver.theme.toLowerCase()} could close the gap.`;
    }

    // Priority 4: Positive momentum
    if (prediction.canPredict && prediction.trend === 'improving') {
      const positiveDriver = insights.experienceDrivers.find(d => d.isPositive);
      if (positiveDriver) {
        return `Your NPS is improving. ${positiveDriver.theme} is a strength — keep it up.`;
      }
      return `Your NPS is trending upward at ${prediction.monthlyChange > 0 ? '+' : ''}${prediction.monthlyChange} points per month.`;
    }

    // Priority 5: Stable with insight
    if (negativeDriver && negativeDriver.detractorShare >= 25) {
      return `${negativeDriver.detractorShare}% of detractor feedback mentions ${negativeDriver.theme.toLowerCase()}. This is your biggest opportunity.`;
    }

    return null;
  };

  // Get trajectory status
  const getTrajectoryStatus = () => {
    if (!insights) return null;

    const hasGoal = npsGoal !== null;
    const prediction = insights.prediction;

    if (!hasGoal) {
      if (!prediction.canPredict) return { status: 'no-data', label: 'Insufficient data' };
      return {
        status: prediction.trend,
        label: prediction.trend === 'improving' ? 'Improving' : prediction.trend === 'declining' ? 'Declining' : 'Stable'
      };
    }

    const pointsAway = npsGoal - insights.currentNPS;

    if (pointsAway <= 0) {
      return { status: 'achieved', label: 'Goal achieved' };
    }

    if (!prediction.canPredict) {
      return { status: 'unknown', label: `${pointsAway} points to goal` };
    }

    if (prediction.monthlyChange > 0) {
      const monthsToGoal = Math.ceil(pointsAway / prediction.monthlyChange);
      return { status: 'on-track', label: `On track · ~${monthsToGoal} months to goal` };
    }

    return { status: 'off-track', label: `Off track · ${pointsAway} points behind` };
  };

  if (!venueId) return null;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Predictions, goals, and experience drivers</p>
        </div>
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">{error}</p>
          <button
            onClick={loadInsights}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Predictions, goals, and experience drivers</p>
        </div>
        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Predictions, goals, and experience drivers</p>
        </div>
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No NPS data yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
            Once customers respond to NPS surveys, you'll see predictions and insights here.
          </p>
        </div>
      </div>
    );
  }

  const benchmark = getBenchmarkTier(insights.currentNPS);
  const dailyInsight = getDailyInsight();
  const trajectoryStatus = getTrajectoryStatus();
  const negativeDrivers = insights.experienceDrivers.filter(d => !d.isPositive);
  const topActions = negativeDrivers.slice(0, 3);
  const displayedDrivers = showAllDrivers ? insights.experienceDrivers : insights.experienceDrivers.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Insights</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Predictions, goals, and experience drivers</p>
      </div>

      {/* Daily Insight - The Intelligence Layer */}
      {dailyInsight && (
        <div className="py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-white">Current Insight:</span>{' '}
              {dailyInsight}
            </p>
            {lastUpdated && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {getTimeAgo(lastUpdated)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions to Increase NPS */}
      {topActions.length > 0 && (
        <ModernCard padding="p-6" shadow="shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Actions to Increase NPS
          </h3>
          <div className="space-y-4">
            {topActions.map((action, index) => (
              <div key={action.theme} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Address {action.theme.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {action.detractorShare > 0
                        ? `${action.detractorShare}% of detractors mention this`
                        : `${action.mentions} mentions · ${action.impact.toFixed(1)} pts impact`
                      }
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  +{Math.round(Math.abs(action.impact) * 1.5)}–{Math.round(Math.abs(action.impact) * 2.5)} pts
                </span>
              </div>
            ))}
          </div>
        </ModernCard>
      )}

      {/* Two Column Layout - Trajectory & Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trajectory Card - Combined Goal & Prediction */}
        <ModernCard padding="p-6" shadow="shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trajectory</h3>
            {hasPermission('nps.set_goal') && !editingGoal && (
              <button
                onClick={() => setEditingGoal(true)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
              >
                {npsGoal !== null ? 'Edit goal' : 'Set goal'}
              </button>
            )}
          </div>

          {editingGoal ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target NPS Score
                </label>
                <input
                  type="number"
                  min="-100"
                  max="100"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  placeholder="-100 to 100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveGoal}
                  disabled={savingGoal}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {savingGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
                <button
                  onClick={() => { setEditingGoal(false); setGoalInput(npsGoal?.toString() || ''); }}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                {npsGoal !== null && (
                  <button
                    onClick={handleClearGoal}
                    disabled={savingGoal}
                    className="text-sm text-gray-400 hover:text-rose-600 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score display - more compact */}
              <div className="flex items-start gap-6">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</div>
                  <div className={`text-3xl font-bold ${getNPSColorClass(insights.currentNPS)}`}>
                    {insights.currentNPS >= 0 ? '+' : ''}{insights.currentNPS}
                  </div>
                  <div className="text-xs text-transparent mt-0.5">&nbsp;</div>
                </div>

                {insights.prediction.canPredict && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">60-day forecast</div>
                    <div className={`text-3xl font-bold ${getNPSColorClass(insights.prediction.predictedNPS)}`}>
                      {insights.prediction.predictedNPS >= 0 ? '+' : ''}{insights.prediction.predictedNPS}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {insights.prediction.confidence === 'high'
                        ? 'High confidence'
                        : insights.prediction.confidence === 'medium'
                        ? 'Medium confidence'
                        : 'Low confidence'
                      }
                    </div>
                  </div>
                )}

                {npsGoal !== null && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Goal</div>
                    <div className="text-3xl font-bold text-gray-300 dark:text-gray-600">
                      {npsGoal >= 0 ? '+' : ''}{npsGoal}
                    </div>
                    <div className="text-xs text-transparent mt-0.5">&nbsp;</div>
                  </div>
                )}
              </div>

              {/* Status line */}
              {trajectoryStatus && (
                <div className="flex items-center gap-2 flex-wrap">
                  {trajectoryStatus.status === 'improving' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                  {trajectoryStatus.status === 'declining' && <TrendingDown className="w-4 h-4 text-amber-500" />}
                  {trajectoryStatus.status === 'on-track' && <Check className="w-4 h-4 text-emerald-500" />}
                  {trajectoryStatus.status === 'achieved' && <Check className="w-4 h-4 text-emerald-500" />}
                  {trajectoryStatus.status === 'off-track' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span className={`text-sm font-medium ${
                    trajectoryStatus.status === 'achieved' || trajectoryStatus.status === 'on-track' || trajectoryStatus.status === 'improving'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : trajectoryStatus.status === 'off-track' || trajectoryStatus.status === 'declining'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {trajectoryStatus.label}
                  </span>
                  {insights.prediction.canPredict && (
                    <span className="text-sm text-gray-400">
                      · {insights.prediction.monthlyChange > 0 ? '+' : ''}{insights.prediction.monthlyChange}/month
                    </span>
                  )}
                </div>
              )}

              {/* Narrative sentence */}
              {insights.prediction.canPredict && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {insights.prediction.trend === 'improving'
                    ? `At the current pace, you're adding about ${insights.prediction.monthlyChange} points per month.`
                    : insights.prediction.trend === 'declining'
                    ? `Your NPS has been declining at about ${Math.abs(insights.prediction.monthlyChange)} points per month.`
                    : `Your NPS has held steady over the past few months.`
                  }
                </p>
              )}
            </div>
          )}
        </ModernCard>

        {/* Benchmark */}
        <ModernCard padding="p-6" shadow="shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Industry Benchmark
          </h3>

          <div className="mb-4">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {benchmark.label}
            </span>
            <span className="text-sm text-gray-500 ml-2">· {benchmark.tier}</span>
          </div>

          {/* Simplified scale */}
          <div className="relative mb-2">
            <div className="h-2 bg-gradient-to-r from-rose-300 via-amber-300 to-emerald-300 rounded-full" />
            <div
              className="absolute top-1/2 w-3 h-3 bg-gray-900 dark:bg-white rounded-full -translate-y-1/2 -translate-x-1/2 ring-2 ring-white dark:ring-gray-900"
              style={{ left: `${((insights.currentNPS + 100) / 200) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>-100</span>
            <span>Industry avg (+30)</span>
            <span>+100</span>
          </div>

          <p className="text-xs text-gray-400">
            Based on 14,200+ hospitality venue responses
          </p>
        </ModernCard>
      </div>

      {/* Experience Drivers - Full Width */}
      <ModernCard padding="p-6" shadow="shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Experience Drivers
          </h3>
          <span className="text-xs text-gray-400">{insights.feedbackCount} analysed</span>
        </div>

        {insights.experienceDrivers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedDrivers.map((driver) => (
              <div key={driver.theme} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {driver.theme}
                  </span>
                  <p className="text-xs text-gray-500">
                    {driver.isPositive
                      ? `+${Math.abs(driver.impact).toFixed(1)} pts on average`
                      : `${driver.impact.toFixed(1)} pts on average`
                    }
                  </p>
                </div>
                <span className={`text-sm font-semibold ${driver.isPositive ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                  {driver.isPositive ? '+' : ''}{driver.impact.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">Not enough feedback to analyse themes</p>
            <p className="text-xs text-gray-400 mt-1">Need at least 3 mentions per theme</p>
          </div>
        )}

        {insights.experienceDrivers.length > 3 && (
          <button
            onClick={() => setShowAllDrivers(!showAllDrivers)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium mt-4"
          >
            {showAllDrivers ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                View all {insights.experienceDrivers.length} drivers
              </>
            )}
          </button>
        )}
      </ModernCard>
    </div>
  );
};

export default NPSInsights;
