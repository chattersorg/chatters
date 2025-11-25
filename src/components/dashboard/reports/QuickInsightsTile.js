import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, ThumbsUp } from 'lucide-react';
import { supabase } from '../../../utils/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const QuickInsightsTile = ({ venueId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;

    const generateInsights = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfDay);

        // Fetch today's and yesterday's data
        const { data: todayFeedback } = await supabase
          .from('feedback')
          .select('rating, is_actioned, dismissed, session_id')
          .eq('venue_id', venueId)
          .gte('created_at', startOfDay.toISOString());

        const { data: yesterdayFeedback } = await supabase
          .from('feedback')
          .select('rating, is_actioned, dismissed, session_id')
          .eq('venue_id', venueId)
          .gte('created_at', startOfYesterday.toISOString())
          .lt('created_at', endOfYesterday.toISOString());

        const { data: unresolvedAlerts } = await supabase
          .from('assistance_requests')
          .select('id, created_at')
          .eq('venue_id', venueId)
          .neq('status', 'resolved')
          .is('resolved_at', null)
          .gte('created_at', startOfDay.toISOString());

        const generatedInsights = [];

        // Calculate metrics
        const todayRatings = (todayFeedback || []).map(f => f.rating).filter(r => r >= 1 && r <= 5);
        const yesterdayRatings = (yesterdayFeedback || []).map(f => f.rating).filter(r => r >= 1 && r <= 5);

        const todayAvg = todayRatings.length > 0
          ? todayRatings.reduce((a, b) => a + b, 0) / todayRatings.length
          : 0;
        const yesterdayAvg = yesterdayRatings.length > 0
          ? yesterdayRatings.reduce((a, b) => a + b, 0) / yesterdayRatings.length
          : 0;

        // Group feedback by session
        const todaySessions = {};
        (todayFeedback || []).forEach(f => {
          if (!todaySessions[f.session_id]) todaySessions[f.session_id] = [];
          todaySessions[f.session_id].push(f);
        });

        const yesterdaySessions = {};
        (yesterdayFeedback || []).forEach(f => {
          if (!yesterdaySessions[f.session_id]) yesterdaySessions[f.session_id] = [];
          yesterdaySessions[f.session_id].push(f);
        });

        const todaySessionCount = Object.keys(todaySessions).length;
        const yesterdaySessionCount = Object.keys(yesterdaySessions).length;

        const unresolvedCount = unresolvedAlerts?.length || 0;
        const lowRatings = todayRatings.filter(r => r < 3).length;

        // Insight 1: Satisfaction trend
        if (todayAvg > 0 && yesterdayAvg > 0) {
          const diff = todayAvg - yesterdayAvg;
          if (diff > 0.3) {
            generatedInsights.push({
              icon: ThumbsUp,
              type: 'positive',
              text: `Customer satisfaction is up ${diff.toFixed(1)} stars today! Keep up the great work.`
            });
          } else if (diff < -0.3) {
            generatedInsights.push({
              icon: AlertTriangle,
              type: 'warning',
              text: `Customer satisfaction has dropped ${Math.abs(diff).toFixed(1)} stars. Review recent feedback for improvement areas.`
            });
          }
        }

        // Insight 2: Unresolved alerts
        if (unresolvedCount > 0) {
          generatedInsights.push({
            icon: AlertTriangle,
            type: 'warning',
            text: `You have ${unresolvedCount} unresolved alert${unresolvedCount > 1 ? 's' : ''}. Address these promptly to maintain service quality.`
          });
        }

        // Insight 3: Feedback volume
        if (todaySessionCount > yesterdaySessionCount && yesterdaySessionCount > 0) {
          const increase = ((todaySessionCount - yesterdaySessionCount) / yesterdaySessionCount * 100).toFixed(0);
          generatedInsights.push({
            icon: TrendingUp,
            type: 'positive',
            text: `Feedback volume is up ${increase}% today. More customers are engaging with your service.`
          });
        }

        // Insight 4: Low ratings action
        if (lowRatings > 0) {
          generatedInsights.push({
            icon: AlertTriangle,
            type: 'warning',
            text: `${lowRatings} customer${lowRatings > 1 ? 's have' : ' has'} left low ratings today. Reach out to prevent negative reviews.`
          });
        }

        // Insight 5: All clear
        if (generatedInsights.length === 0 && todaySessionCount > 0) {
          generatedInsights.push({
            icon: ThumbsUp,
            type: 'positive',
            text: `Everything looks good! Your customers are happy and all feedback is being addressed.`
          });
        }

        // Default insight if no activity
        if (generatedInsights.length === 0) {
          generatedInsights.push({
            icon: Lightbulb,
            type: 'neutral',
            text: `No feedback yet today. Share your QR code with customers to start collecting insights.`
          });
        }

        setInsights(generatedInsights.slice(0, 3)); // Show max 3 insights
      } catch (error) {
        console.error('Error generating insights:', error);
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, [venueId]);

  const getIconColor = (type) => {
    switch (type) {
      case 'positive':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Quick Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getBackgroundColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor(insight.type)}`} />
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickInsightsTile;
