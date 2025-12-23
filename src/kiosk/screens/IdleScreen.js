import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useKiosk } from '../context/KioskContext';
import { supabase } from '../../utils/supabase';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import FeedbackDetailModal from '../components/FeedbackDetailModal';
import KioskFloorPlan from '../components/KioskFloorPlan';
import {
  MessageSquare,
  Bell,
  Clock,
  Star,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  List,
  Map as MapIcon
} from 'lucide-react';

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

      // Use the LOWEST individual rating for urgency (not the average)
      // This ensures any single bad rating triggers appropriate urgency
      const minRating = ratings.length > 0 ? Math.min(...ratings) : null;

      return {
        ...session,
        type: 'feedback',
        avg_rating: avgRating,
        min_rating: minRating,
        // Urgency based on lowest individual rating
        urgency: minRating !== null && minRating < 3 ? 3 : (minRating !== null && minRating <= 4) ? 2 : 1,
      };
    });
};

const IdleScreen = () => {
  const { venueId, venueName, venueConfig, deviceName, allowedZoneIds } = useKiosk();

  // State
  const [zones, setZones] = useState([]);
  const [tables, setTables] = useState([]);
  const [feedbackList, setFeedbackList] = useState({ items: [], sessionCount: 0 });
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [currentView, setCurrentView] = useState(null);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(24);
  const sessionTimeoutRef = useRef(24);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({ todayFeedback: 0, yesterdayFeedback: 0, avgRating: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'floorplan'

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Initial data load
  useEffect(() => {
    if (!venueId) return;
    const load = async () => {
      setLoading(true);
      const hours = await loadVenueSettings();
      await loadZones();
      await loadTables();
      await fetchFeedback(hours);
      await fetchAssistanceRequests(hours);
      setLoading(false);
    };
    load();
  }, [venueId]);

  // Real-time updates
  useEffect(() => {
    if (!venueId) return;

    let channel = null;

    const setupChannel = () => {
      if (channel) supabase.removeChannel(channel);

      channel = supabase
        .channel(`kiosk_updates_${venueId}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback', filter: `venue_id=eq.${venueId}` },
          () => fetchFeedback(sessionTimeoutRef.current))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_requests', filter: `venue_id=eq.${venueId}` },
          () => fetchAssistanceRequests(sessionTimeoutRef.current))
        .subscribe();
    };

    setupChannel();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [venueId]);

  // Fallback polling
  useEffect(() => {
    if (!venueId) return;
    const poll = setInterval(() => {
      fetchFeedback(sessionTimeoutRef.current);
      fetchAssistanceRequests(sessionTimeoutRef.current);
    }, 30000);
    return () => clearInterval(poll);
  }, [venueId]);

  // Data loading functions
  const loadVenueSettings = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('session_timeout_hours')
      .eq('id', venueId)
      .single();

    const hours = (!error && data?.session_timeout_hours) ? data.session_timeout_hours : 24;
    setSessionTimeoutHours(hours);
    sessionTimeoutRef.current = hours;
    return hours;
  };

  const loadZones = async () => {
    const { data } = await supabase
      .from('zones')
      .select('*')
      .eq('venue_id', venueId)
      .order('order');
    setZones(data || []);
  };

  const loadTables = async () => {
    const { data, error } = await supabase
      .from('table_positions')
      .select('*')
      .eq('venue_id', venueId);
    console.log('[Kiosk] Tables loaded:', { count: data?.length, error });
    setTables(data || []);
  };

  const fetchFeedback = async (timeoutHours = null) => {
    const now = dayjs();
    const hours = timeoutHours ?? sessionTimeoutHours;
    const cutoff = now.subtract(hours, 'hour').toISOString();

    // Fetch unresolved feedback
    const { data, error } = await supabase
      .from('feedback')
      .select('*, questions(question)')
      .eq('venue_id', venueId)
      .eq('is_actioned', false)
      .gt('created_at', cutoff)
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Feedback error:', error);
      return;
    }

    const feedbackItems = data || [];
    const uniqueSessions = new Set();
    for (const item of feedbackItems) {
      if (item.session_id) uniqueSessions.add(item.session_id);
    }

    setFeedbackList({ items: feedbackItems, sessionCount: uniqueSessions.size });

    // Calculate stats - today's feedback (all, not just unresolved)
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');

    const { data: todayData } = await supabase
      .from('feedback')
      .select('rating')
      .eq('venue_id', venueId)
      .gte('created_at', today.toISOString());

    const { count: yesterdayCount } = await supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const todayFeedback = todayData || [];
    const avgRating = todayFeedback.length > 0
      ? todayFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / todayFeedback.length
      : 0;

    setStats({
      todayFeedback: todayFeedback.length,
      yesterdayFeedback: yesterdayCount || 0,
      avgRating: avgRating.toFixed(1)
    });
  };

  const fetchAssistanceRequests = async (timeoutHours = null) => {
    const now = dayjs();
    const hours = timeoutHours ?? sessionTimeoutHours;
    const cutoff = now.subtract(hours, 'hour').toISOString();

    const { data, error } = await supabase
      .from('assistance_requests')
      .select('*')
      .eq('venue_id', venueId)
      .in('status', ['pending', 'acknowledged'])
      .gt('created_at', cutoff)
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });

    if (error) console.error('Assistance error:', error);
    setAssistanceRequests(data || []);
  };

  // Combined priority queue
  const priorityQueue = useMemo(() => {
    const feedbackSessions = groupBySession(feedbackList.items || []);
    const assistanceWithUrgency = assistanceRequests.map(request => ({
      ...request,
      type: 'assistance',
      urgency: request.status === 'pending' ? 4 : 2,
    }));

    return [...feedbackSessions, ...assistanceWithUrgency].sort((a, b) => {
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }, [feedbackList.items, assistanceRequests]);

  // Filter zones based on device's allowed zones
  const visibleZones = useMemo(() => {
    if (!allowedZoneIds || allowedZoneIds.length === 0) {
      return zones; // Show all zones if no restriction
    }
    return zones.filter(z => allowedZoneIds.includes(z.id));
  }, [zones, allowedZoneIds]);

  // Set default view to first visible zone when zones load
  useEffect(() => {
    if (visibleZones.length > 0 && !currentView) {
      setCurrentView(visibleZones[0].id);
    }
  }, [visibleZones, currentView]);

  // Zone notification counts
  const zoneNotificationCounts = useMemo(() => {
    const counts = {};
    const tableZoneMap = {};
    for (const table of tables) {
      tableZoneMap[String(table.table_number)] = table.zone_id;
    }

    const feedbackSessions = groupBySession(feedbackList.items || []);
    for (const session of feedbackSessions) {
      const zoneId = tableZoneMap[String(session.table_number)];
      if (zoneId) counts[zoneId] = (counts[zoneId] || 0) + 1;
    }

    for (const request of assistanceRequests) {
      const zoneId = tableZoneMap[String(request.table_number)];
      if (zoneId) counts[zoneId] = (counts[zoneId] || 0) + 1;
    }

    return counts;
  }, [tables, feedbackList.items, assistanceRequests]);

  // Filtered queue based on current view
  const filteredQueue = useMemo(() => {
    if (!currentView) return [];

    const tableZoneMap = {};
    for (const table of tables) {
      tableZoneMap[String(table.table_number)] = table.zone_id;
    }

    return priorityQueue.filter(item => {
      const zoneId = tableZoneMap[String(item.table_number)];
      return zoneId === currentView;
    });
  }, [priorityQueue, currentView, tables]);

  // Action handlers
  const handleResolveAssistance = async (requestId) => {
    setResolving(requestId);
    try {
      await supabase
        .from('assistance_requests')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', requestId);
      await fetchAssistanceRequests(sessionTimeoutRef.current);
    } catch (err) {
      console.error('Error resolving:', err);
    } finally {
      setResolving(null);
    }
  };

  const handleResolveFeedback = async (sessionId) => {
    setResolving(sessionId);
    try {
      await supabase
        .from('feedback')
        .update({ is_actioned: true, resolved_at: new Date().toISOString() })
        .eq('session_id', sessionId);
      await fetchFeedback(sessionTimeoutRef.current);
    } catch (err) {
      console.error('Error resolving:', err);
    } finally {
      setResolving(null);
    }
  };

  // Open detail modal for an item
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // Close detail modal and refresh data
  const handleModalClose = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  // Handle resolution from modal
  const handleModalResolved = () => {
    fetchFeedback(sessionTimeoutRef.current);
    fetchAssistanceRequests(sessionTimeoutRef.current);
  };

  // Filter tables based on allowed zones
  const visibleTables = useMemo(() => {
    if (!allowedZoneIds || allowedZoneIds.length === 0) {
      return tables;
    }
    return tables.filter(t => t.zone_id && allowedZoneIds.includes(t.zone_id));
  }, [tables, allowedZoneIds]);

  // Build feedback map for floorplan (table_number -> avg rating)
  const feedbackMap = useMemo(() => {
    const map = {};
    const sessions = groupBySession(feedbackList.items || []);
    for (const session of sessions) {
      if (session.table_number && session.avg_rating != null) {
        // If multiple sessions for same table, use lowest rating (most urgent)
        if (map[session.table_number] == null || session.avg_rating < map[session.table_number]) {
          map[session.table_number] = session.avg_rating;
        }
      }
    }
    return map;
  }, [feedbackList.items]);

  // Build assistance map for floorplan (table_number -> status)
  const assistanceMap = useMemo(() => {
    const map = {};
    for (const request of assistanceRequests) {
      if (request.table_number) {
        // Pending takes priority over acknowledged
        if (request.status === 'pending' || map[request.table_number] !== 'pending') {
          map[request.table_number] = request.status;
        }
      }
    }
    return map;
  }, [assistanceRequests]);

  // Handle table click from floorplan
  const handleTableClick = (table) => {
    // Find the feedback session or assistance request for this table
    const feedbackSession = priorityQueue.find(
      item => item.type === 'feedback' && String(item.table_number) === String(table.table_number)
    );
    const assistanceRequest = priorityQueue.find(
      item => item.type === 'assistance' && String(item.table_number) === String(table.table_number)
    );

    // Prioritize assistance, then feedback
    const itemToShow = assistanceRequest || feedbackSession;

    if (itemToShow) {
      setSelectedItem(itemToShow);
      setShowDetailModal(true);
    }
  };

  const getUrgencyColor = (urgency) => {
    if (urgency >= 4) return 'bg-red-500';      // Assistance pending
    if (urgency >= 3) return 'bg-red-500';      // Low rating (1-2 stars) - URGENT
    if (urgency >= 2) return 'bg-yellow-500';   // Medium rating (3-4 stars) - ATTENTION
    return 'bg-green-500';                       // High rating (5 stars) - POSITIVE
  };

  const getUrgencyBg = (urgency) => {
    if (urgency >= 4) return 'bg-red-500/10 border-red-500/30';
    if (urgency >= 3) return 'bg-red-500/10 border-red-500/30';
    if (urgency >= 2) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {venueConfig?.logoUrl ? (
              <img src={venueConfig.logoUrl} alt={venueName} className="h-8 w-auto object-contain" />
            ) : (
              <h1 className="text-xl font-bold">{venueName}</h1>
            )}
            <div className="h-6 w-px bg-gray-600" />
            <span className="text-gray-400 text-sm">
              {deviceName || 'Staff View'}
              {allowedZoneIds?.length > 0 && visibleZones.length === 1 && (
                <span className="ml-1">• {visibleZones[0].name}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-light">{formatTime(currentTime)}</div>
              <div className="text-gray-400 text-xs">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex-shrink-0 bg-gray-800/50 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center gap-6">
          {/* Today's Feedback */}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Today:</span>
            <span className="font-semibold">{stats.todayFeedback}</span>
            {stats.todayFeedback > stats.yesterdayFeedback ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : stats.todayFeedback < stats.yesterdayFeedback ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : null}
          </div>

          {/* Average Rating */}
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Avg:</span>
            <span className="font-semibold">{stats.avgRating}</span>
          </div>

          {/* Pending Counts */}
          {feedbackList.sessionCount > 0 && (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="font-semibold">{feedbackList.sessionCount}</span>
              <span className="text-sm text-gray-400">pending</span>
            </div>
          )}
          {assistanceRequests.length > 0 && (
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="font-semibold text-orange-400">{assistanceRequests.length}</span>
              <span className="text-sm text-gray-400">assistance</span>
            </div>
          )}
        </div>
      </div>

      {/* Zone Tabs + View Toggle */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Zone Tabs */}
          <div className="flex items-center gap-8 overflow-x-auto flex-1">
            {visibleZones.map(zone => {
              const count = zoneNotificationCounts[zone.id] || 0;
              const isActive = currentView === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => setCurrentView(zone.id)}
                  className={`relative py-3 px-2 text-base font-medium whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'text-white border-blue-500'
                      : 'text-gray-400 border-transparent hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {zone.name}
                    {count > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs text-white min-w-[22px] text-center">
                        {count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('floorplan')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'floorplan' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Floor Plan View"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'floorplan' ? (
          /* Floorplan View */
          <div className="absolute inset-0">
            <KioskFloorPlan
            tables={visibleTables}
            selectedZoneId={currentView}
            feedbackMap={feedbackMap}
            assistanceMap={assistanceMap}
            onTableClick={handleTableClick}
          />
          </div>
        ) : (
          /* List View */
          <div className="h-full overflow-y-auto p-4">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500/50" />
                <p className="text-xl font-medium">All clear!</p>
                <p className="text-sm mt-1">No pending items in this zone</p>
              </div>
            ) : (
              <div className="space-y-3">
            {filteredQueue.map((item) => {
              const itemKey = item.type === 'assistance' ? `a-${item.id}` : `f-${item.session_id}`;

              return (
                <button
                  key={itemKey}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left rounded-xl p-4 border ${getUrgencyBg(item.urgency)} hover:brightness-110 transition-all active:scale-[0.99]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.type === 'assistance' ? 'bg-orange-500/20' : 'bg-blue-500/20'
                      }`}>
                        {item.type === 'assistance' ? (
                          <Bell className="w-6 h-6 text-orange-400" />
                        ) : (
                          <MessageSquare className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg font-semibold">Table {item.table_number}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getUrgencyColor(item.urgency)} text-white`}>
                            {item.type === 'assistance' ? (item.status === 'pending' ? 'URGENT' : 'Acknowledged') : 'Feedback'}
                          </span>
                        </div>

                        {item.type === 'assistance' ? (
                          <p className="text-sm text-gray-300 capitalize">
                            {item.request_type?.replace(/_/g, ' ') || 'Assistance needed'}
                          </p>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 ${
                                    star <= Math.round(item.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-400">
                              {item.items?.length || 0} response{(item.items?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {dayjs(item.created_at).fromNow()}
                        </div>

                        {/* Show feedback comments preview if any */}
                        {item.type === 'feedback' && item.items?.some(i => i.comment || i.additional_feedback) && (
                          <div className="mt-3">
                            {item.items.filter(i => i.comment || i.additional_feedback).slice(0, 1).map((feedback, idx) => (
                              <p key={idx} className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-2 italic line-clamp-2">
                                "{feedback.comment || feedback.additional_feedback}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
                      <span className="text-sm">View</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              );
            })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-4 py-2 text-center text-gray-500 text-xs">
        Tap top-left corner 5 times for settings • Auto-refresh every 30s
      </div>

      {/* Detail Modal */}
      <FeedbackDetailModal
        isOpen={showDetailModal}
        onClose={handleModalClose}
        item={selectedItem}
        venueId={venueId}
        onResolved={handleModalResolved}
      />
    </div>
  );
};

export default IdleScreen;
