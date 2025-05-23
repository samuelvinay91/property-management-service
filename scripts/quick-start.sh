#!/bin/bash

# PropFlow Quick Start Script
# This script sets up the entire PropFlow platform with a single command

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "🏠 PropFlow - AI-Powered Property Management Platform"
    echo "=================================================="
    echo -e "${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.9+ and try again."
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Setup environment variables
setup_environment() {
    print_info "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
        else
            # Create a basic .env file
            cat > .env << EOF
# Database
DATABASE_URL=postgresql://propflow:password@localhost:5432/propflow
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production

# External APIs (Configure these for full functionality)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
OPENAI_API_KEY=sk-your_openai_api_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mobile App
EXPO_PUBLIC_API_URL=http://localhost:4000

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_PAYMENTS=true
ENABLE_ANALYTICS=true

# Development
NODE_ENV=development
LOG_LEVEL=info
DEBUG=false
EOF
            print_success "Created basic .env file"
        fi
    else
        print_warning ".env file already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Check if we have a monorepo setup
    if [ -f "package.json" ]; then
        print_info "Installing root dependencies..."
        npm install
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        print_info "Installing backend dependencies..."
        cd backend && npm install && cd ..
        
        # Install individual service dependencies
        for service in auth-service property-service tenant-service payment-service maintenance-service booking-service notification-service api-gateway; do
            if [ -d "backend/$service" ]; then
                print_info "Installing $service dependencies..."
                cd "backend/$service" && npm install && cd ../..
            fi
        done
    fi
    
    # Install mobile dependencies
    if [ -d "mobile" ]; then
        print_info "Installing mobile dependencies..."
        cd mobile && npm install && cd ..
    fi
    
    # Install AI services dependencies
    if [ -d "ai-services" ]; then
        print_info "Installing AI services dependencies..."
        cd ai-services
        if [ -f "requirements.txt" ]; then
            # Create virtual environment if it doesn't exist
            if [ ! -d "venv" ]; then
                python3 -m venv venv
            fi
            source venv/bin/activate
            pip install -r requirements.txt
            deactivate
        fi
        cd ..
    fi
    
    print_success "All dependencies installed!"
}

# Start infrastructure services
start_infrastructure() {
    print_info "Starting infrastructure services (PostgreSQL, Redis)..."
    
    # Create docker-compose.infrastructure.yml if it doesn't exist
    if [ ! -f "docker-compose.infrastructure.yml" ]; then
        cat > docker-compose.infrastructure.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: propflow
      POSTGRES_USER: propflow
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U propflow"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF
    fi
    
    # Start infrastructure services
    docker-compose -f docker-compose.infrastructure.yml up -d
    
    # Wait for services to be ready
    print_info "Waiting for database to be ready..."
    until docker-compose -f docker-compose.infrastructure.yml exec -T postgres pg_isready -U propflow; do
        sleep 2
    done
    
    print_info "Waiting for Redis to be ready..."
    until docker-compose -f docker-compose.infrastructure.yml exec -T redis redis-cli ping; do
        sleep 2
    done
    
    print_success "Infrastructure services are running!"
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    # Check if we have migration scripts
    if [ -f "package.json" ] && npm run | grep -q "migrate"; then
        npm run migrate
    elif [ -d "backend" ] && [ -f "backend/package.json" ]; then
        cd backend && npm run migrate && cd ..
    else
        print_warning "No migration scripts found, skipping..."
    fi
    
    print_success "Database migrations completed!"
}

# Seed demo data
seed_demo_data() {
    print_info "Seeding demo data..."
    
    # Check if we have seed scripts
    if [ -f "package.json" ] && npm run | grep -q "seed"; then
        npm run seed
    elif [ -d "backend" ] && [ -f "backend/package.json" ]; then
        cd backend && npm run seed 2>/dev/null || print_warning "No seed script found" && cd ..
    else
        print_warning "No seed scripts found, skipping..."
    fi
    
    print_success "Demo data seeded!"
}

# Start all services
start_services() {
    print_info "Starting all services..."
    
    # Start services based on available configuration
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d
    elif [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml up -d
    else
        print_warning "No docker-compose file found. Starting services manually..."
        
        # Start backend services
        if [ -d "backend" ]; then
            print_info "Starting backend services..."
            cd backend
            npm run dev &
            cd ..
        fi
        
        # Start frontend
        if [ -d "frontend" ]; then
            print_info "Starting frontend..."
            cd frontend
            npm run dev &
            cd ..
        fi
        
        # Start AI services
        if [ -d "ai-services" ]; then
            print_info "Starting AI services..."
            cd ai-services
            if [ -d "venv" ]; then
                source venv/bin/activate
                python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
                deactivate
            fi
            cd ..
        fi
        
        # Start mobile development server
        if [ -d "mobile" ]; then
            print_info "Starting mobile development server..."
            cd mobile
            npm start &
            cd ..
        fi
    fi
    
    print_success "All services are starting!"
}

# Display access information
show_access_info() {
    print_success "🎉 PropFlow is now running!"
    echo
    print_info "Access your applications:"
    echo "🌐 Frontend Web App:    http://localhost:3000"
    echo "🔧 Admin Panel:         http://localhost:3000/admin"
    echo "📊 Monitoring:          http://localhost:3000/monitoring"
    echo "📈 Analytics:           http://localhost:3000/analytics"
    echo "🚀 API Gateway:         http://localhost:4000/graphql"
    echo "🤖 AI Services:         http://localhost:8000/docs"
    echo "📱 Mobile (Expo):       http://localhost:19006"
    echo
    print_info "Default login credentials:"
    echo "👤 Email: admin@propflow.com"
    echo "🔑 Password: admin123"
    echo
    print_warning "⚠️  Remember to:"
    echo "   • Configure your .env file with real API keys"
    echo "   • Change default passwords in production"
    echo "   • Review security settings before deploying"
    echo
    print_info "📚 Documentation: https://docs.propflow.com"
    print_info "🐛 Issues: https://github.com/yourusername/propflow-platform/issues"
    print_info "💬 Support: https://discord.gg/propflow"
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    jobs -p | xargs -r kill 2>/dev/null || true
}

# Trap cleanup on script exit
trap cleanup EXIT

# Main execution
main() {
    print_header
    
    check_prerequisites
    setup_environment
    install_dependencies
    start_infrastructure
    
    # Give infrastructure time to fully start
    sleep 5
    
    run_migrations
    seed_demo_data
    start_services
    
    # Give services time to start
    sleep 10
    
    show_access_info
    
    # Keep script running to maintain background processes
    if [ "$1" != "--no-wait" ]; then
        print_info "Press Ctrl+C to stop all services"
        while true; do
            sleep 1
        done
    fi
}

# Run main function
main "$@"
"