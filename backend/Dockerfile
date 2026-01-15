# backend/Dockerfile
# Production-ready Node.js Express backend with ES6 modules

# ==========================================
# Stage 1: Dependencies Stage
# ==========================================
FROM node:24-alpine AS deps

# Install build dependencies for native modules (bcryptjs, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production --legacy-peer-deps && \
    npm cache clean --force

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:24-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tini

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    PORT=5000 \
    NPM_CONFIG_LOGLEVEL=warn

# Install PM2 globally for process management
RUN npm install -g pm2@latest && \
    npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Ensure logs directory has correct permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check - adjust endpoint if yours is different
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Use tini for proper signal handling with PM2
ENTRYPOINT ["/sbin/tini", "--"]

# Start with PM2 in no-daemon mode
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
