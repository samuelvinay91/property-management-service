#!/bin/bash

# PropFlow Universal Deployment Script
# Supports Docker Compose, Google Cloud Run, and other deployment targets

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TARGET=""
PROJECT_ID=""
REGION="us-central1"
ENV_FILE=".env"

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
    echo "🚀 PropFlow Universal Deployment Script"
    echo "======================================"
    echo -e "${NC}"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [TARGET] [OPTIONS]"
    echo
    echo "Targets:"
    echo "  local       Deploy locally with Docker Compose"
    echo "  cloudrun    Deploy to Google Cloud Run"
    echo "  kubernetes  Deploy to Kubernetes cluster"
    echo "  staging     Deploy to staging environment"
    echo "  production  Deploy to production environment"
    echo
    echo "Options:"
    echo "  --project PROJECT_ID    Google Cloud Project ID"
    echo "  --region REGION         Deployment region (default: us-central1)"
    echo "  --env-file FILE         Environment file (default: .env)"
    echo "  --build-only            Only build images, don't deploy"
    echo "  --skip-tests            Skip running tests before deployment"
    echo "  --help                  Show this help message"
    echo
    echo "Examples:"
    echo "  $0 local                     # Deploy locally"
    echo "  $0 cloudrun --project my-gcp-project"
    echo "  $0 staging --env-file .env.staging"
    echo "  $0 production --build-only"
}

# Parse command line arguments
parse_arguments() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    DEPLOYMENT_TARGET=$1
    shift
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --project)
                PROJECT_ID="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            --build-only)
                BUILD_ONLY=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites for $DEPLOYMENT_TARGET deployment..."
    
    # Common prerequisites
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found"
        exit 1
    fi
    
    # Target-specific prerequisites
    case $DEPLOYMENT_TARGET in
        cloudrun)
            if ! command -v gcloud &> /dev/null; then
                print_error "Google Cloud SDK is not installed"
                exit 1
            fi
            
            if [ -z "$PROJECT_ID" ]; then
                PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
                if [ -z "$PROJECT_ID" ]; then
                    print_error "Google Cloud project not set. Use --project or 'gcloud config set project PROJECT_ID'"
                    exit 1
                fi
            fi
            ;;
        kubernetes)
            if ! command -v kubectl &> /dev/null; then
                print_error "kubectl is not installed"
                exit 1
            fi
            ;;
    esac
    
    print_success "Prerequisites check passed!"
}

# Load environment variables
load_environment() {
    print_info "Loading environment variables from $ENV_FILE..."
    
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        print_success "Environment variables loaded"
    else
        print_warning "Environment file $ENV_FILE not found, using system environment"
    fi
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests as requested"
        return
    fi
    
    print_info "Running tests..."
    
    # Check if test scripts exist
    if [ -f "package.json" ] && npm run | grep -q "test"; then
        npm run test
        print_success "All tests passed!"
    else
        print_warning "No test scripts found, skipping tests"
    fi
}

# Build Docker images
build_images() {
    print_info "Building Docker images..."
    
    case $DEPLOYMENT_TARGET in
        local|staging)
            docker-compose -f docker-compose.yml build
            ;;
        production|cloudrun)
            docker-compose -f docker-compose.prod.yml build
            ;;
        *)
            docker-compose build
            ;;
    esac
    
    print_success "Docker images built successfully!"
}

# Deploy to local environment
deploy_local() {
    print_info "Deploying to local environment..."
    
    # Start infrastructure services
    docker-compose up -d postgres redis
    
    # Wait for services to be ready
    print_info "Waiting for infrastructure services..."
    sleep 10
    
    # Run migrations
    if [ -f "package.json" ] && npm run | grep -q "migrate"; then
        npm run migrate
    fi
    
    # Start all services
    docker-compose up -d
    
    print_success "Local deployment completed!"
    print_info "Access your application:"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Admin: http://localhost:3000/admin"
    echo "🚀 API: http://localhost:4000/graphql"
    echo "🤖 AI Services: http://localhost:8000/docs"
}

