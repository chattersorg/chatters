// Hook for managing table selection in floorplan editor
import { useState, useCallback } from 'react';

export const useFloorplanSelection = () => {
  // Set of selected table IDs
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Select a single table (clears other selections unless shift is held)
  const selectTable = useCallback((tableId, addToSelection = false) => {
    setSelectedIds(prev => {
      if (addToSelection) {
        // Toggle selection
        const newSet = new Set(prev);
        if (newSet.has(tableId)) {
          newSet.delete(tableId);
        } else {
          newSet.add(tableId);
        }
        return newSet;
      } else {
        // Single selection
        return new Set([tableId]);
      }
    });
  }, []);

  // Select multiple tables (e.g., from drag selection)
  const selectMultiple = useCallback((tableIds, addToSelection = false) => {
    setSelectedIds(prev => {
      if (addToSelection) {
        const newSet = new Set(prev);
        tableIds.forEach(id => newSet.add(id));
        return newSet;
      } else {
        return new Set(tableIds);
      }
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if a table is selected
  const isSelected = useCallback((tableId) => {
    return selectedIds.has(tableId);
  }, [selectedIds]);

  // Get array of selected IDs
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  // Select all tables in a zone
  const selectAll = useCallback((tableIds) => {
    setSelectedIds(new Set(tableIds));
  }, []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    selectTable,
    selectMultiple,
    clearSelection,
    isSelected,
    getSelectedIds,
    selectAll
  };
};

export default useFloorplanSelection;
