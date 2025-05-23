import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Shared utilities
import { bookingLogger as logger, requestLoggerMiddleware } from '../shared/utils/logger';
import { createServiceConnection } from '../shared/utils/database';
import { errorHandler, setupGlobalErrorHandlers, formatGraphQLError } from '../shared/middleware/errorHandler';
import { bookingNotificationClient } from '../shared/utils/notificationClient';

// Service-specific imports
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { BookingService } from './services/BookingService';
import { SlotService } from './services/SlotService';
import { TemplateService } from './services/TemplateService';
import { ParticipantService } from './services/ParticipantService';
import { Booking } from './entities/Booking';
import { BookingSlot } from './entities/BookingSlot';
import { Calendar } from './entities/Calendar';
import { AvailabilityTemplate } from './entities/AvailabilityTemplate';
import { Participant } from './entities/Participant';

class BookingServiceApp {
  private app: express.Application;
  private httpServer: any;
  private apolloServer: ApolloServer;
  private bookingService: BookingService;
  private slotService: SlotService;
  private templateService: TemplateService;
  private participantService: ParticipantService;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.bookingService = new BookingService();
    this.slotService = new SlotService();
    this.templateService = new TemplateService();
    this.participantService = new ParticipantService();
  }

  async initialize(): Promise<void> {
    try {
      // Setup global error handlers
      setupGlobalErrorHandlers('BookingService');

      // Initialize database connection using shared factory
      const connection = await createServiceConnection('BookingService', [
        Booking, BookingSlot, Calendar, AvailabilityTemplate, Participant
      ], {
        enableRetry: true,
        retryAttempts: 3,
        logging: process.env.NODE_ENV === 'development'
      });

      logger.info('Database initialized successfully');

      // Test notification service connection
      const notificationHealthy = await bookingNotificationClient.healthCheck();
      if (!notificationHealthy) {
        logger.warn('Notification service is not available - notifications will be queued');
      }

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

      logger.info('Booking service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize booking service', error);
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
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLoggerMiddleware('BookingService'));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await checkDatabaseHealth();
        
        const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

        const healthData = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          service: 'booking-service',
          version: process.env.APP_VERSION || '1.0.0',
          database: dbHealth,
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

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const bookingStats = await this.bookingService.getBookingStats();
        
        res.json({
          timestamp: new Date().toISOString(),
          bookings: bookingStats,
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

    // Calendar export endpoint
    this.app.get('/calendar/ical/:bookingId', async (req, res) => {
      try {
        const { bookingId } = req.params;
        const booking = await this.bookingService.getBookingById(bookingId);
        
        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }

        // Generate iCal content (placeholder)
        const icalContent = this.generateICalContent(booking);
        
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="booking-${bookingId}.ics"`);
        res.send(icalContent);
      } catch (error) {
        logger.error('Failed to export calendar', { error: error.message });
        res.status(500).json({ error: 'Failed to export calendar' });
      }
    });

    // Quick availability check endpoint
    this.app.get('/availability/quick', async (req, res) => {
      try {
        const { resourceId, date, duration } = req.query;
        
        if (!resourceId || !date) {
          return res.status(400).json({ error: 'resourceId and date are required' });
        }

        const startOfDay = new Date(date as string);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date as string);
        endOfDay.setHours(23, 59, 59, 999);

        const availability = await this.slotService.getSlotAvailability({
          resourceId,
          dateFrom: startOfDay,
          dateTo: endOfDay,
          duration: duration ? parseInt(duration as string) : undefined
        });

        res.json(availability);
      } catch (error) {
        logger.error('Failed to check availability', { error: error.message });
        res.status(500).json({ error: 'Failed to check availability' });
      }
    });

    // Admin endpoints
    this.app.post('/admin/generate-slots', async (req, res) => {
      try {
        const { templateId, dateFrom, dateTo } = req.body;
        
        if (!templateId || !dateFrom || !dateTo) {
          return res.status(400).json({ error: 'templateId, dateFrom, and dateTo are required' });
        }

        const slots = await this.slotService.generateSlotsFromTemplate(
          templateId,
          new Date(dateFrom),
          new Date(dateTo)
        );

        res.json({ 
          message: 'Slots generated successfully',
          count: slots.length,
          slots: slots.map(s => ({ id: s.id, startTime: s.startTime, endTime: s.endTime }))
        });
      } catch (error) {
        logger.error('Failed to generate slots', { error: error.message });
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
        user: req.user,
        logger: req.logger,
        services: {
          bookingService: this.bookingService,
          slotService: this.slotService,
          templateService: this.templateService,
          participantService: this.participantService,
        }
      }),
      formatError: (error) => {
        logger.error('GraphQL error', {
          message: error.message,
          path: error.path,
          stack: error.stack,
        });
        
        if (process.env.NODE_ENV === 'production') {
          return new Error('Internal server error');
        }
        
        return error;
      },
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
    });

    await this.apolloServer.start();
    this.apolloServer.applyMiddleware({ 
      app: this.app, 
      path: '/graphql',
      cors: false
    });

    logger.info('GraphQL server initialized', {
      endpoint: `/graphql`,
      introspection: process.env.NODE_ENV !== 'production'
    });
  }

  private setupErrorHandling(): void {
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', {
        reason,
        promise: promise.toString(),
      });
      this.shutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

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

    const shutdownTimeout = 30000;
    const shutdownTimer = setTimeout(() => {
      logger.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, shutdownTimeout);

    try {
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer.close(resolve);
        });
        logger.info('HTTP server closed');
      }

      if (this.apolloServer) {
        await this.apolloServer.stop();
        logger.info('Apollo server stopped');
      }

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

    logger.info('Booking service started', {
      port,
      host,
      environment: process.env.NODE_ENV || 'development',
      graphqlEndpoint: `/graphql`,
    });

    this.startBackgroundWorkers();
  }

  private startBackgroundWorkers(): void {
    // Check for overdue bookings every hour
    setInterval(async () => {
      try {
        logger.debug('Checking for overdue bookings');
        // Implementation would check for overdue bookings and update status
      } catch (error) {
        logger.error('Overdue booking check failed', { error: error.message });
      }
    }, 60 * 60000);

    // Send reminders every 15 minutes
    setInterval(async () => {
      try {
        logger.debug('Processing booking reminders');
        // Implementation would send scheduled reminders
      } catch (error) {
        logger.error('Reminder processing failed', { error: error.message });
      }
    }, 15 * 60000);

    logger.info('Background workers started');
  }

  private generateICalContent(booking: any): string {
    // Basic iCal content generation (placeholder)
    const startDate = new Date(booking.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(booking.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PropFlow//Booking Service//EN
BEGIN:VEVENT
UID:booking-${booking.id}@propflow.com
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${booking.title}
DESCRIPTION:${booking.description || ''}
LOCATION:${booking.location || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  }
}

async function main() {
  try {
    const app = new BookingServiceApp();
    await app.initialize();
    await app.start();
  } catch (error) {
    logger.fatal('Failed to start booking service', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

main().catch((error) => {
  logger.fatal('Unhandled error in main', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default BookingServiceApp;