import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import PageContainer from '../../components/dashboard/layout/PageContainer';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const StaffMemberDetails = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { venueId } = useVenue();
  
  const [staffMember, setStaffMember] = useState(null);
  const [resolvedFeedback, setResolvedFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [totalStats, setTotalStats] = useState({
    feedbackResolved: 0,
    feedbackCoResolved: 0,
    assistanceResolved: 0,
    totalResolved: 0
  });
  
  const [detailedAnalytics, setDetailedAnalytics] = useState({
    averageResolutionTime: 0,
    averageRating: 0,
    totalRatings: 0,
    quickestResolution: null,
    slowestResolution: null,
    resolutionsByDay: [],
    resolutionsByHour: [],
    performanceTrend: [],
    workloadDistribution: {
      feedback: 0,
      assistance: 0
    },
    ratingDistribution: {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    },
    monthlyPerformance: [],
    responseTimeCategories: {
      under5min: 0,
      under15min: 0,
      under1hour: 0,
      over1hour: 0
    }
  });

  usePageTitle(staffMember ? `${staffMember.name} - Resolved Feedback` : 'Staff Details');

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today.toISOString(), end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() };
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek.toISOString(), end: new Date().toISOString() };
      }
      case 'last7':
        return { start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() };
      case 'last30':
        return { start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() };
      case 'last90':
        return { start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() };
      case 'all':
      default:
        return { start: null, end: new Date().toISOString() };
    }
  };

  const fetchStaffMemberDetails = async () => {
    setLoading(true);
    
    try {
      // Get staff member info
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, email, phone, created_at')
        .eq('id', staffId)
        .single();

      if (employeeError || !employeeData) {
        console.error('Error fetching staff member:', employeeError);
        return;
      }

      const staffInfo = {
        id: employeeData.id,
        name: `${employeeData.first_name} ${employeeData.last_name}`,
        role: employeeData.role,
        email: employeeData.email,
        phone: employeeData.phone,
        joinedDate: employeeData.created_at
      };

      setStaffMember(staffInfo);

      // Get resolved feedback and assistance requests
      await fetchResolvedItems(staffId);

    } catch (error) {
      console.error('Error loading staff member details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResolvedItems = async (employeeId) => {
    const { start: fromDate } = getDateRange(timeFilter);

    // Fetch feedback sessions where employee is main resolver
    let feedbackQuery = supabase
      .from('feedback')
      .select(`
        session_id,
        resolved_by,
        resolved_at,
        rating,
        additional_feedback,
        table_number,
        created_at,
        venue_id,
        venues!inner (name)
      `)
      .eq('venue_id', venueId)
      .eq('resolved_by', employeeId)
      .not('resolved_by', 'is', null);

    if (fromDate) feedbackQuery = feedbackQuery.gte('resolved_at', fromDate);

    // Fetch feedback sessions where employee is co-resolver
    let coResolvedQuery = supabase
      .from('feedback')
      .select(`
        session_id,
        co_resolver_id,
        resolved_at,
        rating,
        additional_feedback,
        table_number,
        created_at,
        venue_id,
        venues!inner (name)
      `)
      .eq('venue_id', venueId)
      .eq('co_resolver_id', employeeId)
      .not('co_resolver_id', 'is', null);

    if (fromDate) coResolvedQuery = coResolvedQuery.gte('resolved_at', fromDate);

    // Fetch resolved assistance requests
    let assistanceQuery = supabase
      .from('assistance_requests')
      .select(`
        id,
        resolved_by,
        resolved_at,
        message,
        table_number,
        created_at,
        venue_id,
        venues!inner (name)
      `)
      .eq('venue_id', venueId)
      .eq('resolved_by', employeeId)
      .not('resolved_by', 'is', null);

    if (fromDate) assistanceQuery = assistanceQuery.gte('resolved_at', fromDate);

    const [
      { data: feedbackData, error: feedbackError },
      { data: coResolvedData, error: coResolvedError },
      { data: assistanceData, error: assistanceError }
    ] = await Promise.all([feedbackQuery, coResolvedQuery, assistanceQuery]);

    if (feedbackError || coResolvedError || assistanceError) {
      console.error('Error fetching resolved items:', feedbackError || coResolvedError || assistanceError);
      return;
    }

    // Combine and format the data
    const combinedData = [];

    // Process feedback sessions where employee is main resolver (group by session_id to avoid duplicates)
    if (feedbackData?.length) {
      const sessionMap = {};
      feedbackData.forEach(item => {
        if (item.session_id && !sessionMap[item.session_id]) {
          sessionMap[item.session_id] = {
            id: item.session_id,
            type: 'feedback',
            isCoResolved: false,
            rating: item.rating,
            content: item.additional_feedback,
            table_number: item.table_number,
            created_at: item.created_at,
            resolved_at: item.resolved_at,
            venue_name: item.venues?.name
          };
        }
      });
      combinedData.push(...Object.values(sessionMap));
    }

    // Process feedback sessions where employee is co-resolver
    if (coResolvedData?.length) {
      const coSessionMap = {};
      coResolvedData.forEach(item => {
        if (item.session_id && !coSessionMap[item.session_id]) {
          coSessionMap[item.session_id] = {
            id: item.session_id,
            type: 'feedback',
            isCoResolved: true,
            rating: item.rating,
            content: item.additional_feedback,
            table_number: item.table_number,
            created_at: item.created_at,
            resolved_at: item.resolved_at,
            venue_name: item.venues?.name
          };
        }
      });
      combinedData.push(...Object.values(coSessionMap));
    }

    // Process assistance requests
    if (assistanceData?.length) {
      assistanceData.forEach(request => {
        combinedData.push({
          id: request.id,
          type: 'assistance',
          isCoResolved: false,
          content: request.message,
          table_number: request.table_number,
          created_at: request.created_at,
          resolved_at: request.resolved_at,
          venue_name: request.venues?.name
        });
      });
    }

    // Sort by resolved_at descending (most recent first)
    combinedData.sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at));

    setResolvedFeedback(combinedData);

    // Calculate stats
    const feedbackResolvedCount = Object.keys(feedbackData?.reduce((acc, item) => {
      if (item.session_id) acc[item.session_id] = true;
      return acc;
    }, {}) || {}).length;

    const feedbackCoResolvedCount = Object.keys(coResolvedData?.reduce((acc, item) => {
      if (item.session_id) acc[item.session_id] = true;
      return acc;
    }, {}) || {}).length;

    const assistanceCount = assistanceData?.length || 0;

    setTotalStats({
      feedbackResolved: feedbackResolvedCount,
      feedbackCoResolved: feedbackCoResolvedCount,
      assistanceResolved: assistanceCount,
      totalResolved: feedbackResolvedCount + feedbackCoResolvedCount + assistanceCount
    });

    // Calculate detailed analytics
    calculateDetailedAnalytics(combinedData);
  };

  const calculateDetailedAnalytics = (data) => {
    if (!data || data.length === 0) {
      setDetailedAnalytics({
        averageResolutionTime: 0,
        averageRating: 0,
        totalRatings: 0,
        quickestResolution: null,
        slowestResolution: null,
        resolutionsByDay: [],
        resolutionsByHour: [],
        performanceTrend: [],
        workloadDistribution: { feedback: 0, assistance: 0 },
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        monthlyPerformance: [],
        responseTimeCategories: { under5min: 0, under15min: 0, under1hour: 0, over1hour: 0 }
      });
      return;
    }

    // Calculate resolution times
    const resolutionTimes = data.map(item => {
      const created = new Date(item.created_at);
      const resolved = new Date(item.resolved_at);
      return {
        ...item,
        resolutionMinutes: (resolved - created) / (1000 * 60)
      };
    });

    // Average resolution time
    const avgResolutionTime = resolutionTimes.reduce((sum, item) => sum + item.resolutionMinutes, 0) / resolutionTimes.length;

    // Quickest and slowest resolution
    const sortedByTime = [...resolutionTimes].sort((a, b) => a.resolutionMinutes - b.resolutionMinutes);
    const quickest = sortedByTime[0];
    const slowest = sortedByTime[sortedByTime.length - 1];

    // Rating statistics (only for feedback items)
    const feedbackWithRatings = data.filter(item => item.type === 'feedback' && item.rating);
    const avgRating = feedbackWithRatings.length > 0 
      ? feedbackWithRatings.reduce((sum, item) => sum + item.rating, 0) / feedbackWithRatings.length 
      : 0;

    // Rating distribution
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackWithRatings.forEach(item => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingDist[item.rating]++;
      }
    });

    // Workload distribution
    const workload = {
      feedback: data.filter(item => item.type === 'feedback').length,
      assistance: data.filter(item => item.type === 'assistance').length
    };

    // Response time categories
    const timeCategories = { under5min: 0, under15min: 0, under1hour: 0, over1hour: 0 };
    resolutionTimes.forEach(item => {
      if (item.resolutionMinutes <= 5) timeCategories.under5min++;
      else if (item.resolutionMinutes <= 15) timeCategories.under15min++;
      else if (item.resolutionMinutes <= 60) timeCategories.under1hour++;
      else timeCategories.over1hour++;
    });

    // Resolutions by day of week
    const dayStats = Array(7).fill(0);
    data.forEach(item => {
      const day = new Date(item.resolved_at).getDay();
      dayStats[day]++;
    });

    // Resolutions by hour of day
    const hourStats = Array(24).fill(0);
    data.forEach(item => {
      const hour = new Date(item.resolved_at).getHours();
      hourStats[hour]++;
    });

    // Monthly performance (last 6 months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthData = data.filter(item => {
        const resolvedDate = new Date(item.resolved_at);
        return resolvedDate >= monthStart && resolvedDate <= monthEnd;
      });
      
      const monthAvgTime = monthData.length > 0 
        ? monthData.reduce((sum, item) => {
            const created = new Date(item.created_at);
            const resolved = new Date(item.resolved_at);
            return sum + ((resolved - created) / (1000 * 60));
          }, 0) / monthData.length 
        : 0;

      monthlyStats.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        resolved: monthData.length,
        avgTime: monthAvgTime,
        avgRating: monthData.filter(item => item.rating).length > 0 
          ? monthData.filter(item => item.rating).reduce((sum, item) => sum + item.rating, 0) / monthData.filter(item => item.rating).length 
          : 0
      });
    }

    setDetailedAnalytics({
      averageResolutionTime: avgResolutionTime,
      averageRating: avgRating,
      totalRatings: feedbackWithRatings.length,
      quickestResolution: quickest,
      slowestResolution: slowest,
      resolutionsByDay: dayStats,
      resolutionsByHour: hourStats,
      performanceTrend: monthlyStats,
      workloadDistribution: workload,
      ratingDistribution: ratingDist,
      monthlyPerformance: monthlyStats,
      responseTimeCategories: timeCategories
    });
  };

  const exportData = () => {
    if (resolvedFeedback.length === 0) return;
    
    const csvContent = [
      ['Date Resolved', 'Type', 'Content', 'Table', 'Rating', 'Request Type', 'Date Created', 'Resolution Time'].join(','),
      ...resolvedFeedback.map(item => [
        `"${dayjs(item.resolved_at).format('YYYY-MM-DD HH:mm:ss')}"`,
        item.type === 'feedback' ? 'Negative Feedback' : 'Assistance Request',
        `"${(item.content || '').replace(/"/g, '""')}"`,
        item.table_number || 'N/A',
        item.type === 'feedback' ? (item.rating || 'N/A') : 'N/A',
        item.type === 'assistance' ? 'Assistance' : 'N/A',
        `"${dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}"`,
        `"${dayjs(item.resolved_at).from(dayjs(item.created_at), true)}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${staffMember?.name.replace(/\s+/g, '_')}-resolved-feedback-${timeFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAnalytics = () => {
    if (!staffMember) return;
    
    const analyticsContent = [
      // Summary metrics
      ['STAFF PERFORMANCE ANALYTICS REPORT'],
      [`Staff Member: ${staffMember.name}`],
      [`Role: ${staffMember.role}`],
      [`Report Generated: ${new Date().toLocaleString()}`],
      [`Time Period: ${timeFilter === 'all' ? 'All Time' : timeFilter.replace(/([A-Z])/g, ' $1').toLowerCase()}`],
      [''],
      
      // Key metrics
      ['KEY PERFORMANCE METRICS'],
      ['Metric', 'Value'],
      ['Total Issues Resolved', totalStats.totalResolved],
      ['Average Resolution Time (minutes)', detailedAnalytics.averageResolutionTime.toFixed(1)],
      ['Average Customer Rating', detailedAnalytics.averageRating.toFixed(1)],
      ['Total Customer Ratings', detailedAnalytics.totalRatings],
      ['Fastest Resolution (minutes)', detailedAnalytics.quickestResolution ? detailedAnalytics.quickestResolution.resolutionMinutes.toFixed(1) : 'N/A'],
      ['Slowest Resolution (minutes)', detailedAnalytics.slowestResolution ? detailedAnalytics.slowestResolution.resolutionMinutes.toFixed(1) : 'N/A'],
      [''],
      
      // Response time categories
      ['RESPONSE TIME DISTRIBUTION'],
      ['Category', 'Count', 'Percentage'],
      ['Under 5 minutes', detailedAnalytics.responseTimeCategories.under5min, `${((detailedAnalytics.responseTimeCategories.under5min / totalStats.totalResolved) * 100).toFixed(1)}%`],
      ['5-15 minutes', detailedAnalytics.responseTimeCategories.under15min, `${((detailedAnalytics.responseTimeCategories.under15min / totalStats.totalResolved) * 100).toFixed(1)}%`],
      ['15-60 minutes', detailedAnalytics.responseTimeCategories.under1hour, `${((detailedAnalytics.responseTimeCategories.under1hour / totalStats.totalResolved) * 100).toFixed(1)}%`],
      ['Over 1 hour', detailedAnalytics.responseTimeCategories.over1hour, `${((detailedAnalytics.responseTimeCategories.over1hour / totalStats.totalResolved) * 100).toFixed(1)}%`],
      [''],
      
      // Workload distribution
      ['WORKLOAD DISTRIBUTION'],
      ['Issue Type', 'Count', 'Percentage'],
      ['Negative Feedback', detailedAnalytics.workloadDistribution.feedback, `${((detailedAnalytics.workloadDistribution.feedback / totalStats.totalResolved) * 100).toFixed(1)}%`],
      ['Assistance Requests', detailedAnalytics.workloadDistribution.assistance, `${((detailedAnalytics.workloadDistribution.assistance / totalStats.totalResolved) * 100).toFixed(1)}%`],
      [''],
      
      // Rating distribution
      ['CUSTOMER RATING DISTRIBUTION'],
      ['Rating', 'Count', 'Percentage'],
      ['5 Stars', detailedAnalytics.ratingDistribution[5], detailedAnalytics.totalRatings > 0 ? `${((detailedAnalytics.ratingDistribution[5] / detailedAnalytics.totalRatings) * 100).toFixed(1)}%` : '0%'],
      ['4 Stars', detailedAnalytics.ratingDistribution[4], detailedAnalytics.totalRatings > 0 ? `${((detailedAnalytics.ratingDistribution[4] / detailedAnalytics.totalRatings) * 100).toFixed(1)}%` : '0%'],
      ['3 Stars', detailedAnalytics.ratingDistribution[3], detailedAnalytics.totalRatings > 0 ? `${((detailedAnalytics.ratingDistribution[3] / detailedAnalytics.totalRatings) * 100).toFixed(1)}%` : '0%'],
      ['2 Stars', detailedAnalytics.ratingDistribution[2], detailedAnalytics.totalRatings > 0 ? `${((detailedAnalytics.ratingDistribution[2] / detailedAnalytics.totalRatings) * 100).toFixed(1)}%` : '0%'],
      ['1 Star', detailedAnalytics.ratingDistribution[1], detailedAnalytics.totalRatings > 0 ? `${((detailedAnalytics.ratingDistribution[1] / detailedAnalytics.totalRatings) * 100).toFixed(1)}%` : '0%'],
      [''],
      
      // Monthly performance
      ['MONTHLY PERFORMANCE TREND (Last 6 Months)'],
      ['Month', 'Issues Resolved', 'Avg Resolution Time (min)', 'Avg Rating'],
      ...detailedAnalytics.monthlyPerformance.map(month => [
        month.month,
        month.resolved,
        month.avgTime.toFixed(1),
        month.avgRating.toFixed(1)
      ])
    ];
    
    const csvContent = analyticsContent.map(row => 
      Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${staffMember?.name.replace(/\s+/g, '_')}-performance-analytics-${timeFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (venueId && staffId) {
      fetchStaffMemberDetails();
    }
  }, [venueId, staffId, timeFilter]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500 text-sm lg:text-base">Loading staff details...</span>
        </div>
      </PageContainer>
    );
  }

  if (!staffMember) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Staff Member Not Found</h2>
            <button
              onClick={() => navigate('/staff/leaderboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Staff Leaderboard
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/staff/leaderboard')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
          >
            ← Back to Staff Leaderboard
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600 mr-4">
              {staffMember.name.split(' ').map(word => word[0]).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{staffMember.name}</h1>
              <p className="text-gray-600 text-sm lg:text-base">{staffMember.role}</p>
              <p className="text-gray-500 text-xs">Member since {dayjs(staffMember.joinedDate).format('MMM YYYY')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            {/* Export Buttons */}
            <div className="flex items-center space-x-2">
              {resolvedFeedback.length > 0 && (
                <button
                  onClick={exportData}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  Export Feedback
                </button>
              )}
              {totalStats.totalResolved > 0 && (
                <button
                  onClick={exportAnalytics}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Export Analytics
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Analytics Dashboard */}
      
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Performance Summary</div>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{totalStats.feedbackResolved}</div>
                <div className="text-xs text-gray-500">Feedback</div>
              </div>
              <div className="text-gray-300">|</div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{totalStats.feedbackCoResolved}</div>
                <div className="text-xs text-gray-500">Co-resolved</div>
              </div>
              <div className="text-gray-300">|</div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{totalStats.assistanceResolved}</div>
                <div className="text-xs text-gray-500">Assistance</div>
              </div>
              <div className="text-gray-300">|</div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{totalStats.totalResolved}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {detailedAnalytics.averageResolutionTime > 0
                ? `${Math.round(detailedAnalytics.averageResolutionTime)}m`
                : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Avg Resolution Time</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {detailedAnalytics.averageRating > 0
                ? detailedAnalytics.averageRating.toFixed(1)
                : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Avg Customer Rating</div>
          </div>
        </div>
      </div>

      {/* Detailed Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Resolution Time Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resolution Time Analysis</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {detailedAnalytics.quickestResolution 
                    ? `${Math.round(detailedAnalytics.quickestResolution.resolutionMinutes)}m` 
                    : 'N/A'}
                </div>
                <div className="text-xs text-green-700">Fastest Resolution</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-600">
                  {detailedAnalytics.slowestResolution 
                    ? `${Math.round(detailedAnalytics.slowestResolution.resolutionMinutes)}m` 
                    : 'N/A'}
                </div>
                <div className="text-xs text-red-700">Slowest Resolution</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Under 5 minutes</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${totalStats.totalResolved > 0 
                          ? (detailedAnalytics.responseTimeCategories.under5min / totalStats.totalResolved) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{detailedAnalytics.responseTimeCategories.under5min}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">5-15 minutes</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${totalStats.totalResolved > 0 
                          ? (detailedAnalytics.responseTimeCategories.under15min / totalStats.totalResolved) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{detailedAnalytics.responseTimeCategories.under15min}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">15-60 minutes</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ 
                        width: `${totalStats.totalResolved > 0 
                          ? (detailedAnalytics.responseTimeCategories.under1hour / totalStats.totalResolved) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{detailedAnalytics.responseTimeCategories.under1hour}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Over 1 hour</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${totalStats.totalResolved > 0 
                          ? (detailedAnalytics.responseTimeCategories.over1hour / totalStats.totalResolved) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{detailedAnalytics.responseTimeCategories.over1hour}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workload & Rating Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Distribution</h3>
          <div className="space-y-6">
            
            {/* Workload Distribution */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Issue Type Distribution</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-semibold text-red-600">{detailedAnalytics.workloadDistribution.feedback}</div>
                  <div className="text-xs text-red-700">Negative Feedback</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">{detailedAnalytics.workloadDistribution.assistance}</div>
                  <div className="text-xs text-blue-700">Assistance Requests</div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            {detailedAnalytics.totalRatings > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Customer Rating Distribution</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center">
                      <span className="text-sm w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                        <div 
                          className={`h-2 rounded-full ${
                            rating >= 4 ? 'bg-green-500' : rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${detailedAnalytics.totalRatings > 0 
                              ? (detailedAnalytics.ratingDistribution[rating] / detailedAnalytics.totalRatings) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm w-8 text-right">{detailedAnalytics.ratingDistribution[rating]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Performance Trend */}
      {detailedAnalytics.monthlyPerformance.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">6-Month Performance Trend</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-2">Month</th>
                  <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-2">Resolved</th>
                  <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-2">Avg Time</th>
                  <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-2">Avg Rating</th>
                  <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-2">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detailedAnalytics.monthlyPerformance.map((month, index) => {
                  const prevMonth = index > 0 ? detailedAnalytics.monthlyPerformance[index - 1] : null;
                  const resolvedTrend = prevMonth ? month.resolved - prevMonth.resolved : 0;
                  const timeTrend = prevMonth ? month.avgTime - prevMonth.avgTime : 0;
                  
                  return (
                    <tr key={month.month} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">{month.month}</td>
                      <td className="py-3 text-center text-sm text-gray-900">{month.resolved}</td>
                      <td className="py-3 text-center text-sm text-gray-900">
                        {month.avgTime > 0 ? `${Math.round(month.avgTime)}m` : 'N/A'}
                      </td>
                      <td className="py-3 text-center text-sm text-gray-900">
                        {month.avgRating > 0 ? month.avgRating.toFixed(1) : 'N/A'}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {resolvedTrend > 0 && (
                            <span className="text-green-600 text-xs">↗ {resolvedTrend}</span>
                          )}
                          {resolvedTrend < 0 && (
                            <span className="text-red-600 text-xs">↘ {Math.abs(resolvedTrend)}</span>
                          )}
                          {resolvedTrend === 0 && prevMonth && (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolved Feedback Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resolved Feedback & Assistance Requests</h3>
          <p className="text-sm text-gray-600 mt-1">
            {timeFilter === 'all' ? 'All time' : `Filtered by: ${timeFilter.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
          </p>
        </div>

        {resolvedFeedback.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date Resolved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Resolution Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {resolvedFeedback.map((item, index) => (
                  <tr 
                    key={`${item.type}-${item.id}`}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dayjs(item.resolved_at).format('MMM D, YYYY')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dayjs(item.resolved_at).format('h:mm A')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'feedback'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type === 'feedback' ? 'Negative Feedback' : 'Assistance'}
                        </span>
                        {item.isCoResolved && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Co-resolved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        <div className="line-clamp-2">
                          {item.content || 'No content provided'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {item.table_number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.type === 'feedback' ? (
                        <div className={`text-sm font-medium ${
                          item.rating <= 2 ? 'text-red-600' : 
                          item.rating <= 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {item.rating ? `${item.rating}/5` : 'N/A'}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {dayjs(item.resolved_at).from(dayjs(item.created_at), true)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900 mb-1">No resolved feedback found</p>
              <p className="text-xs text-gray-500">
                {timeFilter === 'all' 
                  ? 'This staff member hasn\'t resolved any feedback yet' 
                  : 'Try selecting a different time period'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default StaffMemberDetails;