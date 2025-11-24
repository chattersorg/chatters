import React, { useState } from 'react';
import {
  X, BarChart3, ThumbsUp, Star, AlertTriangle, Award, PieChart, MessageSquare,
  TrendingUp, TrendingDown, Clock, Users, Building2, Target, Zap,
  Activity, Calendar, CheckCircle, XCircle, Timer, DollarSign,
  UserCheck, Trophy, Heart, Frown, Smile, Meh, Filter, MapPin
} from 'lucide-react';

const AVAILABLE_METRICS = [
  // NPS & Satisfaction Metrics
  {
    value: 'nps_chart',
    label: 'NPS Score Chart',
    description: 'Net Promoter Score with breakdown by category (configurable)',
    icon: PieChart,
    category: 'NPS & Satisfaction'
  },
  {
    value: 'nps_trend',
    label: 'NPS Trend Over Time',
    description: 'Track NPS score changes across selected time period',
    icon: TrendingUp,
    category: 'NPS & Satisfaction'
  },
  {
    value: 'venue_nps_comparison',
    label: 'Venue NPS Comparison',
    description: 'Compare NPS scores across multiple venues',
    icon: Building2,
    category: 'NPS & Satisfaction'
  },
  {
    value: 'avg_satisfaction',
    label: 'Average Satisfaction Score',
    description: 'Average rating across all feedback for selected venues',
    icon: Star,
    category: 'NPS & Satisfaction'
  },
  {
    value: 'satisfaction_distribution',
    label: 'Satisfaction Distribution',
    description: 'Breakdown of ratings (1-5 stars) across venues',
    icon: BarChart3,
    category: 'NPS & Satisfaction'
  },

  // Feedback Volume & Response
  {
    value: 'total_feedback',
    label: 'Total Feedback Count',
    description: 'Number of feedback sessions for selected venues',
    icon: MessageSquare,
    category: 'Feedback Volume'
  },
  {
    value: 'feedback_chart',
    label: 'Overall Feedback Chart',
    description: 'Comprehensive feedback metrics with multiple chart views',
    icon: BarChart3,
    category: 'Feedback Volume'
  },
  {
    value: 'feedback_by_venue',
    label: 'Feedback by Venue',
    description: 'Compare total feedback volume across venues',
    icon: Building2,
    category: 'Feedback Volume'
  },
  {
    value: 'feedback_trend',
    label: 'Feedback Trend',
    description: 'Track feedback volume over time',
    icon: TrendingUp,
    category: 'Feedback Volume'
  },
  {
    value: 'response_time',
    label: 'Average Response Time',
    description: 'How quickly staff resolve feedback',
    icon: Clock,
    category: 'Feedback Volume'
  },
  {
    value: 'response_rate',
    label: 'Response Rate',
    description: 'Percentage of feedback that received a response',
    icon: CheckCircle,
    category: 'Feedback Volume'
  },

  // Resolution & Actions
  {
    value: 'resolved_feedback',
    label: 'Total Resolved Feedback',
    description: 'Feedback sessions that have been actioned',
    icon: ThumbsUp,
    category: 'Resolution'
  },
  {
    value: 'resolution_rate',
    label: 'Resolution Rate',
    description: 'Percentage of feedback marked as resolved',
    icon: Target,
    category: 'Resolution'
  },
  {
    value: 'resolution_by_venue',
    label: 'Resolution by Venue',
    description: 'Compare resolution rates across venues',
    icon: Building2,
    category: 'Resolution'
  },
  {
    value: 'unresolved_alerts',
    label: 'Unresolved Alerts',
    description: 'Urgent feedback & assistance requiring immediate attention',
    icon: AlertTriangle,
    category: 'Resolution'
  },
  {
    value: 'pending_feedback',
    label: 'Pending Feedback',
    description: 'Feedback awaiting action or response',
    icon: Timer,
    category: 'Resolution'
  },

  // Staff Performance
  {
    value: 'best_staff',
    label: 'Top Staff Member',
    description: 'Staff member with most resolutions',
    icon: Award,
    category: 'Staff Performance'
  },
  {
    value: 'staff_leaderboard',
    label: 'Staff Leaderboard',
    description: 'Top 5 staff members by resolution count',
    icon: Trophy,
    category: 'Staff Performance'
  },
  {
    value: 'staff_by_venue',
    label: 'Staff Performance by Venue',
    description: 'Compare staff activity across venues',
    icon: UserCheck,
    category: 'Staff Performance'
  },
  {
    value: 'recognition_count',
    label: 'Staff Recognition Count',
    description: 'Number of positive staff mentions',
    icon: Heart,
    category: 'Staff Performance'
  },
  {
    value: 'avg_staff_rating',
    label: 'Average Staff Rating',
    description: 'Overall staff performance rating',
    icon: Star,
    category: 'Staff Performance'
  },

  // Venue Performance
  {
    value: 'venue_comparison',
    label: 'Multi-Venue Overview',
    description: 'Side-by-side performance comparison of all venues',
    icon: Building2,
    category: 'Venue Performance'
  },
  {
    value: 'top_performing_venue',
    label: 'Top Performing Venue',
    description: 'Venue with highest satisfaction score',
    icon: Trophy,
    category: 'Venue Performance'
  },
  {
    value: 'venue_trend_comparison',
    label: 'Venue Trend Comparison',
    description: 'Compare performance trends across venues over time',
    icon: TrendingUp,
    category: 'Venue Performance'
  },
  {
    value: 'venue_activity',
    label: 'Venue Activity Heatmap',
    description: 'Visual representation of feedback volume by venue',
    icon: Activity,
    category: 'Venue Performance'
  },

  // Time-Based Analytics
  {
    value: 'peak_hours',
    label: 'Peak Feedback Hours',
    description: 'Busiest times for customer feedback',
    icon: Clock,
    category: 'Time Analytics'
  },
  {
    value: 'day_comparison',
    label: 'Day-by-Day Comparison',
    description: 'Compare performance across days of the week',
    icon: Calendar,
    category: 'Time Analytics'
  },
  {
    value: 'hourly_breakdown',
    label: 'Hourly Breakdown',
    description: 'Feedback and satisfaction by hour',
    icon: Activity,
    category: 'Time Analytics'
  },

  // Sentiment & Issues
  {
    value: 'sentiment_analysis',
    label: 'Sentiment Analysis',
    description: 'Breakdown of positive, neutral, and negative feedback',
    icon: Smile,
    category: 'Sentiment'
  },
  {
    value: 'top_issues',
    label: 'Top Issues',
    description: 'Most common feedback topics or complaints',
    icon: Filter,
    category: 'Sentiment'
  },
  {
    value: 'improvement_areas',
    label: 'Areas for Improvement',
    description: 'Venues or categories needing attention',
    icon: Target,
    category: 'Sentiment'
  },
  {
    value: 'positive_highlights',
    label: 'Positive Highlights',
    description: 'Most praised aspects across venues',
    icon: ThumbsUp,
    category: 'Sentiment'
  },

  // External Reviews
  {
    value: 'google_rating',
    label: 'Google Rating',
    description: 'Current Google review rating for selected venue',
    icon: Star,
    category: 'External Reviews'
  },
  {
    value: 'tripadvisor_rating',
    label: 'TripAdvisor Rating',
    description: 'Current TripAdvisor review rating for selected venue',
    icon: Star,
    category: 'External Reviews'
  },
  {
    value: 'review_comparison',
    label: 'External Review Comparison',
    description: 'Compare Google & TripAdvisor ratings across venues',
    icon: BarChart3,
    category: 'External Reviews'
  }
];

const MetricSelectorModal = ({ isOpen, onClose, onSelect, currentMetric = null, existingMetrics = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState(currentMetric);
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedMetric) {
      onSelect(selectedMetric);
      onClose();
    }
  };

  // Group metrics by category
  const categories = ['all', ...new Set(AVAILABLE_METRICS.map(m => m.category))];

  const filteredMetrics = selectedCategory === 'all'
    ? AVAILABLE_METRICS
    : AVAILABLE_METRICS.filter(m => m.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {currentMetric ? 'Change Metric' : 'Add Metric'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select a report tile to add to your dashboard
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat === 'all' ? 'All Reports' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Metric List */}
          <div className="space-y-2 mb-6 max-h-[500px] overflow-y-auto">
            {filteredMetrics.map((metric) => {
              const Icon = metric.icon;
              const isSelected = selectedMetric === metric.value;

              return (
                <button
                  key={metric.value}
                  onClick={() => setSelectedMetric(metric.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {metric.label}
                      </h3>
                      <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                        {metric.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedMetric}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedMetric
                  ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              {currentMetric ? 'Update Metric' : 'Add Metric'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricSelectorModal;
