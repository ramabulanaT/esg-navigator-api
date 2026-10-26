# Multi-stage build for API
FROM node:20-alpine AS builder
WORKDIR /app
# Copy package files
COPY package*.json ./
RUN npm install --include=dev
# Copy source
COPY . ./
# Build TypeScript
RUN npm run build
# Production image
FROM node:20-alpine
WORKDIR /app
# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
# Create logs directory
RUN mkdir -p logs
# Expose port
EXPOSE 8080
# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
# Start server
CMD ["node", "dist/index.js"]
