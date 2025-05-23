import { execSync } from 'child_process';
import { Client } from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  try {
    // Start test databases if needed (Docker)
    if (process.env.USE_DOCKER_FOR_TESTS === 'true') {
      console.log('📦 Starting test containers...');
      execSync('docker-compose -f docker-compose.test.yml up -d postgres redis', {
        stdio: 'inherit'
      });
      
      // Wait for services to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Verify PostgreSQL connection
    console.log('🐘 Verifying PostgreSQL connection...');
    const pgClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres'
    });

    await pgClient.connect();
    console.log('✅ PostgreSQL connection verified');
    await pgClient.end();

    // Verify Redis connection
    console.log('🔴 Verifying Redis connection...');
    const redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true
    });

    await redisClient.connect();
    console.log('✅ Redis connection verified');
    redisClient.disconnect();

    console.log('✅ Test environment setup complete');

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    process.exit(1);
  }
}