'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  content: string;
  timestamp?: string;
  isTyping?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function ChatBubble({
  role,
  content,
  timestamp,
  isTyping = false,
  children,
  className,
}: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className={cn(
        "max-w-[85%] md:max-w-[600px] flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <ChatAvatar role={role} isTyping={isTyping} />

        {/* Message Content */}
        <div className="flex flex-col gap-2">
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
            {isTyping ? <TypingDots /> : content}
          </motion.div>

          {/* Timestamp */}
          {timestamp && (
            <span className={cn(
              "text-[10px] text-gray-500",
              isUser ? "text-right" : "text-left"
            )}>
              {timestamp}
            </span>
          )}

          {/* Additional Content (like playlist cards) */}
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface ChatAvatarProps {
  role: 'user' | 'ai';
  isTyping?: boolean;
}

function ChatAvatar({ role, isTyping }: ChatAvatarProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
      className={cn(
        "flex-none w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
        isUser
          ? "bg-gradient-to-br from-purple-500 to-pink-500"
          : "bg-gradient-to-br from-primary to-green-400",
        isTyping && "animate-pulse"
      )}
    >
      {isUser ? (
        <User size={18} className="text-white" />
      ) : (
        <Bot size={18} className="text-black" />
      )}
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
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
  );
}

// System message variant
export function SystemMessage({ content, icon }: { content: string; icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center py-4"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs text-gray-400">
        {icon || <Music size={12} className="text-primary" />}
        <span>{content}</span>
      </div>
    </motion.div>
  );
}

// Welcome message for chat start
export function WelcomeMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-green-400 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30"
      >
        <Music size={40} className="text-black" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-3">
        Welcome to Moodify
      </h2>
      <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
        Tell me how you're feeling and I'll create the perfect playlist for you.
        You can say anything... I'll read between the lines.
      </p>

      {/* Suggestion Pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-8">
        {[
          { text: "I'm feeling nostalgic", emoji: "✨" },
          { text: "Need some energy", emoji: "⚡" },
          { text: "Kinda sad today", emoji: "🌧️" },
          { text: "Ready to party", emoji: "🎉" },
        ].map((suggestion, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-gray-300 cursor-pointer transition-colors flex items-center gap-2"
          >
            <span>{suggestion.emoji}</span>
            {suggestion.text}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
