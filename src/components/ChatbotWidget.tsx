import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am **VoltBot**, your live AI assistant at VoltMart. ⚡ I can help you with:\n\n- Looking up product **prices and stock**\n- Explaining **delivery and returns** policies\n- Finding active **coupon codes** (like `FIRST10` for 10% off)\n- Tracking recent **orders** (like order `#1001`)\n\nAsk me anything!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: messages.slice(1), // Exclude the initial template welcome greeting
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't connect to the core VoltBot server. Please verify your internet connection or backend setup.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic Markdown-to-HTML parser for bullet points and bolding
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bold syntax
      let formatted = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      formatted = formatted.replace(boldRegex, '<strong class="font-semibold text-teal-800">$1</strong>');
      
      // Inline code backticks
      const codeRegex = /`(.*?)`/g;
      formatted = formatted.replace(codeRegex, '<code class="bg-zinc-100 text-teal-600 px-1 py-0.5 rounded font-mono text-xs">$1</code>');

      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc mt-1 text-sm text-zinc-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        );
      }
      return (
        <p key={idx} className="text-sm text-zinc-700 leading-relaxed mt-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div id="chatbot-container" className="absolute bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          id="chatbot-window"
          className="w-80 md:w-96 h-[480px] bg-white rounded-2xl shadow-2xl border border-zinc-100 flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <div className="bg-teal-600 text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-inner">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">VoltBot AI Assistant</h3>
                <span className="text-[10px] text-teal-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Grounded in Live Catalog
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-teal-100 hover:text-white p-1 rounded-full hover:bg-teal-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white border border-zinc-100 text-zinc-800 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {formatMessageText(msg.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-100 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-100 bg-white flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about prices, stock, delivery..."
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 focus:bg-white text-zinc-800"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-teal-600 text-white p-2 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-teal-600 text-white p-4 rounded-full shadow-2xl hover:bg-teal-700 transition hover:scale-105 duration-200 flex items-center justify-center gap-2 group border border-teal-500"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-semibold text-sm whitespace-nowrap">
              Chat with VoltBot
            </span>
          </>
        )}
      </button>
    </div>
  );
}
