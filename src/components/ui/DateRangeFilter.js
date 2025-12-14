import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../dashboard/inputs/DatePicker.css';

const presetOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last14', label: 'Last 14 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const DateRangeFilter = ({
  value, // { preset: string, from?: string, to?: string }
  onChange, // (value: { preset: string, from?: string, to?: string }) => void
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempFrom, setTempFrom] = useState(null);
  const [tempTo, setTempTo] = useState(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize temp dates when custom picker opens
  useEffect(() => {
    if (showCustomPicker) {
      if (value.preset === 'custom' && value.from) {
        setTempFrom(new Date(value.from));
      } else {
        // Default to last 7 days
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 6);
        setTempFrom(from);
        setTempTo(to);
      }
      if (value.preset === 'custom' && value.to) {
        setTempTo(new Date(value.to));
      } else {
        setTempTo(new Date());
      }
    }
  }, [showCustomPicker, value]);

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get display label
  const getDisplayLabel = () => {
    if (value.preset === 'custom' && value.from && value.to) {
      return `${formatDisplayDate(value.from)} - ${formatDisplayDate(value.to)}`;
    }
    const option = presetOptions.find(opt => opt.value === value.preset);
    return option?.label || 'Select...';
  };

  const handlePresetSelect = (preset) => {
    if (preset === 'custom') {
      setShowCustomPicker(true);
    } else {
      onChange({ preset });
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempFrom && tempTo) {
      onChange({
        preset: 'custom',
        from: formatDate(tempFrom),
        to: formatDate(tempTo)
      });
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleCancelCustom = () => {
    setShowCustomPicker(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[180px] px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 font-medium cursor-pointer flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="whitespace-nowrap">{getDisplayLabel()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {!showCustomPicker ? (
            // Preset options
            <div className="min-w-[180px]">
              {presetOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePresetSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-sm text-left whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    value.preset === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            // Custom date picker
            <div className="p-4 min-w-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Custom Date Range</h3>
                <button
                  type="button"
                  onClick={handleCancelCustom}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    From
                  </label>
                  <div className="relative custom-datepicker-wrapper">
                    <ReactDatePicker
                      selected={tempFrom}
                      onChange={(date) => setTempFrom(date)}
                      selectsStart
                      startDate={tempFrom}
                      endDate={tempTo}
                      maxDate={tempTo || new Date()}
                      dateFormat="MMM d, yyyy"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 font-medium cursor-pointer"
                      calendarClassName="custom-calendar"
                      wrapperClassName="w-full"
                      showPopperArrow={false}
                      popperPlacement="bottom-start"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    To
                  </label>
                  <div className="relative custom-datepicker-wrapper">
                    <ReactDatePicker
                      selected={tempTo}
                      onChange={(date) => setTempTo(date)}
                      selectsEnd
                      startDate={tempFrom}
                      endDate={tempTo}
                      minDate={tempFrom}
                      maxDate={new Date()}
                      dateFormat="MMM d, yyyy"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 font-medium cursor-pointer"
                      calendarClassName="custom-calendar"
                      wrapperClassName="w-full"
                      showPopperArrow={false}
                      popperPlacement="bottom-start"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  disabled={!tempFrom || !tempTo}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
