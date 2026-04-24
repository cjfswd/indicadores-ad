#!/bin/bash
set -e

APP_DIR="/app/indicadores"
echo "🚀 Deploy Indicadores AD"
echo "========================"

cd "$APP_DIR"

# 1. Pull latest code (if using git)
if [ -d ".git" ]; then
  echo "⏳ Pulling latest code..."
  git pull origin main
fi

# 2. Install dependencies
echo "⏳ Installing dependencies..."
pnpm install --frozen-lockfile --prod=false

# 3. Build shared package
echo "⏳ Building shared..."
cd "$APP_DIR/shared"
pnpm run build 2>/dev/null || true

# 4. Build frontend
echo "⏳ Building frontend..."
cd "$APP_DIR/frontend"
pnpm run build

# 5. Build backend
echo "⏳ Building backend..."
cd "$APP_DIR/backend"
pnpm run build

# 6. Run migrations
echo "⏳ Running migrations..."
cd "$APP_DIR/backend"
pnpm run migrate

# 7. Restart backend via PM2
echo "⏳ Restarting backend..."
cd "$APP_DIR"
pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs

# 8. Create log directory
mkdir -p /var/log/indicadores

echo ""
echo "✅ Deploy concluído!"
echo "   Frontend: /app/indicadores/frontend/dist"
echo "   Backend:  PM2 → indicadores-api"
echo "   Logs:     /var/log/indicadores/"
