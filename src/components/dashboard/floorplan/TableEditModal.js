// TableEditModal.js - Modal for editing table properties
import React, { useState, useEffect } from 'react';
import { Square, Circle, RectangleHorizontal, X } from 'lucide-react';

const TableEditModal = ({
  isOpen,
  onClose,
  table,
  onSave,
  existingTableNumbers = [],
  zones = [],
  currentZoneId
}) => {
  const [tableNumber, setTableNumber] = useState('');
  const [shape, setShape] = useState('square');
  const [zoneId, setZoneId] = useState(null);
  const [error, setError] = useState('');

  // Initialize form when table changes
  useEffect(() => {
    if (table) {
      setTableNumber(String(table.table_number || ''));
      setShape(table.shape || 'square');
      setZoneId(table.zone_id || currentZoneId);
      setError('');
    }
  }, [table, currentZoneId]);

  if (!isOpen || !table) return null;

  const shapeOptions = [
    { value: 'square', icon: Square, label: 'Square' },
    { value: 'circle', icon: Circle, label: 'Circle' },
    { value: 'long', icon: RectangleHorizontal, label: 'Rectangle' },
  ];

  const handleSave = () => {
    const trimmedNumber = tableNumber.trim();

    if (!trimmedNumber) {
      setError('Table number is required');
      return;
    }

    // Check for duplicate - exclude current table
    const isDuplicate = existingTableNumbers.some(
      t => String(t.table_number) === trimmedNumber &&
           t.id !== table.id &&
           t.zone_id === zoneId
    );

    if (isDuplicate) {
      setError('Table number already exists in this zone');
      return;
    }

    onSave({
      ...table,
      table_number: trimmedNumber,
      shape,
      zone_id: zoneId
    });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Table
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Table Number
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value.replace(/[^0-9]/g, ''));
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Shape */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shape
            </label>
            <div className="flex gap-2">
              {shapeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setShape(opt.value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      shape === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    title={opt.label}
                  >
                    <Icon className="w-6 h-6 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone Selection */}
          {zones.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zone
              </label>
              <select
                value={zoneId || ''}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableEditModal;
