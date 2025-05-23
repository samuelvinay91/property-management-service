import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import { Logger } from '../utils/logger';

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
    timestamp: string;
    traceId?: string;
    path?: string;
  };
}

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export class AppError extends Error implements CustomError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: any) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

// Error categorization utility
export const categorizeError = (error: any): CustomError => {
  // Database errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new ConflictError('Resource already exists', { constraint: error.constraint });
      case '23503': // Foreign key violation
        return new ValidationError('Referenced resource does not exist', { constraint: error.constraint });
      case '23502': // Not null violation
        return new ValidationError('Required field is missing', { column: error.column });
      case '42P01': // Undefined table
        return new DatabaseError('Database schema error', error);
      default:
        return new DatabaseError(error.message, error);
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  // Validation errors (Joi, Yup, etc.)
  if (error.name === 'ValidationError' || error.isJoi) {
    return new ValidationError(error.message, error.details);
  }

  // GraphQL errors
  if (error instanceof GraphQLError) {
    const extensions = error.extensions || {};
    return new AppError(
      error.message,
      extensions.code === 'UNAUTHENTICATED' ? 401 : 400,
      extensions.code || 'GRAPHQL_ERROR',
      extensions
    );
  }

  // HTTP errors (from axios, fetch, etc.)
  if (error.response) {
    return new ExternalServiceError('HTTP request failed', {
      status: error.response.status,
      data: error.response.data
    });
  }

  // If it's already a CustomError, return as is
  if (error.isOperational) {
    return error;
  }

  // Default to internal server error
  return new AppError(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
  );
};

// Express error handler middleware
export const errorHandler = (serviceName: string) => {
  const logger = new Logger({ serviceName });

  return (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const categorizedError = categorizeError(error);
    const traceId = req.headers['x-trace-id'] as string || 
                   req.headers['x-request-id'] as string;
    const userId = (req as any).user?.id;

    // Log the error
    logger.logErrorWithContext(categorizedError, {
      operation: `${req.method} ${req.path}`,
      userId,
      traceId,
      additionalData: {
        headers: req.headers,
        query: req.query,
        params: req.params,
        ip: req.ip
      }
    });

    // Prepare error response
    const errorResponse: ErrorResponse = {
      error: {
        message: categorizedError.message,
        code: categorizedError.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        ...(traceId && { traceId }),
        path: req.path,
        ...(categorizedError.details && 
            process.env.NODE_ENV === 'development' && 
            { details: categorizedError.details })
      }
    };

    // Send error response
    res.status(categorizedError.statusCode || 500).json(errorResponse);
  };
};

// GraphQL error formatter
export const formatGraphQLError = (serviceName: string) => {
  const logger = new Logger({ serviceName });

  return (error: GraphQLError): any => {
    const categorizedError = categorizeError(error.originalError || error);
    
    // Log GraphQL errors
    logger.error('GraphQL error occurred', categorizedError, {
      query: error.source?.body,
      variables: error.variableValues,
      path: error.path,
      positions: error.positions
    });

    return {
      message: categorizedError.message,
      extensions: {
        code: categorizedError.code,
        statusCode: categorizedError.statusCode,
        timestamp: new Date().toISOString(),
        ...(categorizedError.details && 
            process.env.NODE_ENV === 'development' && 
            { details: categorizedError.details })
      }
    };
  };
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled error handlers
export const setupGlobalErrorHandlers = (serviceName: string): void => {
  const logger = new Logger({ serviceName });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception detected', error, { fatal: true });
    
    // Give some time for logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection detected', reason, { 
      fatal: true,
      promise: promise.toString()
    });
    
    // Give some time for logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    
    // Close database connections, stop servers, etc.
    setTimeout(() => {
      logger.info('Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Error monitoring and alerting
export const monitorErrors = (serviceName: string) => {
  const logger = new Logger({ serviceName });
  const errorCounts = new Map<string, number>();
  const errorThresholds = {
    warning: 10,
    critical: 50
  };

  const checkErrorThresholds = () => {
    for (const [errorCode, count] of errorCounts.entries()) {
      if (count >= errorThresholds.critical) {
        logger.logSecurityEvent(
          `Critical error threshold reached for ${errorCode}`,
          'critical',
          { errorCode, count, threshold: errorThresholds.critical }
        );
      } else if (count >= errorThresholds.warning) {
        logger.logSecurityEvent(
          `Warning error threshold reached for ${errorCode}`,
          'medium',
          { errorCode, count, threshold: errorThresholds.warning }
        );
      }
    }
  };

  // Reset counts every hour
  setInterval(() => {
    errorCounts.clear();
  }, 60 * 60 * 1000);

  // Check thresholds every 5 minutes
  setInterval(checkErrorThresholds, 5 * 60 * 1000);

  return (error: CustomError) => {
    const errorCode = error.code || 'UNKNOWN';
    errorCounts.set(errorCode, (errorCounts.get(errorCode) || 0) + 1);
  };
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  categorizeError,
  errorHandler,
  formatGraphQLError,
  asyncHandler,
  setupGlobalErrorHandlers,
  monitorErrors
};