#!/bin/bash

# PropFlow Google Cloud Run Deployment Script
# This script deploys the entire PropFlow platform to Google Cloud Run

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
DB_INSTANCE_NAME="propflow-db"
REDIS_INSTANCE_NAME="propflow-redis"

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
    echo "🚀 PropFlow Google Cloud Run Deployment"
    echo "========================================"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK is not installed. Please install it and try again."
        echo "Install instructions: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
        print_error "Not authenticated with Google Cloud. Please run 'gcloud auth login' first."
        exit 1
    fi
    
    # Get or set project ID
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            print_error "No Google Cloud project set. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed!"
    print_info "Using project: $PROJECT_ID"
    print_info "Using region: $REGION"
}

# Enable required APIs
enable_apis() {
    print_info "Enabling required Google Cloud APIs..."
    
    gcloud services enable run.googleapis.com \
        sql-admin.googleapis.com \
        redis.googleapis.com \
        cloudbuild.googleapis.com \
        secretmanager.googleapis.com \
        storage-component.googleapis.com \
        --project=$PROJECT_ID
    
    print_success "APIs enabled!"
}

# Create Cloud SQL database
create_database() {
    print_info "Creating Cloud SQL PostgreSQL instance..."
    
    # Check if instance already exists
    if gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID >/dev/null 2>&1; then
        print_warning "Database instance '$DB_INSTANCE_NAME' already exists, skipping creation..."
    else
        gcloud sql instances create $DB_INSTANCE_NAME \
            --database-version=POSTGRES_14 \
            --tier=db-custom-2-7680 \
            --region=$REGION \
            --backup-start-time=03:00 \
            --maintenance-window-day=SUN \
            --maintenance-window-hour=04 \
            --project=$PROJECT_ID
        
        print_success "Database instance created!"
    fi
    
    # Create database
    print_info "Creating database..."
    gcloud sql databases create propflow --instance=$DB_INSTANCE_NAME --project=$PROJECT_ID 2>/dev/null || print_warning "Database may already exist"
    
    # Create database user
    print_info "Creating database user..."
    DB_PASSWORD=$(openssl rand -base64 32)
    gcloud sql users create propflow-user \
        --instance=$DB_INSTANCE_NAME \
        --password=$DB_PASSWORD \
        --project=$PROJECT_ID 2>/dev/null || print_warning "User may already exist"
    
    # Store database URL in Secret Manager
    DATABASE_URL="postgresql://propflow-user:$DB_PASSWORD@//cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE_NAME/propflow"
    echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=- --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$DATABASE_URL" | gcloud secrets versions add database-url --data-file=- --project=$PROJECT_ID
    
    print_success "Database setup completed!"
}

# Create Redis instance
create_redis() {
    print_info "Creating Redis instance..."
    
    # Check if instance already exists
    if gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --project=$PROJECT_ID >/dev/null 2>&1; then
        print_warning "Redis instance '$REDIS_INSTANCE_NAME' already exists, skipping creation..."
    else
        gcloud redis instances create $REDIS_INSTANCE_NAME \
            --size=1 \
            --region=$REGION \
            --redis-version=redis_6_x \
            --project=$PROJECT_ID
        
        print_success "Redis instance created!"
    fi
    
    # Get Redis host
    REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --format="value(host)" --project=$PROJECT_ID)
    REDIS_URL="redis://$REDIS_HOST:6379"
    
    # Store Redis URL in Secret Manager
    echo -n "$REDIS_URL" | gcloud secrets create redis-url --data-file=- --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$REDIS_URL" | gcloud secrets versions add redis-url --data-file=- --project=$PROJECT_ID
    
    print_success "Redis setup completed!"
}

# Create secrets
create_secrets() {
    print_info "Creating application secrets..."
    
    # JWT Secret
    JWT_SECRET=$(openssl rand -base64 64)
    echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=- --project=$PROJECT_ID
    
    # JWT Refresh Secret
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    echo -n "$JWT_REFRESH_SECRET" | gcloud secrets create jwt-refresh-secret --data-file=- --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$JWT_REFRESH_SECRET" | gcloud secrets versions add jwt-refresh-secret --data-file=- --project=$PROJECT_ID
    
    print_success "Secrets created!"
    print_warning "⚠️  Don't forget to add your external API keys (Stripe, OpenAI, etc.) to Secret Manager:"
    echo "   gcloud secrets create stripe-secret-key --data-file=stripe-key.txt"
    echo "   gcloud secrets create openai-api-key --data-file=openai-key.txt"
}

# Deploy frontend
deploy_frontend() {
    print_info "Deploying frontend to Cloud Run..."
    
    # Create Dockerfile for frontend if it doesn't exist
    if [ ! -f "frontend/Dockerfile" ]; then
        cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF
    fi
    
    # Deploy frontend
    gcloud run deploy propflow-frontend \
        --source ./frontend \
        --region $REGION \
        --allow-unauthenticated \
        --set-env-vars="NEXT_PUBLIC_API_URL=https://propflow-backend-$(echo $PROJECT_ID | tr '[:upper:]' '[:lower:]')-$REGION.run.app" \
        --memory=1Gi \
        --cpu=1 \
        --project=$PROJECT_ID
    
    FRONTEND_URL=$(gcloud run services describe propflow-frontend --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)
    print_success "Frontend deployed to: $FRONTEND_URL"
}

