#!/bin/bash

# Generate package-lock.json files for all backend services
# This fixes Docker build issues with npm ci

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Generating package-lock.json files for all services${NC}"
echo "=================================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# List of backend services
SERVICES=(
    "auth-service"
    "property-service" 
    "tenant-service"
    "payment-service"
    "maintenance-service"
    "booking-service"
    "notification-service"
    "api-gateway"
)

# Function to generate lockfile for a service
generate_lockfile() {
    local service=$1
    local service_dir="$BACKEND_DIR/$service"
    
    if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
        echo -e "${YELLOW}📦 Generating lockfile for $service...${NC}"
        
        cd "$service_dir"
        
        # Remove existing node_modules and lockfile
        rm -rf node_modules package-lock.json 2>/dev/null || true
        
        # Generate new lockfile
        if npm install --package-lock-only; then
            echo -e "${GREEN}✅ Generated lockfile for $service${NC}"
        else
            echo -e "${RED}❌ Failed to generate lockfile for $service${NC}"
            return 1
        fi
        
        cd - > /dev/null
    else
        echo -e "${RED}❌ Service directory not found: $service_dir${NC}"
        return 1
    fi
}

# Generate lockfiles for all services
for service in "${SERVICES[@]}"; do
    generate_lockfile "$service"
done

# Also generate for main project
echo -e "${YELLOW}📦 Generating lockfile for main project...${NC}"
cd "$PROJECT_ROOT"
if npm install --package-lock-only; then
    echo -e "${GREEN}✅ Generated lockfile for main project${NC}"
else
    echo -e "${RED}❌ Failed to generate lockfile for main project${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All package-lock.json files generated successfully!${NC}"
echo ""
echo "Now you can run:"
echo "  docker-compose up --build"
echo ""
echo "Or for development mode:"
echo "  docker-compose -f docker-compose.dev.yml up --build"