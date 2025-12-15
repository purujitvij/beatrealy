FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL deps (need typescript for build)
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Cloud Run provides PORT
ENV PORT=8080

# HTTP/SSE transport entrypoint (skip tsc, already built)
CMD ["node", "build/sse.js"]
