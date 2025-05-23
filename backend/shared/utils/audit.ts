import { Request } from 'express';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import Redis from 'ioredis';

// Redis setup for audit logs
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 2, // Use different DB for audit logs
});

// Audit logger configuration
const auditLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'propflow-audit' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      createSymlink: true,
      symlinkName: 'audit-current.log'
    }),
    new DailyRotateFile({
      filename: 'logs/audit-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      createSymlink: true,
      symlinkName: 'audit-error-current.log'
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  auditLogger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Audit event types
export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_EMAIL_VERIFICATION = 'USER_EMAIL_VERIFICATION',
  USER_TWO_FACTOR_ENABLED = 'USER_TWO_FACTOR_ENABLED',
  USER_TWO_FACTOR_DISABLED = 'USER_TWO_FACTOR_DISABLED',
  
  // User management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_PERMISSIONS_UPDATED = 'USER_PERMISSIONS_UPDATED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  
  // Property management events
  PROPERTY_CREATED = 'PROPERTY_CREATED',
  PROPERTY_UPDATED = 'PROPERTY_UPDATED',
  PROPERTY_DELETED = 'PROPERTY_DELETED',
  PROPERTY_STATUS_CHANGED = 'PROPERTY_STATUS_CHANGED',
  PROPERTY_UNIT_ADDED = 'PROPERTY_UNIT_ADDED',
  PROPERTY_UNIT_UPDATED = 'PROPERTY_UNIT_UPDATED',
  PROPERTY_UNIT_DELETED = 'PROPERTY_UNIT_DELETED',
  
  // Booking events
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CHECKED_IN = 'BOOKING_CHECKED_IN',
  BOOKING_CHECKED_OUT = 'BOOKING_CHECKED_OUT',
  
  // Payment events
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_DISPUTED = 'PAYMENT_DISPUTED',
  
  // Maintenance events
  MAINTENANCE_REQUEST_CREATED = 'MAINTENANCE_REQUEST_CREATED',
  MAINTENANCE_REQUEST_UPDATED = 'MAINTENANCE_REQUEST_UPDATED',
  MAINTENANCE_REQUEST_ASSIGNED = 'MAINTENANCE_REQUEST_ASSIGNED',
  MAINTENANCE_REQUEST_COMPLETED = 'MAINTENANCE_REQUEST_COMPLETED',
  MAINTENANCE_REQUEST_CANCELLED = 'MAINTENANCE_REQUEST_CANCELLED',
  
  // System events
  SYSTEM_BACKUP_CREATED = 'SYSTEM_BACKUP_CREATED',
  SYSTEM_RESTORE_PERFORMED = 'SYSTEM_RESTORE_PERFORMED',
  SYSTEM_CONFIGURATION_CHANGED = 'SYSTEM_CONFIGURATION_CHANGED',
  SYSTEM_ALERT_TRIGGERED = 'SYSTEM_ALERT_TRIGGERED',
  
  // Data events
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  DATA_DELETION = 'DATA_DELETION',
  DATA_MIGRATION = 'DATA_MIGRATION',
  
  // Security events
  SECURITY_BREACH_DETECTED = 'SECURITY_BREACH_DETECTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
}

// Audit severity levels
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Audit event interface
export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  success: boolean;
  errorMessage?: string;
  tags?: string[];
}

// Create audit event
export const createAuditEvent = (
  eventType: AuditEventType,
  action: string,
  description: string,
  options: Partial<AuditEvent> = {}
): AuditEvent => {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    severity: options.severity || AuditSeverity.MEDIUM,
    timestamp: new Date(),
    action,
    description,
    success: options.success ?? true,
    ...options,
  };
};