# Deploy backend services
deploy_backend() {
    print_info "Deploying backend services to Cloud Run..."
    
    # Create Dockerfile for backend if it doesn't exist
    if [ ! -f "backend/Dockerfile" ]; then
        cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
EOF
    fi
    
    # Deploy API Gateway
    gcloud run deploy propflow-backend \
        --source ./backend \
        --region $REGION \
        --allow-unauthenticated \
        --set-secrets="DATABASE_URL=database-url:latest,REDIS_URL=redis-url:latest,JWT_SECRET=jwt-secret:latest" \
        --add-cloudsql-instances="$PROJECT_ID:$REGION:$DB_INSTANCE_NAME" \
        --memory=2Gi \
        --cpu=2 \
        --concurrency=80 \
        --timeout=300 \
        --project=$PROJECT_ID
    
    BACKEND_URL=$(gcloud run services describe propflow-backend --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)
    print_success "Backend deployed to: $BACKEND_URL"
}

# Deploy AI services
deploy_ai_services() {
    print_info "Deploying AI services to Cloud Run..."
    
    # Create Dockerfile for AI services if it doesn't exist
    if [ ! -f "ai-services/Dockerfile" ]; then
        cat > ai-services/Dockerfile << 'EOF'
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    fi
    
    # Deploy AI services
    gcloud run deploy propflow-ai \
        --source ./ai-services \
        --region $REGION \
        --allow-unauthenticated \
        --memory=2Gi \
        --cpu=2 \
        --timeout=300 \
        --project=$PROJECT_ID
    
    AI_URL=$(gcloud run services describe propflow-ai --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)
    print_success "AI services deployed to: $AI_URL"
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    # Create a Cloud Run job for migrations
    gcloud run jobs create propflow-migrate \
        --image=gcr.io/$PROJECT_ID/propflow-backend:latest \
        --region=$REGION \
        --set-secrets="DATABASE_URL=database-url:latest" \
        --add-cloudsql-instances="$PROJECT_ID:$REGION:$DB_INSTANCE_NAME" \
        --task-timeout=600 \
        --command="npm" \
        --args="run,migrate" \
        --project=$PROJECT_ID 2>/dev/null || print_warning "Migration job may already exist"
    
    # Execute the migration job
    gcloud run jobs execute propflow-migrate --region=$REGION --wait --project=$PROJECT_ID
    
    print_success "Database migrations completed!"
}

# Setup custom domain (optional)
setup_domain() {
    if [ ! -z "$CUSTOM_DOMAIN" ]; then
        print_info "Setting up custom domain: $CUSTOM_DOMAIN"
        
        gcloud run domain-mappings create \
            --service=propflow-frontend \
            --domain=$CUSTOM_DOMAIN \
            --region=$REGION \
            --project=$PROJECT_ID
        
        print_success "Domain mapping created! Don't forget to update your DNS records."
    fi
}

# Display deployment summary
show_summary() {
    print_success "🎉 PropFlow deployment completed!"
    echo
    print_info "Your application URLs:"
    echo "🌐 Frontend:      $FRONTEND_URL"
    echo "🚀 Backend API:   $BACKEND_URL"
    echo "🤖 AI Services:   $AI_URL"
    echo
    print_info "Database Information:"
    echo "📊 Instance:      $DB_INSTANCE_NAME"
    echo "🔄 Redis:         $REDIS_INSTANCE_NAME"
    echo
    print_warning "⚠️  Important next steps:"
    echo "   1. Add your external API keys to Secret Manager"
    echo "   2. Configure your domain DNS (if using custom domain)"
    echo "   3. Set up monitoring and alerting"
    echo "   4. Review security settings"
    echo
    print_info "📚 Documentation: https://docs.propflow.com"
    print_info "🐛 Issues: https://github.com/yourusername/propflow-platform/issues"
}

# Main execution
main() {
    print_header
    
    # Parse command line arguments
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
            --domain)
                CUSTOM_DOMAIN="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [--project PROJECT_ID] [--region REGION] [--domain CUSTOM_DOMAIN]"
                echo
                echo "Options:"
                echo "  --project    Google Cloud Project ID"
                echo "  --region     Deployment region (default: us-central1)"
                echo "  --domain     Custom domain for the frontend"
                echo "  --help       Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    check_prerequisites
    enable_apis
    create_database
    create_redis
    create_secrets
    
    # Deploy services
    deploy_backend
    deploy_ai_services
    deploy_frontend
    
    # Run migrations
    run_migrations
    
    # Setup custom domain if provided
    setup_domain
    
    show_summary
}

# Run main function
main "$@"
"