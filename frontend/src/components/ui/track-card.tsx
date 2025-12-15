'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, MoreHorizontal, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Track } from '@/lib/playback-context';

const defaultAlbumArt = '/neon_gradient_album_art_for_chill_vibes.png';

interface TrackCardProps {
  track: Track;
  index?: number;
  isPlaying?: boolean;
  isCurrentTrack?: boolean;
  onPlay?: (track: Track) => void;
  onLike?: (track: Track) => void;
  showAlbumArt?: boolean;
  showIndex?: boolean;
  className?: string;
}

export function TrackCard({
  track,
  index,
  isPlaying = false,
  isCurrentTrack = false,
  onPlay,
  onLike,
  showAlbumArt = true,
  showIndex = true,
  className,
}: TrackCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isActive = isCurrentTrack && isPlaying;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index ? index * 0.05 : 0 }}
      onClick={() => onPlay?.(track)}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all group",
        isCurrentTrack ? "bg-white/10" : "hover:bg-white/5",
        className
      )}
    >
      {/* Index or Play Icon */}
      {showIndex && (
        <div className="w-8 flex items-center justify-center text-sm font-medium text-gray-500">
          {isActive ? (
            <Waveform />
          ) : (
            <>
              <span className="group-hover:hidden">{index !== undefined ? index + 1 : '—'}</span>
              <Play size={14} className="hidden group-hover:block text-white fill-current" />
            </>
          )}
        </div>
      )}

      {/* Album Art */}
      {showAlbumArt && (
        <div className="relative w-10 h-10 rounded overflow-hidden shadow-md flex-shrink-0">
          {track.albumArt ? (
            <Image src={track.albumArt} alt={track.album} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <Music size={16} className="text-gray-500" />
            </div>
          )}
          {!showIndex && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              {isActive ? (
                <Pause size={16} className="text-white fill-current" />
              ) : (
                <Play size={16} className="text-white fill-current ml-0.5" />
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          "text-sm font-medium truncate transition-colors",
          isCurrentTrack ? "text-primary" : "text-white"
        )}>
          {track.name}
        </h4>
        <p className="text-xs text-gray-400 truncate">
          {track.artists}
          {track.album && <span className="text-gray-500"> • {track.album}</span>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Like Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(track);
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-all"
        >
          <Heart size={16} />
        </motion.button>

        {/* Duration */}
        <span className="text-xs text-gray-500 font-mono w-12 text-right">
          {formatDuration(track.duration_ms / 1000)}
        </span>

        {/* More Options */}
        <motion.button
          onClick={(e) => e.stopPropagation()}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
        >
          <MoreHorizontal size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Mini waveform for playing indicator
function Waveform() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3].map((bar) => (
        <motion.div
          key={bar}
          className="w-1 bg-primary rounded-full"
          animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: bar * 0.1
          }}
        />
      ))}
    </div>
  );
}

// Large Track Card for featured tracks
export function TrackCardLarge({
  track,
  isPlaying = false,
  isCurrentTrack = false,
  onPlay,
  onLike,
  className,
}: Omit<TrackCardProps, 'index' | 'showAlbumArt' | 'showIndex'>) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isActive = isCurrentTrack && isPlaying;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => onPlay?.(track)}
      className={cn(
        "relative p-4 rounded-xl cursor-pointer transition-all group overflow-hidden",
        isCurrentTrack ? "bg-primary/10 border border-primary/20" : "bg-[#181818] hover:bg-[#282828]",
        className
      )}
    >
      {/* Background Gradient on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative flex gap-4">
        {/* Album Art */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden shadow-xl flex-shrink-0">
          {track.albumArt ? (
            <Image src={track.albumArt} alt={track.album} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <Music size={24} className="text-gray-500" />
            </div>
          )}

          {/* Play Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center"
          >
            {isActive ? (
              <Pause size={24} className="text-white fill-current" />
            ) : (
              <Play size={24} className="text-white fill-current ml-0.5" />
            )}
          </motion.div>

          {/* Playing Indicator */}
          {isActive && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <Waveform />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className={cn(
            "text-lg font-bold truncate transition-colors",
            isCurrentTrack ? "text-primary" : "text-white"
          )}>
            {track.name}
          </h3>
          <p className="text-sm text-gray-400 truncate mb-2">{track.artists}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{track.album}</span>
            <span>•</span>
            <span>{formatDuration(track.duration_ms / 1000)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(track);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full text-gray-400 hover:text-primary transition-colors"
          >
            <Heart size={20} />
          </motion.button>

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.(track);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-3 rounded-full transition-all shadow-lg",
              isActive ? "bg-primary text-black" : "bg-white text-black"
            )}
          >
            {isActive ? (
              <Pause size={20} className="fill-current" />
            ) : (
              <Play size={20} className="fill-current ml-0.5" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
