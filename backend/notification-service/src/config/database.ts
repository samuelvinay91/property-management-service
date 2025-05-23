import { DataSource } from 'typeorm';
import { Notification } from '../entities/Notification';
import { NotificationTemplate } from '../entities/NotificationTemplate';
import { NotificationPreference } from '../entities/NotificationPreference';
import { DeliveryLog } from '../entities/DeliveryLog';
import { NotificationGroup } from '../entities/NotificationGroup';
import { Logger } from '../utils/logger';

const logger = new Logger('Database');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'notification_service',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Notification,
    NotificationTemplate,
    NotificationPreference,
    DeliveryLog,
    NotificationGroup
  ],
  migrations: [
    'src/migrations/*.ts'
  ],
  subscribers: [
    'src/subscribers/*.ts'
  ],
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
    duration: 30000, // 30 seconds
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection initialized successfully');

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      await AppDataSource.runMigrations();
      logger.info('Database migrations completed');
    }

    // Create indexes if they don't exist
    await createCustomIndexes();
    
  } catch (error) {
    logger.error('Error initializing database connection', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection', {
      error: error.message
    });
    throw error;
  }
};

// Create custom indexes for better performance
const createCustomIndexes = async (): Promise<void> => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Notification indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_channel 
      ON notifications (recipient_id, channel);
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_status_scheduled 
      ON notifications (status, scheduled_at) 
      WHERE scheduled_at IS NOT NULL;
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at_desc 
      ON notifications (created_at DESC);
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_retry 
      ON notifications (status, next_retry_at, retry_count) 
      WHERE status = 'failed' AND next_retry_at IS NOT NULL;
    `);

    // Delivery log indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_logs_notification_status 
      ON delivery_logs (notification_id, status);
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_logs_provider_created 
      ON delivery_logs (provider, created_at DESC);
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_logs_channel_status_date 
      ON delivery_logs (channel, status, created_at) 
      WHERE created_at >= NOW() - INTERVAL '30 days';
    `);

    // Template indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_name_channel_status 
      ON notification_templates (name, channel, status);
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_usage 
      ON notification_templates (usage_count DESC, last_used_at DESC) 
      WHERE status = 'active';
    `);

    // Preference indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preferences_user_channel_type 
      ON notification_preferences (user_id, channel, type);
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preferences_status_enabled 
      ON notification_preferences (status, enabled) 
      WHERE enabled = true;
    `);

    // Group indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_status_scheduled 
      ON notification_groups (status, scheduled_at) 
      WHERE scheduled_at IS NOT NULL;
    `);
    
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_campaign_type 
      ON notification_groups (campaign_id, type) 
      WHERE campaign_id IS NOT NULL;
    `);

    await queryRunner.release();
    logger.info('Custom database indexes created successfully');
    
  } catch (error) {
    logger.warn('Some database indexes may already exist or failed to create', {
      error: error.message
    });
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    responseTime: number;
    activeConnections?: number;
    error?: string;
  };
}> => {
  const startTime = Date.now();
  
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }

    // Simple query to test connection
    await AppDataSource.query('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    
    // Get connection pool status
    const activeConnections = AppDataSource.driver.master?.totalCount || 0;
    
    return {
      status: 'healthy',
      details: {
        connected: true,
        responseTime,
        activeConnections
      }
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        responseTime,
        error: error.message
      }
    };
  }
};

// Graceful shutdown handler
export const gracefulShutdown = async (): Promise<void> => {
  logger.info('Initiating graceful database shutdown...');
  
  try {
    // Wait for ongoing queries to complete (max 10 seconds)
    const shutdownTimeout = 10000;
    const shutdownPromise = closeDatabase();
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Database shutdown timeout')), shutdownTimeout);
    });
    
    await Promise.race([shutdownPromise, timeoutPromise]);
    logger.info('Database shutdown completed successfully');
    
  } catch (error) {
    logger.error('Error during database shutdown', {
      error: error.message
    });
    
    // Force close if graceful shutdown fails
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

// Database monitoring utilities
export const getDatabaseMetrics = async (): Promise<{
  connectionCount: number;
  queryCount: number;
  errorCount: number;
  avgResponseTime: number;
}> => {
  try {
    // These would typically come from database monitoring
    // For now, return mock data
    return {
      connectionCount: AppDataSource.driver.master?.totalCount || 0,
      queryCount: 0, // Would track query count
      errorCount: 0, // Would track error count
      avgResponseTime: 0 // Would track average response time
    };
  } catch (error) {
    logger.error('Error getting database metrics', { error: error.message });
    throw error;
  }
};

// Handle connection events
AppDataSource.manager.connection.addListener('connect', () => {
  logger.info('Database connected');
});

AppDataSource.manager.connection.addListener('disconnect', () => {
  logger.warn('Database disconnected');
});

AppDataSource.manager.connection.addListener('error', (error) => {
  logger.error('Database connection error', { error: error.message });
});

// Export utility functions
export {
  AppDataSource as default,
  logger as dbLogger
};