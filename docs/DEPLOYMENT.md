# PropFlow Deployment Guide

This guide covers deployment options for the PropFlow property management platform across different cloud providers and environments.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.9+
- Git
- Cloud provider CLI tools (AWS CLI, gcloud, or Azure CLI)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/propflow-platform.git
cd propflow-platform
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Start development environment**
```bash
docker-compose -f docker-compose.dev.yml up
```

4. **Access services**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000/graphql
- AI Services: http://localhost:8000/docs
- Database Admin: http://localhost:5050
- Monitoring: http://localhost:3001

## Cloud Deployment Options

### AWS Deployment

#### EKS (Kubernetes) Deployment

1. **Install prerequisites**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

2. **Configure AWS credentials**
```bash
aws configure
```

3. **Deploy infrastructure**
```bash
cd infrastructure/aws
terraform init
terraform plan
terraform apply
```

4. **Deploy application**
```bash
# Build and push Docker images
./scripts/build-and-push.sh aws

# Deploy to EKS
kubectl apply -f infrastructure/k8s/aws/
```

#### ECS Deployment

```bash
# Deploy using AWS Copilot
copilot app init propflow
copilot env init --name production
copilot env deploy --name production
copilot svc init --name api-gateway
copilot svc deploy --name api-gateway --env production
```

### Google Cloud Platform Deployment

#### GKE (Kubernetes) Deployment

1. **Install prerequisites**
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

2. **Deploy infrastructure**
```bash
cd infrastructure/gcp
terraform init
terraform plan
terraform apply
```

3. **Deploy application**
```bash
# Build and push to GCR
./scripts/build-and-push.sh gcp

# Deploy to GKE
kubectl apply -f infrastructure/k8s/gcp/
```

#### Cloud Run Deployment

```bash
# Deploy individual services
gcloud run deploy api-gateway \
  --image gcr.io/PROJECT_ID/propflow-api-gateway \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

gcloud run deploy ai-services \
  --image gcr.io/PROJECT_ID/propflow-ai-services \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2
```

### Azure Deployment

#### AKS (Kubernetes) Deployment

1. **Install prerequisites**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login
```

2. **Deploy infrastructure**
```bash
cd infrastructure/azure
terraform init
terraform plan
terraform apply
```

3. **Deploy application**
```bash
# Build and push to ACR
./scripts/build-and-push.sh azure

# Deploy to AKS
kubectl apply -f infrastructure/k8s/azure/
```

#### Container Instances Deployment

```bash
# Deploy using Azure Container Instances
az container create \
  --resource-group propflow-rg \
  --name propflow-api-gateway \
  --image propflowacr.azurecr.io/api-gateway:latest \
  --cpu 1 \
  --memory 1 \
  --ports 4000
```

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

```bash
# Application
NODE_ENV=production
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql://username:password@host:5432/database
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# External Services
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email & SMS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Cloud Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET=propflow-production

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_key
```

### Staging Environment

Similar configuration with staging-specific values:

```bash
NODE_ENV=staging
DATABASE_URL=postgresql://username:password@staging-host:5432/database
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
# ... other staging configurations
```

## Database Setup

### PostgreSQL Setup

```sql
-- Create databases
CREATE DATABASE propflow_auth;
CREATE DATABASE propflow_properties;
CREATE DATABASE propflow_tenants;
CREATE DATABASE propflow_payments;
CREATE DATABASE propflow_notifications;
CREATE DATABASE propflow_maintenance;
CREATE DATABASE propflow_bookings;
CREATE DATABASE propflow_ai;

-- Create user and grant permissions
CREATE USER propflow_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON ALL DATABASES TO propflow_user;
```

### Run Migrations

```bash
# Run migrations for all services
npm run migrate

# Or run individually
cd backend/auth-service && npm run migrate
cd backend/property-service && npm run migrate
# ... repeat for other services
```

### Seed Initial Data

```bash
# Seed initial data
npm run seed

