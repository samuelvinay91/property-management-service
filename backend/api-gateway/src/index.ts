import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { metricsMiddleware } from './middleware/metrics';

const logger = createLogger('API-Gateway');

async function startServer() {
  const app = express();
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }));
  
  app.use(compression());
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 50
  });
  
  app.use('/graphql', limiter, speedLimiter);
  
  // Metrics and monitoring
  app.use(metricsMiddleware);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Apollo Gateway configuration
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        { name: 'auth', url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001/graphql' },
        { name: 'properties', url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:4002/graphql' },
        { name: 'tenants', url: process.env.TENANT_SERVICE_URL || 'http://localhost:4003/graphql' },
        { name: 'payments', url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004/graphql' },
        { name: 'notifications', url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005/graphql' },
        { name: 'maintenance', url: process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:4006/graphql' },
        { name: 'bookings', url: process.env.BOOKING_SERVICE_URL || 'http://localhost:4007/graphql' }
      ]
    })
  });
  
  // Apollo Server setup
  const server = new ApolloServer({
    gateway,
    context: ({ req }) => {
      // Extract user from auth middleware
      const user = (req as any).user;
      return {
        user,
        headers: req.headers
      };
    },
    plugins: [
      {
        requestDidStart() {
          return {
            didResolveOperation(requestContext) {
              logger.info('GraphQL Operation', {
                operationName: requestContext.request.operationName,
                query: requestContext.request.query,
                variables: requestContext.request.variables
              });
            },
            didEncounterErrors(requestContext) {
              logger.error('GraphQL Errors', {
                errors: requestContext.errors,
                operationName: requestContext.request.operationName
              });
            }
          };
        }
      }
    ],
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production'
  });
  
  await server.start();
  
  // Apply auth middleware before Apollo
  app.use('/graphql', authMiddleware);
  
  server.applyMiddleware({ 
    app, 
    path: '/graphql',
    cors: false // CORS already handled above
  });
  
  // Error handling
  app.use(errorHandler);
  
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    logger.info(`🚀 API Gateway ready at http://localhost:${PORT}${server.graphqlPath}`);
    logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

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

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});