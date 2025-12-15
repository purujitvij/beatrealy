'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePlayback, Track } from '@/lib/playback-context';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Heart, Shuffle, Repeat, ListMusic, Mic2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const coverChill = '/neon_gradient_album_art_for_chill_vibes.png';

// UI-friendly track type used by the player
type UITrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number;
};

const PLACEHOLDER_TRACK: UITrack = {
  id: 'placeholder',
  title: 'Select a vibe',
  artist: 'Moodify AI',
  album: 'Moodify',
  cover: coverChill,
  duration: 0,
};

// Transform playback context Track to UI-friendly format
function toUITrack(track: Track | null): UITrack | null {
  if (!track) return null;
  return {
    id: track.id,
    title: track.name,
    artist: track.artists,
    album: track.album,
    cover: track.albumArt || coverChill,
    duration: track.duration_ms / 1000,
  };
}

export function MusicPlayer() {
  const pathname = usePathname();
  const { currentTrack, isPlaying, play, pause, next, previous, progress, volume, setVolume, seek } = usePlayback();
  const [isMuted, setIsMuted] = React.useState(false);
  const [prevVolume, setPrevVolume] = React.useState(0.8);
  const [isLiked, setIsLiked] = React.useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = React.useState(false);

  // Hide on chat page (it has its own sidebar player)
  if (pathname === '/chat') return null;

  const uiTrack = toUITrack(currentTrack);
  const displayTrack = uiTrack || PLACEHOLDER_TRACK;
  const isPlaceholder = !uiTrack;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (val: number[]) => {
    const newVolume = val[0] / 100;
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-[#181818]/95 backdrop-blur-2xl border-t border-white/5" />

      {/* Gradient Glow when playing */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative h-[90px] px-4 flex items-center justify-between gap-4">
        {/* Left Section - Track Info */}
        <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
          {/* Album Art */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "relative h-14 w-14 rounded-md shadow-xl overflow-hidden group cursor-pointer",
              isPlaceholder && "opacity-50 grayscale"
            )}
          >
            <Image
              src={displayTrack.cover}
              alt={displayTrack.album}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                isPlaying && "scale-110"
              )}
            />

            {/* Expand Icon on Hover */}
            {!isPlaceholder && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={18} className="text-white" />
              </div>
            )}
          </motion.div>

          {/* Track Details */}
          <div className="flex flex-col justify-center overflow-hidden">
            <motion.h4
              key={displayTrack.title}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-sm font-semibold text-white hover:underline cursor-pointer truncate pr-2",
                isPlaying && "text-primary"
              )}
            >
              {displayTrack.title}
            </motion.h4>
            <span className="text-xs text-gray-400 hover:text-white hover:underline cursor-pointer transition-colors truncate">
              {displayTrack.artist}
            </span>
          </div>

          {/* Like Button */}
          {!isPlaceholder && (
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                "hidden md:flex transition-colors ml-2",
                isLiked ? "text-primary" : "text-gray-400 hover:text-white"
              )}
            >
              <Heart size={18} className={cn(isLiked && "fill-current")} />
            </motion.button>
          )}

          {/* Waveform Animation */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="hidden lg:flex items-end gap-[3px] h-5 ml-4"
              >
                {[1, 2, 3, 4, 5].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-[3px] bg-primary rounded-full"
                    animate={{
                      height: ['20%', '100%', '60%', '80%', '40%', '90%', '20%']
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: bar * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center Section - Controls & Progress */}
        <div className="flex flex-col items-center flex-1 max-w-[722px] gap-2">
          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            {/* Shuffle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="hidden sm:flex text-gray-400 hover:text-white transition-colors"
            >
              <Shuffle size={18} />
            </motion.button>

            {/* Previous */}
            <motion.button
              onClick={previous}
              disabled={isPlaceholder}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipBack size={22} className="fill-current" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              onClick={() => isPlaceholder ? null : (isPlaying ? pause() : play())}
              disabled={isPlaceholder}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                isPlaying
                  ? "bg-primary text-black hover:bg-green-400"
                  : "bg-white text-black hover:scale-110"
              )}
            >
              {isPlaying ? (
                <Pause size={20} className="fill-current" />
              ) : (
                <Play size={20} className="fill-current ml-0.5" />
              )}
            </motion.button>

            {/* Next */}
            <motion.button
              onClick={next}
              disabled={isPlaceholder}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward size={22} className="fill-current" />
            </motion.button>

            {/* Repeat */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="hidden sm:flex text-gray-400 hover:text-white transition-colors"
            >
              <Repeat size={18} />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 w-full group">
            <span className="text-[11px] text-gray-500 w-10 text-right font-mono tabular-nums">
              {formatTime(progress)}
            </span>

            <div className="flex-1 relative h-1 bg-white/20 rounded-full overflow-visible group-hover:h-1.5 transition-all cursor-pointer">
              {/* Progress Fill */}
              <motion.div
                className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-primary transition-colors"
                style={{ width: `${displayTrack.duration ? (progress / displayTrack.duration) * 100 : 0}%` }}
              />

              {/* Thumb */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${displayTrack.duration ? (progress / displayTrack.duration) * 100 : 0}% - 6px)` }}
              />

              {/* Slider Input */}
              <Slider
                value={[progress]}
                max={displayTrack.duration || 100}
                step={1}
                disabled={isPlaceholder}
                onValueChange={(val) => seek(val[0])}
                className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            <span className="text-[11px] text-gray-500 w-10 font-mono tabular-nums">
              {formatTime(displayTrack.duration)}
            </span>
          </div>
        </div>

        {/* Right Section - Volume & Extra Controls */}
        <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
          {/* Now Playing View */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="hidden md:flex text-gray-400 hover:text-white transition-colors"
          >
            <Mic2 size={18} />
          </motion.button>

          {/* Queue */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="hidden md:flex text-gray-400 hover:text-white transition-colors"
          >
            <ListMusic size={18} />
          </motion.button>

          {/* Volume Control */}
          <div
            className="flex items-center gap-2 group"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <motion.button
              onClick={handleMuteToggle}
              whileHover={{ scale: 1.1 }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </motion.button>

            <div className="w-24 relative h-1 bg-white/20 rounded-full overflow-visible group-hover:bg-white/30 transition-all">
              {/* Volume Fill */}
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-primary transition-colors"
                style={{ width: `${volume * 100}%` }}
              />

              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${volume * 100}% - 6px)` }}
              />

              {/* Slider */}
              <Slider
                value={[volume * 100]}
                max={100}
                onValueChange={handleVolumeChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Fullscreen */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Maximize2 size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Animated Waveform Component for reuse
export function Waveform({ isPlaying, barCount = 5, className }: { isPlaying: boolean; barCount?: number; className?: string }) {
  if (!isPlaying) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("flex items-end gap-[2px] h-4", className)}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-primary rounded-full"
          animate={{
            height: ['30%', '100%', '50%', '80%', '30%']
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  );
}
