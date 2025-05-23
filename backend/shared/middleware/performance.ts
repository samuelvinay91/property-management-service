import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';
import { promisify } from 'util';

// Redis setup for caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 3, // Use different DB for performance caching
});

// In-memory cache for frequently accessed data
const memoryCache = new LRUCache<string, any>({
  max: 1000, // Maximum 1000 items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

// Compression middleware with optimized settings
export const performanceCompression = compression({
  level: 6, // Compression level (1-9, 6 is a good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress responses with cache-control: no-transform
    if (res.getHeader('Cache-Control')?.toString().includes('no-transform')) {
      return false;
    }
    
    // Compress all responses that compression supports
    return compression.filter(req, res);
  },
  chunkSize: 16 * 1024, // 16KB chunks
  windowBits: 15,
  memLevel: 8,
});

// Response caching middleware
export const responseCache = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching for authenticated requests (unless explicitly allowed)
    if (req.headers.authorization && !req.query.allowCache) {
      return next();
    }
    
    const cacheKey = `cache:response:${req.originalUrl || req.url}`;
    
    try {
      // Check memory cache first
      let cachedResponse = memoryCache.get(cacheKey);
      
      // If not in memory, check Redis
      if (!cachedResponse) {
        const redisResponse = await redis.get(cacheKey);
        if (redisResponse) {
          cachedResponse = JSON.parse(redisResponse);
          // Store in memory cache for faster access
          memoryCache.set(cacheKey, cachedResponse);
        }
      }
      
      if (cachedResponse) {
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=${ttl}`);
        res.set(cachedResponse.headers);
        return res.status(cachedResponse.status).send(cachedResponse.body);
      }
      
      // Cache miss - capture response
      const originalSend = res.send;
      res.send = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            status: res.statusCode,
            headers: res.getHeaders(),
            body: body,
            timestamp: Date.now(),
          };
          
          // Store in both memory and Redis
          memoryCache.set(cacheKey, responseData);
          redis.setex(cacheKey, ttl, JSON.stringify(responseData)).catch(console.error);
          
          res.set('X-Cache', 'MISS');
          res.set('Cache-Control', `public, max-age=${ttl}`);
        }
        
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

// Database query result caching
export class QueryCache {
  private static instance: QueryCache;
  private cache: LRUCache<string, any>;
  
  private constructor() {
    this.cache = new LRUCache({
      max: 5000,
      ttl: 1000 * 60 * 10, // 10 minutes
      allowStale: false,
    });
  }
  
  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }
  
  async get<T>(key: string): Promise<T | undefined> {
    // Check memory cache first
    let result = this.cache.get(key);
    
    if (!result) {
      // Check Redis cache
      try {
        const redisResult = await redis.get(`query:${key}`);
        if (redisResult) {
          result = JSON.parse(redisResult);
          this.cache.set(key, result);
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }
    
    return result;
  }
  
  async set(key: string, value: any, ttl: number = 600): Promise<void> {
    // Store in memory cache
    this.cache.set(key, value);
    
    // Store in Redis cache
    try {
      await redis.setex(`query:${key}`, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    
    // Clear from Redis cache
    try {
      const keys = await redis.keys(`query:*${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }
  
  clear(): void {
    this.cache.clear();
    redis.flushdb().catch(console.error);
  }
}

// Connection pooling for database
export const createConnectionPool = (config: any) => {
  return {
    ...config,
    pool: {
      min: 2,
      max: 10,
      acquire: 30000,
      idle: 10000,
      createTimeoutMillis: 8000,
      acquireTimeoutMillis: 8000,
      idleTimeoutMillis: 10000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    dialectOptions: {
      ...config.dialectOptions,
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
    },
  };
};

// Request deduplication middleware
const requestDeduplicationCache = new LRUCache<string, Promise<any>>({
  max: 1000,
  ttl: 1000 * 30, // 30 seconds
});

export const requestDeduplication = (req: Request, res: Response, next: NextFunction) => {
  // Only deduplicate GET requests
  if (req.method !== 'GET') {
    return next();
  }
  
  const key = `${req.method}:${req.originalUrl || req.url}:${req.get('User-Agent')}`;
  const existingRequest = requestDeduplicationCache.get(key);
  
  if (existingRequest) {
    // Wait for the existing request to complete
    existingRequest
      .then(result => {
        res.set('X-Request-Deduplication', 'HIT');
        res.json(result);
      })
      .catch(error => {
        res.status(500).json({ error: 'Request processing failed' });
      });
    return;
  }
  
  // Create a promise for this request
  const requestPromise = new Promise((resolve, reject) => {
    const originalSend = res.send;
    res.send = function(body) {
      try {
        const result = typeof body === 'string' ? JSON.parse(body) : body;
        resolve(result);
      } catch (error) {
        resolve(body);
      }
      return originalSend.call(this, body);
    };
    
    const originalStatus = res.status;
    res.status = function(code) {
      if (code >= 400) {
        reject(new Error(`HTTP ${code}`));
      }
      return originalStatus.call(this, code);
    };
    
    next();
  });
  
  requestDeduplicationCache.set(key, requestPromise);
  
  // Clean up after request completes
  requestPromise.finally(() => {
    requestDeduplicationCache.delete(key);
  });
};

// GraphQL query optimization
export const optimizeGraphQLQuery = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.query) {
    // Add query complexity analysis
    const query = req.body.query;
    const complexity = calculateQueryComplexity(query);
    
    if (complexity > 1000) {
      return res.status(400).json({
        error: 'Query too complex',
        message: 'Query complexity exceeds maximum allowed limit',
        complexity,
        maxComplexity: 1000,
      });
    }
    
    // Add query depth analysis
    const depth = calculateQueryDepth(query);
    
    if (depth > 10) {
      return res.status(400).json({
        error: 'Query too deep',
        message: 'Query depth exceeds maximum allowed limit',
        depth,
        maxDepth: 10,
      });
    }
    
    req.body.queryMetrics = { complexity, depth };
  }
  
  next();
};

// Calculate GraphQL query complexity (simplified)
const calculateQueryComplexity = (query: string): number => {
  // Simple complexity calculation based on field count and nesting
  const fieldMatches = query.match(/{[^}]*}/g) || [];
  const nestedQueries = query.match(/\w+\s*{/g) || [];
  
  return fieldMatches.length * 10 + nestedQueries.length * 5;
};

// Calculate GraphQL query depth
const calculateQueryDepth = (query: string): number => {
  let depth = 0;
  let currentDepth = 0;
  
  for (const char of query) {
    if (char === '{') {
      currentDepth++;
      depth = Math.max(depth, currentDepth);
    } else if (char === '}') {
      currentDepth--;
    }
  }
  
  return depth;
};

// Pagination optimization
export const optimizePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 20 } = req.query;
  
  // Limit maximum page size
  const maxLimit = 100;
  const normalizedLimit = Math.min(parseInt(limit as string) || 20, maxLimit);
  const normalizedPage = Math.max(parseInt(page as string) || 1, 1);
  
  // Calculate offset
  const offset = (normalizedPage - 1) * normalizedLimit;
  
  // Add pagination info to request
  req.pagination = {
    page: normalizedPage,
    limit: normalizedLimit,
    offset,
  };
  
  next();
};

