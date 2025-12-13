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
  
  const urgencyLevel = session.avg_rating !== null && session.avg_rating < 3 ? 'urgent' :
                      session.avg_rating !== null && session.avg_rating <= 4 ? 'attention' : 'info';
  
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
      <div>
        {/* Professional Header */}
        <div className={`${urgency.bgColor} ${urgency.borderColor} border-b px-6 py-5 -mx-4 -mt-4 mb-4`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 flex-shrink-0">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  Table {session.table_number}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>{dayjs(session.created_at).fromNow()}</span>
                  <span>•</span>
                  <span>{session.items.length} response{session.items.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {session.avg_rating && (
                <div className="bg-white rounded-lg px-2 py-1.5 shadow-sm border">
                  <StarRating rating={session.avg_rating} />
                </div>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${urgency.color} shadow-sm whitespace-nowrap`}>
                {urgency.icon}
                {urgency.label}
              </span>
            </div>
          </div>
        </div>
        
        {/* Customer Responses */}
        <div className="space-y-3 mb-5">
            {session.items.map((item, index) => {
              const rating = getRowRating(item);
              const question = item.questions?.question || `Question ${index + 1}`;

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h6 className="font-medium text-slate-900 text-sm truncate">
                        {question}
                      </h6>
                    </div>
                    {rating && (
                      <div className="flex-shrink-0">
                        <StarRating rating={rating} />
                      </div>
                    )}
                  </div>

                  {item.additional_feedback && item.additional_feedback.trim() && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        "{item.additional_feedback.trim()}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Multiple Sessions Alert - Compact */}
        {sessions.length > 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mt-4">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-amber-800">
              <strong>{sessions.length} sessions</strong> will be resolved together
            </span>
          </div>
        )}

        {/* Compact Resolution Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {isPositiveFeedback(session) ? (
            // For positive feedback - compact clear button
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Positive feedback - acknowledge to clear</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearPositiveFeedback}
                  disabled={isResolving}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:bg-slate-400"
                >
                  {isResolving ? 'Acknowledging...' : 'Acknowledge & Clear'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // For negative feedback - compact resolution workflow
            <div className="space-y-4">
              {/* Inline Action Type Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setResolutionType('resolved')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    resolutionType === 'resolved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Resolve
                </button>
                <button
                  onClick={() => setResolutionType('dismissed')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    resolutionType === 'dismissed'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Dismiss
                </button>
              </div>

              {/* Dismissal Reason - Compact */}
              {resolutionType === 'dismissed' && (
                <textarea
                  value={dismissalReason}
                  onChange={(e) => setDismissalReason(e.target.value)}
                  placeholder="Reason for dismissal..."
                  rows={2}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-amber-50 placeholder-amber-500 resize-none"
                />
              )}

              {/* Staff Member Selection - Compact */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Staff Member <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStaffMember}
                  onChange={(e) => setSelectedStaffMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select staff...</option>
                  {staffMembers.filter(p => p.source === 'employee').map(employee => (
                    <option key={`employee-${employee.id}`} value={`employee-${employee.id}`}>
                      {employee.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Co-Resolver - Compact inline */}
              {enableCoResolving && selectedStaffMember && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addCoResolver"
                    checked={addCoResolver}
                    onChange={(e) => {
                      setAddCoResolver(e.target.checked);
                      if (!e.target.checked) setSelectedCoResolver('');
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="addCoResolver" className="text-xs text-slate-600">Add co-resolver</label>
                  {addCoResolver && (
                    <select
                      value={selectedCoResolver}
                      onChange={(e) => setSelectedCoResolver(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                    >
                      <option value="">Select...</option>
                      {staffMembers
                        .filter(p => p.source === 'employee' && `employee-${p.id}` !== selectedStaffMember)
                        .map(employee => (
                          <option key={`employee-${employee.id}`} value={`employee-${employee.id}`}>
                            {employee.display_name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}

              {/* Resolution Notes - Compact, optional */}
              {resolutionType === 'resolved' && (
                <textarea
                  value={resolutionMessage}
                  onChange={(e) => setResolutionMessage(e.target.value)}
                  placeholder="Resolution notes (optional)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 resize-none"
                  maxLength={500}
                />
              )}

              {/* Action Buttons - Compact */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleMarkResolved}
                  disabled={isResolving || !selectedStaffMember || (resolutionType === 'dismissed' && !dismissalReason.trim())}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm text-white ${
                    resolutionType === 'resolved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  } disabled:bg-slate-400`}
                >
                  {isResolving ? 'Processing...' : (resolutionType === 'resolved' ? 'Mark Resolved' : 'Dismiss')}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50"
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