import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MessageSquare, HandHeart, CheckCircle, AlertTriangle, Star } from 'lucide-react';

const ActivityItem = ({ icon: Icon, title, description, timestamp, status, rating }) => {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800'
  };

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${iconColors[status] || iconColors.neutral}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{description}</p>

            {rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-amber-500 fill-current" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{rating}/5 rating</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
            {status && status !== 'neutral' && (
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${statusColors[status]}`}>
                {status === 'success' ? 'Resolved' :
                 status === 'warning' ? 'In Progress' :
                 status === 'error' ? 'Urgent' :
                 status === 'info' ? 'New' : 'Active'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentActivity = ({ activities, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>

        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Transform different activity types into consistent format
  const normalizedActivities = (activities || []).map(activity => {
    // Handle feedback sessions
    if (activity.additional_feedback || activity.rating) {
      return {
        icon: MessageSquare,
        title: `Customer feedback from Table ${activity.table_number || 'Unknown'}`,
        description: activity.additional_feedback || 'Rating submitted',
        timestamp: formatTime(activity.created_at),
        status: activity.rating >= 4 ? 'success' : 
                activity.rating >= 3 ? 'warning' : 'error',
        rating: activity.rating
      };
    }
    
    // Handle assistance requests
    if (activity.table_number) {
      return {
        icon: HandHeart,
        title: `Assistance request from Table ${activity.table_number}`,
        description: activity.resolved_at ? 'Request resolved' : 
                    activity.acknowledged_at ? 'Request acknowledged' : 'Waiting for response',
        timestamp: formatTime(activity.created_at),
        status: activity.resolved_at ? 'success' : 
                activity.acknowledged_at ? 'warning' : 'error'
      };
    }
    
    // Default format
    return {
      icon: Clock,
      title: activity.title || 'System Activity',
      description: activity.description || 'Activity recorded',
      timestamp: formatTime(activity.created_at),
      status: activity.status || 'neutral'
    };
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        <Link to="/feedback/all" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
          View All
        </Link>
      </div>

      {normalizedActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-0 -mx-4">
          {normalizedActivities.slice(0, 5).map((activity, index) => (
            <ActivityItem
              key={index}
              icon={activity.icon}
              title={activity.title}
              description={activity.description}
              timestamp={activity.timestamp}
              status={activity.status}
              rating={activity.rating}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;