import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';

const logger = createLogger('Auth-Middleware');

interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    // Allow introspection queries in development
    if (process.env.NODE_ENV !== 'production' && isIntrospectionQuery(req)) {
      return next();
    }
    
    // Allow public queries (register, login, property search without authentication)
    if (isPublicQuery(req)) {
      return next();
    }
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (jwtError) {
      logger.warn('Invalid token', { token: token.substring(0, 20) + '...', error: jwtError });
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }
    
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  const cookieToken = req.headers.cookie
    ?.split(';')
    .find(c => c.trim().startsWith('token='))
    ?.split('=')[1];
    
  if (cookieToken) {
    return cookieToken;
  }
  
  // Check query parameter (not recommended for production)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  
  return null;
}

function isIntrospectionQuery(req: Request): boolean {
  const query = req.body?.query || '';
  return query.includes('__schema') || query.includes('__type');
}

function isPublicQuery(req: Request): boolean {
  const query = req.body?.query || '';
  const operationName = req.body?.operationName || '';
  
  const publicOperations = [
    'login',
    'register',
    'forgotPassword',
    'resetPassword',
    'refreshToken',
    'verifyEmail',
    'searchProperties',
    'getProperty',
    'getPublicProperties'
  ];
  
  // Check if operation name is in public list
  if (operationName && publicOperations.includes(operationName)) {
    return true;
  }
  
  // Check if query contains public mutations/queries
  const publicQueries = [
    'mutation login',
    'mutation register',
    'mutation forgotPassword',
    'mutation resetPassword',
    'mutation refreshToken',
    'mutation verifyEmail',
    'query searchProperties',
    'query getProperty',
    'query getPublicProperties'
  ];
  
  return publicQueries.some(publicQuery => 
    query.toLowerCase().includes(publicQuery.toLowerCase())
  );
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

export const requireOwnership = (resourceIdField: string = 'id') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
    
    // Super admin can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Check if user owns the resource or has manager role
    if (req.user.id !== resourceId && !['property_manager', 'landlord'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }
    
    next();
  };
};