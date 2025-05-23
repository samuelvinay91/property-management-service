import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service,
      message,
      ...meta
    });
  })
);

export const createLogger = (service: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
          })
        )
      }),
      
      // File transports
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
  });
};

// Performance logging utility
export const performanceLogger = (service: string) => {
  const logger = createLogger(service);
  
  return {
    logDuration: (operation: string, startTime: number) => {
      const duration = Date.now() - startTime;
      logger.info('Performance', {
        operation,
        duration: `${duration}ms`,
        ...(duration > 1000 && { slow: true })
      });
      return duration;
    },
    
    logQuery: (query: string, duration: number, resultCount?: number) => {
      logger.info('Database Query', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration: `${duration}ms`,
        ...(resultCount !== undefined && { resultCount }),
        ...(duration > 1000 && { slow: true })
      });
    },
    
    logApiCall: (url: string, method: string, duration: number, statusCode: number) => {
      logger.info('API Call', {
        url,
        method,
        duration: `${duration}ms`,
        statusCode,
        ...(duration > 2000 && { slow: true }),
        ...(statusCode >= 400 && { error: true })
      });
    }
  };
};