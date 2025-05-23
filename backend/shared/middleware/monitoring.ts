import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { promisify } from 'util';
import Redis from 'ioredis';

// Redis setup for metrics storage
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 1, // Use different DB for monitoring
});

// Performance monitoring
export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: Date;
  userAgent?: string;
  ip: string;
  userId?: string;
  errorDetails?: any;
}

// Request tracking middleware
export const requestTracker = (req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Track request start time
  const startTime = performance.now();
  const startCpuUsage = process.cpuUsage();
  const startMemoryUsage = process.memoryUsage();
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = performance.now();
    const endCpuUsage = process.cpuUsage(startCpuUsage);
    const endMemoryUsage = process.memoryUsage();
    
    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: endTime - startTime,
      memoryUsage: {
        rss: endMemoryUsage.rss - startMemoryUsage.rss,
        heapTotal: endMemoryUsage.heapTotal - startMemoryUsage.heapTotal,
        heapUsed: endMemoryUsage.heapUsed - startMemoryUsage.heapUsed,
        external: endMemoryUsage.external - startMemoryUsage.external,
        arrayBuffers: endMemoryUsage.arrayBuffers - startMemoryUsage.arrayBuffers,
      },
      cpuUsage: endCpuUsage,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
    };
    
    // Store metrics asynchronously
    storeMetrics(metrics).catch(console.error);
    
    // Log slow requests
    if (metrics.duration > 1000) {
      console.warn('Slow request detected:', {
        requestId,
        url: req.url,
        duration: metrics.duration,
        method: req.method,
      });
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      console.error('Error response:', {
        requestId,
        url: req.url,
        statusCode: res.statusCode,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Store metrics in Redis
const storeMetrics = async (metrics: PerformanceMetrics) => {
  try {
    const key = `metrics:${metrics.timestamp.toISOString().split('T')[0]}`;
    await redis.lpush(key, JSON.stringify(metrics));
    await redis.expire(key, 7 * 24 * 60 * 60); // Keep metrics for 7 days
    
    // Store aggregated metrics
    await updateAggregatedMetrics(metrics);
  } catch (error) {
    console.error('Failed to store metrics:', error);
  }
};

// Update aggregated metrics
const updateAggregatedMetrics = async (metrics: PerformanceMetrics) => {
  const minute = Math.floor(Date.now() / 60000) * 60000;
  const hour = Math.floor(Date.now() / 3600000) * 3600000;
  const day = Math.floor(Date.now() / 86400000) * 86400000;
  
  const pipeline = redis.pipeline();
  
  // Request count
  pipeline.incr(`metrics:requests:minute:${minute}`);
  pipeline.incr(`metrics:requests:hour:${hour}`);
  pipeline.incr(`metrics:requests:day:${day}`);
  
  // Response time
  pipeline.lpush(`metrics:response_time:minute:${minute}`, metrics.duration.toString());
  pipeline.lpush(`metrics:response_time:hour:${hour}`, metrics.duration.toString());
  pipeline.lpush(`metrics:response_time:day:${day}`, metrics.duration.toString());
  
  // Error count
  if (metrics.statusCode >= 400) {
    pipeline.incr(`metrics:errors:minute:${minute}`);
    pipeline.incr(`metrics:errors:hour:${hour}`);
    pipeline.incr(`metrics:errors:day:${day}`);
  }
  
  // Set expiration
  pipeline.expire(`metrics:requests:minute:${minute}`, 3600); // 1 hour
  pipeline.expire(`metrics:requests:hour:${hour}`, 86400); // 1 day
  pipeline.expire(`metrics:requests:day:${day}`, 604800); // 1 week
  
  await pipeline.exec();
};

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version,
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
      redis: false,
      external_apis: false,
    },
  };
  
  try {
    // Check Redis connection
    await redis.ping();
    healthData.checks.redis = true;
  } catch (error) {
    healthData.checks.redis = false;
    healthData.status = 'degraded';
  }
  
  // Add more health checks here (database, external APIs, etc.)
  
  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthData);
};

// Get system metrics
export const getMetrics = async (req: Request, res: Response) => {
  try {
    const { timeframe = 'hour' } = req.query;
    const now = Date.now();
    
    let timeKey: number;
    let expiration: number;
    
    switch (timeframe) {
      case 'minute':
        timeKey = Math.floor(now / 60000) * 60000;
        expiration = 3600;
        break;
      case 'day':
        timeKey = Math.floor(now / 86400000) * 86400000;
        expiration = 604800;
        break;
      default:
        timeKey = Math.floor(now / 3600000) * 3600000;
        expiration = 86400;
    }
    
    const [requests, errors, responseTimes] = await Promise.all([
      redis.get(`metrics:requests:${timeframe}:${timeKey}`),
      redis.get(`metrics:errors:${timeframe}:${timeKey}`),
      redis.lrange(`metrics:response_time:${timeframe}:${timeKey}`, 0, -1),
    ]);
    
    const responseTimeNumbers = responseTimes.map(Number).filter(n => !isNaN(n));
    const avgResponseTime = responseTimeNumbers.length > 0 
      ? responseTimeNumbers.reduce((sum, time) => sum + time, 0) / responseTimeNumbers.length 
      : 0;
    
    const metrics = {
      timeframe,
      timestamp: new Date(timeKey).toISOString(),
      requests: parseInt(requests || '0'),
      errors: parseInt(errors || '0'),
      errorRate: parseInt(requests || '0') > 0 
        ? (parseInt(errors || '0') / parseInt(requests || '0')) * 100 
        : 0,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      responseTimeDistribution: {
        p50: calculatePercentile(responseTimeNumbers, 50),
        p90: calculatePercentile(responseTimeNumbers, 90),
        p95: calculatePercentile(responseTimeNumbers, 95),
        p99: calculatePercentile(responseTimeNumbers, 99),
      },
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message,
    });
  }
};

