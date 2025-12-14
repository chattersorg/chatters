import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { GripVertical, Plus, Trash2, ExternalLink, Eye, EyeOff, Link, FileText, Utensils, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import MenuBuilder from '../menu/MenuBuilder';

const CustomLinksTab = ({ venueId }) => {
  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [menuType, setMenuType] = useState('none');
  const [menuUrl, setMenuUrl] = useState('');
  const [menuPdfUrl, setMenuPdfUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showMenuBuilder, setShowMenuBuilder] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    if (venueId) {
      loadVenueData();
    }
  }, [venueId]);

  const loadVenueData = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('custom_links, menu_type, menu_url, menu_pdf_url')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error loading venue data:', error);
      return;
    }

    // Load custom links (excluding the special 'menu' link which we handle separately)
    const customLinks = (data?.custom_links || []).filter(link => link.id !== 'menu');
    // If no custom_links field exists (null), use defaults. If empty array, keep empty (user deleted all)
    setLinks(data?.custom_links === null || data?.custom_links === undefined ? getDefaultLinks() : customLinks);

    // Load menu settings
    setMenuType(data?.menu_type || 'none');
    setMenuUrl(data?.menu_url || '');
    setMenuPdfUrl(data?.menu_pdf_url || '');
  };

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
      setMessage({ type: 'error', text: 'Please upload a PDF file' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 10MB' });
      return;
    }

    setUploadingPdf(true);
    setMessage({ type: '', text: '' });

    try {
      const fileName = `${venueId}/menus/menu-${Date.now()}.pdf`;

      const { data, error } = await supabase.storage
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
      setMessage({ type: 'success', text: 'PDF uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setMessage({ type: 'error', text: 'Failed to upload PDF' });
    } finally {
      setUploadingPdf(false);
    }
  };

  const removePdf = async () => {
    if (!menuPdfUrl) return;

    try {
      // Extract file path from URL
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

  const saveAll = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('venues')
      .update({
        custom_links: links,
        menu_type: menuType,
        menu_url: menuType === 'link' ? menuUrl : null,
        menu_pdf_url: menuType === 'pdf' ? menuPdfUrl : null
      })
      .eq('id', venueId);

    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save changes' });
      console.error('Error saving:', error);
    } else {
      setMessage({ type: 'success', text: 'Changes saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const isMenuEnabled = menuType !== 'none';

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Make Chatters Your Central Hub</h3>
        <p className="text-sm text-blue-800">
          Add your menu and links to ordering, payment, and booking systems. Customers will see these options before leaving feedback,
          making your Chatters QR code the single entry point for all customer interactions.
        </p>
      </div>

      {/* Menu Configuration - Special Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setMenuExpanded(!menuExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${isMenuEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Utensils className={`w-5 h-5 ${isMenuEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">View Menu</h3>
              <p className="text-sm text-gray-500">
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
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
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
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="pt-4 space-y-4">
              <p className="text-sm text-gray-600">How do you want to display your menu?</p>

              {/* Option: None */}
              <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                menuType === 'none' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
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
                  <p className="font-medium text-gray-900">Don't show menu</p>
                  <p className="text-sm text-gray-500">Hide the menu option from customers</p>
                </div>
              </label>

              {/* Option: External Link */}
              <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                menuType === 'link' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
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
                    <Link className="w-4 h-4 text-gray-600" />
                    <p className="font-medium text-gray-900">Link to external menu</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Point to your existing online menu</p>
                  {menuType === 'link' && (
                    <input
                      type="url"
                      value={menuUrl}
                      onChange={(e) => setMenuUrl(e.target.value)}
                      placeholder="https://example.com/menu"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </label>

              {/* Option: PDF Upload */}
              <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                menuType === 'pdf' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
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
                    <FileText className="w-4 h-4 text-gray-600" />
                    <p className="font-medium text-gray-900">Upload a PDF</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">We'll host and optimise it for mobile</p>
                  {menuType === 'pdf' && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {menuPdfUrl ? (
                        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <FileText className="w-5 h-5 text-red-500" />
                          <span className="flex-1 text-sm text-gray-700 truncate">
                            Menu PDF uploaded
                          </span>
                          <a
                            href={menuPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </a>
                          <button
                            onClick={removePdf}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
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
              <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                menuType === 'builder' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
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
                    <Utensils className="w-4 h-4 text-gray-600" />
                    <p className="font-medium text-gray-900">Build menu in Chatters</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Create categories, items, prices & dietary tags</p>
                  {menuType === 'builder' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuBuilder(true);
                      }}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
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

      {/* Other Action Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Other Action Links</h3>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {getAvailableDefaultLinks().map((link) => (
                    <button
                      key={link.id}
                      onClick={() => addDefaultLink(link)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {link.label}
                    </button>
                  ))}
                  {getAvailableDefaultLinks().length > 0 && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                  <button
                    onClick={() => {
                      addCustomLink();
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Custom Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

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
                        className={`bg-white border rounded-lg p-4 ${
                          snapshot.isDragging ? 'shadow-lg' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-3 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
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
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => toggleEnabled(link.id)}
                                className={`p-2 rounded-md ${
                                  link.enabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                                title={link.enabled ? 'Enabled' : 'Disabled'}
                              >
                                {link.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteLink(link.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
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
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              {link.url && (
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
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
                  <div className="text-center py-8 text-gray-500">
                    <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No action links configured</p>
                    <p className="text-xs mt-1">Click "Add Link" to add links for ordering, payments, bookings, or custom actions</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={loadVenueData}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          onClick={saveAll}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Menu Builder Modal */}
      {showMenuBuilder && (
        <MenuBuilder
          venueId={venueId}
          onClose={() => setShowMenuBuilder(false)}
        />
      )}
    </div>
  );
};

export default CustomLinksTab;
