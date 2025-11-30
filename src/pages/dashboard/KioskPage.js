import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AlertModal from '../../components/ui/AlertModal';

// Kiosk components
import KioskFloorPlan from '../../components/dashboard/kiosk/KioskFloorPlan';
import KioskZoneOverview from '../../components/dashboard/kiosk/KioskZoneOverview';
import KioskPriorityQueue from '../../components/dashboard/kiosk/KioskPriorityQueue';

dayjs.extend(relativeTime);

// Helper to get rating from feedback item
const getRowRating = (row) => {
  const cand = row.session_rating ?? row.rating ?? row.score ?? null;
  const num = typeof cand === 'number' ? cand : Number(cand);
  return Number.isFinite(num) ? num : null;
};

// Group feedback by session and calculate priority
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
      const ratings = session.items
        .map(item => getRowRating(item))
        .filter(rating => rating !== null);

      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;

      return {
        ...session,
        type: 'feedback',
        avg_rating: avgRating,
        urgency: avgRating !== null && avgRating < 3 ? 3 : (avgRating !== null && avgRating <= 4) ? 2 : 1,
      };
    });
};

const KioskPage = () => {
  const { venueId, venueName, loading: venueLoading } = useVenue();

  // State
  const [zones, setZones] = useState([]);
  const [tables, setTables] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [feedbackList, setFeedbackList] = useState({ items: [], sessionCount: 0 });
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [assistanceMap, setAssistanceMap] = useState({});
  const [currentView, setCurrentView] = useState('overview'); // 'overview' or zone id
  const [inactivityTimer, setInactivityTimer] = useState(null); // kept for easy re-enable
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(2); // Default 2 hours
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [alertModal, setAlertModal] = useState(null);
  const hasAutoNavigated = useRef(false);

  // ==== AUTO-RETURN (10s) — DISABLED ====
  // useEffect(() => {
  //   if (currentView !== 'overview') {
  //     const timer = setTimeout(() => {
  //       setCurrentView('overview');
  //       setSelectedFeedback(null);
  //     }, 10000);
  //     setInactivityTimer(timer);
  //     return () => clearTimeout(timer);
  //   }
  // }, [currentView]);

  // Reset inactivity timer on user interaction — DISABLED
  const resetInactivityTimer = () => {
    // if (inactivityTimer) clearTimeout(inactivityTimer);
    // if (currentView !== 'overview') {
    //   const timer = setTimeout(() => {
    //     setCurrentView('overview');
    //     setSelectedFeedback(null);
    //   }, 10000);
    //   setInactivityTimer(timer);
    // }
  };

  // Initial data load
  useEffect(() => {
    if (!venueId || venueLoading) return;
    const load = async () => {
      await loadVenueSettings(venueId);
      await loadZones(venueId);
      await loadTables(venueId);
      await fetchFeedback(venueId);
      await fetchAssistanceRequests(venueId);
    };
    load();
  }, [venueId, venueLoading]);

  // Real-time feedback and assistance updates
  useEffect(() => {
    if (!venueId) return;


    const channel = supabase
      .channel(`kiosk_updates_${venueId}`) // More specific channel name
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'feedback', 
          filter: `venue_id=eq.${venueId}` 
        },
        (payload) => {
          fetchFeedback(venueId);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'feedback', 
          filter: `venue_id=eq.${venueId}` 
        },
        (payload) => {
          fetchFeedback(venueId);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'assistance_requests', 
          filter: `venue_id=eq.${venueId}` 
        },
        (payload) => {
          fetchAssistanceRequests(venueId);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'assistance_requests', 
          filter: `venue_id=eq.${venueId}` 
        },
        (payload) => {
          fetchAssistanceRequests(venueId);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Real-time subscription error - falling back to polling
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [venueId]);

  // Fallback polling in case real-time doesn't work
  useEffect(() => {
    if (!venueId) return;

    const pollInterval = setInterval(() => {
      fetchFeedback(venueId);
      fetchAssistanceRequests(venueId);
    }, 30000); // Poll every 30 seconds as fallback

    return () => clearInterval(pollInterval);
  }, [venueId]);

  // Calculate the most important/urgent item and its zone
  const mostUrgentItem = useMemo(() => {
    // Group feedback by session
    const feedbackSessions = groupBySession(feedbackList.items || []);

    // Add urgency to assistance requests (pending = highest priority)
    const assistanceWithUrgency = assistanceRequests.map(request => ({
      ...request,
      type: 'assistance',
      urgency: request.status === 'pending' ? 4 : 2,
    }));

    // Combine and sort by urgency, then by time
    const combined = [...feedbackSessions, ...assistanceWithUrgency];
    const sorted = combined.sort((a, b) => {
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return sorted[0] || null;
  }, [feedbackList.items, assistanceRequests]);

  // Get the zone for the most urgent item
  const mostUrgentZone = useMemo(() => {
    if (!mostUrgentItem || tables.length === 0) return null;

    const table = tables.find(t => String(t.table_number) === String(mostUrgentItem.table_number));
    return table?.zone_id || null;
  }, [mostUrgentItem, tables]);

  // Auto-navigate to the most urgent zone on initial load
  useEffect(() => {
    if (!hasAutoNavigated.current && mostUrgentZone && currentView === 'overview') {
      hasAutoNavigated.current = true;
      setCurrentView(mostUrgentZone);

      // Also select the most urgent item for highlighting
      if (mostUrgentItem) {
        if (mostUrgentItem.type === 'assistance') {
          setSelectedFeedback({
            table_number: mostUrgentItem.table_number,
            session_id: `assistance-${mostUrgentItem.id}`,
            type: 'assistance'
          });
        } else {
          setSelectedFeedback(mostUrgentItem);
        }
      }
    }
  }, [mostUrgentZone, mostUrgentItem, currentView]);

  // Data loading
  const loadVenueSettings = async (venueId) => {
    const { data, error } = await supabase
      .from('venues')
      .select('session_timeout_hours')
      .eq('id', venueId)
      .single();
    
    if (!error && data) {
      setSessionTimeoutHours(data.session_timeout_hours || 2); // Default to 2 hours if not set
    }
  };

  const loadZones = async (venueId) => {
    const { data } = await supabase
      .from('zones')
      .select('*')
      .eq('venue_id', venueId)
      .order('order');
    setZones(data || []);
  };

  const loadTables = async (venueId) => {
    const { data } = await supabase
      .from('table_positions')
      .select('*')
      .eq('venue_id', venueId);
    if (!data) return;

    // Keep whatever coords exist; KioskFloorPlan will use x_percent/y_percent
    // against a fixed world, or fallback to x_px/y_px.
    setTables(data);
  };

  const fetchFeedback = async (venueId) => {
    const now = dayjs();
    const cutoff = now.subtract(sessionTimeoutHours, 'hour').toISOString();

    const { data, error } = await supabase
      .from('feedback')
      .select('*, questions(question)')
      .eq('venue_id', venueId)
      .eq('is_actioned', false) // Only show unresolved feedback
      .gt('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (error) {
      return;
    }

    const sessionMap = {};
    const latestSession = {};
    const ratings = {};
    const feedbackItems = [];
    const uniqueSessions = new Set();

    for (const entry of data || []) {
      const table = entry.table_number;
      if (!table) continue;

      // Store all feedback items for detailed modal view
      feedbackItems.push(entry);
      
      // Track unique sessions for count
      if (entry.session_id) {
        uniqueSessions.add(entry.session_id);
      }

      // Build latest session per table for the map (only track most recent session per table)
      if (!latestSession[table] || new Date(entry.created_at) > new Date(latestSession[table])) {
        latestSession[table] = entry.created_at;
        sessionMap[table] = [entry];
      } else if (entry.session_id === sessionMap[table][0]?.session_id) {
        // Add to current latest session if same session_id
        sessionMap[table].push(entry);
      }
    }

    // Average rating per table (visual indicator on floorplan)
    for (const table in sessionMap) {
      const valid = sessionMap[table].filter((e) => e.rating !== null && e.rating !== undefined);
      ratings[table] =
        valid.length > 0 ? valid.reduce((a, b) => a + Number(b.rating || 0), 0) / valid.length : null;
    }

    setFeedbackMap(ratings);
    // Store both raw items and session count
    setFeedbackList({ items: feedbackItems, sessionCount: uniqueSessions.size });
  };

  const fetchAssistanceRequests = async (venueId) => {
    const now = dayjs();
    const cutoff = now.subtract(sessionTimeoutHours, 'hour').toISOString();


    // First, let's see ALL assistance requests for this venue (no filters)
    const { data: allData, error: allError } = await supabase
      .from('assistance_requests')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });


    // Temporary fix: Remove staff joins to get basic functionality working
    const { data, error } = await supabase
      .from('assistance_requests')
      .select('*')
      .eq('venue_id', venueId)
      .in('status', ['pending', 'acknowledged']) // Only show unresolved requests
      .gt('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (error) {
      // Error fetching assistance requests
    }

    // Build assistance map for table coloring (table_number -> status)
    const assistanceTableMap = {};
    for (const request of data || []) {
      const tableNum = request.table_number;
      if (!assistanceTableMap[tableNum] || request.status === 'pending') {
        // Prioritize pending over acknowledged
        assistanceTableMap[tableNum] = request.status;
      }
    }

    setAssistanceRequests(data || []);
    setAssistanceMap(assistanceTableMap);
  };

  // Mark feedback as resolved
  const handleMarkResolved = async (sessionIds, staffMember) => {
    try {
      // Update all feedback items for the given session IDs
      const { error } = await supabase
        .from('feedback')
        .update({
          is_actioned: true,
          resolved_by: staffMember,
          resolved_at: new Date().toISOString()
        })
        .in('session_id', sessionIds);

      if (error) {
        throw error;
      }

      // Refresh feedback data
      await fetchFeedback(venueId);
      
      // Clear selected feedback if it was resolved
      if (selectedFeedback && sessionIds.includes(selectedFeedback.session_id)) {
        setSelectedFeedback(null);
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Handle assistance request actions
  const handleAssistanceAction = async (requestId, action, notes = null, employeeId = null) => {
    try {
      // Use the provided employee ID from the modal
      
      const now = new Date().toISOString();
      const updates = {
        status: action === 'acknowledge' ? 'acknowledged' : 'resolved'
      };

      // Set the correct timestamp field based on action
      if (action === 'acknowledge') {
        updates.acknowledged_at = now;
        if (employeeId) {
          updates.acknowledged_by = employeeId;
        }
      } else if (action === 'resolve') {
        updates.resolved_at = now;
        if (employeeId) {
          updates.resolved_by = employeeId;
        }
        if (notes) {
          updates.notes = notes;
        }
      }


      const { data, error } = await supabase
        .from('assistance_requests')
        .update(updates)
        .eq('id', requestId)
        .select(); // Add select to see what was updated

      if (error) {
        setAlertModal({
          type: 'error',
          title: 'Request Failed',
          message: `Failed to ${action} request: ${error.message}`
        });
        return false;
      }


      // Refresh assistance requests
      await fetchAssistanceRequests(venueId);
      return true;
    } catch (error) {
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: error.message
      });
      return false;
    }
  };

  // Event handlers
  const handleZoneSelect = (zoneId) => {
    setCurrentView(zoneId);
    resetInactivityTimer(); // no-op while disabled
  };

  const handleFeedbackClick = (feedback) => {
    setSelectedFeedback(feedback);

    const table = tables.find((t) => t.table_number === feedback.table_number);
    if (table && table.zone_id) {
      setCurrentView(table.zone_id);
    }
    resetInactivityTimer(); // no-op while disabled
  };

  const handleLocationClick = (item) => {
    // For both assistance and feedback, set as selected to highlight the table
    if (item.type === 'assistance') {
      // Create a feedback-like object for table highlighting
      setSelectedFeedback({
        table_number: item.table_number,
        session_id: `assistance-${item.id}`,
        type: 'assistance'
      });
    } else {
      setSelectedFeedback(item);
    }

    // Navigate to the table's zone (handle both string and number types)
    const table = tables.find((t) => String(t.table_number) === String(item.table_number));
    
    if (table && table.zone_id) {
      setCurrentView(table.zone_id);
    }
    
    resetInactivityTimer(); // no-op while disabled
  };

  const handleTableClick = (tableNumber) => {
    const feedbackItems = feedbackList.items || [];
    const tableFeedback = feedbackItems.filter((f) => f.table_number === tableNumber);
    if (tableFeedback.length > 0) {
      setSelectedFeedback(tableFeedback[0]); // most recent
    }
    resetInactivityTimer(); // no-op while disabled
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedFeedback(null);
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
  };

  const handleExitKiosk = () => {
    setExitConfirmation(true);
  };

  const confirmExitKiosk = () => {
    setExitConfirmation(false);
    window.close();
  };

  // Loading state
  if (venueLoading || !venueId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kiosk mode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden" onClick={resetInactivityTimer}>
      {/* Left Sidebar - Tabbed Lists - Fixed height, scrollable content */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Staff View</h1>
              <p className="text-sm text-gray-600">{venueName}</p>
            </div>
            <button
              onClick={handleExitKiosk}
              className="text-gray-400 hover:text-gray-600 text-xl"
              title="Exit Kiosk Mode"
            >
              ×
            </button>
          </div>
        </div>

        {/* Priority Queue Header - Fixed */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-red-50 flex-shrink-0">
          <div className="px-5 py-4">
            <div className="mb-3">
              <h3 className="font-bold text-gray-900">Queue</h3>
              <p className="text-xs text-gray-600">Urgent feedback first, then assistance requests</p>
            </div>
            <div className="flex gap-3">
              {feedbackList.sessionCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                  <span className="text-xs text-gray-600">{feedbackList.sessionCount} feedback sessions</span>
                </div>
              )}
              {assistanceRequests.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-sm animate-pulse"></div>
                  <span className="text-xs text-gray-600">{assistanceRequests.length} assistance requests</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unified Priority Queue - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <KioskPriorityQueue
            feedbackList={feedbackList.items || []}
            assistanceRequests={assistanceRequests}
            selectedFeedback={selectedFeedback}
            onFeedbackClick={handleFeedbackClick}
            onLocationClick={handleLocationClick}
            onMarkResolved={handleMarkResolved}
            onAssistanceAction={handleAssistanceAction}
            venueId={venueId}
          />
        </div>
      </div>

      {/* Right Side - Floor Plan - Fixed height, scrollable content */}
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        {/* Zone Navigation - Fixed */}
        {currentView !== 'overview' && (
          <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Overview
              </button>
              {/* <div className="text-sm text-gray-600">Auto-return in 10s</div> */}
            </div>
          </div>
        )}

        {/* Floor Plan Area - Scrollable */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentView === 'overview' ? (
            <KioskZoneOverview
              zones={zones}
              tables={tables}
              feedbackMap={feedbackMap}
              feedbackList={feedbackList.items || []}
              assistanceMap={assistanceMap}
              onZoneSelect={handleZoneSelect}
            />
          ) : (
            <KioskFloorPlan
              tables={tables}
              selectedZoneId={currentView}
              feedbackMap={feedbackMap}
              selectedFeedback={selectedFeedback}
              assistanceMap={assistanceMap}
              onTableClick={handleTableClick}
            />
          )}
        </div>
      </div>

      {/* Exit Kiosk Confirmation Modal */}
      <ConfirmationModal
        isOpen={exitConfirmation}
        onConfirm={confirmExitKiosk}
        onCancel={() => setExitConfirmation(false)}
        title="Exit Kiosk Mode"
        message="Are you sure you want to exit kiosk mode and close this window?"
        confirmText="Exit Kiosk"
        cancelText="Stay in Kiosk"
        confirmButtonStyle="primary"
        icon="info"
      />

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

export default KioskPage;