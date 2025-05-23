#!/bin/bash

# PropFlow - Google Cloud Run Deployment Script
# This script deploys the entire PropFlow platform to Google Cloud Run

set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
ENV=${ENVIRONMENT:-"production"}

echo "🚀 Starting PropFlow deployment to Google Cloud Run"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Environment: $ENV"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud first:"
    echo "gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    redis.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    cloudresourcemanager.googleapis.com

# Create Cloud SQL instance for databases
echo "🗄️ Setting up Cloud SQL instances..."
if ! gcloud sql instances describe propflow-db --region=$REGION >/dev/null 2>&1; then
    gcloud sql instances create propflow-db \
        --database-version=POSTGRES_14 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-auto-increase \
        --storage-size=20GB \
        --backup-start-time=03:00
    
    # Create databases
    gcloud sql databases create propflow_auth --instance=propflow-db
    gcloud sql databases create propflow_properties --instance=propflow-db
    gcloud sql databases create propflow_tenants --instance=propflow-db
    gcloud sql databases create propflow_payments --instance=propflow-db
    gcloud sql databases create propflow_notifications --instance=propflow-db
    gcloud sql databases create propflow_maintenance --instance=propflow-db
    gcloud sql databases create propflow_bookings --instance=propflow-db
    gcloud sql databases create propflow_ai --instance=propflow-db
fi

# Create Redis instance
echo "🔄 Setting up Redis instance..."
if ! gcloud redis instances describe propflow-redis --region=$REGION >/dev/null 2>&1; then
    gcloud redis instances create propflow-redis \
        --size=1 \
        --region=$REGION \
        --redis-version=redis_6_x
fi

# Create Cloud Storage bucket
echo "☁️ Setting up Cloud Storage..."
BUCKET_NAME="$PROJECT_ID-propflow-storage"
if ! gsutil ls -b gs://$BUCKET_NAME >/dev/null 2>&1; then
    gsutil mb -l $REGION gs://$BUCKET_NAME
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
fi

# Create secrets in Secret Manager
echo "🔐 Setting up secrets..."
echo "your-jwt-secret-key" | gcloud secrets create jwt-secret --data-file=-
echo "your-stripe-secret-key" | gcloud secrets create stripe-secret-key --data-file=-
echo "your-openai-api-key" | gcloud secrets create openai-api-key --data-file=-

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying services..."
gcloud builds submit --config infrastructure/gcp/cloudbuild.yaml

# Set up Cloud Scheduler for cron jobs (optional)
echo "⏰ Setting up scheduled tasks..."
if ! gcloud scheduler jobs describe propflow-cleanup --location=$REGION >/dev/null 2>&1; then
    gcloud scheduler jobs create http propflow-cleanup \
        --schedule="0 2 * * *" \
        --uri="https://propflow-api-gateway-xxx.a.run.app/api/cleanup" \
        --http-method=POST \
        --location=$REGION
fi

# Get service URLs
echo "🌐 Getting service URLs..."
API_GATEWAY_URL=$(gcloud run services describe propflow-api-gateway --region=$REGION --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe propflow-frontend --region=$REGION --format="value(status.url)")
AUTH_SERVICE_URL=$(gcloud run services describe propflow-auth-service --region=$REGION --format="value(status.url)")

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌍 Service URLs:"
echo "Frontend: $FRONTEND_URL"
echo "API Gateway: $API_GATEWAY_URL"
echo "Auth Service: $AUTH_SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your DNS records to point to: $FRONTEND_URL"
echo "2. Configure your OAuth providers with the new URLs"
echo "3. Update environment variables in Cloud Run console if needed"
echo "4. Test the deployment: curl $API_GATEWAY_URL/health"
echo ""
echo "📊 Monitoring:"
echo "- Cloud Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "- Logs: gcloud logs tail --follow --project=$PROJECT_ID"
echo ""