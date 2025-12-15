'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListMusic, Loader2, Music2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Playlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  trackCount: number;
  owner: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const response = await fetch('/api/spotify/getMyPlaylists?limit=50');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch playlists');
        }

        // Parse the response data
        const data = result.data;
        let parsedPlaylists: Playlist[] = [];

        if (typeof data === 'string') {
          // Parse markdown response
          const playlistMatches = data.matchAll(
            /(\d+)\.\s*\*\*([^*]+)\*\*[^]*?Tracks:\s*(\d+)[^]*?Owner:\s*([^\n]+)[^]*?ID:\s*([^\n]+)/g
          );

          for (const match of playlistMatches) {
            parsedPlaylists.push({
              id: match[5]?.trim() || '',
              name: match[2]?.trim() || 'Unknown Playlist',
              description: '',
              imageUrl: null,
              trackCount: parseInt(match[3], 10) || 0,
              owner: match[4]?.trim() || 'Unknown',
            });
          }
        } else if (Array.isArray(data)) {
          parsedPlaylists = data;
        }

        setPlaylists(parsedPlaylists);
        setError(null);
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylists();
  }, []);

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
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <ListMusic className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
          <p className="text-white/60">{playlists.length} playlists</p>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <ListMusic className="h-16 w-16 text-white/20" />
          <p className="text-white/60">No playlists found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-square rounded-md bg-white/10 mb-4 flex items-center justify-center overflow-hidden">
                    {playlist.imageUrl ? (
                      <img
                        src={playlist.imageUrl}
                        alt={playlist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Music2 className="h-12 w-12 text-white/30" />
                    )}
                  </div>
                  <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                  <p className="text-sm text-white/60 truncate">
                    {playlist.trackCount} tracks • {playlist.owner}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
