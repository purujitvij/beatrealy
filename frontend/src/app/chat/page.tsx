'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Music, Play, ArrowLeft, Pause, SkipBack, SkipForward, Volume2, Sparkles, Clock, Disc3, LogOut, ListMusic, Heart, List } from 'lucide-react';
import { usePlayback } from '@/lib/playback-context';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

const coverChill = '/neon_gradient_album_art_for_chill_vibes.png';

type ToolResult = {
  tool: string;
  result: unknown;
};

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  toolResults?: ToolResult[];
};

type AgentResponse = {
  message: string;
  toolResults: ToolResult[];
  iterations: number;
  error?: string;
};

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Store conversation history for context
let conversationHistory: ConversationMessage[] = [];

// AI Agent that uses MCP to control Spotify
const callAgent = async (input: string): Promise<{ aiMessage: string; toolResults: ToolResult[] }> => {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        conversationHistory
      })
    });

    const data: AgentResponse = await response.json();

    if (data.error) {
      console.error('Agent API error:', data.error);
      return {
        aiMessage: "I'm having trouble connecting to Spotify right now. Please make sure you have an active Spotify session.",
        toolResults: []
      };
    }

    // Update conversation history
    conversationHistory.push({ role: 'user', content: input });
    conversationHistory.push({ role: 'assistant', content: data.message });

    // Keep only last 10 messages to prevent context overflow
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    return {
      aiMessage: data.message,
      toolResults: data.toolResults || []
    };
  } catch (error) {
    console.error('Error calling agent:', error);
    return {
      aiMessage: "Something went wrong. Please try again.",
      toolResults: []
    };
  }
};

// Track if initial message has been processed (outside component to survive StrictMode)
let initialMessageProcessed = false;

// Wrapper component to handle Suspense for useSearchParams
export default function Chat() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}

function ChatLoading() {
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-400 rounded-full flex items-center justify-center animate-pulse">
          <Music className="text-black w-5 h-5" />
        </div>
        <span className="text-gray-400">Loading...</span>
      </div>
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user, login, logout } = useSpotifyAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'ai', content: "Hey! I'm Moodify 🎵 Tell me what's on your mind or how you're feeling, and I'll find the perfect music for your mood. Vent, chat, whatever - I'm here to listen and play." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isProcessingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isAuthenticated) {
      inputRef.current?.focus();
    }
  }, [isAuthenticated]);

  // Process message from URL (sent from home page)
  const processMessage = useCallback(async (message: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const { aiMessage, toolResults } = await callAgent(message);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: aiMessage,
      toolResults: toolResults
    };

    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
    isProcessingRef.current = false;
  }, []);

  // Auto-send message from URL on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const initialMessage = searchParams.get('message');
    if (initialMessage && !initialMessageProcessed) {
      initialMessageProcessed = true;
      processMessage(initialMessage);
    }

    // Reset on unmount so it works on next navigation
    return () => {
      initialMessageProcessed = false;
    };
  }, [searchParams, processMessage, isAuthenticated]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input.trim();
    setInput('');
    await processMessage(message);
  }, [input, processMessage]);

  const handleSuggestionClick = useCallback(async (suggestion: string) => {
    await processMessage(suggestion);
  }, [processMessage]);

  // Show login screen if not authenticated
  if (isLoading) {
    return <ChatLoading />;
  }

  if (!isAuthenticated) {
    return <SpotifyLoginScreen onLogin={login} />;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header user={user} onLogout={logout} />

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </AnimatePresence>

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        {/* Input Area */}
        <ChatInput
          ref={inputRef}
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>

      {/* Sidebar Mini Player */}
      <div className="hidden lg:flex w-[340px] flex-col bg-[#0a0a0a] border-l border-white/5">
        <MiniSidebarPlayer />
      </div>
    </div>
  );
}

