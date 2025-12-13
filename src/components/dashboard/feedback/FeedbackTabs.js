import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { AlertTriangle, CheckCircle, Clock, MapPin, Calendar, Timer, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../ui/AlertModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const EXPIRY_THRESHOLD_MINUTES = 120;

const FeedbackTabs = ({ venueId, questionsMap, sortOrder = 'desc', tableFilter = '' }) => {
  const [sessionFeedback, setSessionFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [alertModal, setAlertModal] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolutionType, setResolutionType] = useState('resolved');
  const [dismissalReason, setDismissalReason] = useState('');
  const navigate = useNavigate();

  const closeModal = () => {
    setShowModal(false);
    setSelectedSession(null);
    setSelectedStaffId('');
    setResolutionType('resolved');
    setDismissalReason('');
  };

  useEffect(() => {
    if (venueId) {
      loadFeedback();
      loadStaff();
    }
  }, [venueId]);

  const loadFeedback = async () => {
    setLoading(true);
    const { data } = await supabase.from('feedback').select('*').eq('venue_id', venueId);
    const grouped = {};
    for (const row of data || []) {
      if (!grouped[row.session_id]) grouped[row.session_id] = [];
      grouped[row.session_id].push(row);
    }
    const now = dayjs();
    const sessions = Object.entries(grouped).map(([session_id, items]) => {
      const createdAt = dayjs(items[0].created_at);
      const isExpired = now.diff(createdAt, 'minute') > EXPIRY_THRESHOLD_MINUTES;
      const isActioned = items.every(i => i.is_actioned);
      const lowScore = items.some(i => i.rating !== null && i.rating <= 2);
      const rated = items.filter(i => i.rating !== null);
      const avgRating = rated.length > 0 ? rated.reduce((a, b) => a + b.rating, 0) / rated.length : null;
      
      // Check if it was dismissed (marked as no action needed)
      // Check both dismissed flag and resolution_type for compatibility
      const isDismissed = items.every(i => i.dismissed === true || i.resolution_type === 'dismissed');
      
      return { session_id, items, isActioned, lowScore, isExpired, createdAt, avgRating, isDismissed };
    });
    setSessionFeedback(sessions);
    setLoading(false);
  };

  const loadStaff = async () => {
    try {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, first_name, last_name, role')
        .eq('venue_id', venueId);

      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, is_active')
        .eq('venue_id', venueId)
        .eq('is_active', true); // Only fetch active employees

      const combinedStaffList = [
        ...(staffData || []).map(person => ({
          ...person,
          source: 'staff',
          display_name: `${person.first_name} ${person.last_name}`,
          role_display: person.role || 'Staff Member'
        })),
        ...(employeesData || []).map(person => ({
          ...person,
          source: 'employee',
          display_name: `${person.first_name} ${person.last_name}`,
          role_display: person.role || 'Employee'
        }))
      ].sort((a, b) => a.display_name.localeCompare(b.display_name));

      setStaffList(combinedStaffList);
    } catch {
      setStaffList([]);
    }
  };

  // Helper function to determine if feedback is positive (green)
  const isPositiveFeedback = (session) => {
    return session.avgRating !== null && session.avgRating > 3;
  };

  const markSessionAsActioned = async (session) => {
    if (!selectedStaffId) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Staff Selection',
        message: 'Please select a staff member'
      });
      return;
    }
    const ids = session.items.map(i => i.id);
    await supabase.from('feedback').update({
      is_actioned: true,
      resolved_by: selectedStaffId,
      resolved_at: new Date(),
      resolution_type: 'staff_resolved'
    }).in('id', ids);
    closeModal();
    loadFeedback();
  };

  // New function to clear positive feedback
  const clearPositiveFeedback = async (session) => {
    const ids = session.items.map(i => i.id);
    await supabase.from('feedback').update({
      is_actioned: true,
      resolved_by: null, // No staff member needed for positive feedback
      resolved_at: new Date(),
      resolution_type: 'positive_feedback_cleared'
    }).in('id', ids);
    closeModal();
    loadFeedback();
  };

  // New function to mark as no action needed from modal
  const markAsNoActionNeeded = async (session, reason = '') => {
    const ids = session.items.map(i => i.id);
    await supabase.from('feedback').update({
      is_actioned: true,
      dismissed: true,
      dismissed_at: new Date().toISOString(),
      dismissed_reason: reason.trim() || 'No action needed',
      resolution_type: 'dismissed'
    }).in('id', ids);
    closeModal();
    loadFeedback();
  };

  const filteredSessions = sessionFeedback.filter(session => {
    if (tableFilter && session.items[0]?.table_number !== tableFilter) return false;
    if (activeTab === 'alerts') return session.lowScore && !session.isActioned && !session.isExpired && !session.isDismissed;
    if (activeTab === 'actioned') return session.isActioned && !session.isDismissed;
    if (activeTab === 'dismissed') return session.isDismissed;
    if (activeTab === 'expired') return session.isExpired && !session.isActioned && !session.isDismissed;
    return true;
  }).sort((a, b) => sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  const getTabCounts = () => {
    const alerts = sessionFeedback.filter(s => s.lowScore && !s.isActioned && !s.isExpired && !s.isDismissed).length;
    const actioned = sessionFeedback.filter(s => s.isActioned && !s.isDismissed).length;
    const dismissed = sessionFeedback.filter(s => s.isDismissed).length;
    const expired = sessionFeedback.filter(s => s.isExpired && !s.isActioned && !s.isDismissed).length;
    const all = sessionFeedback.length;
    return { alerts, actioned, dismissed, expired, all };
  };

  const counts = getTabCounts();

  const getRatingColor = (rating) => {
    if (rating === null) return 'text-gray-400';
    if (rating <= 2) return 'text-red-500';
    if (rating <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRatingBg = (rating) => {
    if (rating === null) return 'bg-gray-100';
    if (rating <= 2) return 'bg-red-50';
    if (rating <= 3) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  const selectedStaffMember = staffList.find(staff => staff.id === selectedStaffId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading feedback...</span>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-First Tab Navigation */}
      <div className="border-b border-gray-200 mb-4 lg:mb-6">
        <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
          {[
            { id: 'alerts', label: 'Alerts', labelShort: 'Alerts', icon: AlertTriangle, count: counts.alerts, color: 'red' },
            { id: 'actioned', label: 'Resolved', labelShort: 'Resolved', icon: CheckCircle, count: counts.actioned, color: 'green' },
            { id: 'dismissed', label: 'Dismissed', labelShort: 'Dismissed', icon: X, count: counts.dismissed, color: 'gray' },
            { id: 'expired', label: 'Expired', labelShort: 'Expired', icon: Clock, count: counts.expired, color: 'yellow' },
            { id: 'all', label: 'All Feedback', labelShort: 'All', icon: null, count: counts.all, color: 'blue' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center py-3 lg:py-4 px-3 lg:px-1 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-red-600 border-red-500'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
              style={{
                color: activeTab === tab.id ? (tab.color === 'red' ? '#dc2626' : tab.color === 'green' ? '#059669' : tab.color === 'yellow' ? '#d97706' : tab.color === 'gray' ? '#6b7280' : '#2563eb') : undefined,
                borderBottomColor: activeTab === tab.id ? (tab.color === 'red' ? '#dc2626' : tab.color === 'green' ? '#059669' : tab.color === 'yellow' ? '#d97706' : tab.color === 'gray' ? '#6b7280' : '#2563eb') : 'transparent'
              }}
            >
              {tab.icon && <tab.icon className="w-4 h-4 mr-1 lg:mr-2 flex-shrink-0" />}
              <span className="lg:hidden">{tab.labelShort}</span>
              <span className="hidden lg:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span 
                  className={`ml-1 lg:ml-2 py-0.5 px-1.5 lg:px-2 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? (tab.color === 'red' ? '#fef2f2' : tab.color === 'green' ? '#f0fdf4' : tab.color === 'yellow' ? '#fefbeb' : tab.color === 'gray' ? '#f3f4f6' : '#eff6ff') : '#f3f4f6',
                    color: activeTab === tab.id ? (tab.color === 'red' ? '#991b1b' : tab.color === 'green' ? '#166534' : tab.color === 'yellow' ? '#92400e' : tab.color === 'gray' ? '#374151' : '#1e40af') : '#4b5563'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Feedback Cards */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-8 lg:py-12">
          <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            {activeTab === 'alerts' && <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />}
            {activeTab === 'actioned' && <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />}
            {activeTab === 'dismissed' && <X className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />}
            {activeTab === 'expired' && <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />}
            {activeTab === 'all' && <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />}
          </div>
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'alerts' && 'No alerts'}
            {activeTab === 'actioned' && 'No resolved feedback'}
            {activeTab === 'dismissed' && 'No dismissed feedback'}
            {activeTab === 'expired' && 'No expired feedback'}
            {activeTab === 'all' && 'No feedback yet'}
          </h3>
          <p className="text-sm lg:text-base text-gray-500 px-4">
            {activeTab === 'alerts' && 'All feedback is looking good!'}
            {activeTab === 'actioned' && 'Resolved feedback will appear here.'}
            {activeTab === 'dismissed' && 'Dismissed feedback will appear here.'}
            {activeTab === 'expired' && 'Expired feedback will appear here.'}
            {activeTab === 'all' && 'Customer feedback will appear here once submitted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {filteredSessions.map(session => (
            <div
              key={session.session_id}
              className={`relative rounded-lg lg:rounded-xl border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                session.lowScore && !session.isActioned && !session.isExpired && !session.isDismissed
                  ? 'border-red-200 bg-red-50 hover:bg-red-100'
                  : session.isDismissed
                  ? 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  : session.isActioned
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : session.isExpired
                  ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => { setSelectedSession(session); setShowModal(true); }}
            >
              {/* Mobile Status Indicator */}
              <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
                {session.lowScore && !session.isActioned && !session.isExpired && !session.isDismissed && (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 mr-1" />
                    <span className="text-xs font-medium hidden sm:inline">Needs Attention</span>
                  </div>
                )}
                {session.isDismissed && (
                  <div className="flex items-center text-gray-500">
                    <X className="w-4 h-4 lg:w-5 lg:h-5 mr-1" />
                    <span className="text-xs font-medium hidden sm:inline">Dismissed</span>
                  </div>
                )}
                {session.isActioned && !session.isDismissed && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-1" />
                    <span className="text-xs font-medium hidden sm:inline">Resolved</span>
                  </div>
                )}
                {session.isExpired && !session.isActioned && !session.isDismissed && (
                  <div className="flex items-center text-yellow-600">
                    <Clock className="w-4 h-4 lg:w-5 lg:h-5 mr-1" />
                    <span className="text-xs font-medium hidden sm:inline">Expired</span>
                  </div>
                )}
              </div>

              <div className="p-4 lg:p-6 pr-16 lg:pr-24">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 lg:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 truncate">
                      Table {session.items[0].table_number}
                    </h3>
                    
                    {/* Rating Display */}
                    {session.avgRating !== null && (
                      <div className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${getRatingBg(session.avgRating)} ${getRatingColor(session.avgRating)}`}>
                        <span className="text-sm lg:text-lg mr-1">
                          {session.avgRating <= 2 ? '😞' : session.avgRating <= 3 ? '😐' : session.avgRating <= 4 ? '😊' : '😍'}
                        </span>
                        <span className="hidden sm:inline">Average: </span>{session.avgRating.toFixed(1)}/5
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata - Mobile Optimized */}
                <div className="flex flex-wrap items-center text-xs lg:text-sm text-gray-600 gap-2 lg:gap-4 mb-3 lg:mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{session.createdAt.format('MMM D')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{session.createdAt.format('h:mm A')}</span>
                  </div>
                  <div className="flex items-center">
                    <Timer className="w-3 h-3 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{session.createdAt.fromNow()}</span>
                  </div>
                </div>

                {/* Preview of feedback items */}
                <div className="space-y-2 mb-3 lg:mb-4">
                  {session.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="text-xs lg:text-sm">
                      {item.additional_feedback && (
                        <p className="text-gray-700 italic break-words">
                          "{item.additional_feedback.substring(0, 80)}{item.additional_feedback.length > 80 ? '...' : ''}"
                        </p>
                      )}
                      {questionsMap[item.question_id] && item.rating && (
                        <p className="text-gray-600 break-words">
                          <span className="font-medium">{questionsMap[item.question_id]}:</span> 
                          <span className={getRatingColor(item.rating)}> {item.rating}/5</span>
                        </p>
                      )}
                    </div>
                  ))}
                  {session.items.length > 2 && (
                    <p className="text-xs text-gray-500">+{session.items.length - 2} more responses</p>
                  )}
                </div>

                {/* Actions - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 lg:pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/floorplan');
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs lg:text-sm font-medium rounded-lg transition-colors"
                  >
                    <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">View on Floor Plan</span>
                  </button>

                  {!session.isActioned && !session.isExpired && !session.isDismissed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm font-medium rounded-lg transition-colors"
                    >
                      <User className="w-3 h-3 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
                      {isPositiveFeedback(session) ? 'View & Clear' : 'Resolve'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Mobile-Optimized Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 lg:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[95vh] lg:max-h-[90vh] overflow-y-auto rounded-lg lg:rounded-xl shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 lg:p-6 rounded-t-lg lg:rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 break-words">
                    {isPositiveFeedback(selectedSession) ? 'View Feedback' : 'Resolve Feedback'} - Table {selectedSession.items[0].table_number}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
              
            </div>

            <div className="p-4 lg:p-6">
              <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6">
                {selectedSession.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 lg:p-4 border border-gray-200">
                    {questionsMap[item.question_id] && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-1 text-sm lg:text-base break-words">
                          {questionsMap[item.question_id]}
                        </h4>
                        {item.rating !== null && (
                          <div className="flex items-center">
                            <span className="text-base lg:text-lg mr-2">
                              {item.rating <= 2 ? '😞' : item.rating <= 3 ? '😐' : item.rating <= 4 ? '😊' : '😍'}
                            </span>
                            <span className={`font-semibold text-sm lg:text-base ${getRatingColor(item.rating)}`}>
                              {item.rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.additional_feedback && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <h5 className="text-xs lg:text-sm font-medium text-gray-700 mb-1">Additional Comments:</h5>
                        <p className="text-sm lg:text-base text-gray-800 italic break-words">"{item.additional_feedback}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons - Different based on feedback type */}
              {isPositiveFeedback(selectedSession) ? (
                // For positive feedback - just show clear button
                <button
                  onClick={() => clearPositiveFeedback(selectedSession)}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-colors text-sm lg:text-base bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 inline mr-2" />
                  Clear Feedback
                </button>
              ) : (
                // For negative feedback - show resolve and dismiss options with toggle
                <div className="space-y-4">
                  {/* Resolution Type Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResolutionType('resolved')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        resolutionType === 'resolved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </button>
                    <button
                      onClick={() => setResolutionType('dismissed')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        resolutionType === 'dismissed'
                          ? 'bg-gray-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      Dismiss
                    </button>
                  </div>

                  {/* Staff Member Selection - Required for resolve, shown for both */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {resolutionType === 'resolved' ? 'Resolved by' : 'Dismissed by'}
                      {resolutionType === 'resolved' && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      value={selectedStaffId}
                      onChange={e => setSelectedStaffId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Team Member</option>

                      {staffList.some(person => person.source === 'staff') && (
                        <optgroup label="Managers & Staff">
                          {staffList
                            .filter(person => person.source === 'staff')
                            .map(staff => (
                              <option key={`staff-${staff.id}`} value={staff.id}>
                                {staff.display_name} ({staff.role_display})
                              </option>
                            ))
                          }
                        </optgroup>
                      )}

                      {staffList.some(person => person.source === 'employee') && (
                        <optgroup label="Employees">
                          {staffList
                            .filter(person => person.source === 'employee')
                            .map(employee => (
                              <option key={`employee-${employee.id}`} value={employee.id}>
                                {employee.display_name} ({employee.role_display})
                              </option>
                            ))
                          }
                        </optgroup>
                      )}

                      {!staffList.some(person => person.source === 'staff') &&
                       !staffList.some(person => person.source === 'employee') && (
                        staffList.map(person => (
                          <option key={person.id} value={person.id}>
                            {person.display_name} ({person.role_display})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Dismissal Reason - Only show when dismissing */}
                  {resolutionType === 'dismissed' && (
                    <textarea
                      value={dismissalReason}
                      onChange={(e) => setDismissalReason(e.target.value)}
                      placeholder="Reason for dismissal (optional)..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 placeholder-gray-400 resize-none"
                    />
                  )}

                  {/* Action Button */}
                  {resolutionType === 'resolved' ? (
                    <button
                      onClick={() => markSessionAsActioned(selectedSession)}
                      disabled={!selectedStaffId}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                        selectedStaffId
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 inline mr-2" />
                      {selectedStaffMember ? (
                        `Mark Resolved by ${selectedStaffMember.display_name}`
                      ) : (
                        'Select Team Member to Resolve'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => markAsNoActionNeeded(selectedSession, dismissalReason)}
                      className="w-full py-3 px-4 rounded-lg font-medium transition-colors text-sm lg:text-base bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <X className="w-4 h-4 lg:w-5 lg:h-5 inline mr-2" />
                      Dismiss Feedback
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title}
        message={alertModal?.message}
        type={alertModal?.type}
      />
    </>
  );
};

export default FeedbackTabs;