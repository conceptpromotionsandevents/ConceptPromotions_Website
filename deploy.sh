#!/bin/bash
# deploy.sh - Automated deployment with cleanup

set -e

echo "🚀 Starting deployment for Concept Promotions..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Pull latest code
echo "📥 Pulling latest code from Git..."
git pull origin main || print_warning "Git pull failed or already up to date"

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Remove old images (keep latest)
echo "🗑️  Cleaning up old Docker images..."
docker images | grep concept-backend | grep -v latest | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep concept-frontend | grep -v latest | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# Remove dangling images
echo "🧹 Removing dangling images..."
docker image prune -f

# Remove unused volumes (optional, be careful!)
# Uncomment if you want to clean volumes too
# docker volume prune -f

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

# Show resource usage
echo "💾 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Clean up build cache (keeps last 24 hours)
echo "🧹 Cleaning Docker build cache..."
docker builder prune -f --filter "until=24h"

# Final cleanup - remove stopped containers
echo "🗑️  Removing stopped containers..."
docker container prune -f

# Show disk usage
echo "💿 Docker disk usage:"
docker system df

print_success "Deployment complete!"
echo ""
echo "🌐 Your application is running:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📝 View logs with:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
