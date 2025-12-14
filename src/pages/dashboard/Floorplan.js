// File: Floorplan.jsx - Floor plan preview page
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { Pencil, Grid3X3, Layers } from 'lucide-react';

// Components
import FloorPlanCanvas from '../../components/dashboard/floorplan/FloorPlanCanvas';
import ZoneSelector from '../../components/dashboard/floorplan/ZoneSelector';
import MobileNotice from '../../components/dashboard/floorplan/MobileNotice';

const Floorplan = () => {
  usePageTitle('Floor Plan');
  const navigate = useNavigate();
  const { venueId } = useVenue();
  const layoutRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // State
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      await loadZones(venueId);
      await loadTables(venueId);
      setLoading(false);
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
    if (!container) {
      // Set tables without pixel conversion if container not ready
      setTables(
        (data || []).map((t) => ({
          ...t,
          x_px: 0,
          y_px: 0,
          width: t.width || 56,
          height: t.height || 56,
        }))
      );
      return;
    }

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

  // Zone handlers (read-only)
  const handleZoneSelect = (zoneId) => setSelectedZoneId(zoneId);

  // Navigate to editor
  const handleEditFloorPlan = () => {
    navigate('/floorplan/edit');
  };

  // Show mobile notice on small screens
  if (isMobile) {
    return <MobileNotice />;
  }

  // Calculate stats
  const totalTables = tables.length;
  const tablesInCurrentZone = tables.filter(t => t.zone_id === selectedZoneId).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Floor Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your venue layout and table arrangements</p>
        </div>
        <button
          onClick={handleEditFloorPlan}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit Floor Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Grid3X3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tables</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalTables}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Zones</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{zones.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Grid3X3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tables in Zone</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{tablesInCurrentZone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Plan Preview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <ZoneSelector
            zones={zones}
            selectedZoneId={selectedZoneId}
            editMode={false}
            onZoneSelect={handleZoneSelect}
            onZoneRename={() => {}}
            onZoneDelete={() => {}}
            onCreateZone={() => {}}
          />
        </div>

        <div className="p-4">
          <FloorPlanCanvas
            ref={layoutRef}
            tables={tables}
            selectedZoneId={selectedZoneId}
            editMode={false}
            previewMode={true}
            onTableDrag={() => {}}
            onRemoveTable={() => {}}
            onTableResize={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default Floorplan;