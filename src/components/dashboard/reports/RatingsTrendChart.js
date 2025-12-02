import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../utils/supabase';

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function toISO(d) { return d.toISOString(); }

function rangeISO(preset, fromStr, toStr) {
  const now = new Date();
  switch (preset) {
    case 'today': {
      return { start: toISO(startOfDay(now)), end: toISO(endOfDay(now)) };
    }
    case 'yesterday': {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      return { start: toISO(startOfDay(y)), end: toISO(endOfDay(y)) };
    }
    case 'thisWeek': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return { start: toISO(startOfDay(startOfWeek)), end: toISO(endOfDay(now)) };
    }
    case 'last7': {
      const s = new Date(now); s.setDate(now.getDate() - 6);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(now)) };
    }
    case 'last14': {
      const s = new Date(now); s.setDate(now.getDate() - 13);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(now)) };
    }
    case 'last30': {
      const s = new Date(now); s.setDate(now.getDate() - 29);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(now)) };
    }
    case 'all': {
      // For 'all' timeframe, start from 3 months ago
      const s = new Date(now); s.setMonth(now.getMonth() - 3);
      return { start: toISO(startOfDay(s)), end: toISO(endOfDay(now)) };
    }
    case 'custom': {
      const s = fromStr ? startOfDay(new Date(fromStr)) : startOfDay(new Date(0));
      const e = toStr ? endOfDay(new Date(toStr)) : endOfDay(now);
      return { start: toISO(s), end: toISO(e) };
    }
    default:
      return { start: toISO(startOfDay(new Date(0))), end: toISO(endOfDay(now)) };
  }
}

export default function RatingsTrendChart({ venueId, timeframe = 'last30' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yAxisDomain, setYAxisDomain] = useState([0, 5]);

  useEffect(() => {
    if (!venueId) return;

    const fetchRatingsTrend = async () => {
      setLoading(true);
      
      const { start, end } = rangeISO(timeframe);

      // Get ALL ratings data (both historical and current external ratings)
      const [historicalResult, externalResult] = await Promise.all([
        // Historical ratings
        supabase
          .from('historical_ratings')
          .select('source, rating, recorded_at')
          .eq('venue_id', venueId)
          .gte('recorded_at', start)
          .lte('recorded_at', end)
          .order('recorded_at', { ascending: true }),
        
        // Current external ratings (add them as the latest data points)
        supabase
          .from('external_ratings')
          .select('source, rating, fetched_at')
          .eq('venue_id', venueId)
      ]);

      if (historicalResult.error || externalResult.error) {
        console.error('Error fetching ratings trend:', historicalResult.error || externalResult.error);
        setLoading(false);
        return;
      }

      // Combine historical and current data
      const allRatings = [
        ...(historicalResult.data || []).map(rating => ({
          source: rating.source,
          rating: rating.rating,
          recorded_at: rating.recorded_at
        })),
        ...(externalResult.data || []).map(rating => ({
          source: rating.source,
          rating: rating.rating,
          recorded_at: rating.fetched_at
        }))
      ];

      // Filter by timeframe and remove duplicates (keep most recent for each day/source)
      const groupedData = {};
      
      allRatings.forEach(rating => {
        const ratingDate = new Date(rating.recorded_at);
        // Only include if within timeframe
        if (ratingDate >= new Date(start) && ratingDate <= new Date(end)) {
          const dateKey = ratingDate.toISOString().split('T')[0];
          const compositeKey = `${dateKey}-${rating.source}`;
          
          // Keep most recent rating for each day/source combination
          if (!groupedData[compositeKey] || new Date(rating.recorded_at) > new Date(groupedData[compositeKey].recorded_at)) {
            groupedData[compositeKey] = rating;
          }
        }
      });

      // Group by date and combine Google/TripAdvisor ratings
      const dailyData = {};
      
      Object.values(groupedData).forEach(rating => {
        const date = new Date(rating.recorded_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { date };
        }
        dailyData[date][rating.source] = parseFloat(rating.rating);
      });

      // Convert to array and sort by date
      const chartData = Object.values(dailyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-GB', { 
            month: 'short', 
            day: 'numeric' 
          })
        }));

      // Calculate dynamic Y-axis domain based on actual rating values
      const allRatingValues = [];
      chartData.forEach(item => {
        if (item.google && !isNaN(item.google)) allRatingValues.push(item.google);
        if (item.tripadvisor && !isNaN(item.tripadvisor)) allRatingValues.push(item.tripadvisor);
      });
      
      if (allRatingValues.length > 0) {
        const minRating = Math.min(...allRatingValues);
        const maxRating = Math.max(...allRatingValues);
        
        // Add some padding around the actual values (0.2 on each side)
        const padding = 0.2;
        const yMin = Math.max(1, Math.floor((minRating - padding) * 10) / 10); // Don't go below 1
        const yMax = Math.min(5, Math.ceil((maxRating + padding) * 10) / 10);  // Don't go above 5
        
        setYAxisDomain([yMin, yMax]);
      } else {
        // Fallback to default range if no data
        setYAxisDomain([3, 5]);
      }
      
      setData(chartData);
      setLoading(false);
    };

    fetchRatingsTrend();
  }, [venueId, timeframe]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Ratings Trend Over Time</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading ratings data...</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Ratings Trend Over Time</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">No ratings data available for this time period</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Ratings Trend Over Time</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Google and TripAdvisor ratings progression</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#f0f0f0" strokeDasharray="0" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748B"
              fontSize={12}
              tick={{ fill: '#64748B' }}
              allowDuplicatedCategory={false}
              tickCount={6}
            />
            <YAxis 
              domain={yAxisDomain}
              stroke="#64748B"
              fontSize={12}
              tick={{ fill: '#64748B' }}
              allowDecimals={true}
              width={32}
              tickCount={6}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
              formatter={(value, name) => [
                value?.toFixed(1) || 'N/A', 
                name === 'google' ? 'Google' : name === 'tripadvisor' ? 'TripAdvisor' : name
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
            <Area
              type="linear"
              dataKey="google"
              stroke="#2563eb"
              fill="url(#colorGoogle)"
              strokeWidth={2}
              connectNulls={true}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
              name="Google"
            />
            <Area
              type="linear"
              dataKey="tripadvisor"
              stroke="#059669"
              fill="url(#colorTripAdvisor)"
              strokeWidth={2}
              connectNulls={true}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: 'white' }}
              name="TripAdvisor"
            />
            <defs>
              <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTripAdvisor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}