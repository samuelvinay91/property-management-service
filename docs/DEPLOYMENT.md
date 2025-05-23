# 🚀 Deployment Guide

This guide covers various deployment options for PropFlow, from local development to production cloud deployments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Google Cloud Run](#google-cloud-run)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- **Node.js** 18+ and npm/yarn
- **Docker** 20+ and Docker Compose
- **Python** 3.9+
- **Git**

### Required Accounts (for cloud deployment)
- **Google Cloud Platform** (recommended)
- **Stripe** (for payments)
- **OpenAI/Anthropic** (for AI features)

## 🏠 Local Development

### 1. Quick Start (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/propflow-platform.git
cd propflow-platform

# One-command setup
./scripts/quick-start.sh
```

### 2. Access Applications

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Gateway**: http://localhost:4000/graphql
- **AI Services**: http://localhost:8000/docs
- **Mobile (Expo)**: http://localhost:19006

## 🐳 Docker Deployment

### Production Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

## ☁️ Google Cloud Run

### One-Click Deployment

```bash
# Deploy using our script
./scripts/deploy-cloudrun.sh
```

### Manual Google Cloud Run Deployment

#### 1. Setup Google Cloud Project

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Initialize gcloud
gcloud init

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-admin.googleapis.com
gcloud services enable redis.googleapis.com
```

#### 2. Deploy Services

```bash
gcloud run deploy propflow-frontend \
  --source ./frontend \
  --region us-central1 \
  --allow-unauthenticated

gcloud run deploy propflow-backend \
  --source ./backend \
  --region us-central1 \
  --allow-unauthenticated

gcloud run deploy propflow-ai \
  --source ./ai-services \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Environment Variables

### Required Environment Variables

Create `.env` file with these variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/propflow
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# External APIs
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_PAYMENTS=true
```

## 🗄️ Database Setup

### PostgreSQL Setup

```bash
# Using Docker
docker run -d \
  --name propflow-postgres \
  -e POSTGRES_DB=propflow \
  -e POSTGRES_USER=propflow \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:14
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Create new migration
npm run migrate:create migration-name
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
npm run db:check

# Verify DATABASE_URL format
# Check firewall rules
# Ensure database is running
```

#### Build Failures

```bash
# Clear cache and rebuild
npm run clean
npm run build
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=debug

# Start services
npm run dev
```

## 📞 Support

For deployment issues:

- 📖 **Documentation**: [docs.propflow.com](https://docs.propflow.com)
- 💬 **Discord**: [discord.gg/propflow](https://discord.gg/propflow)
- 📧 **Email**: [support@propflow.com](mailto:support@propflow.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/propflow-platform/issues)

---

**Happy Deploying! 🚀**"