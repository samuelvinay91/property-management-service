import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server-plugin-landing-page-local-default';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import morgan from 'morgan';
import { json } from 'body-parser';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { metricsMiddleware } from './middleware/metrics';

dotenv.config();

const logger = createLogger('API-Gateway');
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

interface Context {
  user?: any;
  ip: string;
  userAgent?: string;
}

async function startServer() {
  const app = express();

  // Logging middleware
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));
  
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));

  app.use(compression());
  app.use(json({ limit: '50mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/graphql', limiter);

  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes at full speed
    delayMs: 500 // begin adding 500ms of delay per request
  });
  app.use('/graphql', speedLimiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV
    });
  });

  // Metrics endpoint
  app.get('/metrics', metricsMiddleware);

  // Apollo Gateway setup with service discovery
  const subgraphs = [
    { 
      name: 'auth', 
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001/graphql' 
    },
    { 
      name: 'properties', 
      url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:4002/graphql' 
    },
    { 
      name: 'tenants', 
      url: process.env.TENANT_SERVICE_URL || 'http://localhost:4003/graphql' 
    },
    { 
      name: 'maintenance', 
      url: process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:4004/graphql' 
    },
    { 
      name: 'bookings', 
      url: process.env.BOOKING_SERVICE_URL || 'http://localhost:4005/graphql' 
    },
    { 
      name: 'payments', 
      url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4006/graphql' 
    },
    { 
      name: 'notifications', 
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007/graphql' 
    }
  ];

  logger.info('Configuring GraphQL Federation with subgraphs:', 
    subgraphs.map(s => `${s.name}: ${s.url}`).join(', '));

  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs,
      introspectionHeaders: {
        'User-Agent': 'PropFlow-Gateway/1.0'
      }
    }),
    buildService({ url }) {
      return { url };
    }
  });

  const server = new ApolloServer<Context>({
    gateway,
    plugins: [
      NODE_ENV === 'development' ? 
        ApolloServerPluginLandingPageLocalDefault({ embed: true }) : 
        undefined,
      {
        requestDidStart() {
          return {
            didResolveOperation(requestContext) {
              logger.info('GraphQL Operation', {
                operationName: requestContext.request.operationName,
                variables: requestContext.request.variables
              });
            },
            didEncounterErrors(requestContext) {
              logger.error('GraphQL Errors', {
                errors: requestContext.errors?.map(e => ({
                  message: e.message,
                  locations: e.locations,
                  path: e.path
                })),
                operationName: requestContext.request.operationName
              });
            }
          };
        }
      }
    ].filter(Boolean),
    introspection: NODE_ENV !== 'production',
    formatError: (error) => {
      logger.error('GraphQL Error:', {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: error.extensions
      });
      
      // Don't expose internal errors in production
      if (NODE_ENV === 'production' && error.message.includes('INTERNAL_ERROR')) {
        return new Error('Internal server error');
      }
      
      return error;
    }
  });

  await server.start();
  
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        // Apply auth middleware to extract user
        const user = await authMiddleware(req);
        
        return {
          user,
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent')
        };
      }
    })
  );

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`
    });
  });
  const httpServer = app.listen(PORT, () => {
    logger.info(`🚀 PropFlow API Gateway ready at http://localhost:${PORT}/graphql`);
    logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
    logger.info(`📈 Metrics available at http://localhost:${PORT}/metrics`);
    logger.info(`🌍 Environment: ${NODE_ENV}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    httpServer.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer().catch((error) => {
  logger.error('Failed to start API Gateway:', error);
  process.exit(1);
});