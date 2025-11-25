import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import ConfigurableMultiVenueTile from '../../components/dashboard/reports/ConfigurableMultiVenueTile';
import NPSChartTile from '../../components/dashboard/reports/NPSChartTile';
import FeedbackChartTile from '../../components/dashboard/reports/FeedbackChartTile';
import MetricSelectorModal from '../../components/dashboard/modals/MetricSelectorModal';
import NPSConfigModal from '../../components/dashboard/modals/NPSConfigModal';
import FeedbackConfigModal from '../../components/dashboard/modals/FeedbackConfigModal';
import usePageTitle from '../../hooks/usePageTitle';
import { Plus, GripVertical, Settings, Save, X, Edit2, Trash2, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomDashboard = () => {
  usePageTitle('Dashboard Views');

  // View management state
  const [views, setViews] = useState([]);
  const [currentView, setCurrentView] = useState(null);
  const [loadingViews, setLoadingViews] = useState(true);

  // Tile state - separate draft and saved
  const [savedTiles, setSavedTiles] = useState([]);
  const [draftTiles, setDraftTiles] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNPSConfigOpen, setIsNPSConfigOpen] = useState(false);
  const [isFeedbackConfigOpen, setIsFeedbackConfigOpen] = useState(false);
  const [editingTilePosition, setEditingTilePosition] = useState(null);
  const [configuringTile, setConfiguringTile] = useState(null);
  const [draggedTile, setDraggedTile] = useState(null);
  const [isRenamingView, setIsRenamingView] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    loadViews();
  }, []);

  useEffect(() => {
    if (currentView) {
      loadTiles(currentView.id);
    }
  }, [currentView]);

  const loadViews = async () => {
    try {
      setLoadingViews(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from('dashboard_views')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Create default view if none exist
        await createDefaultView(userId);
        return;
      }

      setViews(data);
      const defaultView = data.find(v => v.is_default) || data[0];
      setCurrentView(defaultView);
    } catch (error) {
      console.error('Error loading views:', error);
      toast.error('Failed to load dashboard views');
    } finally {
      setLoadingViews(false);
    }
  };

  const createDefaultView = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('dashboard_views')
        .insert({
          user_id: userId,
          name: 'Default View',
          is_default: true,
          position: 0
        })
        .select()
        .single();

      if (error) throw error;

      setViews([data]);
      setCurrentView(data);
    } catch (error) {
      console.error('Error creating default view:', error);
      toast.error('Failed to create default view');
    }
  };

  const loadTiles = async (viewId) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from('custom_dashboard_tiles')
        .select('*')
        .eq('view_id', viewId)
        .order('position', { ascending: true });

      if (error) throw error;

      setSavedTiles(data || []);
      setDraftTiles(data || []);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading tiles:', error);
      toast.error('Failed to load tiles');
    }
  };

  const handleCreateView = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) return;

      const viewName = `View ${views.length + 1}`;
      const { data, error } = await supabase
        .from('dashboard_views')
        .insert({
          user_id: userId,
          name: viewName,
          is_default: false,
          position: views.length
        })
        .select()
        .single();

      if (error) throw error;

      setViews(prev => [...prev, data]);
      setCurrentView(data);
    } catch (error) {
      console.error('Error creating view:', error);
      toast.error('Failed to create view');
    }
  };

  const handleRenameView = async (viewId, newName) => {
    try {
      if (!newName.trim()) {
        toast.error('View name cannot be empty');
        return;
      }

      const { error } = await supabase
        .from('dashboard_views')
        .update({ name: newName.trim() })
        .eq('id', viewId);

      if (error) throw error;

      setViews(prev =>
        prev.map(v => (v.id === viewId ? { ...v, name: newName.trim() } : v))
      );
      if (currentView?.id === viewId) {
        setCurrentView(prev => ({ ...prev, name: newName.trim() }));
      }
      setIsRenamingView(null);
    } catch (error) {
      console.error('Error renaming view:', error);
      toast.error('Failed to rename view');
    }
  };

  const handleDeleteView = async (viewId) => {
    try {
      if (views.length === 1) {
        toast.error('Cannot delete the last view');
        return;
      }

      if (!window.confirm('Are you sure you want to delete this view? All tiles will be removed.')) {
        return;
      }

      const { error } = await supabase
        .from('dashboard_views')
        .delete()
        .eq('id', viewId);

      if (error) throw error;

      const remainingViews = views.filter(v => v.id !== viewId);
      setViews(remainingViews);

      // Switch to first view if current view was deleted
      if (currentView?.id === viewId) {
        setCurrentView(remainingViews[0]);
      }
    } catch (error) {
      console.error('Error deleting view:', error);
      toast.error('Failed to delete view');
    }
  };

  const handleSwitchView = (view) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setCurrentView(view);
  };

  const handleAddTile = () => {
    setEditingTilePosition(null);
    setIsModalOpen(true);
  };

  const handleMetricSelect = (metricType) => {
    if (editingTilePosition !== null) {
      // Update existing tile in draft
      setDraftTiles(prevTiles =>
        prevTiles.map(tile =>
          tile.position === editingTilePosition
            ? { ...tile, metric_type: metricType }
            : tile
        )
      );
    } else {
      // Add new tile to draft
      const nextPosition = draftTiles.length;
      const newTile = {
        id: `temp-${Date.now()}`, // Temporary ID
        metric_type: metricType,
        position: nextPosition,
        view_id: currentView.id
      };
      setDraftTiles(prevTiles => [...prevTiles, newTile]);
    }
    setHasUnsavedChanges(true);
  };

  const handleRemoveTile = (position) => {
    const remainingTiles = draftTiles.filter(t => t.position !== position);
    // Reorder positions
    const reorderedTiles = remainingTiles.map((tile, index) => ({
      ...tile,
      position: index
    }));
    setDraftTiles(reorderedTiles);
    setHasUnsavedChanges(true);
  };

  const handleConfigureNPSTile = (tile) => {
    setConfiguringTile(tile);
    setIsNPSConfigOpen(true);
  };

  const handleConfigureFeedbackTile = (tile) => {
    setConfiguringTile(tile);
    setIsFeedbackConfigOpen(true);
  };

  const handleSaveNPSConfig = (config) => {
    setDraftTiles(prevTiles =>
      prevTiles.map(tile =>
        tile.id === configuringTile.id
          ? {
              ...tile,
              date_range_preset: config.date_range_preset,
              chart_type: config.chart_type,
              venue_ids: config.venue_ids
            }
          : tile
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveFeedbackConfig = (config) => {
    setDraftTiles(prevTiles =>
      prevTiles.map(tile =>
        tile.id === configuringTile.id
          ? {
              ...tile,
              date_range_preset: config.date_range_preset,
              chart_type: config.chart_type,
              venue_ids: config.venue_ids
            }
          : tile
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleDragStart = (e, tile) => {
    setDraggedTile(tile);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetTile) => {
    e.preventDefault();

    if (!draggedTile || draggedTile.id === targetTile.id) {
      setDraggedTile(null);
      return;
    }

    // Reorder in draft
    const newTiles = [...draftTiles];
    const draggedIndex = newTiles.findIndex(t => t.id === draggedTile.id);
    const targetIndex = newTiles.findIndex(t => t.id === targetTile.id);

    const [removed] = newTiles.splice(draggedIndex, 1);
    newTiles.splice(targetIndex, 0, removed);

    // Update positions
    const reorderedTiles = newTiles.map((tile, index) => ({
      ...tile,
      position: index
    }));

    setDraftTiles(reorderedTiles);
    setHasUnsavedChanges(true);
    setDraggedTile(null);
  };

  const handleSaveDashboard = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId || !currentView) return;

      // Delete all existing tiles for this view
      const { error: deleteError } = await supabase
        .from('custom_dashboard_tiles')
        .delete()
        .eq('view_id', currentView.id);

      if (deleteError) throw deleteError;

      // Insert all draft tiles and get the returned data with proper IDs
      let newTiles = [];
      if (draftTiles.length > 0) {
        const tilesToInsert = draftTiles.map(tile => ({
          user_id: userId,
          view_id: currentView.id,
          metric_type: tile.metric_type,
          position: tile.position,
          date_range_preset: tile.date_range_preset,
          chart_type: tile.chart_type,
          venue_ids: tile.venue_ids
        }));

        const { data, error: insertError } = await supabase
          .from('custom_dashboard_tiles')
          .insert(tilesToInsert)
          .select();

        if (insertError) throw insertError;
        newTiles = data || [];
      }

      // Update saved tiles and draft tiles with proper IDs from database
      setSavedTiles(newTiles);
      setDraftTiles(newTiles);
      setHasUnsavedChanges(false);

      toast.success('Dashboard saved');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('Failed to save dashboard');
    }
  };

  const handleDiscardChanges = () => {
    if (!window.confirm('Discard all unsaved changes?')) {
      return;
    }
    setDraftTiles(savedTiles);
    setHasUnsavedChanges(false);
  };

  if (loadingViews) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Views</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Tabs and Save Button */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Views</h1>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
            )}
            <button
              onClick={handleSaveDashboard}
              disabled={!hasUnsavedChanges}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                hasUnsavedChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {views.map(view => (
            <div
              key={view.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                currentView?.id === view.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isRenamingView === view.id ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameView(view.id, renameValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameView(view.id, renameValue);
                    if (e.key === 'Escape') setIsRenamingView(null);
                  }}
                  autoFocus
                  className="w-32 px-2 py-1 text-sm border border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <>
                  <button
                    onClick={() => handleSwitchView(view)}
                    className="font-medium"
                  >
                    {view.name}
                  </button>
                  <button
                    onClick={() => {
                      setIsRenamingView(view.id);
                      setRenameValue(view.name);
                    }}
                    className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                    title="Rename view"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {views.length > 1 && (
                    <button
                      onClick={() => handleDeleteView(view.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors text-red-600 dark:text-red-400"
                      title="Delete view"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          <button
            onClick={handleCreateView}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Plus className="w-4 h-4" />
            New View
          </button>
        </div>

        {hasUnsavedChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
            <LayoutDashboard className="w-4 h-4" />
            You have unsaved changes. Click "Save Changes" to persist your updates.
          </div>
        )}
      </div>

      {/* Empty State */}
      {draftTiles.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-12 text-center border-2 border-dashed border-blue-200 dark:border-blue-800">
          <div className="max-w-md mx-auto">
            <Settings className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Build Your {currentView?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add metric tiles to track your most important data.
            </p>
            <button
              onClick={handleAddTile}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Tile
            </button>
          </div>
        </div>
      )}

      {/* Tiles Grid */}
      {draftTiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {draftTiles.map((tile) => (
            <div
              key={tile.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tile)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tile)}
              className={`relative group transition-all ${
                draggedTile?.id === tile.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              {/* Drag Handle */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <div className="bg-gray-700 dark:bg-gray-600 text-white p-2 rounded-lg shadow-lg">
                  <GripVertical className="w-4 h-4" />
                </div>
              </div>

              {tile.metric_type === 'nps_chart' ? (
                <NPSChartTile
                  config={{
                    date_range_preset: tile.date_range_preset || 'all_time',
                    chart_type: tile.chart_type || 'donut',
                    venue_ids: tile.venue_ids || []
                  }}
                  onRemove={() => handleRemoveTile(tile.position)}
                  onConfigure={() => handleConfigureNPSTile(tile)}
                />
              ) : tile.metric_type === 'feedback_chart' ? (
                <FeedbackChartTile
                  config={{
                    date_range_preset: tile.date_range_preset || 'all_time',
                    chart_type: tile.chart_type || 'kpi',
                    venue_ids: tile.venue_ids || []
                  }}
                  onRemove={() => handleRemoveTile(tile.position)}
                  onConfigure={() => handleConfigureFeedbackTile(tile)}
                />
              ) : (
                <ConfigurableMultiVenueTile
                  metricType={tile.metric_type}
                  position={tile.position}
                  dateRange={{
                    from: new Date(),
                    to: new Date()
                  }}
                  onRemove={() => handleRemoveTile(tile.position)}
                  onChangeMetric={() => {
                    setEditingTilePosition(tile.position);
                    setIsModalOpen(true);
                  }}
                />
              )}
            </div>
          ))}

          {/* Add Tile Button */}
          <button
            onClick={handleAddTile}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] group"
          >
            <div className="p-3 bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 rounded-full transition-colors">
              <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                Add Metric Tile
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track more metrics
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Metric Selector Modal */}
      <MetricSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleMetricSelect}
        currentMetric={
          editingTilePosition !== null
            ? draftTiles.find(t => t.position === editingTilePosition)?.metric_type
            : null
        }
        existingMetrics={draftTiles.map(t => t.metric_type)}
      />

      {/* NPS Configuration Modal */}
      <NPSConfigModal
        isOpen={isNPSConfigOpen}
        onClose={() => {
          setIsNPSConfigOpen(false);
          setConfiguringTile(null);
        }}
        onSave={handleSaveNPSConfig}
        currentConfig={configuringTile || {}}
      />

      {/* Feedback Configuration Modal */}
      <FeedbackConfigModal
        isOpen={isFeedbackConfigOpen}
        onClose={() => {
          setIsFeedbackConfigOpen(false);
          setConfiguringTile(null);
        }}
        onSave={handleSaveFeedbackConfig}
        currentConfig={configuringTile || {}}
      />
    </div>
  );
};

export default CustomDashboard;
