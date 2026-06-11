# ─── Stage 1: Frontend Build ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci --prefer-offline

# Build static frontend export
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Backend Production Build ──────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install all deps (including devDeps for TypeScript compilation)
COPY backend/package*.json ./
RUN npm ci

# Compile TypeScript
COPY backend/ ./
RUN npm run build

# ─── Stage 3: Production Runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 habitloop && \
    adduser --system --uid 1001 habitloop

WORKDIR /app

# Copy compiled backend
COPY --from=backend-builder --chown=habitloop:habitloop /app/backend/dist ./dist
COPY --from=backend-builder --chown=habitloop:habitloop /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=habitloop:habitloop /app/backend/package.json ./

# Copy static frontend build to /public
COPY --from=frontend-builder --chown=habitloop:habitloop /app/frontend/out ./public

USER habitloop

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
