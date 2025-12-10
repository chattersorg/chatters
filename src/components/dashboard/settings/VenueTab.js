import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { supabase } from '../../../utils/supabase';
import { PermissionGate } from '../../../context/PermissionsContext';
import { GripVertical, Plus, Trash2, ExternalLink, Eye, EyeOff, Link, FileText, Utensils, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const VenueTab = ({
  name, setName,
  address, setAddress,
  phone, setPhone,
  website, setWebsite,
  saveSettings,
  loading,
  message,
  venueId
}) => {
  // Custom Links state
  const [links, setLinks] = useState([]);
  const [savingLinks, setSavingLinks] = useState(false);
  const [linksMessage, setLinksMessage] = useState({ type: '', text: '' });

  // Menu settings state
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [menuType, setMenuType] = useState('none');
  const [menuUrl, setMenuUrl] = useState('');
  const [menuPdfUrl, setMenuPdfUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const navigate = useNavigate();

  const getDefaultLinks = () => [
    { id: 'order', label: 'Order Food', url: '', enabled: false, order: 1 },
    { id: 'pay', label: 'Pay Your Bill', url: '', enabled: false, order: 2 },
    { id: 'book', label: 'Book a Table', url: '', enabled: false, order: 3 }
  ];

  const loadVenueData = useCallback(async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('custom_links, menu_type, menu_url, menu_pdf_url')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error loading venue data:', error);
      return;
    }

    // Load custom links (excluding the old 'menu' link which we now handle separately)
    const customLinks = (data?.custom_links || []).filter(link => link.id !== 'menu');
    setLinks(customLinks.length > 0 ? customLinks : getDefaultLinks());

    // Load menu settings
    setMenuType(data?.menu_type || 'none');
    setMenuUrl(data?.menu_url || '');
    setMenuPdfUrl(data?.menu_pdf_url || '');
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
        menu_pdf_url: menuType === 'pdf' ? menuPdfUrl : null
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

            {/* Address Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Physical location of your venue</p>
              </div>
              <div className="lg:col-span-2 space-y-3">
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={address.line1}
                  onChange={(e) => setAddress({...address, line1: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={address.line2}
                  onChange={(e) => setAddress({...address, line2: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => setAddress({...address, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
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
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isMenuEnabled ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    <Utensils className={`w-5 h-5 ${isMenuEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">View Menu</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {menuType === 'none' && 'Not configured'}
                      {menuType === 'link' && 'External link'}
                      {menuType === 'pdf' && 'PDF upload'}
                      {menuType === 'builder' && 'Built in Chatters'}
                    </p>
                  </div>
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
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">Link to external menu</p>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">Upload a PDF</p>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">Build menu in Chatters</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Create categories, items, prices & dietary tags</p>
                        {menuType === 'builder' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/settings/menu-builder');
                            }}
                            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                          >
                            Open Menu Builder →
                          </button>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Other Action Links Header */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Action Links</h4>
              <button
                onClick={addCustomLink}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add Custom Link
              </button>
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
                                  {link.id.startsWith('custom-') && (
                                    <button
                                      onClick={() => deleteLink(link.id)}
                                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
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
      </div>
    </div>
  );
};

export default VenueTab;
