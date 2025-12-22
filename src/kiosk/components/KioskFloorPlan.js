import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';

const slowPulseStyle = { animation: 'slow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' };
const pulseKeyframes = `@keyframes slow-pulse{0%,100%{opacity:1}50%{opacity:.3}}`;

// Logical design space for % coords
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;

const KioskFloorPlan = ({
  tables,
  selectedZoneId,
  feedbackMap,
  assistanceMap,
  onTableClick
}) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastFittedZoneRef = useRef(null);

  // Filter tables by zone
  const filtered = useMemo(() => {
    if (selectedZoneId === 'overview') return tables;
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

  // Process tables with coordinate system (only depends on filtered tables, not zoom/pan)
  const processedTables = useMemo(() => {
    return filtered.map(t => {
      const worldX = t.x_percent != null ? (t.x_percent / 100) * WORLD_WIDTH : (t.x_px ?? 0);
      const worldY = t.y_percent != null ? (t.y_percent / 100) * WORLD_HEIGHT : (t.y_px ?? 0);
      const w = t.width || 56;
      const h = t.height || 56;
      return { ...t, worldX, worldY, w, h };
    });
  }, [filtered]);

  // Auto-fit to screen
  const fitToScreen = useCallback(() => {
    if (!processedTables.length || !containerSize.width || !containerSize.height) {
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const table of processedTables) {
      minX = Math.min(minX, table.worldX);
      minY = Math.min(minY, table.worldY);
      maxX = Math.max(maxX, table.worldX + table.w);
      maxY = Math.max(maxY, table.worldY + table.h);
    }

    const padding = 60;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const scaleX = containerSize.width / contentWidth;
    const scaleY = containerSize.height / contentHeight;
    const newZoom = Math.min(scaleX, scaleY);

    const scaledContentWidth = contentWidth * newZoom;
    const scaledContentHeight = contentHeight * newZoom;

    const centerX = (containerSize.width - scaledContentWidth) / 2 - minX * newZoom;
    const centerY = (containerSize.height - scaledContentHeight) / 2 - minY * newZoom;

    setZoom(newZoom);
    setPanOffset({ x: centerX, y: centerY });
  }, [processedTables, containerSize]);

  // Reset and refit when zone changes
  useEffect(() => {
    if (selectedZoneId !== lastFittedZoneRef.current) {
      setIsTransitioning(true);
      lastFittedZoneRef.current = selectedZoneId;
    }
  }, [selectedZoneId]);

  // Fit to screen after zone change
  useEffect(() => {
    if (isTransitioning && processedTables.length > 0 && containerSize.width > 0) {
      fitToScreen();
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }
  }, [isTransitioning, processedTables.length, containerSize.width, containerSize.height, fitToScreen]);

  // Initial fit
  useEffect(() => {
    if (containerSize.width > 0 && processedTables.length > 0 && !lastFittedZoneRef.current) {
      fitToScreen();
      lastFittedZoneRef.current = selectedZoneId;
    }
  }, [containerSize, processedTables, fitToScreen, selectedZoneId]);

  // Get table status based on feedback and assistance
  const getTableStatus = (tableNumber) => {
    const assistanceStatus = assistanceMap?.[tableNumber];
    const feedbackAvg = feedbackMap?.[tableNumber];

    // Assistance requests take priority
    if (assistanceStatus === 'pending') {
      return {
        borderColor: 'border-orange-500',
        bgColor: 'bg-orange-500/20',
        status: 'assistance-pending',
        pulse: true
      };
    }
    if (assistanceStatus === 'acknowledged') {
      return {
        borderColor: 'border-orange-400',
        bgColor: 'bg-orange-400/10',
        status: 'assistance-acknowledged',
        pulse: false
      };
    }

    // Feedback status
    if (feedbackAvg == null) {
      return {
        borderColor: 'border-gray-600',
        bgColor: 'bg-gray-700',
        status: 'no-feedback',
        pulse: false
      };
    }
    if (feedbackAvg <= 2) {
      return {
        borderColor: 'border-red-500',
        bgColor: 'bg-red-500/20',
        status: 'urgent-feedback',
        pulse: true
      };
    }
    if (feedbackAvg <= 3) {
      return {
        borderColor: 'border-yellow-500',
        bgColor: 'bg-yellow-500/20',
        status: 'attention',
        pulse: false
      };
    }
    if (feedbackAvg <= 4) {
      return {
        borderColor: 'border-blue-500',
        bgColor: 'bg-blue-500/10',
        status: 'mid-rating',
        pulse: false
      };
    }
    return {
      borderColor: 'border-green-500',
      bgColor: 'bg-green-500/10',
      status: 'happy',
      pulse: false
    };
  };

  const getShapeClass = (shape) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'long':
        return 'rounded-lg';
      default:
        return 'rounded-lg';
    }
  };

  return (
    <>
      <style>{pulseKeyframes}</style>

      <div
        ref={containerRef}
        className="relative w-full h-full bg-gray-900 overflow-hidden"
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #4b5563 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${panOffset.x % (20 * zoom)}px ${panOffset.y % (20 * zoom)}px`
          }}
        />

        {/* Empty State */}
        {processedTables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-sm font-medium">No tables in this zone</p>
            </div>
          </div>
        )}

        {/* Tables */}
        {!isTransitioning && processedTables.map((table) => {
          const status = getTableStatus(table.table_number);
          const hasActivity = status.status !== 'no-feedback';

          const screenX = table.worldX * zoom + panOffset.x;
          const screenY = table.worldY * zoom + panOffset.y;
          const screenWidth = table.w * zoom;
          const screenHeight = table.h * zoom;

          return (
            <button
              key={table.id}
              onClick={() => onTableClick(table)}
              className={`absolute select-none transition-transform active:scale-95 ${getShapeClass(table.shape)}`}
              style={{
                left: screenX,
                top: screenY,
                width: screenWidth,
                height: screenHeight,
                ...(status.pulse ? slowPulseStyle : {})
              }}
            >
              <div
                className={`w-full h-full flex items-center justify-center font-bold border-4
                  ${status.bgColor} ${status.borderColor} ${getShapeClass(table.shape)}
                  ${hasActivity ? 'shadow-lg' : ''}`}
                style={{
                  fontSize: `${Math.max(12, Math.min(20, screenWidth * 0.35))}px`,
                }}
              >
                <span className="text-white">{table.table_number}</span>
              </div>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-800/90 rounded-xl p-3 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-orange-500 bg-orange-500/20" />
            <span className="text-gray-300">Assistance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-500/20" />
            <span className="text-gray-300">Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-500/20" />
            <span className="text-gray-300">Attention</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-500/10" />
            <span className="text-gray-300">Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-600 bg-gray-700" />
            <span className="text-gray-300">No feedback</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default KioskFloorPlan;
