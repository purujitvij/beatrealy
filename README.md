# BeatRelay

A Spotify integration app with MCP (Model Context Protocol) server and Next.js frontend.

A chat agent that picks music for your mood and plays it on Spotify. Built by Purujit Vij and shipped in January 2026.

**Case study:** [Shipping a mood-based Spotify agent four months before Spotify did](https://purujit.com/work/beatrelay-mood-agent/) · **Live demo:** [beatrealy.vercel.app](https://beatrealy.vercel.app)

## Credits

- The Spotify MCP tools in [`mcp-server/`](mcp-server/) come from [marcelmarais/spotify-mcp-server](https://github.com/marcelmarais/spotify-mcp-server) by Marcel Marais (MIT, see [`mcp-server/LICENSE`](mcp-server/LICENSE)).
- Built for BeatRelay by Purujit Vij: the Streamable HTTP transport with per-user sessions and Spotify logins (`mcp-server/src/sse.ts`, `mcp-server/src/tool-executor.ts`), the Gemini 2.5 Pro agent (`frontend/src/app/api/agent/`), and the Next.js app.

## Project Structure

```
beatrelay/
├── frontend/                    # Next.js Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (library)/       # Library pages (albums, playlists, liked-songs)
│   │   │   │   ├── albums/
│   │   │   │   ├── playlists/
│   │   │   │   ├── liked-songs/
│   │   │   │   └── recently-played/
│   │   │   ├── api/             # API routes
│   │   │   │   ├── agent/
│   │   │   │   ├── auth/spotify/
│   │   │   │   ├── chat/
│   │   │   │   ├── health/
│   │   │   │   └── spotify/
│   │   │   ├── chat/            # Chat page
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/              # UI components (button, card, sidebar, etc.)
│   │   │   └── app-sidebar.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-toast.ts
│   │   │   └── useSpotifyAuth.ts
│   │   └── lib/                 # Utility functions
│   │       ├── mcp-client.ts
│   │       ├── playback-context.tsx
│   │       └── utils.ts
│   ├── package.json
│   └── tsconfig.json
│
├── mcp-server/                  # MCP Server (Spotify Integration)
│   ├── src/
│   │   ├── index.ts             # Main entry point
│   │   ├── sse.ts               # Server-Sent Events
│   │   ├── auth.ts              # Spotify authentication
│   │   ├── albums.ts            # Album operations
│   │   ├── play.ts              # Playback controls
│   │   ├── read.ts              # Read operations
│   │   ├── tool-executor.ts     # MCP tool execution
│   │   ├── types.ts             # TypeScript types
│   │   └── utils.ts             # Utility functions
│   ├── spotify-config.json      # Spotify API configuration
│   ├── swagger.json             # API documentation
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── package.json                 # Root package.json with scripts
└── README.md
```

## Tech Stack

### Frontend
- **Framework:** Next.js 16
- **UI:** React 19, Radix UI, Tailwind CSS
- **Animation:** Framer Motion
- **Icons:** Lucide React

### MCP Server
- **Runtime:** Node.js
- **Framework:** Express.js
- **MCP SDK:** @modelcontextprotocol/sdk
- **Spotify SDK:** @spotify/web-api-ts-sdk
- **Validation:** Zod

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Spotify Developer Account (for API credentials)
- Spotify Premium on the account that owns the Spotify app (required for development-mode apps since 2026, and playback control needs it too)

### Spotify app limits

- New Spotify apps start in **development mode**: only users you add by hand to the app's allowlist in the [Spotify developer dashboard](https://developer.spotify.com/dashboard) can sign in, up to 5 per app. Leaving it means [Extended Quota Mode](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), which Spotify only grants to registered organizations with at least 250,000 monthly active users.
- Since Spotify's [February 2026 changes](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) (9 March 2026 for existing apps), the **app owner needs an active Spotify Premium subscription**. If it lapses, every API call fails with "Active premium subscription required for the owner of the app" until it's renewed, and it can take a few hours to work again.
- Playback control (play, pause, skip, volume, queue) needs a **Spotify Premium** account.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/purujitvij/beatrelay.git
cd beatrelay
```

2. Install dependencies for both frontend and mcp-server:
```bash
npm run install:all
```

3. Configure Spotify credentials:
   - Copy `mcp-server/spotify-config.example.json` to `mcp-server/spotify-config.json`
   - Add your Spotify API credentials

4. Create `.env` files as needed for both projects.

### Running the Application

**Start both frontend and server together:**
```bash
npm run dev
```

**Or run them separately:**
```bash
# Frontend only (runs on port 3001)
npm run dev:frontend

# MCP Server only
npm run dev:server
```

### Building for Production

```bash
# Build frontend
npm run build:frontend

# Build server
npm run build:server
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install dependencies for both projects |
| `npm run dev` | Start both frontend and server |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:server` | Start MCP server only |
| `npm run build:frontend` | Build frontend for production |
| `npm run build:server` | Build server for production |

## License

MIT
