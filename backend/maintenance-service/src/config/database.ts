import { DataSource } from 'typeorm';
import { Logger } from '../utils/logger';
import { WorkOrder } from '../entities/WorkOrder';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Vendor } from '../entities/Vendor';
import { Asset } from '../entities/Asset';
import { Inspection } from '../entities/Inspection';
import { MaintenanceSchedule } from '../entities/MaintenanceSchedule';
import { Expense } from '../entities/Expense';
import { WorkOrderAttachment } from '../entities/WorkOrderAttachment';

const logger = new Logger('Database');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'maintenance_service',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    WorkOrder,
    MaintenanceRequest,
    Vendor,
    Asset,
    Inspection,
    MaintenanceSchedule,
    Expense,
    WorkOrderAttachment,
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  extra: {
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...');
    
    await AppDataSource.initialize();
    
    logger.info('Database connection established successfully', {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || '5432',
      database: process.env.POSTGRES_DB || 'maintenance_service',
    });

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      logger.info('Running database migrations...');
      await AppDataSource.runMigrations();
      logger.info('Database migrations completed');
    }

  } catch (error) {
    logger.error('Failed to initialize database', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<{ status: string; details?: any }> {
  try {
    if (!AppDataSource.isInitialized) {
      return { status: 'unhealthy', details: 'Database not initialized' };
    }

    // Simple query to check database connectivity
    await AppDataSource.query('SELECT 1');
    
    return { 
      status: 'healthy',
      details: {
        isInitialized: AppDataSource.isInitialized,
        hasMetadata: AppDataSource.hasMetadata,
        driverType: AppDataSource.driver.type,
      }
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return { 
      status: 'unhealthy', 
      details: { error: error.message } 
    };
  }
}

export async function gracefulShutdown(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      logger.info('Closing database connection...');
      await AppDataSource.destroy();
      logger.info('Database connection closed successfully');
    }
  } catch (error) {
    logger.error('Error during database shutdown', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Utility function to get repository
export function getRepository<T>(entity: any) {
  return AppDataSource.getRepository<T>(entity);
}

// Transaction helper
export async function runInTransaction<T>(
  operation: (manager: any) => Promise<T>
): Promise<T> {
  return AppDataSource.transaction(operation);
}