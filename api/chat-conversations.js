/**
 * Chat Conversations API Endpoint
 *
 * Handles CRUD operations for AI chat conversation persistence.
 * - GET: List conversations for a venue/user or get a specific conversation
 * - POST: Create a new conversation
 * - PUT: Update an existing conversation (add messages)
 * - DELETE: Delete a conversation
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get auth token from header to identify user
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify token and get user
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = user.id;

  switch (req.method) {
    case 'GET': {
      const { venueId, conversationId } = req.query;

      if (conversationId) {
        // Get specific conversation
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        return res.status(200).json(data);
      }

      if (!venueId) {
        return res.status(400).json({ error: 'venueId required' });
      }

      // List conversations for venue
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at, updated_at, messages')
        .eq('venue_id', venueId)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Chat API] Error listing conversations:', error);
        return res.status(500).json({ error: 'Failed to list conversations' });
      }

      // Transform to include message count and preview
      const conversations = data.map(conv => ({
        id: conv.id,
        title: conv.title || 'New conversation',
        preview: conv.messages[0]?.content?.slice(0, 50) || '',
        messageCount: conv.messages.length,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      }));

      return res.status(200).json(conversations);
    }

    case 'POST': {
      const { venueId, messages, title } = req.body;

      if (!venueId) {
        return res.status(400).json({ error: 'venueId required' });
      }

      // Generate title from first user message if not provided
      const autoTitle = title || messages?.find(m => m.role === 'user')?.content?.slice(0, 50) || 'New conversation';

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          venue_id: venueId,
          user_id: userId,
          title: autoTitle,
          messages: messages || []
        })
        .select()
        .single();

      if (error) {
        console.error('[Chat API] Error creating conversation:', error);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      return res.status(201).json(data);
    }

    case 'PUT': {
      const { conversationId, messages, title } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId required' });
      }

      const updateData = { messages };
      if (title) {
        updateData.title = title;
      }

      const { data, error } = await supabase
        .from('chat_conversations')
        .update(updateData)
        .eq('id', conversationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Chat API] Error updating conversation:', error);
        return res.status(500).json({ error: 'Failed to update conversation' });
      }

      return res.status(200).json(data);
    }

    case 'DELETE': {
      const { conversationId } = req.query;

      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId required' });
      }

      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('[Chat API] Error deleting conversation:', error);
        return res.status(500).json({ error: 'Failed to delete conversation' });
      }

      return res.status(200).json({ success: true });
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
