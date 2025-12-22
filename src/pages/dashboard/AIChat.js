import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { Send, Loader2, AlertCircle, Plus, MessageSquare, Trash2, ChevronLeft } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Chatters logo component with dark mode support
const ChattersLogo = ({ className = "w-4 h-4" }) => (
  <>
    <img
      src="/img/logo/chatters-logo-black-2025.svg"
      alt="Chatters"
      className={`${className} dark:hidden`}
    />
    <img
      src="/img/logo/chatters-logo-white-2025.svg"
      alt="Chatters"
      className={`${className} hidden dark:block`}
    />
  </>
);

// Typing animation component
const TypewriterText = ({ content, onComplete, speed = 15 }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedContent(content.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [content, speed, onComplete, isComplete]);

  return <FormattedMessage content={displayedContent} />;
};

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

// Parse chart data from message content
const parseChartFromMessage = (content) => {
  const chartMatch = content.match(/<!--CHART:(.*?)-->/s);
  if (!chartMatch) return { text: content, chart: null };

  try {
    const chartData = JSON.parse(chartMatch[1]);
    const textContent = content.replace(/<!--CHART:.*?-->/s, '').trim();
    return { text: textContent, chart: chartData };
  } catch (e) {
    return { text: content, chart: null };
  }
};

// AI Chat Visualisation Component
const AIChartVisualisation = ({ chartData }) => {
  const isDark = document.documentElement.classList.contains('dark');

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: chartData.title,
        color: isDark ? '#e5e7eb' : '#374151',
        font: {
          size: 14,
          weight: '600',
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#374151' : '#ffffff',
        titleColor: isDark ? '#e5e7eb' : '#111827',
        bodyColor: isDark ? '#d1d5db' : '#4b5563',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
        },
        beginAtZero: chartData.type === 'bar',
      },
    },
  }), [chartData.title, chartData.type, isDark]);

  const data = useMemo(() => ({
    labels: chartData.data.map(d => d.label),
    datasets: [
      {
        data: chartData.data.map(d => d.value),
        borderColor: '#3b82f6',
        backgroundColor: chartData.type === 'bar' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: chartData.type === 'line',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
      },
    ],
  }), [chartData]);

  if (chartData.type === 'table') {
    return (
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Item</th>
              <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Value</th>
            </tr>
          </thead>
          <tbody>
            {chartData.data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{row.label}</td>
                <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100 font-medium">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="mt-3 h-48 bg-white dark:bg-gray-900 rounded-lg p-2">
      {chartData.type === 'line' ? (
        <Line data={data} options={chartOptions} />
      ) : (
        <Bar data={data} options={chartOptions} />
      )}
    </div>
  );
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
  const [typingMessageId, setTypingMessageId] = useState(null);
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
      setTypingMessageId(null);
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
        await supabase
          .from('chat_conversations')
          .update({ messages: newMessages, title })
          .eq('id', conversationId);
        return conversationId;
      } else {
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
    setTypingMessageId(null);
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
  }, [messages, loading, typingMessageId]);

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

    const messageId = Date.now().toString();
    const newMessages = [...messages, { id: messageId, role: 'user', content: userMessage, timestamp: new Date().toISOString() }];
    setMessages(newMessages);
    setLoading(true);

    try {
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
      const assistantMessageId = (Date.now() + 1).toString();

      const updatedMessages = [...newMessages, {
        id: assistantMessageId,
        role: 'assistant',
        content: data.response,
        stats: data.stats,
        timestamp: new Date().toISOString()
      }];

      setMessages(updatedMessages);
      setTypingMessageId(assistantMessageId);

      // Save to database
      const savedId = await saveConversation(updatedMessages, currentConversationId);
      if (savedId && !currentConversationId) {
        setCurrentConversationId(savedId);
        loadConversations();
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestedQuestions = [
    "How's my feedback looking today?",
    "Show me a graph of my ratings over the last month",
    "Who's our best performing staff member?",
    "What's my NPS score this month?",
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

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Check if we should show a timestamp divider before this message
  // Show if: first message, or more than 5 minutes since previous message
  const shouldShowTimestamp = (messages, currentIndex) => {
    if (currentIndex === 0) return true;

    const currentMsg = messages[currentIndex];
    const prevMsg = messages[currentIndex - 1];

    if (!currentMsg.timestamp || !prevMsg.timestamp) return false;

    const currentTime = new Date(currentMsg.timestamp);
    const prevTime = new Date(prevMsg.timestamp);
    const diffMinutes = (currentTime - prevTime) / (1000 * 60);

    return diffMinutes >= 5;
  };

  const formatTimestampDivider = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today at ${time}`;
    } else if (isYesterday) {
      return `Yesterday at ${time}`;
    } else {
      const dateFormatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return `${dateFormatted} at ${time}`;
    }
  };

  // Apply overflow hidden to body when this component mounts to prevent page scroll
  useEffect(() => {
    // Store original overflow value
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    const htmlOverflow = document.documentElement.style.overflow;

    // Prevent scrolling on body
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, []);

  // Use negative margins to break out of parent padding (p-4 sm:p-6 lg:p-8)
  // Then set fixed height to fill viewport minus header
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 bg-gray-50 dark:bg-black overflow-hidden h-[calc(100vh-4rem)]">
      <div className="h-full p-4 sm:p-6 lg:p-8 overflow-hidden">
        <div className="h-full flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {/* Sidebar - Conversation List */}
          <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 overflow-hidden`}>
            <div className="h-full flex flex-col w-64">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={startNewConversation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Conversation
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-2">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new chat to begin</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          currentConversationId === conv.id
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(conv.updatedAt)}</p>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
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
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showSidebar ? '' : 'rotate-180'}`} />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Chatters Intelligence</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI-powered insights for {venueName}
                </p>
              </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Messages Area */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                      <ChattersLogo className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      How can I help you today?
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md">
                      Ask me anything about your feedback, staff performance, ratings, or customer sentiment.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 text-left"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map((message, idx) => (
                      <div key={message.id || idx}>
                        {/* Timestamp divider - Slack style */}
                        {shouldShowTimestamp(messages, idx) && message.timestamp && (
                          <div className="flex items-center justify-center my-4">
                            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                            <span className="px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {formatTimestampDivider(message.timestamp)}
                            </span>
                            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                          </div>
                        )}
                        <div
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                              <ChattersLogo className="w-5 h-5" />
                            </div>
                          )}
                          <div
                            className={`max-w-[75%] px-4 py-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-gray-900 dark:bg-gray-700 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              (() => {
                                const { text, chart } = parseChartFromMessage(message.content);
                                return (
                                  <div className="text-sm leading-relaxed">
                                    {typingMessageId === message.id ? (
                                      <TypewriterText
                                        content={text}
                                        speed={8}
                                        onComplete={() => setTypingMessageId(null)}
                                      />
                                    ) : (
                                      <FormattedMessage content={text} />
                                    )}
                                    {chart && !typingMessageId && (
                                      <AIChartVisualisation chartData={chart} />
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            )}
                            {message.stats && !typingMessageId && (
                              <p className="text-xs mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 opacity-60">
                                {message.stats.dataSource === 'nps' ? (
                                  `Based on ${message.stats.npsCount} NPS responses`
                                ) : message.stats.dataSource === 'feedback' ? (
                                  `Based on ${message.stats.feedbackCount} feedback items`
                                ) : (
                                  <>
                                    Based on {message.stats.feedbackCount} feedback items
                                    {message.stats.npsCount > 0 && ` and ${message.stats.npsCount} NPS responses`}
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-white">You</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <ChattersLogo className="w-5 h-5" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <form onSubmit={sendMessage} className="flex gap-2 max-w-3xl mx-auto">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about your feedback..."
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
