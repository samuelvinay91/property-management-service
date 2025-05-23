import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { initializeDatabase } from './config/database';
import { ApplicationService } from './services/ApplicationService';
import cors from 'cors';
import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());

// Scheduled jobs
const setupScheduledJobs = () => {
  const applicationService = new ApplicationService();
  
  // Run daily at 1 AM to expire old applications
  cron.schedule('0 1 * * *', async () => {
    try {
      const expiredCount = await applicationService.expireOldApplications();
      console.log(`Expired ${expiredCount} applications`);
    } catch (error) {
      console.error('Error expiring applications:', error);
    }
  });

  console.log('Scheduled jobs initialized');
};

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Setup scheduled jobs
    setupScheduledJobs();

    // Create Apollo Server with Federation
    const server = new ApolloServer({
      schema: buildFederatedSchema([{ typeDefs, resolvers }]),
      context: ({ req }) => {
        return {
          user: req.headers.user ? JSON.parse(req.headers.user as string) : null,
          tenantId: req.headers['x-tenant-id'] || null,
          propertyId: req.headers['x-property-id'] || null
        };
      },
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
          timestamp: new Date().toISOString()
        };
      }
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'tenant-service',
        timestamp: new Date().toISOString(),
        version: process.env.SERVICE_VERSION || '1.0.0'
      });
    });

    // Service info endpoint
    app.get('/info', (req, res) => {
      res.json({
        name: 'Tenant Service',
        description: 'Manages tenant information, applications, leases, and screening processes',
        version: process.env.SERVICE_VERSION || '1.0.0',
        endpoints: {
          graphql: `/graphql`,
          health: '/health',
          info: '/info'
        },
        features: [
          'Tenant Management',
          'Application Processing',
          'Lease Management',
          'Screening Services',
          'Emergency Contacts',
          'Document Management'
        ]
      });
    });

    // API endpoints for external integrations
    app.get('/api/tenants/:id', async (req, res) => {
      try {
        const { id } = req.params;
        // This would integrate with TenantService
        res.json({ message: `Tenant ${id} details` });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/screening/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
      try {
        // Handle screening service webhooks
        const payload = JSON.parse(req.body.toString());
        console.log('Screening webhook received:', payload);
        
        // Process the screening result
        // This would integrate with ScreeningService
        
        res.json({ received: true });
      } catch (error) {
        console.error('Screening webhook error:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // Error handling middleware
    app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Tenant Service Error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });

    app.listen(PORT, () => {
      console.log(`🏠 Tenant Service running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/health`);
      console.log(`ℹ️  Service info: http://localhost:${PORT}/info`);
    });
  } catch (error) {
    console.error('Failed to start Tenant Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing Tenant Service gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing Tenant Service gracefully');
  process.exit(0);
});

startServer();