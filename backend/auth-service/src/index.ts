import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import passport from 'passport';
import 'dotenv/config';

// Shared utilities
import { authLogger as logger, requestLoggerMiddleware } from '../shared/utils/logger';
import { createServiceConnection } from '../shared/utils/database';
import { errorHandler, setupGlobalErrorHandlers, formatGraphQLError } from '../shared/middleware/errorHandler';
import { authNotificationClient } from '../shared/utils/notificationClient';

// Service-specific imports
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { createRedisClient } from './database/redis';
import { initializePassport } from './config/passport';
import { User } from './entities/User';

async function startServer() {
  try {
    // Setup global error handlers
    setupGlobalErrorHandlers('AuthService');

    // Initialize database connection using shared factory
    const connection = await createServiceConnection('AuthService', [User], {
      enableRetry: true,
      retryAttempts: 3,
      logging: process.env.NODE_ENV === 'development'
    });

    // Initialize Redis connection
    await createRedisClient();

    // Test notification service connection
    const notificationHealthy = await authNotificationClient.healthCheck();
    if (!notificationHealthy) {
      logger.warn('Notification service is not available - notifications will be queued');
    }
    
    const app = express();
    
    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production'
    }));
    
    app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    app.use(compression());

    // Request logging middleware
    app.use(requestLoggerMiddleware('AuthService'));

    // Initialize Passport
    initializePassport();
    app.use(passport.initialize());

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'AuthService',
        timestamp: new Date().toISOString(),
        database: connection.isInitialized,
        notifications: notificationHealthy
      });
    });
    
    // Create Apollo Server
    const server = new ApolloServer({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
      formatError: formatGraphQLError('AuthService'),
      context: ({ req }) => ({
        user: req.user,
        logger: logger.child({ 
          traceId: req.headers['x-trace-id'],
          userId: req.user?.id 
        }),
        notificationClient: authNotificationClient
      }),
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production'
    });
    
    await server.start();
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // Already handled above
    });

    // Error handling middleware (must be last)
    app.use(errorHandler('AuthService'));

    const port = process.env.PORT || 3001;
    
    app.listen(port, () => {
      logger.info(`🚀 Auth Service running on port ${port}`);
      logger.info(`📊 GraphQL endpoint: http://localhost:${port}${server.graphqlPath}`);
      logger.info(`🏥 Health check: http://localhost:${port}/health`);
    });

  } catch (error) {
    logger.error('Failed to start Auth Service', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();