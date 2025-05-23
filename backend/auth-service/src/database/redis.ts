import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export async function createRedisClient(): Promise<RedisClientType> {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (error) => {
      console.error('❌ Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      console.log('✅ Auth Service Redis connection established');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Auth Service Redis connection failed:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}