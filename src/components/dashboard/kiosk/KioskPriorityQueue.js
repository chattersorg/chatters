import React, { useState, useMemo } from 'react';
import { HandHeart, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import FeedbackDetailModal from './FeedbackDetailModal';
import AssistanceResolveModal from './AssistanceResolveModal';

dayjs.extend(relativeTime);

// Helper to safely get rating
const getRowRating = (row) => {
  const cand = row.session_rating ?? row.rating ?? row.score ?? null;
  const num = typeof cand === 'number' ? cand : Number(cand);
  return Number.isFinite(num) ? num : null;
};

// Group feedback items by session
// Uses MIN rating (lowest individual response) to determine urgency
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

      // Use MIN rating for urgency - any single bad rating triggers urgent status
      const minRating = ratings.length > 0 ? Math.min(...ratings) : null;

      const hasComments = session.items.some(item =>
        item.additional_feedback && item.additional_feedback.trim()
      );

      // Urgency based on MINIMUM rating: <3 = urgent (3), 3-4 = attention (2), >4 = good (1)
      const urgency = minRating !== null && minRating < 3 ? 3 : (minRating !== null && minRating <= 4) ? 2 : 1;

      return {
        ...session,
        type: 'feedback',
        avg_rating: avgRating,
        min_rating: minRating,
        has_comments: hasComments,
        urgency: urgency,
      };
    });
};

