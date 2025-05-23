#!/bin/bash

# PropFlow Platform Setup Script
# This script sets up the development environment

set -e

echo "🏠 Setting up PropFlow Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command_exists node; then
        missing_tools+=("Node.js (v18+)")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            missing_tools+=("Node.js v18+ (current: v$NODE_VERSION)")
        fi
    fi
    
    if ! command_exists npm; then
        missing_tools+=("npm")
    fi
    
    if ! command_exists docker; then
        missing_tools+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_tools+=("Docker Compose")
    fi
    
    if ! command_exists python3; then
        missing_tools+=("Python 3.9+")
    else
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)"; then
            missing_tools+=("Python 3.9+ (current: $PYTHON_VERSION)")
        fi
    fi
    
    if ! command_exists git; then
        missing_tools+=("Git")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "Please install the missing tools and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Create environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please update .env with your actual configuration values"
    else
        print_warning ".env file already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Mobile dependencies
    print_status "Installing mobile dependencies..."
    cd mobile && npm install && cd ..
    
    # AI services dependencies
    print_status "Installing AI services dependencies..."
    cd ai-services
    if command_exists pip3; then
        pip3 install -r requirements.txt
    else
        pip install -r requirements.txt
    fi
    cd ..
    
    print_success "All dependencies installed!"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Start database services
    print_status "Starting database services..."
    docker-compose up -d postgres redis mongodb elasticsearch
    
    # Wait for services to be ready
    print_status "Waiting for database services to be ready..."
    sleep 10
    
    # Check if services are ready
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
            break
        fi
        print_status "Waiting for PostgreSQL to be ready... ($((retries + 1))/$max_retries)"
        sleep 2
        retries=$((retries + 1))
    done
    
    if [ $retries -eq $max_retries ]; then
        print_error "PostgreSQL failed to start after $max_retries attempts"
        exit 1
    fi
    
    print_success "Database services are ready!"
}

# Run migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Run migrations for each service
    services=("auth-service" "property-service" "tenant-service" "payment-service" "notification-service" "maintenance-service" "booking-service")
    
    for service in "${services[@]}"; do
        print_status "Running migrations for $service..."
        cd "backend/$service"
        if [ -f "package.json" ] && grep -q "migrate" package.json; then
            npm run migrate 2>/dev/null || print_warning "Migration failed for $service (this might be expected)"
        fi
        cd ../..
    done
    
    print_success "Database migrations completed!"
}

# Seed initial data
seed_data() {
    print_status "Seeding initial data..."
    
    # Run seed scripts
    cd backend/auth-service
    if [ -f "package.json" ] && grep -q "seed" package.json; then
        npm run seed 2>/dev/null || print_warning "Seeding failed for auth-service (this might be expected)"
    fi
    cd ../..
    
    print_success "Initial data seeded!"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    directories=(
        "logs"
        "uploads"
        "backend/api-gateway/logs"
        "backend/auth-service/logs"
        "backend/property-service/logs"
        "backend/tenant-service/logs"
        "backend/payment-service/logs"
        "backend/notification-service/logs"
        "backend/maintenance-service/logs"
        "backend/booking-service/logs"
        "ai-services/logs"
        "ai-services/models"
        "infrastructure/ssl"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done
    
    print_success "Directories created!"
}

# Generate SSL certificates for development
generate_ssl_certs() {
    print_status "Generating SSL certificates for development..."
    
    if [ ! -f "infrastructure/ssl/localhost.crt" ]; then
        mkdir -p infrastructure/ssl
        
        # Generate self-signed certificate for localhost
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout infrastructure/ssl/localhost.key \
            -out infrastructure/ssl/localhost.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
            >/dev/null 2>&1
        
        print_success "SSL certificates generated!"
    else
        print_warning "SSL certificates already exist, skipping..."
    fi
}

# Setup Docker networks
setup_docker_networks() {
    print_status "Setting up Docker networks..."
    
    # Create propflow network if it doesn't exist
    if ! docker network ls | grep -q propflow-network; then
        docker network create propflow-network
        print_success "Docker network 'propflow-network' created!"
    else
        print_warning "Docker network 'propflow-network' already exists, skipping..."
    fi
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build all images
    docker-compose build --parallel
    
    print_success "Docker images built!"
}

# Start services
start_services() {
    print_status "Starting PropFlow services..."
    
    # Start all services in development mode
    docker-compose -f docker-compose.dev.yml up -d
    
    print_success "Services started!"
}

# Check service health
check_services() {
    print_status "Checking service health..."
    
    local services=(
        "http://localhost:4000/health|API Gateway"
        "http://localhost:4001/health|Auth Service"
        "http://localhost:8000/health|AI Services"
        "http://localhost:3000|Frontend"
    )
    
    sleep 10 # Wait for services to start
    
    for service_info in "${services[@]}"; do
        local url=$(echo "$service_info" | cut -d'|' -f1)
        local name=$(echo "$service_info" | cut -d'|' -f2)
        
        if curl -sf "$url" >/dev/null 2>&1; then
            print_success "$name is healthy"
        else
            print_warning "$name is not responding (this might be expected during startup)"
        fi
    done
}

# Print final instructions
print_final_instructions() {
    echo ""
    echo "🎉 PropFlow Platform setup completed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env file with your actual configuration values"
    echo "2. Start the development environment:"
    echo "   docker-compose -f docker-compose.dev.yml up"
    echo ""
    echo "🌐 Service URLs:"
    echo "   Frontend:      http://localhost:3000"
    echo "   API Gateway:   http://localhost:4000/graphql"
    echo "   AI Services:   http://localhost:8000/docs"
    echo "   Database Admin: http://localhost:5050"
    echo "   Redis Admin:   http://localhost:8081"
    echo "   Monitoring:    http://localhost:3001"
    echo ""
    echo "📚 Documentation:"
    echo "   Deployment:    docs/DEPLOYMENT.md"
    echo "   API Docs:      docs/API.md"
    echo "   Contributing:  docs/CONTRIBUTING.md"
    echo ""
    echo "🆘 Support:"
    echo "   Email:         support@propflow.com"
    echo "   GitHub Issues: https://github.com/yourusername/propflow-platform/issues"
}

# Main execution
main() {
    echo "🏠 PropFlow Platform Setup"
    echo "=========================="
    echo ""
    
    check_prerequisites
    setup_environment
    create_directories
    setup_docker_networks
    install_dependencies
    generate_ssl_certs
    setup_database
    run_migrations
    seed_data
    build_images
    start_services
    check_services
    print_final_instructions
}

# Handle script interruption
trap 'print_error "Setup interrupted!"; exit 1' INT TERM

# Run main function
main "$@"