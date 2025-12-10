import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const NPSResponse = () => {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [venue, setVenue] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [npsQuestion, setNpsQuestion] = useState('');
  const [selectedScore, setSelectedScore] = useState(null);
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!submissionId) {
          throw new Error('Invalid NPS link');
        }

        // Load NPS submission
        const { data: submissionData, error: submissionError } = await supabase
          .from('nps_submissions')
          .select('*, venues(*)')
          .eq('id', submissionId)
          .single();

        if (submissionError) throw submissionError;
        if (!submissionData) throw new Error('NPS submission not found');
        if (submissionData.responded_at) {
          setIsSubmitted(true);
          setSelectedScore(submissionData.score);
        }

        setSubmission(submissionData);
        setVenue(submissionData.venues);
        setNpsQuestion(submissionData.venues.nps_question || 'How likely are you to recommend us to a friend or colleague?');
        setError(null);
      } catch (err) {
        console.error('Error loading NPS:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [submissionId]);

  const handleScoreClick = (score) => {
    if (isSubmitted) return;
    setSelectedScore(score);
  };

  const handleSubmit = async () => {
    if (isSubmitted || selectedScore === null) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('nps_submissions')
        .update({
          score: selectedScore,
          feedback: additionalFeedback.trim() || null,
          responded_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting NPS:', err);
      setError('Failed to submit your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreLabel = (score) => {
    if (score === 0) return 'Not at all likely';
    if (score === 10) return 'Extremely likely';
    return score.toString();
  };

  const getCategoryFromScore = (score) => {
    if (score >= 9) return { label: 'Promoter', color: '#10b981' };
    if (score >= 7) return { label: 'Passive', color: '#f59e0b' };
    return { label: 'Detractor', color: '#ef4444' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-600 text-lg space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <div>Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-red-600 text-lg space-y-4 p-6">
        <div className="text-4xl">⚠️</div>
        <div className="text-center max-w-md">
          <div className="font-semibold mb-2">Unable to load NPS survey</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  const primary = venue?.primary_color || '#111827';
  const secondary = venue?.secondary_color || '#f3f4f6';

  // Thank you state after submission
  if (isSubmitted) {
    const isPromoter = selectedScore >= 9;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: secondary }}>
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-5 sm:p-8 text-center" style={{ color: primary }}>
          {venue?.logo && (
            <div className="mb-6 sm:mb-8">
              <img src={venue.logo} alt="Venue Logo" className="h-16 sm:h-20 mx-auto" />
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Thank you for your feedback!</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Your response helps us improve and serve you better.
          </p>

          {/* Review links - only show for promoters (9-10) */}
          {isPromoter && (venue?.google_review_link || venue?.tripadvisor_link) && (
            <div className="space-y-3 mt-8">
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-4">
                Would you like to share your experience publicly?
              </p>

              {venue?.google_review_link && (
                <a
                  href={venue.google_review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors active:scale-[0.98]"
                >
                  Leave a Google Review
                </a>
              )}

              {venue?.tripadvisor_link && (
                <a
                  href={venue.tripadvisor_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors active:scale-[0.98]"
                >
                  Review on TripAdvisor
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main NPS question
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: secondary }}>
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-5 sm:p-8" style={{ color: primary }}>
        {venue?.logo && (
          <div className="mb-5 sm:mb-6 text-center">
            <img src={venue.logo} alt="Venue Logo" className="h-12 sm:h-14 mx-auto" />
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center">We value your opinion</h2>
        <p className="text-base sm:text-xl text-center mb-6 sm:mb-8 text-gray-700">{npsQuestion}</p>

        {/* NPS Scale 0-10 */}
        <div className="mb-6">
          {/* Mobile: 2 rows layout */}
          <div className="sm:hidden">
            {/* Label above 0 */}
            <div className="text-xs text-gray-500 mb-2 text-left">Not at all likely</div>
            {/* First row: 0-5 */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => handleScoreClick(i)}
                  className="aspect-square flex items-center justify-center rounded-xl font-bold text-lg transition-all transform active:scale-95 border-2"
                  style={{
                    backgroundColor: selectedScore === i ? primary : 'white',
                    color: selectedScore === i ? 'white' : primary,
                    borderColor: primary,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            {/* Second row: 6-10 centered */}
            <div className="flex justify-center gap-2">
              {[6, 7, 8, 9, 10].map((i) => (
                <button
                  key={i}
                  onClick={() => handleScoreClick(i)}
                  className="w-[calc((100%-2rem)/6)] aspect-square flex items-center justify-center rounded-xl font-bold text-lg transition-all transform active:scale-95 border-2"
                  style={{
                    backgroundColor: selectedScore === i ? primary : 'white',
                    color: selectedScore === i ? 'white' : primary,
                    borderColor: primary,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            {/* Label below 10 */}
            <div className="text-xs text-gray-500 mt-2 text-right">Extremely likely</div>
          </div>

          {/* Desktop: single row */}
          <div className="hidden sm:block">
            {/* Labels above */}
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs text-gray-500">Not at all likely</span>
              <span className="text-xs text-gray-500">Extremely likely</span>
            </div>
            {/* Score buttons */}
            <div className="flex justify-between items-stretch gap-2">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleScoreClick(i)}
                  className="flex-1 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95 border-2"
                  style={{
                    backgroundColor: selectedScore === i ? primary : 'white',
                    color: selectedScore === i ? 'white' : primary,
                    borderColor: primary,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Additional feedback text box */}
        <div className="mb-6">
          <label className="block text-sm sm:text-base text-gray-700 mb-2 text-center">
            Would you like to share any additional feedback about your score?
          </label>
          <textarea
            value={additionalFeedback}
            onChange={(e) => setAdditionalFeedback(e.target.value)}
            placeholder="Optional - share your thoughts..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
            style={{ focusRing: primary }}
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={selectedScore === null || isSubmitting}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{
            backgroundColor: selectedScore !== null ? primary : '#d1d5db',
            color: selectedScore !== null ? 'white' : '#6b7280',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default NPSResponse;
