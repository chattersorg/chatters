import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GoogleRatingsTrendTile = ({ venueId }) => {
  const [currentRatings, setCurrentRatings] = useState({ google: null, tripadvisor: null });
  const [historicalData, setHistoricalData] = useState({ google: [], tripadvisor: [] });
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({ google: null, tripadvisor: null });
  const [dateRange, setDateRange] = useState(7);

  useEffect(() => {
    if (venueId) {
      loadRatingData();
    }
  }, [venueId]);

  const loadRatingData = async () => {
    try {
      setLoading(true);

      // Get all Google ratings (ordered by date)
      const { data: googleRatings } = await supabase
        .from('historical_ratings')
        .select('rating, ratings_count, recorded_at, is_initial')
        .eq('venue_id', venueId)
        .eq('source', 'google')
        .order('recorded_at', { ascending: true });

      // Get all TripAdvisor ratings (ordered by date)
      const { data: tripadvisorRatings } = await supabase
        .from('historical_ratings')
        .select('rating, ratings_count, recorded_at, is_initial')
        .eq('venue_id', venueId)
        .eq('source', 'tripadvisor')
        .order('recorded_at', { ascending: true });

      // Get current (most recent) ratings
      const googleCurrent = googleRatings && googleRatings.length > 0
        ? googleRatings[googleRatings.length - 1]
        : null;

      const tripadvisorCurrent = tripadvisorRatings && tripadvisorRatings.length > 0
        ? tripadvisorRatings[tripadvisorRatings.length - 1]
        : null;

      setCurrentRatings({
        google: googleCurrent,
        tripadvisor: tripadvisorCurrent
      });

      setHistoricalData({
        google: googleRatings || [],
        tripadvisor: tripadvisorRatings || []
      });

      // Calculate KPI data for both platforms
      const newKpiData = {};

      // Google KPIs
      if (googleRatings && googleRatings.length > 0) {
        const initialRating = googleRatings.find(r => r.is_initial)?.rating;
        const latestRating = googleCurrent?.rating;

        if (initialRating && latestRating) {
          const change = latestRating - initialRating;
          const percentChange = ((change / initialRating) * 100);

          newKpiData.google = {
            initial: initialRating,
            current: latestRating,
            change: change,
            percentChange: percentChange
          };
        }
      }

      // TripAdvisor KPIs
      if (tripadvisorRatings && tripadvisorRatings.length > 0) {
        const initialRating = tripadvisorRatings.find(r => r.is_initial)?.rating;
        const latestRating = tripadvisorCurrent?.rating;

        if (initialRating && latestRating) {
          const change = latestRating - initialRating;
          const percentChange = ((change / initialRating) * 100);

          newKpiData.tripadvisor = {
            initial: initialRating,
            current: latestRating,
            change: change,
            percentChange: percentChange
          };
        }
      }

      setKpiData(newKpiData);
    } catch (error) {
      console.error('Error loading rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine and prepare chart data
  // Generate date range based on selected period
  const generateDateRange = (days) => {
    const dateArray = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateArray.push(dateStr);
    }
    return dateArray;
  };
  
  const selectedDays = generateDateRange(dateRange);
  
  // Create labels from the selected days
  const labels = selectedDays.map(dateStr => 
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric' 
    })
  );
  
  // Create data arrays for each platform, matching to the selected days
  const googleData = selectedDays.map(dateStr => {
    const point = historicalData.google.find(p => {
      const recordedDate = new Date(p.recorded_at).toISOString().split('T')[0];
      return recordedDate === dateStr;
    });
    return point ? parseFloat(point.rating) : null;
  });
  
  const tripadvisorData = selectedDays.map(dateStr => {
    const point = historicalData.tripadvisor.find(p => {
      const recordedDate = new Date(p.recorded_at).toISOString().split('T')[0];
      return recordedDate === dateStr;
    });
    return point ? parseFloat(point.rating) : null;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Google Rating',
        data: googleData,
        backgroundColor: '#4285F4',
        borderColor: '#4285F4',
        borderWidth: 0,
        borderRadius: 3,
        barThickness: 18,
      },
      {
        label: 'TripAdvisor Rating',
        data: tripadvisorData,
        backgroundColor: '#00AA6C',
        borderColor: '#00AA6C',
        borderWidth: 0,
        borderRadius: 3,
        barThickness: 18,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: true,
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 12,
          weight: '500'
        },
        bodyFont: {
          size: 14,
          weight: '600'
        },
        animation: {
          duration: 0
        },
        callbacks: {
          title: function(tooltipItems) {
            const item = tooltipItems[0];
            return item.dataset.label;
          },
          label: function(context) {
            if (context.parsed.y === null) return null;
            return `${context.parsed.y.toFixed(1)} ⭐`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 15
        }
      },
      y: {
        display: true,
        beginAtZero: false,
        min: 1,
        max: 5,
        grid: {
          color: '#E5E7EB',
          drawBorder: false,
        },
        border: {
          display: false
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          },
          stepSize: 0.5,
          padding: 8,
          callback: function(value) {
            return value.toFixed(1);
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    },
    barPercentage: 0.85,
    categoryPercentage: 0.8
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentRatings.google && !currentRatings.tripadvisor && 
      historicalData.google.length === 0 && historicalData.tripadvisor.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Review Platform Ratings Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Link your Google Business and TripAdvisor listings to start tracking ratings over time.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard/settings'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Set Up Review Platforms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base lg:text-lg font-medium text-gray-900">Review Platform Ratings Trend</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange(3)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                dateRange === 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              3 days
            </button>
            <button
              onClick={() => setDateRange(7)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                dateRange === 7
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setDateRange(14)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                dateRange === 14
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              14 days
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Track your Google and TripAdvisor rating progression over time
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Google Current Rating */}
        {currentRatings.google && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Google Rating</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {currentRatings.google.rating.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500">
              {currentRatings.google.ratings_count.toLocaleString()} reviews
            </p>
          </div>
        )}

        {/* TripAdvisor Current Rating */}
        {currentRatings.tripadvisor && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">TripAdvisor Rating</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {currentRatings.tripadvisor.rating.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500">
              {currentRatings.tripadvisor.ratings_count.toLocaleString()} reviews
            </p>
          </div>
        )}

        {/* Google Change */}
        {kpiData.google && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Google Change</p>
            <p className={`text-3xl font-bold mb-1 ${
              kpiData.google.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.google.change >= 0 ? '+' : ''}{kpiData.google.change.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              {kpiData.google.percentChange >= 0 ? '+' : ''}{kpiData.google.percentChange.toFixed(1)}% from initial
            </p>
          </div>
        )}

        {/* TripAdvisor Change */}
        {kpiData.tripadvisor && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">TripAdvisor Change</p>
            <p className={`text-3xl font-bold mb-1 ${
              kpiData.tripadvisor.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.tripadvisor.change >= 0 ? '+' : ''}{kpiData.tripadvisor.change.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              {kpiData.tripadvisor.percentChange >= 0 ? '+' : ''}{kpiData.tripadvisor.percentChange.toFixed(1)}% from initial
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      {(historicalData.google.length > 0 || historicalData.tripadvisor.length > 0) && (
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default GoogleRatingsTrendTile;