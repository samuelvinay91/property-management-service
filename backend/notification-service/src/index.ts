import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { initializeDatabase, gracefulShutdown, checkDatabaseHealth } from './config/database';
import { Logger, requestLoggingMiddleware } from './utils/logger';
import { NotificationService } from './services/NotificationService';
import { TemplateService } from './services/TemplateService';
import { DeliveryService } from './services/DeliveryService';

const logger = new Logger('NotificationService');

class NotificationServiceApp {
  private app: express.Application;
  private httpServer: any;
  private apolloServer: ApolloServer;
  private notificationService: NotificationService;
  private templateService: TemplateService;
  private deliveryService: DeliveryService;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.notificationService = new NotificationService();
    this.templateService = new TemplateService();
    this.deliveryService = new DeliveryService();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();
      logger.info('Database initialized successfully');

      // Setup Express middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Initialize Apollo Server
      await this.setupGraphQL();

      // Setup error handling
      this.setupErrorHandling();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('Notification service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize notification service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLoggingMiddleware);

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await checkDatabaseHealth();
        const serviceHealth = await this.deliveryService.healthCheck();
        
        const overallStatus = dbHealth.status === 'healthy' && serviceHealth.status === 'healthy' 
          ? 'healthy' 
          : 'unhealthy';

        const healthData = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          service: 'notification-service',
          version: process.env.APP_VERSION || '1.0.0',
          database: dbHealth,
          delivery: serviceHealth,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        };

        res.status(overallStatus === 'healthy' ? 200 : 503).json(healthData);
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Readiness probe
    this.app.get('/ready', async (req, res) => {
      if (this.isShuttingDown) {
        return res.status(503).json({ status: 'shutting down' });
      }

      try {
        await checkDatabaseHealth();
        res.json({ status: 'ready' });
      } catch (error) {
        res.status(503).json({ status: 'not ready', error: error.message });
      }
    });

    // Liveness probe
    this.app.get('/live', (req, res) => {
      res.json({ status: 'alive' });
    });

