import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../ui/button';
import { supabase } from '../../../utils/supabase';
import { GripVertical, Plus, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
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

  const getDefaultLinks = () => [
    { id: 'menu', label: 'View Menu', url: '', enabled: false, order: 1 },
    { id: 'order', label: 'Order Food', url: '', enabled: false, order: 2 },
    { id: 'pay', label: 'Pay Your Bill', url: '', enabled: false, order: 3 },
    { id: 'book', label: 'Book a Table', url: '', enabled: false, order: 4 }
  ];

  const loadLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('custom_links')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error loading custom links:', error);
      return;
    }

    const customLinks = data?.custom_links || [];
    setLinks(customLinks.length > 0 ? customLinks : getDefaultLinks());
  }, [venueId]);

  useEffect(() => {
    if (venueId) {
      loadLinks();
    }
  }, [venueId, loadLinks]);

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

  const saveLinks = async () => {
    setSavingLinks(true);
    setLinksMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('venues')
      .update({ custom_links: links })
      .eq('id', venueId);

    setSavingLinks(false);

    if (error) {
      setLinksMessage({ type: 'error', text: 'Failed to save links' });
      console.error('Error saving links:', error);
    } else {
      setLinksMessage({ type: 'success', text: 'Links saved successfully!' });
      setTimeout(() => setLinksMessage({ type: '', text: '' }), 3000);
    }
  };
  return (
    <div className="w-full">

      <div className="space-y-6">
        
        {/* Section 1: Basic Information Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
            <p className="text-sm text-gray-500 mt-1">Venue name, address, and location details</p>
          </div>

          {/* Section Content */}
          <div className="p-6 space-y-6">
            {/* Venue Name */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500">The name customers will see</p>
              </div>
              <div className="lg:col-span-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter your venue name"
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-xs text-gray-500">Physical location of your venue</p>
              </div>
              <div className="lg:col-span-2 space-y-3">
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={address.line1}
                  onChange={(e) => setAddress({...address, line1: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={address.line2}
                  onChange={(e) => setAddress({...address, line2: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => setAddress({...address, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-xs text-gray-500">Contact number for your venue</p>
              </div>
              <div className="lg:col-span-2">
                <input
                  type="tel"
                  value={phone || ''}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 1234 567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Website */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <p className="text-xs text-gray-500">Your venue's web URL</p>
              </div>
              <div className="lg:col-span-2">
                <input
                  type="url"
                  value={website || ''}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.yourvenue.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Card Save Action */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Changes are saved per venue
              </div>
              <Button
                variant="primary"
                onClick={saveSettings}
                loading={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {message && (
              <div className={`text-xs p-2 rounded-lg mt-3 ${
                message.includes('success')
                  ? 'text-green-700 bg-green-50 border border-green-200'
                  : 'text-red-700 bg-red-50 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Custom Links Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Custom Action Links</h3>
            <p className="text-sm text-gray-500 mt-1">Create a central hub for all customer interactions</p>
          </div>

          {/* Section Content */}
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Make Chatters Your Central Hub</h4>
              <p className="text-sm text-blue-800">
                Add links to your existing ordering, payment, and booking systems. Customers will see these options before leaving feedback,
                making your Chatters QR code the single entry point for all customer interactions.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Tip:</strong> Configure the splash page background image in <strong>Venue Settings → Branding</strong>.
              </p>
            </div>

            {/* Action Links Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Action Links</h4>
              <button
                onClick={addCustomLink}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
                            className={`bg-gray-50 border rounded-lg p-4 ${
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
                                  {link.id.startsWith('custom-') && (
                                    <button
                                      onClick={() => deleteLink(link.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
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
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Card Save Action */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Changes are saved per venue
              </div>
              <Button
                variant="primary"
                onClick={saveLinks}
                loading={savingLinks}
              >
                {savingLinks ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {linksMessage.text && (
              <div
                className={`text-xs p-2 rounded-lg mt-3 ${
                  linksMessage.type === 'success'
                    ? 'text-green-700 bg-green-50 border border-green-200'
                    : 'text-red-700 bg-red-50 border border-red-200'
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