import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabase';
import { useVenue } from '../../../context/VenueContext';
import usePageTitle from '../../../hooks/usePageTitle';
import {
  Users,
  Search,
  ChevronRight,
  Shield,
  Building2,
  Eye
} from 'lucide-react';

const ManagerPermissions = () => {
  usePageTitle('Manager Access');
  const navigate = useNavigate();
  const { allVenues, userRole } = useVenue();

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userRole !== 'master') {
      navigate('/dashboard');
      return;
    }
    fetchManagers();
  }, [userRole, navigate]);

  const fetchManagers = async () => {
    try {
      setLoading(true);

      // Get current user's account
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!userData?.account_id) return;

      // Get all venues for this account
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('account_id', userData.account_id);

      const venueIds = venues?.map(v => v.id) || [];

      // Get all managers (staff with is_manager = true) across all venues
      const { data: staffData } = await supabase
        .from('staff')
        .select(`
          user_id,
          venue_id,
          is_manager,
          venues(id, name),
          users(id, email, first_name, last_name)
        `)
        .in('venue_id', venueIds)
        .eq('is_manager', true);

      // Group by user_id to get unique managers with their venues
      const managerMap = new Map();
      staffData?.forEach(staff => {
        if (!staff.users) return;

        const existing = managerMap.get(staff.user_id);
        if (existing) {
          existing.venues.push(staff.venues);
        } else {
          managerMap.set(staff.user_id, {
            user_id: staff.user_id,
            email: staff.users.email,
            first_name: staff.users.first_name,
            last_name: staff.users.last_name,
            venues: [staff.venues]
          });
        }
      });

      setManagers(Array.from(managerMap.values()));
    } catch (error) {
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredManagers = managers.filter(manager => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${manager.first_name || ''} ${manager.last_name || ''}`.toLowerCase();
    return fullName.includes(searchLower) || manager.email?.toLowerCase().includes(searchLower);
  });

  if (userRole !== 'master') {
    return null;
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Shield className="w-4 h-4" />
          <span>Administration</span>
          <ChevronRight className="w-4 h-4" />
          <span>Permissions</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Access</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage permissions for all managers across your venues
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search managers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Managers List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading managers...
          </div>
        ) : filteredManagers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No managers found matching your search' : 'No managers found'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Venues
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {filteredManagers.map((manager) => (
                <tr
                  key={manager.user_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-sm font-medium text-rose-600 dark:text-rose-400 mr-3">
                        {`${manager.first_name?.[0] || ''}${manager.last_name?.[0] || ''}`.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {manager.first_name} {manager.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {manager.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {manager.venues.slice(0, 3).map((venue) => (
                        <span
                          key={venue.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        >
                          <Building2 className="w-3 h-3" />
                          {venue.name}
                        </span>
                      ))}
                      {manager.venues.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                          +{manager.venues.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => navigate(`/staff/managers/${manager.user_id}`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Manage Permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerPermissions;
