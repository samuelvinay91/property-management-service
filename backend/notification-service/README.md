# Notification Service

A comprehensive, production-ready notification service for the PropFlow property management platform. This service handles multi-channel notifications including email, SMS, push notifications, and in-app messages with advanced features like template management, scheduling, delivery tracking, and user preferences.

## Features

### Core Capabilities
- **Multi-Channel Support**: Email, SMS, Push notifications, and In-app messages
- **Template Management**: Dynamic templates with Handlebars, Mustache, and Liquid engines
- **Scheduled Notifications**: Send notifications at specific times or intervals
- **Bulk Operations**: Efficient batch processing for large-scale notifications
- **Delivery Tracking**: Real-time tracking of notification delivery status
- **User Preferences**: Comprehensive opt-in/opt-out and preference management
- **Retry Logic**: Intelligent retry mechanisms with exponential backoff
- **Rate Limiting**: Configurable rate limiting per user and channel

### Advanced Features
- **Template Versioning**: Version control for notification templates
- **Localization**: Multi-language support for notifications
- **Circuit Breaker**: Fault tolerance for external service failures
- **Webhook Support**: Integration with provider webhooks for delivery status
- **Metrics & Monitoring**: Comprehensive metrics and health checks
- **Security**: Data encryption, secure API endpoints, and audit logging

### Supported Providers
- **Email**: SendGrid, AWS SES
- **SMS**: Twilio
- **Push**: Firebase FCM, Apple APNS, OneSignal

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/propflow/notification-service.git
   cd notification-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   # Start PostgreSQL and Redis (if using Docker)
   docker-compose up -d postgres redis
   
   # Run migrations
   npm run migration:run
   ```

5. **Start the service**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# Start with monitoring tools
docker-compose --profile monitoring up -d

# Start with admin tools
docker-compose --profile tools up -d
```

## Configuration

### Environment Variables

Key configuration options (see `.env.example` for complete list):

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notification_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SendGrid
SENDGRID_API_KEY=your-api-key
DEFAULT_FROM_EMAIL=noreply@yourapp.com

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=base64-encoded-key
```

### Provider Configuration

Each notification provider requires specific configuration:

#### Email (SendGrid)
```bash
SENDGRID_API_KEY=SG.xxx
DEFAULT_FROM_EMAIL=noreply@yourapp.com
DEFAULT_FROM_NAME="Your App"
```

#### SMS (Twilio)
```bash
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### Push (Firebase)
```bash
FIREBASE_PROJECT_ID=your-project
FIREBASE_SERVICE_ACCOUNT_KEY=base64-encoded-json
```

## API Usage

### GraphQL API

The service exposes a GraphQL API at `/graphql`. Here are some common operations:

#### Send a Single Notification

```graphql
mutation SendNotification {
  sendNotification(input: {
    recipientId: "user123"
    channel: EMAIL
    subject: "Welcome to PropFlow"
    content: "Thank you for joining!"
    templateId: "welcome-template"
    templateVariables: {
      userName: "John Doe"
      propertyName: "Sunset Apartments"
    }
  }) {
    id
    status
    createdAt
  }
}
```

#### Send Bulk Notifications

```graphql
mutation SendBulkNotifications {
  sendBulkNotifications(input: {
    recipientIds: ["user1", "user2", "user3"]
    channel: SMS
    subject: "Maintenance Alert"
    content: "Scheduled maintenance tomorrow at {{time}}"
    templateVariables: {
      time: "9:00 AM"
    }
    batchSize: 100
  }) {
    id
    status
    metrics {
      totalRecipients
      sentCount
    }
  }
}
```

#### Create a Template

```graphql
mutation CreateTemplate {
  createTemplate(input: {
    name: "welcome-email"
    channel: EMAIL
    type: TRANSACTIONAL
    variables: [
      {
        name: "userName"
        type: "string"
        required: true
      }
    ]
    content: {
      en: {
        subject: "Welcome {{userName}}!"
        body: "Hello {{userName}}, welcome to PropFlow!"
        htmlBody: "<h1>Welcome {{userName}}!</h1><p>Hello {{userName}}, welcome to PropFlow!</p>"
      }
    }
    settings: {
      engine: HANDLEBARS
      enableHtml: true
      trackOpens: true
      trackClicks: true
    }
  }) {
    id
    name
    status
  }
}
```

#### Manage User Preferences

```graphql
mutation UpdateUserPreference {
  updateUserPreference(
    userId: "user123"
    input: {
      channel: EMAIL
      type: MARKETING
      enabled: false
      channelSettings: {
        enabled: true
        frequency: "daily"
        quietHours: {
          enabled: true
          startTime: "22:00"
          endTime: "08:00"
          timezone: "America/New_York"
        }
      }
    }
  ) {
    id
    enabled
    channelSettings {
      frequency
    }
  }
}
```

### REST API

Key REST endpoints:

#### Health Check
```bash
GET /health
```

#### Metrics
```bash
GET /metrics
```

#### Webhooks
```bash
POST /webhooks/sendgrid
POST /webhooks/twilio
POST /webhooks/firebase
```

#### Template Testing
```bash
POST /templates/test
{
  "templateId": "template-id",
  "variables": { "userName": "Test User" },
  "locale": "en"
}
```

