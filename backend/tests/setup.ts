import { Connection, createConnection } from 'typeorm';
import { Client } from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test variables
declare global {
  var __DB_CONNECTION__: Connection;
  var __REDIS_CLIENT__: Redis;
  var __TEST_USER__: any;
  var __TEST_PROPERTY__: any;
}

// Database setup for tests
export async function setupTestDatabase() {
  // Create test database if it doesn't exist
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres'
  });

  await client.connect();
  
  try {
    await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'propflow_test'}`);
  } catch (error) {
    // Database might already exist
  }
  
  await client.end();

  // Connect to test database
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'propflow_test',
    entities: [
      '../auth-service/src/entities/*.ts',
      '../property-service/src/entities/*.ts',
      '../tenant-service/src/entities/*.ts',
      '../maintenance-service/src/entities/*.ts',
      '../booking-service/src/entities/*.ts',
      '../payment-service/src/entities/*.ts',
      '../notification-service/src/entities/*.ts'
    ],
    synchronize: true,
    logging: false,
    dropSchema: true
  });

  global.__DB_CONNECTION__ = connection;
  return connection;
}

// Redis setup for tests
export async function setupTestRedis() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '1'), // Use different DB for tests
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true
  });

  await redis.connect();
  await redis.flushdb(); // Clear test database
  
  global.__REDIS_CLIENT__ = redis;
  return redis;
}

// Mock external services
export function setupMocks() {
  // Mock email service
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    }))
  }));

  // Mock SMS service
  jest.mock('twilio', () => ({
    Twilio: jest.fn(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'test-sms-sid' })
      }
    }))
  }));

  // Mock Stripe
  jest.mock('stripe', () => ({
    Stripe: jest.fn(() => ({
      paymentIntents: {
        create: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
        retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' })
      },
      customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
        retrieve: jest.fn().mockResolvedValue({ id: 'cus_test' })
      }
    }))
  }));

  // Mock file upload
  jest.mock('multer', () => ({
    diskStorage: jest.fn(() => ({})),
    memoryStorage: jest.fn(() => ({}))
  }));
}

// Create test fixtures
export async function createTestFixtures() {
  const connection = global.__DB_CONNECTION__;
  
  // Create test user
  const testUser = {
    id: 'test-user-1',
    email: 'test@propflow.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'PROPERTY_MANAGER',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Create test property
  const testProperty = {
    id: 'test-property-1',
    name: 'Test Property',
    type: 'APARTMENT',
    status: 'ACTIVE',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  global.__TEST_USER__ = testUser;
  global.__TEST_PROPERTY__ = testProperty;

  return { testUser, testProperty };
}

// Cleanup function
export async function cleanupTest() {
  if (global.__REDIS_CLIENT__) {
    await global.__REDIS_CLIENT__.flushdb();
    global.__REDIS_CLIENT__.disconnect();
  }

  if (global.__DB_CONNECTION__) {
    await global.__DB_CONNECTION__.dropDatabase();
    await global.__DB_CONNECTION__.close();
  }
}

// Jest setup
beforeAll(async () => {
  await setupTestDatabase();
  await setupTestRedis();
  setupMocks();
  await createTestFixtures();
});

afterAll(async () => {
  await cleanupTest();
});

beforeEach(async () => {
  // Clear Redis before each test
  if (global.__REDIS_CLIENT__) {
    await global.__REDIS_CLIENT__.flushdb();
  }
});

afterEach(async () => {
  // Reset all mocks after each test
  jest.clearAllMocks();
});