// Spotify Login Screen
function SpotifyLoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          {/* Logo */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-primary to-green-400 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30"
          >
            <Music className="text-black w-12 h-12" />
          </motion.div>

          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
            Welcome to Moodify
          </h1>
          <p className="text-gray-400 mb-8 text-lg">
            Connect your Spotify account to let AI curate the perfect music based on your mood.
          </p>

          {/* Login Button */}
          <motion.button
            onClick={onLogin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 mx-auto px-8 py-4 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full transition-colors shadow-lg shadow-[#1DB954]/30"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </motion.button>

          <p className="text-gray-600 text-sm mt-6">
            We&apos;ll only access your playback and playlists
          </p>
        </motion.div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}

interface HeaderProps {
  user?: { name: string; image: string | null } | null;
  onLogout?: () => void;
}

function Header({ user, onLogout }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex-none h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl flex items-center px-6 justify-between z-10"
    >
      <div className="flex items-center gap-4">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </motion.button>
        </Link>
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-10 bg-gradient-to-br from-primary to-green-400 rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Music className="text-black w-5 h-5" />
          </motion.div>
          <div>
            <h1 className="font-bold text-lg">Moodify AI</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Online
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-sm">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <User size={14} className="text-gray-400" />
              </div>
            )}
            <span className="text-gray-400 hidden sm:inline">{user.name}</span>
            {onLogout && (
              <motion.button
                onClick={onLogout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                title="Logout"
              >
                <LogOut size={16} />
              </motion.button>
            )}
          </div>
        )}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-xs font-mono text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20"
        >
          <Sparkles size={12} className="animate-pulse" />
          AI READY
        </motion.div> */}
      </div>
    </motion.header>
  );
}

interface ChatMessageProps {
  message: Message;
}

