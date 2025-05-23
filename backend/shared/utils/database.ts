import { DataSource, DataSourceOptions } from 'typeorm';
import { Logger } from './logger';

interface DatabaseConfig {
  serviceName: string;
  entities: any[];
  migrations?: any[];
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  synchronize?: boolean;
  logging?: boolean;
  maxConnections?: number;
  acquireTimeout?: number;
  timeout?: number;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export class DatabaseFactory {
  private static instances: Map<string, DataSource> = new Map();
  private static logger = new Logger({ serviceName: 'DatabaseFactory' });

  static async createConnection(config: DatabaseConfig): Promise<DataSource> {
    const connectionName = config.serviceName;
    
    // Return existing connection if available
    if (this.instances.has(connectionName)) {
      const existingConnection = this.instances.get(connectionName)!;
      if (existingConnection.isInitialized) {
        this.logger.info(`Reusing existing database connection for ${connectionName}`);
        return existingConnection;
      }
    }

    const options: DataSourceOptions = {
      type: 'postgres',
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT || '5432'),
      username: config.username || process.env.DB_USERNAME || 'postgres',
      password: config.password || process.env.DB_PASSWORD || 'password',
      database: config.database || process.env.DB_NAME || `rentova_${config.serviceName.toLowerCase()}`,
      entities: config.entities,
      migrations: config.migrations || [],
      synchronize: config.synchronize ?? (process.env.NODE_ENV !== 'production'),
      logging: config.logging ?? (process.env.NODE_ENV === 'development'),
      ssl: config.ssl ?? (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
      extra: {
        max: config.maxConnections || parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        connectionTimeoutMillis: config.acquireTimeout || 30000,
        idleTimeoutMillis: config.timeout || 30000,
        allowExitOnIdle: true,
      },
      connectTimeoutMS: 30000,
      // Connection pool configuration
      poolSize: config.maxConnections || 10,
    };

    const dataSource = new DataSource(options);

    try {
      await this.initializeWithRetry(dataSource, config);
      this.instances.set(connectionName, dataSource);
      
      this.logger.info(`Database connection established for ${connectionName}`, {
        host: options.host,
        port: options.port,
        database: options.database,
        ssl: !!options.ssl
      });

      // Set up connection monitoring
      this.setupConnectionMonitoring(dataSource, connectionName);

      return dataSource;
    } catch (error) {
      this.logger.error(`Failed to establish database connection for ${connectionName}`, error);
      throw error;
    }
  }

  private static async initializeWithRetry(
    dataSource: DataSource, 
    config: DatabaseConfig
  ): Promise<void> {
    const maxAttempts = config.enableRetry ? (config.retryAttempts || 3) : 1;
    const retryDelay = config.retryDelay || 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await dataSource.initialize();
        if (attempt > 1) {
          this.logger.info(`Database connection successful on attempt ${attempt} for ${config.serviceName}`);
        }
        return;
      } catch (error) {
        this.logger.error(`Database connection attempt ${attempt} failed for ${config.serviceName}`, error);
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        this.logger.info(`Retrying database connection in ${retryDelay}ms for ${config.serviceName}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  private static setupConnectionMonitoring(dataSource: DataSource, serviceName: string): void {
    // Monitor connection health
    setInterval(async () => {
      try {
        if (dataSource.isInitialized) {
          await dataSource.query('SELECT 1');
        }
      } catch (error) {
        this.logger.error(`Database health check failed for ${serviceName}`, error);
      }
    }, 30000); // Check every 30 seconds

    // Log connection events
    dataSource.driver.connection?.on?.('connect', () => {
      this.logger.info(`Database connected for ${serviceName}`);
    });

    dataSource.driver.connection?.on?.('error', (error) => {
      this.logger.error(`Database connection error for ${serviceName}`, error);
    });

    dataSource.driver.connection?.on?.('disconnect', () => {
      this.logger.warn(`Database disconnected for ${serviceName}`);
    });
  }

  static async closeConnection(serviceName: string): Promise<void> {
    const connection = this.instances.get(serviceName);
    if (connection && connection.isInitialized) {
      await connection.destroy();
      this.instances.delete(serviceName);
      this.logger.info(`Database connection closed for ${serviceName}`);
    }
  }

  static async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.instances.keys()).map(serviceName =>
      this.closeConnection(serviceName)
    );
    await Promise.all(closePromises);
    this.logger.info('All database connections closed');
  }

  static getConnection(serviceName: string): DataSource | undefined {
    return this.instances.get(serviceName);
  }

  static async executeWithTransaction<T>(
    serviceName: string,
    operation: (queryRunner: any) => Promise<T>
  ): Promise<T> {
    const connection = this.getConnection(serviceName);
    if (!connection) {
      throw new Error(`No database connection found for service: ${serviceName}`);
    }

    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transaction failed for ${serviceName}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// Convenience function for creating service-specific connections
export const createServiceConnection = async (
  serviceName: string,
  entities: any[],
  options: Partial<DatabaseConfig> = {}
): Promise<DataSource> => {
  return DatabaseFactory.createConnection({
    serviceName,
    entities,
    enableRetry: true,
    retryAttempts: 3,
    retryDelay: 5000,
    ...options
  });
};

// Health check utility
export const checkDatabaseHealth = async (serviceName: string): Promise<boolean> => {
  try {
    const connection = DatabaseFactory.getConnection(serviceName);
    if (!connection || !connection.isInitialized) {
      return false;
    }
    
    await connection.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
};

// Migration utilities
export const runMigrations = async (serviceName: string): Promise<void> => {
  const connection = DatabaseFactory.getConnection(serviceName);
  if (!connection) {
    throw new Error(`No database connection found for service: ${serviceName}`);
  }
  
  await connection.runMigrations();
  DatabaseFactory['logger'].info(`Migrations completed for ${serviceName}`);
};

export const revertMigrations = async (serviceName: string): Promise<void> => {
  const connection = DatabaseFactory.getConnection(serviceName);
  if (!connection) {
    throw new Error(`No database connection found for service: ${serviceName}`);
  }
  
  await connection.undoLastMigration();
  DatabaseFactory['logger'].info(`Last migration reverted for ${serviceName}`);
};

export default DatabaseFactory;