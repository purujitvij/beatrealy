'use client';

import { useEffect, useState } from 'react';
import { Clock, Loader2, Music2, Play, Plus } from 'lucide-react';
import { usePlayback } from '@/lib/playback-context';

interface RecentTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  duration: string;
  uri: string;
  playedAt: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export default function RecentlyPlayedPage() {
  const { play } = usePlayback();
  const [tracks, setTracks] = useState<RecentTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentlyPlayed() {
      try {
        const response = await fetch('/api/spotify/getRecentlyPlayed?limit=50');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch recently played');
        }

        const data = result.data;
        let parsedTracks: RecentTrack[] = [];

        if (typeof data === 'string') {
          // Parse markdown response
          const trackMatches = data.matchAll(
            /(\d+)\.\s*\*\*([^*]+)\*\*[^]*?Artist:\s*([^\n]+)[^]*?Album:\s*([^\n]+)[^]*?Duration:\s*([^\n]+)[^]*?Played at:\s*([^\n]+)[^]*?ID:\s*([^\n]+)/g
          );

          for (const match of trackMatches) {
            parsedTracks.push({
              id: match[7]?.trim() || '',
              name: match[2]?.trim() || 'Unknown Track',
              artists: match[3]?.trim() || 'Unknown Artist',
              album: match[4]?.trim() || 'Unknown Album',
              duration: match[5]?.trim() || '0:00',
              playedAt: match[6]?.trim() || '',
              uri: `spotify:track:${match[7]?.trim()}`,
            });
          }
        } else if (Array.isArray(data)) {
          parsedTracks = data;
        }

        setTracks(parsedTracks);
        setError(null);
      } catch (err) {
        console.error('Error fetching recently played:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recently played');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentlyPlayed();
  }, []);

  const handlePlayTrack = async (track: RecentTrack) => {
    await play(track.uri);
  };

  const handleAddToQueue = async (track: RecentTrack) => {
    try {
      await fetch('/api/spotify/addToQueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: track.uri }),
      });
    } catch (err) {
      console.error('Error adding to queue:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Recently Played</h1>
          <p className="text-white/60">{tracks.length} tracks</p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Clock className="h-16 w-16 text-white/20" />
          <p className="text-white/60">No recently played tracks</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 text-sm text-white/60 border-b border-white/10">
            <span className="w-8">#</span>
            <span>Title</span>
            <span>Album</span>
            <span className="w-28">Played</span>
            <span className="flex items-center">
              <Clock className="h-4 w-4" />
            </span>
          </div>

          {/* Tracks */}
          {tracks.map((track, index) => (
            <div
              key={`${track.id}-${index}`}
              className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 hover:bg-white/5 rounded-lg group items-center"
            >
              <div className="w-8 flex items-center justify-center">
                <span className="text-white/60 group-hover:hidden">{index + 1}</span>
                <button
                  onClick={() => handlePlayTrack(track)}
                  className="hidden group-hover:block text-white"
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{track.name}</p>
                <p className="text-sm text-white/60 truncate">{track.artists}</p>
              </div>
              <p className="text-white/60 truncate">{track.album}</p>
              <p className="text-white/60 text-sm w-28 truncate">
                {formatRelativeTime(track.playedAt)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToQueue(track)}
                  className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-opacity"
                  title="Add to queue"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-white/60 text-sm w-12 text-right">
                  {track.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