// Background job queue for heavy operations
class BackgroundJobQueue {
  private static instance: BackgroundJobQueue;
  private jobs: Map<string, any> = new Map();
  
  static getInstance(): BackgroundJobQueue {
    if (!BackgroundJobQueue.instance) {
      BackgroundJobQueue.instance = new BackgroundJobQueue();
    }
    return BackgroundJobQueue.instance;
  }
  
  async addJob(jobId: string, jobFunction: () => Promise<any>): Promise<void> {
    this.jobs.set(jobId, {
      status: 'pending',
      createdAt: new Date(),
      result: null,
      error: null,
    });
    
    // Execute job asynchronously
    this.executeJob(jobId, jobFunction);
  }
  
  private async executeJob(jobId: string, jobFunction: () => Promise<any>): Promise<void> {
    try {
      this.jobs.set(jobId, {
        ...this.jobs.get(jobId),
        status: 'running',
        startedAt: new Date(),
      });
      
      const result = await jobFunction();
      
      this.jobs.set(jobId, {
        ...this.jobs.get(jobId),
        status: 'completed',
        completedAt: new Date(),
        result,
      });
      
      // Store result in Redis for persistence
      await redis.setex(`job:${jobId}`, 3600, JSON.stringify(this.jobs.get(jobId)));
      
    } catch (error) {
      this.jobs.set(jobId, {
        ...this.jobs.get(jobId),
        status: 'failed',
        completedAt: new Date(),
        error: error.message,
      });
      
      await redis.setex(`job:${jobId}`, 3600, JSON.stringify(this.jobs.get(jobId)));
    }
  }
  
