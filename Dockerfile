FROM node:20-slim

WORKDIR /app

# Copy package files from mcp-server
COPY mcp-server/package*.json ./

# Install ALL deps (need typescript for build)
RUN npm ci

# Copy source and build
COPY mcp-server/ .
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Cloud Run provides PORT
ENV PORT=8080

# HTTP/SSE transport entrypoint (skip tsc, already built)
CMD ["node", "build/sse.js"]
