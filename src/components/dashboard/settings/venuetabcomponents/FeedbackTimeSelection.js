import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../utils/supabase';
import { ChevronDown, ChevronUp, Copy, Plus, X } from 'lucide-react';
import { Button } from '../../../ui/button';

const FeedbackTimeSelection = ({ currentVenueId }) => {
  // Feedback hours state
  const [feedbackHours, setFeedbackHours] = useState({
    monday: { enabled: true, periods: [{ start: '09:00', end: '22:00' }] },
    tuesday: { enabled: true, periods: [{ start: '09:00', end: '22:00' }] },
    wednesday: { enabled: true, periods: [{ start: '09:00', end: '22:00' }] },
    thursday: { enabled: true, periods: [{ start: '09:00', end: '22:00' }] },
    friday: { enabled: true, periods: [{ start: '09:00', end: '22:00' }] },
    saturday: { enabled: true, periods: [{ start: '09:00', end: '22:00' }] },
    sunday: { enabled: true, periods: [{ start: '09:00', end: '22:00' }] }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedDays, setExpandedDays] = useState({});

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Fetch feedback hours on component mount
  useEffect(() => {
    if (currentVenueId) {
      fetchFeedbackHours();
    }
  }, [currentVenueId]);

  const fetchFeedbackHours = async () => {
    try {
      if (!currentVenueId) {
        console.error('No venue ID provided');
        return;
      }

      const { data: venue } = await supabase
        .from('venues')
        .select('feedback_hours')
        .eq('id', currentVenueId)
        .single();

      if (venue?.feedback_hours) {
        setFeedbackHours(venue.feedback_hours);
      }
    } catch (error) {
      console.error('Error fetching feedback hours:', error);
    }
  };

  // Feedback hours utility functions
  const validateTime = (time) => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const roundToQuarterHour = (time) => {
    if (!validateTime(time)) return time;
    const [hours, minutes] = time.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      return `${String((hours + 1) % 24).padStart(2, '0')}:00`;
    }
    return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
  };

  const updateFeedbackHours = (day, field, value, periodIndex = 0) => {
    setFeedbackHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: field === 'enabled' ? value : prev[day][field],
        periods: field === 'enabled' ? prev[day].periods : 
          prev[day].periods.map((period, index) => 
            index === periodIndex ? { ...period, [field]: roundToQuarterHour(value) } : period
          )
      }
    }));
  };

  const addPeriod = (day) => {
    setFeedbackHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        periods: [...prev[day].periods, { start: '12:00', end: '18:00' }]
      }
    }));
  };

  const removePeriod = (day, periodIndex) => {
    if (feedbackHours[day].periods.length <= 1) return;
    setFeedbackHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        periods: prev[day].periods.filter((_, index) => index !== periodIndex)
      }
    }));
  };

  const copyToAllDays = (sourceDay) => {
    const sourceConfig = feedbackHours[sourceDay];
    const newConfig = {};
    dayNames.forEach(day => {
      newConfig[day] = { 
        enabled: sourceConfig.enabled,
        periods: [...sourceConfig.periods] // Deep copy the periods array
      };
    });
    setFeedbackHours(newConfig);
  };

  const toggleDayExpansion = (day) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const formatTimeRange = (periods) => {
    if (!periods || periods.length === 0) return '';
    return periods.map(p => `${p.start}-${p.end}`).join(', ');
  };

  const saveFeedbackHours = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!currentVenueId) {
        throw new Error('No venue selected');
      }

      const { error } = await supabase
        .from('venues')
        .update({ feedback_hours: feedbackHours })
        .eq('id', currentVenueId);

      if (error) throw error;

      setMessage('Feedback hours saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error saving feedback hours:', error);
      // Show detailed error info to user for support purposes
      const errorDetails = error.code ? `Error ${error.code}: ${error.message}` : error.message;
      setMessage(`Failed to save feedback hours: ${errorDetails}. Please contact support with this error code.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Feedback Collection Hours</h3>
        <p className="text-sm text-gray-500 mt-1">Set when customers can leave feedback</p>
      </div>

      <div className="p-6">
      {/* Compact table-like view */}
      <div className="space-y-2">
        {dayNames.map((day, dayIndex) => (
          <div key={day} className="border border-gray-200 rounded-lg">
            {/* Day header row */}
            <div className="flex items-center justify-between p-3 hover:bg-gray-50">
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="checkbox"
                  checked={feedbackHours[day].enabled}
                  onChange={(e) => updateFeedbackHours(day, 'enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="min-w-[60px]">
                  <span className="text-sm font-medium text-gray-900">
                    {dayLabels[dayIndex]}
                  </span>
                </div>
                
                {feedbackHours[day].enabled && (
                  <div className="flex-1 text-sm text-gray-600">
                    {formatTimeRange(feedbackHours[day].periods)}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {feedbackHours[day].enabled && (
                  <>
                    <button
                      onClick={() => copyToAllDays(day)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="Copy to all days"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleDayExpansion(day)}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title={expandedDays[day] ? "Collapse" : "Expand"}
                    >
                      {expandedDays[day] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Expanded time controls */}
            {feedbackHours[day].enabled && expandedDays[day] && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <div className="space-y-2">
                  {feedbackHours[day].periods.map((period, periodIndex) => (
                    <div key={periodIndex} className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={period.start}
                        onChange={(e) => updateFeedbackHours(day, 'start', e.target.value, periodIndex)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <input
                        type="time"
                        value={period.end}
                        onChange={(e) => updateFeedbackHours(day, 'end', e.target.value, periodIndex)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      
                      {feedbackHours[day].periods.length > 1 && (
                        <button
                          onClick={() => removePeriod(day, periodIndex)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remove period"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={() => addPeriod(day)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add break time</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            const allEnabled = {};
            dayNames.forEach(day => {
              allEnabled[day] = { enabled: true, periods: [{ start: '09:00', end: '22:00' }] };
            });
            setFeedbackHours(allEnabled);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
        >
          Enable All Days
        </button>
        <button
          onClick={() => {
            const allDisabled = {};
            dayNames.forEach(day => {
              allDisabled[day] = { enabled: false, periods: [{ start: '09:00', end: '22:00' }] };
            });
            setFeedbackHours(allDisabled);
          }}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          Disable All Days
        </button>
      </div>
      </div>

      {/* Save button and messages */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">Changes are saved per venue</div>
          <Button
            variant="primary"
            onClick={saveFeedbackHours}
            loading={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {message && (
          <div className={`text-xs p-2 rounded-lg mt-3 ${
            message.includes('success')
              ? 'text-green-700 bg-green-50 border border-green-200'
              : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackTimeSelection;