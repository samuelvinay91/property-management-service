import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { createConnection } from './database/connection';
import { createRedisClient } from './database/redis';
import { createLogger } from '../../../backend/api-gateway/src/utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { initializePassport } from './config/passport';
import passport from 'passport';

const logger = createLogger('Auth-Service');

async function startServer() {
  try {
    // Initialize database connections
    await createConnection();
    await createRedisClient();
    
    const app = express();
    
    // Initialize Passport
    initializePassport();
    app.use(passport.initialize());
    
    // Health check
    app.get('/health', (req, res) => {
      res.status(200).json({
        service: 'auth-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });
    
    // Apollo Server
    const server = new ApolloServer({
      schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
      context: ({ req }) => ({
        user: req.user,
        headers: req.headers
      }),
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production'
    });
    
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });
    
    // Error handling
    app.use(errorHandler);
    
    const PORT = process.env.AUTH_SERVICE_PORT || 4001;
    
    app.listen(PORT, () => {
      logger.info(`🔐 Auth Service ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
    
  } catch (error) {
    logger.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
}

startServer();