// Log audit event
export const logAuditEvent = async (event: AuditEvent): Promise<void> => {
  try {
    // Log to Winston
    auditLogger.info('Audit Event', event);
    
    // Store in Redis for real-time queries
    const key = `audit:${event.timestamp.toISOString().split('T')[0]}`;
    await redis.lpush(key, JSON.stringify(event));
    await redis.expire(key, 90 * 24 * 60 * 60); // Keep for 90 days
    
    // Store in user-specific audit trail
    if (event.userId) {
      const userKey = `audit:user:${event.userId}`;
      await redis.lpush(userKey, JSON.stringify(event));
      await redis.ltrim(userKey, 0, 999); // Keep last 1000 events per user
      await redis.expire(userKey, 365 * 24 * 60 * 60); // Keep for 1 year
    }
    
    // Store in resource-specific audit trail
    if (event.resourceType && event.resourceId) {
      const resourceKey = `audit:resource:${event.resourceType}:${event.resourceId}`;
      await redis.lpush(resourceKey, JSON.stringify(event));
      await redis.ltrim(resourceKey, 0, 499); // Keep last 500 events per resource
      await redis.expire(resourceKey, 365 * 24 * 60 * 60); // Keep for 1 year
    }
    
    // Index by event type for analytics
    const typeKey = `audit:type:${event.eventType}`;
    await redis.lpush(typeKey, JSON.stringify(event));
    await redis.ltrim(typeKey, 0, 9999); // Keep last 10000 events per type
    await redis.expire(typeKey, 365 * 24 * 60 * 60); // Keep for 1 year
    
    // Alert on critical events
    if (event.severity === AuditSeverity.CRITICAL) {
      await handleCriticalAuditEvent(event);
    }
    
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Fallback to console logging
    console.error('AUDIT EVENT:', JSON.stringify(event, null, 2));
  }
};

// Handle critical audit events
const handleCriticalAuditEvent = async (event: AuditEvent): Promise<void> => {
  try {
    // Store critical events separately
    const criticalKey = `audit:critical:${event.timestamp.toISOString().split('T')[0]}`;
    await redis.lpush(criticalKey, JSON.stringify(event));
    await redis.expire(criticalKey, 365 * 24 * 60 * 60); // Keep for 1 year
    
    // Send immediate alerts (implement based on your alerting system)
    console.error('CRITICAL AUDIT EVENT:', event);
    
    // Here you could integrate with external alerting services
    // await sendSlackAlert(event);
    // await sendEmailAlert(event);
    // await triggerPagerDuty(event);
    
  } catch (error) {
    console.error('Failed to handle critical audit event:', error);
  }
};

