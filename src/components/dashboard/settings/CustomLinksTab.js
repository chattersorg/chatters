import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase';
import { GripVertical, Plus, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const CustomLinksTab = ({ venueId }) => {
  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (venueId) {
      loadLinks();
    }
  }, [venueId]);

  const loadLinks = async () => {
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
  };

  const getDefaultLinks = () => [
    { id: 'menu', label: 'View Menu', url: '', enabled: false, order: 1 },
    { id: 'order', label: 'Order Food', url: '', enabled: false, order: 2 },
    { id: 'pay', label: 'Pay Your Bill', url: '', enabled: false, order: 3 },
    { id: 'book', label: 'Book a Table', url: '', enabled: false, order: 4 }
  ];

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
    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('venues')
      .update({ custom_links: links })
      .eq('id', venueId);

    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save links' });
      console.error('Error saving links:', error);
    } else {
      setMessage({ type: 'success', text: 'Links saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const getIconForLinkType = (id) => {
    const icons = {
      menu: '📋',
      order: '🍽️',
      pay: '💳',
      book: '📅'
    };
    return icons[id] || '🔗';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Make Chatters Your Central Hub</h3>
        <p className="text-sm text-blue-800">
          Add links to your existing ordering, payment, and booking systems. Customers will see these options before leaving feedback,
          making your Chatters QR code the single entry point for all customer interactions.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Action Links</h3>
          <button
            onClick={addCustomLink}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Custom Link
          </button>
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
                              <span className="text-2xl">{getIconForLinkType(link.id)}</span>
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
          onClick={loadLinks}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          onClick={saveLinks}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default CustomLinksTab;
