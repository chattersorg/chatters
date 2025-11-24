import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import VenueTab from '../../components/dashboard/settings/VenueTab';
import { Building2, ChevronRight, MapPin, Phone, Globe, Edit2, TrendingUp, TrendingDown, MessageSquare, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';

const VenueSettingsPage = () => {
  const location = useLocation();
  const { venueId, allVenues, setCurrentVenue, userRole } = useVenue();

  // Determine if we're in multi-venue list mode (accessed from Multi Venue > Venues)
  // vs single-venue edit mode (accessed from Venue Settings submenu)
  // /multi-venue/venues = Multi Venue list view (only for multi-venue users)
  // /settings/venue-details = Single venue edit form (always)
  const isVenueDetailsRoute = location.pathname === '/settings/venue-details';
  const isMultiVenueRoute = location.pathname === '/multi-venue/venues';
  const initialViewMode = isVenueDetailsRoute ? 'edit' : 'list';
  const [viewMode, setViewMode] = useState(initialViewMode);
  const isMultiVenueMode = isMultiVenueRoute && allVenues.length > 1;

  usePageTitle(isMultiVenueMode ? 'Venues Management' : 'Venue Settings');

  // All state variables for VenueTab
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    county: '',
    postalCode: '',
    country: '',
  });
  const [message, setMessage] = useState('');
  const [venueMetrics, setVenueMetrics] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Venue management state (for multi-venue mode)
  const [newVenue, setNewVenue] = useState({
    name: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      county: '',
      postalCode: '',
      country: '',
    },
  });
  const [venueLoading, setVenueLoading] = useState(false);
  const [venueMessage, setVenueMessage] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { venueId, venueName }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreateWarning, setShowCreateWarning] = useState(false);

  // Fetch venue metrics (NPS, feedback count, resolution rate)
  useEffect(() => {
    if (!isMultiVenueMode) {
      return;
    }

    const fetchVenueMetrics = async () => {
      setLoadingMetrics(true);
      const metrics = {};

      // Get 30 days ago for recent metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const venue of allVenues) {
        // Fetch NPS submissions for this venue in last 30 days
        const { data: npsSubmissions, error: npsError } = await supabase
          .from('nps_submissions')
          .select('score')
          .eq('venue_id', venue.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Calculate NPS
        const npsScores = (npsSubmissions || [])
          .map(s => s.score)
          .filter(score => score !== null && score !== undefined);

        let nps = null;
        if (npsScores.length > 0) {
          const promoters = npsScores.filter(s => s >= 9).length;
          const detractors = npsScores.filter(s => s <= 6).length;
          nps = Math.round(((promoters - detractors) / npsScores.length) * 100);
        }

        // Fetch all feedback for this venue in last 30 days
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('session_id, is_actioned, dismissed')
          .eq('venue_id', venue.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Calculate unique sessions (total feedback)
        const uniqueSessions = new Set(
          (feedbackData || []).map(f => f.session_id)
        );
        const totalFeedback = uniqueSessions.size;

        // Calculate resolution rate
        const sessionGroups = {};
        (feedbackData || []).forEach(item => {
          if (!sessionGroups[item.session_id]) {
            sessionGroups[item.session_id] = [];
          }
          sessionGroups[item.session_id].push(item);
        });

        const sessionArray = Object.values(sessionGroups);
        const resolvedSessions = sessionArray.filter(session =>
          session.every(item => item.is_actioned === true || item.dismissed === true)
        ).length;
        const resolutionRate = totalFeedback > 0
          ? Math.round((resolvedSessions / totalFeedback) * 100)
          : 0;

        metrics[venue.id] = {
          nps,
          totalFeedback,
          resolutionRate
        };
      }

      setVenueMetrics(metrics);
      setLoadingMetrics(false);
    };

    fetchVenueMetrics();
  }, [allVenues, isMultiVenueMode]);

  // Fetch venue data
  useEffect(() => {
    if (!venueId) {
      return;
    }

    const fetchVenueData = async () => {
      // Fetch venue data
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name, address, phone, website')
        .eq('id', venueId)
        .single();

      if (venueError) {
        console.error('Error fetching venue settings:', venueError);
        return;
      }

      // Set venue data
      setName(venueData.name || '');
      setPhone(venueData.phone || '');
      setWebsite(venueData.website || '');
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

  // Save settings
  const saveSettings = async () => {
    if (!venueId) return;

    setLoading(true);
    setMessage('');

    try {
      // Update venues table
      const venueUpdates = {
        name,
        address,
        phone,
        website,
      };

      const { error: venueError } = await supabase
        .from('venues')
        .update(venueUpdates)
        .eq('id', venueId);

      if (venueError) {
        throw venueError;
      }

      setMessage('Venue settings updated successfully!');
    } catch (error) {
      console.error('Error updating venue settings:', error);
      const errorDetails = error.code ? `Error ${error.code}: ${error.message}` : error.message;
      setMessage(`Failed to update venue settings: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch account ID and user ID for venue management
  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!isMultiVenueMode || !userRole || userRole !== 'master') return;

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      setUserId(user.id);

      const { data: userRow } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (userRow) {
        setAccountId(userRow.account_id);
      }
    };

    fetchAccountInfo();
  }, [isMultiVenueMode, userRole]);

  // Update Stripe subscription quantity
  const updateStripeQuantity = async () => {
    try {
      const response = await fetch('/api/update-subscription-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.updated) {
        console.log('Stripe subscription updated:', data);
      } else {
        console.log('Stripe subscription not updated:', data.message);
      }
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
    }
  };

  // Handle create venue form submit
  const handleCreateVenueSubmit = (e) => {
    e.preventDefault();
    if (!newVenue.name || !accountId || !userId) {
      setVenueMessage('Please fill in the venue name');
      return;
    }
    setShowCreateWarning(true);
  };

  // Create new venue
  const handleCreateVenue = async () => {
    setShowCreateWarning(false);
    setVenueLoading(true);
    setVenueMessage('');

    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .insert([
          {
            name: newVenue.name,
            account_id: accountId,
            logo: null,
            address: newVenue.address,
            primary_color: '#16A34A',
            background_color: '#ffffff',
            text_color: '#111827',
            button_text_color: '#ffffff',
          },
        ])
        .select()
        .single();

      if (venueError) {
        throw new Error(venueError.message);
      }

      await updateStripeQuantity();

      setVenueMessage('Venue created successfully! This venue will be added to your next billing cycle.');
      setNewVenue({
        name: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          county: '',
          postalCode: '',
          country: '',
        },
      });

      // Refresh the page or context to show new venue
      window.location.reload();

    } catch (error) {
      console.error('Error creating venue:', error);
      const errorDetails = error.code ? `Error ${error.code}: ${error.message}` : error.message;
      setVenueMessage(`Failed to create venue: ${errorDetails}. Please contact support.`);
    } finally {
      setVenueLoading(false);
    }
  };

  // Handle delete venue
  const handleDeleteVenue = async () => {
    if (!deleteConfirm) return;

    setDeleteLoading(true);
    setVenueMessage('');

    try {
      const { venueId: venueToDelete, venueName } = deleteConfirm;

      if (venueToDelete === venueId) {
        setVenueMessage('Cannot delete the venue you are currently viewing. Please switch to another venue first.');
        setDeleteConfirm(null);
        setDeleteLoading(false);
        return;
      }

      // Delete associated staff records first
      const { error: staffError } = await supabase
        .from('staff')
        .delete()
        .eq('venue_id', venueToDelete);

      if (staffError) {
        throw new Error(`Failed to delete staff records: ${staffError.message}`);
      }

      // Delete the venue
      const { error: venueError } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueToDelete)
        .eq('account_id', accountId);

      if (venueError) {
        throw new Error(`Failed to delete venue: ${venueError.message}`);
      }

      await updateStripeQuantity();

      setVenueMessage(`Venue "${venueName}" deleted successfully! This venue will be removed from your next billing cycle.`);
      setDeleteConfirm(null);

      // Refresh the page to update the venue list
      window.location.reload();

    } catch (error) {
      console.error('Error deleting venue:', error);
      setVenueMessage(`Failed to delete venue: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };


  if (!venueId) {
    return null;
  }

  // Helper function to get NPS badge styling
  const getNPSBadge = (nps) => {
    if (nps === null || nps === undefined) {
      return { color: 'bg-gray-100 text-gray-600', label: 'No Data', icon: null };
    }
    if (nps >= 50) {
      return { color: 'bg-green-500 text-white', label: `${nps}`, icon: TrendingUp };
    }
    if (nps >= 0) {
      return { color: 'bg-yellow-500 text-gray-900', label: `${nps}`, icon: null };
    }
    return { color: 'bg-red-500 text-white', label: `${nps}`, icon: TrendingDown };
  };

  // Helper function to get resolution rate badge styling
  const getResolutionBadge = (rate) => {
    if (rate >= 75) {
      return 'bg-green-100 text-green-700';
    }
    if (rate >= 50) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-red-100 text-red-700';
  };

  // Multi-venue list mode: Show all venues with quick switcher
  if (isMultiVenueMode) {
    return (
      <div className="space-y-6">
        <ChartCard
          title="Venues Quick Glance"
          subtitle="A quick glance at your venues. Click to switch primary venue and edit venue details."
        >
          {loadingMetrics ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <span className="text-gray-600">Loading venue metrics...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Venue</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">NPS Score</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Feedback</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Resolution</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVenues.map((venue) => {
                      const isActive = venue.id === venueId;
                      const metrics = venueMetrics[venue.id] || {};
                      const npsBadge = getNPSBadge(metrics.nps);
                      const NPSIcon = npsBadge.icon;

                      return (
                        <tr
                          key={venue.id}
                          className={`border-b border-gray-100 transition-colors ${
                            isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Venue Name */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <Building2 className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{venue.name}</div>
                                {isActive && (
                                  <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-200 rounded-full mt-1">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-4 px-4">
                            {venue.address ? (
                              <div className="text-sm text-gray-600">
                                <div>{venue.address.city || venue.address.line1}</div>
                                {venue.address.postalCode && (
                                  <div className="text-xs text-gray-500">{venue.address.postalCode}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>

                          {/* NPS Score */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${npsBadge.color} inline-flex items-center gap-1`}>
                                {NPSIcon && <NPSIcon className="w-4 h-4" />}
                                {npsBadge.label}
                              </span>
                            </div>
                          </td>

                          {/* Total Feedback */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900">
                                {metrics.totalFeedback || 0}
                              </span>
                            </div>
                          </td>

                          {/* Resolution Rate */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4 text-gray-400" />
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getResolutionBadge(metrics.resolutionRate || 0)}`}>
                                {metrics.resolutionRate || 0}%
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {!isActive && (
                                <button
                                  onClick={() => setCurrentVenue(venue.id)}
                                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                  Switch
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isActive && allVenues.length > 1 && (
                                <button
                                  onClick={() => setDeleteConfirm({ venueId: venue.id, venueName: venue.name })}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete venue"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {allVenues.map((venue) => {
                  const isActive = venue.id === venueId;
                  const metrics = venueMetrics[venue.id] || {};
                  const npsBadge = getNPSBadge(metrics.nps);
                  const NPSIcon = npsBadge.icon;

                  return (
                    <div
                      key={venue.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {/* Venue Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Building2 className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                          {venue.address && (
                            <p className="text-sm text-gray-600 mt-1">
                              {venue.address.city || venue.address.line1}
                              {venue.address.postalCode && ` ${venue.address.postalCode}`}
                            </p>
                          )}
                          {isActive && (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-200 rounded-full mt-2">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">NPS Score</div>
                          <span className={`px-2 py-1 rounded-full text-sm font-bold ${npsBadge.color} inline-flex items-center gap-1`}>
                            {NPSIcon && <NPSIcon className="w-3 h-3" />}
                            {npsBadge.label}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Feedback</div>
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="w-3 h-3 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {metrics.totalFeedback || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Resolved</div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getResolutionBadge(metrics.resolutionRate || 0)}`}>
                            {metrics.resolutionRate || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!isActive && (
                          <button
                            onClick={() => setCurrentVenue(venue.id)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            Switch
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        {!isActive && allVenues.length > 1 && (
                          <button
                            onClick={() => setDeleteConfirm({ venueId: venue.id, venueName: venue.name })}
                            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            title="Delete venue"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Section */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Performance Metrics</h4>
                    <p className="text-sm text-gray-600">
                      All metrics shown are based on the last 30 days of activity. Click <strong>Switch</strong> to change your active venue.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </ChartCard>

        {/* Create Additional Venue */}
        {userRole === 'master' && (
          <ChartCard
            title="Create Additional Venue"
            subtitle="Expand your business by adding more venues to your account. New venues are added to your next billing cycle."
          >
            <form onSubmit={handleCreateVenueSubmit} className="space-y-6">
              {/* Venue Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Venue Name *</label>
                <input
                  type="text"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                  placeholder="Enter the new venue name"
                  required
                />
              </div>

              {/* Simplified Address for New Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={newVenue.address.line1}
                    onChange={(e) => setNewVenue(prev => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={newVenue.address.city}
                      onChange={(e) => setNewVenue(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={newVenue.address.postalCode}
                      onChange={(e) => setNewVenue(prev => ({
                        ...prev,
                        address: { ...prev.address, postalCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={venueLoading}
                  className="bg-custom-green text-white px-6 py-2 rounded-lg hover:bg-custom-green-hover transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {venueLoading ? 'Creating Venue...' : 'Create New Venue'}
                </button>
              </div>

              {/* Venue Creation Message */}
              {venueMessage && (
                <div className={`text-sm p-3 rounded-lg ${
                  venueMessage.includes('success')
                    ? 'text-green-700 bg-green-50 border border-green-200'
                    : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  {venueMessage}
                </div>
              )}
            </form>
          </ChartCard>
        )}

        {/* Create Venue Confirmation Modal */}
        {showCreateWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Add New Venue?</h3>
              </div>

              <p className="text-gray-600 mb-4 leading-relaxed">
                You're about to create <strong>"{newVenue.name}"</strong>.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Billing Information:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
                  <li>• This venue will be added to your subscription</li>
                  <li>• You'll be charged on your next billing date</li>
                  <li>• Cost: £149/month or £1,430/year per venue</li>
                  <li>• Prorated amount will apply for partial months</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateVenue}
                  disabled={venueLoading}
                  className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {venueLoading ? 'Creating...' : 'Yes, Create Venue'}
                </button>
                <button
                  onClick={() => setShowCreateWarning(false)}
                  disabled={venueLoading}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Venue?</h3>
              </div>

              <p className="text-gray-600 mb-4 leading-relaxed">
                Are you sure you want to delete <strong>"{deleteConfirm.venueName}"</strong>?
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This will:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1 ml-4">
                  <li>• Permanently delete all venue data</li>
                  <li>• Remove all staff assignments</li>
                  <li>• Delete all feedback and analytics</li>
                  <li>• Reduce your next billing cycle amount</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteVenue}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete Venue'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteLoading}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single-venue edit mode: Show edit form for current venue
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Venue Details</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your venue information and location details</p>
      </div>

      <VenueTab
        name={name}
        setName={setName}
        address={address}
        setAddress={setAddress}
        phone={phone}
        setPhone={setPhone}
        website={website}
        setWebsite={setWebsite}
        saveSettings={saveSettings}
        loading={loading}
        message={message}
        venueId={venueId}
      />
    </div>
  );
};

export default VenueSettingsPage;