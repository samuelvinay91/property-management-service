import winston from 'winston';

interface LogMetadata {
  [key: string]: any;
}

export class Logger {
  private logger: winston.Logger;
  private serviceName: string;

  constructor(serviceName: string = 'NotificationService') {
    this.serviceName = serviceName;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, ...metadata }) => {
        const logEntry = {
          timestamp,
          level,
          service: service || this.serviceName,
          message,
          ...metadata
        };
        return JSON.stringify(logEntry);
      })
    );

    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, service, ...metadata }) => {
              const metaString = Object.keys(metadata).length ? 
                ` ${JSON.stringify(metadata)}` : '';
              return `${timestamp} [${service || this.serviceName}] ${level}: ${message}${metaString}`;
            })
          )
        })
      );
    }

    // File transports for production
    if (process.env.NODE_ENV === 'production') {
      // General log file
      transports.push(
        new winston.transports.File({
          filename: '/var/log/notification-service/app.log',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          tailable: true
        })
      );

      // Error log file
      transports.push(
        new winston.transports.File({
          filename: '/var/log/notification-service/error.log',
          level: 'error',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          tailable: true
        })
      );
    }

    // Add external logging service (e.g., ELK, Datadog) if configured
    if (process.env.LOG_EXTERNAL_URL) {
      // Example: HTTP transport for external logging
      transports.push(
        new winston.transports.Http({
          host: process.env.LOG_EXTERNAL_HOST,
          port: parseInt(process.env.LOG_EXTERNAL_PORT || '80'),
          path: process.env.LOG_EXTERNAL_PATH || '/logs',
          format: logFormat
        })
      );
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: {
        service: this.serviceName,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      },
      transports,
      exitOnError: false
    });
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, metadata);
  }

  error(message: string, metadata?: LogMetadata): void {
    this.logger.error(message, metadata);
  }

  fatal(message: string, metadata?: LogMetadata): void {
    this.logger.error(message, { ...metadata, severity: 'fatal' });
  }

  // Structured logging methods for specific scenarios
  
  notificationSent(notificationId: string, recipientId: string, channel: string, metadata?: LogMetadata): void {
    this.info('Notification sent', {
      notificationId,
      recipientId,
      channel,
      event: 'notification_sent',
      ...metadata
    });
  }

  notificationFailed(notificationId: string, recipientId: string, channel: string, error: string, metadata?: LogMetadata): void {
    this.error('Notification failed', {
      notificationId,
      recipientId,
      channel,
      error,
      event: 'notification_failed',
      ...metadata
    });
  }

  templateRendered(templateId: string, locale: string, renderTime: number, metadata?: LogMetadata): void {
    this.info('Template rendered', {
      templateId,
      locale,
      renderTime,
      event: 'template_rendered',
      ...metadata
    });
  }

  webhookReceived(provider: string, event: string, messageId?: string, metadata?: LogMetadata): void {
    this.info('Webhook received', {
      provider,
      event,
      messageId,
      event: 'webhook_received',
      ...metadata
    });
  }

  rateLimitHit(identifier: string, limit: number, window: string, metadata?: LogMetadata): void {
    this.warn('Rate limit exceeded', {
      identifier,
      limit,
      window,
      event: 'rate_limit_exceeded',
      ...metadata
    });
  }

  bulkOperationStarted(operation: string, count: number, metadata?: LogMetadata): void {
    this.info('Bulk operation started', {
      operation,
      count,
      event: 'bulk_operation_started',
      ...metadata
    });
  }

  bulkOperationCompleted(operation: string, count: number, duration: number, metadata?: LogMetadata): void {
    this.info('Bulk operation completed', {
      operation,
      count,
      duration,
      event: 'bulk_operation_completed',
      ...metadata
    });
  }

  providerError(provider: string, operation: string, error: string, metadata?: LogMetadata): void {
    this.error('Provider error', {
      provider,
      operation,
      error,
      event: 'provider_error',
      ...metadata
    });
  }

  circuitBreakerOpened(provider: string, errorCount: number, metadata?: LogMetadata): void {
    this.error('Circuit breaker opened', {
      provider,
      errorCount,
      event: 'circuit_breaker_opened',
      ...metadata
    });
  }

  circuitBreakerClosed(provider: string, metadata?: LogMetadata): void {
    this.info('Circuit breaker closed', {
      provider,
      event: 'circuit_breaker_closed',
      ...metadata
    });
  }

  // Performance logging
  performanceMetric(operation: string, duration: number, metadata?: LogMetadata): void {
    this.info('Performance metric', {
      operation,
      duration,
      event: 'performance_metric',
      ...metadata
    });
  }

  // Security logging
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: LogMetadata): void {
    this.warn('Security event', {
      event,
      severity,
      event: 'security_event',
      ...metadata
    });
  }

  // Business metrics logging
  businessMetric(metric: string, value: number, unit?: string, metadata?: LogMetadata): void {
    this.info('Business metric', {
      metric,
      value,
      unit,
      event: 'business_metric',
      ...metadata
    });
  }

  // Health check logging
  healthCheck(component: string, status: 'healthy' | 'unhealthy' | 'degraded', metadata?: LogMetadata): void {
    const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    this.logger.log(level, 'Health check', {
      component,
      status,
      event: 'health_check',
      ...metadata
    });
  }

  // Correlation logging (for tracing requests across services)
  withCorrelationId(correlationId: string): Logger {
    const correlatedLogger = new Logger(this.serviceName);
    correlatedLogger.logger = this.logger.child({ correlationId });
    return correlatedLogger;
  }

  // Create child logger with additional context
  child(metadata: LogMetadata): Logger {
    const childLogger = new Logger(this.serviceName);
    childLogger.logger = this.logger.child(metadata);
    return childLogger;
  }

  // Timer utility for measuring operation duration
  startTimer(): () => void {
    const startTime = Date.now();
    return () => Date.now() - startTime;
  }

  // Async operation wrapper with automatic logging
  async withLogging<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: LogMetadata
  ): Promise<T> {
    const timer = this.startTimer();
    const operationId = Math.random().toString(36).substring(7);
    
    this.debug(`Starting ${operation}`, { operationId, ...metadata });
    
    try {
      const result = await fn();
      const duration = timer();
      this.info(`Completed ${operation}`, { 
        operationId, 
        duration, 
        success: true, 
        ...metadata 
      });
      return result;
    } catch (error) {
      const duration = timer();
      this.error(`Failed ${operation}`, { 
        operationId, 
        duration, 
        success: false, 
        error: error.message,
        ...metadata 
      });
      throw error;
    }
  }

  // Create logger instance for specific notification
  forNotification(notificationId: string): Logger {
    return this.child({ notificationId });
  }

  // Create logger instance for specific user
  forUser(userId: string): Logger {
    return this.child({ userId });
  }

  // Create logger instance for specific operation
  forOperation(operationType: string, operationId?: string): Logger {
    return this.child({ 
      operationType, 
      operationId: operationId || Math.random().toString(36).substring(7)
    });
  }
}

// Default logger instance
export const logger = new Logger();

// Utility function to create operation-scoped logger
export const createOperationLogger = (operation: string, metadata?: LogMetadata): Logger => {
  return logger.child({ operation, ...metadata });
};

// Utility function to create correlation-scoped logger
export const createCorrelationLogger = (correlationId: string): Logger => {
  return logger.withCorrelationId(correlationId);
};

// Express middleware for request logging
export const requestLoggingMiddleware = (req: any, res: any, next: any) => {
  const requestId = Math.random().toString(36).substring(7);
  const requestLogger = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  req.logger = requestLogger;
  
  const timer = requestLogger.startTimer();
  
  requestLogger.info('Request started');
  
  res.on('finish', () => {
    const duration = timer();
    requestLogger.info('Request completed', {
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
};

export default Logger;