  getJobStatus(jobId: string): any {
    return this.jobs.get(jobId) || null;
  }
  
  async getJobFromRedis(jobId: string): Promise<any> {
    try {
      const jobData = await redis.get(`job:${jobId}`);
      return jobData ? JSON.parse(jobData) : null;
    } catch (error) {
      console.error('Error fetching job from Redis:', error);
      return null;
    }
  }
}

// Image optimization middleware
export const optimizeImages = (req: Request, res: Response, next: NextFunction) => {
  // This would integrate with image processing libraries like Sharp
  // For now, just add headers for browser caching
  if (req.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.set('Vary', 'Accept-Encoding');
  }
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = (req: Request, res: Response, next: NextFunction) => {
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
  
  // Log memory usage if it's high
  if (memoryUsagePercent > 0.8) {
    console.warn('High memory usage detected:', {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      percentage: Math.round(memoryUsagePercent * 100) + '%',
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  req.memoryUsage = memoryUsage;
  next();
};

// Database query optimization helpers
export const optimizeQuery = {
  // Add proper indexing hints
  addIndexHints: (query: string, indexes: string[]): string => {
    // This would add database-specific index hints
    return query;
  },
  
  // Batch multiple queries
  batchQueries: async (queries: Array<() => Promise<any>>): Promise<any[]> => {
    return Promise.all(queries.map(query => query()));
  },
  
  // Implement query result streaming for large datasets
  streamQuery: async function* (query: any, batchSize: number = 1000) {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const results = await query.offset(offset).limit(batchSize);
      
      if (results.length === 0) {
        hasMore = false;
      } else {
        yield results;
        offset += batchSize;
        hasMore = results.length === batchSize;
      }
    }
  },
};

// Performance metrics collection
export const collectPerformanceMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  const originalSend = res.send;
  res.send = function(body) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const metrics = {
      duration: Number(endTime - startTime) / 1000000, // Convert to milliseconds
      memoryDelta: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      },
      statusCode: res.statusCode,
      contentLength: body ? Buffer.byteLength(body) : 0,
      url: req.url,
      method: req.method,
    };
    
    // Store metrics for analysis
    redis.lpush('performance:metrics', JSON.stringify(metrics)).catch(console.error);
    redis.ltrim('performance:metrics', 0, 9999).catch(console.error); // Keep last 10k metrics
    
    // Add performance headers
    res.set('X-Response-Time', `${metrics.duration.toFixed(2)}ms`);
    res.set('X-Memory-Usage', `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`);
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Export utility instances
export const queryCache = QueryCache.getInstance();
export const backgroundJobs = BackgroundJobQueue.getInstance();

// Declare global types
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
      memoryUsage?: NodeJS.MemoryUsage;
    }
  }
}