const KioskPriorityQueue = ({ 
  feedbackList, 
  assistanceRequests,
  selectedFeedback, 
  onFeedbackClick,
  onLocationClick,
  onMarkResolved,
  onAssistanceAction,
  venueId
}) => {
  const [selectedFeedbackForModal, setSelectedFeedbackForModal] = useState(null);
  const [selectedAssistanceForModal, setSelectedAssistanceForModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);

  // Group feedback by sessions
  const feedbackSessions = useMemo(() => groupBySession(feedbackList || []), [feedbackList]);

  // Add urgency to assistance requests
  const assistanceWithUrgency = useMemo(() => 
    assistanceRequests.map(request => ({
      ...request,
      type: 'assistance',
      urgency: request.status === 'pending' ? 4 : 2, // pending assistance is highest priority
    })), [assistanceRequests]
  );

  // Combine and sort by urgency, then by time
  const priorityQueue = useMemo(() => {
    const combined = [...feedbackSessions, ...assistanceWithUrgency];
    return combined.sort((a, b) => {
      // First sort by urgency (higher urgency first)
      if (a.urgency !== b.urgency) {
        return b.urgency - a.urgency;
      }
      // Then by time (newer first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [feedbackSessions, assistanceWithUrgency]);

  const handleFeedbackDetails = (session) => {
    setSelectedFeedbackForModal(session);
    setShowFeedbackModal(true);
  };

  const handleAssistanceDetails = (request) => {
    setSelectedAssistanceForModal(request);
    setShowAssistanceModal(true);
  };

  const handleFeedbackModalClose = () => {
    setSelectedFeedbackForModal(null);
    setShowFeedbackModal(false);
  };

  const handleAssistanceModalClose = () => {
    setSelectedAssistanceForModal(null);
    setShowAssistanceModal(false);
  };

  const handleResolveWithNotes = async (requestId, notes, employeeId) => {
    await onAssistanceAction(requestId, 'resolve', notes, employeeId);
    handleAssistanceModalClose();
  };

  const handleAcknowledge = async (requestId, employeeId) => {
    await onAssistanceAction(requestId, 'acknowledge', null, employeeId);
    handleAssistanceModalClose();
  };

  const handleFeedbackResolution = async (sessionIds, staffMember) => {
    await onMarkResolved(sessionIds, staffMember);
    handleFeedbackModalClose();
  };

  const getUrgencyColor = (item) => {
    if (item.type === 'assistance') {
      switch (item.status) {
        case 'pending': return 'border-orange-500 bg-orange-100 border-2';
        case 'acknowledged': return 'border-orange-400 bg-orange-50 border-2';
        default: return 'border-green-300 bg-green-50';
      }
    } else {
      // Feedback - color by min rating (urgency level)
      if (item.urgency === 3) return 'border-red-500 bg-red-100 border-2'; // Min rating <3: Red URGENT
      if (item.urgency === 2) return 'border-yellow-500 bg-yellow-100 border-2'; // Min rating 3-4: Amber ATTENTION
      return 'border-green-500 bg-green-100 border-2'; // Min rating >4: Green POSITIVE
    }
  };

  const getUrgencyBadge = (item) => {
    if (item.type === 'assistance') {
      const colors = {
        pending: 'bg-red-500 text-white',
        acknowledged: 'bg-yellow-500 text-white',
        resolved: 'bg-green-500 text-white'
      };
      return {
        text: item.status.toUpperCase(),
        className: colors[item.status] || 'bg-gray-500 text-white'
      };
    } else {
      // Feedback - based on min rating (urgency level)
      if (item.urgency === 3) return { text: 'URGENT', className: 'bg-red-500 text-white' }; // Min <3
      if (item.urgency === 2) return { text: 'ATTENTION', className: 'bg-yellow-500 text-white' }; // Min 3-4
      return { text: 'POSITIVE', className: 'bg-green-500 text-white' }; // Min >4
    }
  };

  const getIcon = (item) => {
    if (item.type === 'assistance') {
      switch (item.status) {
        case 'pending': return <AlertTriangle className="w-4 h-4 text-red-500" />;
        case 'acknowledged': return <Clock className="w-4 h-4 text-yellow-500" />;
        default: return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
    } else {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
        </svg>
      );
    }
  };

  if (priorityQueue.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
          <div>
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 text-lg">All caught up!</p>
            <p className="text-sm text-gray-500 mt-2">No pending feedback or assistance requests</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Priority Queue */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50">
        <div className="p-3 space-y-3">
          {priorityQueue.map((item) => {
            const badge = getUrgencyBadge(item);
            const colorClass = getUrgencyColor(item);
            
            return (
              <div
                key={`${item.type}-${item.id || item.session_id}`}
                className={`rounded-lg p-2 ${colorClass} mb-2`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">Table {item.table_number}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {dayjs(item.created_at).fromNow()}
                  </span>
                </div>

                {item.type === 'assistance' ? (
                  <p className="text-xs text-gray-700 mb-2 truncate">{item.message}</p>
                ) : (
                  item.avg_rating && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-gray-700">Rating:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3 h-3 ${star <= item.avg_rating ? 'text-amber-400' : 'text-gray-200'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                        <span className="text-xs font-medium text-gray-700 ml-1">{item.avg_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )
                )}

                <div className="flex gap-1">
                  {item.type === 'assistance' ? (
                    (item.status === 'pending' || item.status === 'acknowledged') && (
                      <>
                        <button
                          onClick={() => handleAssistanceDetails(item)}
                          className={`flex-1 font-medium px-2 py-1 rounded text-xs ${
                            item.status === 'pending' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {item.status === 'pending' ? 'Handle' : 'Resolve'}
                        </button>
                        <button
                          onClick={() => onLocationClick(item)}
                          className="flex-1 font-medium px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded"
                        >
                          Location
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => handleFeedbackDetails(item)}
                        className="flex-1 font-medium px-2 py-1 bg-blue-600 text-white text-xs rounded"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => onLocationClick(item)}
                        className="flex-1 font-medium px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded"
                      >
                        Location
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedbackForModal && (
        <FeedbackDetailModal
          isOpen={showFeedbackModal}
          onClose={handleFeedbackModalClose}
          feedbackItems={selectedFeedbackForModal.items}
          onMarkResolved={handleFeedbackResolution}
          venueId={venueId}
        />
      )}

      {/* Assistance Resolution Modal */}
      <AssistanceResolveModal
        request={selectedAssistanceForModal}
        isVisible={showAssistanceModal}
        onResolve={handleResolveWithNotes}
        onAcknowledge={handleAcknowledge}
        onCancel={handleAssistanceModalClose}
        venueId={venueId}
      />
    </div>
  );
};

export default KioskPriorityQueue;