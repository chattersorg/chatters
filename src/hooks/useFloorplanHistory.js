// Hook for managing floorplan undo/redo history
import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

export const useFloorplanHistory = (initialTables = []) => {
  // History stack: past states
  const [history, setHistory] = useState([]);
  // Future stack: states after undo
  const [future, setFuture] = useState([]);
  // Current tables state
  const [tables, setTablesInternal] = useState(initialTables);

  // Flag to prevent recording during undo/redo
  const isUndoRedoRef = useRef(false);

  // Update tables and record history
  const setTables = useCallback((updater) => {
    setTablesInternal(prev => {
      const newTables = typeof updater === 'function' ? updater(prev) : updater;

      // Don't record history during undo/redo operations
      if (!isUndoRedoRef.current) {
        setHistory(h => {
          const newHistory = [...h, prev];
          // Limit history size
          if (newHistory.length > MAX_HISTORY) {
            return newHistory.slice(-MAX_HISTORY);
          }
          return newHistory;
        });
        // Clear future when new action is taken
        setFuture([]);
      }

      return newTables;
    });
  }, []);

  // Initialize tables without recording history
  const initializeTables = useCallback((newTables) => {
    setTablesInternal(newTables);
    setHistory([]);
    setFuture([]);
  }, []);

  // Undo action
  const undo = useCallback(() => {
    if (history.length === 0) return false;

    isUndoRedoRef.current = true;

    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    setFuture(f => [tables, ...f]);
    setHistory(newHistory);
    setTablesInternal(previousState);

    isUndoRedoRef.current = false;
    return true;
  }, [history, tables]);

  // Redo action
  const redo = useCallback(() => {
    if (future.length === 0) return false;

    isUndoRedoRef.current = true;

    const nextState = future[0];
    const newFuture = future.slice(1);

    setHistory(h => [...h, tables]);
    setFuture(newFuture);
    setTablesInternal(nextState);

    isUndoRedoRef.current = false;
    return true;
  }, [future, tables]);

  // Check if undo/redo are available
  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  return {
    tables,
    setTables,
    initializeTables,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    futureLength: future.length
  };
};

export default useFloorplanHistory;