// Audit middleware for Express
export const auditMiddleware = (eventType: AuditEventType, action: string) => {
  return (req: Request & { user?: any; requestId?: string }, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const startTime = Date.now();
    
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;
      
      const auditEvent = createAuditEvent(
        eventType,
        action,
        `${action} - ${req.method} ${req.url}`,
        {
          userId: req.user?.id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          sessionId: req.user?.sessionId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          success,
          errorMessage: success ? undefined : `HTTP ${res.statusCode}`,
          metadata: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            requestBody: req.body,
            queryParams: req.query,
            pathParams: req.params,
          },
          severity: success ? AuditSeverity.LOW : AuditSeverity.HIGH,
        }
      );
      
      logAuditEvent(auditEvent).catch(console.error);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Specific audit functions for common operations
export const auditLogin = async (
  userId: string,
  email: string,
  success: boolean,
  ipAddress: string,
  userAgent: string,
  errorMessage?: string
): Promise<void> => {
  const event = createAuditEvent(
    success ? AuditEventType.USER_LOGIN : AuditEventType.USER_LOGIN_FAILED,
    success ? 'User Login' : 'Failed Login Attempt',
    success ? `User ${email} logged in successfully` : `Failed login attempt for ${email}`,
    {
      userId: success ? userId : undefined,
      userEmail: email,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
    }
  );
  
  await logAuditEvent(event);
};

export const auditDataChange = async (
  userId: string,
  userEmail: string,
  resourceType: string,
  resourceId: string,
  action: string,
  before: Record<string, any>,
  after: Record<string, any>,
  ipAddress: string
): Promise<void> => {
  const event = createAuditEvent(
    getEventTypeForResource(resourceType, action),
    action,
    `${action} ${resourceType} ${resourceId}`,
    {
      userId,
      userEmail,
      resourceType,
      resourceId,
      ipAddress,
      changes: { before, after },
      severity: AuditSeverity.MEDIUM,
    }
  );
  
  await logAuditEvent(event);
};

export const auditSecurityEvent = async (
  eventType: AuditEventType,
  description: string,
  ipAddress: string,
  userAgent?: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  const event = createAuditEvent(
    eventType,
    'Security Event',
    description,
    {
      userId,
      ipAddress,
      userAgent,
      metadata,
      severity: AuditSeverity.HIGH,
      success: false,
    }
  );
  
  await logAuditEvent(event);
};

// Get event type based on resource and action
const getEventTypeForResource = (resourceType: string, action: string): AuditEventType => {
  const key = `${resourceType.toUpperCase()}_${action.toUpperCase()}`;
  return AuditEventType[key as keyof typeof AuditEventType] || AuditEventType.DATA_EXPORT;
};

// Query audit logs
export const queryAuditLogs = async (filters: {
  userId?: string;
  eventType?: AuditEventType;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity;
  limit?: number;
  offset?: number;
}): Promise<AuditEvent[]> => {
  try {
    const events: AuditEvent[] = [];
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    
    // Build query based on filters
    let keys: string[] = [];
    
    if (filters.userId) {
      keys.push(`audit:user:${filters.userId}`);
    } else if (filters.eventType) {
      keys.push(`audit:type:${filters.eventType}`);
    } else if (filters.resourceType && filters.resourceId) {
      keys.push(`audit:resource:${filters.resourceType}:${filters.resourceId}`);
    } else {
      // Query by date range
      const startDate = filters.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate || new Date();
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        keys.push(`audit:${currentDate.toISOString().split('T')[0]}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Fetch events from Redis
    for (const key of keys) {
      const rawEvents = await redis.lrange(key, offset, offset + limit - 1);
      for (const rawEvent of rawEvents) {
        try {
          const event = JSON.parse(rawEvent) as AuditEvent;
          
          // Apply additional filters
          if (filters.severity && event.severity !== filters.severity) continue;
          if (filters.eventType && event.eventType !== filters.eventType) continue;
          if (filters.startDate && new Date(event.timestamp) < filters.startDate) continue;
          if (filters.endDate && new Date(event.timestamp) > filters.endDate) continue;
          
          events.push(event);
        } catch (error) {
          console.error('Failed to parse audit event:', error);
        }
      }
    }
    
    // Sort by timestamp (most recent first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return events.slice(0, limit);
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return [];
  }
};

// Get audit statistics
export const getAuditStatistics = async (timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsTimeline: Array<{ date: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  securityEvents: number;
}> => {
  try {
    const now = new Date();
    const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const stats = {
      totalEvents: 0,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      eventsTimeline: [] as Array<{ date: string; count: number }>,
      topUsers: [] as Array<{ userId: string; count: number }>,
      securityEvents: 0,
    };
    
    // Query events for the timeframe
    const events = await queryAuditLogs({
      startDate,
      endDate: now,
      limit: 10000,
    });
    
    stats.totalEvents = events.length;
    
    // Aggregate statistics
    const userCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};
    
    for (const event of events) {
      // Count by type
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      
      // Count by severity
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
      
      // Count by user
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }
      
      // Count by day
      const day = event.timestamp.toISOString().split('T')[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      
      // Count security events
      if (event.severity === AuditSeverity.HIGH || event.severity === AuditSeverity.CRITICAL) {
        stats.securityEvents++;
      }
    }
    
    // Top users
    stats.topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Timeline
    stats.eventsTimeline = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return stats;
  } catch (error) {
    console.error('Failed to get audit statistics:', error);
    throw error;
  }
};