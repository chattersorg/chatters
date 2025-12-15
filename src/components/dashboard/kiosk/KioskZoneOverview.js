import React from 'react';

// Subtle pulse for unhappy tables
const slowPulseStyle = { animation: 'slow-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite' };
const pulseKeyframes = `
@keyframes slow-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
`;

/* ---------- helpers: match sidebar semantics ---------- */
const getRowRating = (row) => {
  const cand = row.session_rating ?? row.rating ?? row.score ?? null;
  const num = typeof cand === 'number' ? cand : Number(cand);
  return Number.isFinite(num) ? num : null;
};

const groupBySession = (rows) => {
  const map = new Map();
  for (const r of rows || []) {
    const sid = r.session_id ?? r.sessionId;
    if (!sid) continue;
    const entry = map.get(sid) || {
      session_id: sid,
      table_number: r.table_number ?? r.tableNumber ?? ' - ',
      created_at: r.created_at,
      items_count: 0,
      ratings: [],
      has_comment: false,
    };

    entry.items_count += 1;
    if (!entry.created_at || new Date(r.created_at) > new Date(entry.created_at)) {
      entry.created_at = r.created_at;
    }
    const rating = getRowRating(r);
    if (rating !== null) entry.ratings.push(rating);
    if (r.additional_feedback?.trim()) entry.has_comment = true;

    map.set(sid, entry);
  }

  return Array.from(map.values()).map((e) => ({
    session_id: e.session_id,
    table_number: e.table_number,
    created_at: e.created_at,
    items_count: e.items_count,
    session_rating:
      e.ratings.length > 0 ? e.ratings.reduce((a, b) => a + b, 0) / e.ratings.length : null,
    has_comment: e.has_comment,
  }));
};

