'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Loader2,
  Music2,
  Play,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayback } from '@/lib/playback-context';

interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  duration: string;
  uri: string;
  addedAt?: string;
}

interface PlaylistInfo {
  name: string;
  description: string;
  trackCount: number;
  owner: string;
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = params.id as string;
  const { play } = usePlayback();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function fetchPlaylistTracks() {
      try {
        const response = await fetch(
          `/api/spotify/getPlaylistTracks?playlistId=${playlistId}&limit=50&offset=${offset}`
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch playlist tracks');
        }

        const data = result.data;
        let parsedTracks: Track[] = [];

        if (typeof data === 'string') {
          // Parse markdown response
          // Extract playlist name from header
          const nameMatch = data.match(/# Tracks in "([^"]+)"/);
          if (nameMatch && !playlistInfo) {
            setPlaylistInfo({
              name: nameMatch[1],
              description: '',
              trackCount: 0,
              owner: '',
            });
          }

          // Parse tracks
          const trackMatches = data.matchAll(
            /(\d+)\.\s*\*\*([^*]+)\*\*[^]*?Artist:\s*([^\n]+)[^]*?Album:\s*([^\n]+)[^]*?Duration:\s*([^\n]+)[^]*?ID:\s*([^\n]+)/g
          );

          for (const match of trackMatches) {
            parsedTracks.push({
              id: match[6]?.trim() || '',
              name: match[2]?.trim() || 'Unknown Track',
              artists: match[3]?.trim() || 'Unknown Artist',
              album: match[4]?.trim() || 'Unknown Album',
              duration: match[5]?.trim() || '0:00',
              uri: `spotify:track:${match[6]?.trim()}`,
            });
          }

          // Check for pagination info
          if (data.includes('Showing') && data.includes('of')) {
            const totalMatch = data.match(/of (\d+)/);
            const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
            setHasMore(offset + parsedTracks.length < total);
          } else {
            setHasMore(parsedTracks.length === 50);
          }
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
        console.error('Error fetching playlist tracks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tracks');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylistTracks();
  }, [playlistId, offset, playlistInfo]);

  const handlePlayTrack = async (track: Track) => {
    await play(track.uri);
  };

  const handleAddToQueue = async (track: Track) => {
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
        <Link href="/playlists">
          <Button variant="outline">Back to Playlists</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/playlists">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {playlistInfo?.name || 'Playlist'}
          </h1>
          <p className="text-white/60">{tracks.length} tracks loaded</p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Music2 className="h-16 w-16 text-white/20" />
          <p className="text-white/60">No tracks in this playlist</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-sm text-white/60 border-b border-white/10">
            <span className="w-8">#</span>
            <span>Title</span>
            <span>Album</span>
            <span className="flex items-center">
              <Clock className="h-4 w-4" />
            </span>
          </div>

          {/* Tracks */}
          {tracks.map((track, index) => (
            <div
              key={`${track.id}-${index}`}
              className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 hover:bg-white/5 rounded-lg group items-center"
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
