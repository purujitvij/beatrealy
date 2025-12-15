<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
<img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" width="30" height="30">
<h1>Spotify MCP Server</h1>
</div>

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that enables AI assistants like Cursor & Claude to control Spotify playback and manage playlists.

<details>
<summary>Contents</summary>

- [Project Structure](#project-structure)
  - [Directory Overview](#directory-overview)
  - [Source Files](#source-files)
  - [Configuration Files](#configuration-files)
  - [Architecture](#architecture)
- [Example Interactions](#example-interactions)
- [Tools](#tools)
  - [Read Operations](#read-operations)
  - [Album Operations](#album-operations)
  - [Play / Create Operations](#play--create-operations)
- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Creating a Spotify Developer Application](#creating-a-spotify-developer-application)
  - [Spotify API Configuration](#spotify-api-configuration)
  - [Authentication Process](#authentication-process)
- [Integrating with Claude Desktop, Cursor, and VsCode (Cline)](#integrating-with-claude-desktop-and-cursor)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
</details>

## Project Structure

### Directory Overview

```
spotify-mcp-server/
├── src/                              # TypeScript source files
│   ├── index.ts                      # Main MCP server entry point (stdio transport)
│   ├── auth.ts                       # OAuth authentication entry point
│   ├── types.ts                      # TypeScript type definitions
│   ├── utils.ts                      # Utility functions (OAuth, API helpers)
│   ├── read.ts                       # Read-only MCP tools (search, playlists, queue)
│   ├── play.ts                       # Playback & playlist creation tools
│   ├── albums.ts                     # Album management tools
│   └── sse.ts                        # HTTP/SSE transport server (alternative to stdio)
│
├── build/                            # Compiled JavaScript output (generated)
│   ├── index.js
│   ├── auth.js
│   ├── types.js
│   ├── utils.js
│   ├── read.js
│   ├── play.js
│   ├── albums.js
│   └── sse.js
│
├── .github/                          # GitHub configuration
│   ├── workflows/                    # GitHub Actions CI/CD
│   └── dependabot.yml                # Dependency update automation
│
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript compiler configuration
├── biome.jsonc                       # Biome formatter/linter configuration
├── spotify-config.example.json       # Example OAuth credentials template
├── spotify-config.json               # Your OAuth credentials (gitignored)
└── README.md                         # This documentation
```

### Source Files

| File | Description |
|------|-------------|
| **index.ts** | Main entry point. Creates the MCP server instance, registers all tools from `read.ts`, `play.ts`, and `albums.ts`, and connects via stdio transport for communication with AI clients. |
| **auth.ts** | Simple authentication script that initiates the Spotify OAuth 2.0 flow. Run via `npm run auth` to obtain access tokens. |
| **types.ts** | TypeScript type definitions including `tool<T>` for MCP tools, `SpotifyHandlerExtra` for request metadata, and Spotify data models (`SpotifyArtist`, `SpotifyAlbum`, `SpotifyTrack`). |
| **utils.ts** | Core utilities including: OAuth token management (`authorizeSpotify`, `exchangeCodeForToken`, `refreshAccessToken`), config file handling (`loadSpotifyConfig`, `saveSpotifyConfig`), Spotify API factory (`createSpotifyApi`), and error handling wrapper (`handleSpotifyRequest`). |
| **read.ts** | Read-only MCP tools: `searchSpotify`, `getNowPlaying`, `getMyPlaylists`, `getPlaylistTracks`, `getRecentlyPlayed`, `getUsersSavedTracks`, `getQueue`. These tools query Spotify data without modifying state. |
| **play.ts** | Playback control & creation tools: `playMusic`, `pausePlayback`, `skipToNext`, `skipToPrevious`, `resumePlayback`, `createPlaylist`, `addTracksToPlaylist`, `addToQueue`. |
| **albums.ts** | Album management tools: `getAlbums`, `getAlbumTracks`, `saveOrRemoveAlbumForUser`, `checkUsersSavedAlbums`. |
| **sse.ts** | Alternative HTTP transport using Server-Sent Events. Provides a web-based MCP interface on port 3000 with endpoints for SSE connections (`GET /sse`) and message routing (`POST /message/:sessionId`). |

### Configuration Files

| File | Purpose |
|------|---------|
| **package.json** | Project metadata, dependencies, and npm scripts. Defines the project as an ES module. |
| **tsconfig.json** | TypeScript compiler options: ES2022 target, Node16 module resolution, strict mode enabled, outputs to `./build`. |
| **biome.jsonc** | Code formatting (80 char lines, 2-space indent) and linting rules. Integrates with VCS for consistent code style. |
| **spotify-config.json** | Your Spotify OAuth credentials (client ID, secret, tokens). Created from the example file and gitignored for security. |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Client                                │
│              (Claude Desktop / Cursor / Cline)                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ MCP Protocol
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     Transport Layer                             │
│  ┌──────────────────────┐    ┌─────────────────────────────┐   │
│  │      index.ts        │    │         sse.ts              │   │
│  │   (stdio transport)  │    │   (HTTP/SSE transport)      │   │
│  │   Default for CLI    │    │   Alternative for web       │   │
│  └──────────────────────┘    └─────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Tool Handlers
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      Tool Modules                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   read.ts    │  │   play.ts    │  │     albums.ts        │  │
│  │  (7 tools)   │  │  (8 tools)   │  │     (4 tools)        │  │
│  │              │  │              │  │                      │  │
│  │ • search     │  │ • playMusic  │  │ • getAlbums          │  │
│  │ • nowPlaying │  │ • pause      │  │ • getAlbumTracks     │  │
│  │ • playlists  │  │ • skip       │  │ • saveOrRemove       │  │
│  │ • tracks     │  │ • resume     │  │ • checkSaved         │  │
│  │ • history    │  │ • create     │  │                      │  │
│  │ • saved      │  │ • addTracks  │  │                      │  │
│  │ • queue      │  │ • addQueue   │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ API Calls
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      utils.ts                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Spotify API Management                     │    │
│  │  • Token refresh & caching                              │    │
│  │  • OAuth flow handling                                  │    │
│  │  • Error handling wrapper                               │    │
│  │  • Config file persistence                              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ REST API
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                  Spotify Web API                                │
│              (api.spotify.com)                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tool Organization:**
- Each tool exports a `tool<Args>` object containing:
  - `name`: Tool identifier used by the MCP protocol
  - `description`: Human-readable description for AI assistants
  - `schema`: Zod validation schema for parameters
  - `handler`: Async function that executes the tool

**Transport Options:**
- **Stdio (Default)**: Direct process stdin/stdout communication - ideal for CLI integrations
- **HTTP+SSE**: Web-based connections on port 3000 - useful for browser-based or remote access

## Example Interactions

- _"Play Elvis's first song"_
- _"Create a Taylor Swift / Slipknot fusion playlist"_
- _"Copy all the techno tracks from my workout playlist to my work playlist"_

## Tools

### Read Operations

1. **searchSpotify**

   - **Description**: Search for tracks, albums, artists, or playlists on Spotify
   - **Parameters**:
     - `query` (string): The search term
     - `type` (string): Type of item to search for (track, album, artist, playlist)
     - `limit` (number, optional): Maximum number of results to return (10-50)
   - **Returns**: List of matching items with their IDs, names, and additional details
   - **Example**: `searchSpotify("bohemian rhapsody", "track", 20)`

2. **getNowPlaying**

   - **Description**: Get information about the currently playing track on Spotify
   - **Parameters**: None
   - **Returns**: Object containing track name, artist, album, playback progress, duration, and playback state
   - **Example**: `getNowPlaying()`

3. **getMyPlaylists**

   - **Description**: Get a list of the current user's playlists on Spotify
   - **Parameters**:
     - `limit` (number, optional): Maximum number of playlists to return (default: 20)
     - `offset` (number, optional): Index of the first playlist to return (default: 0)
   - **Returns**: Array of playlists with their IDs, names, track counts, and public status
   - **Example**: `getMyPlaylists(10, 0)`

4. **getPlaylistTracks**

   - **Description**: Get a list of tracks in a specific Spotify playlist
   - **Parameters**:
     - `playlistId` (string): The Spotify ID of the playlist
     - `limit` (number, optional): Maximum number of tracks to return (default: 100)
     - `offset` (number, optional): Index of the first track to return (default: 0)
   - **Returns**: Array of tracks with their IDs, names, artists, album, duration, and added date
   - **Example**: `getPlaylistTracks("37i9dQZEVXcJZyENOWUFo7")`

5. **getRecentlyPlayed**

   - **Description**: Retrieves a list of recently played tracks from Spotify.
   - **Parameters**:
     - `limit` (number, optional): A number specifying the maximum number of tracks to return.
   - **Returns**: If tracks are found it returns a formatted list of recently played tracks else a message stating: "You don't have any recently played tracks on Spotify".
   - **Example**: `getRecentlyPlayed({ limit: 10 })`

6. **getUsersSavedTracks**

   - **Description**: Get a list of tracks saved in the user's "Liked Songs" library
   - **Parameters**:
     - `limit` (number, optional): Maximum number of tracks to return (1-50, default: 50)
     - `offset` (number, optional): Offset for pagination (0-based index, default: 0)
   - **Returns**: Formatted list of saved tracks with track names, artists, duration, track IDs, and when they were added to Liked Songs. Shows pagination info (e.g., "1-20 of 150").
   - **Example**: `getUsersSavedTracks({ limit: 20, offset: 0 })`

7. **getQueue**

   - **Description**: Get the current playback queue including the currently playing track and upcoming tracks
   - **Parameters**: None
   - **Returns**: Object containing the currently playing track and a list of upcoming tracks in the queue with their names, artists, albums, durations, and IDs
   - **Example**: `getQueue()`

### Play / Create Operations

1. **playMusic**

   - **Description**: Start playing a track, album, artist, or playlist on Spotify
   - **Parameters**:
     - `uri` (string, optional): Spotify URI of the item to play (overrides type and id)
     - `type` (string, optional): Type of item to play (track, album, artist, playlist)
     - `id` (string, optional): Spotify ID of the item to play
     - `deviceId` (string, optional): ID of the device to play on
   - **Returns**: Success status
   - **Example**: `playMusic({ uri: "spotify:track:6rqhFgbbKwnb9MLmUQDhG6" })`
   - **Alternative**: `playMusic({ type: "track", id: "6rqhFgbbKwnb9MLmUQDhG6" })`

2. **pausePlayback**

   - **Description**: Pause the currently playing track on Spotify
   - **Parameters**:
     - `deviceId` (string, optional): ID of the device to pause
   - **Returns**: Success status
   - **Example**: `pausePlayback()`

3. **skipToNext**

   - **Description**: Skip to the next track in the current playback queue
   - **Parameters**:
     - `deviceId` (string, optional): ID of the device
   - **Returns**: Success status
   - **Example**: `skipToNext()`

4. **skipToPrevious**

   - **Description**: Skip to the previous track in the current playback queue
   - **Parameters**:
     - `deviceId` (string, optional): ID of the device
   - **Returns**: Success status
   - **Example**: `skipToPrevious()`

5. **resumePlayback**

   - **Description**: Resume playback on the current or specified device
   - **Parameters**:
     - `deviceId` (string, optional): ID of the device to resume playback on
   - **Returns**: Success status
   - **Example**: `resumePlayback()`

6. **createPlaylist**

   - **Description**: Create a new playlist on Spotify
   - **Parameters**:
     - `name` (string): Name for the new playlist
     - `description` (string, optional): Description for the playlist
     - `public` (boolean, optional): Whether the playlist should be public (default: false)
   - **Returns**: Object with the new playlist's ID and URL
   - **Example**: `createPlaylist({ name: "Workout Mix", description: "Songs to get pumped up", public: false })`

7. **addTracksToPlaylist**

   - **Description**: Add tracks to an existing Spotify playlist
   - **Parameters**:
     - `playlistId` (string): ID of the playlist
     - `trackUris` (array): Array of track URIs or IDs to add
     - `position` (number, optional): Position to insert tracks
   - **Returns**: Success status and snapshot ID
   - **Example**: `addTracksToPlaylist({ playlistId: "3cEYpjA9oz9GiPac4AsH4n", trackUris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"] })`

8. **addToQueue**

   - **Description**: Adds a track, album, artist or playlist to the current playback queue
   - **Parameters**:
     - `uri` (string, optional): Spotify URI of the item to add to queue (overrides type and id)
     - `type` (string, optional): Type of item to queue (track, album, artist, playlist)
     - `id` (string, optional): Spotify ID of the item to queue
     - `deviceId` (string, optional): ID of the device to queue on
   - **Returns**: Success status
   - **Example**: `addToQueue({ uri: "spotify:track:6rqhFgbbKwnb9MLmUQDhG6" })`
   - **Alternative**: `addToQueue({ type: "track", id: "6rqhFgbbKwnb9MLmUQDhG6" })`
   

### Album Operations

1. **getAlbums**

   - **Description**: Get detailed information about one or more albums by their Spotify IDs
   - **Parameters**:
     - `albumIds` (string|array): A single album ID or array of album IDs (max 20)
   - **Returns**: Album details including name, artists, release date, type, total tracks, and ID. For single album returns detailed view, for multiple albums returns summary list.
   - **Example**: `getAlbums("4aawyAB9vmqN3uQ7FjRGTy")` or `getAlbums(["4aawyAB9vmqN3uQ7FjRGTy", "1DFixLWuPkv3KT3TnV35m3"])`

2. **getAlbumTracks**

   - **Description**: Get tracks from a specific album with pagination support
   - **Parameters**:
     - `albumId` (string): The Spotify ID of the album
     - `limit` (number, optional): Maximum number of tracks to return (1-50)
     - `offset` (number, optional): Offset for pagination (0-based index)
   - **Returns**: List of tracks from the album with track names, artists, duration, and IDs. Shows pagination info.
   - **Example**: `getAlbumTracks("4aawyAB9vmqN3uQ7FjRGTy", 10, 0)`

3. **saveOrRemoveAlbumForUser**

   - **Description**: Save or remove albums from the user's "Your Music" library
   - **Parameters**:
     - `albumIds` (array): Array of Spotify album IDs (max 20)
     - `action` (string): Action to perform: "save" or "remove"
   - **Returns**: Success status with confirmation message
   - **Example**: `saveOrRemoveAlbumForUser(["4aawyAB9vmqN3uQ7FjRGTy"], "save")`

4. **checkUsersSavedAlbums**

   - **Description**: Check if albums are saved in the user's "Your Music" library
   - **Parameters**:
     - `albumIds` (array): Array of Spotify album IDs to check (max 20)
   - **Returns**: Status of each album (saved or not saved)
   - **Example**: `checkUsersSavedAlbums(["4aawyAB9vmqN3uQ7FjRGTy", "1DFixLWuPkv3KT3TnV35m3"])`

## Setup

### Prerequisites

- Node.js v16+
- A Spotify Premium account
- A registered Spotify Developer application

### Installation

```bash
git clone https://github.com/marcelmarais/spotify-mcp-server.git
cd spotify-mcp-server
npm install
npm run build
```

### Creating a Spotify Developer Application

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click the "Create an App" button
4. Fill in the app name and description
5. Accept the Terms of Service and click "Create"
6. In your new app's dashboard, you'll see your **Client ID**
7. Click "Show Client Secret" to reveal your **Client Secret**
8. Click "Edit Settings" and add a Redirect URI (e.g., `http://127.0.0.1:8888/callback`)
9. Save your changes

### Spotify API Configuration

Create a `spotify-config.json` file in the project root (you can copy and modify the provided example):

```bash
# Copy the example config file
cp spotify-config.example.json spotify-config.json
```

Then edit the file with your credentials:

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://127.0.0.1:8888/callback"
}
```

### Authentication Process

The Spotify API uses OAuth 2.0 for authentication. Follow these steps to authenticate your application:

1. Run the authentication script:

```bash
npm run auth
```

2. The script will generate an authorization URL. Open this URL in your web browser.

3. You'll be prompted to log in to Spotify and authorize your application.

4. After authorization, Spotify will redirect you to your specified redirect URI with a code parameter in the URL.

5. The authentication script will automatically exchange this code for access and refresh tokens.

6. These tokens will be saved to your `spotify-config.json` file, which will now look something like:

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:8888/callback",
  "accessToken": "BQAi9Pn...kKQ",
  "refreshToken": "AQDQcj...7w",
  "expiresAt": 1677889354671
}
```

7. The server will automatically refresh the access token when needed, using the refresh token.

### Environment variables (for containers)

You can configure the server with environment variables instead of `spotify-config.json` (useful for Cloud Run/Docker):

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `SPOTIFY_ACCESS_TOKEN` (optional)
- `SPOTIFY_REFRESH_TOKEN` (optional)

## Integrating with Claude Desktop, Cursor, and VsCode [Via Cline model extension](https://marketplace.visualstudio.com/items/?itemName=saoudrizwan.claude-dev)

To use your MCP server with Claude Desktop, add it to your Claude configuration:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["spotify-mcp-server/build/index.js"]
    }
  }
}
```

For Cursor, go to the MCP tab in `Cursor Settings` (command + shift + J). Add a server with this command:

```bash
node path/to/spotify-mcp-server/build/index.js
```

To set up your MCP correctly with Cline ensure you have the following file configuration set `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["~/../spotify-mcp-server/build/index.js"],
      "autoApprove": ["getListeningHistory", "getNowPlaying"]
    }
  }
}
```

You can add additional tools to the auto approval array to run the tools without intervention.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript source files to JavaScript in `./build` directory |
| `npm run start:sse` | Start the HTTP/SSE transport server on port 3000 |
| `npm run auth` | Run the OAuth authentication flow to obtain Spotify tokens |
| `npm run lint` | Run Biome linter to check for code issues |
| `npm run lint:fix` | Auto-fix linting issues where possible |
| `npm run typecheck` | Run TypeScript compiler in check-only mode (no emit) |

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.10.1 | MCP protocol implementation for building MCP servers |
| `@spotify/web-api-ts-sdk` | ^1.2.0 | Official Spotify Web API TypeScript client |
| `express` | ^5.2.1 | HTTP server framework (used by SSE transport) |
| `cors` | ^2.8.5 | CORS middleware for Express |
| `open` | ^10.1.0 | Opens URLs in the default browser (for OAuth flow) |
| `zod` | ^3.24.2 | TypeScript-first schema validation for tool parameters |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@biomejs/biome` | ^1.9.4 | Fast code formatter and linter |
| `typescript` | ^5.8.2 | TypeScript compiler |
| `@types/cors` | ^2.8.19 | TypeScript definitions for cors |
| `@types/express` | ^5.0.2 | TypeScript definitions for Express |
| `@types/node` | ^22.14.1 | TypeScript definitions for Node.js |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and ensure linting passes: `npm run lint`
4. Build and test: `npm run build`
5. Commit your changes and push to your fork
6. Open a Pull Request

## License

MIT
