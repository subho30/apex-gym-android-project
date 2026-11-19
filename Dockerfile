# Production Multi-Stage Dockerfile for Apex Gym Full-Stack (Web + API + WebSockets)
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build web assets
COPY . .
RUN npm run build

# Production runtime image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./package.json

# Ensure data directory for persistent SQLite
RUN mkdir -p /app/.data

EXPOSE 4000

CMD ["npx", "tsx", "server/index.ts"]
