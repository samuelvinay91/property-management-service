import { DataSource } from 'typeorm';
import { Payment } from '../entities/Payment';
import { PaymentMethod } from '../entities/PaymentMethod';
import { Refund } from '../entities/Refund';
import { Subscription } from '../entities/Subscription';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/propflow_payments',
  entities: [Payment, PaymentMethod, Refund, Subscription],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function createConnection() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Payment Service database connection established');
  } catch (error) {
    console.error('❌ Payment Service database connection failed:', error);
    throw error;
  }
}