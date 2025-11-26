// /src/components/google-reviews/ReviewFilters.jsx
import React from 'react';

const ReviewFilters = ({ value, onChange }) => {
  const filters = [
    { value: 'all', label: 'All Reviews', icon: '📊' },
    { value: 'unresponded', label: 'Needs Reply', icon: '💬' },
    { value: 'responded', label: 'Replied', icon: '✅' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              value === filter.value
                ? 'bg-custom-black text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReviewFilters;
