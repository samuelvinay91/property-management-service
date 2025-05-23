import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';

const logger = createLogger('Auth-Middleware');

interface User {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (req: Request): Promise<User | null> => {
  try {
    const token = extractToken(req);
    
    // Allow introspection queries in development
    if (process.env.NODE_ENV !== 'production' && isIntrospectionQuery(req)) {
      return null;
    }
    
    // Allow public queries (register, login, property search without authentication)
    if (isPublicQuery(req)) {
      return null;
    }
    
    if (!token) {
      logger.debug('No token provided for request');
      return null;
    }
    
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'default-secret'
      ) as User;
      
      logger.debug('Successfully authenticated user:', { 
        userId: decoded.id, 
        email: decoded.email,
        role: decoded.role 
      });
      
      return decoded;
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        logger.warn('JWT token expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        logger.warn('Invalid JWT token');
      } else {
        logger.warn('JWT verification failed:', jwtError.message);
      }
      return null;
    }
    
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return null;
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
    'getPublicProperties',
    'IntrospectionQuery'
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

export const requireAuth = (user: User | null): User => {
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
};

export const requireRole = (user: User | null, roles: string[]): User => {
  const authenticatedUser = requireAuth(user);
  
  if (!roles.includes(authenticatedUser.role)) {
    throw new Error(`Insufficient permissions. Required roles: ${roles.join(', ')}`);
  }
  
  return authenticatedUser;
};

export const requireOwnership = (user: User | null, resourceUserId: string): User => {
  const authenticatedUser = requireAuth(user);
  
  // Super admin can access everything
  if (authenticatedUser.role === 'super_admin') {
    return authenticatedUser;
  }
  
  // Check if user owns the resource or has manager role
  if (authenticatedUser.id !== resourceUserId && 
      !['property_manager', 'landlord'].includes(authenticatedUser.role)) {
    throw new Error('Access denied. You can only access your own resources');
  }
  
  return authenticatedUser;
};