import React, { useState } from 'react';
import { X, BarChart3, PieChart, LayoutGrid } from 'lucide-react';
import { useVenue } from '../../../context/VenueContext';

const FeedbackConfigModal = ({ isOpen, onClose, onSave, currentConfig }) => {
  const { venueId, allVenues } = useVenue();

  const [dateRangePreset, setDateRangePreset] = useState(currentConfig.date_range_preset || 'all_time');
  const [chartType, setChartType] = useState(currentConfig.chart_type || 'kpi');
  // Single venue selection - store as array with one item for consistency
  const [selectedVenueId, setSelectedVenueId] = useState(
    (currentConfig.venue_ids && currentConfig.venue_ids.length > 0)
      ? currentConfig.venue_ids[0]
      : venueId
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      date_range_preset: dateRangePreset,
      chart_type: chartType,
      venue_ids: [selectedVenueId]  // Single item array
    });
    onClose();
  };

  const selectCurrentVenue = () => {
    if (venueId) {
      setSelectedVenueId(venueId);
    }
  };

  const dateRangeOptions = [
    { value: '7_days', label: 'Last 7 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'all_time', label: 'All Time' }
  ];

  const chartTypeOptions = [
    { value: 'kpi', label: 'KPI Grid', icon: LayoutGrid, description: 'Key metrics at a glance' },
    { value: 'donut', label: 'Donut Chart', icon: PieChart, description: 'Rating distribution' },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Rating breakdown' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full p-6 border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configure Feedback Chart</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Date Range Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Date Range</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dateRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateRangePreset(option.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    dateRangePreset === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Type Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Chart Type</h3>
            <div className="space-y-2">
              {chartTypeOptions.map(option => {
                const Icon = option.icon;
                const isSelected = chartType === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setChartType(option.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                        }`}>
                          {option.label}
                        </div>
                        <div className={`text-sm ${
                          isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Venue Selection Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Venue</h3>
              <button
                onClick={selectCurrentVenue}
                className="text-xs px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              >
                Current Venue
              </button>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {allVenues.map(venue => (
                <label
                  key={venue.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <input
                    type="radio"
                    name="venue"
                    value={venue.id}
                    checked={selectedVenueId === venue.id}
                    onChange={() => setSelectedVenueId(venue.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-800"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{venue.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Select a single venue for this tile
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedVenueId}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedVenueId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackConfigModal;
