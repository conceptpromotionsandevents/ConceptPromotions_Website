#!/bin/bash
# deploy-ci.sh - CI/CD deployment with aggressive cleanup

set -e

echo "🚀 CI/CD Deployment starting..."

# Navigate to project directory
cd ~/deployed-site

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git fetch --all
git reset --hard origin/main  # Force update to match remote
git pull origin main

# Stop containers
echo "🛑 Stopping containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Remove ALL old images (not just dangling)
echo "🗑️  Removing old images..."
docker rmi concept-backend:latest 2>/dev/null || true
docker rmi concept-frontend:latest 2>/dev/null || true

# Aggressive cleanup
docker system prune -af --volumes

# Build fresh images with no cache
echo "🏗️  Building fresh images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache --pull

# Start services
echo "🚀 Starting services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for health checks
echo "⏳ Waiting for health checks..."
sleep 20

# Verify services
docker compose ps

# Final size check
echo "💿 Final disk usage:"
docker system df

echo "✅ CI/CD Deployment complete!"
