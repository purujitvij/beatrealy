'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Disc3, Loader2, Music2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Album {
  id: string;
  name: string;
  artists: string;
  imageUrl: string | null;
  releaseDate: string;
  totalTracks: number;
}

export default function AlbumsPage() {
  const [query, setQuery] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/spotify/searchSpotify?query=${encodeURIComponent(query)}&type=album&limit=20`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to search albums');
      }

      const data = result.data;
      let parsedAlbums: Album[] = [];

      if (typeof data === 'string') {
        // Parse markdown/JSON response
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.items) {
            parsedAlbums = jsonData.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              artists: item.artists,
              imageUrl: item.imageUrl || null,
              releaseDate: item.releaseDate || '',
              totalTracks: item.totalTracks || 0,
            }));
          }
        } catch {
          // Parse markdown format
          const albumMatches = data.matchAll(
            /(\d+)\.\s*\*\*([^*]+)\*\*[^]*?Artist:\s*([^\n]+)[^]*?Release Date:\s*([^\n]+)[^]*?Tracks:\s*(\d+)[^]*?ID:\s*([^\n]+)/g
          );

          for (const match of albumMatches) {
            parsedAlbums.push({
              id: match[6]?.trim() || '',
              name: match[2]?.trim() || 'Unknown Album',
              artists: match[3]?.trim() || 'Unknown Artist',
              imageUrl: null,
              releaseDate: match[4]?.trim() || '',
              totalTracks: parseInt(match[5], 10) || 0,
            });
          }
        }
      } else if (data?.items) {
        parsedAlbums = data.items;
      } else if (Array.isArray(data)) {
        parsedAlbums = data;
      }

      setAlbums(parsedAlbums);
    } catch (err) {
      console.error('Error searching albums:', err);
      setError(err instanceof Error ? err.message : 'Failed to search albums');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Disc3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Albums</h1>
          <p className="text-white/60">Search and explore albums</p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="text"
            placeholder="Search for albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!hasSearched ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Disc3 className="h-16 w-16 text-white/20" />
          <p className="text-white/60">Search for albums to get started</p>
        </div>
      ) : albums.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Search className="h-16 w-16 text-white/20" />
          <p className="text-white/60">No albums found for &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.map((album) => (
            <Link key={album.id} href={`/albums/${album.id}`}>
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-square rounded-md bg-white/10 mb-4 flex items-center justify-center overflow-hidden">
                    {album.imageUrl ? (
                      <img
                        src={album.imageUrl}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Music2 className="h-12 w-12 text-white/30" />
                    )}
                  </div>
                  <h3 className="font-semibold text-white truncate">{album.name}</h3>
                  <p className="text-sm text-white/60 truncate">{album.artists}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {album.releaseDate?.slice(0, 4)} • {album.totalTracks} tracks
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
