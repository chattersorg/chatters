import React, { useState, useRef, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import usePageTitle from '../../hooks/usePageTitle';
import { Send, Sparkles, Loader2, User, Bot, AlertCircle } from 'lucide-react';

// Simple markdown renderer for AI responses
const FormattedMessage = ({ content }) => {
  // Split content into lines for processing
  const lines = content.split('\n');

  const formatInlineText = (text) => {
    // Handle bold (**text** or __text__)
    const parts = [];
    let remaining = text;
    let key = 0;

    // Process **bold** patterns
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
      }
      // Add the bold text
      parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  const renderLine = (line, idx) => {
    // Handle headings (## Heading)
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="font-semibold text-base mt-3 mb-1 first:mt-0">
          {formatInlineText(line.slice(3))}
        </h3>
      );
    }

    // Handle bullet points (• or - or *)
    if (line.match(/^[•\-\*]\s/)) {
      return (
        <li key={idx} className="ml-4 list-disc">
          {formatInlineText(line.slice(2))}
        </li>
      );
    }

    // Handle empty lines
    if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    }

    // Regular paragraph
    return (
      <p key={idx} className="leading-relaxed">
        {formatInlineText(line)}
      </p>
    );
  };

  // Group consecutive list items
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

  // Don't forget trailing list items
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

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
    const inputRef = useRef(null);

  // Get current venue name
  const currentVenue = allVenues.find(v => v.id === venueId);
  const venueName = currentVenue?.name || 'your venue';

  // Scroll to bottom of messages container when new messages arrive
  const messagesContainerRef = useRef(null);
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

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          venueId,
          venueName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add AI response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        stats: data.stats
      }]);
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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Chatters Intelligence</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ask questions about your feedback data in plain English
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col">
        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            // Empty state with suggestions
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
            // Messages list
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

              {/* Loading indicator */}
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
  );
};

export default AIChat;
