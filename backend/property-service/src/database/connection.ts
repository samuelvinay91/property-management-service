import { DataSource } from 'typeorm';
import { Property } from '../entities/Property';
import { PropertyImage } from '../entities/PropertyImage';
import { PropertyDocument } from '../entities/PropertyDocument';
import { Unit } from '../entities/Unit';
import { PropertyAmenity } from '../entities/PropertyAmenity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/propflow_properties',
  entities: [Property, PropertyImage, PropertyDocument, Unit, PropertyAmenity],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function createConnection() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Property Service database connection established');
  } catch (error) {
    console.error('❌ Property Service database connection failed:', error);
    throw error;
  }
}