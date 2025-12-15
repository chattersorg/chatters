import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { PermissionGate } from '../../context/PermissionsContext';
import { Mail, Trophy, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import FilterSelect from '../../components/ui/FilterSelect';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const StaffLeaderboard = () => {
  const { venueId } = useVenue();
  const navigate = useNavigate();
  usePageTitle('Staff Leaderboard');
  const [staffStats, setStaffStats] = useState([]);
  const [timeFilter, setTimeFilter] = useState('last7');
  const [recognitionModal, setRecognitionModal] = useState(null);
  const [personalMessage, setPersonalMessage] = useState('');
  const [sendingRecognition, setSendingRecognition] = useState(false);
  const [recognitionMessage, setRecognitionMessage] = useState('');

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return { start: today.toISOString(), end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() };
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek.toISOString(), end: new Date().toISOString() };
      }
      case 'last7':
        return { start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() };
      case 'last30':
        return { start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() };
      default:
        return { start: null, end: new Date().toISOString() };
    }
  };

  const fetchStaffLeaderboard = async (venueId) => {
    const { start: fromDate } = getDateRange(timeFilter);

    // Fetch resolved feedback sessions with co-resolver info
    let feedbackQuery = supabase
      .from('feedback')
      .select('session_id, resolved_by, co_resolver_id, resolved_at')
      .eq('venue_id', venueId)
      .not('resolved_by', 'is', null);

    if (fromDate) feedbackQuery = feedbackQuery.gte('resolved_at', fromDate);

    // Fetch resolved assistance requests
    let assistanceQuery = supabase
      .from('assistance_requests')
      .select('id, resolved_by, resolved_at')
      .eq('venue_id', venueId)
      .not('resolved_by', 'is', null);

    if (fromDate) assistanceQuery = assistanceQuery.gte('resolved_at', fromDate);

    const [
      { data: feedbackData, error: feedbackError },
      { data: assistanceData, error: assistanceError }
    ] = await Promise.all([feedbackQuery, assistanceQuery]);

    if (feedbackError || assistanceError) {
      return;
    }

    const feedbackResolvedCounts = {};
    const feedbackCoResolvedCounts = {};
    const assistanceCounts = {};

    // Count feedback sessions resolved by each employee
    if (feedbackData?.length) {
      const sessionMap = {};
      const coResolverMap = {};

      feedbackData.forEach(item => {
        if (item.session_id && item.resolved_by) {
          sessionMap[item.session_id] = item.resolved_by;
          // Track co-resolver per session
          if (item.co_resolver_id) {
            coResolverMap[item.session_id] = item.co_resolver_id;
          }
        }
      });

      // Count main resolvers
      Object.values(sessionMap).forEach(employeeId => {
        feedbackResolvedCounts[employeeId] = (feedbackResolvedCounts[employeeId] || 0) + 1;
      });

      // Count co-resolvers
      Object.values(coResolverMap).forEach(employeeId => {
        feedbackCoResolvedCounts[employeeId] = (feedbackCoResolvedCounts[employeeId] || 0) + 1;
      });
    }

    // Count assistance requests resolved by each employee
    if (assistanceData?.length) {
      assistanceData.forEach(request => {
        if (request.resolved_by) {
          assistanceCounts[request.resolved_by] = (assistanceCounts[request.resolved_by] || 0) + 1;
        }
      });
    }

    // Get all unique employee IDs from all types of resolutions
    const allEmployeeIds = [...new Set([
      ...Object.keys(feedbackResolvedCounts),
      ...Object.keys(feedbackCoResolvedCounts),
      ...Object.keys(assistanceCounts)
    ])];

    if (allEmployeeIds.length === 0) return setStaffStats([]);

    // Fetch employee details (staff are stored in employees table)
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, role, location')
      .in('id', allEmployeeIds);

    if (employeeError) {
      return;
    }

    const combined = employeeData
      .map(e => {
        const feedbackResolved = feedbackResolvedCounts[e.id] || 0;
        const feedbackCoResolved = feedbackCoResolvedCounts[e.id] || 0;
        const assistanceResolved = assistanceCounts[e.id] || 0;

        return {
          id: e.id,
          name: `${e.first_name} ${e.last_name}`,
          role: e.role,
          location: e.location,
          feedbackResolved,
          feedbackCoResolved,
          assistanceResolved,
          totalResolved: feedbackResolved + feedbackCoResolved + assistanceResolved,
        };
      })
      .filter(e => e.totalResolved > 0) // Only show employees who have resolved something
      .sort((a, b) => b.totalResolved - a.totalResolved)
      .map((s, index) => ({ ...s, rank: index + 1 }));

    setStaffStats(combined);
  };

  const getPeriodText = (filter) => {
    switch (filter) {
      case 'today': return 'Today';
      case 'thisWeek': return 'This Week';
      case 'last7': return 'Last 7 Days';
      case 'last30': return 'Last 30 Days';
      default: return 'All Time';
    }
  };

  const exportLeaderboard = () => {
    if (staffStats.length === 0) return;

    const csvContent = [
      ['Rank', 'Staff Name', 'Role', 'Resolved', 'Co-resolved', 'Assistance', 'Total', 'Period'].join(','),
      ...staffStats.map(staff => [
        staff.rank,
        `"${staff.name}"`,
        `"${staff.role}"`,
        staff.feedbackResolved,
        staff.feedbackCoResolved,
        staff.assistanceResolved,
        staff.totalResolved,
        getPeriodText(timeFilter)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `staff-leaderboard-${timeFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendRecognitionEmail = async (staff) => {
    setSendingRecognition(true);
    setRecognitionMessage('');

    try {
      // Get employee email
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('email')
        .eq('id', staff.id)
        .single();

      if (employeeError || !employeeData?.email) {
        throw new Error('Could not find employee email address');
      }

      // Get venue name
      const { data: venueData } = await supabase
        .from('venues')
        .select('name')
        .eq('id', venueId)
        .single();

      // Get manager name
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const managerName = userData?.first_name && userData?.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : 'Your Manager';

      const response = await fetch('/api/send-recognition-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: staff.id,
          employeeEmail: employeeData.email,
          employeeName: staff.name,
          managerName,
          venueName: venueData?.name || 'the team',
          stats: {
            rank: staff.rank,
            feedbackResolved: staff.feedbackResolved,
            assistanceResolved: staff.assistanceResolved,
            totalResolved: staff.totalResolved,
            period: getPeriodText(timeFilter)
          },
          personalMessage: personalMessage.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send recognition email');
      }

      setRecognitionMessage('Recognition email sent successfully!');
      setTimeout(() => {
        setRecognitionModal(null);
        setPersonalMessage('');
        setRecognitionMessage('');
      }, 2000);

    } catch (error) {
      setRecognitionMessage(`Error: ${error.message}`);
    } finally {
      setSendingRecognition(false);
    }
  };

  useEffect(() => {
    if (venueId) fetchStaffLeaderboard(venueId);
  }, [venueId, timeFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Staff Leaderboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track staff performance and feedback resolution rates</p>
      </div>

      {/* Leaderboard Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {/* Card Header with Filters */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Performance Rankings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Staff ranked by total resolutions</p>
            </div>
            <div className="flex items-center gap-3">
              <FilterSelect
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                options={[
                  { value: 'today', label: 'Today' },
                  { value: 'thisWeek', label: 'This Week' },
                  { value: 'last7', label: 'Last 7 Days' },
                  { value: 'last30', label: 'Last 30 Days' },
                  { value: 'all', label: 'All Time' }
                ]}
              />
              <PermissionGate permission="reports.export">
                <Button
                  variant="secondary"
                  onClick={exportLeaderboard}
                  disabled={staffStats.length === 0}
                  className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {staffStats.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Resolved
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Co-resolved
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Assistance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700">
                {staffStats.map((staff, index) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' :
                        index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {staff.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 mr-3">
                          {staff.name.split(' ').map(word => word[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/staff-member/${staff.id}`)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-left"
                          >
                            {staff.name}
                          </button>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {staff.role && <span>{staff.role}</span>}
                            {staff.location && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {staff.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{staff.feedbackResolved}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{staff.feedbackCoResolved}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{staff.assistanceResolved}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{staff.totalResolved}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <PermissionGate permission="staff.recognition">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setRecognitionModal(staff)}
                        >
                          Recognise
                        </Button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No staff performance data</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Data will appear here as staff resolve feedback</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recognition Modal */}
      {recognitionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                  <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Send Recognition</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Celebrate {recognitionModal.name}'s performance</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setRecognitionModal(null);
                  setPersonalMessage('');
                  setRecognitionMessage('');
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Stats Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{recognitionModal.rank}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Rank</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{recognitionModal.feedbackResolved}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Resolved</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{recognitionModal.feedbackCoResolved}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Co-resolved</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{recognitionModal.totalResolved}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                  </div>
                </div>
              </div>

              {/* Personal Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Add a personal note to make this recognition extra special..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                  rows={3}
                  disabled={sendingRecognition}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be included in the email as a personal message from you
                </p>
              </div>

              {recognitionMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  recognitionMessage.includes('success')
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}>
                  {recognitionMessage}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setRecognitionModal(null);
                  setPersonalMessage('');
                  setRecognitionMessage('');
                }}
                disabled={sendingRecognition}
                className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => sendRecognitionEmail(recognitionModal)}
                loading={sendingRecognition}
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendingRecognition ? 'Sending...' : 'Send Recognition'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffLeaderboard;
