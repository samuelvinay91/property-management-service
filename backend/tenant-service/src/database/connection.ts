import { DataSource } from 'typeorm';
import { Tenant } from '../entities/Tenant';
import { Application } from '../entities/Application';
import { ApplicationReview } from '../entities/ApplicationReview';
import { EmergencyContact } from '../entities/EmergencyContact';
import { Lease } from '../entities/Lease';
import { TenantDocument } from '../entities/TenantDocument';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/propflow_tenants',
  entities: [Tenant, Application, ApplicationReview, EmergencyContact, Lease, TenantDocument],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function createConnection() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Tenant Service database connection established');
  } catch (error) {
    console.error('❌ Tenant Service database connection failed:', error);
    throw error;
  }
}