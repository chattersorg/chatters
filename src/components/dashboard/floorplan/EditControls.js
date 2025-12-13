import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Square, Circle, RectangleHorizontal, Trash2 } from 'lucide-react';
import { PermissionGate } from '../../../context/PermissionsContext';

const shapeOptions = [
  { value: 'square', label: 'Square', icon: Square },
  { value: 'circle', label: 'Circle', icon: Circle },
  { value: 'long', label: 'Rectangle', icon: RectangleHorizontal },
];

const EditControls = ({
  editMode,
  hasUnsavedChanges,
  saving,
  onToggleEdit,
  onAddTable,
  onSaveLayout,
  onClearAllTables,
  tables,
  onShowAlert,
  hideEditButton = false,
  hideSaveButton = false
}) => {
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableShape, setNewTableShape] = useState('square');
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsShapeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTableNumberChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNewTableNumber(value);
  };

  const handleAddTable = (shape = newTableShape) => {
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

    onAddTable(number, shape);
    setNewTableNumber('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTable();
    }
  };

  const handleClearAll = () => {
    onClearAllTables();
  };

  const handleShapeSelect = (value) => {
    setNewTableShape(value);
    setIsShapeDropdownOpen(false);
  };

  const selectedShape = shapeOptions.find(opt => opt.value === newTableShape);
  const SelectedIcon = selectedShape?.icon || Square;

  return (
    <>
      {/* Edit Mode Controls */}
      {editMode && (
        <div className="space-y-4">
          {/* Table Shape Buttons - Visual drag targets */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Table:</span>
            <div className="flex items-center gap-3">
              {shapeOptions.map((shape) => {
                const Icon = shape.icon;
                return (
                  <button
                    key={shape.value}
                    onClick={() => setNewTableShape(shape.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      newTableShape === shape.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    title={shape.label}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        newTableShape === shape.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    <span className={`text-xs font-medium ${
                      newTableShape === shape.value
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {shape.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Table Form */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Table number"
                value={newTableNumber}
                onChange={handleTableNumberChange}
                onKeyPress={handleKeyPress}
                className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />

              {/* Custom Shape Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsShapeDropdownOpen(!isShapeDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium hover:border-gray-300 dark:hover:border-gray-500 transition-colors min-w-[130px]"
                >
                  <SelectedIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>{selectedShape?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isShapeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isShapeDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                    {shapeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleShapeSelect(option.value)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            newTableShape === option.value
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <PermissionGate permission="floorplan.edit">
                <button
                  onClick={() => handleAddTable()}
                  disabled={!newTableNumber.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  Add Table
                </button>
              </PermissionGate>
            </div>

            {!hideSaveButton && (
              <>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

                {/* Save Button */}
                <PermissionGate permission="floorplan.edit">
                  <button
                    onClick={onSaveLayout}
                    disabled={saving || !hasUnsavedChanges}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </PermissionGate>

                {hasUnsavedChanges && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Unsaved changes
                  </span>
                )}
              </>
            )}

            {/* Right side buttons */}
            <div className="flex-1" />

            {tables.length > 0 && (
              <PermissionGate permission="floorplan.edit">
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-3 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </PermissionGate>
            )}

            {!hideEditButton && (
              <button
                onClick={onToggleEdit}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Exit Edit
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EditControls;
