import type { SpotifyApi, MaxInt } from '@spotify/web-api-ts-sdk';

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

function isTrack(item: any): boolean {
  return (
    item &&
    item.type === 'track' &&
    Array.isArray(item.artists) &&
    item.album &&
    typeof item.album.name === 'string'
  );
}

// Tool implementations that work with a provided SpotifyApi instance
const toolHandlers: Record<string, (api: SpotifyApi, args: Record<string, unknown>) => Promise<ToolResult>> = {
  // ============================================
  // Read Tools
  // ============================================

  async getNowPlaying(api, _args) {
    const currentTrack = await api.player.getCurrentlyPlayingTrack();

    if (!currentTrack?.item) {
      return {
        content: [{ type: 'text', text: 'Nothing is currently playing on Spotify' }],
      };
    }

    const item = currentTrack.item as any;

    if (!isTrack(item)) {
      return {
        content: [{ type: 'text', text: 'Currently playing item is not a track (might be a podcast episode)' }],
      };
    }

    const artists = item.artists.map((a: any) => a.name).join(', ');
    const album = item.album.name;
    const albumArt = item.album.images?.[0]?.url || null;
    const duration = formatDuration(item.duration_ms);
    const progress = formatDuration(currentTrack.progress_ms || 0);
    const isPlaying = currentTrack.is_playing;

    return {
      content: [{
        type: 'text',
        text:
          `# Currently ${isPlaying ? 'Playing' : 'Paused'}\n\n` +
          `**Track**: "${item.name}"\n` +
          `**Artist**: ${artists}\n` +
          `**Album**: ${album}\n` +
          `**AlbumArt**: ${albumArt || 'N/A'}\n` +
          `**Progress**: ${progress} / ${duration}\n` +
          `**ID**: ${item.id}`,
      }],
    };
  },

  async searchSpotify(api, args) {
    const query = args.query as string;
    const type = args.type as 'track' | 'album' | 'artist' | 'playlist';
    const limit = (args.limit as number) || 10;

    const results = await api.search(query, [type], undefined, limit as MaxInt<50>);

    let formattedResults = '';

    if (type === 'track' && results?.tracks) {
      formattedResults = results.tracks.items
        .map((track, i) => {
          const artists = track.artists.map((a) => a.name).join(', ');
          const duration = formatDuration(track.duration_ms);
          return `${i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id}`;
        })
        .join('\n');
    } else if (type === 'album' && results?.albums) {
      formattedResults = results.albums.items
        .map((album, i) => {
          const artists = album.artists.map((a) => a.name).join(', ');
          return `${i + 1}. "${album.name}" by ${artists} - ID: ${album.id}`;
        })
        .join('\n');
    } else if (type === 'artist' && results?.artists) {
      formattedResults = results.artists.items
        .map((artist, i) => `${i + 1}. ${artist.name} - ID: ${artist.id}`)
        .join('\n');
    } else if (type === 'playlist' && results?.playlists) {
      formattedResults = results.playlists.items
        .map((playlist, i) => `${i + 1}. "${playlist?.name ?? 'Unknown'}" by ${playlist?.owner?.display_name} - ID: ${playlist?.id}`)
        .join('\n');
    }

    return {
      content: [{
        type: 'text',
        text: formattedResults.length > 0
          ? `# Search results for "${query}" (type: ${type})\n\n${formattedResults}`
          : `No ${type} results found for "${query}"`,
      }],
    };
  },

  async getMyPlaylists(api, args) {
    const limit = (args.limit as number) || 50;
    const playlists = await api.currentUser.playlists.playlists(limit as MaxInt<50>);

    if (!playlists || playlists.items.length === 0) {
      return {
        content: [{ type: 'text', text: "You don't have any playlists on Spotify" }],
      };
    }

    const formattedPlaylists = playlists.items
      .map((playlist, i) => {
        const tracksTotal = playlist.tracks?.total || 0;
        return `${i + 1}. "${playlist.name}" (${tracksTotal} tracks) - ID: ${playlist.id}`;
      })
      .join('\n');

    return {
      content: [{ type: 'text', text: `# Your Spotify Playlists\n\n${formattedPlaylists}` }],
    };
  },

  async getPlaylistTracks(api, args) {
    const playlistId = args.playlistId as string;
    const limit = (args.limit as number) || 50;
    const offset = (args.offset as number) || 0;

    const playlistTracks = await api.playlists.getPlaylistItems(
      playlistId, undefined, undefined, limit as MaxInt<50>, offset
    );

    if (!playlistTracks || (playlistTracks.items?.length ?? 0) === 0) {
      return {
        content: [{ type: 'text', text: "This playlist doesn't have any tracks" }],
      };
    }

    const formattedTracks = playlistTracks.items
      .map((item, i) => {
        const track = item.track as any;
        if (!track) return `${offset + i + 1}. [Removed track]`;
        if (isTrack(track)) {
          const artists = track.artists.map((a: any) => a.name).join(', ');
          const duration = formatDuration(track.duration_ms);
          return `${offset + i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id}`;
        }
        return `${offset + i + 1}. Unknown item`;
      })
      .join('\n');

    return {
      content: [{
        type: 'text',
        text: `# Tracks in Playlist (${offset + 1}-${offset + playlistTracks.items.length} of ${playlistTracks.total})\n\n${formattedTracks}`,
      }],
    };
  },

  async getRecentlyPlayed(api, args) {
    const limit = (args.limit as number) || 50;
    const history = await api.player.getRecentlyPlayedTracks(limit as MaxInt<50>);

    if (!history || history.items.length === 0) {
      return {
        content: [{ type: 'text', text: "You don't have any recently played tracks" }],
      };
    }

    const formattedHistory = history.items
      .map((item, i) => {
        const track = item.track as any;
        if (!track) return `${i + 1}. [Removed track]`;
        if (isTrack(track)) {
          const artists = track.artists.map((a: any) => a.name).join(', ');
          const duration = formatDuration(track.duration_ms);
          const playedAt = item.played_at ? new Date(item.played_at).toLocaleString() : 'Unknown time';
          return `${i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id} - Played at: ${playedAt}`;
        }
        return `${i + 1}. Unknown item`;
      })
      .join('\n');

    return {
      content: [{ type: 'text', text: `# Recently Played Tracks\n\n${formattedHistory}` }],
    };
  },

  async getUsersSavedTracks(api, args) {
    const limit = (args.limit as number) || 50;
    const offset = (args.offset as number) || 0;

    const savedTracks = await api.currentUser.tracks.savedTracks(limit as MaxInt<50>, offset);

    if (!savedTracks || savedTracks.items.length === 0) {
      return {
        content: [{ type: 'text', text: "You don't have any saved tracks" }],
      };
    }

    const formattedTracks = savedTracks.items
      .map((item, i) => {
        const track = item.track as any;
        if (!track) return `${i + 1}. [Removed track]`;
        if (isTrack(track)) {
          const artists = track.artists.map((a: any) => a.name).join(', ');
          const duration = formatDuration(track.duration_ms);
          const addedDate = new Date(item.added_at).toLocaleDateString();
          return `${offset + i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id} - Added: ${addedDate}`;
        }
        return `${i + 1}. Unknown item`;
      })
      .join('\n');

    return {
      content: [{
        type: 'text',
        text: `# Your Liked Songs (${offset + 1}-${offset + savedTracks.items.length} of ${savedTracks.total})\n\n${formattedTracks}`,
      }],
    };
  },

  async getQueue(api, args) {
    const limit = (args.limit as number) || 10;
    const queue = await api.player.getUsersQueue() as any;

    const current = queue?.currently_playing;
    const upcoming = (queue?.queue ?? []) as any[];

    let currentText = 'Nothing is currently playing';
    if (current) {
      const name = current?.name ?? 'Unknown';
      const artists = Array.isArray(current?.artists)
        ? current.artists.map((a: any) => a.name).join(', ')
        : 'Unknown';
      const duration = typeof current?.duration_ms === 'number'
        ? formatDuration(current.duration_ms)
        : 'Unknown';
      currentText = `Currently Playing: "${name}" by ${artists} (${duration})`;
    }

    if (upcoming.length === 0) {
      return {
        content: [{ type: 'text', text: `# Spotify Queue\n\n${currentText}\n\nNo upcoming items in the queue` }],
      };
    }

    const toShow = upcoming.slice(0, limit);
    const formatted = toShow
      .map((track, i) => {
        const name = track?.name ?? 'Unknown';
        const artists = Array.isArray(track?.artists)
          ? track.artists.map((a: any) => a.name).join(', ')
          : 'Unknown';
        const duration = typeof track?.duration_ms === 'number'
          ? formatDuration(track.duration_ms)
          : 'Unknown';
        return `${i + 1}. "${name}" by ${artists} (${duration}) - ID: ${track?.id ?? 'Unknown'}`;
      })
      .join('\n');

    return {
      content: [{ type: 'text', text: `# Spotify Queue\n\n${currentText}\n\nNext ${toShow.length} in queue:\n\n${formatted}` }],
    };
  },

  // ============================================
  // Action Tools
  // ============================================

  async playMusic(api, args) {
    const uri = args.uri as string | undefined;
    const type = args.type as string | undefined;
    const id = args.id as string | undefined;
    const deviceId = (args.deviceId as string) || '';

    if (!(uri || (type && id))) {
      return {
        content: [{ type: 'text', text: 'Error: Must provide either a URI or both a type and ID' }],
      };
    }

    let spotifyUri = uri;
    if (!spotifyUri && type && id) {
      spotifyUri = `spotify:${type}:${id}`;
    }

    if (!spotifyUri) {
      await api.player.startResumePlayback(deviceId);
    } else if (type === 'track') {
      await api.player.startResumePlayback(deviceId, undefined, [spotifyUri]);
    } else {
      await api.player.startResumePlayback(deviceId, spotifyUri);
    }

    return {
      content: [{ type: 'text', text: `Started playing ${type || 'music'} ${id ? `(ID: ${id})` : ''}` }],
    };
  },

  async pausePlayback(api, args) {
    const deviceId = (args.deviceId as string) || '';
    await api.player.pausePlayback(deviceId);
    return { content: [{ type: 'text', text: 'Playback paused' }] };
  },

  async resumePlayback(api, args) {
    const deviceId = (args.deviceId as string) || '';
    await api.player.startResumePlayback(deviceId);
    return { content: [{ type: 'text', text: 'Playback resumed' }] };
  },

  async skipToNext(api, args) {
    const deviceId = (args.deviceId as string) || '';
    await api.player.skipToNext(deviceId);
    return { content: [{ type: 'text', text: 'Skipped to next track' }] };
  },

  async skipToPrevious(api, args) {
    const deviceId = (args.deviceId as string) || '';
    await api.player.skipToPrevious(deviceId);
    return { content: [{ type: 'text', text: 'Skipped to previous track' }] };
  },

  async setPlaybackVolume(api, args) {
    const volumePercent = args.volume_percent as number;
    const deviceId = (args.deviceId as string) || '';
    await api.player.setPlaybackVolume(volumePercent, deviceId);
    return { content: [{ type: 'text', text: `Volume set to ${volumePercent}%` }] };
  },

  async seekToPosition(api, args) {
    const positionMs = args.position_ms as number;
    const deviceId = (args.deviceId as string) || '';
    await api.player.seekToPosition(positionMs, deviceId);
    const seconds = Math.floor(positionMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { content: [{ type: 'text', text: `Seeked to ${minutes}:${secs.toString().padStart(2, '0')}` }] };
  },

  async createPlaylist(api, args) {
    const name = args.name as string;
    const description = args.description as string | undefined;
    const isPublic = (args.public as boolean) ?? false;

    const me = await api.currentUser.profile();
    const result = await api.playlists.createPlaylist(me.id, { name, description, public: isPublic });

    return {
      content: [{ type: 'text', text: `Successfully created playlist "${name}"\nPlaylist ID: ${result.id}` }],
    };
  },

  async addTracksToPlaylist(api, args) {
    const playlistId = args.playlistId as string;
    const trackIds = args.trackIds as string[];
    const position = args.position as number | undefined;

    if (!trackIds || trackIds.length === 0) {
      return { content: [{ type: 'text', text: 'Error: No track IDs provided' }] };
    }

    const trackUris = trackIds.map((id) => `spotify:track:${id}`);
    await api.playlists.addItemsToPlaylist(playlistId, trackUris, position);

    return {
      content: [{
        type: 'text',
        text: `Successfully added ${trackIds.length} track${trackIds.length === 1 ? '' : 's'} to playlist (ID: ${playlistId})`,
      }],
    };
  },

  async addToQueue(api, args) {
    const uri = args.uri as string | undefined;
    const type = args.type as string | undefined;
    const id = args.id as string | undefined;
    const deviceId = (args.deviceId as string) || '';

    let spotifyUri = uri;
    if (!spotifyUri && type && id) {
      spotifyUri = `spotify:${type}:${id}`;
    }

    if (!spotifyUri) {
      return { content: [{ type: 'text', text: 'Error: Must provide either a URI or both a type and ID' }] };
    }

    await api.player.addItemToPlaybackQueue(spotifyUri, deviceId);
    return { content: [{ type: 'text', text: `Added item ${spotifyUri} to queue` }] };
  },
};

/**
 * Execute a tool with a provided SpotifyApi instance (for multi-user support)
 */
export async function executeToolWithApi(
  toolName: string,
  args: Record<string, unknown>,
  spotifyApi: SpotifyApi
): Promise<ToolResult> {
  const handler = toolHandlers[toolName];

  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
    };
  }

  try {
    return await handler(spotifyApi, args);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error executing ${toolName}: ${errorMessage}` }],
    };
  }
}
