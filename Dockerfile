# Railway Dockerfile - Production build for API Server
# Multi-stage build for optimal image size

FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server
RUN pnpm install --frozen-lockfile

# Build stage
FROM dependencies AS builder
COPY . .
RUN pnpm run build --filter @workspace/api-server

# Runtime stage - Production image
FROM base AS runtime
ENV NODE_ENV=production
EXPOSE 8080

# Copy only necessary files from builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the API server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
