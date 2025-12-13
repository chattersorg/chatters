// File: FloorplanEditor.jsx - Full-screen floor plan editor
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AlertModal from '../../components/ui/AlertModal';
import { Save, ArrowLeft, Square, Circle, RectangleHorizontal, Trash2, Plus } from 'lucide-react';

// Components
import FloorPlanCanvas from '../../components/dashboard/floorplan/FloorPlanCanvas';
import ZoneSelector from '../../components/dashboard/floorplan/ZoneSelector';
import MobileNotice from '../../components/dashboard/floorplan/MobileNotice';

const FloorplanEditor = () => {
  usePageTitle('Edit Floor Plan');
  const navigate = useNavigate();
  const { venueId } = useVenue();
  const layoutRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Designer state
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [tables, setTables] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(true); // Always start in edit mode
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal states
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [clearAllConfirmation, setClearAllConfirmation] = useState(false);
  const [zoneDeleteConfirmation, setZoneDeleteConfirmation] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

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

  // Data loading functions
  const loadZones = async (venueId) => {
    const { data } = await supabase
      .from('zones')
      .select('*')
      .eq('venue_id', venueId)
      .order('order');
    setZones(data || []);
    if (data && data.length > 0) setSelectedZoneId(data[0].id);
  };

  const loadTables = async (venueId) => {
    const { data } = await supabase
      .from('table_positions')
      .select('*')
      .eq('venue_id', venueId);

    const container = layoutRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    setTables(
      (data || []).map((t) => ({
        ...t,
        x_px: (t.x_percent / 100) * width,
        y_px: (t.y_percent / 100) * height,
        width: t.width || 56,
        height: t.height || 56,
      }))
    );
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
    const container = layoutRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();

    const defaultDimensions = {
      square: { width: 56, height: 56 },
      circle: { width: 56, height: 56 },
      long: { width: 112, height: 40 }
    };

    const dims = defaultDimensions[shape] || defaultDimensions.square;

    setTables((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        table_number: tableNumber,
        x_px: Math.round(width / 2),
        y_px: Math.round(height / 2),
        shape,
        width: dims.width,
        height: dims.height,
        venue_id: venueId,
        zone_id: selectedZoneId,
      },
    ]);
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

    if (tables.find(t => String(t.table_number) === number)) {
      setAlertModal({
        type: 'warning',
        title: 'Duplicate Table Number',
        message: 'Table number already exists. Please choose a different number.'
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
    setTables((prev) =>
      prev.map((tab) =>
        tab.id === tableId
          ? { ...tab, width, height }
          : tab
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleRemoveTable = async (id) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;

    setTables((prev) => prev.filter((t) => t.id !== id));

    const isTemp = id.startsWith('temp-');
    if (!isTemp) {
      await supabase.from('table_positions').delete().match({
        venue_id: venueId,
        table_number: table.table_number,
      });
    }

    setHasUnsavedChanges(true);
  };

  const handleSaveLayout = async () => {
    if (!venueId || !layoutRef.current) return;
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
      zone_id: t.zone_id ?? null,
    }));

    const { data: existing } = await supabase
      .from('table_positions')
      .select('id')
      .eq('venue_id', venueId);

    const existingIds = new Set((existing || []).map((t) => t.id));
    const currentIds = new Set(payload.filter((t) => typeof t.id === 'string' && !t.id.startsWith('temp-')).map((t) => t.id));
    const idsToDelete = [...existingIds].filter((id) => !currentIds.has(id));

    if (idsToDelete.length > 0) {
      await supabase.from('table_positions').delete().in('id', idsToDelete);
    }

    const { error } = await supabase.from('table_positions').upsert(payload, { onConflict: 'id' });

    if (error) {
      setAlertModal({
        type: 'error',
        title: 'Save Error',
        message: 'Error saving layout. Please check the console for details.'
      });
      console.error(error);
    } else {
      setHasUnsavedChanges(false);
      await loadTables(venueId);
    }

    setSaving(false);
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
    await supabase.from('table_positions').delete().eq('venue_id', venueId);
    setTables([]);
    setHasUnsavedChanges(false);
    setClearAllConfirmation(false);
  };

  // Zone handlers
  const handleZoneSelect = (zoneId) => setSelectedZoneId(zoneId);

  const handleZoneRename = async (zoneId, newName) => {
    await supabase.from('zones').update({ name: newName }).eq('id', zoneId);
    setZones((prev) => prev.map((zone) => (zone.id === zoneId ? { ...zone, name: newName } : zone)));
  };

  const handleZoneDelete = async (zoneId) => {
    const count = tables.filter((t) => t.zone_id === zoneId).length;
    setZoneDeleteConfirmation({ zoneId, count });
  };

  const confirmZoneDelete = async (zoneId) => {
    await supabase.from('table_positions').delete().eq('zone_id', zoneId);
    await supabase.from('zones').delete().eq('id', zoneId);
    await loadZones(venueId);
    await loadTables(venueId);
    setZoneDeleteConfirmation(null);
  };

  const handleCreateZone = async () => {
    const { data } = await supabase
      .from('zones')
      .insert({ name: 'New Zone', venue_id: venueId, order: zones.length + 1 })
      .select('*')
      .single();

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

          {/* Right: Clear All */}
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
