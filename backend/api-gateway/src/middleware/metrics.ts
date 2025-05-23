import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('Metrics');

interface MetricsData {
  requestCount: number;
  responseTime: { [key: string]: number[] };
  errorCount: number;
  activeConnections: number;
}

const metrics: MetricsData = {
  requestCount: 0,
  responseTime: {},
  errorCount: 0,
  activeConnections: 0
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  metrics.requestCount++;
  metrics.activeConnections++;

  // Log request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: generateRequestId()
  });

  // Capture response metrics
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const route = `${req.method} ${req.route?.path || req.url}`;

    // Track response time
    if (!metrics.responseTime[route]) {
      metrics.responseTime[route] = [];
    }
    metrics.responseTime[route].push(responseTime);

    // Keep only last 100 response times per route
    if (metrics.responseTime[route].length > 100) {
      metrics.responseTime[route] = metrics.responseTime[route].slice(-100);
    }

    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }

    metrics.activeConnections--;

    // Log response
    logger.info('Response Sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    });

    return originalSend.call(this, data);
  };

  next();
};

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export const getMetrics = () => {
  const responseTimeStats = Object.entries(metrics.responseTime).reduce((acc, [route, times]) => {
    if (times.length === 0) return acc;
    
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

    acc[route] = {
      avg: Math.round(avg * 100) / 100,
      min,
      max,
      p95,
      count: times.length
    };
    
    return acc;
  }, {} as Record<string, any>);

  return {
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    activeConnections: metrics.activeConnections,
    errorRate: metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0,
    responseTime: responseTimeStats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
};

// Metrics endpoint
export const metricsEndpoint = (req: Request, res: Response) => {
  res.json(getMetrics());
};

// Health check with metrics
export const healthCheck = (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    metrics: getMetrics()
  };

  res.json(health);
};

// Reset metrics (useful for testing)
export const resetMetrics = () => {
  metrics.requestCount = 0;
  metrics.responseTime = {};
  metrics.errorCount = 0;
  metrics.activeConnections = 0;
};