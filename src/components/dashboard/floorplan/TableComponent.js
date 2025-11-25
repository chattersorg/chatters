import React, { useState, useRef, useCallback, useEffect } from 'react';

const MIN_SIZE = 40;
const GRID = 5; // Match FloorPlanCanvas GRID_SIZE

const TableComponent = ({
  table,
  editMode,
  onRemoveTable,
  onTableResize, // (id, width, height) -> parent persists immutably
  onTableMove,   // (id, dx, dy) to adjust x/y when resizing from left/top
  zoom = 1,      // Current zoom level for position calculations
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get the world dimensions (unscaled) for calculations
  const worldWidth = table.w || 56;
  const worldHeight = table.h || 56;

  // Live visual size during drag (no snap while moving) - these are screen coordinates
  const [liveWidth, setLiveWidth] = useState(table.width || 56);
  const [liveHeight, setLiveHeight] = useState(table.height || 56);
  
  // Live position adjustments during resize
  const [liveOffsetX, setLiveOffsetX] = useState(0);
  const [liveOffsetY, setLiveOffsetY] = useState(0);

  // Stay in sync with parent props unless currently resizing
  useEffect(() => {
    if (!isResizing) {
      setLiveWidth(table.width || 56);
      setLiveHeight(table.height || 56);
    }
  }, [table.width, table.height, isResizing]);

  // Reset live offsets when position actually changes from parent
  useEffect(() => {
    if (!isResizing) {
      setLiveOffsetX(0);
      setLiveOffsetY(0);
    }
  }, [table.x_px, table.y_px, isResizing]);

  // UX: prevent text selection while dragging
  useEffect(() => {
    if (!isResizing) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => { document.body.style.userSelect = prev; };
  }, [isResizing]);

  // Disable parent draggable when resizing
  useEffect(() => {
    const parent = document.querySelector(`[data-table-id="${table.id}"]`)?.closest('.react-draggable');
    if (parent) {
      if (isResizing) {
        parent.style.pointerEvents = 'none';
      } else {
        parent.style.pointerEvents = 'auto';
      }
    }
  }, [isResizing, table.id]);

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    direction: '',
  });

  // Track the element + pointer being captured so we can release cleanly
  const captureElRef = useRef(null);
  const pointerIdRef = useRef(null);

  const roundToGrid = (v) => Math.round(v / GRID) * GRID;

  const startResize = useCallback((e, direction, circle = false) => {
    e.stopPropagation();
    e.preventDefault();

    captureElRef.current = e.currentTarget;
    pointerIdRef.current = e.pointerId;
    captureElRef.current?.setPointerCapture?.(pointerIdRef.current);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: worldWidth,
      startH: worldHeight,
      direction,
    };

    setIsResizing(true);
    setLiveOffsetX(0);
    setLiveOffsetY(0);

    const onMove = (ev) => {
      const { startX, startY, startW, startH, direction: dir } = dragRef.current;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (circle) {
        // Convert screen delta to world delta
        const worldDelta = Math.max(dx, dy) / zoom;
        const newWorldSize = Math.max(MIN_SIZE, startW + worldDelta);
        // Convert back to screen for live display
        const screenSize = newWorldSize * zoom;
        setLiveWidth(screenSize);
        setLiveHeight(screenSize);
        return;
      }

      // Calculate new world dimensions
      let newWorldW = startW;
      let newWorldH = startH;

      if (dir.includes('right')) newWorldW = Math.max(MIN_SIZE, startW + dx / zoom);
      if (dir.includes('left'))  newWorldW = Math.max(MIN_SIZE, startW - dx / zoom);
      if (dir.includes('bottom')) newWorldH = Math.max(MIN_SIZE, startH + dy / zoom);
      if (dir.includes('top'))    newWorldH = Math.max(MIN_SIZE, startH - dy / zoom);

      // Calculate live position offsets for left/top resize
      let liveOffX = 0;
      let liveOffY = 0;
      
      if (dir.includes('left')) {
        liveOffX = -(newWorldW - startW) * zoom;
      }
      if (dir.includes('top')) {
        liveOffY = -(newWorldH - startH) * zoom;
      }

      // Convert to screen for live display
      setLiveWidth(newWorldW * zoom);
      setLiveHeight(newWorldH * zoom);
      setLiveOffsetX(liveOffX);
      setLiveOffsetY(liveOffY);
    };

    // Track last pointer position for reliable final commit
    const trackLast = (ev) => {
      window.__lastPX = ev.clientX;
      window.__lastPY = ev.clientY;
    };

    const cleanUp = () => {
      const { startX, startY, startW, startH, direction: dir } = dragRef.current;
      const lastX = window.__lastPX ?? startX;
      const lastY = window.__lastPY ?? startY;
      const dx = lastX - startX;
      const dy = lastY - startY;

      // Calculate final dimensions in world coordinates
      let finalW, finalH;
      
      if (circle) {
        const worldDelta = Math.max(dx, dy) / zoom;
        const newWorldSize = Math.max(MIN_SIZE, startW + worldDelta);
        finalW = finalH = roundToGrid(newWorldSize);
      } else {
        finalW = startW;
        finalH = startH;
        
        if (dir.includes('right')) finalW = Math.max(MIN_SIZE, startW + dx / zoom);
        if (dir.includes('left'))  finalW = Math.max(MIN_SIZE, startW - dx / zoom);
        if (dir.includes('bottom')) finalH = Math.max(MIN_SIZE, startH + dy / zoom);
        if (dir.includes('top'))    finalH = Math.max(MIN_SIZE, startH - dy / zoom);
        
        finalW = roundToGrid(finalW);
        finalH = roundToGrid(finalH);
      }

      // Handle position adjustments for left/top resizing
      if (onTableMove && !circle) {
        let moveDx = 0;
        let moveDy = 0;
        
        if (dir.includes('left')) {
          // When resizing from left, move left by the amount the width increased
          // If width increased, we need to move left (negative direction)
          moveDx = -(finalW - startW);
        }
        if (dir.includes('top')) {
          // When resizing from top, move up by the amount the height increased
          // If height increased, we need to move up (negative direction)
          moveDy = -(finalH - startH);
        }
        
        if (moveDx !== 0 || moveDy !== 0) {
          onTableMove(table.id, moveDx, moveDy);
        }
      }


      // Persist the new size
      onTableResize?.(table.id, finalW, finalH);

      // Clean up pointer capture
      captureElRef.current?.releasePointerCapture?.(pointerIdRef.current);
      captureElRef.current = null;
      pointerIdRef.current = null;

      setIsResizing(false);
      // Live offsets will be reset by useEffect when position updates

      // Remove event listeners
      window.removeEventListener('pointermove', trackLast);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanUp);
      window.removeEventListener('pointercancel', cleanUp);
      delete window.__lastPX;
      delete window.__lastPY;
    };

    window.addEventListener('pointermove', trackLast, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', cleanUp, { passive: true });
    window.addEventListener('pointercancel', cleanUp, { passive: true });
  }, [onTableResize, onTableMove, table.id, table.width, table.height]);

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemoveTable?.(table.id);
  };

  const getShapeClasses = () => {
    const base = 'text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 flex items-center justify-center font-semibold border border-gray-300 dark:border-gray-600 shadow-sm transition-all duration-200';
    const isCircle = table.shape === 'circle';
    return `${base} ${isCircle ? 'rounded-full' : 'rounded-lg'}`;
  };

  const showHandles = isHovered || isResizing;

  return (
    <div
      className="relative select-none"
      style={{ 
        width: liveWidth, 
        height: liveHeight,
        transform: `translate(${liveOffsetX}px, ${liveOffsetY}px)`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isResizing && setIsHovered(false)}
      title={`Table ${table.table_number}`}
      data-table-id={table.id} // Add this for parent draggable detection
    >
      <div className={getShapeClasses()} style={{ width: '100%', height: '100%' }}>
        {table.table_number}
      </div>

      {editMode && (
        <>
          {/* Remove button */}
          <button
            onClick={handleRemoveClick}
            className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold shadow-lg transition-all duration-200 z-10 ${showHandles ? 'opacity-100' : 'opacity-0'}`}
            title="Remove table"
            type="button"
          >
            ×
          </button>

          {/* Handles for non-circle */}
          {table.shape !== 'circle' && showHandles && (
            <>
              {/* Corners */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize z-20"
                   onPointerDown={(e) => startResize(e, 'top-left')} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize z-20"
                   onPointerDown={(e) => startResize(e, 'top-right')} />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize z-20"
                   onPointerDown={(e) => startResize(e, 'bottom-left')} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize z-20"
                   onPointerDown={(e) => startResize(e, 'bottom-right')} />
              {/* Edges */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-n-resize z-20"
                   onPointerDown={(e) => startResize(e, 'top')} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-s-resize z-20"
                   onPointerDown={(e) => startResize(e, 'bottom')} />
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-w-resize z-20"
                   onPointerDown={(e) => startResize(e, 'left')} />
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-e-resize z-20"
                   onPointerDown={(e) => startResize(e, 'right')} />
            </>
          )}

          {/* Circle: uniform scale from bottom-right */}
          {table.shape === 'circle' && showHandles && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize z-20"
                 onPointerDown={(e) => startResize(e, 'circle', true)} />
          )}

          {/* Hover outline */}
          {showHandles && (
            <div className="absolute inset-0 border-2 border-dashed border-blue-300 dark:border-blue-500 rounded-lg pointer-events-none" />
          )}
        </>
      )}
    </div>
  );
};

export default TableComponent;