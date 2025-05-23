import winston from 'winston';

interface LogMetadata {
  [key: string]: any;
}

interface LoggerOptions {
  serviceName?: string;
  logLevel?: string;
  enableFileLogging?: boolean;
  enableSentry?: boolean;
  enableDatadog?: boolean;
}

export class Logger {
  private logger: winston.Logger;
  private serviceName: string;

  constructor(options: LoggerOptions = {}) {
    this.serviceName = options.serviceName || 'RentovaService';
    this.logger = this.createLogger(options);
  }

  private createLogger(options: LoggerOptions): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, traceId, userId, ...metadata }) => {
        const logEntry = {
          timestamp,
          level,
          service: service || this.serviceName,
          message,
          ...(traceId && { traceId }),
          ...(userId && { userId }),
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
            winston.format.printf(({ timestamp, level, message, service, traceId, userId, ...metadata }) => {
              const metaString = Object.keys(metadata).length ? 
                ` ${JSON.stringify(metadata)}` : '';
              const traceString = traceId ? ` [trace:${traceId}]` : '';
              const userString = userId ? ` [user:${userId}]` : '';
              return `${timestamp} [${service || this.serviceName}]${traceString}${userString} ${level}: ${message}${metaString}`;
            })
          )
        })
      );
    }

    // Production console transport (structured JSON)
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new winston.transports.Console({
          format: logFormat
        })
      );
    }

    // File transports for production
    if (options.enableFileLogging && process.env.NODE_ENV === 'production') {
      transports.push(
        new winston.transports.File({
          filename: `/var/log/rentova/${this.serviceName}-error.log`,
          level: 'error',
          format: logFormat,
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 10
        }),
        new winston.transports.File({
          filename: `/var/log/rentova/${this.serviceName}-combined.log`,
          format: logFormat,
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 5
        })
      );
    }

    return winston.createLogger({
      level: options.logLevel || process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
      exitOnError: false,
      // Handle uncaught exceptions and rejections
      exceptionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        })
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        })
      ]
    });
  }

  // Core logging methods
  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, { service: this.serviceName, ...metadata });
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, { service: this.serviceName, ...metadata });
  }

  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    const logData = {
      service: this.serviceName,
      ...metadata
    };

    if (error) {
      if (error instanceof Error) {
        logData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else {
        logData.error = error;
      }
    }

    this.logger.error(message, logData);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, { service: this.serviceName, ...metadata });
  }

  verbose(message: string, metadata?: LogMetadata): void {
    this.logger.verbose(message, { service: this.serviceName, ...metadata });
  }

  // HTTP request logging
  logRequest(req: any, res: any, responseTime?: number): void {
    const metadata = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      ...(responseTime && { responseTime: `${responseTime}ms` }),
      ...(req.user && { userId: req.user.id }),
      ...(req.headers['x-trace-id'] && { traceId: req.headers['x-trace-id'] })
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this[level](`${req.method} ${req.url}`, metadata);
  }

  // Database query logging
  logQuery(query: string, duration?: number, metadata?: LogMetadata): void {
    this.debug('Database query executed', {
      query: query.length > 1000 ? `${query.substring(0, 1000)}...` : query,
      ...(duration && { duration: `${duration}ms` }),
      ...metadata
    });
  }

  // Business logic logging
  logBusinessEvent(event: string, metadata?: LogMetadata): void {
    this.info(`Business event: ${event}`, {
      eventType: 'business',
      event,
      ...metadata
    });
  }

  // Security logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: LogMetadata): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this[level](`Security event: ${event}`, {
      eventType: 'security',
      event,
      severity,
      ...metadata
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: LogMetadata): void {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    this[level](`Performance: ${operation}`, {
      eventType: 'performance',
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Audit logging
  logAudit(action: string, userId?: string, metadata?: LogMetadata): void {
    this.info(`Audit: ${action}`, {
      eventType: 'audit',
      action,
      ...(userId && { userId }),
      ...metadata
    });
  }

  // Structured error logging with context
  logErrorWithContext(error: Error, context: {
    operation?: string;
    userId?: string;
    traceId?: string;
    additionalData?: any;
  }): void {
    this.error(`Error in ${context.operation || 'unknown operation'}`, error, {
      ...(context.userId && { userId: context.userId }),
      ...(context.traceId && { traceId: context.traceId }),
      ...(context.additionalData && { context: context.additionalData })
    });
  }

  // Create child logger with additional context
  child(additionalContext: LogMetadata): Logger {
    const childLogger = new Logger({ serviceName: this.serviceName });
    const originalMethods = ['info', 'warn', 'error', 'debug', 'verbose'];
    
    originalMethods.forEach(method => {
      const originalMethod = childLogger[method].bind(childLogger);
      childLogger[method] = (message: string, metadata?: LogMetadata) => {
        originalMethod(message, { ...additionalContext, ...metadata });
      };
    });

    return childLogger;
  }
}

// Export singleton instances for common services
export const apiGatewayLogger = new Logger({ serviceName: 'APIGateway' });
export const authLogger = new Logger({ serviceName: 'AuthService' });
export const propertyLogger = new Logger({ serviceName: 'PropertyService' });
export const tenantLogger = new Logger({ serviceName: 'TenantService' });
export const paymentLogger = new Logger({ serviceName: 'PaymentService' });
export const maintenanceLogger = new Logger({ serviceName: 'MaintenanceService' });
export const bookingLogger = new Logger({ serviceName: 'BookingService' });
export const notificationLogger = new Logger({ serviceName: 'NotificationService' });

// Express middleware for request logging
export const requestLoggerMiddleware = (serviceName: string) => {
  const logger = new Logger({ serviceName });
  
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.logRequest(req, res, duration);
    });
    
    next();
  };
};

// Default export
export default Logger;