# Create admin user
cd backend/auth-service && npm run seed:admin
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d api.propflow.com -d app.propflow.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Custom SSL Certificates

Place your certificates in `infrastructure/nginx/ssl/`:
- `propflow.com.crt`
- `propflow.com.key`

## Monitoring and Logging

### Prometheus Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'propflow-api-gateway'
    static_configs:
      - targets: ['api-gateway:4000']
  
  - job_name: 'propflow-ai-services'
    static_configs:
      - targets: ['ai-services:8000']
```

### Grafana Dashboards

Import dashboards from `infrastructure/grafana/dashboards/`:
- `api-overview.json`
- `database-metrics.json`
- `ai-services-metrics.json`

### Log Aggregation

#### ELK Stack Setup

```bash
# Deploy ELK stack
docker-compose -f infrastructure/elk/docker-compose.yml up -d
```

#### Centralized Logging

Configure services to send logs to Elasticsearch:

```javascript
// logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  transports: [
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: 'http://elasticsearch:9200' },
      index: 'propflow-logs'
    })
  ]
});
```

## Security Considerations

### Network Security

- Use VPC/VNet with private subnets
- Configure security groups/NSGs
- Enable WAF for web applications
- Use API Gateway for rate limiting

### Data Security

- Encrypt data at rest and in transit
- Use managed database services with encryption
- Implement proper backup and recovery
- Regular security audits

### Application Security

- Keep dependencies updated
- Use HTTPS everywhere
- Implement proper authentication and authorization
- Sanitize user inputs
- Use environment variables for secrets

## Backup and Recovery

### Database Backups

```bash
# Automated PostgreSQL backups
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_DIR/propflow_$DATE.sql
gzip $BACKUP_DIR/propflow_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/propflow_$DATE.sql.gz s3://propflow-backups/postgresql/
```

### Application Data Backups

```bash
# Backup uploaded files
aws s3 sync s3://propflow-files s3://propflow-backups/files/$(date +%Y%m%d)/

# Backup Redis data
redis-cli --rdb /backups/redis/dump_$(date +%Y%m%d_%H%M%S).rdb
```

## Performance Optimization

### CDN Configuration

```javascript
// Next.js configuration for CDN
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.propflow.com' 
    : '',
  images: {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/propflow/',
  },
};
```

### Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_properties_location ON properties USING GIST (location);
CREATE INDEX idx_bookings_date ON bookings (scheduled_date);
CREATE INDEX idx_payments_status ON payments (status, created_at);
```

### Redis Caching Strategy

```javascript
// Cache frequently accessed data
const cacheKey = `property:${propertyId}`;
const cachedProperty = await redis.get(cacheKey);

if (!cachedProperty) {
  const property = await db.property.findById(propertyId);
  await redis.setex(cacheKey, 3600, JSON.stringify(property)); // 1 hour cache
  return property;
}

return JSON.parse(cachedProperty);
```

## Troubleshooting

### Common Issues

1. **Service Discovery Issues**
   - Check network connectivity between services
   - Verify service names in docker-compose.yml
   - Check DNS resolution

2. **Database Connection Issues**
   - Verify database credentials
   - Check network security groups
   - Ensure database is accepting connections

3. **Memory Issues**
   - Monitor container memory usage
   - Increase memory limits for AI services
   - Optimize database queries

### Health Checks

```bash
# Check service health
curl http://localhost:4000/health
curl http://localhost:8000/health

# Check database connectivity
pg_isready -h localhost -p 5432

# Check Redis connectivity
redis-cli ping
```

### Log Analysis

```bash
# View service logs
docker-compose logs -f api-gateway
docker-compose logs -f ai-services

# Search logs for errors
docker-compose logs | grep ERROR
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  api-gateway:
    deploy:
      replicas: 3
  
  ai-services:
    deploy:
      replicas: 2
```

### Auto-scaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Support

For deployment support:
- Email: support@propflow.com
- Documentation: https://docs.propflow.com
- GitHub Issues: https://github.com/yourusername/propflow-platform/issues