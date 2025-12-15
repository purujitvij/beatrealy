'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type Track = {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  duration_ms: number;
  progress_ms: number;
  uri: string;
};

type PlaybackContextType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // Current progress in seconds
  duration: number; // Total duration in seconds
  volume: number;
  isLoading: boolean;
  error: string | null;
  play: (uri?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  setVolume: (vol: number) => Promise<void>;
  seek: (time: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined
);

const POLL_INTERVAL = 5000; // Poll every 1 minute

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current playback state from Spotify via MCP
  const fetchNowPlaying = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/getNowPlaying');
      const result = await response.json();

      if (!result.success) {
        // No active playback is not an error
        if (result.error?.includes('No active playback')) {
          setCurrentTrack(null);
          setIsPlaying(false);
          return;
        }
        throw new Error(result.error || 'Failed to fetch playback state');
      }

      // Parse the response data
      const data = result.data;

      if (typeof data === 'string') {
        // Response might be markdown formatted, try to extract info
        if (data.includes('No active playback') || data.includes('Nothing is currently playing')) {
          setCurrentTrack(null);
          setIsPlaying(false);
          return;
        }

        // Parse markdown response from getNowPlaying tool
        const trackMatch = data.match(/\*\*Track\*\*:\s*"?([^"\n]+)"?/);
        const artistMatch = data.match(/\*\*Artist\*\*:\s*([^\n]+)/);
        const albumMatch = data.match(/\*\*Album\*\*:\s*([^\n]+)/);
        const albumArtMatch = data.match(/\*\*AlbumArt\*\*:\s*([^\n]+)/);
        const progressMatch = data.match(/\*\*Progress\*\*:\s*([^\s]+)\s*\/\s*([^\n]+)/);
        const idMatch = data.match(/\*\*ID\*\*:\s*([^\n]+)/);
        const playingMatch = data.includes('Currently Playing');

        if (trackMatch) {
          const albumArtUrl = albumArtMatch?.[1]?.trim();
          const track: Track = {
            id: idMatch?.[1]?.trim() || '',
            name: trackMatch[1]?.trim() || 'Unknown Track',
            artists: artistMatch?.[1]?.trim() || 'Unknown Artist',
            album: albumMatch?.[1]?.trim() || 'Unknown Album',
            albumArt: albumArtUrl && albumArtUrl !== 'N/A' ? albumArtUrl : null,
            duration_ms: parseTimeToMs(progressMatch?.[2]?.trim() || '0:00'),
            progress_ms: parseTimeToMs(progressMatch?.[1]?.trim() || '0:00'),
            uri: idMatch?.[1] ? `spotify:track:${idMatch[1].trim()}` : '',
          };

          setCurrentTrack(track);
          setIsPlaying(playingMatch);
          setProgress(track.progress_ms / 1000);
          setDuration(track.duration_ms / 1000);
        }
      } else if (data && typeof data === 'object') {
        // Structured response
        setCurrentTrack(data as Track);
        setIsPlaying(data.is_playing ?? false);
        setProgress((data.progress_ms ?? 0) / 1000);
        setDuration((data.duration_ms ?? 0) / 1000);
      }

      setError(null);
    } catch (err) {
      console.error('[Playback] Error fetching now playing:', err);
      // Don't set error for connection issues during polling
    }
  }, []);

  // Parse time string like "2:30" to milliseconds
  function parseTimeToMs(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      return (minutes * 60 + seconds) * 1000;
    }
    return 0;
  }

  // Poll for playback state
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  // Update progress locally between polls when playing
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        return next < duration ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, duration]);

  // Play a track or resume playback
  const play = async (uri?: string) => {
    setIsLoading(true);
    try {
      if (uri) {
        // Play specific track
        const response = await fetch('/api/spotify/playMusic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri }),
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to play');
        }
      } else {
        // Resume playback
        const response = await fetch('/api/spotify/resumePlayback', {
          method: 'POST',
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to resume');
        }
      }
      setIsPlaying(true);
      setError(null);
      // Refresh state after action
      setTimeout(fetchNowPlaying, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback error');
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/spotify/pausePlayback', {
        method: 'POST',
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to pause');
      }
      setIsPlaying(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pause error');
    } finally {
      setIsLoading(false);
    }
  };

  const resume = async () => {
    await play();
  };

  const next = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/spotify/skipToNext', {
        method: 'POST',
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to skip');
      }
      setError(null);
      // Refresh state after action
      setTimeout(fetchNowPlaying, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Skip error');
    } finally {
      setIsLoading(false);
    }
  };

  const previous = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/spotify/skipToPrevious', {
        method: 'POST',
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to go to previous');
      }
      setError(null);
      // Refresh state after action
      setTimeout(fetchNowPlaying, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Previous track error');
    } finally {
      setIsLoading(false);
    }
  };

  const setVolume = async (vol: number) => {
    setVolumeState(vol);
    try {
      const volumePercent = Math.round(vol * 100);
      await fetch('/api/spotify/setPlaybackVolume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume_percent: volumePercent }),
      });
    } catch (err) {
      console.error('[Playback] Error setting volume:', err);
    }
  };

  const seek = async (time: number) => {
    setProgress(time);
    try {
      const positionMs = Math.round(time * 1000);
      await fetch('/api/spotify/seekToPosition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_ms: positionMs }),
      });
    } catch (err) {
      console.error('[Playback] Error seeking:', err);
    }
  };

  const refresh = async () => {
    await fetchNowPlaying();
  };

  return (
    <PlaybackContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        isLoading,
        error,
        play,
        pause,
        resume,
        next,
        previous,
        setVolume,
        seek,
        refresh,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
