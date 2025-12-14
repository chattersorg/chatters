import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';

const DatePicker = ({
  value,
  onChange,
  min,
  max,
  label,
  className = ''
}) => {
  // Convert string date to Date object
  const dateValue = value ? new Date(value) : null;
  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;

  const handleChange = (date) => {
    if (date) {
      // Convert Date object back to YYYY-MM-DD string format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Call onChange with synthetic event to match input onChange signature
      onChange({ target: { value: dateString } });
    }
  };

  return (
    <div className={`custom-datepicker-wrapper ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <ReactDatePicker
          selected={dateValue}
          onChange={handleChange}
          minDate={minDate}
          maxDate={maxDate}
          dateFormat="MMM d, yyyy"
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 font-medium cursor-pointer"
          calendarClassName="custom-calendar"
          wrapperClassName="w-full"
          showPopperArrow={false}
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
};

export default DatePicker;
