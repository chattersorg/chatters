import React, { forwardRef, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import TableComponent from './TableComponent';

// Note: GRID_SIZE removed since we now use magnetic alignment instead of rigid grid

// Zoom constraints
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.3; // Increased for more responsive button clicks

const FloorPlanCanvas = forwardRef(
  (
    {
      tables,
      selectedZoneId,
      editMode,
      onTableDrag,
      onRemoveTable,
      onTableResize,
    },
    ref
  ) => {
    const internalRef = useRef(null);
    const containerRef = ref || internalRef;
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    
    // Map state for scaling and panning
    const [zoom, setZoom] = useState(0.8);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const filteredTables = useMemo(() => {
      return tables.filter((t) => t.zone_id === selectedZoneId);
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
    }, [containerRef]);

    // Process tables - use pixel coordinates directly for now
    const processedTables = useMemo(() => {
      return filteredTables.map(t => {
        // Use pixel coordinates directly since that's what the floorplan editor uses
        const worldX = t.x_px ?? 0;
        const worldY = t.y_px ?? 0;
        const w = t.width || 56;
        const h = t.height || 56;
        
        return { ...t, worldX, worldY, w, h };
      });
    }, [filteredTables]);

    // Fit to screen function
    const fitToScreen = useCallback(() => {
      if (!processedTables.length || !containerSize.width || !containerSize.height) {
        return;
      }
      
      // Find bounds of all tables in pixel coordinates
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      for (const table of processedTables) {
        minX = Math.min(minX, table.worldX);
        minY = Math.min(minY, table.worldY);
        maxX = Math.max(maxX, table.worldX + table.w);
        maxY = Math.max(maxY, table.worldY + table.h);
      }
      
      // Add padding (smaller since we're in pixel coordinates now)
      const padding = 50;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      // Calculate zoom to fit
      const scaleX = containerSize.width / contentWidth;
      const scaleY = containerSize.height / contentHeight;
      const newZoom = Math.min(scaleX, scaleY, MAX_ZOOM);
      
      // Center the content
      const scaledContentWidth = contentWidth * newZoom;
      const scaledContentHeight = contentHeight * newZoom;
      
      const centerX = (containerSize.width - scaledContentWidth) / 2 - minX * newZoom;
      const centerY = (containerSize.height - scaledContentHeight) / 2 - minY * newZoom;
      
      setZoom(newZoom);
      setPanOffset({ x: centerX, y: centerY });
    }, [processedTables, containerSize]);

    // Auto-fit when zone changes or initial load
    useEffect(() => {
      if (processedTables.length > 0 && containerSize.width > 0) {
        setTimeout(fitToScreen, 100);
      }
    }, [selectedZoneId, fitToScreen]); // Only when zone changes, not when tables change

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    
    // Mouse wheel zoom with improved trackpad handling
    const handleWheel = useCallback((e) => {
      // Always prevent default to stop browser zoom
      e.preventDefault();
      e.stopPropagation();
      
      // Better trackpad detection - trackpads send smaller, more frequent events
      const absDeltaY = Math.abs(e.deltaY);
      const isTrackpad = absDeltaY < 50 || e.deltaMode === 0;
      
      // Much more responsive sensitivity
      let sensitivity;
      if (isTrackpad) {
        // Higher sensitivity for trackpads, with acceleration for large movements
        sensitivity = absDeltaY > 10 ? 0.02 : 0.015;
      } else {
        // Mouse wheel - even more sensitive
        sensitivity = 0.1;
      }
      
      const delta = e.deltaY > 0 ? -sensitivity : sensitivity;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
      
      if (newZoom !== zoom) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomRatio = newZoom / zoom;
        const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
        const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;
        
        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      }
    }, [zoom, panOffset]);

    // Pan controls
    const startPan = (e) => {
      if (editMode) return; // Don't pan in edit mode
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: panOffset.x, y: panOffset.y });
      document.body.style.cursor = 'grabbing';
    };

    const onPan = useCallback((e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset({
        x: panStart.x + dx,
        y: panStart.y + dy
      });
    }, [isDragging, dragStart, panStart]);

    const endPan = useCallback(() => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    }, []);

    useEffect(() => {
      if (!isDragging) return;
      document.addEventListener('mousemove', onPan);
      document.addEventListener('mouseup', endPan);
      return () => {
        document.removeEventListener('mousemove', onPan);
        document.removeEventListener('mouseup', endPan);
      };
    }, [isDragging, onPan, endPan]);

    // Handle table drag - convert screen coordinates back to container pixel coordinates
    const handleTableDragEnd = (tableId, screenX, screenY) => {
      // Convert screen coordinates back to container pixel coordinates
      let containerX = (screenX - panOffset.x) / zoom;
      let containerY = (screenY - panOffset.y) / zoom;
      
      const table = tables.find(t => t.id === tableId);
      if (table) {
        // Magnetic alignment with other tables
        const otherTables = filteredTables.filter(t => t.id !== tableId);
        const { snapX, snapY } = findSnapPoints(table, containerX, containerY, otherTables);
        containerX = snapX;
        containerY = snapY;
      }
      
      onTableDrag(tableId, containerX, containerY);
    };

    // Magnetic alignment helper - finds nearby snap points
    const findSnapPoints = useCallback((movingTable, newX, newY, otherTables) => {
      const SNAP_DISTANCE = 10;
      let snapX = newX;
      let snapY = newY;
      
      for (const otherTable of otherTables) {
        if (otherTable.id === movingTable.id || otherTable.zone_id !== movingTable.zone_id) continue;
        
        const otherX = otherTable.x_px;
        const otherY = otherTable.y_px;
        const otherW = otherTable.w || otherTable.width || 56;
        const otherH = otherTable.h || otherTable.height || 56;
        const movingW = movingTable.w || movingTable.width || 56;
        const movingH = movingTable.h || movingTable.height || 56;
        
        // Horizontal alignment (same Y or aligned edges)
        if (Math.abs(newY - otherY) < SNAP_DISTANCE) {
          snapY = otherY; // Top edges align
        } else if (Math.abs(newY + movingH - (otherY + otherH)) < SNAP_DISTANCE) {
          snapY = otherY + otherH - movingH; // Bottom edges align
        } else if (Math.abs(newY + movingH/2 - (otherY + otherH/2)) < SNAP_DISTANCE) {
          snapY = otherY + otherH/2 - movingH/2; // Centers align
        }
        
        // Vertical alignment (same X or aligned edges)
        if (Math.abs(newX - otherX) < SNAP_DISTANCE) {
          snapX = otherX; // Left edges align
        } else if (Math.abs(newX + movingW - (otherX + otherW)) < SNAP_DISTANCE) {
          snapX = otherX + otherW - movingW; // Right edges align
        } else if (Math.abs(newX + movingW/2 - (otherX + otherW/2)) < SNAP_DISTANCE) {
          snapX = otherX + otherW/2 - movingW/2; // Centers align
        }
      }
      
      return { snapX, snapY };
    }, []);

    // Handle table move from resize operations - apply relative deltas
    const handleTableMove = (tableId, deltaX, deltaY) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;
      
      // Apply deltas directly to existing position
      let newX = table.x_px + deltaX;
      let newY = table.y_px + deltaY;
      
      // Magnetic alignment with other tables
      const otherTables = filteredTables.filter(t => t.id !== tableId);
      const { snapX, snapY } = findSnapPoints(table, newX, newY, otherTables);
      
      onTableDrag(tableId, snapX, snapY);
    };

    return (
      <div className="relative">
        {/* Zoom Controls */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg">
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </button>
          <button
            onClick={fitToScreen}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            title="Fit to Screen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative w-full h-[600px] bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
          onMouseDown={startPan}
          onWheel={handleWheel}
          style={{
            cursor: isDragging ? 'grabbing' : (editMode ? 'default' : 'grab')
          }}
        >
          {/* Subtle grid pattern for visual reference */}
          <div
            className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${panOffset.x % (20 * zoom)}px ${panOffset.y % (20 * zoom)}px`
            }}
          />

          {/* Empty state */}
          {processedTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No tables in this zone</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {editMode ? 'Add a table to get started' : 'Switch to edit mode to add tables'}
                </p>
              </div>
            </div>
          )}

          {/* Tables */}
          {processedTables.map((table) => {
            // Calculate screen position from world coordinates
            const screenX = table.worldX * zoom + panOffset.x;
            const screenY = table.worldY * zoom + panOffset.y;
            const screenWidth = table.w * zoom;
            const screenHeight = table.h * zoom;

            const tableComponent = (
              <TableComponent
                key={table.id}
                table={{
                  ...table,
                  width: screenWidth,
                  height: screenHeight
                }}
                editMode={editMode}
                onRemoveTable={onRemoveTable}
                onTableResize={onTableResize}
                onTableMove={handleTableMove}
                zoom={zoom}
              />
            );

            return editMode ? (
              <Draggable
                key={table.id}
                position={{ x: screenX, y: screenY }}
                bounds="parent"
                onStop={(e, data) => {
                  handleTableDragEnd(table.id, data.x, data.y);
                }}
                disabled={false}
              >
                <div 
                  className="absolute cursor-move"
                  style={{ 
                    pointerEvents: 'auto',
                    width: screenWidth,
                    height: screenHeight
                  }}
                >
                  {tableComponent}
                </div>
              </Draggable>
            ) : (
              <div
                key={table.id}
                className="absolute"
                style={{ 
                  left: screenX, 
                  top: screenY,
                  width: screenWidth,
                  height: screenHeight
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {tableComponent}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

FloorPlanCanvas.displayName = 'FloorPlanCanvas';

export default FloorPlanCanvas;