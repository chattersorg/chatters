import React, { useState } from 'react';
import { PermissionGate } from '../../../context/PermissionsContext';

const EditControls = ({ 
  editMode, 
  hasUnsavedChanges,
  saving,
  onToggleEdit, 
  onAddTable, 
  onSaveLayout, 
  onClearAllTables,
  tables,
  onShowAlert
}) => {
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableShape, setNewTableShape] = useState('square');

  const handleTableNumberChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNewTableNumber(value);
  };

  const handleAddTable = () => {
    const number = newTableNumber.trim();
    if (!number) {
      onShowAlert?.({
        type: 'warning',
        title: 'Missing Table Number',
        message: 'Please enter a table number'
      });
      return;
    }
    
    if (tables.find(t => String(t.table_number) === number)) {
      onShowAlert?.({
        type: 'warning',
        title: 'Duplicate Table Number',
        message: 'Table number already exists. Please choose a different number.'
      });
      return;
    }

    onAddTable(number, newTableShape);
    setNewTableNumber('');
    setNewTableShape('square');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTable();
    }
  };

  const handleClearAll = () => {
    onClearAllTables();
  };

  return (
    <>
      {/* Edit Mode Controls */}
      {editMode && (
        <div className="mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Add Table Controls */}
              <input
                type="text"
                placeholder="Table #"
                value={newTableNumber}
                onChange={handleTableNumberChange}
                onKeyPress={handleKeyPress}
                className="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />

              <select
                value={newTableShape}
                onChange={(e) => setNewTableShape(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="long">Rectangle</option>
              </select>

              <PermissionGate permission="floorplan.edit">
                <button
                  onClick={handleAddTable}
                  disabled={!newTableNumber.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  + Add
                </button>
              </PermissionGate>

              <div className="h-6 w-px bg-blue-200 dark:bg-blue-700" />

              {/* Save Button */}
              <PermissionGate permission="floorplan.edit">
                <button
                  onClick={onSaveLayout}
                  disabled={saving || !hasUnsavedChanges}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </PermissionGate>

              {hasUnsavedChanges && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Unsaved changes
                </span>
              )}

              {/* Right side buttons */}
              <div className="flex-1" />

              {tables.length > 0 && (
                <PermissionGate permission="floorplan.edit">
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Clear All
                  </button>
                </PermissionGate>
              )}

              <button
                onClick={onToggleEdit}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Exit Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditControls;