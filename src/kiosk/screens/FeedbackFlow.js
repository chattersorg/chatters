import React, { useState, useEffect, useCallback } from 'react';
import { useKiosk } from '../context/KioskContext';
import { supabase } from '../../utils/supabase';
import { Star, ArrowLeft, ArrowRight, Check, Loader2, X } from 'lucide-react';

// Inactivity timeout (30 seconds)
const INACTIVITY_TIMEOUT = 30000;
// Auto-return to idle after completion (5 seconds)
const COMPLETION_TIMEOUT = 5000;

const FeedbackFlow = ({ onComplete, onCancel }) => {
  const { venueId, venueConfig } = useKiosk();

  // Flow state
  const [step, setStep] = useState('rating'); // rating | comment | complete
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Inactivity timer
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity
  const resetInactivityTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Check for inactivity
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && step !== 'complete') {
        onCancel();
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastActivity, step, onCancel]);

  // Auto-complete timeout
  useEffect(() => {
    if (step === 'complete') {
      const timer = setTimeout(() => {
        onComplete();
      }, COMPLETION_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  // Handle touch/mouse events for activity tracking
  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();

    document.addEventListener('touchstart', handleActivity);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);

    return () => {
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, [resetInactivityTimer]);

  const handleRatingSelect = (selectedRating) => {
    setRating(selectedRating);
    resetInactivityTimer();

    // Auto-advance after short delay
    setTimeout(() => {
      setStep('comment');
    }, 300);
  };

  const handleSubmit = async () => {
    if (!rating) return;

    setIsSubmitting(true);
    setError(null);
    resetInactivityTimer();

    try {
      const { error: submitError } = await supabase
        .from('feedback')
        .insert({
          venue_id: venueId,
          rating,
          comment: comment.trim() || null,
          source: 'kiosk',
          created_at: new Date().toISOString(),
        });

      if (submitError) throw submitError;

      setStep('complete');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipComment = () => {
    resetInactivityTimer();
    handleSubmit();
  };

  const primaryColor = venueConfig?.primaryColor || '#000000';

  // Rating step
  if (step === 'rating') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button
            onClick={onCancel}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
          <div className="text-sm text-gray-400">
            Step 1 of 2
          </div>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            How was your experience?
          </h1>
          <p className="text-xl text-gray-500 mb-12 text-center">
            Tap a star to rate us
          </p>

          {/* Star Rating */}
          <div className="flex gap-4 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingSelect(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-2 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-16 h-16 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating labels */}
          <div className="flex justify-between w-full max-w-md text-sm text-gray-400">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>
    );
  }

  // Comment step
  if (step === 'comment') {
    const getRatingMessage = () => {
      if (rating >= 4) return "Great! What did you love?";
      if (rating >= 3) return "Thanks! Any suggestions?";
      return "Sorry to hear that. What could we improve?";
    };

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button
            onClick={() => setStep('rating')}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div className="text-sm text-gray-400">
            Step 2 of 2
          </div>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-8">
          {/* Rating display */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {getRatingMessage()}
          </h1>

          {/* Comment input */}
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              resetInactivityTimer();
            }}
            placeholder="Share your thoughts (optional)..."
            className="w-full flex-1 max-h-64 p-6 text-xl border-2 border-gray-200 rounded-2xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              resize-none"
            autoFocus
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSkipComment}
              disabled={isSubmitting}
              className="flex-1 py-5 text-lg font-semibold text-gray-600 bg-gray-100 rounded-xl
                hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ backgroundColor: primaryColor }}
              className="flex-1 py-5 text-lg font-semibold text-white rounded-xl
                hover:opacity-90 disabled:opacity-50 transition-colors
                flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete step
  if (step === 'complete') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8">
          <Check className="w-12 h-12" style={{ color: primaryColor }} />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          Thank you!
        </h1>
        <p className="text-2xl text-white/80 text-center">
          Your feedback helps us improve
        </p>

        <div className="mt-12 text-white/60 text-lg">
          Returning to home...
        </div>
      </div>
    );
  }

  return null;
};

export default FeedbackFlow;
