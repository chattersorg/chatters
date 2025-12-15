// QuickMetricsTab.js - At-a-glance summary metrics

import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  LayoutGrid,
  TrendingUp
} from 'lucide-react';
import MetricCard from './MetricCard';

const QuickMetricsTab = ({
  totalCount,
  actionedCount,
  alertsCount,
  recentCount,
  uniqueTables,
  averageRating
}) => {
  return (
    <div className="max-w-none">
      <div className="mb-6">
        <h2 className="text-base lg:text-lg font-medium text-gray-900 mb-1">Quick Metrics</h2>
        <p className="text-sm text-gray-600">
          At-a-glance summary of key feedback statistics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <MetricCard 
          title="Total Feedback Sessions" 
          value={totalCount} 
          icon={BarChart3} 
          description="All customer feedback received"
          variant="info"
        />
        <MetricCard 
          title="Sessions Actioned" 
          value={actionedCount} 
          icon={CheckCircle} 
          description="Feedback that has been addressed"
          variant="success"
        />
        <MetricCard 
          title="Unresolved Alerts" 
          value={alertsCount} 
          icon={AlertTriangle} 
          description="Low scores requiring attention"
          variant={alertsCount > 0 ? "danger" : "default"}
        />
        <MetricCard 
          title="Feedback This Week" 
          value={recentCount} 
          icon={CalendarClock} 
          description="Recent customer responses"
          variant="default"
        />
        <MetricCard 
          title="Tables Participated" 
          value={uniqueTables.length} 
          icon={LayoutGrid} 
          description="Different table locations"
          variant="default"
        />
        <MetricCard 
          title="Avg. Satisfaction" 
          value={averageRating} 
          icon={TrendingUp} 
          description="Overall rating (1-5 scale)"
          variant={parseFloat(averageRating) >= 4 ? "success" : parseFloat(averageRating) >= 3 ? "warning" : "danger"}
        />
      </div>
    </div>
  );
};

export default QuickMetricsTab;