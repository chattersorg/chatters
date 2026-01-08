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
      previewMode = false, // Static view - no zoom, pan, or interaction
      selectedIds = new Set(), // Selected table IDs from parent
      onTableSelect, // Callback for selecting single table
      onMultiSelect, // Callback for selecting multiple tables (drag selection)
      onTableDoubleClick, // Callback for double-click to edit
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

    // Drag selection state
    const [isDragSelecting, setIsDragSelecting] = useState(false);
    const [dragSelectStart, setDragSelectStart] = useState({ x: 0, y: 0 });
    const [dragSelectEnd, setDragSelectEnd] = useState({ x: 0, y: 0 });
    const dragSelectEndRef = useRef({ x: 0, y: 0 }); // Ref to avoid stale closure
    const dragSelectStartRef = useRef({ x: 0, y: 0 }); // Ref for start position too
    const justFinishedDragSelectRef = useRef(false); // Flag to skip click after drag selection

    // Snap line state for showing alignment guides
    const [snapLines, setSnapLines] = useState([]);

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

    // Process tables - convert from percent if pixel values are not set or are 0
    const processedTables = useMemo(() => {
      return filteredTables.map(t => {
        let worldX, worldY, w, h;

        // Prefer percent-based conversion if we have container size and percent values
        // This ensures consistent positioning regardless of when tables were loaded
        if (t.x_percent !== undefined && t.y_percent !== undefined && containerSize.width > 0 && containerSize.height > 0) {
          worldX = (t.x_percent / 100) * containerSize.width;
          worldY = (t.y_percent / 100) * containerSize.height;

          // In preview mode, use percentage-based dimensions for proper scaling
          // In edit mode, use direct width/height values for responsive resize
          if (previewMode && t.width_percent !== undefined && t.height_percent !== undefined) {
            w = (t.width_percent / 100) * containerSize.width;
            h = (t.height_percent / 100) * containerSize.height;
          } else {
            // Use absolute pixel dimensions (updated by resize operations)
            w = t.width || 56;
            h = t.height || 56;
          }
        } else {
          // Fall back to pixel values if available
          worldX = t.x_px ?? 0;
          worldY = t.y_px ?? 0;
          w = t.width || 56;
          h = t.height || 56;
        }

        return { ...t, worldX, worldY, w, h };
      });
    }, [filteredTables, containerSize, previewMode]);

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
        // Use requestAnimationFrame instead of setTimeout for smoother transition
        requestAnimationFrame(() => {
          fitToScreen();
        });
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

    // Attach wheel event listener with passive: false to allow preventDefault (not in preview mode)
    useEffect(() => {
      if (previewMode) return;
      const el = containerRef.current;
      if (!el) return;

      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel, previewMode]);

    // Pan controls - use refs to avoid stale closures in event listeners
    const panStateRef = useRef({ dragStart: { x: 0, y: 0 }, panStart: { x: 0, y: 0 } });

    const startPan = (e) => {
      if (editMode || previewMode) return; // Don't pan in edit mode or preview mode
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: panOffset.x, y: panOffset.y });
      // Store in ref for stable access in event handlers
      panStateRef.current = {
        dragStart: { x: e.clientX, y: e.clientY },
        panStart: { x: panOffset.x, y: panOffset.y }
      };
      document.body.style.cursor = 'grabbing';
    };

    // Stable refs for event handlers to prevent stale closures
    const onPanRef = useRef(null);
    const endPanRef = useRef(null);

    // Update refs with current handlers
    onPanRef.current = (e) => {
      const { dragStart: ds, panStart: ps } = panStateRef.current;
      const dx = e.clientX - ds.x;
      const dy = e.clientY - ds.y;
      setPanOffset({
        x: ps.x + dx,
        y: ps.y + dy
      });
    };

    endPanRef.current = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    useEffect(() => {
      if (!isDragging) return;

      // Create stable wrapper functions that call current refs
      const handleMove = (e) => onPanRef.current?.(e);
      const handleEnd = () => endPanRef.current?.();

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
      };
    }, [isDragging]);

    // Handle table drag in real-time - show snap lines while dragging
    const handleTableDragging = (tableId, screenX, screenY) => {
      // Convert screen coordinates to container pixel coordinates
      const containerX = (screenX - panOffset.x) / zoom;
      const containerY = (screenY - panOffset.y) / zoom;

      const table = tables.find(t => t.id === tableId);
      if (table) {
        // Find snap points and update snap lines in real-time
        const otherTables = processedTables.filter(t => t.id !== tableId);
        const { lines } = findSnapPoints(table, containerX, containerY, otherTables);
        setSnapLines(lines);
      }
    };

    // Handle table drag end - apply final position with snapping
    const handleTableDragEnd = (tableId, screenX, screenY) => {
      // Convert screen coordinates back to container pixel coordinates
      let containerX = (screenX - panOffset.x) / zoom;
      let containerY = (screenY - panOffset.y) / zoom;

      const table = tables.find(t => t.id === tableId);
      if (table) {
        // Magnetic alignment with other tables
        const otherTables = processedTables.filter(t => t.id !== tableId);
        const { snapX, snapY } = findSnapPoints(table, containerX, containerY, otherTables);
        containerX = snapX;
        containerY = snapY;
      }

      // Clear snap lines after drag ends
      setSnapLines([]);

      onTableDrag(tableId, containerX, containerY);
    };

    // Magnetic alignment helper - finds nearby snap points and generates snap lines
    const findSnapPoints = useCallback((movingTable, newX, newY, otherTables) => {
      const SNAP_DISTANCE = 10;
      let snapX = newX;
      let snapY = newY;
      const lines = []; // Snap lines to render

      const movingW = movingTable.w || movingTable.width || 56;
      const movingH = movingTable.h || movingTable.height || 56;

      for (const otherTable of otherTables) {
        if (otherTable.id === movingTable.id || otherTable.zone_id !== movingTable.zone_id) continue;

        // Use worldX/worldY from processed tables, or fall back to x_px/y_px, then to 0
        const otherX = otherTable.worldX ?? otherTable.x_px ?? 0;
        const otherY = otherTable.worldY ?? otherTable.y_px ?? 0;
        const otherW = otherTable.w || otherTable.width || 56;
        const otherH = otherTable.h || otherTable.height || 56;

        // Skip if other table has invalid coordinates
        if (isNaN(otherX) || isNaN(otherY)) continue;

        // Calculate the full extent of both tables for line drawing
        const minX = Math.min(newX, otherX);
        const maxX = Math.max(newX + movingW, otherX + otherW);
        const minY = Math.min(newY, otherY);
        const maxY = Math.max(newY + movingH, otherY + otherH);

        // Horizontal alignment (same Y or aligned edges) - lines extend full width
        if (Math.abs(newY - otherY) < SNAP_DISTANCE) {
          snapY = otherY; // Top edges align
          lines.push({
            type: 'horizontal',
            y: otherY,
            x1: minX,
            x2: maxX
          });
        } else if (Math.abs(newY + movingH - (otherY + otherH)) < SNAP_DISTANCE) {
          snapY = otherY + otherH - movingH; // Bottom edges align
          lines.push({
            type: 'horizontal',
            y: otherY + otherH,
            x1: minX,
            x2: maxX
          });
        } else if (Math.abs(newY + movingH/2 - (otherY + otherH/2)) < SNAP_DISTANCE) {
          snapY = otherY + otherH/2 - movingH/2; // Centers align vertically
          lines.push({
            type: 'horizontal',
            y: otherY + otherH/2,
            x1: minX,
            x2: maxX
          });
        }

        // Vertical alignment (same X or aligned edges) - lines extend full height
        if (Math.abs(newX - otherX) < SNAP_DISTANCE) {
          snapX = otherX; // Left edges align
          lines.push({
            type: 'vertical',
            x: otherX,
            y1: minY,
            y2: maxY
          });
        } else if (Math.abs(newX + movingW - (otherX + otherW)) < SNAP_DISTANCE) {
          snapX = otherX + otherW - movingW; // Right edges align
          lines.push({
            type: 'vertical',
            x: otherX + otherW,
            y1: minY,
            y2: maxY
          });
        } else if (Math.abs(newX + movingW/2 - (otherX + otherW/2)) < SNAP_DISTANCE) {
          snapX = otherX + otherW/2 - movingW/2; // Centers align horizontally
          lines.push({
            type: 'vertical',
            x: otherX + otherW/2,
            y1: minY,
            y2: maxY
          });
        }
      }

      return { snapX, snapY, lines };
    }, []);

    // Handle table move from resize operations - apply relative deltas
    const handleTableMove = (tableId, deltaX, deltaY) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      // Apply deltas directly to existing position
      let newX = table.x_px + deltaX;
      let newY = table.y_px + deltaY;

      // Magnetic alignment with other tables
      const otherTables = processedTables.filter(t => t.id !== tableId);
      const { snapX, snapY, lines } = findSnapPoints(table, newX, newY, otherTables);

      // Show snap lines briefly when snapping
      if (lines.length > 0) {
        setSnapLines(lines);
        setTimeout(() => setSnapLines([]), 400);
      }

      onTableDrag(tableId, snapX, snapY);
    };

    // Handle table click for selection
    const handleTableClick = (e, tableId) => {
      if (!editMode || !onTableSelect) return;
      e.stopPropagation();
      onTableSelect(tableId, e.shiftKey);
    };

    // Handle table double-click
    const handleTableDblClick = (e, tableId) => {
      if (!editMode || !onTableDoubleClick) return;
      e.stopPropagation();
      onTableDoubleClick(tableId);
    };

    // Handle canvas click to clear selection
    const handleCanvasClick = (e) => {
      // Skip if we just finished a drag selection (to avoid clearing the selection)
      if (justFinishedDragSelectRef.current) {
        justFinishedDragSelectRef.current = false;
        return;
      }

      if (!editMode || !onTableSelect) return;
      // Only clear if not clicking on a table
      const isTableClick = e.target.closest('[data-table-id]') ||
                          e.target.closest('.react-draggable');
      if (!isTableClick) {
        onTableSelect(null, false); // Clear selection
      }
    };

    // Drag selection handlers
    const handleDragSelectStart = (e) => {
      if (!editMode || previewMode) return;

      // Check if we clicked on the drag-select-layer (our dedicated selection layer)
      const target = e.target;
      if (!target.classList.contains('drag-select-layer')) {
        return;
      }

      e.preventDefault(); // Prevent text selection
      e.stopPropagation(); // Stop event from reaching draggables

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragSelecting(true);
      setDragSelectStart({ x, y });
      setDragSelectEnd({ x, y });
      dragSelectStartRef.current = { x, y }; // Initialize start ref
      dragSelectEndRef.current = { x, y }; // Initialize end ref
    };

    // Store latest values in refs to avoid stale closures
    const selectionDataRef = useRef({
      processedTables: [],
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      onMultiSelect: null,
      onTableSelect: null
    });

    // Keep refs updated with latest values
    selectionDataRef.current = {
      processedTables,
      zoom,
      panOffset,
      onMultiSelect,
      onTableSelect
    };

    useEffect(() => {
      if (!isDragSelecting) return;

      const handleMove = (e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const newEnd = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        setDragSelectEnd(newEnd);
        dragSelectEndRef.current = newEnd;
      };

      const handleEnd = () => {
        // Use refs to get latest values
        const startPos = dragSelectStartRef.current;
        const endPos = dragSelectEndRef.current;
        const { processedTables: tables, zoom: z, panOffset: pan, onMultiSelect: multiSelect } = selectionDataRef.current;

        // Calculate which tables are in the selection box
        const minX = Math.min(startPos.x, endPos.x);
        const maxX = Math.max(startPos.x, endPos.x);
        const minY = Math.min(startPos.y, endPos.y);
        const maxY = Math.max(startPos.y, endPos.y);

        // Only select if the box has some size
        if (maxX - minX > 5 || maxY - minY > 5) {
          const selectedTableIds = tables.filter(table => {
            const screenX = table.worldX * z + pan.x;
            const screenY = table.worldY * z + pan.y;
            const screenW = table.w * z;
            const screenH = table.h * z;

            // Check if table intersects with selection box
            return screenX < maxX && screenX + screenW > minX &&
                   screenY < maxY && screenY + screenH > minY;
          }).map(t => t.id);

          if (selectedTableIds.length > 0 && multiSelect) {
            multiSelect(selectedTableIds);
            // Set flag to prevent the subsequent click event from clearing selection
            justFinishedDragSelectRef.current = true;
          }
        }

        setIsDragSelecting(false);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
      };
    }, [isDragSelecting]);

    // Calculate drag selection rectangle
    const dragSelectRect = isDragSelecting ? {
      left: Math.min(dragSelectStart.x, dragSelectEnd.x),
      top: Math.min(dragSelectStart.y, dragSelectEnd.y),
      width: Math.abs(dragSelectEnd.x - dragSelectStart.x),
      height: Math.abs(dragSelectEnd.y - dragSelectStart.y)
    } : null;

    return (
      <div className="relative h-full">
        {/* Zoom Controls - hidden in preview mode */}
        {!previewMode && (
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
        )}

        <div
          ref={containerRef}
          className={`relative w-full bg-gray-50 dark:bg-gray-900 overflow-hidden canvas-background ${previewMode ? 'h-[600px] border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg' : 'h-full'}`}
          onMouseDown={(e) => {
            if (previewMode) return;
            if (editMode) {
              handleDragSelectStart(e);
            } else {
              startPan(e);
            }
          }}
          onClick={handleCanvasClick}
          style={{
            cursor: previewMode ? 'default' : (isDragging ? 'grabbing' : (editMode ? 'crosshair' : 'grab'))
          }}
        >
          {/* Subtle grid pattern for visual reference */}
          <div
            className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none canvas-background"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${panOffset.x % (20 * zoom)}px ${panOffset.y % (20 * zoom)}px`
            }}
          />

          {/* Drag selection layer - transparent layer that captures mouse events for drag selection */}
          {editMode && !previewMode && (
            <div
              className="absolute inset-0 z-10 drag-select-layer"
              style={{ cursor: 'crosshair' }}
              onMouseDown={handleDragSelectStart}
            />
          )}

          {/* Drag selection box */}
          {dragSelectRect && (
            <div
              className="absolute pointer-events-none z-40 border-2 border-blue-500 bg-blue-500/10"
              style={{
                left: dragSelectRect.left,
                top: dragSelectRect.top,
                width: dragSelectRect.width,
                height: dragSelectRect.height
              }}
            />
          )}

          {/* Snap lines - purple lines showing alignment (like Figma) */}
          {snapLines.map((line, index) => {
            if (line.type === 'horizontal') {
              // Horizontal line across aligned tables
              const screenY = line.y * zoom + panOffset.y;
              const screenX1 = line.x1 * zoom + panOffset.x;
              const screenX2 = line.x2 * zoom + panOffset.x;
              const width = Math.abs(screenX2 - screenX1);

              return (
                <div
                  key={`snap-h-${index}`}
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: Math.min(screenX1, screenX2),
                    top: screenY - 1,
                    width: Math.max(width, 1),
                    height: 2,
                    backgroundColor: '#a855f7' // purple-500
                  }}
                />
              );
            } else {
              // Vertical line across aligned tables
              const screenX = line.x * zoom + panOffset.x;
              const screenY1 = line.y1 * zoom + panOffset.y;
              const screenY2 = line.y2 * zoom + panOffset.y;
              const height = Math.abs(screenY2 - screenY1);

              return (
                <div
                  key={`snap-v-${index}`}
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: screenX - 1,
                    top: Math.min(screenY1, screenY2),
                    width: 2,
                    height: Math.max(height, 1),
                    backgroundColor: '#a855f7' // purple-500
                  }}
                />
              );
            }
          })}

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
            const isTableSelected = selectedIds.has?.(table.id) || (selectedIds instanceof Set && selectedIds.has(table.id));

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
                isSelected={isTableSelected}
              />
            );

            return editMode ? (
              <Draggable
                key={table.id}
                position={{ x: screenX, y: screenY }}
                bounds="parent"
                onDrag={(e, data) => {
                  handleTableDragging(table.id, data.x, data.y);
                }}
                onStop={(e, data) => {
                  handleTableDragEnd(table.id, data.x, data.y);
                }}
                disabled={false}
              >
                <div
                  className={`absolute cursor-move z-20 ${isTableSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 rounded-lg' : ''}`}
                  style={{
                    pointerEvents: 'auto',
                    width: screenWidth,
                    height: screenHeight
                  }}
                  onClick={(e) => handleTableClick(e, table.id)}
                  onDoubleClick={(e) => handleTableDblClick(e, table.id)}
                >
                  {tableComponent}
                </div>
              </Draggable>
            ) : (
              <div
                key={table.id}
                className="absolute transition-all duration-150 ease-out"
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
