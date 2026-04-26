# ── Stage 1: Install dependencies ──
FROM node:20-slim AS deps
RUN npm i -g pnpm@10
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build backend ──
FROM deps AS backend-build
COPY shared/ shared/
COPY backend/ backend/
RUN cd backend && pnpm run build

# ── Stage 3: Production image ──
FROM node:20-slim AS production
RUN npm i -g pnpm@10
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile --prod

# Copy built assets
COPY --from=backend-build /app/backend/dist backend/dist
COPY backend/src/views backend/src/views
COPY backend/public backend/public
COPY backend/src/config/migrations backend/src/config/migrations
COPY nginx/ nginx/

# Copy compiled shared JS
COPY --from=backend-build /app/backend/dist/shared/src shared/src
RUN sed -i 's/index\.ts/index.js/g' shared/package.json

# Uploads directory
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "backend/dist/backend/src/app.js"]
