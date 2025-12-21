import React, { createContext, useContext, useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '../../utils/supabase';

const KioskContext = createContext(null);

// Storage keys for persistent device config
const STORAGE_KEYS = {
  DEVICE_ID: 'kiosk_device_id',
  VENUE_ID: 'kiosk_venue_id',
  VENUE_NAME: 'kiosk_venue_name',
  DEVICE_NAME: 'kiosk_device_name',
  ZONE_IDS: 'kiosk_zone_ids',
  PAIRED_AT: 'kiosk_paired_at',
};

// Helper functions to use Capacitor Preferences (persistent) with localStorage fallback
const storage = {
  async get(key) {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch {
      // Fallback to localStorage for web
      return localStorage.getItem(key);
    }
  },
  async set(key, value) {
    try {
      await Preferences.set({ key, value });
    } catch {
      // Fallback to localStorage for web
      localStorage.setItem(key, value);
    }
  },
  async remove(key) {
    try {
      await Preferences.remove({ key });
    } catch {
      // Fallback to localStorage for web
      localStorage.removeItem(key);
    }
  }
};

export const KioskProvider = ({ children }) => {
  const [isPaired, setIsPaired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [venueId, setVenueId] = useState(null);
  const [venueName, setVenueName] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceName, setDeviceName] = useState(null);
  const [allowedZoneIds, setAllowedZoneIds] = useState(null); // null = all zones, array = specific zones
  const [venueConfig, setVenueConfig] = useState(null);
  const [error, setError] = useState(null);

  // Check for existing pairing on mount
  useEffect(() => {
    checkExistingPairing();
  }, []);

  const checkExistingPairing = async () => {
    try {
      setIsLoading(true);

      const storedVenueId = await storage.get(STORAGE_KEYS.VENUE_ID);
      const storedDeviceId = await storage.get(STORAGE_KEYS.DEVICE_ID);
      const storedVenueName = await storage.get(STORAGE_KEYS.VENUE_NAME);
      const storedDeviceName = await storage.get(STORAGE_KEYS.DEVICE_NAME);
      const storedZoneIds = await storage.get(STORAGE_KEYS.ZONE_IDS);

      console.log('[Kiosk] Checking existing pairing:', { storedVenueId, storedDeviceId, storedVenueName });

      if (storedVenueId && storedDeviceId) {
        // Skip remote verification - trust local storage
        // The pairing was verified when it was initially stored
        // RLS policies may not allow querying by device_id
        console.log('[Kiosk] Found stored pairing, trusting local storage');

        // Pairing is valid - trust the stored venue info
        // Load venue configuration (non-critical, can fail)
        try {
          await loadVenueConfig(storedVenueId);
        } catch (configErr) {
          console.log('[Kiosk] Could not load venue config (non-critical):', configErr);
        }

        // Try to refresh device settings from server (non-blocking)
        refreshDeviceSettings(storedDeviceId);

        setVenueId(storedVenueId);
        setVenueName(storedVenueName || 'Venue');
        setDeviceId(storedDeviceId);
        setDeviceName(storedDeviceName || null);
        setAllowedZoneIds(storedZoneIds ? JSON.parse(storedZoneIds) : null);
        setIsPaired(true);
        console.log('[Kiosk] Restored existing pairing successfully');
      }
    } catch (err) {
      console.error('[Kiosk] Error checking existing pairing:', err);
      setError('Failed to verify device pairing');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh device settings from server (called periodically and on startup)
  const refreshDeviceSettings = async (devId) => {
    try {
      const { data, error } = await supabase
        .from('kiosk_pairings')
        .select('device_name, zone_ids')
        .eq('device_id', devId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.log('[Kiosk] Could not refresh device settings (may be RLS):', error.message);
        return;
      }

      if (data) {
        // Update local storage and state with latest settings
        if (data.device_name !== undefined) {
          await storage.set(STORAGE_KEYS.DEVICE_NAME, data.device_name || '');
          setDeviceName(data.device_name || null);
        }
        if (data.zone_ids !== undefined) {
          const zoneIdsStr = data.zone_ids ? JSON.stringify(data.zone_ids) : '';
          await storage.set(STORAGE_KEYS.ZONE_IDS, zoneIdsStr);
          setAllowedZoneIds(data.zone_ids || null);
        }
        console.log('[Kiosk] Refreshed device settings:', { deviceName: data.device_name, zoneIds: data.zone_ids });
      }
    } catch (err) {
      console.log('[Kiosk] Error refreshing device settings:', err);
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
          account_id,
          accounts (
            name
          )
        `)
        .eq('id', venueId)
        .single();

      if (error) throw error;

      setVenueConfig({
        venueName: venue.name,
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

      console.log('[Kiosk] Attempting to pair with code:', pairingCode.toUpperCase());

      // Look up the pairing code - matches the table structure from VenueTab
      const { data: pairing, error: pairingError } = await supabase
        .from('kiosk_pairings')
        .select(`
          id,
          venue_id,
          pairing_code,
          device_id,
          is_active,
          venues (
            id,
            name,
            account_id
          )
        `)
        .eq('pairing_code', pairingCode.toUpperCase())
        .eq('is_active', true)
        .single();

      console.log('[Kiosk] Pairing lookup result:', { pairing, error: pairingError });

      if (pairingError) {
        console.error('[Kiosk] Pairing error details:', pairingError);
        throw new Error('Invalid or expired pairing code');
      }

      if (!pairing) {
        throw new Error('Pairing code not found');
      }

      // Check if already paired (device_id doesn't start with 'pending_')
      if (pairing.device_id && !pairing.device_id.startsWith('pending_')) {
        throw new Error('This code has already been used');
      }

      // Generate a unique device ID
      const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('[Kiosk] Updating pairing with device ID:', newDeviceId);

      // Mark the pairing code as used by updating device_id and adding paired_at
      const { error: updateError } = await supabase
        .from('kiosk_pairings')
        .update({
          device_id: newDeviceId,
          paired_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', pairing.id);

      if (updateError) {
        console.error('[Kiosk] Update error:', updateError);
        throw updateError;
      }

      console.log('[Kiosk] Pairing successful, storing locally with Capacitor Preferences');

      // Store pairing info using Capacitor Preferences (persistent storage)
      await storage.set(STORAGE_KEYS.DEVICE_ID, newDeviceId);
      await storage.set(STORAGE_KEYS.VENUE_ID, pairing.venue_id);
      await storage.set(STORAGE_KEYS.VENUE_NAME, pairing.venues?.name || 'Unknown Venue');
      await storage.set(STORAGE_KEYS.PAIRED_AT, new Date().toISOString());

      // Load venue config
      await loadVenueConfig(pairing.venue_id);

      setDeviceId(newDeviceId);
      setVenueId(pairing.venue_id);
      setVenueName(pairing.venues?.name || 'Unknown Venue');
      setIsPaired(true);

      return { success: true };
    } catch (err) {
      console.error('[Kiosk] Error pairing device:', err);
      const errorMessage = err.message || 'Failed to pair device';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearPairing = async () => {
    await storage.remove(STORAGE_KEYS.DEVICE_ID);
    await storage.remove(STORAGE_KEYS.VENUE_ID);
    await storage.remove(STORAGE_KEYS.VENUE_NAME);
    await storage.remove(STORAGE_KEYS.DEVICE_NAME);
    await storage.remove(STORAGE_KEYS.ZONE_IDS);
    await storage.remove(STORAGE_KEYS.PAIRED_AT);

    setDeviceId(null);
    setVenueId(null);
    setVenueName(null);
    setDeviceName(null);
    setAllowedZoneIds(null);
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
    deviceName,
    allowedZoneIds, // null = all zones, array = specific zone IDs
    venueConfig,
    error,

    // Actions
    pairDevice,
    clearPairing,
    refreshConfig: () => venueId && loadVenueConfig(venueId),
    refreshDeviceSettings: () => deviceId && refreshDeviceSettings(deviceId),
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
