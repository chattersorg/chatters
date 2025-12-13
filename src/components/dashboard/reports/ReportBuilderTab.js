import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import { Button } from '../../ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../../ui/popover';
import { cn } from '../../../lib/utils';
import { ChevronDown, Calendar, Check } from 'lucide-react';
import DatePicker from '../inputs/DatePicker';
import dayjs from 'dayjs';

const ReportBuilderTab = () => {
  const { venueId, userRole } = useVenue();

  // Form state - default to last 14 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [availableVenues, setAvailableVenues] = useState([]);
  
  // Dropdown states
  const [metricsDropdownOpen, setMetricsDropdownOpen] = useState(false);
  const [venuesDropdownOpen, setVenuesDropdownOpen] = useState(false);
  
  // Loading and results state
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Available metrics/data points
  const availableMetrics = [
    { id: 'total_feedback_responses', label: 'Total Number of Feedback Responses', description: 'Count of all feedback entries' },
    { id: 'total_feedback_sessions', label: 'Total Number of Feedback Sessions', description: 'Count of unique feedback sessions' },
    { id: 'negative_feedback_responses', label: 'Number of Negative Feedback Responses', description: 'Feedback with ratings ≤ 2' },
    { id: 'positive_feedback_responses', label: 'Number of Positive Feedback Responses', description: 'Feedback with ratings ≥ 4' },
    { id: 'neutral_feedback_responses', label: 'Number of Neutral Feedback Responses', description: 'Feedback with rating = 3' },
    { id: 'average_rating', label: 'Average Rating Score', description: 'Mean rating across all feedback' },
    { id: 'assistance_requests_total', label: 'Total Assistance Requests', description: 'Count of all assistance requests' },
    { id: 'assistance_requests_pending', label: 'Pending Assistance Requests', description: 'Unresolved assistance requests' },
    { id: 'assistance_requests_resolved', label: 'Resolved Assistance Requests', description: 'Completed assistance requests' },
    { id: 'feedback_marked_resolved', label: 'Feedback Marked as Resolved', description: 'Feedback with is_actioned = true' },
    { id: 'feedback_unresolved', label: 'Unresolved Feedback', description: 'Feedback with is_actioned = false' },
    { id: 'feedback_with_comments', label: 'Feedback with Comments', description: 'Responses that include written feedback' },
    { id: 'avg_response_time_assistance', label: 'Average Assistance Response Time', description: 'Time from request to acknowledgment' },
    { id: 'avg_resolution_time_assistance', label: 'Average Assistance Resolution Time', description: 'Time from request to resolution' },
    { id: 'avg_resolution_time_feedback', label: 'Average Feedback Resolution Time', description: 'Time from submission to resolution' },
    { id: 'feedback_by_table', label: 'Feedback Count by Table', description: 'Breakdown of feedback per table/location' },
    { id: 'rating_distribution', label: 'Rating Distribution', description: '1-5 star rating breakdown' },
    { id: 'daily_feedback_count', label: 'Daily Feedback Count', description: 'Feedback submissions per day' },
    { id: 'hourly_feedback_pattern', label: 'Hourly Feedback Pattern', description: 'Feedback submissions by hour of day' },
    { id: 'staff_resolution_count', label: 'Staff Resolution Count', description: 'Number of issues resolved per staff member' }
  ];


  // Load available venues based on user role
  useEffect(() => {
    const loadVenues = async () => {
      if (!venueId) return;

      try {
        if (userRole === 'admin') {
          // Admin can see all venues
          const { data: allVenues } = await supabase
            .from('venues')
            .select('id, name')
            .order('name');
          setAvailableVenues(allVenues || []);
        } else if (userRole === 'master') {
          // Master users can see venues they have access to
          const { data: userData } = await supabase.auth.getUser();
          const { data: userRecord } = await supabase
            .from('users')
            .select('account_id')
            .eq('id', userData.user.id)
            .single();

          if (userRecord) {
            const { data: accountVenues } = await supabase
              .from('venues')
              .select('id, name')
              .eq('account_id', userRecord.account_id)
              .order('name');
            setAvailableVenues(accountVenues || []);
          }
        } else {
          // Manager users can only see their assigned venues
          const { data: userData } = await supabase.auth.getUser();
          const { data: staffVenues } = await supabase
            .from('staff')
            .select('venues(id, name)')
            .eq('user_id', userData.user.id);

          const venues = staffVenues?.map(sv => sv.venues).filter(Boolean) || [];
          setAvailableVenues(venues);
        }

        // Auto-select current venue if available
        setSelectedVenues([venueId]);
      } catch (error) {
        console.error('Error loading venues:', error);
        setError('Failed to load available venues');
      }
    };

    loadVenues();
  }, [venueId, userRole]);

  const handleVenueToggle = (venueId) => {
    setSelectedVenues(prev => 
      prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    );
  };

  const handleMetricToggle = (metricId) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const generateReport = async () => {
    if (selectedMetrics.length === 0 || selectedVenues.length === 0 || !startDate || !endDate) {
      setError('Please select at least one metric, venue, and date range');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setReportData(null);

    try {
      const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
      const endDateTime = new Date(endDate + 'T23:59:59').toISOString();

      // Get venue names for display
      const venueNames = {};
      availableVenues.forEach(venue => {
        venueNames[venue.id] = venue.name;
      });

      const reportResults = [];

      // Process each selected venue
      for (const venueId of selectedVenues) {
        const venueName = venueNames[venueId] || `Venue ${venueId}`;
        const venueRow = [venueName];

        // Calculate each selected metric for this venue
        for (const metricId of selectedMetrics) {
          const metricValue = await calculateMetric(metricId, [venueId], startDateTime, endDateTime);
          venueRow.push(metricValue);
        }

        reportResults.push(venueRow);
      }

      // Create column headers
      const columns = ['Venue', ...selectedMetrics.map(metricId => 
        availableMetrics.find(m => m.id === metricId)?.label || metricId
      )];

      setReportData({
        columns,
        rows: reportResults
      });

    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate individual metrics
  const calculateMetric = async (metricId, venueIds, startDate, endDate) => {
    try {
      switch (metricId) {
        case 'total_feedback_responses': {
          const { data } = await supabase
            .from('feedback')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          return data?.length || 0;
        }

        case 'total_feedback_sessions': {
          const { data } = await supabase
            .from('feedback')
            .select('id, session_id')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          
          if (!data?.length) return 0;
          
          const uniqueSessions = new Set();
          data.forEach(item => {
            // If session_id exists, use it; otherwise treat each feedback as its own session
            const sessionKey = item.session_id || `feedback_${item.id}`;
            uniqueSessions.add(sessionKey);
          });
          
          return uniqueSessions.size;
        }

        case 'negative_feedback_responses': {
          const { data } = await supabase
            .from('feedback')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .lte('rating', 2);
          return data?.length || 0;
        }

        case 'positive_feedback_responses': {
          const { data } = await supabase
            .from('feedback')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .gte('rating', 4);
          return data?.length || 0;
        }

        case 'neutral_feedback_responses': {
          const { data } = await supabase
            .from('feedback')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .eq('rating', 3);
          return data?.length || 0;
        }

        case 'average_rating': {
          const { data } = await supabase
            .from('feedback')
            .select('rating')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('rating', 'is', null);
          if (!data?.length) return 'N/A';
          const avg = data.reduce((sum, d) => sum + d.rating, 0) / data.length;
          return avg.toFixed(2);
        }

        case 'assistance_requests_total': {
          const { data } = await supabase
            .from('assistance_requests')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          return data?.length || 0;
        }

        case 'assistance_requests_pending': {
          const { data } = await supabase
            .from('assistance_requests')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .eq('status', 'pending');
          return data?.length || 0;
        }

        case 'assistance_requests_resolved': {
          const { data } = await supabase
            .from('assistance_requests')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .eq('status', 'resolved');
          return data?.length || 0;
        }

        case 'feedback_marked_resolved': {
          const { data } = await supabase
            .from('feedback')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .eq('is_actioned', true);
          return data?.length || 0;
        }

        case 'feedback_unresolved': {
          const { data } = await supabase
            .from('feedback')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .eq('is_actioned', false);
          return data?.length || 0;
        }

        case 'feedback_with_comments': {
          const { data } = await supabase
            .from('feedback')
            .select('id', { count: 'exact' })
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('additional_feedback', 'is', null)
            .neq('additional_feedback', '');
          return data?.length || 0;
        }

        case 'avg_response_time_assistance': {
          const { data } = await supabase
            .from('assistance_requests')
            .select('created_at, acknowledged_at')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('acknowledged_at', 'is', null);
          
          if (!data?.length) return 'N/A';
          const times = data.map(d => 
            (new Date(d.acknowledged_at) - new Date(d.created_at)) / (1000 * 60)
          );
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          return `${Math.round(avgTime)}m`;
        }

        case 'avg_resolution_time_assistance': {
          const { data } = await supabase
            .from('assistance_requests')
            .select('created_at, resolved_at')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('resolved_at', 'is', null);
          
          if (!data?.length) return 'N/A';
          const times = data.map(d => 
            (new Date(d.resolved_at) - new Date(d.created_at)) / (1000 * 60)
          );
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          return `${Math.round(avgTime)}m`;
        }

        case 'avg_resolution_time_feedback': {
          const { data } = await supabase
            .from('feedback')
            .select('created_at, resolved_at')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('resolved_at', 'is', null);
          
          if (!data?.length) return 'N/A';
          const times = data.map(d => 
            (new Date(d.resolved_at) - new Date(d.created_at)) / (1000 * 60)
          );
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          return `${Math.round(avgTime)}m`;
        }

        case 'feedback_by_table': {
          const { data } = await supabase
            .from('feedback')
            .select('table_number')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          
          const tableCount = {};
          data?.forEach(d => {
            tableCount[d.table_number] = (tableCount[d.table_number] || 0) + 1;
          });
          
          const topTable = Object.entries(tableCount)
            .sort(([,a], [,b]) => b - a)[0];
          
          return topTable ? `Table ${topTable[0]} (${topTable[1]})` : 'N/A';
        }

        case 'rating_distribution': {
          const { data } = await supabase
            .from('feedback')
            .select('rating')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('rating', 'is', null);
          
          if (!data?.length) return 'N/A';
          const dist = {};
          data.forEach(d => {
            dist[d.rating] = (dist[d.rating] || 0) + 1;
          });
          
          return Object.entries(dist)
            .sort(([a], [b]) => a - b)
            .map(([rating, count]) => `${rating}⭐: ${count}`)
            .join(', ');
        }

        case 'daily_feedback_count': {
          const { data } = await supabase
            .from('feedback')
            .select('created_at')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          
          if (!data?.length) return 'N/A';
          const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
          return (data.length / days).toFixed(1);
        }

        case 'hourly_feedback_pattern': {
          const { data } = await supabase
            .from('feedback')
            .select('created_at')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          
          if (!data?.length) return 'N/A';
          const hourCount = {};
          data.forEach(d => {
            const hour = new Date(d.created_at).getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
          });
          
          const peakHour = Object.entries(hourCount)
            .sort(([,a], [,b]) => b - a)[0];
          
          return peakHour ? `${peakHour[0]}:00 (${peakHour[1]} responses)` : 'N/A';
        }

        case 'staff_resolution_count': {
          const { data } = await supabase
            .from('feedback')
            .select('resolved_by')
            .in('venue_id', venueIds)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('resolved_by', 'is', null);
          
          if (!data?.length) return 'N/A';
          const staffCount = {};
          data.forEach(d => {
            staffCount[d.resolved_by] = (staffCount[d.resolved_by] || 0) + 1;
          });
          
          const topStaff = Object.entries(staffCount)
            .sort(([,a], [,b]) => b - a)[0];
          
          return topStaff ? `Staff ${topStaff[0]} (${topStaff[1]})` : 'N/A';
        }

        default:
          return 'N/A';
      }
    } catch (error) {
      console.error(`Error calculating metric ${metricId}:`, error);
      return 'Error';
    }
  };

  const exportToCSV = () => {
    if (!reportData?.rows?.length) return;

    const csvContent = [
      reportData.columns.join(','),
      ...reportData.rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom_report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">Report Configuration</h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <DatePicker
            label="From Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate || dayjs().format('YYYY-MM-DD')}
          />

          {/* End Date */}
          <DatePicker
            label="To Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={dayjs().format('YYYY-MM-DD')}
          />

          {/* Metrics Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Metrics ({selectedMetrics.length} selected)
            </label>
            <Popover open={metricsDropdownOpen} onOpenChange={setMetricsDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={metricsDropdownOpen}
                  className={cn(
                    "w-full justify-between text-left font-normal h-auto py-2 px-3 bg-white dark:bg-gray-700 shadow-sm border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 rounded-lg",
                    selectedMetrics.length === 0 && "text-gray-500 dark:text-gray-400"
                  )}
                >
                  <span className="block truncate dark:text-gray-100">
                    {selectedMetrics.length === 0
                      ? 'Select metrics...'
                      : `${selectedMetrics.length} metric${selectedMetrics.length !== 1 ? 's' : ''} selected`
                    }
                  </span>
                  <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200", metricsDropdownOpen && "transform rotate-180")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg" align="start">
                <div className="max-h-72 overflow-y-auto">
                  <div className="py-1">
                    {availableMetrics.map(metric => (
                      <div key={metric.id}
                        className="flex items-start space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                        onClick={() => handleMetricToggle(metric.id)}
                      >
                        <div className="flex items-center justify-center w-4 h-4 mt-0.5">
                          <div className={cn(
                            "w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-200",
                            selectedMetrics.includes(metric.id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400"
                          )}>
                            {selectedMetrics.includes(metric.id) && (
                              <Check className="h-3 w-3 text-white" strokeWidth={2} />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{metric.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{metric.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Venues Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Locations ({selectedVenues.length} selected)
            </label>
            <Popover open={venuesDropdownOpen} onOpenChange={setVenuesDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={venuesDropdownOpen}
                  className={cn(
                    "w-full justify-between text-left font-normal h-auto py-2 px-3 bg-white dark:bg-gray-700 shadow-sm border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 rounded-lg",
                    selectedVenues.length === 0 && "text-gray-500 dark:text-gray-400"
                  )}
                >
                  <span className="block truncate dark:text-gray-100">
                    {selectedVenues.length === 0
                      ? 'Select locations...'
                      : `${selectedVenues.length} location${selectedVenues.length !== 1 ? 's' : ''} selected`
                    }
                  </span>
                  <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200", venuesDropdownOpen && "transform rotate-180")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg" align="start">
                <div className="max-h-48 overflow-y-auto">
                  <div className="py-1">
                    {availableVenues.map(venue => (
                      <div key={venue.id}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                        onClick={() => handleVenueToggle(venue.id)}
                      >
                        <div className="flex items-center justify-center w-4 h-4">
                          <div className={cn(
                            "w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-200",
                            selectedVenues.includes(venue.id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400"
                          )}>
                            {selectedVenues.includes(venue.id) && (
                              <Check className="h-3 w-3 text-white" strokeWidth={2} />
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{venue.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            {error && <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>}
          </div>
          <Button
            onClick={generateReport}
            disabled={isGenerating || selectedMetrics.length === 0 || selectedVenues.length === 0 || !startDate || !endDate}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            size="default"
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </span>
            ) : (
              'Generate Report'
            )}
          </Button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Report Results ({reportData.rows?.length || 0} rows)
            </h3>
            <Button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              size="sm"
            >
              Export CSV
            </Button>
          </div>

          {reportData.rows?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {reportData.columns.map((column, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No data found for the selected criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportBuilderTab;