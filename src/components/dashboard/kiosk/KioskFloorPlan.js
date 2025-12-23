import React, { forwardRef, useMemo, useRef, useState, useEffect, useCallback } from 'react';

const slowPulseStyle = { animation: 'slow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' };
const pulseKeyframes = `@keyframes slow-pulse{0%,100%{opacity:1}50%{opacity:.3}}`;

// Logical design space for % coords
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;

const KioskFloorPlan = forwardRef(({ tables, selectedZoneId, feedbackMap, selectedFeedback, assistanceMap, onTableClick }, outerRef) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const filtered = useMemo(() => {
    return tables.filter(t => t.zone_id === selectedZoneId);
  }, [tables, selectedZoneId]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Process tables with simpler coordinate system
  const processedTables = useMemo(() => {
    return filtered.map(t => {
      // Convert percentages to world coordinates
      const worldX = t.x_percent != null ? (t.x_percent / 100) * WORLD_WIDTH : (t.x_px ?? 0);
      const worldY = t.y_percent != null ? (t.y_percent / 100) * WORLD_HEIGHT : (t.y_px ?? 0);
      const w = t.width || 56;
      const h = t.height || 56;

      return { ...t, worldX, worldY, w, h };
    });
  }, [filtered]);

  // Auto-fit to screen (no user zoom/pan)
  const fitToScreen = useCallback(() => {
    if (!processedTables.length || !containerSize.width || !containerSize.height) {
      return;
    }

    // Find bounds of all tables
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const table of processedTables) {
      minX = Math.min(minX, table.worldX);
      minY = Math.min(minY, table.worldY);
      maxX = Math.max(maxX, table.worldX + table.w);
      maxY = Math.max(maxY, table.worldY + table.h);
    }

    // Add some padding
    const padding = 80;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate zoom to fit
    const scaleX = containerSize.width / contentWidth;
    const scaleY = containerSize.height / contentHeight;
    const newZoom = Math.min(scaleX, scaleY);

    // Center the content
    const scaledContentWidth = contentWidth * newZoom;
    const scaledContentHeight = contentHeight * newZoom;

    const centerX = (containerSize.width - scaledContentWidth) / 2 - minX * newZoom;
    const centerY = (containerSize.height - scaledContentHeight) / 2 - minY * newZoom;

    setZoom(newZoom);
    setPanOffset({ x: centerX, y: centerY });
  }, [processedTables, containerSize]);

  // Track the last zone we fitted for
  const lastFittedZoneRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset and refit when zone changes
  useEffect(() => {
    if (selectedZoneId !== lastFittedZoneRef.current) {
      // Hide tables during transition to prevent jumping
      setIsTransitioning(true);
      lastFittedZoneRef.current = selectedZoneId;
    }
  }, [selectedZoneId]);

  // Fit to screen after zone change, once tables are processed
  useEffect(() => {
    if (isTransitioning && processedTables.length > 0 && containerSize.width > 0) {
      // Calculate fit immediately
      fitToScreen();
      // Show tables after a brief delay to allow state to settle
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }
  }, [isTransitioning, processedTables.length, containerSize.width, containerSize.height, fitToScreen]);

  // Table rendering helpers
  // feedbackMap now contains MIN rating for each table (not average)
  const getTableStatus = (tableNumber, minRating) => {
    // Assistance requests take priority over feedback
    const assistanceStatus = assistanceMap?.[tableNumber];
    if (assistanceStatus === 'pending') {
      return { borderColor: 'border-orange-500', bgColor: 'bg-gray-700', status: 'assistance-pending' };
    }
    if (assistanceStatus === 'acknowledged') {
      return { borderColor: 'border-orange-400', bgColor: 'bg-gray-700', status: 'assistance-acknowledged' };
    }

    // Fall back to feedback status based on MIN rating
    // <3 = urgent (red), 3-4 = attention (yellow), >4 = positive (green)
    if (minRating == null) return { borderColor: 'border-gray-800', bgColor: 'bg-gray-700', status: 'no-feedback' };
    if (minRating < 3) return { borderColor: 'border-red-500', bgColor: 'bg-gray-700', status: 'urgent-feedback' };
    if (minRating <= 4) return { borderColor: 'border-yellow-500', bgColor: 'bg-gray-700', status: 'attention-feedback' };
    return { borderColor: 'border-green-500', bgColor: 'bg-gray-700', status: 'positive-feedback' };
  };

  const getTableShapeClasses = (table, tableStatus) => {
    const baseClass = `text-white flex items-center justify-center font-bold border-4 shadow-lg transition-all duration-200 cursor-pointer ${tableStatus.bgColor} ${tableStatus.borderColor}`;
    // Pulse for urgent feedback, attention feedback, or pending assistance
    const pulseStyle = (tableStatus.status === 'urgent-feedback' || tableStatus.status === 'attention-feedback' || tableStatus.status === 'assistance-pending') ? slowPulseStyle : {};

    switch (table.shape) {
      case 'circle':
        return {
          className: `${baseClass} rounded-full hover:bg-gray-600`,
          style: pulseStyle
        };
      case 'long':
        return {
          className: `${baseClass} rounded-lg hover:bg-gray-600 text-sm`,
          style: pulseStyle
        };
      default:
        return {
          className: `${baseClass} rounded-lg hover:bg-gray-600`,
          style: pulseStyle
        };
    }
  };

  return (
    <>
      <style>{pulseKeyframes}</style>

      <div ref={outerRef} className="relative h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Map Container - no pan/zoom interactions */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${panOffset.x % (20 * zoom)}px ${panOffset.y % (20 * zoom)}px`
            }}
          />

          {/* Empty State */}
          {processedTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No tables in this zone</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Tables will appear here when added to this zone</p>
              </div>
            </div>
          )}

          {/* Tables */}
          {!isTransitioning && processedTables.map((table) => {
            const avg = feedbackMap[table.table_number];
            const tableStatus = getTableStatus(table.table_number, avg);
            const cfg = getTableShapeClasses(table, tableStatus);

            const isSelectedTable = selectedFeedback?.table_number === table.table_number;

            // Calculate screen position
            const screenX = table.worldX * zoom + panOffset.x;
            const screenY = table.worldY * zoom + panOffset.y;
            const screenWidth = table.w * zoom;
            const screenHeight = table.h * zoom;

            return (
              <div
                key={table.id}
                className="absolute select-none"
                style={{
                  left: screenX,
                  top: screenY,
                  width: screenWidth,
                  height: screenHeight,
                  transform: isSelectedTable ? 'scale(1.1)' : 'scale(1)',
                  zIndex: isSelectedTable ? 10 : 1,
                  filter: isSelectedTable ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' : 'none',
                }}
              >
                <div
                  className={cfg.className}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: `${Math.max(10, Math.min(18, screenWidth * 0.35))}px`,
                    ...cfg.style
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTableClick(table.table_number);
                  }}
                  title={`Table ${table.table_number}${avg ? ` - Rating: ${avg.toFixed(1)}/5` : ' - No feedback'}`}
                >
                  {table.table_number}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});

KioskFloorPlan.displayName = 'KioskFloorPlan';
export default KioskFloorPlan;