    // Metrics endpoint (could integrate with Prometheus)
    this.app.get('/metrics', async (req, res) => {
      try {
        const stats = await this.notificationService.getStats();
        const deliveryMetrics = await this.deliveryService.getDeliveryMetrics();
        
        res.json({
          timestamp: new Date().toISOString(),
          notifications: stats,
          delivery: deliveryMetrics,
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          }
        });
      } catch (error) {
        logger.error('Failed to get metrics', { error: error.message });
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // Webhook endpoints for external providers
    this.app.post('/webhooks/sendgrid', async (req, res) => {
      try {
        // Verify SendGrid webhook signature if configured
        const events = req.body;
        // await this.emailService.handleSendGridWebhook(events);
        logger.info('SendGrid webhook processed', { eventCount: events.length });
        res.status(200).send('OK');
      } catch (error) {
        logger.error('SendGrid webhook error', { error: error.message });
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });

    this.app.post('/webhooks/twilio', async (req, res) => {
      try {
        // await this.smsService.handleTwilioWebhook(req.body);
        logger.info('Twilio webhook processed');
        res.status(200).send('OK');
      } catch (error) {
        logger.error('Twilio webhook error', { error: error.message });
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });

    this.app.post('/webhooks/firebase', async (req, res) => {
      try {
        // Handle Firebase FCM webhooks
        logger.info('Firebase webhook processed');
        res.status(200).send('OK');
      } catch (error) {
        logger.error('Firebase webhook error', { error: error.message });
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });

    // Template management endpoints
    this.app.post('/templates/test', async (req, res) => {
      try {
        const { templateId, variables, locale } = req.body;
        const result = await this.templateService.testTemplate(templateId, variables, locale);
        res.json(result);
      } catch (error) {
        logger.error('Template test failed', { error: error.message });
        res.status(400).json({ error: error.message });
      }
    });

    // Unsubscribe endpoint
    this.app.get('/unsubscribe', async (req, res) => {
      try {
        const { token } = req.query;
        if (!token) {
          return res.status(400).send('Invalid unsubscribe token');
        }

        // Decode token and process unsubscribe
        const decoded = Buffer.from(token as string, 'base64').toString();
        const [userId, templateId] = decoded.split(':');

        // Process unsubscribe logic here
        logger.info('Unsubscribe processed', { userId, templateId });
        
        res.send(`
          <html>
            <body>
              <h1>Unsubscribed Successfully</h1>
              <p>You have been unsubscribed from notifications.</p>
            </body>
          </html>
        `);
      } catch (error) {
        logger.error('Unsubscribe failed', { error: error.message });
        res.status(400).send('Invalid unsubscribe request');
      }
    });

    // Admin endpoints (would require authentication in production)
    this.app.post('/admin/process-scheduled', async (req, res) => {
      try {
        await this.notificationService.processScheduledNotifications();
        res.json({ message: 'Scheduled notifications processed' });
      } catch (error) {
        logger.error('Failed to process scheduled notifications', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/admin/retry-failed', async (req, res) => {
      try {
        await this.notificationService.retryFailedNotifications();
        res.json({ message: 'Failed notifications retried' });
      } catch (error) {
        logger.error('Failed to retry notifications', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private async setupGraphQL(): Promise<void> {
    this.apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => ({
        // Add authentication context here
        user: req.user,
        logger: req.logger,
      }),
      formatError: (error) => {
        logger.error('GraphQL error', {
          message: error.message,
          path: error.path,
          stack: error.stack,
        });
        
        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production') {
          return new Error('Internal server error');
        }
        
        return error;
      },
      formatResponse: (response, { request }) => {
        // Log successful operations
        if (request.operationName) {
          logger.debug('GraphQL operation completed', {
            operation: request.operationName,
            variables: request.variables,
          });
        }
        return response;
      },
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
    });

    await this.apolloServer.start();
    this.apolloServer.applyMiddleware({ 
      app: this.app, 
      path: '/graphql',
      cors: false // Already handled by express cors
    });

    logger.info('GraphQL server initialized', {
      endpoint: `/graphql`,
      introspection: process.env.NODE_ENV !== 'production'
    });
  }

  private setupErrorHandling(): void {
    // Unhandled promise rejection
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', {
        reason,
        promise: promise.toString(),
      });
      
      // Exit gracefully
      this.shutdown('unhandledRejection');
    });

    // Uncaught exception
    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      
      // Exit immediately
      process.exit(1);
    });

    // Express error handler
    this.app.use((error: any, req: any, res: any, next: any) => {
      logger.error('Express error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
      });

      if (res.headersSent) {
        return next(error);
      }

      res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
      });
    });
  }

  private setupGracefulShutdown(): void {
    // Handle shutdown signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown...');
      this.shutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, starting graceful shutdown...');
      this.shutdown('SIGINT');
    });
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Starting graceful shutdown', { signal });

    const shutdownTimeout = 30000; // 30 seconds
    const shutdownTimer = setTimeout(() => {
      logger.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, shutdownTimeout);

    try {
      // Stop accepting new requests
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer.close(resolve);
        });
        logger.info('HTTP server closed');
      }

      // Stop Apollo Server
      if (this.apolloServer) {
        await this.apolloServer.stop();
        logger.info('Apollo server stopped');
      }

      // Close database connections
      await gracefulShutdown();

      clearTimeout(shutdownTimer);
      logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      clearTimeout(shutdownTimer);
      process.exit(1);
    }
  }

  async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    this.httpServer = createServer(this.app);

    await new Promise<void>((resolve) => {
      this.httpServer.listen(port, host, resolve);
    });

    logger.info('Notification service started', {
      port,
      host,
      environment: process.env.NODE_ENV || 'development',
      graphqlEndpoint: `/graphql`,
    });

    // Start background workers
    this.startBackgroundWorkers();
  }

  private startBackgroundWorkers(): void {
    // Process scheduled notifications every minute
    setInterval(async () => {
      try {
        await this.notificationService.processScheduledNotifications();
      } catch (error) {
        logger.error('Scheduled notification processing failed', { error: error.message });
      }
    }, 60000);

    // Retry failed notifications every 5 minutes
    setInterval(async () => {
      try {
        await this.notificationService.retryFailedNotifications();
      } catch (error) {
        logger.error('Retry processing failed', { error: error.message });
      }
    }, 5 * 60000);

    // Clean up template cache every hour
    setInterval(() => {
      try {
        this.templateService.cleanupCache();
      } catch (error) {
        logger.error('Cache cleanup failed', { error: error.message });
      }
    }, 60 * 60000);

    logger.info('Background workers started');
  }
}

// Start the application
async function main() {
  try {
    const app = new NotificationServiceApp();
    await app.initialize();
    await app.start();
  } catch (error) {
    logger.fatal('Failed to start notification service', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Handle top-level errors
main().catch((error) => {
  logger.fatal('Unhandled error in main', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default NotificationServiceApp;