import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

// Enhanced JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-secret-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Redis setup for rate limiting and session management
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

// Rate limiters for different scenarios
const loginAttemptLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'login_attempt',
  points: 5, // Number of attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

const consecutiveFailsByUsernameAndIP = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'login_fail_consecutive_username_and_ip',
  points: 10,
  duration: 900,
  blockDuration: 900,
});

// Enhanced user interface
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'TENANT' | 'OWNER';
  permissions: string[];
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  lastLogin?: Date;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: {
    id: string;
    userId: string;
    createdAt: Date;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
  };
}

// Token generation with enhanced security
export const generateTokens = (user: Partial<AuthenticatedUser>) => {
  const sessionId = crypto.randomUUID();
  
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sessionId,
      type: 'access',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'propflow-api',
      audience: 'propflow-app',
    }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      sessionId,
      type: 'refresh',
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'propflow-api',
      audience: 'propflow-app',
    }
  );

  return { accessToken, refreshToken, sessionId };
};

// Enhanced password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Session management
export const createSession = async (
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent: string
) => {
  const sessionData = {
    userId,
    sessionId,
    createdAt: new Date(),
    lastActivity: new Date(),
    ipAddress,
    userAgent,
  };

  // Store session in Redis with expiration
  await redis.setex(
    `session:${sessionId}`,
    7 * 24 * 60 * 60, // 7 days
    JSON.stringify(sessionData)
  );

  return sessionData;
};

export const getSession = async (sessionId: string) => {
  const sessionData = await redis.get(`session:${sessionId}`);
  return sessionData ? JSON.parse(sessionData) : null;
};

export const updateSessionActivity = async (sessionId: string) => {
  const sessionData = await getSession(sessionId);
  if (sessionData) {
    sessionData.lastActivity = new Date();
    await redis.setex(
      `session:${sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify(sessionData)
    );
  }
};

export const revokeSession = async (sessionId: string) => {
  await redis.del(`session:${sessionId}`);
};

export const revokeAllUserSessions = async (userId: string) => {
  const keys = await redis.keys(`session:*`);
  const sessions = await Promise.all(
    keys.map(async (key) => {
      const data = await redis.get(key);
      return data ? { key, data: JSON.parse(data) } : null;
    })
  );

  const userSessions = sessions.filter(
    (session) => session && session.data.userId === userId
  );

  await Promise.all(
    userSessions.map((session) => redis.del(session!.key))
  );
};

// Enhanced authentication middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid access token',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Access token required',
      });
    }

    // Check session validity
    const session = await getSession(decoded.sessionId);
    if (!session) {
      return res.status(401).json({
        error: 'Session expired',
        message: 'Please log in again',
      });
    }

    // Update session activity
    await updateSessionActivity(decoded.sessionId);

    // Add user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      isEmailVerified: decoded.isEmailVerified || false,
      isTwoFactorEnabled: decoded.isTwoFactorEnabled || false,
      sessionId: decoded.sessionId,
    };

    req.session = session;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
    });
  }
};

// Role-based authorization
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

// Permission-based authorization
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need the '${permission}' permission to access this resource`,
      });
    }

    next();
  };
};

// Rate limiting for authentication endpoints
export const rateLimitAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const key = `${req.ip}_${req.body.email || 'unknown'}`;
    
    await loginAttemptLimiter.consume(key);
    await consecutiveFailsByUsernameAndIP.consume(key);
    
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    
    return res.status(429).json({
      error: 'Too many attempts',
      message: `Too many login attempts. Try again in ${secs} seconds.`,
      retryAfter: secs,
    });
  }
};

// Two-factor authentication helpers
export const generateTOTPSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

export const generateBackupCodes = (count: number = 10) => {
  return Array.from({ length: count }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
};

// Secure token refresh
export const refreshTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token',
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Refresh token required',
      });
    }

    // Check session validity
    const session = await getSession(decoded.sessionId);
    if (!session) {
      return res.status(401).json({
        error: 'Session expired',
        message: 'Please log in again',
      });
    }

    // Here you would typically fetch user data from database
    // For now, we'll use the session data
    const user = {
      id: session.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    const tokens = generateTokens(user);
    
    // Update session
    await updateSessionActivity(tokens.sessionId);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'The provided refresh token is invalid or expired',
      });
    }

    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing the token',
    });
  }
};

// Logout handler
export const logoutHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (req.user?.sessionId) {
      await revokeSession(req.user.sessionId);
    }

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
    });
  }
};

// Logout from all devices
export const logoutAllHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (req.user?.id) {
      await revokeAllUserSessions(req.user.id);
    }

    res.json({
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
    });
  }
};