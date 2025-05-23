import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { EmailVerificationToken } from '../entities/EmailVerificationToken';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/propflow_auth',
  entities: [User, RefreshToken, PasswordResetToken, EmailVerificationToken],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function createConnection() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Auth Service database connection established');
  } catch (error) {
    console.error('❌ Auth Service database connection failed:', error);
    throw error;
  }
}