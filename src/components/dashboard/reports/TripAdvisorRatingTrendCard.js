import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { DateRangeSelector } from '../../ui/date-range-selector';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// TripAdvisor logo SVG component
const TripAdvisorLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="#00AA6C"/>
    <circle cx="17" cy="24" r="6" fill="white"/>
    <circle cx="31" cy="24" r="6" fill="white"/>
    <circle cx="17" cy="24" r="3" fill="black"/>
    <circle cx="31" cy="24" r="3" fill="black"/>
    <path d="M11 18C11 18 8 15 4 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M37 18C37 18 40 15 44 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const TripAdvisorRatingTrendCard = ({ venueId }) => {
  const [currentRating, setCurrentRating] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState(null);
  const [dateRangePreset, setDateRangePreset] = useState('last7');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return { from: sevenDaysAgo, to: endOfDay };
  });

  useEffect(() => {
    if (venueId && dateRange) {
      loadRatingData();
    }
  }, [venueId, dateRange]);

  const handleDateRangeChange = ({ preset, range }) => {
    setDateRangePreset(preset);
    const endOfDay = new Date(range.to);
    endOfDay.setHours(23, 59, 59, 999);
    setDateRange({ from: range.from, to: endOfDay });
  };

  const loadRatingData = async () => {
    try {
      setLoading(true);

      const { data: tripadvisorRatings } = await supabase
        .from('venue_tripadvisor_ratings')
        .select('rating, ratings_count, recorded_at')
        .eq('venue_id', venueId)
        .gte('recorded_at', dateRange.from.toISOString())
        .lte('recorded_at', dateRange.to.toISOString())
        .order('recorded_at', { ascending: true });

      if (tripadvisorRatings && tripadvisorRatings.length > 0) {
        const current = tripadvisorRatings[tripadvisorRatings.length - 1];
        setCurrentRating(current);
        setHistoricalData(tripadvisorRatings);

        // Calculate trend
        if (tripadvisorRatings.length > 1) {
          const previous = tripadvisorRatings[tripadvisorRatings.length - 2];
          const change = current.rating - previous.rating;
          const percentChange = ((change / previous.rating) * 100);

          setTrend({
            change: change,
            percentChange: percentChange,
            direction: change >= 0 ? 'up' : 'down'
          });
        }
      }
    } catch (error) {
      console.error('Error loading TripAdvisor rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: historicalData.map(d =>
      new Date(d.recorded_at).toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric'
      })
    ),
    datasets: [
      {
        label: 'TripAdvisor Rating',
        data: historicalData.map(d => parseFloat(d.rating)),
        borderColor: '#00AA6C',
        backgroundColor: 'rgba(0, 170, 108, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#00AA6C',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const rating = context.parsed.y.toFixed(1);
            const dataPoint = historicalData[context.dataIndex];
            const reviews = dataPoint?.ratings_count?.toLocaleString() || '0';
            return [
              `Rating: ${rating}/5`,
              `Reviews: ${reviews}`
            ];
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
            size: 10
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
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
            size: 10
          },
          stepSize: 0.5,
          padding: 8,
          callback: function(value) {
            return value.toFixed(1);
          }
        }
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!currentRating) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">TripAdvisor Rating</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No TripAdvisor rating data available</p>
        </div>
      </div>
    );
  }

  // Format last updated date
  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
      {/* Header with logo and date range */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TripAdvisorLogo />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">TripAdvisor Rating</h3>
        </div>
        <DateRangeSelector
          value={dateRangePreset}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Last Updated */}
      {currentRating && (
        <div className="flex justify-end mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {formatLastUpdated(currentRating.recorded_at)}
          </p>
        </div>
      )}

      {/* Current Rating */}
      <div className="mb-6">
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {currentRating.rating.toFixed(1)}
          </div>
          <div className="text-2xl text-gray-400 dark:text-gray-500 mb-1">/5</div>
          {trend && (
            <div className={`flex items-center gap-1 mb-1 ${
              trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(trend.change).toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {currentRating.ratings_count?.toLocaleString() || 0} reviews
        </p>
      </div>

      {/* Chart */}
      {historicalData.length > 0 && (
        <div className="h-48">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default TripAdvisorRatingTrendCard;