// Simple markdown renderer for chat messages
function renderMarkdown(text: string) {
  // Split by lines
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ol' | 'ul'; items: React.ReactNode[] } | null = null as { type: 'ol' | 'ul'; items: React.ReactNode[] } | null;
  let listKey = 0;

  const processInlineMarkdown = (line: string): React.ReactNode => {
    // Process **bold** text
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Check for numbered list (1. 2. 3. etc)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) {
          elements.push(
            currentList.type === 'ol'
              ? <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1 my-2">{currentList.items}</ol>
              : <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2">{currentList.items}</ul>
          );
        }
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(
        <li key={lineIndex} className="text-gray-100">{processInlineMarkdown(numberedMatch[2])}</li>
      );
      return;
    }

    // Check for bullet list (- or *)
    const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) {
          elements.push(
            currentList.type === 'ol'
              ? <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1 my-2">{currentList.items}</ol>
              : <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2">{currentList.items}</ul>
          );
        }
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(
        <li key={lineIndex} className="text-gray-100">{processInlineMarkdown(bulletMatch[1])}</li>
      );
      return;
    }

    // End current list if we hit a non-list line
    if (currentList) {
      elements.push(
        currentList.type === 'ol'
          ? <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1 my-2">{currentList.items}</ol>
          : <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2">{currentList.items}</ul>
      );
      currentList = null;
    }

    // Empty line = paragraph break
    if (trimmedLine === '') {
      elements.push(<br key={lineIndex} />);
      return;
    }

    // Regular text
    elements.push(
      <p key={lineIndex} className="mb-1">{processInlineMarkdown(trimmedLine)}</p>
    );
  });

  // Don't forget to close any remaining list
  if (currentList) {
    elements.push(
      currentList.type === 'ol'
        ? <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1 my-2">{currentList.items}</ol>
        : <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2">{currentList.items}</ul>
    );
  }

  return elements;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] md:max-w-[600px] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
          className={cn(
            "flex-none w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
            isUser
              ? "bg-gradient-to-br from-purple-500 to-pink-500"
              : "bg-gradient-to-br from-primary to-green-400"
          )}
        >
          {isUser ? (
            <User size={18} className="text-white" />
          ) : (
            <Image src="/dj.png" alt="DJ" width={24} height={24} />
          )}
        </motion.div>

        {/* Message Content */}
        <div className="flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className={cn(
              "px-5 py-3.5 text-[15px] leading-relaxed shadow-lg",
              isUser
                ? "bg-gradient-to-br from-primary/20 to-green-500/10 border border-primary/20 rounded-2xl rounded-tr-md text-white"
                : "bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-tl-md text-gray-100"
            )}
          >
            {isUser ? message.content : renderMarkdown(message.content)}
          </motion.div>

          {message.toolResults && message.toolResults.length > 0 && (
            <ToolResultsDisplay toolResults={message.toolResults} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-start"
    >
      <div className="flex gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-10 h-10 bg-gradient-to-br from-primary to-green-400 rounded-full flex items-center justify-center shadow-lg"
        >
          <Image src="/dj.png" alt="DJ" width={24} height={24} />
        </motion.div>
        <div className="bg-[#1a1a1a] px-5 py-4 rounded-2xl rounded-tl-md border border-white/5 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSuggestionClick: (suggestion: string) => void;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ value, onChange, onSubmit, onSuggestionClick }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
      }
    }, [value]);

    // Handle Enter key (submit) vs Shift+Enter (new line)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) {
          onSubmit(e as unknown as React.FormEvent);
        }
      }
    };

    // Combine refs
    const setRefs = (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    return (
      <div className="flex-none p-4 md:p-6 bg-gradient-to-t from-black via-black/95 to-transparent">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative">
          <div className="relative group">
            {/* Glow effect on focus */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />

            <textarea
              ref={setRefs}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me how you're feeling..."
              rows={1}
              className="relative w-full bg-[#1a1a1a] border border-white/10 text-white placeholder:text-gray-500 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-primary/50 focus:bg-[#1f1f1f] transition-all shadow-xl text-[15px] resize-none overflow-hidden leading-relaxed"
            />
            <motion.button
              type="submit"
              disabled={!value.trim()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-3 bottom-3 p-2.5 bg-primary rounded-full text-black hover:bg-green-400 transition-colors disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              <Send size={18} />
            </motion.button>
          </div>

          {/* Hint for multiline */}
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-600">Press Enter to send • Shift+Enter for new line</span>
          </div>

          {/* Quick Suggestions */}
          <div className="flex gap-2 flex-wrap justify-center mt-3">
            {[
              { text: "My boss ruined my mood today", icon: "😤" },
              { text: "Need pump up music for gym", icon: "💪" },
              { text: "Feeling heartbroken", icon: "💔" },
              { text: "Just want to chill and relax", icon: "😌" },
            ].map((suggestion, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => onSuggestionClick(suggestion.text)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-4 py-2 rounded-full text-gray-400 hover:text-white transition-all flex items-center gap-2"
              >
                <span>{suggestion.icon}</span>
                {suggestion.text}
              </motion.button>
            ))}
          </div>
        </form>
      </div>
    );
  }
);
ChatInput.displayName = 'ChatInput';

// UI-friendly track type used by the sidebar player
type UITrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number;
};

