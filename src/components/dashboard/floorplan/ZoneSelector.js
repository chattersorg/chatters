import React, { useState } from 'react';

const ZoneSelector = ({ 
  zones, 
  selectedZoneId, 
  editMode, 
  onZoneSelect, 
  onZoneRename, 
  onZoneDelete, 
  onCreateZone 
}) => {
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleRenameStart = (zone) => {
    setEditingZoneId(zone.id);
    setEditingName(zone.name);
  };

  const handleRenameSubmit = (zoneId) => {
    if (editingName.trim()) {
      onZoneRename(zoneId, editingName.trim());
    }
    setEditingZoneId(null);
    setEditingName('');
  };

  const handleRenameCancel = () => {
    setEditingZoneId(null);
    setEditingName('');
  };

  const handleKeyPress = (e, zoneId) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(zoneId);
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {zones.map(zone => (
        <div key={zone.id} className="flex items-center group">
          {editMode && editingZoneId === zone.id ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameSubmit(zone.id)}
              onKeyDown={(e) => handleKeyPress(e, zone.id)}
              autoFocus
              className="px-2 py-1 border border-blue-300 dark:border-blue-500 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              style={{ width: `${Math.max(editingName.length, 6)}ch` }}
            />
          ) : (
            <button
              onClick={() => onZoneSelect(zone.id)}
              onDoubleClick={() => editMode && handleRenameStart(zone)}
              className={`px-2.5 py-1 rounded text-sm font-medium transition-all duration-200 ${
                selectedZoneId === zone.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={editMode ? 'Double-click to rename' : `Switch to ${zone.name}`}
            >
              {zone.name}
            </button>
          )}

          {editMode && editingZoneId !== zone.id && (
            <button
              onClick={() => onZoneDelete(zone.id)}
              className="ml-0.5 w-5 h-5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
              title="Delete zone"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}

      {editMode && (
        <button
          onClick={onCreateZone}
          className="ml-0.5 w-6 h-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors duration-200 flex items-center justify-center"
          title="Add zone"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}

      {zones.length === 0 && !editMode && (
        <span className="text-sm text-gray-500 dark:text-gray-400">No zones</span>
      )}
    </div>
  );
};

export default ZoneSelector;