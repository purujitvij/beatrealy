import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { albumTools } from './albums.js';
import { playTools } from './play.js';
import { readTools } from './read.js';
import {
  loadSpotifyConfig,
} from './utils.js';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a new MCP server instance for each connection
function createMcpServer() {
  const server = new McpServer({
    name: 'spotify-controller',
    version: '1.0.0',
  });

  [...readTools, ...playTools, ...albumTools].forEach((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  });

  return server;
}

const app = express();
app.use(cors());

// IMPORTANT: Don't use express.json() globally - it breaks MCP HTTP streaming transport
// The MCP SDK needs raw body access for /mcp endpoints
// Only parse JSON for specific routes that need it

// Store active transports by session ID
const activeTransports = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

// OAuth scopes required for all MCP tools (exported for client reference)
const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-library-read',
  'user-library-modify',
  'user-read-recently-played',
];

// HTTP Streaming MCP endpoint
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // If session ID exists, try to reuse existing transport
  if (sessionId && activeTransports.has(sessionId)) {
    const session = activeTransports.get(sessionId)!;
    try {
      await session.transport.handleRequest(req, res);
    } catch (err) {
      console.error(`Error handling request for session ${sessionId}:`, err);
      res.sendStatus(500);
    }
    return;
  }

  // Create a new session
  const newSessionId = randomUUID();
  console.log(`New HTTP streaming session: ${newSessionId}`);

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => newSessionId,
  });

  activeTransports.set(newSessionId, { transport, server });

  // Clean up on transport close
  transport.onclose = () => {
    console.log(`HTTP streaming session closed: ${newSessionId}`);
    activeTransports.delete(newSessionId);
  };

  await server.connect(transport);

  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error(`Error handling initial request for session ${newSessionId}:`, err);
    res.sendStatus(500);
  }
});

// Handle GET requests to /mcp for session status/info
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && activeTransports.has(sessionId)) {
    const session = activeTransports.get(sessionId)!;
    try {
      await session.transport.handleRequest(req, res);
    } catch (err) {
      console.error(`Error handling GET for session ${sessionId}:`, err);
      res.sendStatus(500);
    }
    return;
  }

  res.status(400).json({ error: 'No session ID provided or session not found' });
});

// Handle DELETE requests to close sessions
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && activeTransports.has(sessionId)) {
    const session = activeTransports.get(sessionId)!;
    try {
      await session.transport.handleRequest(req, res);
      activeTransports.delete(sessionId);
    } catch (err) {
      console.error(`Error handling DELETE for session ${sessionId}:`, err);
      res.sendStatus(500);
    }
    return;
  }

  res.status(400).json({ error: 'No session ID provided or session not found' });
});

// ============================================
// Swagger API Documentation
// ============================================

// Load swagger spec
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8'));

// Serve Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Spotify MCP API Docs',
}));

// Serve raw swagger JSON
app.get('/swagger.json', (req, res) => {
  res.json(swaggerDocument);
});

// ============================================
// Server Info Endpoint
// ============================================

// Home page - JSON response with server info and endpoints
app.get('/', (_req, res) => {
  let hasClientCredentials = false;

  try {
    const config = loadSpotifyConfig();
    hasClientCredentials = !!(config.clientId && config.clientSecret);
  } catch {
    // Config not found or invalid
  }

  res.json({
    name: 'Spotify MCP Server',
    version: '1.0.0',
    description: 'Multi-user stateless MCP server for Spotify integration',
    mode: 'multi-user',
    hasClientCredentials,
    note: 'This server requires clients to provide their own OAuth tokens. Handle OAuth flow in your frontend application.',
    endpoints: {
      docs: '/docs',
      swagger: '/swagger.json',
      mcp: '/mcp',
      execute: '/execute (POST with accessToken in body)',
      api: {
        description: 'REST API endpoints - require Bearer token in Authorization header',
        search: '/api/search',
        player: {
          nowPlaying: '/api/player/now-playing',
          play: '/api/player/play',
          pause: '/api/player/pause',
          resume: '/api/player/resume',
          next: '/api/player/next',
          previous: '/api/player/previous',
          volume: '/api/player/volume',
          seek: '/api/player/seek',
          queue: '/api/player/queue',
        },
        playlists: '/api/playlists',
        me: {
          tracks: '/api/me/tracks',
          recentlyPlayed: '/api/me/recently-played',
        },
      },
    },
    oauth: {
      note: 'Handle OAuth in your frontend. Required scopes listed below.',
      requiredScopes: SPOTIFY_SCOPES,
      spotifyAuthUrl: 'https://accounts.spotify.com/authorize',
      spotifyTokenUrl: 'https://accounts.spotify.com/api/token',
    },
  });
});

// ============================================
// Multi-User Token-Based Execution Endpoint
// ============================================