function MiniSidebarPlayer() {
  const { currentTrack, isPlaying, play, pause, next, previous, progress, seek, volume, setVolume } = usePlayback();

  // Transform playback context Track to UI-friendly format
  const uiTrack: UITrack | null = currentTrack ? {
    id: currentTrack.id,
    title: currentTrack.name,
    artist: currentTrack.artists,
    album: currentTrack.album,
    cover: currentTrack.albumArt || coverChill,
    duration: currentTrack.duration_ms / 1000,
  } : null;

  const displayTrack = uiTrack || {
    id: 'placeholder',
    title: 'Select a vibe',
    artist: 'Moodify AI',
    album: 'Moodify',
    cover: coverChill,
    duration: 100,
  };

  const isPlaceholder = !uiTrack;

  return (
    <div className="flex flex-col h-full p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 text-gray-400 text-xs font-bold uppercase tracking-widest">
        <Disc3 size={14} className={cn(isPlaying && "animate-spin")} style={{ animationDuration: '3s' }} />
        <span>Now Playing</span>
      </div>

      {/* Album Art */}
      <motion.div
        className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl mb-6 group"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src={displayTrack.cover}
          alt={displayTrack.title}
          fill
          className={cn(
            "object-cover transition-all duration-700",
            isPlaying && "scale-110",
            isPlaceholder && "grayscale opacity-50"
          )}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Track Info on Image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-bold text-white text-xl leading-tight truncate mb-1">{displayTrack.title}</h3>
          <p className="text-sm text-gray-300 truncate">{displayTrack.artist}</p>
        </div>

        {/* Center Play Button */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <motion.button
            onClick={() => isPlaceholder ? null : (isPlaying ? pause() : play())}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isPlaceholder}
            className="bg-primary text-black p-5 rounded-full shadow-xl shadow-primary/30 disabled:opacity-50"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </motion.button>
        </motion.div>

        {/* Waveform when playing */}
        {isPlaying && (
          <div className="absolute bottom-16 left-4 right-4 flex items-end justify-center gap-1 h-8">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary/60 rounded-full"
                animate={{
                  height: [
                    `${20 + ((i * 17) % 60)}%`,
                    `${20 + ((i * 31) % 60)}%`,
                    `${20 + ((i * 23) % 60)}%`
                  ]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.05
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-6">
        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer">
          <motion.div
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            style={{ width: `${displayTrack.duration ? (progress / displayTrack.duration) * 100 : 0}%` }}
          />
          <Slider
            value={[progress]}
            max={displayTrack.duration || 100}
            step={1}
            onValueChange={(val) => seek(val[0])}
            disabled={isPlaceholder}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(displayTrack.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <motion.button
          onClick={previous}
          disabled={isPlaceholder}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-30"
        >
          <SkipBack size={22} fill="currentColor" />
        </motion.button>

        <motion.button
          onClick={() => isPlaceholder ? null : (isPlaying ? pause() : play())}
          disabled={isPlaceholder}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "p-4 rounded-full transition-all shadow-lg disabled:opacity-50",
            isPlaying ? "bg-primary text-black" : "bg-white text-black"
          )}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </motion.button>

        <motion.button
          onClick={next}
          disabled={isPlaceholder}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-30"
        >
          <SkipForward size={22} fill="currentColor" />
        </motion.button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-2">
        <Volume2 size={16} className="text-gray-500" />
        <div className="flex-1 relative h-1.5 bg-white/10 rounded-full overflow-hidden group">
          <div
            className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-primary transition-colors"
            style={{ width: `${volume * 100}%` }}
          />
          <Slider
            value={[volume * 100]}
            max={100}
            onValueChange={(val) => setVolume(val[0] / 100)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Queue Section */}
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Queue</span>
          <Clock size={12} className="text-gray-500" />
        </div>
        <div className="space-y-2">
          {[
            { title: 'Next Track', artist: 'Artist Name' },
            { title: 'Coming Soon', artist: 'Another Artist' },
          ].map((track, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer opacity-50"
            >
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Music size={14} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-300 truncate">{track.title}</div>
                <div className="text-xs text-gray-500 truncate">{track.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Types for Spotify search results
interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  duration: string;
  durationMs: number;
  uri: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: string;
  albumArt: string | null;
  releaseDate: string;
  totalTracks: number;
  uri: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  owner: string;
  image: string | null;
  totalTracks: number;
  uri: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  image: string | null;
  followers: number;
  genres: string[];
  uri: string;
}

type SpotifySearchResult =
  | { type: 'tracks'; items: SpotifyTrack[]; query: string }
  | { type: 'albums'; items: SpotifyAlbum[]; query: string }
  | { type: 'playlists'; items: SpotifyPlaylist[]; query: string }
  | { type: 'artists'; items: SpotifyArtist[]; query: string }
  | { error: string };

// Try to parse Spotify result as structured data
function parseSpotifyResult(result: unknown): SpotifySearchResult | null {
  if (typeof result !== 'string') return null;
  try {
    const parsed = JSON.parse(result);
    if (parsed.type && parsed.items) return parsed as SpotifySearchResult;
    if (parsed.error) return parsed as SpotifySearchResult;
    return null;
  } catch {
    return null;
  }
}

// Track Card Component
function TrackCard({ track, index }: { track: SpotifyTrack; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
        {track.albumArt ? (
          <Image
            src={track.albumArt}
            alt={track.album}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={20} className="text-gray-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={16} className="text-white" fill="white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">{track.name}</div>
        <div className="text-xs text-gray-400 truncate">{track.artists}</div>
      </div>
      <div className="text-xs text-gray-500 font-mono">{track.duration}</div>
    </motion.div>
  );
}

// Album Card Component
function AlbumCard({ album, index }: { album: SpotifyAlbum; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
        {album.albumArt ? (
          <Image
            src={album.albumArt}
            alt={album.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={24} className="text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">{album.name}</div>
        <div className="text-xs text-gray-400 truncate">{album.artists}</div>
        <div className="text-xs text-gray-500">{album.totalTracks} tracks • {album.releaseDate?.slice(0,4)}</div>
      </div>
    </motion.div>
  );
}

// Playlist Card Component
function PlaylistCard({ playlist, index }: { playlist: SpotifyPlaylist; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-purple-500/30 flex-shrink-0">
        {playlist.image ? (
          <Image
            src={playlist.image}
            alt={playlist.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={24} className="text-primary" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">{playlist.name}</div>
        <div className="text-xs text-gray-400 truncate">by {playlist.owner}</div>
        <div className="text-xs text-gray-500">{playlist.totalTracks} tracks</div>
      </div>
    </motion.div>
  );
}

// Helper to parse track list from markdown response
function parseTrackListFromMarkdown(result: string): Array<{ id: string; name: string; artists: string; album?: string; duration: string; playedAt?: string; addedAt?: string }> {
  const tracks: Array<{ id: string; name: string; artists: string; album?: string; duration: string; playedAt?: string; addedAt?: string }> = [];
  const trackMatches = result.matchAll(
    /(\d+)\.\s*\*\*([^*]+)\*\*[^]*?Artist:\s*([^\n]+)[^]*?(?:Album:\s*([^\n]+)[^]*?)?Duration:\s*([^\n]+)[^]*?(?:Played at:\s*([^\n]+)[^]*?)?(?:Added:\s*([^\n]+)[^]*?)?ID:\s*([^\n]+)/g
  );
  for (const match of trackMatches) {
    tracks.push({
      id: match[8]?.trim() || '',
      name: match[2]?.trim() || 'Unknown Track',
      artists: match[3]?.trim() || 'Unknown Artist',
      album: match[4]?.trim(),
      duration: match[5]?.trim() || '0:00',
      playedAt: match[6]?.trim(),
      addedAt: match[7]?.trim(),
    });
  }
  return tracks;
}

// Queue Result Display
function QueueResultDisplay({ result }: { result: string }) {
  const currentMatch = result.match(/Currently Playing:\s*\*\*([^*]+)\*\*\s*by\s*([^\n]+)/);
  const upNextSection = result.split('Up Next:')[1] || '';
  const upNextTracks = parseTrackListFromMarkdown(upNextSection);

  return (
    <div className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <List size={12} className="text-green-400" />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Queue
        </span>
      </div>
      <div className="p-3 space-y-3">
        {currentMatch && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-xs text-green-400 font-medium mb-1">Now Playing</div>
            <div className="text-sm font-medium text-white">{currentMatch[1]}</div>
            <div className="text-xs text-gray-400">{currentMatch[2]}</div>
          </div>
        )}
        {upNextTracks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">Up Next</div>
            {upNextTracks.slice(0, 5).map((track, idx) => (
              <motion.div
                key={track.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
              >
                <span className="text-xs text-gray-500 w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{track.name}</div>
                  <div className="text-xs text-gray-400 truncate">{track.artists}</div>
                </div>
                <span className="text-xs text-gray-500">{track.duration}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Recently Played Display
function RecentlyPlayedDisplay({ result }: { result: string }) {
  const tracks = parseTrackListFromMarkdown(result);

  return (
    <div className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Clock size={12} className="text-blue-400" />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Recently Played
        </span>
      </div>
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {tracks.slice(0, 10).map((track, idx) => (
          <motion.div
            key={track.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
              <Music size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{track.name}</div>
              <div className="text-xs text-gray-400 truncate">{track.artists}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{track.duration}</div>
              {track.playedAt && <div className="text-xs text-gray-600">{track.playedAt}</div>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Playlist Tracks Display
function PlaylistTracksDisplay({ result }: { result: string }) {
  const nameMatch = result.match(/# Tracks in "([^"]+)"/);
  const tracks = parseTrackListFromMarkdown(result);

  return (
    <div className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
          <ListMusic size={12} className="text-purple-400" />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {nameMatch ? nameMatch[1] : 'Playlist Tracks'}
        </span>
        <span className="text-xs text-gray-600 ml-auto">{tracks.length} tracks</span>
      </div>
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {tracks.slice(0, 10).map((track, idx) => (
          <motion.div
            key={track.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-xs text-gray-500 w-6 text-center">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{track.name}</div>
              <div className="text-xs text-gray-400 truncate">{track.artists}</div>
            </div>
            <span className="text-xs text-gray-500">{track.duration}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Liked Songs Display
function LikedSongsDisplay({ result }: { result: string }) {
  const tracks = parseTrackListFromMarkdown(result);
  const totalMatch = result.match(/Showing \d+-\d+ of (\d+)/);

  return (
    <div className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center">
          <Heart size={12} className="text-pink-400" />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Liked Songs
        </span>
        {totalMatch && <span className="text-xs text-gray-600 ml-auto">{totalMatch[1]} total</span>}
      </div>
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {tracks.slice(0, 10).map((track, idx) => (
          <motion.div
            key={track.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
              <Music size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{track.name}</div>
              <div className="text-xs text-gray-400 truncate">{track.artists}</div>
            </div>
            <span className="text-xs text-gray-500">{track.duration}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Album Tracks Display
function AlbumTracksDisplay({ result }: { result: string }) {
  const nameMatch = result.match(/# Tracks (?:in|from) "([^"]+)"/i) || result.match(/\*\*([^*]+)\*\*/);
  const tracks = parseTrackListFromMarkdown(result);

  return (
    <div className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Disc3 size={12} className="text-orange-400" />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {nameMatch ? nameMatch[1] : 'Album Tracks'}
        </span>
        <span className="text-xs text-gray-600 ml-auto">{tracks.length} tracks</span>
      </div>
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {tracks.map((track, idx) => (
          <motion.div
            key={track.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-xs text-gray-500 w-6 text-center">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{track.name}</div>
              <div className="text-xs text-gray-400 truncate">{track.artists}</div>
            </div>
            <span className="text-xs text-gray-500">{track.duration}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ToolResultsDisplay({ toolResults }: { toolResults: ToolResult[] }) {
  // Categorize tool results
  const searchResults = toolResults
    .filter(tr => tr.tool === 'searchSpotify')
    .map(tr => parseSpotifyResult(tr.result))
    .filter((r): r is SpotifySearchResult => r !== null && !('error' in r));

  const queueResults = toolResults.filter(tr => tr.tool === 'getQueue');
  const recentlyPlayedResults = toolResults.filter(tr => tr.tool === 'getRecentlyPlayed');
  const playlistTracksResults = toolResults.filter(tr => tr.tool === 'getPlaylistTracks');
  const likedSongsResults = toolResults.filter(tr => tr.tool === 'getUsersSavedTracks');
  const albumTracksResults = toolResults.filter(tr => tr.tool === 'getAlbumTracks');

  // Get action tool results (non-data tools)
  const actionTools = ['playMusic', 'pausePlayback', 'resumePlayback', 'skipToNext', 'skipToPrevious', 'createPlaylist', 'addTracksToPlaylist', 'addToQueue', 'saveOrRemoveAlbumForUser'];
  const actionResults = toolResults.filter(tr => actionTools.includes(tr.tool));

  // Other tools not specially handled
  const handledTools = ['searchSpotify', 'getQueue', 'getRecentlyPlayed', 'getPlaylistTracks', 'getUsersSavedTracks', 'getAlbumTracks', ...actionTools];
  const otherResults = toolResults.filter(tr => !handledTools.includes(tr.tool));

  if (toolResults.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="w-full max-w-[500px] space-y-4"
    >
      {/* Display search results as cards */}
      {searchResults.map((result, resultIdx) => {
        if ('error' in result) return null;

        return (
          <div key={resultIdx} className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles size={12} className="text-primary" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {result.type === 'tracks' ? 'Tracks Found' :
                 result.type === 'albums' ? 'Albums Found' :
                 result.type === 'playlists' ? 'Playlists Found' : 'Artists Found'}
              </span>
              <span className="text-xs text-gray-600 ml-auto">
                &quot;{result.query}&quot;
              </span>
            </div>

            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
              {result.type === 'tracks' && result.items.map((track, idx) => (
                <TrackCard key={track.id} track={track} index={idx} />
              ))}
              {result.type === 'albums' && result.items.map((album, idx) => (
                <AlbumCard key={album.id} album={album} index={idx} />
              ))}
              {result.type === 'playlists' && result.items.map((playlist, idx) => (
                <PlaylistCard key={playlist.id} playlist={playlist} index={idx} />
              ))}
              {result.type === 'artists' && result.items.map((artist, idx) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                    {artist.image ? (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{artist.name}</div>
                    <div className="text-xs text-gray-400 truncate">{artist.genres.join(', ') || 'Artist'}</div>
                    <div className="text-xs text-gray-500">{artist.followers.toLocaleString()} followers</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Queue results */}
      {queueResults.map((tr, idx) => (
        <QueueResultDisplay key={`queue-${idx}`} result={typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result)} />
      ))}

      {/* Recently played results */}
      {recentlyPlayedResults.map((tr, idx) => (
        <RecentlyPlayedDisplay key={`recent-${idx}`} result={typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result)} />
      ))}

      {/* Playlist tracks results */}
      {playlistTracksResults.map((tr, idx) => (
        <PlaylistTracksDisplay key={`playlist-${idx}`} result={typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result)} />
      ))}

      {/* Liked songs results */}
      {likedSongsResults.map((tr, idx) => (
        <LikedSongsDisplay key={`liked-${idx}`} result={typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result)} />
      ))}

      {/* Album tracks results */}
      {albumTracksResults.map((tr, idx) => (
        <AlbumTracksDisplay key={`album-${idx}`} result={typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result)} />
      ))}

      {/* Display action results as status cards */}
      {actionResults.length > 0 && (
        <div className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Music size={12} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Actions Performed
            </span>
          </div>
          <div className="p-3 space-y-2">
            {actionResults.map((tr, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {tr.tool.includes('play') ? <Play size={14} className="text-primary" /> :
                   tr.tool.includes('pause') ? <Pause size={14} className="text-primary" /> :
                   tr.tool.includes('skip') || tr.tool.includes('Next') || tr.tool.includes('Previous') ? <SkipForward size={14} className="text-primary" /> :
                   <Music size={14} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {tr.tool.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {typeof tr.result === 'string' ? tr.result.slice(0, 50) : 'Done'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Other results */}
      {otherResults.length > 0 && (
        <div className="bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center">
              <Sparkles size={12} className="text-gray-400" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Results
            </span>
          </div>
          <div className="p-3 space-y-2">
            {otherResults.map((tr, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-lg bg-white/5"
              >
                <div className="text-sm font-medium text-white mb-1">
                  {tr.tool.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-xs text-gray-500 whitespace-pre-wrap break-words">
                  {typeof tr.result === 'string' ? tr.result.slice(0, 200) : JSON.stringify(tr.result).slice(0, 200)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

