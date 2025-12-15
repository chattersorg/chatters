import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import FeedbackDetailModal from './FeedbackDetailModal';

dayjs.extend(relativeTime);

// Helper: try to pull a numeric rating from a row safely
const getRowRating = (row) => {
  // Prefer explicit fields if they exist, then fallback
  const cand = row.session_rating ?? row.rating ?? row.score ?? null;
  const num = typeof cand === 'number' ? cand : Number(cand);
  return Number.isFinite(num) ? num : null;
};

// Group raw rows -> one row per session_id
const groupBySession = (rows) => {
  const map = new Map();

  for (const r of rows) {
    const sid = r.session_id ?? r.sessionId;
    if (!sid) continue;

    const entry = map.get(sid) || {
      session_id: sid,
      table_number: r.table_number ?? r.tableNumber ?? ' - ',
      created_at: r.created_at,
      items_count: 0,
      ratings: [],
      has_comment: false,
      comments: [],
      last_question: null, // optional: show one question line
      raw_items: [], // Store raw feedback items for modal
    };

    // count
    entry.items_count += 1;

    // Store raw item for detailed view
    entry.raw_items.push(r);

    // latest timestamp
    if (!entry.created_at || new Date(r.created_at) > new Date(entry.created_at)) {
      entry.created_at = r.created_at;
    }

    // rating
    const rating = getRowRating(r);
    if (rating !== null) entry.ratings.push(rating);

    // comment presence
    const comment = r.additional_feedback?.trim();
    if (comment) {
      entry.has_comment = true;
      // keep a short list of unique comments (optional)
      if (!entry.comments.includes(comment)) entry.comments.push(comment);
    }

    // keep one question text if available (optional display)
    const q = r.questions?.question ?? r.question;
    if (q && !entry.last_question) entry.last_question = q;

    map.set(sid, entry);
  }

  // Finalise aggregates
  return Array.from(map.values()).map((e) => {
    const avg =
      e.ratings.length > 0
        ? e.ratings.reduce((a, b) => a + b, 0) / e.ratings.length
        : null;

    return {
      session_id: e.session_id,
      table_number: e.table_number,
      created_at: e.created_at,
      items_count: e.items_count,
      session_rating: avg, // overall score per session
      has_comment: e.has_comment,
      // keep a single preview comment (optional)
      additional_feedback: e.comments[0] ?? '',
      // keep one question to show (optional)
      question_preview: e.last_question ?? null,
      raw_items: e.raw_items, // For detailed modal
    };
  });
};

const getRatingColour = (rating) => {
  if (rating == null) return 'text-gray-600 bg-gray-50 border-gray-200';
  if (rating < 3) return 'text-red-600 bg-red-50 border-red-200';
  if (rating <= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-green-600 bg-green-50 border-green-200';
};

const getUrgency = ({ session_rating, has_comment }) => {
  if (session_rating != null && session_rating < 3) {
    return { label: 'URGENT', colour: 'bg-red-600 text-white', priority: 3 };
  }
  if (session_rating != null && session_rating <= 4 && has_comment) {
    return { label: 'ATTENTION', colour: 'bg-yellow-500 text-white', priority: 2 };
  }
  return { label: 'INFO', colour: 'bg-blue-500 text-white', priority: 1 };
};

const KioskFeedbackList = ({ 
  feedbackList, 
  selectedFeedback, 
  onFeedbackClick,
  onMarkResolved, // New prop for resolving feedback
  venueId // Add venueId prop
}) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);
  
  // Accepts raw rows (many per session) and reduces to one card per session.
  const sessions = React.useMemo(() => groupBySession(feedbackList || []), [feedbackList]);

  // Sort newest first
  const sorted = React.useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [sessions]
  );

  const handleShowDetails = (session, e) => {
    e.stopPropagation(); // Prevent triggering the navigation click
    setSelectedSessionForModal(session);
    setDetailModalOpen(true);
  };

  const handleLocationClick = (session) => {
    // This is the original navigation behaviour
    onFeedbackClick?.(session);
  };

  const handleMarkResolved = async (sessionIds, staffMember) => {
    if (onMarkResolved) {
      await onMarkResolved(sessionIds, staffMember);
      setDetailModalOpen(false);
      setSelectedSessionForModal(null);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8z" />
              </svg>
              <h3 className="font-medium text-blue-800">Active Feedback</h3>
            </div>
            {sorted.length > 0 && (
              <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full font-medium">
                {sorted.length}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {sorted.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No pending feedback at the moment</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active Alerts</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {sorted.length} alert{sorted.length !== 1 ? 's' : ''}
              </span>
            </div>

            {sorted.map((s) => {
              const urgency = getUrgency(s);

              // Determine background color based on rating
              const getBackgroundColor = (rating) => {
                if (rating == null) return 'bg-blue-50 border-blue-200';
                if (rating < 3) return 'bg-red-50 border-red-200'; // <3: Red
                if (rating <= 4) return 'bg-yellow-50 border-yellow-200'; // 3-4: Amber
                return 'bg-green-50 border-green-200'; // >4: Green
              };

              return (
                <div
                  key={s.session_id}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    selectedFeedback?.session_id === s.session_id
                      ? 'border-blue-500 shadow-md'
                      : 'hover:border-gray-400'
                  } ${getBackgroundColor(s.session_rating)}`}
                >
                  {/* Header / urgency */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900">
                        Table {s.table_number}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgency.colour}`}>
                        {urgency.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {s.created_at ? dayjs(s.created_at).fromNow() : ''}
                    </span>
                  </div>

                  {/* Overall rating */}
                  {s.session_rating != null && (
                    <div
                      className={`inline-block px-2 py-1 rounded border text-sm font-medium mb-2 ${getRatingColour(
                        s.session_rating
                      )}`}
                    >
                      Rating: {s.session_rating.toFixed(1)}/5
                    </div>
                  )}

                  {/* Optional single question preview */}
                  {s.question_preview && (
                    <p className="text-sm font-medium text-gray-700 mb-1">{s.question_preview}</p>
                  )}

                  {/* Optional feedback preview */}
                  {s.additional_feedback && (
                    <p className="text-sm text-gray-600 italic">"{s.additional_feedback}"</p>
                  )}

                  {/* Multiple items indicator */}
                  {s.items_count > 1 && (
                    <div className="mt-2 text-xs text-gray-500">
                      +{s.items_count - 1} more item{s.items_count > 2 ? 's' : ''} in this session
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => handleShowDetails(s, e)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Details
                    </button>
                    
                    <button
                      onClick={() => handleLocationClick(s)}
                      className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location
                    </button>
                  </div>

                  {/* Visual priority bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                      urgency.priority === 3 ? 'bg-red-600' : urgency.priority === 2 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedSessionForModal && (
        <FeedbackDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedSessionForModal(null);
          }}
          feedbackItems={selectedSessionForModal.raw_items}
          onMarkResolved={handleMarkResolved}
          venueId={venueId}
        />
      )}
    </>
  );
};

export default KioskFeedbackList;