# Deploy to Google Cloud Run
deploy_cloudrun() {
    print_info "Deploying to Google Cloud Run..."
    
    # Set project
    gcloud config set project "$PROJECT_ID"
    
    # Enable required APIs
    print_info "Enabling required APIs..."
    gcloud services enable run.googleapis.com \
        cloudbuild.googleapis.com \
        sql-admin.googleapis.com \
        redis.googleapis.com \
        secretmanager.googleapis.com
    
    # Build and push images
    print_info "Building and pushing images to Google Container Registry..."
    
    # Frontend
    gcloud builds submit ./frontend \
        --tag gcr.io/$PROJECT_ID/propflow-frontend
    
    # Backend
    gcloud builds submit ./backend \
        --tag gcr.io/$PROJECT_ID/propflow-backend
    
    # AI Services
    gcloud builds submit ./ai-services \
        --tag gcr.io/$PROJECT_ID/propflow-ai
    
    # Deploy services
    print_info "Deploying services to Cloud Run..."
    
    # Deploy frontend
    gcloud run deploy propflow-frontend \
        --image gcr.io/$PROJECT_ID/propflow-frontend \
        --region $REGION \
        --allow-unauthenticated \
        --memory 1Gi \
        --cpu 1
    
    # Deploy backend
    gcloud run deploy propflow-backend \
        --image gcr.io/$PROJECT_ID/propflow-backend \
        --region $REGION \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --set-secrets=\"DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest\"
    
    # Deploy AI services
    gcloud run deploy propflow-ai \
        --image gcr.io/$PROJECT_ID/propflow-ai \
        --region $REGION \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --set-secrets=\"OPENAI_API_KEY=openai-api-key:latest\"
    
    # Get service URLs
    FRONTEND_URL=$(gcloud run services describe propflow-frontend --region=$REGION --format=\"value(status.url)\")
    BACKEND_URL=$(gcloud run services describe propflow-backend --region=$REGION --format=\"value(status.url)\")
    AI_URL=$(gcloud run services describe propflow-ai --region=$REGION --format=\"value(status.url)\")
    
    print_success "Google Cloud Run deployment completed!"
    print_info "Service URLs:"
    echo "🌐 Frontend: $FRONTEND_URL"
    echo "🚀 Backend: $BACKEND_URL"
    echo "🤖 AI Services: $AI_URL"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    print_info "Deploying to Kubernetes..."
    
    # Check if we have Kubernetes manifests
    if [ ! -d "infrastructure/k8s" ]; then
        print_error "Kubernetes manifests not found in infrastructure/k8s/"
        exit 1
    fi
    
    # Apply Kubernetes manifests
    kubectl apply -f infrastructure/k8s/
    
    print_success "Kubernetes deployment completed!"
    
    # Get service information
    kubectl get services
}

# Deploy to staging
deploy_staging() {
    print_info "Deploying to staging environment..."
    
    # Use staging environment file if it exists
    if [ -f ".env.staging" ]; then
        ENV_FILE=".env.staging"
        load_environment
    fi
    
    # Deploy using production compose file but with staging settings
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Staging deployment completed!"
}

# Deploy to production
deploy_production() {
    print_info "Deploying to production environment..."
    
    # Confirmation for production deployment
    print_warning "⚠️  You are about to deploy to PRODUCTION!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Production deployment cancelled"
        exit 0
    fi
    
    # Use production environment file
    if [ -f ".env.production" ]; then
        ENV_FILE=".env.production"
        load_environment
    fi
    
    # Deploy using production configuration
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Production deployment completed!"
    print_warning "⚠️  Don't forget to:"
    echo "   • Update DNS records if needed"
    echo "   • Monitor application health"
    echo "   • Check logs for any issues"
}

# Health check
health_check() {
    print_info "Performing health check..."
    
    case $DEPLOYMENT_TARGET in
        local)
            # Check local services
            curl -f http://localhost:3000/api/health || print_warning "Frontend health check failed"
            curl -f http://localhost:4000/health || print_warning "Backend health check failed"
            curl -f http://localhost:8000/health || print_warning "AI services health check failed"
            ;;
        cloudrun)
            # Check Cloud Run services
            curl -f "$FRONTEND_URL/api/health" || print_warning "Frontend health check failed"
            curl -f "$BACKEND_URL/health" || print_warning "Backend health check failed"
            curl -f "$AI_URL/health" || print_warning "AI services health check failed"
            ;;
    esac
    
    print_success "Health check completed!"
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    # Add any cleanup logic here
}

# Trap cleanup on script exit
trap cleanup EXIT

# Main execution
main() {
    print_header
    
    parse_arguments "$@"
    check_prerequisites
    load_environment
    
    if [ "$BUILD_ONLY" != true ]; then
        run_tests
    fi
    
    build_images
    
    if [ "$BUILD_ONLY" = true ]; then
        print_success "Build completed! Images are ready for deployment."
        exit 0
    fi
    
    # Deploy based on target
    case $DEPLOYMENT_TARGET in
        local)
            deploy_local
            ;;
        cloudrun)
            deploy_cloudrun
            ;;
        kubernetes)
            deploy_kubernetes
            ;;
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
        *)
            print_error "Unknown deployment target: $DEPLOYMENT_TARGET"
            show_usage
            exit 1
            ;;
    esac
    
    # Wait a bit for services to start
    sleep 10
    
    # Perform health check
    health_check
    
    print_success "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"
"