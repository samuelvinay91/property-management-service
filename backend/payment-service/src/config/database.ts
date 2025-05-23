import { DataSource } from 'typeorm';
import { Payment } from '../entities/Payment';
import { PaymentMethod } from '../entities/PaymentMethod';
import { Subscription } from '../entities/Subscription';
import { Refund } from '../entities/Refund';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'payment_service',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Payment, PaymentMethod, Subscription, Refund],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts']
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Payment Service Database connected successfully');
  } catch (error) {
    console.error('Error connecting to Payment Service database:', error);
    process.exit(1);
  }
};