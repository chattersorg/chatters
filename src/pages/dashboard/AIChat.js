import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { Send, Sparkles, Loader2, User, Bot, AlertCircle, Plus, MessageSquare, Trash2, ChevronLeft } from 'lucide-react';

// Simple markdown renderer for AI responses
const FormattedMessage = ({ content }) => {
  const lines = content.split('\n');

  const formatInlineText = (text) => {
    const parts = [];
    let key = 0;

    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  const renderLine = (line, idx) => {
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="font-semibold text-base mt-3 mb-1 first:mt-0">
          {formatInlineText(line.slice(3))}
        </h3>
      );
    }

    if (line.match(/^[•\-\*]\s/)) {
      return (
        <li key={idx} className="ml-4 list-disc">
          {formatInlineText(line.slice(2))}
        </li>
      );
    }

    if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    }

    return (
      <p key={idx} className="leading-relaxed">
        {formatInlineText(line)}
      </p>
    );
  };

  const elements = [];
  let currentList = [];

  lines.forEach((line, idx) => {
    const isBullet = line.match(/^[•\-\*]\s/);

    if (isBullet) {
      currentList.push(renderLine(line, idx));
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${idx}`} className="space-y-1 my-1">
            {currentList}
          </ul>
        );
        currentList = [];
      }
      elements.push(renderLine(line, idx));
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="list-end" className="space-y-1 my-1">
        {currentList}
      </ul>
    );
  }

  return <div className="space-y-1">{elements}</div>;
};

const AIChat = () => {
  usePageTitle('Chatters Intelligence');
  const { venueId, allVenues } = useVenue();

  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const currentVenue = allVenues.find(v => v.id === venueId);
  const venueName = currentVenue?.name || 'your venue';

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!venueId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, updated_at, messages')
        .eq('venue_id', venueId)
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted = (data || []).map(conv => ({
        id: conv.id,
        title: conv.title || 'New conversation',
        preview: conv.messages?.[0]?.content?.slice(0, 40) || '',
        messageCount: conv.messages?.length || 0,
        updatedAt: conv.updated_at
      }));

      setConversations(formatted);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [venueId]);

  // Load a specific conversation
  const loadConversation = useCallback(async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      setCurrentConversationId(conversationId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    }
  }, []);

  // Save conversation
  const saveConversation = useCallback(async (newMessages, conversationId = null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const title = newMessages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'New conversation';

      if (conversationId) {
        // Update existing
        await supabase
          .from('chat_conversations')
          .update({ messages: newMessages, title })
          .eq('id', conversationId);
        return conversationId;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('chat_conversations')
          .insert({
            venue_id: venueId,
            user_id: session.user.id,
            title,
            messages: newMessages
          })
          .select()
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (err) {
      console.error('Error saving conversation:', err);
      return null;
    }
  }, [venueId]);

  // Delete conversation
  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();

    try {
      await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      setConversations(prev => prev.filter(c => c.id !== conversationId));

      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Get conversation history for context (last 10 exchanges)
      const historyForContext = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          venueId,
          venueName,
          history: historyForContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const updatedMessages = [...newMessages, {
        role: 'assistant',
        content: data.response,
        stats: data.stats,
        timestamp: new Date().toISOString()
      }];

      setMessages(updatedMessages);

      // Save to database
      const savedId = await saveConversation(updatedMessages, currentConversationId);
      if (savedId && !currentConversationId) {
        setCurrentConversationId(savedId);
        loadConversations(); // Refresh list
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestedQuestions = [
    "What's my feedback like this week?",
    "Show me any negative feedback from yesterday",
    "What are customers saying about our service?",
    "What was my NPS score last month?",
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-200 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-800 overflow-hidden`}>
        <div className="h-full flex flex-col w-72">
          {/* New Chat Button */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={startNewConversation}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conv.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs opacity-60">{formatDate(conv.updatedAt)}</p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 text-gray-500 transition-transform ${showSidebar ? '' : 'rotate-180'}`} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Chatters Intelligence</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ask questions about your feedback data
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
          {/* Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ask about your feedback
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md">
                  I can help you understand your customer feedback. Ask me anything about ratings, comments, trends, or specific feedback.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="text-sm">
                          <FormattedMessage content={message.content} />
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.stats && (
                        <p className="text-xs mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 opacity-70">
                          Based on {message.stats.feedbackCount} feedback items
                          {message.stats.npsCount > 0 && ` and ${message.stats.npsCount} NPS responses`}
                        </p>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your feedback..."
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
