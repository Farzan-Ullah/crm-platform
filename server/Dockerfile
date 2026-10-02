# Multi-Stage Production Dockerfile for NexusCRM Server
# Stage 1: Build & Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install curl/wget for healthchecks
RUN apk --no-cache add curl wget

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy installed production dependencies
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy application source code
COPY . .

# Ensure non-root node user owns the app directory
RUN chown -R node:node /usr/src/app

# Switch to unprivileged user
USER node

# Expose backend port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "server.js"]
