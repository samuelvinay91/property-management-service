# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S notification -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=notification:nodejs /app/dist ./dist
COPY --from=builder --chown=notification:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=notification:nodejs /app/package*.json ./

# Create log directory
RUN mkdir -p /var/log/notification-service && \
    chown -R notification:nodejs /var/log/notification-service

# Switch to app user
USER notification

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]

# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Install all dependencies including dev dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY src ./src

# Create log directory
RUN mkdir -p /var/log/notification-service

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]