/* ---------- main ---------- */
const KioskZoneOverview = ({ zones, tables, feedbackMap, feedbackList, assistanceMap, onZoneSelect }) => {
  const sessions = React.useMemo(() => groupBySession(feedbackList), [feedbackList]);

  // Attach meta + priority and sort
  const zonesWithMeta = React.useMemo(() => {
    return (zones || [])
      .map((zone) => {
        const zoneTables = tables.filter((t) => t.zone_id === zone.id);
        const tableNumbers = new Set(zoneTables.map((t) => t.table_number));
        const zoneSessions = sessions.filter((s) => tableNumbers.has(s.table_number));

        const urgentCount = zoneSessions.filter((s) => s.session_rating != null && s.session_rating <= 2).length;
        const attentionCount = zoneSessions.filter(
          (s) => s.session_rating != null && s.session_rating <= 3 && s.has_comment
        ).length;
        const totalAlerts = zoneSessions.length;

        const priority = urgentCount > 0 ? 2 : totalAlerts > 0 ? 1 : 0;
        const latestAt =
          zoneSessions.length > 0
            ? zoneSessions.reduce(
                (max, s) => (new Date(s.created_at) > new Date(max) ? s.created_at : max),
                zoneSessions[0].created_at
              )
            : null;

        return { zone, zoneTables, urgentCount, attentionCount, totalAlerts, priority, latestAt };
      })
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (b.urgentCount !== a.urgentCount) return b.urgentCount - a.urgentCount;
        if (b.totalAlerts !== a.totalAlerts) return b.totalAlerts - a.totalAlerts;
        return (a.zone.name || '').localeCompare(b.zone.name || '');
      });
  }, [zones, tables, sessions]);

  // Status styles
  const getZoneAccent = (urgentCount, totalAlerts) =>
    urgentCount > 0 ? 'bg-red-500' : totalAlerts > 0 ? 'bg-amber-500' : 'bg-emerald-500';

  const getTableStatus = (tableNumber, feedbackAvg) => {
    // Assistance requests take priority over feedback
    const assistanceStatus = assistanceMap?.[tableNumber];
    if (assistanceStatus === 'pending') {
      return { border: 'border-orange-500', bg: 'bg-gray-700', status: 'assistance-pending' };
    }
    if (assistanceStatus === 'acknowledged') {
      return { border: 'border-yellow-500', bg: 'bg-gray-700', status: 'assistance-acknowledged' };
    }
    
    // Fall back to feedback status
    if (feedbackAvg == null) return { border: 'border-gray-300', bg: 'bg-gray-700', status: 'no-feedback' };
    if (feedbackAvg > 4) return { border: 'border-green-500', bg: 'bg-gray-700', status: 'happy' };
    if (feedbackAvg >= 3) return { border: 'border-yellow-500', bg: 'bg-gray-700', status: 'attention' };
    return { border: 'border-red-500', bg: 'bg-gray-700', status: 'unhappy' };
  };

  // Denser chips; "long" is auto-width (padding), so spacing stays clean
  const getTableShapeClasses = (shape, tableStatus) => {
    const base =
      `inline-flex items-center justify-center shrink-0
       text-white font-medium border-2 transition-colors duration-150 cursor-pointer
       ${tableStatus.bg} ${tableStatus.border}`;
    // Pulse for unhappy feedback or pending assistance
    const pulseStyle = (tableStatus.status === 'unhappy' || tableStatus.status === 'assistance-pending') ? slowPulseStyle : {};

    switch (shape) {
      case 'circle':
        return { className: `${base} w-9 h-9 text-[11px] rounded-full hover:bg-gray-600`, style: pulseStyle };
      case 'long':
        return { className: `${base} h-9 px-4 text-[11px] rounded-md hover:bg-gray-600`, style: pulseStyle };
      default:
        return { className: `${base} w-9 h-9 text-[11px] rounded-md hover:bg-gray-600`, style: pulseStyle };
    }
  };

  const renderTable = (table) => {
    const avg = feedbackMap[table.table_number];
    const status = getTableStatus(table.table_number, avg);
    const cfg = getTableShapeClasses(table.shape, status);

    const statusText =
      status.status === 'assistance-pending'
        ? 'Table Needs Assistance (Pending)'
        : status.status === 'assistance-acknowledged'
        ? 'Table Needs Assistance (Acknowledged)'
        : status.status === 'happy'
        ? 'Table Happy'
        : status.status === 'attention'
        ? 'Table Needs Attention'
        : status.status === 'unhappy'
        ? 'Table Unhappy'
        : 'No Feedback Submitted';

    return (
      <button
        key={table.id}
        onClick={() => onZoneSelect(table.zone_id)}
        className="relative focus:outline-none"
        title={`Table ${table.table_number} - ${statusText}`}
      >
        <div className={cfg.className} style={cfg.style}>{table.table_number}</div>
      </button>
    );
  };

  return (
    <>
      <style>{pulseKeyframes}</style>

      <div className="h-full p-4 md:p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        {zonesWithMeta.length === 0 ? (
          <div className="grid place-items-center h-full">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 grid place-items-center">
                <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </div>
              <div className="font-medium">No zones configured</div>
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Ask an admin to set up your floor plan.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {zonesWithMeta.map(({ zone, zoneTables, totalAlerts, urgentCount, latestAt }) => {
              const accent = getZoneAccent(urgentCount, totalAlerts);

              return (
                <section
                  key={zone.id}
                  className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow"
                >
                  {/* Accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${accent}`} />

                  <div className="p-5 md:p-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{zone.name}</h2>
                        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {zoneTables.length} table{zoneTables.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3">
                        {urgentCount > 0 && (
                          <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                            {urgentCount} Urgent
                          </span>
                        )}
                        {urgentCount === 0 && totalAlerts > 0 && (
                          <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                            {totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}
                          </span>
                        )}
                        {totalAlerts === 0 && (
                          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                            Operational
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tables (flex wrap so long chips don't bunch) */}
                    {zoneTables.length === 0 ? (
                      <div className="py-10 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                        <div className="text-sm">No tables configured in this zone</div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                        <div className="flex flex-wrap gap-3 md:gap-3">
                          {zoneTables.map((table) => renderTable(table))}
                        </div>
                      </div>
                    )}

                    {/* Subtle footer meta */}
                    <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Urgent
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Alert
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OK
                        </span>
                      </div>
                      {latestAt && <span>Last activity: {new Date(latestAt).toLocaleString()}</span>}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default KioskZoneOverview;
