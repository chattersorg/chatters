// File: Floorplan.jsx
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AlertModal from '../../components/ui/AlertModal';

// Components
import FloorPlanCanvas from '../../components/dashboard/floorplan/FloorPlanCanvas';
import ZoneSelector from '../../components/dashboard/floorplan/ZoneSelector';
import EditControls from '../../components/dashboard/floorplan/EditControls';
import MobileNotice from '../../components/dashboard/floorplan/MobileNotice';

const Floorplan = () => {
  usePageTitle('Floor Plan');
  const { venueId } = useVenue();
  const layoutRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Designer state
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [tables, setTables] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false); // default to view mode
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Modal states
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [clearAllConfirmation, setClearAllConfirmation] = useState(false);
  const [zoneDeleteConfirmation, setZoneDeleteConfirmation] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

  // Check for mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Less than lg breakpoint
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
        width: t.width || 56,  // Default width if not set
        height: t.height || 56, // Default height if not set
      }))
    );
  };

  // Event handlers
  const handleToggleEdit = () => {
    if (editMode && hasUnsavedChanges) {
      setExitConfirmation(true);
      return;
    }
    setEditMode(!editMode);
    setHasUnsavedChanges(false);
  };

  const confirmExitEdit = () => {
    setEditMode(false);
    setHasUnsavedChanges(false);
    setExitConfirmation(false);
  };

  const handleAddTable = (tableNumber, shape) => {
    const container = layoutRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    
    // Set default dimensions based on shape
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

  const handleTableDrag = (tableId, x, y) => {
    setTables((prev) => prev.map((tab) => (tab.id === tableId ? { ...tab, x_px: x, y_px: y } : tab)));
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
      setEditMode(false); // return to view mode after saving
      setHasUnsavedChanges(false);
      await loadTables(venueId); // Reload to get persisted IDs/positions
    }

    setSaving(false);
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Floor Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your venue layout and table arrangements</p>
        </div>
        {!editMode && (
          <button
            onClick={handleToggleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Edit Layout
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-6">
        <div className="space-y-6">
          <EditControls
            editMode={editMode}
            hasUnsavedChanges={hasUnsavedChanges}
            saving={saving}
            tables={tables}
            onToggleEdit={handleToggleEdit}
            onAddTable={handleAddTable}
            onSaveLayout={handleSaveLayout}
            onClearAllTables={handleClearAllTables}
            onShowAlert={setAlertModal}
          />
          
          <ZoneSelector
            zones={zones}
            selectedZoneId={selectedZoneId}
            editMode={editMode}
            onZoneSelect={handleZoneSelect}
            onZoneRename={handleZoneRename}
            onZoneDelete={handleZoneDelete}
            onCreateZone={handleCreateZone}
          />

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

      {/* Exit Edit Confirmation Modal */}
      <ConfirmationModal
        isOpen={exitConfirmation}
        onConfirm={confirmExitEdit}
        onCancel={() => setExitConfirmation(false)}
        title="Exit Edit Mode"
        message="You have unsaved changes. Are you sure you want to exit without saving?"
        confirmText="Exit Without Saving"
        cancelText="Stay in Edit Mode"
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

export default Floorplan;