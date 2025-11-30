import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import ManagersTab from '../../components/dashboard/staff/ManagersTab';

const StaffManagersPage = () => {
  usePageTitle('Managers');
  const { venueId, userRole, allVenues, loading: venueLoading } = useVenue();

  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (venueLoading) return;
    if (userRole === 'master' && (!allVenues || allVenues.length === 0)) return;
    if (userRole !== 'master' && !venueId) return;
    fetchStaffData();
  }, [venueId, userRole, allVenues, venueLoading]);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', userId)
        .single();

      if (!userData?.account_id) return;

      if (userRole === 'master') {
        await fetchAllStaffForAccount(userData.account_id);
      } else {
        await fetchStaffForManager(userId);
      }
    } catch (error) {
      setMessage('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStaffForAccount = async () => {
    if (!allVenues || allVenues.length === 0) {
      setManagers([]);
      setEmployees([]);
      return;
    }

    const venueIds = allVenues.map(v => v.id);

    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select(`
        id,
        user_id,
        venue_id,
        role,
        created_at
      `)
      .in('venue_id', venueIds);

    if (staffError || !staffData) {
      return;
    }

    const userIds = [...new Set(staffData.map(s => s.user_id))].filter(id => id !== null && id !== undefined);

    if (userIds.length === 0) {
      setManagers([]);
      setEmployees([]);
      return;
    }

    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, password_hash, created_at')
      .in('id', userIds)
      .is('deleted_at', null); // Only fetch non-deleted users

    const { data: venuesData } = await supabase
      .from('venues')
      .select('id, name')
      .in('id', venueIds);

    const staffWithJoins = staffData.map(staff => {
      const foundUser = usersData?.find(u => u.id === staff.user_id);
      const foundVenue = venuesData?.find(v => v.id === staff.venue_id);

      return {
        ...staff,
        users: foundUser || null,
        venues: foundVenue || null
      };
    });

    // Filter out staff records where user is null (deleted users)
    const activeStaffWithJoins = staffWithJoins.filter(staff => staff.users !== null);

    const { data: employeesData } = await supabase
      .from('employees')
      .select(`
        id,
        venue_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        created_at,
        venues (id, name)
      `)
      .in('venue_id', venueIds);

    const managersData = activeStaffWithJoins?.filter(staff => staff.role === 'manager') || [];
    const employeesFromTable = employeesData || [];

    setManagers(managersData);
    setEmployees(employeesFromTable);
  };

  const fetchStaffForManager = async (userId) => {
    const { data: staffData } = await supabase
      .from('staff')
      .select(`
        id,
        user_id,
        venue_id,
        role,
        created_at,
        venues!inner (id, name),
        users!inner (id, email, role, first_name, last_name, deleted_at)
      `)
      .eq('venue_id', venueId)
      .neq('user_id', userId)
      .is('users.deleted_at', null); // Filter out soft-deleted users

    const { data: employeesData } = await supabase
      .from('employees')
      .select(`
        id,
        venue_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        created_at,
        venues (id, name)
      `)
      .eq('venue_id', venueId);

    const managersData = staffData?.filter(staff => staff.role === 'manager') || [];
    const employeesFromTable = employeesData || [];

    setManagers(managersData);
    setEmployees(employeesFromTable);
  };

  const addManager = async () => {
    setLoading(true);
    try {
      await fetchStaffData();
      setMessage('Manager added successfully!');
    } catch {
      setMessage('Failed to add manager');
    } finally {
      setLoading(false);
    }
  };

  const updateManagerVenues = async () => {
    setLoading(true);
    try {
      await fetchStaffData();
      setMessage('Manager venues updated successfully!');
    } catch {
      setMessage('Failed to update manager venues');
    } finally {
      setLoading(false);
    }
  };

  const tabProps = {
    managers,
    employees,
    allVenues,
    venueId,
    userRole,
    addManager,
    updateManagerVenues,
    fetchStaffData,
    loading,
    message,
    setMessage,
  };

  if (venueLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading venues...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ChartCard
        title="Managers"
        subtitle="Manage manager accounts and venue access permissions"
        titleRight={
          message && (
            <span className={`text-sm font-medium ${
              message.includes('success') || message.includes('recovered')
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {message}
            </span>
          )
        }
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Loading staff data...</span>
          </div>
        )}

        {!loading && <ManagersTab {...tabProps} />}
      </ChartCard>
    </div>
  );
};

export default StaffManagersPage;