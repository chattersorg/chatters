import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const NpsTrendChart = ({ dailyNpsData }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate average NPS score for visible data points
  const averageNps =
    dailyNpsData.reduce((sum, entry) => sum + (entry['NPS Score'] || 0), 0) / dailyNpsData.length;

  // Custom Tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <p className="font-bold text-sm mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-blue-600 text-sm">
              NPS Score: <span className="font-semibold">{payload.find(entry => entry.dataKey === 'NPS Score')?.value ?? 'N/A'}</span>
            </p>
            <p className="text-green-600 text-sm">
              Promoters: <span className="font-semibold">{payload.find(entry => entry.dataKey === 'Promoters')?.value ?? 'N/A'}</span>
            </p>
            <p className="text-yellow-600 text-sm">
              Passives: <span className="font-semibold">{payload.find(entry => entry.dataKey === 'Passives')?.value ?? 'N/A'}</span>
            </p>
            <p className="text-red-600 text-sm">
              Detractors: <span className="font-semibold">{payload.find(entry => entry.dataKey === 'Detractors')?.value ?? 'N/A'}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Toggle Link */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 underline focus:outline-none"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* NPS Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">NPS History</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={dailyNpsData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="day"
              stroke="#666"
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
            />
            <YAxis
              domain={[-100, 100]} // Fixed Y-axis range
              stroke="#666"
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="linear"
              dataKey="NPS Score"
              stroke="#3B82F6"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              type="linear"
              dataKey="Promoters"
              stroke="#10B981"
              strokeWidth={2}
              strokeOpacity={showDetails ? 1 : 0} // Visually hide/show line
            />
            <Line
              type="linear"
              dataKey="Passives"
              stroke="#FBBF24"
              strokeWidth={2}
              strokeOpacity={showDetails ? 1 : 0} // Visually hide/show line
            />
            <Line
              type="linear"
              dataKey="Detractors"
              stroke="#EF4444"
              strokeWidth={2}
              strokeOpacity={showDetails ? 1 : 0} // Visually hide/show line
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NpsTrendChart;