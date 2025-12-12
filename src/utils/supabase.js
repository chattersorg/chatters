// utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

// Create Supabase client for authenticated users (dashboard, admin, etc.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Create a separate Supabase client for public/anonymous pages (feedback forms, NPS, etc.)
// This client doesn't persist sessions or auto-refresh tokens, preventing interference
// with the authenticated user's session when they have both dashboard and feedback open
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Performance logging wrapper - use this to wrap any query you want to measure
// Only logs in development mode
export const logQuery = async (queryName, queryPromise) => {
  if (!IS_DEV) {
    // In production, just return the result without logging
    return await queryPromise;
  }

  const startTime = performance.now();

  try {
    const result = await queryPromise;
    const duration = performance.now() - startTime;
    const rowCount = Array.isArray(result.data) ? result.data.length : null;

    // Color based on duration
    const color = duration < 100 ? '#22c55e' : duration < 500 ? '#eab308' : duration < 1000 ? '#f97316' : '#ef4444';
    const status = result.error ? '❌' : '✓';
    const rows = rowCount !== null ? ` (${rowCount} rows)` : '';

    console.log(
      `%c${status} [QUERY] ${queryName}: ${duration.toFixed(2)}ms${rows}`,
      `color: ${color}; font-weight: bold`,
      result.error || ''
    );

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.log(
      `%c❌ [QUERY] ${queryName}: ${duration.toFixed(2)}ms`,
      `color: #ef4444; font-weight: bold`,
      error
    );
    throw error;
  }
};