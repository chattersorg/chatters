import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../common/Modal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { supabase } from '../../../utils/supabase';
import AlertModal from '../../ui/AlertModal';

dayjs.extend(relativeTime);

// Helper to safely get rating
const getRowRating = (row) => {
  const cand = row.session_rating ?? row.rating ?? row.score ?? null;
  const num = typeof cand === 'number' ? cand : Number(cand);
  return Number.isFinite(num) ? num : null;
};

// Group feedback items by session
const groupBySession = (feedbackItems) => {
  const sessionMap = new Map();
  
  for (const item of feedbackItems) {
    const sessionId = item.session_id;
    if (!sessionId) continue;
    
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        session_id: sessionId,
        table_number: item.table_number,
        created_at: item.created_at,
        items: [],
        venue_id: item.venue_id,
      });
    }
    
    sessionMap.get(sessionId).items.push(item);
  }
  
  return Array.from(sessionMap.values())
    .map(session => {
      // Calculate session-level metrics
      const ratings = session.items
        .map(item => getRowRating(item))
        .filter(rating => rating !== null);
      
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null;
      
      const hasComments = session.items.some(item => 
        item.additional_feedback && item.additional_feedback.trim()
      );
      
      // Sort items by question order or creation time
      session.items.sort((a, b) => {
        const aOrder = a.questions?.order || 0;
        const bOrder = b.questions?.order || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.created_at) - new Date(b.created_at);
      });
      
      return {
        ...session,
        avg_rating: avgRating,
        has_comments: hasComments,
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const getRatingColor = (rating) => {
  if (rating == null) return 'text-slate-500';
  if (rating <= 2) return 'text-red-600';
  if (rating <= 3) return 'text-amber-600';
  return 'text-emerald-600';
};

const StarRating = ({ rating, className = '' }) => {
  if (rating == null) return (
    <div className="flex items-center gap-1">
      <span className="text-slate-400 text-sm font-medium">No rating provided</span>
    </div>
  );
  
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-amber-400 fill-current' 
                : 'text-slate-200'
            }`}
            fill={star <= rating ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={star <= rating ? 0 : 1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
      <span className={`text-sm font-semibold ${getRatingColor(rating)}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

const FeedbackDetailModal = ({
  isOpen,
  onClose,
  feedbackItems = [],
  onMarkResolved,
  venueId
}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaffMember, setSelectedStaffMember] = useState('');
  const [resolutionType, setResolutionType] = useState('resolved');
  const [dismissalReason, setDismissalReason] = useState('');
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [alertModal, setAlertModal] = useState(null);

  // Co-resolver state
  const [enableCoResolving, setEnableCoResolving] = useState(false);
  const [addCoResolver, setAddCoResolver] = useState(false);
  const [selectedCoResolver, setSelectedCoResolver] = useState('');
  
  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedStaffMember('');
      setResolutionType('resolved');
      setDismissalReason('');
      setResolutionMessage('');
      setAddCoResolver(false);
      setSelectedCoResolver('');
    }
  }, [isOpen]);
  
  const sessions = useMemo(() => groupBySession(feedbackItems), [feedbackItems]);
  
  // Helper function to determine if feedback is positive (rating > 3)
  const isPositiveFeedback = (session) => {
    return session.avg_rating !== null && session.avg_rating > 3;
  };
  
  // Load current user and staff members
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
          // Get user profile from your users table
          const { data: userProfile } = await supabase
            .from('users')
            .select('id, email, role, account_id')
            .eq('id', user.id)
            .single();

          setCurrentUser(userProfile);
        }

        // Get venue settings for co-resolver feature
        if (venueId) {
          const { data: venueData } = await supabase
            .from('venues')
            .select('enable_co_resolving')
            .eq('id', venueId)
            .single();

          setEnableCoResolving(venueData?.enable_co_resolving || false);
        }

        // Get employees for this venue (all staff are stored in employees table)
        if (venueId) {
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('id, first_name, last_name, email, role, is_active')
            .eq('venue_id', venueId)
            .eq('is_active', true); // Only fetch active employees

          if (employeesError) {
            // Error loading employees data
          }
          

          const combinedStaffList = [
            ...(employeesData || []).map(person => ({
              ...person,
              source: 'employee',
              display_name: `${person.first_name} ${person.last_name}`,
              role_display: person.role || 'Employee'
            }))
          ].sort((a, b) => a.display_name.localeCompare(b.display_name));

          setStaffMembers(combinedStaffList);
          
          // Auto-select current user if their email matches an employee
          if (user && employeesData) {
            const currentEmployee = employeesData.find(e => e.email === user.email);
            if (currentEmployee) {
              setSelectedStaffMember(`employee-${currentEmployee.id}`);
            }
          }
        }
      } catch (error) {
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen, venueId]);
  
  if (!sessions.length) return null;
  
  // For now, show the first (most recent) session
  const session = sessions[0];
  
  // New function to clear positive feedback (no staff assignment needed)
  const clearPositiveFeedback = async () => {
    setIsResolving(true);

    try {
      const sessionIds = sessions.map(s => s.session_id);

      const updateData = {
        is_actioned: true,
        resolved_by: null, // No staff member needed for positive feedback
        resolved_at: new Date().toISOString(),
        resolution_type: 'positive_feedback_cleared'
      };

      const { error } = await supabase
        .from('feedback')
        .update(updateData)
        .in('session_id', sessionIds);

      if (error) throw error;

      // Pass null for staff ID since no staff assignment needed
      await onMarkResolved(sessionIds, null);
      onClose();
    } catch (error) {
      setAlertModal({
        type: 'error',
        title: 'Clear Failed',
        message: 'Failed to clear feedback. Please try again.'
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedStaffMember) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Staff Selection',
        message: 'Please select the staff member who resolved this feedback.'
      });
      return;
    }

    // Validate co-resolver if enabled and checkbox is checked
    if (enableCoResolving && addCoResolver && !selectedCoResolver) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Co-Resolver',
        message: 'Please select a co-resolver or uncheck the "Add co-resolver" box.'
      });
      return;
    }

    setIsResolving(true);

    try {
      const sessionIds = sessions.map(s => s.session_id);

      // Parse the selected staff member
      let resolvedById = null;
      let resolverInfo = '';

      if (selectedStaffMember.startsWith('employee-')) {
        // Employee selected - use their ID directly for resolved_by
        const selectedEmployee = staffMembers.find(s => s.source === 'employee' && String(s.id) === String(selectedStaffMember.replace('employee-', '')));

        if (selectedEmployee) {
          // Validate that this employee actually exists in the database
          const { data: dbEmployee, error: employeeCheckError } = await supabase
            .from('employees')
            .select('id, first_name, last_name')
            .eq('id', selectedEmployee.id)
            .eq('venue_id', venueId)
            .single();

          if (employeeCheckError || !dbEmployee) {
            throw new Error(`Employee "${selectedEmployee.display_name}" not found in database. Please refresh the page and try again.`);
          }

          resolvedById = selectedEmployee.id;
          resolverInfo = `Resolved by ${selectedEmployee.display_name}`;
        }
      }

      // Parse co-resolver if selected
      let coResolverId = null;
      if (enableCoResolving && addCoResolver && selectedCoResolver) {
        if (selectedCoResolver.startsWith('employee-')) {
          const coResolverEmployee = staffMembers.find(s => s.source === 'employee' && String(s.id) === String(selectedCoResolver.replace('employee-', '')));

          if (coResolverEmployee) {
            // Validate that this employee exists
            const { data: dbCoResolver, error: coResolverCheckError } = await supabase
              .from('employees')
              .select('id, first_name, last_name')
              .eq('id', coResolverEmployee.id)
              .eq('venue_id', venueId)
              .single();

            if (!coResolverCheckError && dbCoResolver) {
              coResolverId = coResolverEmployee.id;
              resolverInfo += ` with ${coResolverEmployee.display_name}`;
            }
          }
        }
      }

      // Fallback: if no resolvedById was set, use the first available employee
      if (!resolvedById) {

        // If there are any employees, use the first one
        const anyEmployee = staffMembers.find(s => s.source === 'employee');
        if (anyEmployee) {
          resolvedById = anyEmployee.id;
          resolverInfo = `Resolved via kiosk by ${anyEmployee.display_name}`;
        } else {
          // Last resort: allow resolution without staff attribution
          // This maintains functionality when no employees exist
          resolvedById = null;
          resolverInfo = 'Resolved via kiosk (no staff attribution)';
        }
      }

      // Use correct Supabase database fields
      const updateData = {
        is_actioned: true,
        resolved_at: new Date().toISOString(),
        resolution_type: resolutionType
      };

      // Only set resolved_by if we have a valid staff ID
      if (resolvedById) {
        updateData.resolved_by = resolvedById;
      }

      // Set co_resolver_id if provided
      if (coResolverId) {
        updateData.co_resolver_id = coResolverId;
      }

      // Add dismissal fields if dismissing
      if (resolutionType === 'dismissed') {
        updateData.dismissed = true;
        updateData.dismissed_at = new Date().toISOString();
        updateData.dismissed_reason = dismissalReason.trim() || 'No reason provided';
        if (resolverInfo) {
          updateData.dismissed_reason += ` (${resolverInfo})`;
        }
      } else {
        // Set resolution type to staff_resolved for resolved feedback
        updateData.resolution_type = 'staff_resolved';
        // Store resolver info if it's an employee resolution
        if (resolverInfo && selectedStaffMember.startsWith('employee-')) {
          updateData.resolution_notes = resolverInfo;
        }
      }

      // Add resolution message if provided
      if (resolutionMessage.trim()) {
        if (updateData.resolution_notes) {
          updateData.resolution_notes += ` | Resolution: ${resolutionMessage.trim()}`;
        } else {
          updateData.resolution_notes = resolutionMessage.trim();
        }
      }

      const { error } = await supabase
        .from('feedback')
        .update(updateData)
        .in('session_id', sessionIds);

      if (error) throw error;

      // Pass the actual staff ID (without prefix) to the parent function
      await onMarkResolved(sessionIds, resolvedById);
      onClose();
    } catch (error) {
      setAlertModal({
        type: 'error',
        title: 'Resolution Failed',
        message: 'Failed to mark feedback as resolved. Please try again.'
      });
    } finally {
      setIsResolving(false);
    }
  };
  
  const urgencyLevel = session.avg_rating <= 2 ? 'urgent' : 
                      session.avg_rating <= 3 && session.has_comments ? 'attention' : 'info';
  
  const urgencyConfig = {
    urgent: { 
      label: 'URGENT', 
      color: 'bg-red-600 text-white', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.95-.833-2.72 0L4.094 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    attention: { 
      label: 'ATTENTION', 
      color: 'bg-amber-600 text-white', 
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: { 
      label: 'INFORMATIONAL', 
      color: 'bg-blue-600 text-white', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };
  
  const urgency = urgencyConfig[urgencyLevel];
  
  const selectedStaff = staffMembers.find(s => {
    if (selectedStaffMember.startsWith('employee-')) {
      return s.source === 'employee' && String(s.id) === String(selectedStaffMember.replace('employee-', ''));
    }
    return false;
  });
  
  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      className="overflow-hidden"
    >
      <div className="space-y-0">
        {/* Professional Header */}
        <div className={`${urgency.bgColor} ${urgency.borderColor} border-b px-6 py-6 -mx-4 -mt-4 mb-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-200">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  {isPositiveFeedback(session) ? 'View Feedback' : 'Resolve Feedback'} - Table {session.table_number}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submitted {dayjs(session.created_at).fromNow()}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {session.items.length} response{session.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {session.avg_rating && (
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <StarRating rating={session.avg_rating} />
                </div>
              )}
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${urgency.color} shadow-md`}>
                {urgency.icon}
                {urgency.label}
              </span>
            </div>
          </div>
        </div>
        
        {/* Customer Responses */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold text-slate-900">Customer Responses</h4>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <div className="space-y-4">
            {session.items.map((item, index) => {
              const rating = getRowRating(item);
              const question = item.questions?.question || `Question ${index + 1}`;
              
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <h6 className="font-semibold text-slate-900 mb-1">
                        {question}
                      </h6>
                      <div className="text-xs text-slate-500 font-medium">
                        Response {index + 1} • {dayjs(item.created_at).format('MMM D, YYYY [at] h:mm A')}
                      </div>
                    </div>
                    {rating && (
                      <div className="flex-shrink-0">
                        <StarRating rating={rating} />
                      </div>
                    )}
                  </div>
                  
                  {item.additional_feedback && item.additional_feedback.trim() && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div>
                          <div className="text-xs font-semibold text-slate-700 mb-1">Customer Comment</div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            "{item.additional_feedback.trim()}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Multiple Sessions Alert */}
        {sessions.length > 1 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-amber-900 mb-1">Multiple Feedback Sessions</h5>
                <p className="text-sm text-amber-800 leading-relaxed">
                  This table has submitted <strong>{sessions.length} separate feedback sessions</strong>. 
                  Taking action will resolve all related sessions simultaneously.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Professional Resolution Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <h4 className="text-lg font-semibold text-slate-900">
              {isPositiveFeedback(session) ? 'Acknowledgment' : 'Resolution Actions'}
            </h4>
            <div className="h-px bg-slate-300 flex-1"></div>
          </div>
          
          {isPositiveFeedback(session) ? (
            // For positive feedback - just show clear button
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-emerald-900 mb-1">Positive Feedback Received</h5>
                    <p className="text-sm text-emerald-800">
                      This customer had a great experience! Simply acknowledge that you've seen this feedback.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={clearPositiveFeedback}
                disabled={isResolving}
                className="w-full px-6 py-3 rounded-xl font-bold transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg text-white disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {isResolving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Acknowledging...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Acknowledge & Clear Feedback
                  </span>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            // For negative feedback - show full resolution workflow
            <div className="space-y-6">
              {/* Action Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select Action Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  resolutionType === 'resolved' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="resolutionType"
                    value="resolved"
                    checked={resolutionType === 'resolved'}
                    onChange={(e) => setResolutionType(e.target.value)}
                    className="mt-1 mr-3 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-900">Mark as Resolved</div>
                      <div className="text-sm text-emerald-700 mt-1">Issue has been addressed and corrected</div>
                    </div>
                  </div>
                </label>
                <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  resolutionType === 'dismissed' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="resolutionType"
                    value="dismissed"
                    checked={resolutionType === 'dismissed'}
                    onChange={(e) => setResolutionType(e.target.value)}
                    className="mt-1 mr-3 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-amber-900">Acknowledge & Dismiss</div>
                      <div className="text-sm text-amber-700 mt-1">Reviewed but no action required</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Dismissal Reason */}
            {resolutionType === 'dismissed' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label htmlFor="dismissalReason" className="block text-sm font-semibold text-amber-900 mb-2">
                  Reason for Dismissal <span className="text-amber-600">*</span>
                </label>
                <textarea
                  id="dismissalReason"
                  value={dismissalReason}
                  onChange={(e) => setDismissalReason(e.target.value)}
                  placeholder="Please provide a clear reason for dismissing this feedback (e.g., 'Issue resolved through direct customer contact', 'Not actionable - outside our control', etc.)"
                  rows={3}
                  className="w-full px-3 py-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder-amber-500 text-sm"
                />
              </div>
            )}
            
            {/* Staff Member Selection */}
            <div>
              <label htmlFor="staffMember" className="block text-sm font-semibold text-slate-700 mb-3">
                Responsible Staff Member <span className="text-red-500">*</span>
              </label>
              
              <select
                id="staffMember"
                value={selectedStaffMember}
                onChange={(e) => setSelectedStaffMember(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium shadow-sm"
              >
                <option value="">Choose staff member...</option>
                
                {staffMembers.length === 0 && (
                  <option value="" disabled>No staff members found for this venue</option>
                )}
                
                {staffMembers.some(person => person.source === 'employee') && (
                  <optgroup label="Staff Members">
                    {staffMembers
                      .filter(person => person.source === 'employee')
                      .map(employee => (
                        <option key={`employee-${employee.id}`} value={`employee-${employee.id}`}>
                          {employee.display_name} ({employee.role_display})
                        </option>
                      ))
                    }
                  </optgroup>
                )}
              </select>
              {selectedStaff && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-slate-600">
                    <strong>{selectedStaff.display_name}</strong> ({selectedStaff.role_display})
                  </span>
                </div>
              )}
            </div>

            {/* Co-Resolver Section - Only show if feature is enabled and main resolver is selected */}
            {enableCoResolving && selectedStaffMember && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-4">
                  {/* Checkbox to enable co-resolver */}
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addCoResolver}
                      onChange={(e) => {
                        setAddCoResolver(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedCoResolver('');
                        }
                      }}
                      className="mt-1 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-blue-900">Add co-resolver</div>
                      <div className="text-xs text-blue-700 mt-1">Select a second staff member who helped resolve this issue</div>
                    </div>
                  </label>

                  {/* Co-resolver dropdown - only show if checkbox is checked */}
                  {addCoResolver && (
                    <div>
                      <label htmlFor="coResolver" className="block text-sm font-semibold text-slate-700 mb-2">
                        Co-Resolver <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="coResolver"
                        value={selectedCoResolver}
                        onChange={(e) => setSelectedCoResolver(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium shadow-sm"
                      >
                        <option value="">Choose co-resolver...</option>

                        {staffMembers.length === 0 && (
                          <option value="" disabled>No staff members found for this venue</option>
                        )}

                        {staffMembers.some(person => person.source === 'employee') && (
                          <optgroup label="Staff Members">
                            {staffMembers
                              .filter(person => {
                                // Exclude the main resolver from co-resolver options
                                const personId = `employee-${person.id}`;
                                return person.source === 'employee' && personId !== selectedStaffMember;
                              })
                              .map(employee => (
                                <option key={`employee-${employee.id}`} value={`employee-${employee.id}`}>
                                  {employee.display_name} ({employee.role_display})
                                </option>
                              ))
                            }
                          </optgroup>
                        )}
                      </select>
                      {selectedCoResolver && (() => {
                        const coResolverStaff = staffMembers.find(s => {
                          if (selectedCoResolver.startsWith('employee-')) {
                            return s.source === 'employee' && String(s.id) === String(selectedCoResolver.replace('employee-', ''));
                          }
                          return false;
                        });
                        return coResolverStaff ? (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-slate-600">
                              <strong>{coResolverStaff.display_name}</strong> ({coResolverStaff.role_display})
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resolution Message (Optional) - Only show for resolved type */}
            {resolutionType === 'resolved' && (
              <div>
                <label htmlFor="resolutionMessage" className="block text-sm font-semibold text-slate-700 mb-3">
                  Resolution Details <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  id="resolutionMessage"
                  value={resolutionMessage}
                  onChange={(e) => setResolutionMessage(e.target.value)}
                  placeholder="Describe how the issue was resolved (e.g., 'Spoke with kitchen manager, implemented new temperature checks', 'Provided fresh meal and discount coupon', etc.)"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-sm resize-none shadow-sm"
                  maxLength={500}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Help track what actions were taken to resolve similar issues in the future</span>
                  <span>{resolutionMessage.length}/500</span>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleMarkResolved}
                disabled={isResolving || !selectedStaffMember || (resolutionType === 'dismissed' && !dismissalReason.trim())}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg focus:outline-none ${
                  resolutionType === 'resolved' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                } disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none`}
              >
                {isResolving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {resolutionType === 'resolved' ? 'Resolving...' : 'Dismissing...'}
                  </span>
                ) : (
                  <>
                    {resolutionType === 'resolved' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mark as Resolved
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Dismiss Feedback
                      </span>
                    )}
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            </div>
            </div>
          )}
        </div>
      </div>
    </Modal>

    {/* Alert Modal */}
    {alertModal && (
      <AlertModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title}
        message={alertModal?.message}
        type={alertModal?.type}
      />
    )}
    </>
  );
};

export default FeedbackDetailModal;