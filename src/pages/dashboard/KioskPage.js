import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { useVenue } from '../../context/VenueContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AlertModal from '../../components/ui/AlertModal';
import { X, ChevronLeft, MessageSquare, Bell, LayoutGrid } from 'lucide-react';

// Kiosk components
import KioskFloorPlan from '../../components/dashboard/kiosk/KioskFloorPlan';
import KioskZoneOverview from '../../components/dashboard/kiosk/KioskZoneOverview';
import KioskPriorityQueue from '../../components/dashboard/kiosk/KioskPriorityQueue';
import FeedbackDetailModal from '../../components/dashboard/kiosk/FeedbackDetailModal';
import AssistanceResolveModal from '../../components/dashboard/kiosk/AssistanceResolveModal';

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
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(24); // Default 24 hours to avoid missing feedback
  const sessionTimeoutRef = useRef(24); // Ref to ensure real-time handlers always have current value
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [alertModal, setAlertModal] = useState(null);
  const hasAutoNavigated = useRef(false);

  // Modal states for table clicks
  const [tableModalFeedback, setTableModalFeedback] = useState(null);
  const [tableModalAssistance, setTableModalAssistance] = useState(null);
  const [showTableFeedbackModal, setShowTableFeedbackModal] = useState(false);
  const [showTableAssistanceModal, setShowTableAssistanceModal] = useState(false);

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
      const hours = await loadVenueSettings(venueId);
      await loadZones(venueId);
      await loadTables(venueId);
      await fetchFeedback(venueId, hours);
      await fetchAssistanceRequests(venueId, hours);
    };
    load();
  }, [venueId, venueLoading]);

  // Real-time feedback and assistance updates
  useEffect(() => {
    if (!venueId) return;

    let channel = null;
    let reconnectTimeout = null;

    const setupChannel = () => {
      // Remove existing channel if any
      if (channel) {
        supabase.removeChannel(channel);
      }

      channel = supabase
        .channel(`kiosk_updates_${venueId}_${Date.now()}`) // Unique channel name to avoid conflicts
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'feedback',
            filter: `venue_id=eq.${venueId}`
          },
          (payload) => {
            fetchFeedback(venueId, sessionTimeoutRef.current);
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
            fetchFeedback(venueId, sessionTimeoutRef.current);
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
            fetchAssistanceRequests(venueId, sessionTimeoutRef.current);
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
            fetchAssistanceRequests(venueId, sessionTimeoutRef.current);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Real-time subscription error - attempt to reconnect after 5 seconds
            console.warn('Kiosk real-time subscription error, reconnecting...');
            reconnectTimeout = setTimeout(() => {
              setupChannel();
            }, 5000);
          } else if (status === 'CLOSED') {
            // Channel closed unexpectedly - reconnect
            console.warn('Kiosk real-time channel closed, reconnecting...');
            reconnectTimeout = setTimeout(() => {
              setupChannel();
            }, 2000);
          }
        });
    };

    setupChannel();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [venueId]);

  // Fallback polling in case real-time doesn't work
  useEffect(() => {
    if (!venueId) return;

    const pollInterval = setInterval(() => {
      fetchFeedback(venueId, sessionTimeoutRef.current);
      fetchAssistanceRequests(venueId, sessionTimeoutRef.current);
    }, 30000); // Poll every 30 seconds as fallback

    return () => clearInterval(pollInterval);
  }, [venueId]);

  // Calculate the most important/urgent item and its zone
  // Priority: urgency band first, then oldest unresolved first within same band
  const mostUrgentItem = useMemo(() => {
    // Group feedback by session
    const feedbackSessions = groupBySession(feedbackList.items || []);

    // Add urgency to assistance requests (pending = highest priority)
    const assistanceWithUrgency = assistanceRequests.map(request => ({
      ...request,
      type: 'assistance',
      urgency: request.status === 'pending' ? 4 : 2,
    }));

    // Combine and sort by:
    // 1. Urgency band (higher = more urgent)
    // 2. Time (oldest first - address older issues before newer ones of same urgency)
    const combined = [...feedbackSessions, ...assistanceWithUrgency];
    const sorted = combined.sort((a, b) => {
      // First by urgency (higher urgency first)
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      // Then by time (oldest first - lower timestamp = older = higher priority)
      return new Date(a.created_at) - new Date(b.created_at);
    });

    return sorted[0] || null;
  }, [feedbackList.items, assistanceRequests]);

  // Get the zone for the most urgent item
  const mostUrgentZone = useMemo(() => {
    if (!mostUrgentItem || tables.length === 0) return null;

    const table = tables.find(t => String(t.table_number) === String(mostUrgentItem.table_number));
    return table?.zone_id || null;
  }, [mostUrgentItem, tables]);

  // Calculate notification counts per zone
  const zoneNotificationCounts = useMemo(() => {
    const counts = {};

    // Build a map of table_number -> zone_id
    const tableZoneMap = {};
    for (const table of tables) {
      tableZoneMap[String(table.table_number)] = table.zone_id;
    }

    // Count feedback sessions per zone
    const feedbackSessions = groupBySession(feedbackList.items || []);
    for (const session of feedbackSessions) {
      const zoneId = tableZoneMap[String(session.table_number)];
      if (zoneId) {
        counts[zoneId] = (counts[zoneId] || 0) + 1;
      }
    }

    // Count assistance requests per zone
    for (const request of assistanceRequests) {
      const zoneId = tableZoneMap[String(request.table_number)];
      if (zoneId) {
        counts[zoneId] = (counts[zoneId] || 0) + 1;
      }
    }

    return counts;
  }, [tables, feedbackList.items, assistanceRequests]);

  // Auto-navigate to the most urgent zone on initial load
  // Wait for tables to be loaded before attempting navigation
  useEffect(() => {
    if (!hasAutoNavigated.current && mostUrgentZone && currentView === 'overview' && tables.length > 0) {
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
  }, [mostUrgentZone, mostUrgentItem, currentView, tables.length]);

  // Data loading
  const loadVenueSettings = async (venueId) => {
    const { data, error } = await supabase
      .from('venues')
      .select('session_timeout_hours')
      .eq('id', venueId)
      .single();

    const hours = (!error && data?.session_timeout_hours) ? data.session_timeout_hours : 24;
    setSessionTimeoutHours(hours);
    sessionTimeoutRef.current = hours; // Update ref for real-time handlers
    return hours; // Return the value for immediate use
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

  const fetchFeedback = async (venueId, timeoutHours = null) => {
    const now = dayjs();
    const hours = timeoutHours ?? sessionTimeoutHours;
    const cutoff = now.subtract(hours, 'hour').toISOString();
    const nowIso = now.toISOString();

    const { data, error } = await supabase
      .from('feedback')
      .select('*, questions(question)')
      .eq('venue_id', venueId)
      .eq('is_actioned', false) // Only show unresolved feedback
      .gt('created_at', cutoff)
      .lte('created_at', nowIso) // Exclude future feedback
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

  const fetchAssistanceRequests = async (venueId, timeoutHours = null) => {
    const now = dayjs();
    const hours = timeoutHours ?? sessionTimeoutHours;
    const cutoff = now.subtract(hours, 'hour').toISOString();
    const nowIso = now.toISOString();

    const { data, error } = await supabase
      .from('assistance_requests')
      .select('*')
      .eq('venue_id', venueId)
      .in('status', ['pending', 'acknowledged']) // Only show unresolved requests
      .gt('created_at', cutoff)
      .lte('created_at', nowIso) // Exclude future requests
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
    const tableFeedback = feedbackItems.filter((f) => String(f.table_number) === String(tableNumber));

    // Check for assistance request first (higher priority)
    const tableAssistance = assistanceRequests.find(
      (r) => String(r.table_number) === String(tableNumber) && (r.status === 'pending' || r.status === 'acknowledged')
    );

    if (tableAssistance) {
      // Open assistance modal
      setTableModalAssistance(tableAssistance);
      setShowTableAssistanceModal(true);
      setSelectedFeedback({
        table_number: tableNumber,
        session_id: `assistance-${tableAssistance.id}`,
        type: 'assistance'
      });
    } else if (tableFeedback.length > 0) {
      // Group feedback by session for this table
      const sessionMap = new Map();
      for (const item of tableFeedback) {
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

      // Get the most recent session
      const sessions = Array.from(sessionMap.values());
      if (sessions.length > 0) {
        const mostRecentSession = sessions.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];

        // Open feedback modal
        setTableModalFeedback(mostRecentSession);
        setShowTableFeedbackModal(true);
        setSelectedFeedback(tableFeedback[0]);
      }
    }

    resetInactivityTimer(); // no-op while disabled
  };

  // Modal handlers for table click modals
  const handleTableFeedbackModalClose = () => {
    setTableModalFeedback(null);
    setShowTableFeedbackModal(false);
  };

  const handleTableAssistanceModalClose = () => {
    setTableModalAssistance(null);
    setShowTableAssistanceModal(false);
  };

  const handleTableFeedbackResolution = async (sessionIds, staffMember) => {
    await handleMarkResolved(sessionIds, staffMember);
    handleTableFeedbackModalClose();
  };

  const handleTableAssistanceResolve = async (requestId, notes, employeeId) => {
    await handleAssistanceAction(requestId, 'resolve', notes, employeeId);
    handleTableAssistanceModalClose();
  };

  const handleTableAssistanceAcknowledge = async (requestId, employeeId) => {
    await handleAssistanceAction(requestId, 'acknowledge', null, employeeId);
    handleTableAssistanceModalClose();
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

  // Get current zone name
  const currentZoneName = zones.find(z => z.id === currentView)?.name || 'Overview';

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-950 flex flex-col" onClick={resetInactivityTimer}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/img/logo/chatters-logo-black-2025.svg"
              alt="Chatters"
              className="h-6 dark:hidden"
            />
            <img
              src="/img/logo/chatters-logo-white-2025.svg"
              alt="Chatters"
              className="h-6 hidden dark:block"
            />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Staff View</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{venueName}</p>
            </div>
          </div>
          <button
            onClick={handleExitKiosk}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Exit Kiosk Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Zone selector */}
          <div className="flex items-center gap-3">
            {/* Overview button */}
            <button
              onClick={handleBackToOverview}
              className={`px-2.5 py-1 rounded text-sm font-medium transition-all duration-200 ${
                currentView === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4 inline-block mr-1" />
              Overview
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            {/* Zone buttons */}
            <div className="flex items-center gap-2">
              {zones.map(zone => {
                const notificationCount = zoneNotificationCounts[zone.id] || 0;
                return (
                  <button
                    key={zone.id}
                    onClick={() => handleZoneSelect(zone.id)}
                    className={`relative px-2.5 py-1 rounded text-sm font-medium transition-all duration-200 ${
                      currentView === zone.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {zone.name}
                    {notificationCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-4">
            {feedbackList.sessionCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">{feedbackList.sessionCount} feedback</span>
              </div>
            )}
            {assistanceRequests.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="text-gray-600 dark:text-gray-400">{assistanceRequests.length} assistance</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Floor Plan - Full Width */}
        <div className="flex-1 overflow-hidden h-full">
          <div className="h-full w-full">
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

        {/* Right Sidebar - Priority Queue */}
        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full">
          {/* Queue Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Priority Queue</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Urgent items first</p>
          </div>

          {/* Queue List */}
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

      {/* Feedback Detail Modal (triggered by table click) */}
      {showTableFeedbackModal && tableModalFeedback && (
        <FeedbackDetailModal
          isOpen={showTableFeedbackModal}
          onClose={handleTableFeedbackModalClose}
          feedbackItems={tableModalFeedback.items || []}
          onMarkResolved={handleTableFeedbackResolution}
          venueId={venueId}
        />
      )}

      {/* Assistance Resolve Modal (triggered by table click) */}
      {showTableAssistanceModal && tableModalAssistance && (
        <AssistanceResolveModal
          isOpen={showTableAssistanceModal}
          onClose={handleTableAssistanceModalClose}
          request={tableModalAssistance}
          onResolve={handleTableAssistanceResolve}
          onAcknowledge={handleTableAssistanceAcknowledge}
          venueId={venueId}
        />
      )}
    </div>
  );
};

export default KioskPage;