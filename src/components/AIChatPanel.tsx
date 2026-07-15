'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';
import Icon from '@/components/ui/AppIcon';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_MESSAGE = {
  role: 'system' as const,
  content: `You are Nemo AI, an expert trend analyst and content strategy advisor embedded in the Nemo trend intelligence platform. 
You help creators, marketers, and brands:
- Explore and understand trending topics across platforms (YouTube, Instagram, TikTok, LinkedIn, Google)
- Analyze why trends are rising or falling
- Generate content ideas and strategies based on current trends
- Advise on the best times and formats to publish content
- Identify niche opportunities within broader trends

Be concise, insightful, and actionable. Use bullet points and short paragraphs for clarity. Reference specific platforms and metrics when relevant.`,
};

const SUGGESTED_PROMPTS = [
  'What content should I create this week?',
  'Why is short-form video trending?',
  'Best platforms for B2B content?',
  'How do I ride a trending topic?',
];

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { response, isLoading, error, sendMessage } = useChat(
    'ANTHROPIC',
    'claude-sonnet-4-6',
    true
  );

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  // Track streaming response
  useEffect(() => {
    if (isLoading && response) {
      setStreamingContent(response);
    }
  }, [response, isLoading]);

  // When streaming completes, commit to messages
  useEffect(() => {
    if (!isLoading && response) {
      setMessages((prev) => {
        // Avoid duplicate if already added
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === response) return prev;
        return [...prev, { role: 'assistant', content: response }];
      });
      setStreamingContent('');
    }
  }, [isLoading, response]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    const apiMessages = [
      SYSTEM_MESSAGE,
      ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    sendMessage(apiMessages, { temperature: 0.7, max_tokens: 1024 });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setStreamingContent('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative pointer-events-auto w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:mr-6 sm:mb-6 flex flex-col rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold font-display">N</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground font-sans leading-tight">Nemo AI</p>
              <p className="text-[10px] text-muted-foreground font-mono-custom uppercase tracking-widest leading-tight">
                Trend Strategy Assistant
              </p>
            </div>
            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-mono-custom font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title="Clear chat"
              >
                <Icon name="TrashIcon" size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              title="Close"
            >
              <Icon name="XMarkIcon" size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-4">
              <div className="w-14 h-14 rounded-2xl flame-gradient flex items-center justify-center">
                <span className="text-white text-2xl font-bold font-display">N</span>
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-base mb-1">
                  Ask Nemo AI anything
                </p>
                <p className="text-xs text-muted-foreground font-sans max-w-[260px]">
                  Explore trends, get content ideas, and build your strategy with AI-powered insights.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full mt-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-left px-3 py-2 rounded-xl border border-border bg-muted/50 hover:bg-muted hover:border-primary/30 text-xs text-foreground font-sans transition-all duration-150"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flame-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold font-display">N</span>
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ?'bg-primary text-white rounded-br-sm' :'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="UserIcon" size={14} className="text-primary" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming bubble */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg flame-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold font-display">N</span>
              </div>
              <div className="max-w-[80%] px-3 py-2.5 rounded-2xl rounded-bl-sm bg-muted text-foreground text-sm font-sans leading-relaxed whitespace-pre-wrap">
                {streamingContent || (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
          <div className="flex items-end gap-2 bg-muted rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about trends, content strategy..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground font-sans resize-none outline-none min-h-[24px] max-h-[96px] leading-6 disabled:opacity-50"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 rounded-lg flame-gradient flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              title="Send message"
            >
              <Icon name="PaperAirplaneIcon" size={15} className="text-white" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono-custom text-center mt-2">
            Powered by Claude · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
