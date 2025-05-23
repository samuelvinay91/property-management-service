import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { createConnection } from './database/connection';
import { PropertyService } from './services/PropertyService';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'dotenv/config';

const logger = {
  info: (message: string, ...args: any[]) => console.log(`ℹ️ [Property-Service] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`❌ [Property-Service] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`⚠️ [Property-Service] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`🐛 [Property-Service] ${message}`, ...args)
};

async function startServer() {
  try {
    // Initialize database connection
    await createConnection();
    
    // Initialize services
    PropertyService.initialize();
    
    const app = express();
    
    // Security middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    app.use(compression());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Health check
    app.get('/health', (req, res) => {
      res.status(200).json({
        service: 'property-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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
    
    const PORT = process.env.PROPERTY_SERVICE_PORT || 4002;
    
    app.listen(PORT, () => {
      logger.info(`🏠 Property Service ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
    
  } catch (error) {
    logger.error('Failed to start Property Service:', error);
    process.exit(1);
  }
}

startServer();