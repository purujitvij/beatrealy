'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Disc3,
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
  duration: string;
  trackNumber: number;
  uri: string;
}

interface AlbumInfo {
  name: string;
  artists: string;
  releaseDate: string;
  totalTracks: number;
  imageUrl: string | null;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.id as string;
  const { play } = usePlayback();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [albumInfo, setAlbumInfo] = useState<AlbumInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlbumData() {
      try {
        // Fetch album info and tracks in parallel
        const [albumResponse, tracksResponse] = await Promise.all([
          fetch(`/api/spotify/getAlbums?albumIds=${albumId}`),
          fetch(`/api/spotify/getAlbumTracks?albumId=${albumId}&limit=50`),
        ]);

        const albumResult = await albumResponse.json();
        const tracksResult = await tracksResponse.json();

        // Parse album info
        if (albumResult.success && albumResult.data) {
          const data = albumResult.data;
          if (typeof data === 'string') {
            // Parse markdown response
            const nameMatch = data.match(/\*\*([^*]+)\*\*/);
            const artistMatch = data.match(/Artist:\s*([^\n]+)/);
            const releaseMatch = data.match(/Release Date:\s*([^\n]+)/);
            const tracksMatch = data.match(/Total Tracks:\s*(\d+)/);

            setAlbumInfo({
              name: nameMatch?.[1]?.trim() || 'Unknown Album',
              artists: artistMatch?.[1]?.trim() || 'Unknown Artist',
              releaseDate: releaseMatch?.[1]?.trim() || '',
              totalTracks: parseInt(tracksMatch?.[1] || '0', 10),
              imageUrl: null,
            });
          } else if (Array.isArray(data) && data.length > 0) {
            setAlbumInfo(data[0]);
          }
        }

        // Parse tracks
        if (tracksResult.success && tracksResult.data) {
          const data = tracksResult.data;
          let parsedTracks: Track[] = [];

          if (typeof data === 'string') {
            const trackMatches = data.matchAll(
              /(\d+)\.\s*\*\*([^*]+)\*\*[^]*?Artist:\s*([^\n]+)[^]*?Duration:\s*([^\n]+)[^]*?ID:\s*([^\n]+)/g
            );

            for (const match of trackMatches) {
              parsedTracks.push({
                trackNumber: parseInt(match[1], 10),
                id: match[5]?.trim() || '',
                name: match[2]?.trim() || 'Unknown Track',
                artists: match[3]?.trim() || 'Unknown Artist',
                duration: match[4]?.trim() || '0:00',
                uri: `spotify:track:${match[5]?.trim()}`,
              });
            }
          } else if (Array.isArray(data)) {
            parsedTracks = data.map((track, index) => ({
              ...track,
              trackNumber: track.trackNumber || index + 1,
              uri: track.uri || `spotify:track:${track.id}`,
            }));
          }

          setTracks(parsedTracks);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching album data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load album');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlbumData();
  }, [albumId]);

  const handlePlayTrack = async (track: Track) => {
    await play(track.uri);
  };

  const handlePlayAlbum = async () => {
    await play(`spotify:album:${albumId}`);
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
        <Link href="/albums">
          <Button variant="outline">Back to Albums</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Album Header */}
      <div className="flex items-start gap-6">
        <Link href="/albums">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white mt-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        <div className="h-48 w-48 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {albumInfo?.imageUrl ? (
            <img
              src={albumInfo.imageUrl}
              alt={albumInfo.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Disc3 className="h-20 w-20 text-white/30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/60 uppercase tracking-wider">Album</p>
          <h1 className="text-4xl font-bold text-white mt-2 truncate">
            {albumInfo?.name || 'Album'}
          </h1>
          <p className="text-lg text-white/80 mt-2">{albumInfo?.artists}</p>
          <p className="text-sm text-white/60 mt-1">
            {albumInfo?.releaseDate?.slice(0, 4)} • {tracks.length} tracks
          </p>
          <Button
            onClick={handlePlayAlbum}
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Play Album
          </Button>
        </div>
      </div>

      {/* Tracks */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Music2 className="h-16 w-16 text-white/20" />
          <p className="text-white/60">No tracks found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 text-sm text-white/60 border-b border-white/10">
            <span className="w-8">#</span>
            <span>Title</span>
            <span className="flex items-center">
              <Clock className="h-4 w-4" />
            </span>
          </div>

          {/* Tracks */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 hover:bg-white/5 rounded-lg group items-center"
            >
              <div className="w-8 flex items-center justify-center">
                <span className="text-white/60 group-hover:hidden">
                  {track.trackNumber}
                </span>
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