// Execute MCP tool with user-provided access token (for multi-user support)
app.post('/execute', express.json(), async (req, res) => {
  const { tool, args, accessToken, refreshToken } = req.body;

  if (!tool) {
    return res.status(400).json({ success: false, error: 'Tool name is required' });
  }

  if (!accessToken) {
    return res.status(401).json({ success: false, error: 'Access token is required' });
  }

  try {
    // Dynamically import SpotifyApi to create per-request instance
    const { SpotifyApi } = await import('@spotify/web-api-ts-sdk');

    // Create a Spotify API instance with the user's token
    const spotifyApi = SpotifyApi.withAccessToken(
      loadSpotifyConfig().clientId,
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshToken || '',
      }
    );

    // Import and execute the appropriate tool handler
    const { executeToolWithApi } = await import('./tool-executor.js');
    const result = await executeToolWithApi(tool, args || {}, spotifyApi);

    res.json({ success: true, data: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Execute] Error running tool ${tool}:`, error);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// ============================================
// REST API Endpoints (for React Native / Mobile Apps)
// ============================================

// Middleware to verify auth token from header (Multi-user: NO fallback to config file)
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization required',
      hint: 'Send Bearer token in Authorization header. Get token via OAuth flow in your frontend.'
    });
  }

  const accessToken = authHeader.substring(7);
  (req as any).spotifyTokens = { accessToken };
  next();
};

// Helper to create SpotifyApi from request
async function getSpotifyApiFromRequest(req: express.Request) {
  const { SpotifyApi } = await import('@spotify/web-api-ts-sdk');
  const tokens = (req as any).spotifyTokens;
  const config = loadSpotifyConfig();

  return SpotifyApi.withAccessToken(config.clientId, {
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: tokens.refreshToken || '',
  });
}

// ----- SEARCH -----
app.get('/api/search', requireAuth, express.json(), async (req, res) => {
  try {
    const { query, type, limit = 10 } = req.query;

    if (!query || !type) {
      return res.status(400).json({ success: false, error: 'query and type are required' });
    }

    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('searchSpotify', {
      query: query as string,
      type: type as string,
      limit: Number(limit)
    }, spotifyApi);

    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- NOW PLAYING -----
app.get('/api/player/now-playing', requireAuth, async (req, res) => {
  try {
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('getNowPlaying', {}, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- PLAY -----
app.post('/api/player/play', requireAuth, express.json(), async (req, res) => {
  try {
    const { uri, type, id, deviceId } = req.body;
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('playMusic', { uri, type, id, deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- PAUSE -----
app.post('/api/player/pause', requireAuth, express.json(), async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('pausePlayback', { deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- RESUME -----
app.post('/api/player/resume', requireAuth, express.json(), async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('resumePlayback', { deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- NEXT -----
app.post('/api/player/next', requireAuth, express.json(), async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('skipToNext', { deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- PREVIOUS -----
app.post('/api/player/previous', requireAuth, express.json(), async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('skipToPrevious', { deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- VOLUME -----
app.put('/api/player/volume', requireAuth, express.json(), async (req, res) => {
  try {
    const { volume_percent, deviceId } = req.body;
    if (volume_percent === undefined) {
      return res.status(400).json({ success: false, error: 'volume_percent is required' });
    }
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('setPlaybackVolume', { volume_percent, deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- SEEK -----
app.put('/api/player/seek', requireAuth, express.json(), async (req, res) => {
  try {
    const { position_ms, deviceId } = req.body;
    if (position_ms === undefined) {
      return res.status(400).json({ success: false, error: 'position_ms is required' });
    }
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('seekToPosition', { position_ms, deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- QUEUE GET -----
app.get('/api/player/queue', requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('getQueue', { limit: Number(limit) }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- QUEUE ADD -----
app.post('/api/player/queue', requireAuth, express.json(), async (req, res) => {
  try {
    const { uri, type, id, deviceId } = req.body;
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('addToQueue', { uri, type, id, deviceId }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- PLAYLISTS LIST -----
app.get('/api/playlists', requireAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('getMyPlaylists', { limit: Number(limit) }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- PLAYLIST CREATE -----
app.post('/api/playlists', requireAuth, express.json(), async (req, res) => {
  try {
    const { name, description, public: isPublic } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('createPlaylist', { name, description, public: isPublic }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- PLAYLIST TRACKS GET -----
app.get('/api/playlists/:playlistId/tracks', requireAuth, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('getPlaylistTracks', {
      playlistId,
      limit: Number(limit),
      offset: Number(offset)
    }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- PLAYLIST TRACKS ADD -----
app.post('/api/playlists/:playlistId/tracks', requireAuth, express.json(), async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { trackIds, position } = req.body;
    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({ success: false, error: 'trackIds array is required' });
    }
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('addTracksToPlaylist', { playlistId, trackIds, position }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- SAVED TRACKS (Liked Songs) -----
app.get('/api/me/tracks', requireAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('getUsersSavedTracks', {
      limit: Number(limit),
      offset: Number(offset)
    }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

// ----- RECENTLY PLAYED -----
app.get('/api/me/recently-played', requireAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const { executeToolWithApi } = await import('./tool-executor.js');
    const spotifyApi = await getSpotifyApiFromRequest(req);
    const result = await executeToolWithApi('getRecentlyPlayed', { limit: Number(limit) }, spotifyApi);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});


// ============================================
// Server Startup
// ============================================

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Spotify MCP Server listening on port ${port}`);
  console.log('Mode: Multi-user (stateless - clients provide OAuth tokens)');
  console.log('\nEndpoints:');
  console.log(`  Home:     http://localhost:${port}/`);
  console.log(`  Docs:     http://localhost:${port}/docs`);
  console.log(`  MCP:      http://localhost:${port}/mcp`);
  console.log(`  Execute:  http://localhost:${port}/execute (POST with accessToken)`);
  console.log(`  REST API: http://localhost:${port}/api/* (Bearer token required)`);
});
