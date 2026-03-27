import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import PageContainer from '../../components/dashboard/layout/PageContainer';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import toast from 'react-hot-toast';

// Import tab components
import ProfileTab from '../../components/dashboard/settings/ProfileTab';
import VenueTab from '../../components/dashboard/settings/VenueTab';
import BrandingTab from '../../components/dashboard/settings/BrandingTab';
import BillingTab from '../../components/dashboard/settings/BillingTab';
import IntegrationsTab from '../../components/dashboard/settings/IntegrationsTab';

const SettingsPage = () => {
  usePageTitle('Settings');
  const { venueId, userRole } = useVenue();

  // State for active tab
  const [activeTab, setActiveTab] = useState('Profile');
  // Add mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // All your existing state variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [logo, setLogo] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('#1890ff');
  const [secondaryColor, setSecondaryColor] = useState('#52c41a');
  const [loading, setLoading] = useState(false);
  const [tableCount, setTableCount] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [tripadvisorLink, setTripadvisorLink] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    county: '',
    postalCode: '',
    country: '',
  });
  const [reviewLinksLoading, setReviewLinksLoading] = useState(false);

  // Sidebar navigation items - conditionally include Billing for master users
  const navItems = [
    { id: 'Profile', label: 'Profile' },
    { id: 'Venue', label: 'Venue' },
    { id: 'Integrations', label: 'Integrations' },
    { id: 'Branding', label: 'Branding' },
    ...(userRole === 'master' ? [{ id: 'Billing', label: 'Billing' }] : []),
  ];

  // Close mobile menu when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  // Fetch venue data
  useEffect(() => {
    if (!venueId) {
      return;
    }

    const fetchVenueData = async () => {
      // Get current user ID
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      // Fetch venue data
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name, logo, primary_color, secondary_color, table_count, address, phone, website, tripadvisor_link, google_review_link')
        .eq('id', venueId)
        .single();

      if (venueError) {
        console.error('Error fetching venue settings:', venueError);
        return;
      }

      // Fetch user profile data (global, not venue-specific)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        // Fallback to auth data
        setFirstName('');
        setLastName('');
        setEmail(auth.user.email || '');
      } else {
        // Set user profile data
        setFirstName(userData.first_name || '');
        setLastName(userData.last_name || '');
        setEmail(userData.email || auth.user.email || '');
      }

      // Set venue data
      setName(venueData.name || '');
      setLogo(venueData.logo || null);
      setPrimaryColor(venueData.primary_color || '#1890ff');
      setSecondaryColor(venueData.secondary_color || '#52c41a');
      setTableCount(venueData.table_count || '');
      setPhone(venueData.phone || '');
      setWebsite(venueData.website || '');
      setTripadvisorLink(venueData.tripadvisor_link || '');
      setGoogleReviewLink(venueData.google_review_link || '');
      setAddress(venueData.address || {
        line1: '',
        line2: '',
        city: '',
        county: '',
        postalCode: '',
        country: '',
      });

    };

    fetchVenueData();
  }, [venueId]);

  // Save settings - saves to both tables
  const saveSettings = async () => {
    if (!venueId) return;

    setLoading(true);

    try {
      // Get current user ID and email
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      const userEmail = auth?.user?.email;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Update users table (profile data)
      const userUpdates = {
        first_name: firstName,
        last_name: lastName,
        // Don't update email since it's disabled and should stay as-is
      };

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userUpdateError) {
        throw userUpdateError;
      }

      // No need to sync to staff table - names come from users table via join

      // Update venues table (venue data)
      const venueUpdates = {
        name,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        table_count: tableCount,
        address,
        phone,
        website,
        tripadvisor_link: tripadvisorLink,
        google_review_link: googleReviewLink,
      };

      const { error: venueError } = await supabase
        .from('venues')
        .update(venueUpdates)
        .eq('id', venueId);

      if (venueError) {
        throw venueError;
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      const errorDetails = error.code ? `Error ${error.code}: ${error.message}` : error.message;
      toast.error(`Failed to save settings: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  // Save review links only
  const saveReviewLinks = async () => {
    if (!venueId) return;

    setReviewLinksLoading(true);

    try {
      // Update only review links in venues table
      const { error: venueError } = await supabase
        .from('venues')
        .update({
          tripadvisor_link: tripadvisorLink,
          google_review_link: googleReviewLink,
        })
        .eq('id', venueId);

      if (venueError) {
        throw venueError;
      }

      toast.success('Review links saved successfully!');
    } catch (error) {
      console.error('Error updating review links:', error);
      toast.error(`Failed to save review links: ${error.message}`);
    } finally {
      setReviewLinksLoading(false);
    }
  };

  // Props to pass to tab components
  const tabProps = {
    // Data
    name, setName,
    email, setEmail,
    firstName, setFirstName,
    lastName, setLastName,
    logo, setLogo,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    tableCount, setTableCount,
    address, setAddress,
    phone, setPhone,
    website, setWebsite,
    tripadvisorLink, setTripadvisorLink,
    googleReviewLink, setGoogleReviewLink,
    
    // Actions
    saveSettings,
    saveReviewLinks,
    loading,
    reviewLinksLoading,
    venueId,
    userRole,
    currentVenueId: venueId,
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Profile':
        return <ProfileTab {...tabProps} />;
      case 'Venue':
        return <VenueTab {...tabProps} />;
      case 'Integrations':
        return <IntegrationsTab />;
      case 'Branding':
        return <BrandingTab {...tabProps} />;
      case 'Billing':
        return <BillingTab />;
      default:
        return <ProfileTab {...tabProps} />;
    }
  };

  if (!venueId) {
    return null;
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 text-sm lg:text-base">Manage your account and venue settings.</p>
      </div>

      {/* Mobile Tab Selector */}
      <div className="lg:hidden mb-6">
        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-left text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="block truncate">
              {navItems.find(item => item.id === activeTab)?.label || 'Select Tab'}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </button>

          {isMobileMenuOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    activeTab === item.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {renderActiveTab()}
        </div>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;