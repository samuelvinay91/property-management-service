import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { initializeDatabase } from './config/database';
import { StripeService } from './services/StripeService';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

// Stripe webhook endpoint (must be before Apollo Server middleware)
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  const payload = req.body;

  try {
    const stripeService = new StripeService();
    const event = await stripeService.handleWebhook(payload.toString(), signature);
    
    // Handle different webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      case 'invoice.payment_succeeded':
        console.log('Subscription payment succeeded:', event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('Subscription payment failed:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Apollo Server with Federation
    const server = new ApolloServer({
      schema: buildFederatedSchema([{ typeDefs, resolvers }]),
      context: ({ req }) => {
        return {
          user: req.headers.user ? JSON.parse(req.headers.user as string) : null,
          tenantId: req.headers['x-tenant-id'] || null
        };
      }
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'payment-service',
        timestamp: new Date().toISOString()
      });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Payment Service running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Failed to start Payment Service:', error);
    process.exit(1);
  }
}

startServer();