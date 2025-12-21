import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { supabase } from '../../../utils/supabase';
import { PermissionGate } from '../../../context/PermissionsContext';
import { GripVertical, Plus, Trash2, ExternalLink, Eye, EyeOff, Link, FileText, Utensils, ChevronDown, ChevronUp, Upload, X, Tablet, Copy, Check, Loader2, AlertCircle, Settings, MapPin } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import FilterSelect from '../../ui/FilterSelect';

// Generate a random 6-character pairing code
const generatePairingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'RO', name: 'Romania' }
];

const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași', 'Caraș-Severin',
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș',
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Sălaj', 'Satu Mare',
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vâlcea', 'Vaslui', 'Vrancea'
];

const VenueTab = ({
  name, setName,
  address, setAddress,
  phone, setPhone,
  website, setWebsite,
  country, setCountry,
  saveSettings,
  loading,
  message,
  venueId
}) => {
  // Custom Links state
  const [links, setLinks] = useState([]);
  const [savingLinks, setSavingLinks] = useState(false);
  const [linksMessage, setLinksMessage] = useState({ type: '', text: '' });
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Menu settings state
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [menuType, setMenuType] = useState('none');
  const [menuUrl, setMenuUrl] = useState('');
  const [menuPdfUrl, setMenuPdfUrl] = useState('');
  const [menuCurrency, setMenuCurrency] = useState('GBP');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const navigate = useNavigate();

  // Kiosk devices state
  const [kioskDevices, setKioskDevices] = useState([]);
  const [kioskLoading, setKioskLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [newPairingCode, setNewPairingCode] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [kioskError, setKioskError] = useState(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceFormName, setDeviceFormName] = useState('');
  const [deviceFormZones, setDeviceFormZones] = useState([]);
  const [savingDevice, setSavingDevice] = useState(false);
  const [zones, setZones] = useState([]);

  const CURRENCY_OPTIONS = [
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  ];

  const defaultLinkTemplates = [
    { id: 'order', label: 'Order Food', url: '', enabled: false },
    { id: 'pay', label: 'Pay Your Bill', url: '', enabled: false },
    { id: 'book', label: 'Book a Table', url: '', enabled: false }
  ];

  const getDefaultLinks = () => defaultLinkTemplates.map((link, index) => ({
    ...link,
    order: index + 1
  }));

  // Get default links that are not already in the list
  const getAvailableDefaultLinks = () => {
    const existingIds = links.map(l => l.id);
    return defaultLinkTemplates.filter(link => !existingIds.includes(link.id));
  };

  const addDefaultLink = (linkTemplate) => {
    const newLink = {
      ...linkTemplate,
      order: links.length + 1
    };
    setLinks([...links, newLink]);
    setShowAddMenu(false);
  };

  const loadVenueData = useCallback(async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('custom_links, menu_type, menu_url, menu_pdf_url, menu_currency')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error loading venue data:', error);
      return;
    }

    // Load custom links (excluding the old 'menu' link which we now handle separately)
    const customLinks = (data?.custom_links || []).filter(link => link.id !== 'menu');
    // If no custom_links field exists (null), use defaults. If empty array, keep empty (user deleted all)
    setLinks(data?.custom_links === null || data?.custom_links === undefined ? getDefaultLinks() : customLinks);

    // Load menu settings
    setMenuType(data?.menu_type || 'none');
    setMenuUrl(data?.menu_url || '');
    setMenuPdfUrl(data?.menu_pdf_url || '');
    setMenuCurrency(data?.menu_currency || 'GBP');
  }, [venueId]);

  useEffect(() => {
    if (venueId) {
      loadVenueData();
    }
  }, [venueId, loadVenueData]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reordered = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setLinks(reordered);
  };

  const updateLink = (id, field, value) => {
    setLinks(links.map(link =>
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const toggleEnabled = (id) => {
    setLinks(links.map(link =>
      link.id === id ? { ...link, enabled: !link.enabled } : link
    ));
  };

  const addCustomLink = () => {
    const newLink = {
      id: `custom-${Date.now()}`,
      label: 'Custom Link',
      url: '',
      enabled: false,
      order: links.length + 1
    };
    setLinks([...links, newLink]);
  };

  const deleteLink = (id) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setLinksMessage({ type: 'error', text: 'Please upload a PDF file' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLinksMessage({ type: 'error', text: 'File size must be less than 10MB' });
      return;
    }

    setUploadingPdf(true);
    setLinksMessage({ type: '', text: '' });

    try {
      const fileName = `${venueId}/menus/menu-${Date.now()}.pdf`;

      const { error } = await supabase.storage
        .from('venue-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('venue-assets')
        .getPublicUrl(fileName);

      setMenuPdfUrl(publicUrl);
      setLinksMessage({ type: 'success', text: 'PDF uploaded successfully!' });
      setTimeout(() => setLinksMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setLinksMessage({ type: 'error', text: 'Failed to upload PDF. Make sure the storage bucket exists.' });
    } finally {
      setUploadingPdf(false);
    }
  };

  const removePdf = async () => {
    if (!menuPdfUrl) return;

    try {
      const urlParts = menuPdfUrl.split('/venue-assets/');
      if (urlParts[1]) {
        await supabase.storage
          .from('venue-assets')
          .remove([urlParts[1]]);
      }
      setMenuPdfUrl('');
    } catch (error) {
      console.error('Error removing PDF:', error);
    }
  };

  const saveLinks = async () => {
    setSavingLinks(true);
    setLinksMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('venues')
      .update({
        custom_links: links,
        menu_type: menuType,
        menu_url: menuType === 'link' ? menuUrl : null,
        menu_pdf_url: menuType === 'pdf' ? menuPdfUrl : null,
        menu_currency: menuCurrency
      })
      .eq('id', venueId);

    setSavingLinks(false);

    if (error) {
      setLinksMessage({ type: 'error', text: 'Failed to save changes' });
      console.error('Error saving:', error);
    } else {
      setLinksMessage({ type: 'success', text: 'Changes saved successfully!' });
      setTimeout(() => setLinksMessage({ type: '', text: '' }), 3000);
    }
  };

  const isMenuEnabled = menuType !== 'none';

  // Fetch zones for the venue
  const fetchZones = useCallback(async () => {
    if (!venueId) return;

    try {
      const { data, error } = await supabase
        .from('zones')
        .select('id, name')
        .eq('venue_id', venueId)
        .order('order');

      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error('Error fetching zones:', err);
    }
  }, [venueId]);

  // Kiosk device functions
  const fetchKioskDevices = useCallback(async () => {
    if (!venueId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('kiosk_pairings')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setKioskDevices(data || []);
    } catch (err) {
      console.error('Error fetching kiosk devices:', err);
      setKioskError('Failed to load devices');
    } finally {
      setKioskLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchKioskDevices();
    fetchZones();
  }, [fetchKioskDevices, fetchZones]);

  const handleGeneratePairingCode = async () => {
    if (!venueId) return;

    setGeneratingCode(true);
    setKioskError(null);

    try {
      const code = generatePairingCode();

      const { error: insertError } = await supabase
        .from('kiosk_pairings')
        .insert({
          venue_id: venueId,
          pairing_code: code,
          device_id: `pending_${Date.now()}`,
          is_active: true,
        });

      if (insertError) throw insertError;

      setNewPairingCode(code);
      fetchKioskDevices();
    } catch (err) {
      console.error('Error generating pairing code:', err);
      setKioskError('Failed to generate code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyPairingCode = async () => {
    if (!newPairingCode) return;

    try {
      await navigator.clipboard.writeText(newPairingCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeleteKioskDevice = async (deviceId) => {
    setDeletingDeviceId(deviceId);

    try {
      const { error: deleteError } = await supabase
        .from('kiosk_pairings')
        .update({ is_active: false })
        .eq('id', deviceId);

      if (deleteError) throw deleteError;

      setKioskDevices(kioskDevices.filter(d => d.id !== deviceId));
    } catch (err) {
      console.error('Error deleting device:', err);
      setKioskError('Failed to remove device');
    } finally {
      setDeletingDeviceId(null);
    }
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setDeviceFormName(device.device_name || '');
    setDeviceFormZones(device.zone_ids || []);
  };

  const handleSaveDevice = async () => {
    if (!editingDevice) return;

    setSavingDevice(true);

    try {
      const { error: updateError } = await supabase
        .from('kiosk_pairings')
        .update({
          device_name: deviceFormName || null,
          zone_ids: deviceFormZones.length > 0 ? deviceFormZones : null,
        })
        .eq('id', editingDevice.id);

      if (updateError) throw updateError;

      // Update local state
      setKioskDevices(kioskDevices.map(d =>
        d.id === editingDevice.id
          ? { ...d, device_name: deviceFormName || null, zone_ids: deviceFormZones.length > 0 ? deviceFormZones : null }
          : d
      ));

      setEditingDevice(null);
    } catch (err) {
      console.error('Error saving device:', err);
      setKioskError('Failed to save device settings');
    } finally {
      setSavingDevice(false);
    }
  };

  const toggleDeviceZone = (zoneId) => {
    setDeviceFormZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const formatKioskDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isDevicePending = (device) => {
    return device.device_id?.startsWith('pending_');
  };

  return (
    <div className="w-full">

      <div className="space-y-6">

        {/* Section 1: Basic Information Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Venue name, address, and location details</p>
          </div>

          {/* Section Content */}
          <div className="p-6 space-y-6">
            {/* Venue Name */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Venue Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">The name customers will see</p>
              </div>
              <div className="lg:col-span-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Enter your venue name"
                />
              </div>
            </div>

            {/* Country */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Country where your venue is located</p>
              </div>
              <div className="lg:col-span-2">
                <FilterSelect
                  value={country || 'GB'}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    // Clear county when switching away from Romania
                    if (e.target.value !== 'RO') {
                      setAddress({...address, county: ''});
                    }
                  }}
                  options={COUNTRIES.map(c => ({
                    value: c.code,
                    label: c.name
                  }))}
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Physical location of your venue</p>
              </div>
              <div className="lg:col-span-2 space-y-3">
                <input
                  type="text"
                  placeholder={country === 'RO' ? 'Strada (Street)' : 'Address Line 1'}
                  value={address.line1}
                  onChange={(e) => setAddress({...address, line1: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder={country === 'RO' ? 'Nr., Bloc, Scara, Apt (Optional)' : 'Address Line 2 (Optional)'}
                  value={address.line2}
                  onChange={(e) => setAddress({...address, line2: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder={country === 'RO' ? 'Oraș (City)' : 'City'}
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <input
                    type="text"
                    placeholder={country === 'RO' ? 'Cod Poștal' : 'Postal Code'}
                    value={address.postalCode}
                    onChange={(e) => setAddress({...address, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                {/* County field - different for Romania vs UK */}
                {country === 'RO' ? (
                  <select
                    value={address.county || ''}
                    onChange={(e) => setAddress({...address, county: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Județ (County)</option>
                    {ROMANIAN_COUNTIES.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="County (Optional)"
                    value={address.county || ''}
                    onChange={(e) => setAddress({...address, county: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contact number for your venue</p>
              </div>
              <div className="lg:col-span-2">
                <input
                  type="tel"
                  value={phone || ''}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 1234 567890"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Website */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your venue's web URL</p>
              </div>
              <div className="lg:col-span-2">
                <input
                  type="url"
                  value={website || ''}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.yourvenue.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Card Save Action */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Changes are saved per venue
              </div>
              <PermissionGate permission="venue.edit">
                <Button
                  variant="primary"
                  onClick={saveSettings}
                  loading={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </PermissionGate>
            </div>
            {message && (
              <div className={`text-xs p-2 rounded-lg mt-3 ${
                message.includes('success')
                  ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Menu & Links Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Menu & Action Links</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a central hub for all customer interactions</p>
          </div>

          {/* Section Content */}
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Make Chatters Your Central Hub</h4>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Add your menu and links to ordering, payment, and booking systems. Customers will see these options before leaving feedback,
                making your Chatters QR code the single entry point for all customer interactions.
              </p>
            </div>

            {/* Menu Configuration - Special Card */}
            <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setMenuExpanded(!menuExpanded)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">View Menu</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {menuType === 'none' && 'Not configured'}
                    {menuType === 'link' && 'External link'}
                    {menuType === 'pdf' && 'PDF upload'}
                    {menuType === 'builder' && 'Built in Chatters'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    isMenuEnabled
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>
                    {isMenuEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {menuExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {menuExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-4 space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">How do you want to display your menu?</p>

                    {/* Option: None */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      menuType === 'none' ? 'border-gray-900 dark:border-gray-300 bg-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                    }`}>
                      <input
                        type="radio"
                        name="menuType"
                        value="none"
                        checked={menuType === 'none'}
                        onChange={() => setMenuType('none')}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Don't show menu</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hide the menu option from customers</p>
                      </div>
                    </label>

                    {/* Option: External Link */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      menuType === 'link' ? 'border-gray-900 dark:border-gray-300 bg-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                    }`}>
                      <input
                        type="radio"
                        name="menuType"
                        value="link"
                        checked={menuType === 'link'}
                        onChange={() => setMenuType('link')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">Link to external menu</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Point to your existing online menu</p>
                        {menuType === 'link' && (
                          <input
                            type="url"
                            value={menuUrl}
                            onChange={(e) => setMenuUrl(e.target.value)}
                            placeholder="https://example.com/menu"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </label>

                    {/* Option: PDF Upload */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      menuType === 'pdf' ? 'border-gray-900 dark:border-gray-300 bg-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                    }`}>
                      <input
                        type="radio"
                        name="menuType"
                        value="pdf"
                        checked={menuType === 'pdf'}
                        onChange={() => setMenuType('pdf')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">Upload a PDF</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">We'll host and optimise it for mobile</p>
                        {menuType === 'pdf' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {menuPdfUrl ? (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <FileText className="w-5 h-5 text-red-500" />
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                  Menu PDF uploaded
                                </span>
                                <a
                                  href={menuPdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                  View
                                </a>
                                <button
                                  onClick={removePdf}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {uploadingPdf ? 'Uploading...' : 'Click to upload PDF (max 10MB)'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={handlePdfUpload}
                                  disabled={uploadingPdf}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Option: Menu Builder */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      menuType === 'builder' ? 'border-gray-900 dark:border-gray-300 bg-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                    }`}>
                      <input
                        type="radio"
                        name="menuType"
                        value="builder"
                        checked={menuType === 'builder'}
                        onChange={() => setMenuType('builder')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">Build menu in Chatters</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Create categories, items, prices & dietary tags</p>
                        {menuType === 'builder' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/venue-settings/menu-builder');
                            }}
                            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                          >
                            Open Menu Builder →
                          </button>
                        )}
                      </div>
                    </label>

                    {/* Currency Selection - only show when menu is enabled */}
                    {menuType !== 'none' && (
                      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Menu Currency
                        </label>
                        <select
                          value={menuCurrency}
                          onChange={(e) => setMenuCurrency(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          {CURRENCY_OPTIONS.map(currency => (
                            <option key={currency.code} value={currency.code}>
                              {currency.symbol} - {currency.name} ({currency.code})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Currency symbol shown on your menu prices
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Other Action Links Header */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Action Links</h4>
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showAddMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAddMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                      {getAvailableDefaultLinks().map((link) => (
                        <button
                          key={link.id}
                          onClick={() => addDefaultLink(link)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {link.label}
                        </button>
                      ))}
                      {getAvailableDefaultLinks().length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                      )}
                      <button
                        onClick={() => {
                          addCustomLink();
                          setShowAddMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Custom Link
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Draggable Links List */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="links">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {links.map((link, index) => (
                      <Draggable key={link.id} draggableId={link.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-gray-50 dark:bg-gray-800 border rounded-lg p-4 ${
                              snapshot.isDragging ? 'shadow-lg' : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    value={link.label}
                                    onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                                    placeholder="Button Label"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                  />
                                  <button
                                    onClick={() => toggleEnabled(link.id)}
                                    className={`p-2 rounded-md ${
                                      link.enabled
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500'
                                    }`}
                                    title={link.enabled ? 'Enabled' : 'Disabled'}
                                  >
                                    {link.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => deleteLink(link.id)}
                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                    title="Remove link"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    value={link.url}
                                    onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                                    placeholder="https://example.com/your-venue"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                  />
                                  {link.url && (
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                      title="Test link"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {links.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Link className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">No action links configured</p>
                        <p className="text-xs mt-1">Click "Add Link" to add links for ordering, payments, bookings, or custom actions</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Card Save Action */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Changes are saved per venue
              </div>
              <PermissionGate permission="venue.edit">
                <Button
                  variant="primary"
                  onClick={saveLinks}
                  loading={savingLinks}
                >
                  {savingLinks ? 'Saving...' : 'Save'}
                </Button>
              </PermissionGate>
            </div>
            {linksMessage.text && (
              <div
                className={`text-xs p-2 rounded-lg mt-3 ${
                  linksMessage.type === 'success'
                    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                {linksMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Kiosk Devices Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Kiosk Devices</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pair tablets to collect feedback at your venue</p>
          </div>

          {/* Section Content */}
          <div className="p-6">
            {kioskLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading devices...</span>
              </div>
            ) : (
              <>
                {/* Generate Code Button */}
                <div className="mb-6">
                  <button
                    onClick={handleGeneratePairingCode}
                    disabled={generatingCode}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {generatingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Generate Pairing Code
                  </button>
                </div>

                {/* New Code Display */}
                {newPairingCode && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                      Enter this code on your tablet to pair it:
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="text-2xl font-mono font-bold tracking-widest text-green-900 dark:text-green-100">
                        {newPairingCode}
                      </code>
                      <button
                        onClick={handleCopyPairingCode}
                        className="p-2 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
                        title="Copy code"
                      >
                        {codeCopied ? (
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Code expires in 15 minutes if not used
                    </p>
                  </div>
                )}

                {kioskError && (
                  <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-800 dark:text-red-300">{kioskError}</span>
                  </div>
                )}

                {/* Devices List */}
                {kioskDevices.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <Tablet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-1">No kiosk devices paired</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Generate a pairing code to connect a tablet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kioskDevices.map((device) => {
                      const deviceZoneNames = device.zone_ids?.length > 0
                        ? zones.filter(z => device.zone_ids.includes(z.id)).map(z => z.name)
                        : [];

                      return (
                        <div
                          key={device.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            isDevicePending(device)
                              ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isDevicePending(device)
                                ? 'bg-yellow-100 dark:bg-yellow-800'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}>
                              <Tablet className={`w-5 h-5 ${
                                isDevicePending(device)
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                            </div>
                            <div>
                              {isDevicePending(device) ? (
                                <>
                                  <p className="font-medium text-yellow-800 dark:text-yellow-300">
                                    Awaiting pairing...
                                  </p>
                                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                    Code: <span className="font-mono">{device.pairing_code}</span>
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {device.device_name || 'Kiosk Device'}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    {deviceZoneNames.length > 0 ? (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {deviceZoneNames.join(', ')}
                                      </span>
                                    ) : (
                                      <span>All zones</span>
                                    )}
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span>Paired {formatKioskDate(device.paired_at)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isDevicePending(device) && (
                              <>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Last seen: {formatKioskDate(device.last_seen_at)}
                                </span>
                                <button
                                  onClick={() => handleEditDevice(device)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Edit device settings"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteKioskDevice(device.id)}
                              disabled={deletingDeviceId === device.id}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Remove device"
                            >
                              {deletingDeviceId === device.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Edit Device Modal */}
                {editingDevice && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Device Settings
                        </h3>
                        <button
                          onClick={() => setEditingDevice(null)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Device Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Device Name
                          </label>
                          <input
                            type="text"
                            value={deviceFormName}
                            onChange={(e) => setDeviceFormName(e.target.value)}
                            placeholder="e.g., Outside Tablet, Bar Station"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Give your device a friendly name for easy identification
                          </p>
                        </div>

                        {/* Zone Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Visible Zones
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Select which zones this device can see. Leave empty to show all zones.
                          </p>

                          {zones.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                              No zones configured for this venue
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {zones.map((zone) => (
                                <label
                                  key={zone.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    deviceFormZones.includes(zone.id)
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={deviceFormZones.includes(zone.id)}
                                    onChange={() => toggleDeviceZone(zone.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-900 dark:text-white">{zone.name}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {deviceFormZones.length === 0 && zones.length > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              No zones selected — device will show all zones
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                        <button
                          onClick={() => setEditingDevice(null)}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDevice}
                          disabled={savingDevice}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingDevice && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Setup Instructions */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">How to Set Up</h4>
                  <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">1</span>
                      <span>Download the <strong className="text-gray-900 dark:text-white">Chatters Kiosk</strong> app on your tablet</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">2</span>
                      <span>Generate a pairing code above</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">3</span>
                      <span>Enter the 6-character code in the app</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">4</span>
                      <span>Place the tablet in a visible location for customers</span>
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueTab;
