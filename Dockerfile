# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
RUN npm i -g pnpm@10
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build frontend ──
FROM deps AS frontend-build
COPY shared/ shared/
COPY frontend/ frontend/
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN cd frontend && (pnpm run build || true)

# ── Stage 3: Build backend ──
FROM deps AS backend-build
COPY shared/ shared/
COPY backend/ backend/
RUN cd backend && pnpm run build

# ── Stage 4: Production image ──
FROM node:20-alpine AS production
RUN npm i -g pnpm@10
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile --prod

# Copy built assets
COPY --from=frontend-build /app/frontend/dist frontend/dist
COPY --from=backend-build /app/backend/dist backend/dist
COPY backend/src/config/migrations backend/src/config/migrations
COPY backend/scripts backend/scripts
COPY shared/src shared/src
COPY nginx/ nginx/

# Uploads directory
RUN mkdir -p backend/uploads

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Start backend (serves API; frontend is static via Nginx/Coolify)
CMD ["node", "backend/dist/backend/src/app.js"]
