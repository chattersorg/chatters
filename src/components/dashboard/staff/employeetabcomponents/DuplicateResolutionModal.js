// DuplicateResolutionModal.js - Modal for resolving duplicate employees during bulk add

import React, { useState } from 'react';
import { X, AlertTriangle, Check, ArrowRight } from 'lucide-react';

const DuplicateResolutionModal = ({
  isOpen,
  duplicates = [],
  newEmployeesCount = 0,
  onConfirm,
  onCancel,
  loading = false
}) => {
  // Track which duplicates should be overwritten
  const [selectedForOverwrite, setSelectedForOverwrite] = useState(new Set());

  if (!isOpen) return null;

  const toggleOverwrite = (email) => {
    const newSelected = new Set(selectedForOverwrite);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedForOverwrite(newSelected);
  };

  const selectAll = () => {
    if (selectedForOverwrite.size === duplicates.length) {
      setSelectedForOverwrite(new Set());
    } else {
      setSelectedForOverwrite(new Set(duplicates.map(d => d.email)));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedForOverwrite));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Duplicate Employees Found
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Summary */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">New employees to add:</span>
                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">{newEmployeesCount}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Duplicates found:</span>
                <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">{duplicates.length}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The following employees already exist (matched by ID or email). Select which ones you want to overwrite with the new data from your CSV:
          </p>

          {/* Duplicates List */}
          {duplicates.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Select All Header */}
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedForOverwrite.size === duplicates.length}
                    onChange={selectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select all for overwrite
                  </span>
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedForOverwrite.size} selected
                </span>
              </div>

              {/* Duplicate Items */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {duplicates.map((duplicate) => (
                  <div
                    key={duplicate.email}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedForOverwrite.has(duplicate.email) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedForOverwrite.has(duplicate.email)}
                        onChange={() => toggleOverwrite(duplicate.email)}
                        className="w-4 h-4 mt-1 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {duplicate.email}
                          </span>
                        </div>

                        {/* Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {/* Existing Data */}
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
                              Current
                            </div>
                            <div className="space-y-1">
                              <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.first_name} {duplicate.existing.last_name}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.email || '-'}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Role:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.role || '-'}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Location:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.location || '-'}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.phone || '-'}</span></div>
                            </div>
                          </div>

                          {/* New Data */}
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              From CSV
                            </div>
                            <div className="space-y-1">
                              <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className={`${duplicate.new.first_name !== duplicate.existing.first_name || duplicate.new.last_name !== duplicate.existing.last_name ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}`}>{duplicate.new.first_name} {duplicate.new.last_name}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className={`${duplicate.new.email?.toLowerCase() !== duplicate.existing.email?.toLowerCase() ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}`}>{duplicate.new.email || '-'}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Role:</span> <span className={`${duplicate.new.role !== duplicate.existing.role ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}`}>{duplicate.new.role || '-'}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Location:</span> <span className={`${duplicate.new.location !== duplicate.existing.location ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}`}>{duplicate.new.location || '-'}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className={`${duplicate.new.phone !== duplicate.existing.phone ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}`}>{duplicate.new.phone || '-'}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {newEmployeesCount > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {newEmployeesCount} new employee{newEmployeesCount !== 1 ? 's' : ''} will be added.
              </span>
            )}
            {selectedForOverwrite.size > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                {selectedForOverwrite.size} existing employee{selectedForOverwrite.size !== 1 ? 's' : ''} will be updated.
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (newEmployeesCount === 0 && selectedForOverwrite.size === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Import
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateResolutionModal;
