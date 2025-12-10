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

  const handleScoreClick = async (score) => {
    if (isSubmitted) return;

    setSelectedScore(score);

    try {
      const { error } = await supabase
        .from('nps_submissions')
        .update({
          score,
          responded_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting NPS:', err);
      setError('Failed to submit your response. Please try again.');
      setSelectedScore(null);
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
    const category = getCategoryFromScore(selectedScore);

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: secondary }}>
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-5 sm:p-8 text-center" style={{ color: primary }}>
          {venue?.logo && (
            <div className="mb-5 sm:mb-6">
              <img src={venue.logo} alt="Venue Logo" className="h-12 sm:h-14 mx-auto" />
            </div>
          )}

          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎉</div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Thank you for your feedback!</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Your response helps us improve and serve you better.
          </p>

          {/* Show their score */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Your rating</div>
            <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: category.color }}>
              {selectedScore}/10
            </div>
            <div className="text-sm font-medium" style={{ color: category.color }}>
              {category.label}
            </div>
          </div>

          {/* Review links */}
          {(venue?.google_review_link || venue?.tripadvisor_link) && (
            <div className="space-y-3">
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
        <div className="mb-4">
          {/* Mobile: 2 rows layout */}
          <div className="grid grid-cols-6 gap-2 sm:hidden">
            {[...Array(11)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleScoreClick(i)}
                className={`aspect-square flex items-center justify-center rounded-xl font-bold text-lg transition-all transform active:scale-95 border-2 ${i === 10 ? 'col-span-1' : ''}`}
                style={{
                  backgroundColor: selectedScore === i ? primary : 'white',
                  color: selectedScore === i ? 'white' : primary,
                  borderColor: primary,
                }}
              >
                {i}
              </button>
            ))}
            {/* Empty cell to balance the grid */}
            <div className="aspect-square"></div>
          </div>

          {/* Desktop: single row */}
          <div className="hidden sm:flex justify-between items-stretch gap-2">
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

          {/* Labels */}
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="text-xs text-gray-500">Not at all likely</span>
            <span className="text-xs text-gray-500">Extremely likely</span>
          </div>
        </div>

        {/* Category indicators */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 text-xs text-gray-600 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>0-6 Detractors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>7-8 Passives</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>9-10 Promoters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NPSResponse;
