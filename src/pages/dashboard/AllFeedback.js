import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import dayjs from 'dayjs';
import { Search, Calendar, Filter, CheckSquare, Square, Eye, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AlertModal from '../../components/ui/AlertModal';
import DatePicker from '../../components/dashboard/inputs/DatePicker';
import FilterSelect from '../../components/ui/FilterSelect';

const ITEMS_PER_PAGE = 20;

const AllFeedback = () => {
  usePageTitle('All Feedback');
  const { venueId } = useVenue();

  // State
  const [feedbackSessions, setFeedbackSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unresolved', 'resolved'
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', '1-2', '3', '4-5'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'feedback', 'assistance'
  const [selectedSessions, setSelectedSessions] = useState(new Set());
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [sortField, setSortField] = useState('created_at'); // 'created_at', 'type', 'avg_rating'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  // Load feedback sessions
  useEffect(() => {
    if (!venueId) return;
    loadFeedback();
  }, [venueId, dateFrom, dateTo]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const startDate = dayjs(dateFrom).startOf('day').toISOString();
      const endDate = dayjs(dateTo).endOf('day').toISOString();

      // Fetch regular feedback with question text and resolver info
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select(`
          *,
          questions (
            question
          ),
          resolver:resolved_by (
            id,
            first_name,
            last_name
          ),
          co_resolver:co_resolver_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('venue_id', venueId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Fetch assistance requests
      const { data: assistanceData, error: assistanceError } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('venue_id', venueId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (assistanceError) throw assistanceError;

      // Convert assistance requests to feedback format
      const assistanceAsFeedback = (assistanceData || []).map(assist => ({
        id: assist.id,
        session_id: assist.id, // Use assistance request ID as session ID
        venue_id: assist.venue_id,
        table_number: assist.table_number,
        created_at: assist.created_at,
        resolved_at: assist.resolved_at || (assist.status === 'resolved' ? assist.updated_at : null),
        resolved_by: assist.resolved_by || null,
        rating: null,
        question_text: null,
        additional_feedback: assist.message,
        _is_assistance: true, // Flag to identify assistance requests
      }));

      // Combine both datasets
      const data = [...(feedbackData || []), ...assistanceAsFeedback];

      // Group by session_id
      const sessionMap = {};
      data.forEach(item => {
        const sessionId = item.session_id || item.id;
        if (!sessionMap[sessionId]) {
          sessionMap[sessionId] = {
            session_id: sessionId,
            table_number: item.table_number,
            created_at: item.created_at,
            resolved_at: item.resolved_at,
            resolved_by: item.resolved_by,
            resolver: item.resolver,
            co_resolver: item.co_resolver,
            items: [],
          };
        }
        sessionMap[sessionId].items.push(item);
      });

      // Calculate average rating and collect comments
      const sessions = Object.values(sessionMap).map(session => {
        const ratings = session.items.filter(item => item.rating).map(item => item.rating);
        const avgRating = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

        const comments = session.items
          .map(item => item.additional_feedback)
          .filter(Boolean);

        // Determine if this is an assistance request
        // Check if any item has the _is_assistance flag
        const isAssistanceRequest = session.items.some(item => item._is_assistance);

        // Check if dismissed
        const isDismissed = session.items.every(item =>
          item.dismissed === true || item.resolution_type === 'dismissed'
        );

        return {
          ...session,
          avg_rating: avgRating,
          comments: comments,
          has_comments: comments.length > 0,
          is_resolved: session.items.every(item => item.resolved_at || item.is_actioned),
          is_dismissed: isDismissed,
          type: isAssistanceRequest ? 'assistance' : 'feedback',
        };
      });

      // Sort sessions by created_at (newest first)
      sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setFeedbackSessions(sessions);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setAlertModal({
        type: 'error',
        title: 'Error Loading Feedback',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted sessions
  const filteredSessions = useMemo(() => {
    const filtered = feedbackSessions.filter(session => {
      // Type filter
      if (typeFilter === 'feedback' && session.type !== 'feedback') return false;
      if (typeFilter === 'assistance' && session.type !== 'assistance') return false;

      // Status filter
      if (statusFilter === 'unresolved' && (session.is_resolved || session.is_dismissed)) return false;
      if (statusFilter === 'resolved' && (!session.is_resolved || session.is_dismissed)) return false;
      if (statusFilter === 'dismissed' && !session.is_dismissed) return false;

      // Rating filter
      if (ratingFilter !== 'all' && session.avg_rating !== null) {
        if (ratingFilter === 'poor' && session.avg_rating >= 3) return false;
        if (ratingFilter === 'average' && (session.avg_rating < 3 || session.avg_rating >= 4)) return false;
        if (ratingFilter === 'good' && session.avg_rating < 4) return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const tableMatch = session.table_number?.toString().includes(search);
        const commentMatch = session.comments.some(c => c.toLowerCase().includes(search));
        if (!tableMatch && !commentMatch) return false;
      }

      return true;
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'created_at') {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === 'avg_rating') {
        // Handle null ratings - put them at the end
        if (a.avg_rating === null && b.avg_rating === null) comparison = 0;
        else if (a.avg_rating === null) comparison = 1;
        else if (b.avg_rating === null) comparison = -1;
        else comparison = a.avg_rating - b.avg_rating;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [feedbackSessions, statusFilter, ratingFilter, typeFilter, searchTerm, sortField, sortDirection]);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, ratingFilter, typeFilter, searchTerm, dateFrom, dateTo, sortField, sortDirection]);

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Render sort icon
  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.session_id)));
    }
  };

  const toggleSelectSession = (sessionId) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  // Bulk resolve
  const handleBulkResolve = async () => {
    setResolveLoading(true);
    try {
      // Get current user and their staff ID for this venue
      const { data: { user } } = await supabase.auth.getUser();

      // Look up the staff record for this user in this venue
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user?.id)
        .eq('venue_id', venueId)
        .single();

      const staffId = staffRecord?.id || null;

      const sessionIds = Array.from(selectedSessions);
      const selectedSessionData = feedbackSessions.filter(s => sessionIds.includes(s.session_id));

      // Separate feedback and assistance items
      const feedbackIds = [];
      const assistanceIds = [];

      selectedSessionData.forEach(s => {
        s.items.forEach(item => {
          if (item._is_assistance) {
            assistanceIds.push(item.id);
          } else {
            feedbackIds.push(item.id);
          }
        });
      });

      // Update feedback items
      if (feedbackIds.length > 0) {
        const updateData = { resolved_at: new Date().toISOString() };
        if (staffId) updateData.resolved_by = staffId;

        const { error: feedbackError } = await supabase
          .from('feedback')
          .update(updateData)
          .in('id', feedbackIds);

        if (feedbackError) throw feedbackError;
      }

      // Update assistance requests
      if (assistanceIds.length > 0) {
        const updateData = {
          resolved_at: new Date().toISOString(),
          status: 'resolved'
        };
        if (staffId) updateData.resolved_by = staffId;

        const { error: assistanceError } = await supabase
          .from('assistance_requests')
          .update(updateData)
          .in('id', assistanceIds);

        if (assistanceError) throw assistanceError;
      }

      setShowResolveModal(false);
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: `${sessionIds.length} feedback session(s) marked as resolved.`,
      });

      setSelectedSessions(new Set());
      loadFeedback();
    } catch (error) {
      console.error('Error resolving feedback:', error);
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: error.message,
      });
    } finally {
      setResolveLoading(false);
    }
  };

  // View details
  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  // Get rating color
  const getRatingColor = (rating) => {
    if (!rating) return 'text-gray-400';
    if (rating < 3) return 'text-red-600 font-bold';
    if (rating < 4) return 'text-yellow-600 font-bold';
    return 'text-green-600 font-bold';
  };

  // Get rating badge
  const getRatingBadge = (rating) => {
    if (!rating) return 'bg-gray-100 text-gray-600';
    if (rating < 3) return 'bg-red-100 text-red-700 border-red-300';
    if (rating < 4) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  return (
    <div className="space-y-6">
      <ChartCard
        title="All Feedback"
        subtitle={`${filteredSessions.length} feedback sessions within selected timeframe`}
      >
        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Date Range and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 dark:text-gray-300">
            <DatePicker
              label="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo}
            />

            <DatePicker
              label="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom}
              max={dayjs().format('YYYY-MM-DD')}
            />

            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'feedback', label: 'Feedback' },
                { value: 'assistance', label: 'Assistance' }
              ]}
            />

            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'unresolved', label: 'Unresolved' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'dismissed', label: 'Dismissed' }
              ]}
            />

            <FilterSelect
              label="Rating"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Ratings' },
                { value: 'poor', label: 'Poor (1-3 stars)' },
                { value: 'average', label: 'Average (3 stars)' },
                { value: 'good', label: 'Good (4-5 stars)' }
              ]}
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by table number or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSessions.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedSessions.size} session(s) selected
            </span>
            <PermissionGate permission="feedback.respond">
              <button
                onClick={() => setShowResolveModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Mark as Resolved
              </button>
            </PermissionGate>
          </div>
        )}

        {/* Feedback Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading feedback...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No feedback found for the selected filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button onClick={toggleSelectAll} className="hover:text-blue-600 dark:text-gray-300">
                        {selectedSessions.size === filteredSessions.length ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Date/Time
                        <SortIcon field="created_at" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Table</th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Type
                        <SortIcon field="type" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('avg_rating')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Avg Rating
                        <SortIcon field="avg_rating" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Questions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Comments</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSessions.map((session) => (
                    <tr
                      key={session.session_id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedSessions.has(session.session_id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectSession(session.session_id)}
                          className="hover:text-blue-600 dark:text-gray-300"
                        >
                          {selectedSessions.has(session.session_id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {dayjs(session.created_at).format('ddd, MMM D, YYYY h:mm A')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {session.table_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {session.type === 'assistance' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700">
                            Assistance
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                            Feedback
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {session.avg_rating !== null ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRatingBadge(session.avg_rating)}`}>
                            {session.avg_rating.toFixed(1)} stars
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {session.items.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {session.has_comments ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{session.comments.length}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {session.is_dismissed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700">
                            Dismissed
                          </span>
                        ) : session.is_resolved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700">
                            Unresolved
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewDetails(session)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredSessions.length)} of {filteredSessions.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </ChartCard>

      {/* Bulk Resolve Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResolveModal}
        title="Confirm Bulk Resolve"
        message={`Are you sure you want to mark ${selectedSessions.size} session(s) as resolved?`}
        confirmText="Resolve"
        cancelText="Cancel"
        confirmButtonStyle="primary"
        icon="info"
        loading={resolveLoading}
        onConfirm={handleBulkResolve}
        onCancel={() => setShowResolveModal(false)}
      />

      {/* Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Feedback Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Session Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Table Number</p>
                    <p className="font-medium text-gray-900">{selectedSession.table_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date/Time</p>
                    <p className="font-medium text-gray-900">
                      {dayjs(selectedSession.created_at).format('MMM D, YYYY h:mm A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className={`font-bold text-lg ${getRatingColor(selectedSession.avg_rating)}`}>
                      {selectedSession.avg_rating !== null ? `${selectedSession.avg_rating.toFixed(1)} stars` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-gray-900">
                      {selectedSession.is_dismissed ? (
                        <span className="text-gray-600">Dismissed</span>
                      ) : selectedSession.is_resolved ? (
                        <span className="text-green-600">Resolved</span>
                      ) : (
                        <span className="text-yellow-600">Unresolved</span>
                      )}
                    </p>
                  </div>
                  {(selectedSession.is_resolved || selectedSession.is_dismissed) && selectedSession.resolver && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Resolved By</p>
                      <p className="font-medium text-gray-900">
                        {selectedSession.resolver.first_name} {selectedSession.resolver.last_name}
                        {selectedSession.co_resolver && (
                          <span> with {selectedSession.co_resolver.first_name} {selectedSession.co_resolver.last_name}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Feedback Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedSession.type === 'assistance' ? 'Assistance Request Details' : 'Responses'}
                  </h4>

                  {selectedSession.type === 'assistance' ? (
                    // Display assistance request details
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-orange-600 text-lg">🆘</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">Customer requested assistance</p>
                          {selectedSession.items[0]?.additional_feedback && (
                            <div className="bg-white p-3 rounded border border-orange-200">
                              <p className="text-sm text-gray-700">
                                {selectedSession.items[0].additional_feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display regular feedback responses
                    <div className="space-y-3">
                      {selectedSession.items.map((item, index) => (
                        <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">Question {index + 1}</p>
                              <p className="font-medium text-gray-900">{item.questions?.question || 'Question not available'}</p>
                            </div>
                            {item.rating && (
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRatingBadge(item.rating)}`}>
                                  {item.rating} stars
                                </span>
                              </div>
                            )}
                          </div>
                          {item.additional_feedback && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Comment:</p>
                              <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded italic">
                                "{item.additional_feedback}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {!selectedSession.is_resolved && !selectedSession.is_dismissed && (
                  <PermissionGate permission="feedback.respond">
                    <button
                      onClick={async () => {
                        setSelectedSessions(new Set([selectedSession.session_id]));
                        setShowDetailsModal(false);
                        setShowResolveModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark as Resolved
                    </button>
                  </PermissionGate>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <AlertModal
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
          onClose={() => setAlertModal(null)}
        />
      )}
    </div>
  );
};

export default AllFeedback;
