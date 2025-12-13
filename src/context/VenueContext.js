import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, logQuery } from '../utils/supabase';

const IS_DEV = process.env.NODE_ENV === 'development';
const VenueContext = createContext();
export const useVenue = () => useContext(VenueContext);

export const VenueProvider = ({ children }) => {
  // Legacy single venue state (kept for backward compatibility)
  const [venueId, setVenueId] = useState('');
  const [venueName, setVenueName] = useState('');

  // New multi-venue state
  const [selectedVenueIds, setSelectedVenueIds] = useState([]);
  const [isAllVenuesMode, setIsAllVenuesMode] = useState(false);

  const [allVenues, setAllVenues] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const isInitializingRef = useRef(false);

  // Helper function to initialize venue selection from localStorage or defaults
  const initializeVenueSelection = (venues) => {
    if (!venues || venues.length === 0) return;

    try {
      // Check if multi-venue selection is saved in localStorage
      const savedSelection = localStorage.getItem('chatters_venueSelection');

      if (savedSelection) {
        const parsed = JSON.parse(savedSelection);
        const { isAllVenues, venueIds } = parsed;

        if (isAllVenues) {
          // All Venues mode
          setIsAllVenuesMode(true);
          setSelectedVenueIds(venues.map(v => v.id));
          // Set first venue as primary for backward compatibility
          setVenueId(venues[0].id);
          setVenueName(venues[0].name);
        } else if (venueIds && Array.isArray(venueIds) && venueIds.length > 0) {
          // Validate saved venue IDs
          const validIds = venueIds.filter(id => venues.find(v => v.id === id));

          if (validIds.length > 0) {
            setIsAllVenuesMode(false);
            setSelectedVenueIds(validIds);
            // Set first selected venue as primary for backward compatibility
            const firstVenue = venues.find(v => v.id === validIds[0]);
            if (firstVenue) {
              setVenueId(firstVenue.id);
              setVenueName(firstVenue.name);
            }
          } else {
            // Saved IDs are invalid, fallback to default
            initializeDefaultSelection(venues);
          }
        } else {
          // Invalid saved data, fallback to default
          initializeDefaultSelection(venues);
        }
      } else {
        // No saved selection, use default behavior
        initializeDefaultSelection(venues);
      }
    } catch (error) {
      console.error('Error parsing venue selection from localStorage:', error);
      initializeDefaultSelection(venues);
    }
  };

  // Helper to initialize default venue selection
  const initializeDefaultSelection = (venues) => {
    if (venues.length === 1) {
      // Single venue: select it
      setIsAllVenuesMode(false);
      setSelectedVenueIds([venues[0].id]);
      setVenueId(venues[0].id);
      setVenueName(venues[0].name);
      localStorage.setItem('chatters_venueSelection', JSON.stringify({
        isAllVenues: false,
        venueIds: [venues[0].id]
      }));
    } else {
      // Multiple venues: default to "All Venues"
      setIsAllVenuesMode(true);
      setSelectedVenueIds(venues.map(v => v.id));
      setVenueId(venues[0].id); // Set first as primary for backward compatibility
      setVenueName(venues[0].name);
      localStorage.setItem('chatters_venueSelection', JSON.stringify({
        isAllVenues: true,
        venueIds: venues.map(v => v.id)
      }));
    }
  };

  useEffect(() => {
    if (initialized) return;

    const init = async (forceReload = false) => {
      // Prevent concurrent initialization using ref (synchronous check)
      if (isInitializingRef.current && !forceReload) {
        return;
      }

      isInitializingRef.current = true;
      const contextStartTime = IS_DEV ? performance.now() : 0;

      // If forcing reload, reset initialized flag
      if (forceReload) {
        setInitialized(false);
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return;
        }

        const userId = session.user.id;

        // Check for impersonation - admins can view any account
        const impersonationData = localStorage.getItem('impersonation');
        if (impersonationData) {
          const { accountId } = JSON.parse(impersonationData);

          // Admin users can query venues directly (RLS allows admin access)
          const impersonationResult = await logQuery(
            'venues:impersonation',
            supabase
              .from('venues')
              .select('id, name, address, phone, website')
              .eq('account_id', accountId)
              .order('name')
          );
          const venues = impersonationResult.data;
          const venueError = impersonationResult.error;

          if (!venueError && venues && venues.length > 0) {
            setUserRole('master'); // Impersonate as master
            setAllVenues(venues || []);

            // Initialize multi-venue selection
            initializeVenueSelection(venues);
            return;
          }
        }

        const userResult = await logQuery(
          'users:fetch_role',
          supabase
            .from('users')
            .select('id, role, account_id')
            .eq('id', userId)
            .single()
        );
        const userRow = userResult.data;
        const userFetchError = userResult.error;

        if (userFetchError || !userRow) {
          return;
        }

        const role = userRow.role;
        const accountId = userRow.account_id ?? null;
        setUserRole(role);

        // Admins should not load VenueContext at all; bail out
        if (role === 'admin') {
          return;
        }

        // MASTER: require account_id; otherwise fallback via staff membership
        if (role === 'master') {
          if (!accountId) {
            const staffResult = await logQuery(
              'staff:master_fallback',
              supabase
                .from('staff')
                .select('venue_id, venues!inner(id, name)')
                .eq('user_id', userId)
                .limit(1)
                .single()
            );
            const staffRow = staffResult.data;
            const staffErr = staffResult.error;

            if (staffErr || !staffRow?.venues?.id) {
              setAllVenues([]);
              return;
            }

            setAllVenues([{ id: staffRow.venues.id, name: staffRow.venues.name }]);
            setVenueId(staffRow.venues.id);
            setVenueName(staffRow.venues.name);
            localStorage.setItem('chatters_currentVenueId', staffRow.venues.id);
            return;
          }

          const venuesResult = await logQuery(
            'venues:master',
            supabase
              .from('venues')
              .select('id, name, address, phone, website')
              .eq('account_id', accountId)
          );
          const venues = venuesResult.data;
          const venueError = venuesResult.error;

          if (venueError) {
            return;
          }

          setAllVenues(venues || []);

          // Initialize multi-venue selection
          initializeVenueSelection(venues);
          return;
        }

        // MANAGER: resolve via staff membership
        if (role === 'manager') {
          const staffResult = await logQuery(
            'staff:manager',
            supabase
              .from('staff')
              .select(`
                venue_id,
                venues!inner (
                  id,
                  name,
                  account_id
                )
              `)
              .eq('user_id', userId)
          );
          const staffRows = staffResult.data;
          const staffError = staffResult.error;

          if (staffError) {
            return;
          }

          if (!staffRows || staffRows.length === 0) {
            setAllVenues([]);
            return;
          }

          // If we know accountId, constrain client-side
          const filtered = accountId
            ? staffRows.filter(r => r.venues?.account_id === accountId)
            : staffRows;

          const userVenues = filtered
            .map(row => ({ id: row.venues?.id, name: row.venues?.name }))
            .filter(v => !!v?.id);

          const uniqueVenues = userVenues.filter(
            (venue, idx, arr) => arr.findIndex(v => v.id === venue.id) === idx
          );

          setAllVenues(uniqueVenues);

          // Initialize multi-venue selection
          initializeVenueSelection(uniqueVenues);
          return;
        }

        // UNKNOWN ROLE: conservative staff fallback
        const staffFallbackResult = await logQuery(
          'staff:unknown_role_fallback',
          supabase
            .from('staff')
            .select('venue_id, venues!inner(id, name)')
            .eq('user_id', userId)
            .limit(1)
            .single()
        );
        const staffRow = staffFallbackResult.data;
        const staffErr = staffFallbackResult.error;

        if (staffErr || !staffRow?.venues?.id) {
          setAllVenues([]);
          return;
        }

        setAllVenues([{ id: staffRow.venues.id, name: staffRow.venues.name }]);
        setVenueId(staffRow.venues.id);
        setVenueName(staffRow.venues.name);
        localStorage.setItem('chatters_currentVenueId', staffRow.venues.id);
      } catch (error) {
        // Silently handle initialization errors
      } finally {
        setLoading(false);
        setInitialized(true);
        isInitializingRef.current = false;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && !initialized) {
          setTimeout(() => { init(); }, 100);
        }

        if (event === 'SIGNED_OUT') {
          setVenueId('');
          setVenueName('');
          setAllVenues([]);
          setUserRole(null);
          setInitialized(false);
          setLoading(false);
        }
      }
    );

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        init();
      } else {
        setLoading(false);
      }
    })();

    // Listen for impersonation changes
    const handleImpersonationChange = () => {
      setInitialized(false);
      setLoading(true);
      init(true);
    };

    window.addEventListener('impersonationChanged', handleImpersonationChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('impersonationChanged', handleImpersonationChange);
    };
  }, [initialized]);

  // Legacy function: sets a single venue (also updates multi-venue state)
  const setCurrentVenue = (id) => {
    const found = allVenues.find(v => v.id === id);
    if (!found) return;

    // Update legacy single-venue state
    setVenueId(found.id);
    setVenueName(found.name);
    localStorage.setItem('chatters_currentVenueId', found.id);

    // Update multi-venue state
    setIsAllVenuesMode(false);
    setSelectedVenueIds([found.id]);
    localStorage.setItem('chatters_venueSelection', JSON.stringify({
      isAllVenues: false,
      venueIds: [found.id]
    }));
  };

  // New function: update multi-venue selection
  const updateVenueSelection = (venueIds, allVenuesMode = false) => {
    if (!venueIds || venueIds.length === 0) return;

    // Validate venue IDs
    const validIds = venueIds.filter(id => allVenues.find(v => v.id === id));
    if (validIds.length === 0) return;

    // If all venues are selected, switch to "All Venues" mode
    const shouldBeAllVenues = allVenuesMode || validIds.length === allVenues.length;

    setIsAllVenuesMode(shouldBeAllVenues);
    setSelectedVenueIds(validIds);

    // Update primary venue for backward compatibility (first selected)
    const firstVenue = allVenues.find(v => v.id === validIds[0]);
    if (firstVenue) {
      setVenueId(firstVenue.id);
      setVenueName(firstVenue.name);
    }

    // Save to localStorage
    localStorage.setItem('chatters_venueSelection', JSON.stringify({
      isAllVenues: shouldBeAllVenues,
      venueIds: validIds
    }));
  };

  return (
    <VenueContext.Provider
      value={{
        // Legacy single-venue values (kept for backward compatibility)
        venueId,
        venueName,
        setCurrentVenue,

        // New multi-venue values
        selectedVenueIds,
        isAllVenuesMode,
        updateVenueSelection,

        // Common values
        allVenues,
        userRole,
        loading,
      }}
    >
      {children}
    </VenueContext.Provider>
  );
};