// Calculate percentile
const calculatePercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return Math.round(sorted[index] * 100) / 100;
};

// Error tracking middleware
export const errorTracker = (
  error: Error,
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction
) => {
  const errorData = {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
  };
  
  // Store error data
  storeError(errorData).catch(console.error);
  
  // Log error
  console.error('Request error:', errorData);
  
  next(error);
};

// Store error data
const storeError = async (errorData: any) => {
  try {
    const key = `errors:${new Date().toISOString().split('T')[0]}`;
    await redis.lpush(key, JSON.stringify(errorData));
    await redis.expire(key, 30 * 24 * 60 * 60); // Keep errors for 30 days
  } catch (error) {
    console.error('Failed to store error data:', error);
  }
};

// Real-time monitoring with WebSocket
export const createMonitoringWebSocket = (io: any) => {
  const monitoringNamespace = io.of('/monitoring');
  
  monitoringNamespace.on('connection', (socket: any) => {
    console.log('Monitoring client connected');
    
    // Send real-time metrics every 5 seconds
    const metricsInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const minute = Math.floor(now / 60000) * 60000;
        
        const [requests, errors] = await Promise.all([
          redis.get(`metrics:requests:minute:${minute}`),
          redis.get(`metrics:errors:minute:${minute}`),
        ]);
        
        socket.emit('metrics-update', {
          timestamp: new Date().toISOString(),
          requests: parseInt(requests || '0'),
          errors: parseInt(errors || '0'),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        });
      } catch (error) {
        console.error('Error sending real-time metrics:', error);
      }
    }, 5000);
    
    socket.on('disconnect', () => {
      console.log('Monitoring client disconnected');
      clearInterval(metricsInterval);
    });
  });
};

// Alert system
export const alertThresholds = {
  errorRate: 5, // Alert if error rate > 5%
  responseTime: 2000, // Alert if avg response time > 2s
  requestsPerMinute: 1000, // Alert if requests > 1000/min
  memoryUsage: 0.8, // Alert if memory usage > 80%
};

export const checkAlerts = async () => {
  try {
    const now = Date.now();
    const minute = Math.floor(now / 60000) * 60000;
    
    const [requests, errors, responseTimes] = await Promise.all([
      redis.get(`metrics:requests:minute:${minute}`),
      redis.get(`metrics:errors:minute:${minute}`),
      redis.lrange(`metrics:response_time:minute:${minute}`, 0, -1),
    ]);
    
    const requestCount = parseInt(requests || '0');
    const errorCount = parseInt(errors || '0');
    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
    
    const responseTimeNumbers = responseTimes.map(Number).filter(n => !isNaN(n));
    const avgResponseTime = responseTimeNumbers.length > 0 
      ? responseTimeNumbers.reduce((sum, time) => sum + time, 0) / responseTimeNumbers.length 
      : 0;
    
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    const alerts = [];
    
    if (errorRate > alertThresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        message: `Error rate is ${errorRate.toFixed(2)}%, threshold is ${alertThresholds.errorRate}%`,
        severity: 'critical',
      });
    }
    
    if (avgResponseTime > alertThresholds.responseTime) {
      alerts.push({
        type: 'slow_response_time',
        message: `Average response time is ${avgResponseTime.toFixed(2)}ms, threshold is ${alertThresholds.responseTime}ms`,
        severity: 'warning',
      });
    }
    
    if (requestCount > alertThresholds.requestsPerMinute) {
      alerts.push({
        type: 'high_traffic',
        message: `Request count is ${requestCount}/min, threshold is ${alertThresholds.requestsPerMinute}/min`,
        severity: 'info',
      });
    }
    
    if (memoryUsagePercent > alertThresholds.memoryUsage) {
      alerts.push({
        type: 'high_memory_usage',
        message: `Memory usage is ${(memoryUsagePercent * 100).toFixed(2)}%, threshold is ${alertThresholds.memoryUsage * 100}%`,
        severity: 'warning',
      });
    }
    
    if (alerts.length > 0) {
      console.warn('System alerts:', alerts);
      // Here you could send alerts to external services (email, Slack, etc.)
      await sendAlerts(alerts);
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
};

// Send alerts (placeholder for external integrations)
const sendAlerts = async (alerts: any[]) => {
  // Implementation for sending alerts to external services
  // This could include email, Slack, PagerDuty, etc.
  console.log('Sending alerts:', alerts);
};

// Start alert monitoring
export const startAlertMonitoring = () => {
  setInterval(checkAlerts, 60000); // Check every minute
};