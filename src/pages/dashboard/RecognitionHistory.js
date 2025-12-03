import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { Trophy, Mail, Calendar, Award, Download } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const RecognitionHistory = () => {
  const { venueId } = useVenue();
  usePageTitle('Recognition History');
  const [recognitions, setRecognitions] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    uniqueEmployees: 0,
  });

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return { start: today.toISOString() };
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek.toISOString() };
      }
      case 'thisMonth': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth.toISOString() };
      }
      case 'last30':
        return { start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() };
      default:
        return { start: null };
    }
  };

  const fetchRecognitions = async () => {
    setLoading(true);
    try {
      const { start } = getDateRange(timeFilter);

      // First, get all recognitions
      let query = supabase
        .from('staff_recognitions')
        .select('*')
        .order('sent_at', { ascending: false });

      if (start) {
        query = query.gte('sent_at', start);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recognitions:', error);
        return;
      }

      // Get employee details for each recognition
      const employeeIds = [...new Set(data?.map(r => r.employee_id) || [])];
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, venue_id')
        .in('id', employeeIds);

      // Create employee lookup map
      const employeeMap = {};
      employeesData?.forEach(emp => {
        employeeMap[emp.id] = emp;
      });

      // Filter by current venue and enrich with employee data
      const enrichedData = (data || [])
        .map(r => ({
          ...r,
          employee_name: employeeMap[r.employee_id]
            ? `${employeeMap[r.employee_id].first_name} ${employeeMap[r.employee_id].last_name}`
            : 'Unknown Employee',
          employee_email: employeeMap[r.employee_id]?.email || 'N/A',
          employee_venue_id: employeeMap[r.employee_id]?.venue_id
        }))
        .filter(r => r.employee_venue_id === venueId); // Filter by current venue

      setRecognitions(enrichedData);

      // Calculate stats
      const uniqueEmployees = new Set(enrichedData?.map(r => r.employee_id) || []).size;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const thisMonthCount = enrichedData?.filter(r => new Date(r.sent_at) >= startOfMonth).length || 0;

      setStats({
        total: enrichedData?.length || 0,
        thisMonth: thisMonthCount,
        uniqueEmployees,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (venueId) fetchRecognitions();
  }, [venueId, timeFilter]);

  const exportToCSV = () => {
    if (recognitions.length === 0) return;

    const csvContent = [
      ['Date', 'Employee Name', 'Email', 'Manager', 'Venue', 'Rank', 'Period', 'Total Resolved', 'Personal Message'].join(','),
      ...recognitions.map(r => [
        new Date(r.sent_at).toLocaleDateString(),
        `"${r.employee_name || 'Unknown'}"`,
        r.employee_email || 'N/A',
        `"${r.manager_name || 'N/A'}"`,
        `"${r.venue_name || 'N/A'}"`,
        r.rank || 0,
        `"${r.period || 'N/A'}"`,
        r.total_resolved || 0,
        r.personal_message ? `"${r.personal_message.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recognition-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800';
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    if (rank === 3) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800';
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800';
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats Overview */}
      <ChartCard
        title="Recognition Overview"
        subtitle="Track staff recognition emails and performance acknowledgments"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Recognitions</h3>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">all time</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">This Month</h3>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.thisMonth}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('en-US', { month: 'short' })}</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unique Employees</h3>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.uniqueEmployees}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">recognised</p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Recognition List */}
      <ChartCard
        title="Recognition History"
        subtitle="View all recognition emails sent to staff members"
        actions={
          <div className="flex items-center space-x-4">
            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="last30">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Export Button */}
            <PermissionGate permission="reports.export">
              <button
                onClick={exportToCSV}
                disabled={recognitions.length === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </PermissionGate>
          </div>
        }
      >
        <div className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 dark:border-green-400"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading recognitions...</span>
            </div>
          ) : recognitions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Date Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {recognitions.map((recognition) => (
                    <tr key={recognition.id} className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Mail className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                          {dayjs(recognition.sent_at).format('MMM D, YYYY')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {dayjs(recognition.sent_at).fromNow()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400 mr-3">
                            {recognition.employee_name.split(' ').map(word => word[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{recognition.employee_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{recognition.employee_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getRankBadgeColor(recognition.rank)}`}>
                          #{recognition.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{recognition.period}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{recognition.total_resolved}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">total resolved</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{recognition.manager_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {recognition.personal_message ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400 italic max-w-xs truncate" title={recognition.personal_message}>
                            "{recognition.personal_message}"
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500">No message</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              <div className="flex flex-col items-center">
                <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No recognition emails sent yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recognition emails will appear here once you start sending them from the Staff Leaderboard</p>
              </div>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
};

export default RecognitionHistory;
