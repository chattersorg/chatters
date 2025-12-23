import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  X,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Users,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

dayjs.extend(relativeTime);

// Helper to safely get rating
const getRowRating = (row) => {
  const cand = row.session_rating ?? row.rating ?? row.score ?? null;
  const num = typeof cand === 'number' ? cand : Number(cand);
  return Number.isFinite(num) ? num : null;
};

const StarRating = ({ rating, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (rating == null) {
    return <span className="text-gray-400 text-sm">No rating</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
      <span className="text-white font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
};

const FeedbackDetailModal = ({
  isOpen,
  onClose,
  item,
  venueId,
  onResolved
}) => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [resolutionType, setResolutionType] = useState('resolved');
  const [dismissalReason, setDismissalReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState(null);
  const [enableCoResolving, setEnableCoResolving] = useState(false);
  const [addCoResolver, setAddCoResolver] = useState(false);
  const [selectedCoResolver, setSelectedCoResolver] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedStaff('');
      setResolutionType('resolved');
      setDismissalReason('');
      setResolutionNotes('');
      setAddCoResolver(false);
      setSelectedCoResolver('');
      setError(null);
      loadStaffMembers();
    }
  }, [isOpen, venueId]);

  const loadStaffMembers = async () => {
    if (!venueId) return;
    setLoadingStaff(true);

    try {
      // Load venue settings for co-resolver feature
      const { data: venueData } = await supabase
        .from('venues')
        .select('enable_co_resolving')
        .eq('id', venueId)
        .single();

      setEnableCoResolving(venueData?.enable_co_resolving || false);

      // Load active employees for this venue
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role, is_active')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('first_name');

      if (empError) {
        console.error('Error loading employees:', empError);
      }

      setStaffMembers(employees || []);
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  if (!isOpen || !item) return null;

  const isFeedback = item.type === 'feedback';
  // Use min_rating if available, otherwise fall back to avg_rating for positive check
  const ratingForPositiveCheck = item.min_rating ?? item.avg_rating;
  const isPositiveFeedback = isFeedback && ratingForPositiveCheck !== null && ratingForPositiveCheck > 3;

  // Determine urgency based on LOWEST individual rating (not average)
  const getUrgencyInfo = () => {
    if (!isFeedback) {
      return {
        label: item.status === 'pending' ? 'URGENT' : 'Acknowledged',
        bgColor: 'bg-orange-500/20',
        textColor: 'text-orange-400',
        borderColor: 'border-orange-500/30'
      };
    }
    // Use min_rating for urgency (lowest individual rating in session)
    const urgencyRating = item.min_rating ?? item.avg_rating;
    if (urgencyRating !== null && urgencyRating < 3) {
      return {
        label: 'URGENT',
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30'
      };
    }
    if (urgencyRating !== null && urgencyRating <= 4) {
      return {
        label: 'ATTENTION',
        bgColor: 'bg-yellow-500/20',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30'
      };
    }
    return {
      label: 'INFORMATIONAL',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30'
    };
  };

  const urgency = getUrgencyInfo();

  // Handle clearing positive feedback (no staff needed)
  const handleClearPositive = async () => {
    setIsResolving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('feedback')
        .update({
          is_actioned: true,
          resolved_at: new Date().toISOString(),
          resolution_type: 'positive_feedback_cleared'
        })
        .eq('session_id', item.session_id);

      if (updateError) throw updateError;

      onResolved();
      onClose();
    } catch (err) {
      console.error('Error clearing feedback:', err);
      setError('Failed to clear feedback. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle resolving feedback with staff attribution
  const handleResolveFeedback = async () => {
    if (!selectedStaff) {
      setError('Please select a staff member');
      return;
    }

    if (resolutionType === 'dismissed' && !dismissalReason.trim()) {
      setError('Please provide a reason for dismissal');
      return;
    }

    if (enableCoResolving && addCoResolver && !selectedCoResolver) {
      setError('Please select a co-resolver or uncheck the option');
      return;
    }

    setIsResolving(true);
    setError(null);

    try {
      const updateData = {
        is_actioned: true,
        resolved_at: new Date().toISOString(),
        resolved_by: selectedStaff,
        resolution_type: resolutionType === 'resolved' ? 'staff_resolved' : 'dismissed'
      };

      // Add co-resolver if selected
      if (enableCoResolving && addCoResolver && selectedCoResolver) {
        updateData.co_resolver_id = selectedCoResolver;
      }

      // Add dismissal details
      if (resolutionType === 'dismissed') {
        updateData.dismissed = true;
        updateData.dismissed_at = new Date().toISOString();
        updateData.dismissed_reason = dismissalReason.trim();
      }

      // Add resolution notes
      if (resolutionNotes.trim()) {
        updateData.resolution_notes = resolutionNotes.trim();
      }

      const { error: updateError } = await supabase
        .from('feedback')
        .update(updateData)
        .eq('session_id', item.session_id);

      if (updateError) throw updateError;

      onResolved();
      onClose();
    } catch (err) {
      console.error('Error resolving feedback:', err);
      setError('Failed to resolve feedback. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle resolving assistance request
  const handleResolveAssistance = async () => {
    setIsResolving(true);
    setError(null);

    try {
      const updateData = {
        status: 'resolved',
        resolved_at: new Date().toISOString()
      };

      // Add staff attribution if selected
      if (selectedStaff) {
        updateData.resolved_by = selectedStaff;
      }

      const { error: updateError } = await supabase
        .from('assistance_requests')
        .update(updateData)
        .eq('id', item.id);

      if (updateError) throw updateError;

      onResolved();
      onClose();
    } catch (err) {
      console.error('Error resolving assistance:', err);
      setError('Failed to resolve request. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const getStaffDisplayName = (staff) => {
    return `${staff.first_name} ${staff.last_name}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b ${urgency.borderColor} ${urgency.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                {isFeedback ? (
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Table {item.table_number}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {dayjs(item.created_at).fromNow()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${urgency.bgColor} ${urgency.textColor}`}>
                {urgency.label}
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Feedback Details */}
          {isFeedback ? (
            <>
              {/* Overall Rating */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Average Rating</span>
                  <StarRating rating={item.avg_rating} size="lg" />
                </div>
              </div>

              {/* Individual Responses */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Responses ({item.items?.length || 0})
                </h3>
                {item.items?.map((feedback, idx) => {
                  const rating = getRowRating(feedback);
                  const question = feedback.questions?.question || `Question ${idx + 1}`;
                  const comment = feedback.additional_feedback || feedback.comment;

                  return (
                    <div key={feedback.id || idx} className="bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-white font-medium flex-1">{question}</p>
                        {rating !== null && <StarRating rating={rating} size="sm" />}
                      </div>
                      {comment && comment.trim() && (
                        <div className="bg-gray-600/50 rounded-lg p-3 mt-2">
                          <p className="text-gray-300 text-sm italic">"{comment.trim()}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Assistance Request Details */
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                <span className="text-lg font-semibold text-white capitalize">
                  {item.request_type?.replace(/_/g, ' ') || 'Assistance needed'}
                </span>
              </div>
              {item.notes && (
                <p className="text-gray-300 bg-gray-600/50 rounded-lg p-3">
                  {item.notes}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <span>Status:</span>
                <span className={`font-medium ${
                  item.status === 'pending' ? 'text-orange-400' : 'text-blue-400'
                }`}>
                  {item.status === 'pending' ? 'Pending' : 'Acknowledged'}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/80">
          {isFeedback && isPositiveFeedback ? (
            /* Positive Feedback - Simple Clear */
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Positive feedback - acknowledge to clear</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClearPositive}
                  disabled={isResolving}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {isResolving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Acknowledge & Clear
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isFeedback ? (
            /* Negative/Neutral Feedback - Full Resolution */
            <div className="space-y-4">
              {/* Resolution Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setResolutionType('resolved')}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                    resolutionType === 'resolved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  Resolve
                </button>
                <button
                  onClick={() => setResolutionType('dismissed')}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                    resolutionType === 'dismissed'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  Dismiss
                </button>
              </div>

              {/* Dismissal Reason */}
              {resolutionType === 'dismissed' && (
                <textarea
                  value={dismissalReason}
                  onChange={(e) => setDismissalReason(e.target.value)}
                  placeholder="Reason for dismissal..."
                  rows={2}
                  className="w-full px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-white placeholder-amber-500/50 resize-none"
                />
              )}

              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <User className="w-4 h-4 inline-block mr-1" />
                  Staff Member <span className="text-red-400">*</span>
                </label>
                {loadingStaff ? (
                  <div className="flex items-center gap-2 text-gray-400 py-3">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading staff...
                  </div>
                ) : staffMembers.length === 0 ? (
                  <p className="text-gray-400 text-sm py-2">No staff members found for this venue</p>
                ) : (
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white appearance-none cursor-pointer"
                  >
                    <option value="">Select staff member...</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {getStaffDisplayName(staff)} {staff.role ? `(${staff.role})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Co-Resolver */}
              {enableCoResolving && selectedStaff && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="coResolver"
                    checked={addCoResolver}
                    onChange={(e) => {
                      setAddCoResolver(e.target.checked);
                      if (!e.target.checked) setSelectedCoResolver('');
                    }}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="coResolver" className="text-sm text-gray-400">
                    <Users className="w-4 h-4 inline-block mr-1" />
                    Add co-resolver
                  </label>
                  {addCoResolver && (
                    <select
                      value={selectedCoResolver}
                      onChange={(e) => setSelectedCoResolver(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                      <option value="">Select...</option>
                      {staffMembers
                        .filter((s) => String(s.id) !== String(selectedStaff))
                        .map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {getStaffDisplayName(staff)}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}

              {/* Resolution Notes */}
              {resolutionType === 'resolved' && (
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Resolution notes (optional)..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 resize-none"
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleResolveFeedback}
                  disabled={isResolving || !selectedStaff}
                  className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                    resolutionType === 'resolved'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {isResolving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : resolutionType === 'resolved' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  {isResolving ? 'Processing...' : resolutionType === 'resolved' ? 'Mark Resolved' : 'Dismiss'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Assistance Request Resolution */
            <div className="space-y-4">
              {/* Optional Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <User className="w-4 h-4 inline-block mr-1" />
                  Staff Member (optional)
                </label>
                {loadingStaff ? (
                  <div className="flex items-center gap-2 text-gray-400 py-3">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading staff...
                  </div>
                ) : (
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white appearance-none cursor-pointer"
                  >
                    <option value="">Select staff member (optional)...</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {getStaffDisplayName(staff)} {staff.role ? `(${staff.role})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleResolveAssistance}
                  disabled={isResolving}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {isResolving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Mark Resolved
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetailModal;
