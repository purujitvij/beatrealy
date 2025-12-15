# BeatRelay

A Spotify integration app with MCP (Model Context Protocol) server and Next.js frontend.

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

### Installation

1. Clone the repository:
```bash
git clone https://github.com/purujitvij/beatrealy.git
cd beatrealy
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
