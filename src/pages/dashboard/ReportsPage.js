// ReportsPage.js - Refactored with tabbed interface like SettingsPage

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';

// Import main reports component
import FeedbackTab from '../../components/dashboard/reports/FeedbackTab';

const ReportsPage = () => {
  usePageTitle('Reports');
  const navigate = useNavigate();
  const { venueId } = useVenue();
  
  // Simplified - removed internal tab logic
  
  // Data state
  const [feedbackSessions, setFeedbackSessions] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [dateFilter, setDateFilter] = useState('last14');

  useEffect(() => {
    if (!venueId) return;
    fetchData(venueId);
    setupRealtime(venueId);
  }, [venueId]);

  const fetchData = async (venueId) => {
    // Fetch feedback sessions
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('*')
      .eq('venue_id', venueId);

    const grouped = {};
    for (const row of feedbackData || []) {
      if (!grouped[row.session_id]) grouped[row.session_id] = [];
      grouped[row.session_id].push(row);
    }

    const sessions = Object.values(grouped).map(items => ({
      type: 'feedback',
      isActioned: items.every(i => i.is_actioned),
      createdAt: items[0].created_at,
      table: items[0].table_number,
      items,
      lowScore: items.some(i => i.rating !== null && i.rating <= 2)
    }));

    // Fetch assistance requests
    const { data: assistanceData } = await supabase
      .from('assistance_requests')
      .select('*')
      .eq('venue_id', venueId);

    const assistanceRequests = (assistanceData || []).map(request => ({
      type: 'assistance',
      isActioned: request.status === 'resolved' || request.acknowledged_at !== null,
      createdAt: request.created_at,
      table: request.table_number,
      items: [], // No rating items for assistance requests
      lowScore: false
    }));

    setFeedbackSessions(sessions);
    setAssistanceRequests(assistanceRequests);
  };

  const setupRealtime = (venueId) => {
    supabase.channel('feedback-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feedback',
        filter: `venue_id=eq.${venueId}`
      }, () => fetchData(venueId))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'assistance_requests',
        filter: `venue_id=eq.${venueId}`
      }, () => fetchData(venueId))
      .subscribe();
  };

  // Calculate derived data
  const allSessions = [...feedbackSessions, ...assistanceRequests];
  const actionedCount = feedbackSessions.filter(s => s.isActioned).length;
  const totalCount = feedbackSessions.length;
  const alertsCount = feedbackSessions.filter(s => s.lowScore && !s.isActioned).length;
  const recentCount = allSessions.filter(s => new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const uniqueTables = [...new Set(allSessions.map(s => s.table))];
  const completionRate = totalCount > 0 ? ((actionedCount / totalCount) * 100).toFixed(1) : 0;

  const allRatings = feedbackSessions.flatMap(session => session.items?.map(i => i.rating).filter(r => r !== null && r >= 1 && r <= 5) || []);
  const averageRating = allRatings.length > 0 ? (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(2) : 'N/A';

  const getDailySatisfactionTrend = (sessions) => {
    const dayMap = {};
    sessions.forEach(session => {
      const date = new Date(session.createdAt);
      const key = date.toISOString().split('T')[0];
      const ratings = session.items?.map(i => i.rating).filter(r => r !== null && r >= 1 && r <= 5) || [];
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(...ratings);
    });

    return Object.entries(dayMap).map(([day, ratings]) => {
      const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 0;
      return { day, average: parseFloat(avg) };
    });
  };

  const satisfactionTrend = getDailySatisfactionTrend(feedbackSessions);

  // Removed navigation items - using dedicated routes now

  // Props to pass to tab components
  const tabProps = {
    venueId,
    feedbackSessions,
    assistanceRequests,
    allSessions,
    actionedCount,
    totalCount,
    alertsCount,
    recentCount,
    uniqueTables,
    completionRate,
    averageRating,
    satisfactionTrend,
    allRatings,
    dateFilter,
    setDateFilter,
  };

  // Removed renderActiveTab - using dedicated routes now

  if (!venueId) {
    return null;
  }

  return (
    <div className="w-full">
      <ChartCard
        title="Feedback Overview"
        subtitle="Daily breakdown of feedback received, ratings, and action completion rates"
        actions={
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last14">Last 14 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="all">All-time</option>
            </select>
          </div>
        }
      >
        <FeedbackTab {...tabProps} />
      </ChartCard>
    </div>
  );
};

export default ReportsPage;