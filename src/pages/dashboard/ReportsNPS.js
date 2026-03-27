import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { ArrowUp, ArrowDown, ChevronRight, Building2, Download, X, Loader2 } from 'lucide-react';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePermissions } from '../../context/PermissionsContext';
import { Button } from '../../components/ui/button';
import DatePicker from '../../components/dashboard/inputs/DatePicker';
import ModernCard from '../../components/dashboard/layout/ModernCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const ReportsNPS = () => {
  usePageTitle('NPS Reports');
  const navigate = useNavigate();
  const { venueId, selectedVenueIds, isAllVenuesMode, allVenues } = useVenue();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [npsData, setNpsData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [dateRange, setDateRange] = useState('30'); // days
  const [venueNPSData, setVenueNPSData] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [comparison, setComparison] = useState(null);

  // Always show single venue view - /nps/score shows current venue only
  // Multi-venue view is available via /multi-venue routes
  const isMultiVenue = false;

  useEffect(() => {
    if (!venueId) return;
    loadNPSData();
  }, [venueId, dateRange]);

  const loadNPSData = async () => {
    try {
      setLoading(true);

      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Calculate previous period for comparison
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);

      // Get all NPS submissions for the venue (current period)
      const { data, error } = await supabase
        .from('nps_submissions')
        .select('*')
        .eq('venue_id', venueId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get previous period data for comparison
      const { data: prevData, error: prevError } = await supabase
        .from('nps_submissions')
        .select('score, responded_at')
        .eq('venue_id', venueId)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', prevEndDate.toISOString());

      if (!prevError && prevData) {
        const prevResponses = prevData.filter(s => s.score !== null);
        const prevPromoters = prevResponses.filter(s => s.score >= 9).length;
        const prevDetractors = prevResponses.filter(s => s.score <= 6).length;
        const prevNPS = prevResponses.length > 0
          ? Math.round(((prevPromoters - prevDetractors) / prevResponses.length) * 100)
          : null;

        setComparison({
          prevNPS,
          prevResponses: prevResponses.length,
          periodLabel: days === 7 ? 'vs last week' : days === 30 ? 'vs last month' : days === 90 ? 'vs prev quarter' : 'vs prev year'
        });
      }

      // Fetch linked feedback to get table numbers
      const sessionIds = (data || []).filter(s => s.session_id).map(s => s.session_id);
      let feedbackBySession = {};

      if (sessionIds.length > 0) {
        const { data: feedbackData } = await supabase
          .from('feedback')
          .select('id, session_id, rating, table_number, created_at')
          .in('session_id', sessionIds);

        // Create a lookup map by session_id
        (feedbackData || []).forEach(f => {
          feedbackBySession[f.session_id] = f;
        });
      }

      // Enrich NPS submissions with linked feedback data
      const enrichedData = (data || []).map(s => ({
        ...s,
        linkedFeedback: s.session_id ? feedbackBySession[s.session_id] : null
      }));

      setSubmissions(enrichedData);
      calculateNPSMetrics(enrichedData);
    } catch (error) {
      console.error('Error loading NPS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMultiVenueNPSData = async () => {
    try {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const venueData = {};

      // Load NPS data for each venue
      for (const vId of selectedVenueIds) {
        const { data, error } = await supabase
          .from('nps_submissions')
          .select('*')
          .eq('venue_id', vId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          console.error(`Error loading NPS data for venue ${vId}:`, error);
          continue;
        }

        const responses = data.filter((s) => s.score !== null);
        const promoters = responses.filter((s) => s.score >= 9).length;
        const detractors = responses.filter((s) => s.score <= 6).length;
        const npsScore =
          responses.length > 0
            ? Math.round(((promoters - detractors) / responses.length) * 100)
            : null;

        const venue = allVenues.find((v) => v.id === vId);
        venueData[vId] = {
          name: venue?.name || 'Unknown Venue',
          npsScore,
          responses: responses.length,
          sent: data.filter((s) => s.sent_at).length,
          promoters,
          passives: responses.filter((s) => s.score >= 7 && s.score <= 8).length,
          detractors,
        };
      }

      setVenueNPSData(venueData);
    } catch (error) {
      console.error('Error loading multi-venue NPS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNPSMetrics = (data) => {
    const totalSubmissions = data.length;
    const sent = data.filter((s) => s.sent_at).length;
    const responded = data.filter((s) => s.responded_at).length;
    const pending = data.filter((s) => !s.sent_at).length;
    const failed = data.filter((s) => s.send_error).length;

    // Calculate NPS from responses
    const responses = data.filter((s) => s.score !== null);
    const promoters = responses.filter((s) => s.score >= 9).length;
    const passives = responses.filter((s) => s.score >= 7 && s.score <= 8).length;
    const detractors = responses.filter((s) => s.score <= 6).length;

    const npsScore =
      responses.length > 0
        ? Math.round(((promoters - detractors) / responses.length) * 100)
        : null;

    const responseRate =
      sent > 0 ? Math.round((responded / sent) * 100) : 0;

    // Group by day for trend chart
    const trendData = {};
    responses.forEach((response) => {
      const day = new Date(response.responded_at).toLocaleDateString();
      if (!trendData[day]) {
        trendData[day] = { promoters: 0, passives: 0, detractors: 0, total: 0 };
      }
      if (response.score >= 9) trendData[day].promoters++;
      else if (response.score >= 7) trendData[day].passives++;
      else trendData[day].detractors++;
      trendData[day].total++;
    });

    const trendChartData = Object.entries(trendData).map(([date, counts]) => ({
      date,
      nps: Math.round(
        ((counts.promoters - counts.detractors) / counts.total) * 100
      ),
    }));

    // Distribution data for bar chart
    const distributionData = Array.from({ length: 11 }, (_, i) => ({
      score: i,
      count: responses.filter((s) => s.score === i).length,
    }));

    setNpsData({
      totalSubmissions,
      sent,
      responded,
      pending,
      failed,
      npsScore,
      promoters,
      passives,
      detractors,
      responseRate,
      trendChartData,
      distributionData,
    });
  };

  const getCategoryColor = (score) => {
    if (score >= 9) return '#22c55e'; // green
    if (score >= 7) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getNPSColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-900 dark:text-white';
    if (score >= 50) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const handleOpenExportModal = () => {
    // Set default dates based on current filter
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    setExportStartDate(startDate.toISOString().split('T')[0]);
    setExportEndDate(endDate.toISOString().split('T')[0]);
    setShowExportModal(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const startDate = new Date(exportStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(exportEndDate);
      endDate.setHours(23, 59, 59, 999);

      // Fetch NPS data for the selected date range
      const { data, error } = await supabase
        .from('nps_submissions')
        .select('score, sent_at, responded_at, send_error')
        .eq('venue_id', venueId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Calculate metrics (no PII)
      const sent = data.filter((s) => s.sent_at).length;
      const responded = data.filter((s) => s.responded_at).length;
      const pending = data.filter((s) => !s.sent_at).length;
      const failed = data.filter((s) => s.send_error).length;

      const responses = data.filter((s) => s.score !== null);
      const promoters = responses.filter((s) => s.score >= 9).length;
      const passives = responses.filter((s) => s.score >= 7 && s.score <= 8).length;
      const detractors = responses.filter((s) => s.score <= 6).length;

      const npsScore = responses.length > 0
        ? Math.round(((promoters - detractors) / responses.length) * 100)
        : null;

      const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

      // Create CSV content
      const csvContent = [
        ['NPS Report Export'],
        [`Date Range: ${exportStartDate} to ${exportEndDate}`],
        [''],
        ['Metric', 'Value'],
        ['NPS Score', npsScore !== null ? npsScore : 'N/A'],
        ['Total Responses', responded],
        ['Response Rate', `${responseRate}%`],
        ['Emails Sent', sent],
        ['Pending', pending],
        ['Failed Emails', failed],
        [''],
        ['Breakdown', 'Count', 'Percentage'],
        ['Promoters (9-10)', promoters, responses.length > 0 ? `${Math.round((promoters / responses.length) * 100)}%` : '0%'],
        ['Passives (7-8)', passives, responses.length > 0 ? `${Math.round((passives / responses.length) * 100)}%` : '0%'],
        ['Detractors (0-6)', detractors, responses.length > 0 ? `${Math.round((detractors / responses.length) * 100)}%` : '0%'],
      ].map(row => row.join(',')).join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nps-report-${exportStartDate}-to-${exportEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting NPS data:', error);
    } finally {
      setExporting(false);
    }
  };

  if (!venueId) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Multi-venue list view
  if (isMultiVenue) {
    const sortedVenues = Object.entries(venueNPSData).sort((a, b) => {
      const scoreA = a[1].npsScore !== null ? a[1].npsScore : -101;
      const scoreB = b[1].npsScore !== null ? b[1].npsScore : -101;
      return scoreB - scoreA;
    });

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAllVenuesMode ? "All venues overview" : `${selectedVenueIds.length} selected venues`}
            </p>
          </div>
          <FilterSelect
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' }
            ]}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden p-6">
          <div className="space-y-4">
            {sortedVenues.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No NPS data available for selected venues
              </div>
            ) : (
              sortedVenues.map(([venueId, data]) => {
                const getNPSColor = (score) => {
                  if (score >= 50) return 'text-green-600 bg-green-50 border-green-200';
                  if (score >= 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                  return 'text-red-600 bg-red-50 border-red-200';
                };

                return (
                  <button
                    key={venueId}
                    onClick={() => navigate(`/nps-report/${venueId}`)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {data.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            {data.responses} responses · {data.sent} emails sent
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* NPS Score */}
                        <div className="text-center">
                          {data.npsScore !== null ? (
                            <div className={`text-3xl font-bold mb-1 ${data.npsScore >= 50 ? 'text-green-600' : data.npsScore >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {data.npsScore}
                            </div>
                          ) : (
                            <div className="text-3xl font-bold text-gray-400 mb-1">—</div>
                          )}
                          <div className="text-xs text-gray-600 font-medium">NPS Score</div>
                        </div>

                        {/* Breakdown */}
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{data.promoters}</div>
                            <div className="text-xs text-gray-600">Promoters</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-yellow-600">{data.passives}</div>
                            <div className="text-xs text-gray-600">Passives</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">{data.detractors}</div>
                            <div className="text-xs text-gray-600">Detractors</div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single venue view
  if (!npsData) {
    return <div className="p-6 text-gray-500">No NPS data available</div>;
  }

  // Format date for chart labels
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Custom tooltip for trend chart
  const TrendTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-900 px-3 py-2">
            <p className="text-xs font-medium text-white">{data.date}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">NPS:</span>
              <span className={`font-bold ${getNPSColor(data.nps)}`}>
                {data.nps >= 0 ? `+${data.nps}` : data.nps}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for distribution chart
  const DistributionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const category = data.score >= 9 ? 'Promoter' : data.score >= 7 ? 'Passive' : 'Detractor';
      const categoryColor = data.score >= 9 ? 'text-green-600' : data.score >= 7 ? 'text-amber-600' : 'text-red-600';
      return (
        <div className="rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-900 px-3 py-2">
            <p className="text-xs font-medium text-white">Score {data.score}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getCategoryColor(data.score) }}
              />
              <span className={`font-medium ${categoryColor}`}>{category}:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {data.count} responses
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NPS Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Net Promoter Score analytics and customer sentiment</p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission('nps.export') && (
            <Button
              variant="secondary"
              onClick={handleOpenExportModal}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          <FilterSelect
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' }
            ]}
          />
        </div>
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* NPS Score Card with Chart */}
        <ModernCard className="relative" padding="p-5" shadow="shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                NPS Score
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${getNPSColor(npsData.npsScore)}`}>
                  {npsData.npsScore !== null ? (npsData.npsScore >= 0 ? `+${npsData.npsScore}` : npsData.npsScore) : '—'}
                </span>
                {/* Period comparison */}
                {comparison && comparison.prevNPS !== null && npsData.npsScore !== null && (
                  <span className={`inline-flex items-center text-sm font-medium ${
                    npsData.npsScore > comparison.prevNPS ? 'text-emerald-600' :
                    npsData.npsScore < comparison.prevNPS ? 'text-rose-600' :
                    'text-gray-500'
                  }`}>
                    {npsData.npsScore > comparison.prevNPS ? (
                      <ArrowUp className="w-4 h-4 mr-0.5" />
                    ) : npsData.npsScore < comparison.prevNPS ? (
                      <ArrowDown className="w-4 h-4 mr-0.5" />
                    ) : null}
                    {Math.abs(npsData.npsScore - comparison.prevNPS)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {npsData.responded} responses
                {comparison && comparison.prevNPS !== null && (
                  <span className="text-gray-400"> · {comparison.periodLabel}: {comparison.prevNPS >= 0 ? '+' : ''}{comparison.prevNPS}</span>
                )}
              </p>
            </div>
          </div>

          {/* NPS Trend Sparkline */}
          {npsData.trendChartData.length > 0 && (
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={npsData.trendChartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickMargin={8}
                  />
                  <YAxis
                    domain={[-100, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    width={35}
                    tickFormatter={(val) => val}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="nps"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* NPS Breakdown */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Promoters:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{npsData.promoters}</span>
                <span className="text-xs text-gray-400">
                  ({npsData.responded > 0 ? Math.round((npsData.promoters / npsData.responded) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Passives:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{npsData.passives}</span>
                <span className="text-xs text-gray-400">
                  ({npsData.responded > 0 ? Math.round((npsData.passives / npsData.responded) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Detractors:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{npsData.detractors}</span>
                <span className="text-xs text-gray-400">
                  ({npsData.responded > 0 ? Math.round((npsData.detractors / npsData.responded) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Response Rate Card */}
        <ModernCard className="relative" padding="p-5" shadow="shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Response Rate
              </p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {npsData.responseRate}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {npsData.responded} of {npsData.sent} responded
              </p>
            </div>
          </div>

          {/* Response Bar Chart */}
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Responded', value: npsData.responded, color: '#22c55e' },
                  { name: 'No Response', value: npsData.sent - npsData.responded, color: '#9ca3af' }
                ]}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg shadow-lg overflow-hidden">
                          <div className="bg-gray-900 px-3 py-2">
                            <p className="text-xs font-medium text-white">{item.name}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 px-3 py-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {item.value}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {[
                    { name: 'Responded', value: npsData.responded, color: '#22c55e' },
                    { name: 'No Response', value: npsData.sent - npsData.responded, color: '#9ca3af' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Responded:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{npsData.responded}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">No Response:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{npsData.sent - npsData.responded}</span>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Emails Sent Card */}
        <ModernCard className="relative" padding="p-5" shadow="shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Emails Sent
              </p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {npsData.sent}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {npsData.pending} pending · {npsData.failed} failed
              </p>
            </div>
          </div>

          {/* Email Delivery Bar Chart */}
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Delivered', value: npsData.sent - npsData.failed, color: '#22c55e' },
                  { name: 'Failed', value: npsData.failed, color: '#ef4444' }
                ]}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg shadow-lg overflow-hidden">
                          <div className="bg-gray-900 px-3 py-2">
                            <p className="text-xs font-medium text-white">{item.name}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 px-3 py-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {item.value}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {[
                    { name: 'Delivered', value: npsData.sent - npsData.failed, color: '#22c55e' },
                    { name: 'Failed', value: npsData.failed, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Delivered:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{npsData.sent - npsData.failed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{npsData.failed}</span>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Score Distribution */}
      <ModernCard padding="p-5" shadow="shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Score Distribution</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Response breakdown by rating (0-10)</p>
        </div>
        {npsData.distributionData.some((d) => d.count > 0) ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={npsData.distributionData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis
                  dataKey="score"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={32}
                />
                <Tooltip content={<DistributionTooltip />} cursor={false} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {npsData.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No distribution data available
          </div>
        )}
        {/* Legend */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Promoters (9-10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Passives (7-8)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Detractors (0-6)</span>
            </div>
          </div>
        </div>
      </ModernCard>

      {/* Recent Responses Table */}
      <ModernCard padding="p-5" shadow="shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Responses</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest NPS submissions with feedback</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Table</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Score</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Comment</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions
                .filter((s) => s.responded_at)
                .sort((a, b) => new Date(b.responded_at) - new Date(a.responded_at))
                .slice(0, 10)
                .map((submission) => {
                  const category =
                    submission.score >= 9
                      ? { label: 'Promoter', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' }
                      : submission.score >= 7
                      ? { label: 'Passive', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' }
                      : { label: 'Detractor', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };

                  return (
                    <tr key={submission.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300">{submission.customer_email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {submission.linkedFeedback?.table_number || submission.table_number ? (
                          <span className="font-medium">{submission.linkedFeedback?.table_number || submission.table_number}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-lg font-bold ${category.color}`}>
                          {submission.score}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${category.bg} ${category.color}`}>
                          {category.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        {submission.feedback ? (
                          <span className="line-clamp-2" title={submission.feedback}>
                            {submission.feedback}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(submission.responded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              {submissions.filter((s) => s.responded_at).length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No responses yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ModernCard>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export NPS Report</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export NPS summary statistics for the selected date range. This export includes aggregate metrics only, no customer information.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Start Date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  max={exportEndDate || new Date().toISOString().split('T')[0]}
                />
                <DatePicker
                  label="End Date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  min={exportStartDate}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting || !exportStartDate || !exportEndDate}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsNPS;
