import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Shared utilities
import { maintenanceLogger as logger, requestLoggerMiddleware } from '../shared/utils/logger';
import { createServiceConnection } from '../shared/utils/database';
import { errorHandler, setupGlobalErrorHandlers, formatGraphQLError } from '../shared/middleware/errorHandler';
import { maintenanceNotificationClient } from '../shared/utils/notificationClient';

// Service-specific imports
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { MaintenanceService } from './services/MaintenanceService';
import { WorkOrderService } from './services/WorkOrderService';
import { VendorService } from './services/VendorService';
import { AssetService } from './services/AssetService';
import { InspectionService } from './services/InspectionService';
import { ScheduleService } from './services/ScheduleService';
import { FileUploadService } from './services/FileUploadService';
import { MaintenanceRequest } from './entities/MaintenanceRequest';
import { WorkOrder } from './entities/WorkOrder';
import { Vendor } from './entities/Vendor';
import { Asset } from './entities/Asset';
import { Inspection } from './entities/Inspection';
import { MaintenanceSchedule } from './entities/MaintenanceSchedule';
import { Expense } from './entities/Expense';
import { WorkOrderAttachment } from './entities/WorkOrderAttachment';


class MaintenanceServiceApp {
  private app: express.Application;
  private httpServer: any;
  private apolloServer: ApolloServer;
  private maintenanceService: MaintenanceService;
  private workOrderService: WorkOrderService;
  private vendorService: VendorService;
  private assetService: AssetService;
  private inspectionService: InspectionService;
  private scheduleService: ScheduleService;
  private fileUploadService: FileUploadService;
  private notificationService: NotificationService;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.maintenanceService = new MaintenanceService();
    this.workOrderService = new WorkOrderService();
    this.vendorService = new VendorService();
    this.assetService = new AssetService();
    this.inspectionService = new InspectionService();
    this.scheduleService = new ScheduleService();
    this.fileUploadService = new FileUploadService();
    this.notificationService = new NotificationService();
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

      logger.info('Maintenance service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize maintenance service', {
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
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
        const maintenanceHealth = await this.maintenanceService.healthCheck();
        
        const overallStatus = dbHealth.status === 'healthy' && maintenanceHealth.status === 'healthy' 
          ? 'healthy' 
          : 'unhealthy';

        const healthData = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          service: 'maintenance-service',
          version: process.env.APP_VERSION || '1.0.0',
          database: dbHealth,
          maintenance: maintenanceHealth,
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
        const workOrderStats = await this.workOrderService.getStatistics();
        const vendorStats = await this.vendorService.getStatistics();
        const assetStats = await this.assetService.getStatistics();
        
        res.json({
          timestamp: new Date().toISOString(),
          workOrders: workOrderStats,
          vendors: vendorStats,
          assets: assetStats,
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

    // File upload endpoints
    this.app.post('/upload/work-order/:workOrderId', async (req, res) => {
      try {
        const result = await this.fileUploadService.uploadWorkOrderAttachment(
          req.params.workOrderId, 
          req.body
        );
        res.json(result);
      } catch (error) {
        logger.error('File upload failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // QR Code generation endpoint
    this.app.get('/qr/:assetId', async (req, res) => {
      try {
        const qrCode = await this.assetService.generateAssetQRCode(req.params.assetId);
        res.setHeader('Content-Type', 'image/png');
        res.send(qrCode);
      } catch (error) {
        logger.error('QR code generation failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Admin endpoints
    this.app.post('/admin/process-schedules', async (req, res) => {
      try {
        await this.scheduleService.processScheduledMaintenance();
        res.json({ message: 'Scheduled maintenance processed' });
      } catch (error) {
        logger.error('Failed to process scheduled maintenance', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/admin/update-asset-conditions', async (req, res) => {
      try {
        await this.assetService.updateAssetConditions();
        res.json({ message: 'Asset conditions updated' });
      } catch (error) {
        logger.error('Failed to update asset conditions', { error: error.message });
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
          maintenanceService: this.maintenanceService,
          workOrderService: this.workOrderService,
          vendorService: this.vendorService,
          assetService: this.assetService,
          inspectionService: this.inspectionService,
          scheduleService: this.scheduleService,
          fileUploadService: this.fileUploadService,
          notificationService: this.notificationService,
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

    logger.info('Maintenance service started', {
      port,
      host,
      environment: process.env.NODE_ENV || 'development',
      graphqlEndpoint: `/graphql`,
    });

    this.startBackgroundWorkers();
  }

  private startBackgroundWorkers(): void {
    // Process scheduled maintenance every hour
    setInterval(async () => {
      try {
        await this.scheduleService.processScheduledMaintenance();
      } catch (error) {
        logger.error('Scheduled maintenance processing failed', { error: error.message });
      }
    }, 60 * 60000);

    // Check overdue work orders every 30 minutes
    setInterval(async () => {
      try {
        await this.workOrderService.checkOverdueWorkOrders();
      } catch (error) {
        logger.error('Overdue work order check failed', { error: error.message });
      }
    }, 30 * 60000);

    // Update asset conditions daily
    setInterval(async () => {
      try {
        await this.assetService.updateAssetConditions();
      } catch (error) {
        logger.error('Asset condition update failed', { error: error.message });
      }
    }, 24 * 60 * 60000);

    logger.info('Background workers started');
  }
}

async function main() {
  try {
    const app = new MaintenanceServiceApp();
    await app.initialize();
    await app.start();
  } catch (error) {
    logger.fatal('Failed to start maintenance service', {
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

export default MaintenanceServiceApp;