## Template System

### Template Engines

The service supports multiple template engines:

- **Handlebars**: Full-featured with helpers and partials
- **Mustache**: Logic-less templates
- **Liquid**: Shopify's template language

### Template Variables

Define template variables with validation:

```javascript
{
  name: "amount",
  type: "number",
  required: true,
  validation: {
    min: 0,
    max: 1000000
  }
}
```

### Built-in Helpers

Handlebars templates include helpful utilities:

```handlebars
{{formatDate createdAt "long"}}
{{formatCurrency amount "USD"}}
{{capitalize userName}}
{{truncate description 100}}
{{#ifEquals status "active"}}Active{{/ifEquals}}
```

### Localization

Templates support multiple locales:

```json
{
  "content": {
    "en": {
      "subject": "Welcome!",
      "body": "Hello {{userName}}!"
    },
    "es": {
      "subject": "¡Bienvenido!",
      "body": "¡Hola {{userName}}!"
    }
  }
}
```

## User Preferences

### Preference Types

- **Global**: Apply to all notifications
- **Channel-specific**: Apply to specific channels (email, SMS, etc.)
- **Type-specific**: Apply to specific notification types (marketing, transactional)
- **Granular**: Specific channel + type combinations

### Quiet Hours

Configure when users don't want to receive notifications:

```json
{
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "America/New_York"
  }
}
```

### Rate Limiting

Prevent notification spam:

```json
{
  "rateLimits": {
    "maxPerHour": 10,
    "maxPerDay": 50,
    "maxPerWeek": 200
  }
}
```

## Monitoring & Observability

### Health Checks

- **Liveness**: `/live` - Service is running
- **Readiness**: `/ready` - Service is ready to handle requests  
- **Health**: `/health` - Comprehensive health check

### Metrics

Available at `/metrics`:

- Notification counts by status, channel, and type
- Delivery rates and latency
- Template usage statistics
- Provider performance metrics
- System resource usage

### Logging

Structured JSON logging with multiple levels:

```javascript
// Notification events
logger.notificationSent(notificationId, recipientId, channel);
logger.notificationFailed(notificationId, recipientId, channel, error);

// Template events  
logger.templateRendered(templateId, locale, renderTime);

// Webhook events
logger.webhookReceived(provider, event, messageId);

// Performance metrics
logger.performanceMetric('template-render', duration);
```

### Distributed Tracing

Correlation IDs for request tracing:

```javascript
const correlatedLogger = logger.withCorrelationId(correlationId);
correlatedLogger.info('Processing notification');
```

## Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export DB_HOST=your-db-host
   # ... other variables
   ```

3. **Run database migrations**
   ```bash
   npm run migration:run
   ```

4. **Start the service**
   ```bash
   npm start
   ```

### Docker Deployment

```bash
# Build production image
docker build --target production -t notification-service .

# Run container
docker run -d \
  --name notification-service \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  notification-service
```

### Kubernetes Deployment

Example Kubernetes manifests:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: notification-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: host
        livenessProbe:
          httpGet:
            path: /live
            port: 3000
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
```

## Performance Tuning

### Database Optimization

- **Indexes**: Pre-configured indexes for common queries
- **Connection Pooling**: Configurable connection limits
- **Query Caching**: Redis-based query result caching

### Memory Management

- **Template Caching**: Compiled templates cached in memory
- **Connection Pooling**: Reuse database connections
- **Garbage Collection**: Optimized for Node.js performance

### Scaling

- **Horizontal Scaling**: Stateless design supports multiple instances
- **Queue-based Processing**: Async processing for bulk operations
- **Circuit Breakers**: Prevent cascade failures

## Security

### Data Protection

- **Encryption**: Sensitive data encrypted at rest
- **API Security**: Rate limiting and request validation
- **Audit Logging**: Comprehensive audit trail

### Compliance

- **GDPR**: Built-in data retention and deletion policies
- **Opt-out Management**: Easy unsubscribe mechanisms
- **Data Minimization**: Store only necessary user data

### Best Practices

- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Protection**: Parameterized queries only
- **XSS Prevention**: Template output escaped by default

## Development

### Project Structure

```
src/
├── entities/          # Database entities
├── services/          # Business logic services
├── graphql/           # GraphQL schema and resolvers
├── config/            # Configuration files
├── utils/             # Utility functions
└── index.ts           # Application entry point
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck
```

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials and connectivity
   - Verify database server is running
   - Check firewall settings

2. **Provider API Errors**
   - Verify API keys and credentials
   - Check provider service status
   - Review rate limits and quotas

3. **Template Rendering Errors**
   - Validate template syntax
   - Check variable names and types
   - Review template engine compatibility

4. **High Memory Usage**
   - Check template cache settings
   - Monitor database connection pool
   - Review bulk operation batch sizes

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Performance Profiling

Monitor performance metrics:

```bash
# Enable performance monitoring
METRICS_ENABLED=true npm start

# View metrics
curl http://localhost:3000/metrics
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Start development environment
docker-compose up -d

# Start the service in dev mode
npm run dev
```

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**PropFlow Notification Service** - Reliable, scalable, and feature-rich notification delivery for modern applications.