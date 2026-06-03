# Portable container for Tipple — works on Fly.io, Railway, Render, or any
# Docker host / VM. Node 24 ships node:sqlite without an experimental flag.
FROM node:24-slim

WORKDIR /app

# Install deps (incl. dev deps, needed for the Vite build).
COPY package.json package-lock.json ./
RUN npm ci

# Build the frontend.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
# Persistent data (SQLite + uploaded photos) lives here — mount a volume at /data.
ENV DATA_DIR=/data

EXPOSE 8080
CMD ["node", "server/index.js"]
