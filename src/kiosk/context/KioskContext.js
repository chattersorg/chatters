import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const KioskContext = createContext(null);

// Storage keys for persistent device config
const STORAGE_KEYS = {
  DEVICE_ID: 'kiosk_device_id',
  VENUE_ID: 'kiosk_venue_id',
  VENUE_NAME: 'kiosk_venue_name',
  PAIRED_AT: 'kiosk_paired_at',
};

export const KioskProvider = ({ children }) => {
  const [isPaired, setIsPaired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [venueId, setVenueId] = useState(null);
  const [venueName, setVenueName] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [venueConfig, setVenueConfig] = useState(null);
  const [error, setError] = useState(null);

  // Check for existing pairing on mount
  useEffect(() => {
    checkExistingPairing();
  }, []);

  const checkExistingPairing = async () => {
    try {
      setIsLoading(true);

      const storedVenueId = localStorage.getItem(STORAGE_KEYS.VENUE_ID);
      const storedDeviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      const storedVenueName = localStorage.getItem(STORAGE_KEYS.VENUE_NAME);

      if (storedVenueId && storedDeviceId) {
        // Verify the venue still exists and is active
        const { data: venue, error: venueError } = await supabase
          .from('venues')
          .select('id, name, account_id')
          .eq('id', storedVenueId)
          .single();

        if (venueError || !venue) {
          // Venue no longer exists, clear pairing
          clearPairing();
          return;
        }

        // Check account is still active
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id, is_paid, trial_ends_at')
          .eq('id', venue.account_id)
          .single();

        if (accountError || !account) {
          clearPairing();
          return;
        }

        // Check if account is valid (paid or trial not expired)
        const isValidAccount = account.is_paid ||
          (account.trial_ends_at && new Date(account.trial_ends_at) > new Date());

        if (!isValidAccount) {
          setError('Account subscription has expired');
          clearPairing();
          return;
        }

        // Load venue configuration
        await loadVenueConfig(storedVenueId);

        setVenueId(storedVenueId);
        setVenueName(storedVenueName || venue.name);
        setDeviceId(storedDeviceId);
        setIsPaired(true);
      }
    } catch (err) {
      console.error('Error checking existing pairing:', err);
      setError('Failed to verify device pairing');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVenueConfig = async (venueId) => {
    try {
      // Load venue-specific settings for kiosk
      const { data: venue, error } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          logo_url,
          primary_color,
          account_id,
          accounts (
            name,
            logo_url
          )
        `)
        .eq('id', venueId)
        .single();

      if (error) throw error;

      setVenueConfig({
        venueName: venue.name,
        logoUrl: venue.logo_url || venue.accounts?.logo_url,
        primaryColor: venue.primary_color || '#000000',
        accountName: venue.accounts?.name,
      });
    } catch (err) {
      console.error('Error loading venue config:', err);
    }
  };

  const pairDevice = async (pairingCode) => {
    try {
      setIsLoading(true);
      setError(null);

      // Look up the pairing code
      const { data: pairing, error: pairingError } = await supabase
        .from('kiosk_pairings')
        .select(`
          id,
          venue_id,
          code,
          expires_at,
          used_at,
          venues (
            id,
            name,
            account_id
          )
        `)
        .eq('code', pairingCode.toUpperCase())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (pairingError || !pairing) {
        throw new Error('Invalid or expired pairing code');
      }

      // Generate a unique device ID
      const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Mark the pairing code as used
      const { error: updateError } = await supabase
        .from('kiosk_pairings')
        .update({
          used_at: new Date().toISOString(),
          device_id: newDeviceId,
        })
        .eq('id', pairing.id);

      if (updateError) throw updateError;

      // Store pairing info locally
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newDeviceId);
      localStorage.setItem(STORAGE_KEYS.VENUE_ID, pairing.venue_id);
      localStorage.setItem(STORAGE_KEYS.VENUE_NAME, pairing.venues.name);
      localStorage.setItem(STORAGE_KEYS.PAIRED_AT, new Date().toISOString());

      // Load venue config
      await loadVenueConfig(pairing.venue_id);

      setDeviceId(newDeviceId);
      setVenueId(pairing.venue_id);
      setVenueName(pairing.venues.name);
      setIsPaired(true);

      return { success: true };
    } catch (err) {
      console.error('Error pairing device:', err);
      setError(err.message || 'Failed to pair device');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const clearPairing = () => {
    localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.VENUE_ID);
    localStorage.removeItem(STORAGE_KEYS.VENUE_NAME);
    localStorage.removeItem(STORAGE_KEYS.PAIRED_AT);

    setDeviceId(null);
    setVenueId(null);
    setVenueName(null);
    setVenueConfig(null);
    setIsPaired(false);
    setError(null);
  };

  const value = {
    // State
    isPaired,
    isLoading,
    venueId,
    venueName,
    deviceId,
    venueConfig,
    error,

    // Actions
    pairDevice,
    clearPairing,
    refreshConfig: () => venueId && loadVenueConfig(venueId),
  };

  return (
    <KioskContext.Provider value={value}>
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
};

export default KioskContext;
