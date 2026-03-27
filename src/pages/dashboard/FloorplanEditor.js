// File: FloorplanEditor.jsx - Full-screen floor plan editor
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import useFloorplanHistory from '../../hooks/useFloorplanHistory';
import useFloorplanSelection from '../../hooks/useFloorplanSelection';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AlertModal from '../../components/ui/AlertModal';
import { Save, ArrowLeft, Square, Circle, RectangleHorizontal, Trash2, Plus, Undo2, Redo2, Copy, Clipboard } from 'lucide-react';

// Components
import FloorPlanCanvas from '../../components/dashboard/floorplan/FloorPlanCanvas';
import ZoneSelector from '../../components/dashboard/floorplan/ZoneSelector';
import MobileNotice from '../../components/dashboard/floorplan/MobileNotice';
import TableEditModal from '../../components/dashboard/floorplan/TableEditModal';
import AlignmentToolbar from '../../components/dashboard/floorplan/AlignmentToolbar';

const FloorplanEditor = () => {
  usePageTitle('Edit Floor Plan');
  const navigate = useNavigate();
  const { venueId } = useVenue();
  const layoutRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Use custom history hook for undo/redo
  const {
    tables,
    setTables,
    initializeTables,
    undo,
    redo,
    canUndo,
    canRedo
  } = useFloorplanHistory([]);

  // Use custom selection hook
  const {
    selectedIds,
    selectedCount,
    selectTable,
    selectMultiple,
    clearSelection,
    isSelected,
    getSelectedIds,
    selectAll
  } = useFloorplanSelection();

  // Designer state
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(true); // Always start in edit mode
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState([]);

  // Modal states
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [clearAllConfirmation, setClearAllConfirmation] = useState(false);
  const [zoneDeleteConfirmation, setZoneDeleteConfirmation] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [editingTable, setEditingTable] = useState(null);

  // Add table form state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableShape, setNewTableShape] = useState('square');

  // Check for mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Main data loading effect
  useEffect(() => {
    if (!venueId || isMobile) return;

    const load = async () => {
      await loadZones(venueId);
      await loadTables(venueId);
    };

    load();
  }, [venueId, isMobile]);

  // Track unsaved changes when tables change
  useEffect(() => {
    if (tables.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [tables]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts when typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Delete selected tables
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCount > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }

      // Undo (Cmd/Ctrl + Z)
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undo()) {
          setHasUnsavedChanges(true);
        }
      }

      // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
      if ((cmdKey && e.shiftKey && e.key === 'z') || (cmdKey && e.key === 'y')) {
        e.preventDefault();
        if (redo()) {
          setHasUnsavedChanges(true);
        }
      }

      // Copy (Cmd/Ctrl + C)
      if (cmdKey && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }

      // Paste (Cmd/Ctrl + V)
      if (cmdKey && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }

      // Duplicate (Cmd/Ctrl + D)
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }

      // Select all (Cmd/Ctrl + A)
      if (cmdKey && e.key === 'a') {
        e.preventDefault();
        const zoneTables = tables.filter(t => t.zone_id === selectedZoneId);
        selectAll(zoneTables.map(t => t.id));
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }

      // Arrow keys for nudging
      const NUDGE_AMOUNT = e.shiftKey ? 10 : 1;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedCount > 0) {
          e.preventDefault();
          handleNudge(e.key, NUDGE_AMOUNT);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, selectedIds, tables, selectedZoneId, undo, redo, canUndo, canRedo, clipboard]);

  // Data loading functions
  const loadZones = async (venueId) => {
    console.log('🗺️ [Editor] Loading zones for venue:', venueId);
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('venue_id', venueId)
      .is('deleted_at', null)
      .order('order');

    if (error) {
      console.error('❌ [Editor] Error loading zones:', error);
    }

    console.log('🗺️ [Editor] Zones loaded:', data?.length || 0, 'zones');
    console.log('🗺️ [Editor] Zone details:', data?.map(z => ({ id: z.id, name: z.name })));

    if (data && data.length > 0) {
      setZones(data);
      console.log('🗺️ [Editor] Setting selected zone to first zone:', data[0].id, data[0].name);
      setSelectedZoneId(data[0].id);
    } else {
      // Auto-create a default zone if none exist
      console.log('🗺️ [Editor] No zones found - creating default zone...');
      const { data: newZone, error: createError } = await supabase
        .from('zones')
        .insert({ name: 'Main Floor', venue_id: venueId, order: 1 })
        .select('*')
        .single();

      if (createError) {
        console.error('❌ [Editor] Failed to create default zone:', createError);
        setZones([]);
      } else {
        console.log('✅ [Editor] Default zone created:', newZone.id, newZone.name);
        setZones([newZone]);
        setSelectedZoneId(newZone.id);
      }
    }
  };

  const loadTables = async (venueId) => {
    console.log('🪑 [Editor] Loading tables for venue:', venueId);
    const { data, error } = await supabase
      .from('table_positions')
      .select('*')
      .eq('venue_id', venueId)
      .is('deleted_at', null);

    if (error) {
      console.error('❌ [Editor] Error loading tables:', error);
    }

    console.log('🪑 [Editor] Tables loaded:', data?.length || 0, 'tables');
    data?.forEach(t => {
      console.log(`   Table #${t.table_number} - zone_id: ${t.zone_id || 'NULL/UNASSIGNED'}`);
    });

    // Try to get container dimensions, but don't block if not ready
    // FloorPlanCanvas will re-calculate positions when it has container size
    const container = layoutRef.current;
    let width = 800;  // sensible default
    let height = 600; // sensible default

    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = rect.width;
        height = rect.height;
      }
    }

    const loadedTables = (data || []).map((t) => ({
      ...t,
      // Store percent values for FloorPlanCanvas to use
      x_percent: t.x_percent,
      y_percent: t.y_percent,
      // Calculate pixel values (will be recalculated by FloorPlanCanvas if container not ready)
      x_px: (t.x_percent / 100) * width,
      y_px: (t.y_percent / 100) * height,
      width: t.width || 56,
      height: t.height || 56,
    }));

    initializeTables(loadedTables);
    setHasUnsavedChanges(false);
  };

  // Navigation handlers
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setExitConfirmation(true);
      return;
    }
    navigate('/floorplan');
  };

  const confirmExit = () => {
    setExitConfirmation(false);
    navigate('/floorplan');
  };

  const handleToggleEdit = () => {
    setEditMode(!editMode);
  };

  const handleAddTable = (tableNumber, shape) => {
    console.log('➕ [Editor] Adding table:', tableNumber, 'shape:', shape);
    console.log('➕ [Editor] Current selectedZoneId:', selectedZoneId);
    console.log('➕ [Editor] Current zones state:', zones.map(z => ({ id: z.id, name: z.name })));

    if (!selectedZoneId) {
      console.error('❌ [Editor] CRITICAL: No zone selected! Cannot add table without zone.');
      setAlertModal({
        type: 'error',
        title: 'No Zone Selected',
        message: 'Please select or create a zone before adding tables.'
      });
      return;
    }

    const container = layoutRef.current;
    if (!container) {
      console.error('❌ [Editor] Container not available');
      return;
    }

    const { width, height } = container.getBoundingClientRect();

    const defaultDimensions = {
      square: { width: 56, height: 56 },
      circle: { width: 56, height: 56 },
      long: { width: 112, height: 40 }
    };

    const dims = defaultDimensions[shape] || defaultDimensions.square;

    const newTable = {
      id: `temp-${Date.now()}`,
      table_number: tableNumber,
      x_px: Math.round(width / 2),
      y_px: Math.round(height / 2),
      shape,
      width: dims.width,
      height: dims.height,
      venue_id: venueId,
      zone_id: selectedZoneId,
    };

    console.log('➕ [Editor] New table object:', newTable);

    setTables((prev) => [...prev, newTable]);
    setHasUnsavedChanges(true);
  };

  const handleAddTableClick = () => {
    const number = newTableNumber.trim();
    if (!number) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Table Number',
        message: 'Please enter a table number'
      });
      return;
    }

    // Check for duplicate table number within the same zone only
    if (tables.find(t => String(t.table_number) === number && t.zone_id === selectedZoneId)) {
      setAlertModal({
        type: 'warning',
        title: 'Duplicate Table Number',
        message: 'Table number already exists in this zone. Please choose a different number.'
      });
      return;
    }

    handleAddTable(number, newTableShape);
    setNewTableNumber('');
  };

  const shapeOptions = [
    { value: 'square', icon: Square, label: 'Square' },
    { value: 'circle', icon: Circle, label: 'Circle' },
    { value: 'long', icon: RectangleHorizontal, label: 'Rectangle' },
  ];

  const handleTableDrag = (tableId, x, y) => {
    const container = layoutRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    // Update both pixel and percent values to keep them in sync
    setTables((prev) => prev.map((tab) => (tab.id === tableId ? {
      ...tab,
      x_px: x,
      y_px: y,
      x_percent: (x / width) * 100,
      y_percent: (y / height) * 100
    } : tab)));
    setHasUnsavedChanges(true);
  };

  const handleTableResize = (tableId, width, height) => {
    const container = layoutRef.current;
    const containerWidth = container?.getBoundingClientRect().width || 800;
    const containerHeight = container?.getBoundingClientRect().height || 600;

    setTables((prev) =>
      prev.map((tab) =>
        tab.id === tableId
          ? {
              ...tab,
              width,
              height,
              // Also update percent values for proper scaling
              width_percent: (width / containerWidth) * 100,
              height_percent: (height / containerHeight) * 100
            }
          : tab
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleRemoveTable = (id) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;

    // Just remove from local state - actual deletion happens on save
    // This keeps behavior consistent: all changes require explicit save
    setTables((prev) => prev.filter((t) => t.id !== id));
    clearSelection();
    setHasUnsavedChanges(true);
  };

  // Delete selected tables
  const handleDeleteSelected = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;

    setTables((prev) => prev.filter((t) => !ids.includes(t.id)));
    clearSelection();
    setHasUnsavedChanges(true);
  };

  // Copy selected tables to clipboard
  const handleCopy = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;

    const selectedTables = tables.filter(t => ids.includes(t.id));
    setClipboard(selectedTables.map(t => ({ ...t })));
  };

  // Paste tables from clipboard
  const handlePaste = () => {
    if (clipboard.length === 0) return;

    const container = layoutRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    // Find highest table number in current zone for auto-increment
    const zoneTables = tables.filter(t => t.zone_id === selectedZoneId);
    const maxNumber = zoneTables.reduce((max, t) => {
      const num = parseInt(t.table_number, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newTables = clipboard.map((t, index) => ({
      ...t,
      id: `temp-${Date.now()}-${index}`,
      table_number: String(maxNumber + index + 1),
      x_px: t.x_px + 20, // Offset so they're not exactly overlapping
      y_px: t.y_px + 20,
      x_percent: ((t.x_px + 20) / width) * 100,
      y_percent: ((t.y_px + 20) / height) * 100,
      zone_id: selectedZoneId,
      venue_id: venueId
    }));

    setTables((prev) => [...prev, ...newTables]);
    // Select the newly pasted tables
    selectMultiple(newTables.map(t => t.id));
    setHasUnsavedChanges(true);
  };

  // Duplicate selected tables
  const handleDuplicate = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;

    const selectedTables = tables.filter(t => ids.includes(t.id));
    const container = layoutRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    // Find highest table number in current zone
    const zoneTables = tables.filter(t => t.zone_id === selectedZoneId);
    const maxNumber = zoneTables.reduce((max, t) => {
      const num = parseInt(t.table_number, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newTables = selectedTables.map((t, index) => ({
      ...t,
      id: `temp-${Date.now()}-${index}`,
      table_number: String(maxNumber + index + 1),
      x_px: t.x_px + 30,
      y_px: t.y_px + 30,
      x_percent: ((t.x_px + 30) / width) * 100,
      y_percent: ((t.y_px + 30) / height) * 100
    }));

    setTables((prev) => [...prev, ...newTables]);
    selectMultiple(newTables.map(t => t.id));
    setHasUnsavedChanges(true);
  };

  // Nudge selected tables with arrow keys
  const handleNudge = (direction, amount) => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;

    const container = layoutRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    setTables((prev) =>
      prev.map((t) => {
        if (!ids.includes(t.id)) return t;

        let newX = t.x_px;
        let newY = t.y_px;

        switch (direction) {
          case 'ArrowUp':
            newY -= amount;
            break;
          case 'ArrowDown':
            newY += amount;
            break;
          case 'ArrowLeft':
            newX -= amount;
            break;
          case 'ArrowRight':
            newX += amount;
            break;
        }

        return {
          ...t,
          x_px: newX,
          y_px: newY,
          x_percent: (newX / width) * 100,
          y_percent: (newY / height) * 100
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Alignment handlers
  const handleAlign = (alignment) => {
    const ids = getSelectedIds();
    if (ids.length < 2) return;

    const selectedTables = tables.filter(t => ids.includes(t.id));
    const container = layoutRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    let updates = {};

    switch (alignment) {
      case 'left': {
        const minX = Math.min(...selectedTables.map(t => t.x_px));
        selectedTables.forEach(t => {
          updates[t.id] = { x_px: minX, x_percent: (minX / width) * 100 };
        });
        break;
      }
      case 'right': {
        const maxRight = Math.max(...selectedTables.map(t => t.x_px + (t.width || 56)));
        selectedTables.forEach(t => {
          const newX = maxRight - (t.width || 56);
          updates[t.id] = { x_px: newX, x_percent: (newX / width) * 100 };
        });
        break;
      }
      case 'centerH': {
        const minX = Math.min(...selectedTables.map(t => t.x_px));
        const maxRight = Math.max(...selectedTables.map(t => t.x_px + (t.width || 56)));
        const centerX = (minX + maxRight) / 2;
        selectedTables.forEach(t => {
          const newX = centerX - (t.width || 56) / 2;
          updates[t.id] = { x_px: newX, x_percent: (newX / width) * 100 };
        });
        break;
      }
      case 'top': {
        const minY = Math.min(...selectedTables.map(t => t.y_px));
        selectedTables.forEach(t => {
          updates[t.id] = { y_px: minY, y_percent: (minY / height) * 100 };
        });
        break;
      }
      case 'bottom': {
        const maxBottom = Math.max(...selectedTables.map(t => t.y_px + (t.height || 56)));
        selectedTables.forEach(t => {
          const newY = maxBottom - (t.height || 56);
          updates[t.id] = { y_px: newY, y_percent: (newY / height) * 100 };
        });
        break;
      }
      case 'centerV': {
        const minY = Math.min(...selectedTables.map(t => t.y_px));
        const maxBottom = Math.max(...selectedTables.map(t => t.y_px + (t.height || 56)));
        const centerY = (minY + maxBottom) / 2;
        selectedTables.forEach(t => {
          const newY = centerY - (t.height || 56) / 2;
          updates[t.id] = { y_px: newY, y_percent: (newY / height) * 100 };
        });
        break;
      }
    }

    setTables((prev) =>
      prev.map((t) => (updates[t.id] ? { ...t, ...updates[t.id] } : t))
    );
    setHasUnsavedChanges(true);
  };

  // Distribute tables evenly
  const handleDistribute = (direction) => {
    const ids = getSelectedIds();
    if (ids.length < 3) return;

    const selectedTables = tables.filter(t => ids.includes(t.id));
    const container = layoutRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    // Sort by position
    const sorted = [...selectedTables].sort((a, b) =>
      direction === 'horizontal' ? a.x_px - b.x_px : a.y_px - b.y_px
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    let updates = {};

    if (direction === 'horizontal') {
      const totalWidth = sorted.reduce((sum, t) => sum + (t.width || 56), 0);
      const availableSpace = (last.x_px + (last.width || 56)) - first.x_px - totalWidth;
      const gap = availableSpace / (sorted.length - 1);

      let currentX = first.x_px;
      sorted.forEach((t) => {
        updates[t.id] = { x_px: currentX, x_percent: (currentX / width) * 100 };
        currentX += (t.width || 56) + gap;
      });
    } else {
      const totalHeight = sorted.reduce((sum, t) => sum + (t.height || 56), 0);
      const availableSpace = (last.y_px + (last.height || 56)) - first.y_px - totalHeight;
      const gap = availableSpace / (sorted.length - 1);

      let currentY = first.y_px;
      sorted.forEach((t) => {
        updates[t.id] = { y_px: currentY, y_percent: (currentY / height) * 100 };
        currentY += (t.height || 56) + gap;
      });
    }

    setTables((prev) =>
      prev.map((t) => (updates[t.id] ? { ...t, ...updates[t.id] } : t))
    );
    setHasUnsavedChanges(true);
  };

  // Double-click to edit table
  const handleTableDoubleClick = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setEditingTable(table);
    }
  };

  // Save edited table
  const handleSaveTableEdit = (updatedTable) => {
    setTables((prev) =>
      prev.map((t) => (t.id === updatedTable.id ? { ...t, ...updatedTable } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveLayout = async () => {
    console.log('💾 [Editor] Saving layout...');
    if (!venueId || !layoutRef.current) {
      console.error('❌ [Editor] Cannot save - venueId or container missing');
      return;
    }
    setSaving(true);

    const { width, height } = layoutRef.current.getBoundingClientRect();

    const payload = tables.map((t) => ({
      id: t.id.startsWith('temp-') ? uuidv4() : t.id,
      venue_id: t.venue_id,
      table_number: t.table_number,
      x_percent: (t.x_px / width) * 100,
      y_percent: (t.y_px / height) * 100,
      shape: t.shape,
      width: t.width || 56,
      height: t.height || 56,
      // Store dimensions as percentages for proper scaling across different container sizes
      width_percent: ((t.width || 56) / width) * 100,
      height_percent: ((t.height || 56) / height) * 100,
      zone_id: t.zone_id ?? null,
    }));

    console.log('💾 [Editor] Payload to save:', payload.length, 'tables');
    payload.forEach(t => {
      console.log(`   Saving table #${t.table_number} - zone_id: ${t.zone_id || 'NULL'}`);
    });

    // Check for tables without zone_id
    const nullZoneTables = payload.filter(t => !t.zone_id);
    if (nullZoneTables.length > 0) {
      console.warn('⚠️ [Editor] WARNING: Saving tables with NULL zone_id:', nullZoneTables.map(t => t.table_number));
    }

    const { data: existing } = await supabase
      .from('table_positions')
      .select('id')
      .eq('venue_id', venueId)
      .is('deleted_at', null);

    const existingIds = new Set((existing || []).map((t) => t.id));
    const currentIds = new Set(payload.filter((t) => typeof t.id === 'string' && !t.id.startsWith('temp-')).map((t) => t.id));
    const idsToDelete = [...existingIds].filter((id) => !currentIds.has(id));

    if (idsToDelete.length > 0) {
      console.log('🗑️ [Editor] Hard-deleting removed tables:', idsToDelete);
      // Hard delete to avoid unique constraint conflicts with soft-deleted records
      await supabase.from('table_positions').delete().in('id', idsToDelete);
    }

    // Also clean up any soft-deleted records with the same table numbers to avoid unique constraint conflicts
    const tableNumbers = payload.map(t => t.table_number);
    if (tableNumbers.length > 0) {
      const { error: cleanupError } = await supabase
        .from('table_positions')
        .delete()
        .eq('venue_id', venueId)
        .not('deleted_at', 'is', null)
        .in('table_number', tableNumbers);

      if (cleanupError) {
        console.warn('⚠️ [Editor] Cleanup warning:', cleanupError);
      }
    }

    const { error } = await supabase.from('table_positions').upsert(payload, { onConflict: 'id' });

    if (error) {
      setAlertModal({
        type: 'error',
        title: 'Save Error',
        message: 'Error saving layout. Please check the console for details.'
      });
      console.error('❌ [Editor] Save error:', error);
      setSaving(false);
    } else {
      console.log('✅ [Editor] Layout saved successfully');
      // Reload tables first, then clear unsaved flag to prevent race condition
      await loadTables(venueId);
      setHasUnsavedChanges(false);
      setSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSaveLayout();
    if (!alertModal) {
      navigate('/floorplan');
    }
  };

  const handleClearAllTables = async () => {
    if (!venueId) return;
    setClearAllConfirmation(true);
  };

  const confirmClearAllTables = async () => {
    // Soft delete - set deleted_at timestamp instead of removing
    await supabase.from('table_positions').update({
      deleted_at: new Date().toISOString()
    }).eq('venue_id', venueId).is('deleted_at', null);
    initializeTables([]);
    setHasUnsavedChanges(false);
    setClearAllConfirmation(false);
  };

  // Zone handlers
  const handleZoneSelect = (zoneId) => {
    setSelectedZoneId(zoneId);
    clearSelection();
  };

  const handleZoneRename = async (zoneId, newName) => {
    const { error } = await supabase.from('zones').update({ name: newName }).eq('id', zoneId);
    if (error) {
      console.error('❌ [Editor] Error renaming zone:', error);
      setAlertModal({
        type: 'error',
        title: 'Rename Error',
        message: 'Failed to rename zone. Please try again.'
      });
      return;
    }
    setZones((prev) => prev.map((zone) => (zone.id === zoneId ? { ...zone, name: newName } : zone)));
  };

  const handleZoneDelete = async (zoneId) => {
    const count = tables.filter((t) => t.zone_id === zoneId).length;
    setZoneDeleteConfirmation({ zoneId, count });
  };

  const confirmZoneDelete = async (zoneId) => {
    // Soft delete tables in this zone
    const { error: tableError } = await supabase.from('table_positions').update({
      deleted_at: new Date().toISOString()
    }).eq('zone_id', zoneId).is('deleted_at', null);

    if (tableError) {
      console.error('❌ [Editor] Error deleting zone tables:', tableError);
      setAlertModal({
        type: 'error',
        title: 'Delete Error',
        message: 'Failed to delete zone tables. Please try again.'
      });
      setZoneDeleteConfirmation(null);
      return;
    }

    // Soft delete the zone (consistent with table soft delete)
    const { error: zoneError } = await supabase.from('zones').update({
      deleted_at: new Date().toISOString()
    }).eq('id', zoneId);

    if (zoneError) {
      console.error('❌ [Editor] Error deleting zone:', zoneError);
      setAlertModal({
        type: 'error',
        title: 'Delete Error',
        message: 'Failed to delete zone. Please try again.'
      });
      setZoneDeleteConfirmation(null);
      return;
    }

    await loadZones(venueId);
    await loadTables(venueId);
    setZoneDeleteConfirmation(null);
  };

  const handleCreateZone = async () => {
    const { data, error } = await supabase
      .from('zones')
      .insert({ name: 'New Zone', venue_id: venueId, order: zones.length + 1 })
      .select('*')
      .single();

    if (error) {
      console.error('❌ [Editor] Error creating zone:', error);
      setAlertModal({
        type: 'error',
        title: 'Create Error',
        message: 'Failed to create zone. Please try again.'
      });
      return;
    }

    if (data) {
      await loadZones(venueId);
      setSelectedZoneId(data.id);
    }
  };

  // Show mobile notice on small screens
  if (isMobile) {
    return <MobileNotice />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Floor Plan Editor</h1>
            </div>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => undo() && setHasUnsavedChanges(true)}
                disabled={!canUndo}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => redo() && setHasUnsavedChanges(true)}
                disabled={!canRedo}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSaveLayout}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleSaveAndClose}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Add Table Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Add:</span>
            <div className="flex items-center gap-1">
              {shapeOptions.map((shape) => {
                const Icon = shape.icon;
                return (
                  <button
                    key={shape.value}
                    onClick={() => setNewTableShape(shape.value)}
                    className={`p-2 rounded-lg transition-all ${
                      newTableShape === shape.value
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={shape.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Table #"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTableClick()}
              className="w-20 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={handleAddTableClick}
              disabled={!newTableNumber.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

            {/* Zone Selector */}
            <ZoneSelector
              zones={zones}
              selectedZoneId={selectedZoneId}
              editMode={editMode}
              onZoneSelect={handleZoneSelect}
              onZoneRename={handleZoneRename}
              onZoneDelete={handleZoneDelete}
              onCreateZone={handleCreateZone}
            />
          </div>

          {/* Center: Alignment Tools (when tables selected) */}
          <AlignmentToolbar
            selectedCount={selectedCount}
            onAlign={handleAlign}
            onDistribute={handleDistribute}
          />

          {/* Right: Clear All & Copy/Paste */}
          <div className="flex items-center gap-2">
            {/* Copy/Paste buttons */}
            {selectedCount > 0 && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors"
                  title="Duplicate (Ctrl+D)"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
              </>
            )}

            {clipboard.length > 0 && (
              <button
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-2 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium transition-colors"
                title={`Paste ${clipboard.length} table(s) (Ctrl+V)`}
              >
                <Clipboard className="w-4 h-4" />
                Paste ({clipboard.length})
              </button>
            )}

            {tables.length > 0 && (
              <button
                onClick={handleClearAllTables}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 px-4 py-1">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Del</kbd> Delete</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘Z</kbd> Undo</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘D</kbd> Duplicate</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘A</kbd> Select All</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓←→</kbd> Nudge</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift</kbd>+click Multi-select</span>
          <span>Double-click to edit</span>
        </div>
      </div>

      {/* Canvas - Full Width */}
      <div className="flex-1 overflow-hidden h-full">
        <div className="h-full w-full">
          <FloorPlanCanvas
            ref={layoutRef}
            tables={tables}
            selectedZoneId={selectedZoneId}
            editMode={editMode}
            onTableDrag={handleTableDrag}
            onRemoveTable={handleRemoveTable}
            onTableResize={handleTableResize}
            selectedIds={selectedIds}
            onTableSelect={selectTable}
            onMultiSelect={selectMultiple}
            onTableDoubleClick={handleTableDoubleClick}
          />
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <ConfirmationModal
        isOpen={exitConfirmation}
        onConfirm={confirmExit}
        onCancel={() => setExitConfirmation(false)}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave without saving?"
        confirmText="Leave Without Saving"
        cancelText="Stay"
        confirmButtonStyle="warning"
        icon="warning"
      />

      {/* Clear All Tables Confirmation Modal */}
      <ConfirmationModal
        isOpen={clearAllConfirmation}
        onConfirm={confirmClearAllTables}
        onCancel={() => setClearAllConfirmation(false)}
        title="Clear All Tables"
        message="Are you sure you want to delete all tables in this venue? This action cannot be undone."
        confirmText="Delete All Tables"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        icon="danger"
      />

      {/* Zone Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!zoneDeleteConfirmation}
        onConfirm={() => confirmZoneDelete(zoneDeleteConfirmation?.zoneId)}
        onCancel={() => setZoneDeleteConfirmation(null)}
        title="Delete Zone"
        message={
          zoneDeleteConfirmation?.count > 0
            ? `This zone contains ${zoneDeleteConfirmation.count} table${zoneDeleteConfirmation.count !== 1 ? 's' : ''}. Deleting the zone will permanently remove ${zoneDeleteConfirmation.count === 1 ? 'it' : 'them'}. This action cannot be undone.`
            : "Are you sure you want to delete this zone? This action cannot be undone."
        }
        confirmText="Delete Zone"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        icon="danger"
      />

      {/* Table Edit Modal */}
      <TableEditModal
        isOpen={!!editingTable}
        onClose={() => setEditingTable(null)}
        table={editingTable}
        onSave={handleSaveTableEdit}
        existingTableNumbers={tables}
        zones={zones}
        currentZoneId={selectedZoneId}
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

export default FloorplanEditor;
