'use client';

import { useEffect, useState } from 'react';
import {
  Clock,
  Heart,
  Loader2,
  Music2,
  Play,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayback } from '@/lib/playback-context';

interface SavedTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  duration: string;
  uri: string;
  addedAt: string;
}

export default function LikedSongsPage() {
  const { play } = usePlayback();
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalTracks, setTotalTracks] = useState(0);

  useEffect(() => {
    async function fetchLikedSongs() {
      try {
        const response = await fetch(
          `/api/spotify/getUsersSavedTracks?limit=50&offset=${offset}`
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch liked songs');
        }

        const data = result.data;
        let parsedTracks: SavedTrack[] = [];

        if (typeof data === 'string') {
          // Parse markdown response
          // Extract total from header
          const totalMatch = data.match(/Showing \d+-\d+ of (\d+)/);
          if (totalMatch) {
            setTotalTracks(parseInt(totalMatch[1], 10));
          }

          const trackMatches = data.matchAll(
            /(\d+)\.\s*\*\*([^*]+)\*\*[^]*?Artist:\s*([^\n]+)[^]*?Album:\s*([^\n]+)[^]*?Duration:\s*([^\n]+)[^]*?Added:\s*([^\n]+)[^]*?ID:\s*([^\n]+)/g
          );

          for (const match of trackMatches) {
            parsedTracks.push({
              id: match[7]?.trim() || '',
              name: match[2]?.trim() || 'Unknown Track',
              artists: match[3]?.trim() || 'Unknown Artist',
              album: match[4]?.trim() || 'Unknown Album',
              duration: match[5]?.trim() || '0:00',
              addedAt: match[6]?.trim() || '',
              uri: `spotify:track:${match[7]?.trim()}`,
            });
          }

          setHasMore(offset + parsedTracks.length < (totalMatch ? parseInt(totalMatch[1], 10) : 0));
        } else if (Array.isArray(data)) {
          parsedTracks = data;
          setHasMore(data.length === 50);
        }

        if (offset === 0) {
          setTracks(parsedTracks);
        } else {
          setTracks((prev) => [...prev, ...parsedTracks]);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching liked songs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load liked songs');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLikedSongs();
  }, [offset]);

  const handlePlayTrack = async (track: SavedTrack) => {
    await play(track.uri);
  };

  const handleAddToQueue = async (track: SavedTrack) => {
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

  const handleLoadMore = () => {
    setOffset((prev) => prev + 50);
  };

  if (isLoading && tracks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error && tracks.length === 0) {
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
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-700 to-blue-400 flex items-center justify-center">
          <Heart className="h-6 w-6 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Liked Songs</h1>
          <p className="text-white/60">
            {totalTracks > 0 ? `${totalTracks} songs` : `${tracks.length} songs loaded`}
          </p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Heart className="h-16 w-16 text-white/20" />
          <p className="text-white/60">No liked songs yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 text-sm text-white/60 border-b border-white/10">
            <span className="w-8">#</span>
            <span>Title</span>
            <span>Album</span>
            <span className="w-24">Date Added</span>
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
              <p className="text-white/60 text-sm w-24 truncate">{track.addedAt}</p>
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

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLoadMore}
                disabled={isLoading}
                variant="outline"
                className="text-white border-white/20"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
