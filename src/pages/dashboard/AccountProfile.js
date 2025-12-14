import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import ProfileTab from '../../components/dashboard/settings/ProfileTab';

const AccountProfilePage = () => {
  usePageTitle('Account Profile');
  const { venueId } = useVenue();

  // State variables for ProfileTab
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name, email, weekly_report_enabled')
          .eq('id', auth.user.id)
          .single();

        if (userData) {
          setFirstName(userData.first_name || '');
          setLastName(userData.last_name || '');
          setEmail(userData.email || auth.user.email || '');
          setWeeklyReportEnabled(userData.weekly_report_enabled || false);
        } else {
          // Fallback to auth data
          setFirstName('');
          setLastName('');
          setEmail(auth.user.email || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Account Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and account settings</p>
      </div>

      <ProfileTab
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        email={email}
        setEmail={setEmail}
        venueId={venueId}
        weeklyReportEnabled={weeklyReportEnabled}
        setWeeklyReportEnabled={setWeeklyReportEnabled}
      />
    </div>
  );
};

export default AccountProfilePage;