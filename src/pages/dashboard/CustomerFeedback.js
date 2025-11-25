import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Star } from 'lucide-react';
import AlertModal from '../../components/ui/AlertModal';

const CustomerFeedbackPage = () => {
  const { venueId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [venue, setVenue] = useState(null);
  const [activeTables, setActiveTables] = useState([]);
  const [sessionId] = useState(uuidv4());
  const [tableNumber, setTableNumber] = useState('');
  const [current, setCurrent] = useState(0);
  const [feedbackAnswers, setFeedbackAnswers] = useState([]);
  const [freeText, setFreeText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackUnavailable, setFeedbackUnavailable] = useState(false);
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const [alertModal, setAlertModal] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Utility function to check if current time is within feedback hours
  const isFeedbackTimeAllowed = (feedbackHours) => {
    if (!feedbackHours) return true; // If no hours set, allow feedback anytime
    
    try {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const dayConfig = feedbackHours[currentDay];
      if (!dayConfig || !dayConfig.enabled) {
        return false; // Feedback disabled for this day
      }
      
      // Check if current time falls within any of the allowed periods
      return dayConfig.periods.some(period => {
        const { start, end } = period;
        
        // Handle overnight hours (e.g., 22:00 to 02:00)
        if (start > end) {
          return currentTime >= start || currentTime <= end;
        } else {
          return currentTime >= start && currentTime <= end;
        }
      });
    } catch (error) {
      console.error('Error checking feedback time:', error);
      // If there's an error checking time, default to allowing feedback
      return true;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data for venueId:', venueId);
        console.log('VenueId type:', typeof venueId);
        
        // Load venue data first (including feedback_hours, review links, NPS settings, branding colors, assistance message, and thank you message)
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('logo, primary_color, background_color, background_image, text_color, button_text_color, feedback_hours, google_review_link, tripadvisor_link, nps_enabled, assistance_title, assistance_message, assistance_icon, thank_you_title, thank_you_message, thank_you_icon')
          .eq('id', venueId);

        if (venueError) {
          console.error('Venue error:', venueError);
          throw new Error(`Failed to load venue: ${venueError.message}`);
        }

        console.log('Raw venue data:', venueData);
        console.log('Venue data length:', venueData?.length);

        // Handle multiple or no venues found
        if (!venueData || venueData.length === 0) {
          throw new Error(`Venue not found with ID: ${venueId}`);
        }
        
        if (venueData.length > 1) {
          console.warn(`Multiple venues found with ID ${venueId}, using the first one`);
        }

        // Use the first venue (or only venue)
        const venue = venueData[0];

        // Check if feedback is currently allowed
        const feedbackAllowed = isFeedbackTimeAllowed(venue.feedback_hours);
        if (!feedbackAllowed) {
          setFeedbackUnavailable(true);
          setVenue(venue);
          setLoading(false);
          return;
        }

        // Load questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('venue_id', venueId)
          .eq('active', true)
          .order('order');

        if (questionsError) {
          console.error('Questions error:', questionsError);
          throw new Error(`Failed to load questions: ${questionsError.message}`);
        }

        // Load active tables from floor plan
        const { data: tablesData, error: tablesError } = await supabase
          .from('table_positions')
          .select('table_number')
          .eq('venue_id', venueId)
          .order('table_number');

        if (tablesError) {
          console.error('Tables error:', tablesError);
          // Don't throw error here, just log it and continue with empty tables
          console.warn('Could not load tables, continuing without table selection');
        }

        console.log('Questions loaded:', questionsData?.length || 0);
        console.log('Venue loaded:', venue ? 'success' : 'failed');
        console.log('Tables loaded:', tablesData?.length || 0);
        console.log('Raw tables data:', tablesData);

        if (!questionsData || questionsData.length === 0) {
          throw new Error('No active questions found for this venue');
        }

        setQuestions(questionsData);
        setVenue(venue);
        
        // Process and sort tables numerically
        if (tablesData && tablesData.length > 0) {
          const sortedTables = tablesData
            .map(t => t.table_number)
            .filter(Boolean) // Remove any null/empty table numbers
            .sort((a, b) => {
              // Handle mixed alphanumeric sorting
              const aNum = parseInt(a);
              const bNum = parseInt(b);

              // If both are numbers, sort numerically
              if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
              }

              // Otherwise, sort alphabetically
              return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            });

          console.log('Sorted tables after filter:', sortedTables);
          setActiveTables(sortedTables);
        } else {
          console.log('No tables data or empty array, setting activeTables to []');
          setActiveTables([]);
        }
        
        setError(null);

      } catch (err) {
        console.error('Error loading feedback form:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      loadData();
    } else {
      setError('No venue ID provided');
      setLoading(false);
    }
  }, [venueId]);

  const handleStarAnswer = (rating) => {
    const question = questions[current];
    setFeedbackAnswers(prev => [...prev, {
      venue_id: venueId,
      question_id: question.id,
      session_id: sessionId,
      sentiment: null, // No emoji sentiment for stars
      rating,
      table_number: tableNumber || null,
    }]);

    if (current < questions.length - 1) setCurrent(current + 1);
    else setCurrent(-1); // Move to free-text input
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const entries = [...feedbackAnswers];
      if (freeText.trim()) {
        entries.push({
          venue_id: venueId,
          question_id: null,
          sentiment: null,
          rating: null,
          additional_feedback: freeText,
          table_number: tableNumber || null,
          session_id: sessionId,
        });
      }

      // Create feedback session if email provided (for NPS)
      if (customerEmail.trim()) {
        const { error: sessionError } = await supabase
          .from('feedback_sessions')
          .insert({
            id: sessionId,
            venue_id: venueId,
            table_number: tableNumber || null,
            started_at: new Date().toISOString()
          });

        if (sessionError) {
          console.error('Error creating feedback session:', sessionError);
        }

        // Check if venue has NPS enabled and if customer is within cooldown
        const { data: venueData } = await supabase
          .from('venues')
          .select('nps_enabled, nps_delay_hours, nps_cooldown_hours')
          .eq('id', venueId)
          .single();

        if (venueData?.nps_enabled) {
          // Check cooldown using the database function
          const { data: canSend } = await supabase
            .rpc('check_nps_cooldown', {
              p_venue_id: venueId,
              p_customer_email: customerEmail.trim().toLowerCase(),
              p_cooldown_hours: venueData.nps_cooldown_hours
            });

          if (canSend) {
            // Schedule NPS email
            const scheduledSendAt = new Date();
            scheduledSendAt.setHours(scheduledSendAt.getHours() + venueData.nps_delay_hours);

            const { error: npsError } = await supabase
              .from('nps_submissions')
              .insert({
                venue_id: venueId,
                session_id: sessionId,
                customer_email: customerEmail.trim().toLowerCase(),
                scheduled_send_at: scheduledSendAt.toISOString()
              });

            if (npsError) {
              console.error('Error scheduling NPS email:', npsError);
            }
          }
        }
      }

      const { error } = await supabase.from('feedback').insert(entries);
      if (error) {
        console.error('Error submitting feedback:', error);
        setAlertModal({
          type: 'error',
          title: 'Submission Failed',
          message: 'Failed to submit feedback. Please try again.'
        });
        return;
      }

      setIsFinished(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setAlertModal({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if all feedback ratings are positive (≥4)
  const isAllFeedbackPositive = () => {
    // Get only feedback with actual ratings (not free text)
    const ratedFeedback = feedbackAnswers.filter(feedback => feedback.rating !== null);
    
    // If no rated feedback, don't show review prompt (only free text submitted)
    if (ratedFeedback.length === 0) return false;
    
    // Check ALL ratings are 4 or above (4-star and 5-star)
    return ratedFeedback.every(feedback => feedback.rating >= 4);
  };

  const handleAssistanceRequest = async () => {
    if (assistanceLoading || !tableNumber) {
      console.log('Assistance request blocked:', { assistanceLoading, tableNumber });
      return;
    }

    setAssistanceLoading(true);
    
    try {
      const requestData = {
        venue_id: venueId,
        table_number: parseInt(tableNumber),
        status: 'pending',
        message: 'Just need assistance - Our team will be right with you'
      };
      
      console.log('Submitting assistance request for:', requestData);
      console.log('Current timestamp:', new Date().toISOString());
      console.log('Venue ID type:', typeof venueId, venueId);
      console.log('Table number type:', typeof parseInt(tableNumber), parseInt(tableNumber));

      // Test Supabase connection and permissions
      const { data: testData, error: testError } = await supabase
        .from('assistance_requests')
        .select('count', { count: 'exact', head: true })
        .eq('venue_id', venueId);
      
      console.log('Supabase connection test:', { testData, testError });
      
      // Test if we can read existing records
      const { data: readTest, error: readError } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('venue_id', venueId)
        .limit(1);
        
      console.log('Read permission test:', { readTest, readError });

      // Use the exact same approach as feedback submission
      const { data, error } = await supabase
        .from('assistance_requests')
        .insert([requestData])
        .select();

      console.log('Assistance request response:', { data, error });

      if (error) {
        console.error('Error requesting assistance:', error);
        setAlertModal({
          type: 'error',
          title: 'Assistance Request Failed',
          message: `Failed to request assistance: ${error.message}. Please try again.`
        });
        return;
      }

      if (!data || data.length === 0) {
        console.warn('Warning: No data returned from assistance request insertion');
        console.log('Full response details:', { data, error });
        
        // Let's try a verification query to see if it was actually inserted
        const { data: verifyData, error: verifyError } = await supabase
          .from('assistance_requests')
          .select('*')
          .eq('venue_id', venueId)
          .eq('table_number', parseInt(tableNumber))
          .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
          .order('created_at', { ascending: false })
          .limit(1);
          
        console.log('Verification query result:', { verifyData, verifyError });
        
        if (verifyData && verifyData.length > 0) {
          console.log('✅ Record found in verification query - insertion was successful!');
        } else {
          console.error('❌ Record not found in verification query - insertion may have failed silently');
        }
      }

      console.log('Assistance request submitted successfully:', data);
      setAssistanceRequested(true);
    } catch (err) {
      console.error('Error requesting assistance:', err);
      setAlertModal({
        type: 'error',
        title: 'Assistance Request Failed',
        message: `Failed to request assistance: ${err.message}. Please try again.`
      });
    } finally {
      setAssistanceLoading(false);
    }
  };

  // Helper function to get background style
  const getBackgroundStyle = () => {
    const backgroundImage = venue?.background_image;
    const backgroundColor = venue?.background_color || '#ffffff';

    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return { backgroundColor };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-600 text-lg space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <div>Loading feedback form...</div>
        <div className="text-sm text-gray-400">Venue ID: {venueId}</div>
      </div>
    );
  }

  // Feedback unavailable state (outside of allowed hours)
  if (feedbackUnavailable) {
    const textColor = venue?.text_color || '#111827';

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={getBackgroundStyle()}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          {venue?.logo && (
            <div className="mb-8">
              <img src={venue.logo} alt="Venue Logo" className="h-16 mx-auto" />
            </div>
          )}

          <div className="text-6xl mb-6">🕒</div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: textColor }}>Feedback Currently Unavailable</h2>
          <p className="text-base mb-8" style={{ color: textColor, opacity: 0.8 }}>
            We're not accepting feedback at the moment. Please try again during our service hours.
          </p>

          <div className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
            Thank you for your interest in providing feedback!
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={getBackgroundStyle()}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <div>
            <div className="font-semibold mb-2 text-lg text-custom-red">Unable to load feedback form</div>
            <div className="text-sm text-gray-600 mb-4">{error}</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-custom-blue text-white rounded-lg hover:bg-custom-blue-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isFinished) {
    const showReviewPrompt = isAllFeedbackPositive() &&
                            (venue?.google_review_link || venue?.tripadvisor_link);
    const primary = venue?.primary_color || '#111827';
    const background = venue?.background_color || '#ffffff';
    const textColor = venue?.text_color || '#111827';
    const buttonTextColor = venue?.button_text_color || '#ffffff';

    if (showReviewPrompt) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={getBackgroundStyle()}>
          <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
            {venue?.logo && (
              <div className="mb-8">
                <img src={venue.logo} alt="Venue Logo" className="h-16 mx-auto" />
              </div>
            )}

            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: textColor }}>Thanks for your positive feedback!</h2>
            <p className="text-base mb-8" style={{ color: textColor, opacity: 0.8 }}>
              We're so glad you had a great experience! Would you mind sharing your positive experience with others?
            </p>

            <div className="space-y-4">
              {venue?.google_review_link && (
                <a
                  href={venue.google_review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 px-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
                  style={{ backgroundColor: primary, color: buttonTextColor }}
                >
                  Leave a Google Review
                </a>
              )}

              {venue?.tripadvisor_link && (
                <a
                  href={venue.tripadvisor_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 px-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
                  style={{ backgroundColor: primary, color: buttonTextColor }}
                >
                  Review on TripAdvisor
                </a>
              )}

              <button
                onClick={() => window.close()}
                className="block w-full py-3 px-4 rounded-xl font-medium hover:opacity-80 transition-all mt-4 border-2"
                style={{
                  borderColor: textColor,
                  color: textColor,
                  opacity: 0.7,
                }}
              >
                No thanks, close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default success state for non-positive feedback or no review links
    const thankYouEmoji = venue?.thank_you_icon || '✅';
    const thankYouTitle = venue?.thank_you_title || 'Thanks for your feedback!';
    const thankYouMessage = venue?.thank_you_message || 'Your response has been submitted successfully.';

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={getBackgroundStyle()}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center space-y-6">
          <div className="text-6xl">{thankYouEmoji}</div>
          <div className="text-2xl font-bold" style={{ color: textColor }}>{thankYouTitle}</div>
          <div className="text-base" style={{ color: textColor, opacity: 0.7 }}>{thankYouMessage}</div>
        </div>
      </div>
    );
  }

  // Assistance requested state
  if (assistanceRequested) {
    const primary = venue?.primary_color || '#111827';
    const textColor = venue?.text_color || '#111827';

    // Get custom assistance message settings with defaults
    const assistanceTitle = venue?.assistance_title || 'Help is on the way!';
    const assistanceMessage = venue?.assistance_message || 'We\'ve notified our team that you need assistance. Someone will be with you shortly.';
    const assistanceEmoji = venue?.assistance_icon || '🙋';

    // Replace {table} placeholder with actual table number in both title and message
    const formattedTitle = assistanceTitle.replace(/\{table\}/g, tableNumber);
    const formattedMessage = assistanceMessage.replace(/\{table\}/g, tableNumber);

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={getBackgroundStyle()}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          {venue?.logo && (
            <div className="mb-8">
              <img src={venue.logo} alt="Venue Logo" className="h-16 mx-auto" />
            </div>
          )}

          <div className="text-6xl mb-6">
            {assistanceEmoji}
          </div>

          <h2 className="text-2xl font-bold mb-4" style={{ color: textColor }}>{formattedTitle}</h2>
          <p className="text-base mb-8" style={{ color: textColor, opacity: 0.8 }}>
            {formattedMessage}
          </p>

          <div className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
            You can close this page now.
          </div>
        </div>
      </div>
    );
  }

  const primary = venue.primary_color || '#111827';
  const background = venue.background_color || '#ffffff';
  const textColor = venue.text_color || '#111827';
  const buttonTextColor = venue.button_text_color || '#ffffff';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={getBackgroundStyle()}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        {venue.logo && (
          <div className="mb-8">
            <img src={venue.logo} alt="Venue Logo" className="h-20 mx-auto" />
          </div>
        )}

        <div className="text-center">
        {!hasStarted ? (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: textColor }}>Welcome!</h2>

            {/* Email input - optional but prominent - only show if NPS is enabled */}
            {venue?.nps_enabled && (
              <div className="mb-6 text-left">
                <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                  Email <span style={{ color: textColor, opacity: 0.6 }}>(optional)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border-2 px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                  style={{
                    borderColor: primary,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: textColor,
                  }}
                />
                <p className="text-xs mt-2" style={{ color: textColor, opacity: 0.7 }}>
                  Share your email to help us follow up and improve your experience
                </p>
              </div>
            )}

            <div className="mb-8 text-left">
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                Table Number {activeTables.length === 0 && <span style={{ color: textColor, opacity: 0.6 }}>(optional)</span>}
              </label>
              {activeTables.length > 0 ? (
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border-2 px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                  style={{
                    borderColor: primary,
                    backgroundColor: tableNumber ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    color: tableNumber ? buttonTextColor : '#9ca3af',
                    opacity: tableNumber ? 1 : 0.85,
                  }}
                >
                  <option value="" style={{ color: '#9ca3af', opacity: 0.7 }}>Choose your table</option>
                  {activeTables.map((tableNum) => (
                    <option key={tableNum} value={tableNum} style={{ color: buttonTextColor, backgroundColor: '#ffffff' }}>
                      {tableNum}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter your table number"
                  className="w-full border-2 px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                  style={{
                    borderColor: primary,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: textColor,
                  }}
                />
              )}
            </div>

            <button
              onClick={() => setHasStarted(true)}
              disabled={activeTables.length > 0 && !tableNumber}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{ backgroundColor: primary, color: buttonTextColor }}
            >
              Continue
            </button>
          </div>
        ) : current >= 0 ? (
          <div>
            <div className="mb-6">
              <div className="text-sm mb-2 font-medium" style={{ color: textColor, opacity: 0.7 }}>
                Question {current + 1} of {questions.length}
              </div>
              <div className="w-full rounded-full h-3" style={{ backgroundColor: `${textColor}20` }}>
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${((current + 1) / questions.length) * 100}%`,
                    backgroundColor: primary
                  }}
                ></div>
              </div>
            </div>

            {/* Show selected table */}
            {tableNumber && (
              <div className="mb-4 text-sm font-medium" style={{ color: textColor, opacity: 0.8 }}>
                Feedback for Table {tableNumber}
              </div>
            )}

            <h2 className="text-2xl font-bold mb-8" style={{ color: textColor }}>{questions[current].question}</h2>
            
            {/* Star rating system */}
            <div className="space-y-8">
              <div className="flex justify-center items-center space-x-3 px-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex flex-col items-center">
                    <button
                      onClick={() => handleStarAnswer(rating)}
                      className="p-3 rounded-full hover:scale-110 transition transform active:scale-95 flex items-center justify-center shadow-md"
                      style={{
                        backgroundColor: `${primary}15`,
                      }}
                    >
                      <Star
                        className="w-9 h-9 sm:w-11 sm:h-11"
                        style={{ color: primary }}
                        fill={primary}
                      />
                    </button>
                    <span className="text-sm mt-2 font-medium" style={{ color: textColor }}>
                      {rating}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm mb-2 font-medium" style={{ color: textColor, opacity: 0.8 }}>Tap a star to rate</p>
                <div className="flex justify-center space-x-6 text-xs" style={{ color: textColor, opacity: 0.6 }}>
                  <span>1 = Poor</span>
                  <span>5 = Excellent</span>
                </div>
              </div>

              {/* Assistance Request Button */}
              <div className="pt-6 mt-6" style={{ borderTop: `2px solid ${textColor}20` }}>
                <p className="text-sm mb-3 text-center" style={{ color: textColor, opacity: 0.8 }}>Don't want to leave feedback right now?</p>
                <button
                  onClick={handleAssistanceRequest}
                  disabled={assistanceLoading}
                  className="w-full py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border-2 shadow-md"
                  style={{
                    backgroundColor: `${primary}10`,
                    borderColor: primary,
                    color: primary,
                  }}
                >
                  {assistanceLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: primary }}></div>
                      Requesting...
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="font-bold">Just need assistance?</div>
                      <div className="text-xs opacity-80">Our team will be right with you</div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: textColor }}>
              Anything else you'd like to tell us? <span className="text-sm font-normal" style={{ opacity: 0.6 }}>(Optional)</span>
            </h2>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={5}
              placeholder="Leave any additional comments (optional)..."
              className="w-full p-4 border-2 rounded-xl text-base mb-6 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
              style={{
                borderColor: primary,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: textColor,
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primary, color: buttonTextColor }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title}
        message={alertModal?.message}
        type={alertModal?.type}
      />
    </div>
  );
};

export default CustomerFeedbackPage;