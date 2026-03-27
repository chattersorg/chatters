import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, FolderKanban, Check } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const VenueSelectorFilter = ({
  venues = [],
  selectedVenueIds = [],
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [venueGroups, setVenueGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null); // Track if a group is selected
  const containerRef = useRef(null);

  // Fetch venue groups on mount
  useEffect(() => {
    const fetchVenueGroups = async () => {
      try {
        setLoadingGroups(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('account_id')
          .eq('id', user.id)
          .single();

        if (!userData?.account_id) return;

        const { data: groupsData } = await supabase
          .from('venue_groups')
          .select(`
            *,
            venue_group_members (
              venue_id
            )
          `)
          .eq('account_id', userData.account_id)
          .order('name', { ascending: true });

        const transformedGroups = (groupsData || []).map(g => ({
          id: g.id,
          name: g.name,
          venueIds: g.venue_group_members?.map(m => m.venue_id) || []
        }));

        setVenueGroups(transformedGroups);
      } catch (error) {
        console.error('Error fetching venue groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchVenueGroups();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if all venues are selected
  const allSelected = selectedVenueIds.length === venues.length && venues.length > 0;

  // Get display label
  const getDisplayLabel = () => {
    if (allSelected || selectedVenueIds.length === 0) {
      return 'All Venues';
    }

    // Check if a group is selected (by tracking state, not computing)
    if (selectedGroupId) {
      const group = venueGroups.find(g => g.id === selectedGroupId);
      if (group) return group.name;
    }

    if (selectedVenueIds.length === 1) {
      const venue = venues.find(v => v.id === selectedVenueIds[0]);
      return venue?.name || 'Selected Venue';
    }
    return `${selectedVenueIds.length} Venues`;
  };

  // Handle selecting all venues
  const handleSelectAll = () => {
    setSelectedGroupId(null);
    onChange(venues.map(v => v.id));
    setIsOpen(false);
  };

  // Handle toggling a venue - multi-select within venues
  const handleToggleVenue = (venueId) => {
    // If a group is currently selected, clicking a venue starts fresh with just that venue
    if (selectedGroupId) {
      setSelectedGroupId(null);
      onChange([venueId]);
      return;
    }

    const isSelected = selectedVenueIds.includes(venueId);
    if (isSelected) {
      // Don't allow deselecting if it's the only one
      if (selectedVenueIds.length === 1) return;
      onChange(selectedVenueIds.filter(id => id !== venueId));
    } else {
      onChange([...selectedVenueIds, venueId]);
    }
  };

  // Handle selecting a venue group
  const handleSelectGroup = (group) => {
    setSelectedGroupId(group.id);
    onChange(group.venueIds);
    setIsOpen(false);
  };

  // Check if a group is currently selected (using explicit state tracking)
  const isGroupSelected = (group) => {
    return selectedGroupId === group.id;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[200px] px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 font-medium cursor-pointer flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="whitespace-nowrap">{getDisplayLabel()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[400px]">
          <div className="flex divide-x divide-gray-200 dark:divide-gray-700">
            {/* Left side - Individual Venues */}
            <div className="flex-1 min-w-[200px]">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Venues
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {/* All Venues option */}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`w-full px-4 py-2.5 text-sm text-left whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    allSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>All Venues</span>
                  </div>
                  {allSelected && <Check className="w-4 h-4" />}
                </button>

                {/* Individual venues - multi-select */}
                {venues.map((venue) => {
                  const isSelected = selectedVenueIds.includes(venue.id) && !selectedGroupId;
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => handleToggleVenue(venue.id)}
                      className={`w-full px-4 py-2.5 text-sm text-left whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{venue.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side - Venue Groups */}
            <div className="flex-1 min-w-[200px]">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Groups
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {loadingGroups ? (
                  <div className="px-4 py-6 text-center">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  </div>
                ) : venueGroups.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <FolderKanban className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No groups created yet
                    </p>
                  </div>
                ) : (
                  venueGroups.map((group) => {
                    const selected = isGroupSelected(group);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleSelectGroup(group)}
                        disabled={group.venueIds.length === 0}
                        className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                          selected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderKanban className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{group.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                            selected
                              ? 'bg-blue-100 dark:bg-blue-900/50'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            {group.venueIds.length}
                          </span>
                        </div>
                        {selected && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSelectorFilter;
