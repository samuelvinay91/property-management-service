import { DataSource } from 'typeorm';
import { Tenant } from '../entities/Tenant';
import { Application } from '../entities/Application';
import { ApplicationReview } from '../entities/ApplicationReview';
import { Lease } from '../entities/Lease';
import { EmergencyContact } from '../entities/EmergencyContact';
import { TenantDocument } from '../entities/TenantDocument';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'tenant_service',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Tenant,
    Application,
    ApplicationReview,
    Lease,
    EmergencyContact,
    TenantDocument
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts']
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Tenant Service Database connected successfully');
  } catch (error) {
    console.error('Error connecting to Tenant Service database:', error);
    process.exit(1);
  }
};