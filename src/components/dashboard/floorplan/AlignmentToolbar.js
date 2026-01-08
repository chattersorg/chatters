// AlignmentToolbar.js - Toolbar for aligning selected tables
import React from 'react';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround
} from 'lucide-react';

const AlignmentToolbar = ({ selectedCount, onAlign, onDistribute }) => {
  if (selectedCount < 2) return null;

  const alignButtons = [
    { action: 'left', icon: AlignHorizontalJustifyStart, title: 'Align Left' },
    { action: 'centerH', icon: AlignHorizontalJustifyCenter, title: 'Align Center Horizontally' },
    { action: 'right', icon: AlignHorizontalJustifyEnd, title: 'Align Right' },
    { action: 'top', icon: AlignVerticalJustifyStart, title: 'Align Top' },
    { action: 'centerV', icon: AlignVerticalJustifyCenter, title: 'Align Center Vertically' },
    { action: 'bottom', icon: AlignVerticalJustifyEnd, title: 'Align Bottom' },
  ];

  const distributeButtons = [
    { action: 'horizontal', icon: AlignHorizontalSpaceAround, title: 'Distribute Horizontally', minCount: 3 },
    { action: 'vertical', icon: AlignVerticalSpaceAround, title: 'Distribute Vertically', minCount: 3 },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Align buttons */}
      {alignButtons.map(({ action, icon: Icon, title }) => (
        <button
          key={action}
          onClick={() => onAlign(action)}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={title}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      {/* Distribute buttons (only show if 3+ selected) */}
      {selectedCount >= 3 && (
        <>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
          {distributeButtons.map(({ action, icon: Icon, title, minCount }) => (
            selectedCount >= minCount && (
              <button
                key={action}
                onClick={() => onDistribute(action)}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={title}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          ))}
        </>
      )}
    </div>
  );
};

export default AlignmentToolbar;
