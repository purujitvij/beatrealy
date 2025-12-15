'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Heart, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaylistCardProps {
  title: string;
  description: string;
  image: string;
  tags?: string[];
  trackCount?: number;
  onPlay?: () => void;
  onLike?: () => void;
  className?: string;
}

export function PlaylistCard({
  title,
  description,
  image,
  tags = [],
  trackCount,
  onPlay,
  onLike,
  className,
}: PlaylistCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden",
        className
      )}
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Album Art Container */}
      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg shadow-xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300" />

        {/* Play Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-3 right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl shadow-primary/40"
        >
          <Play className="text-black fill-current ml-0.5" size={22} />
        </motion.button>

        {/* Track Count Badge */}
        {trackCount && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {trackCount} tracks
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-bold text-white text-base mb-1 truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] uppercase font-bold tracking-wider bg-white/10 text-gray-300 px-2.5 py-1 rounded-full border border-white/5 hover:bg-white/20 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons - Appear on hover */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {onLike && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-black/60 backdrop-blur-sm rounded-full text-gray-300 hover:text-primary transition-colors"
          >
            <Heart size={16} />
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 bg-black/60 backdrop-blur-sm rounded-full text-gray-300 hover:text-white transition-colors"
        >
          <MoreHorizontal size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Compact version for smaller displays
export function PlaylistCardCompact({
  title,
  description,
  image,
  onPlay,
  className,
}: Omit<PlaylistCardProps, 'tags' | 'trackCount' | 'onLike'>) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group",
        className
      )}
    >
      {/* Album Art */}
      <div className="relative w-12 h-12 rounded-md overflow-hidden shadow-lg flex-shrink-0">
        <Image src={image} alt={title} fill className="object-cover" />
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <Play size={16} className="text-white fill-current" />
        </motion.div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>

      {/* Play Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onPlay?.();
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-full opacity-0 group-hover:opacity-100 text-white hover:text-primary transition-all"
      >
        <Play size={18} className="fill-current" />
      </motion.button>
    </motion.div>
  );
}
