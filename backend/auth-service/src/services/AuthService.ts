import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource } from '../database/connection';
import { getRedisClient } from '../database/redis';
import { User, UserRole } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { EmailVerificationToken } from '../entities/EmailVerificationToken';
import { NotificationService } from './NotificationService';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
  twoFactorCode?: string;
}

interface AuthPayload {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export class AuthService {
  private static userRepository = AppDataSource.getRepository(User);
  private static refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  private static passwordResetTokenRepository = AppDataSource.getRepository(PasswordResetToken);
  private static emailVerificationTokenRepository = AppDataSource.getRepository(EmailVerificationToken);

  static async register(input: RegisterInput): Promise<AuthPayload> {
    const { email, password, firstName, lastName, phoneNumber, role = UserRole.TENANT } = input;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      role
    });

    await this.userRepository.save(user);

    // Send email verification
    await this.sendEmailVerification(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
      expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  static async login(input: LoginInput): Promise<AuthPayload> {
    const { email, password, twoFactorCode } = input;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check 2FA if enabled
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        throw new Error('Two-factor authentication code required');
      }
      // 2FA verification would be handled by TwoFactorService
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
      expiresIn: 7 * 24 * 60 * 60
    };
  }

  static async refreshToken(refreshToken: string): Promise<AuthPayload> {
    // Find refresh token
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user']
    });

    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Revoke old token
    tokenRecord.isRevoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.user);

    return {
      ...tokens,
      user: tokenRecord.user,
      expiresIn: 7 * 24 * 60 * 60
    };
  }

  static async logout(userId: string): Promise<void> {
    // Revoke all refresh tokens for user
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );

    // Add user to blacklist in Redis (for immediate token invalidation)
    const redis = getRedisClient();
    await redis.setEx(`blacklist:user:${userId}`, 7 * 24 * 60 * 60, 'true');
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check if user is blacklisted
      const redis = getRedisClient();
      const isBlacklisted = await redis.get(`blacklist:user:${decoded.userId}`);
      if (isBlacklisted) {
        return null;
      }

      const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
      return user && user.isActive ? user : null;
    } catch (error) {
      return null;
    }
  }

  static async changePassword(userId: string, input: { currentPassword: string; newPassword: string }): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const resetToken = this.passwordResetTokenRepository.create({
      token,
      userId: user.id,
      expiresAt
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // Send email
    await NotificationService.sendPasswordResetEmail(user.email, token);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, isUsed: false },
      relations: ['user']
    });

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    resetToken.user.passwordHash = passwordHash;
    await this.userRepository.save(resetToken.user);

    // Mark token as used
    resetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(resetToken);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId: resetToken.user.id, isRevoked: false },
      { isRevoked: true }
    );
  }

  static async sendEmailVerification(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verificationToken = this.emailVerificationTokenRepository.create({
      token,
      userId: user.id,
      expiresAt
    });

    await this.emailVerificationTokenRepository.save(verificationToken);

    // Send email
    await NotificationService.sendEmailVerification(user.email, token);
  }

  static async verifyEmail(token: string): Promise<void> {
    const verificationToken = await this.emailVerificationTokenRepository.findOne({
      where: { token, isUsed: false },
      relations: ['user']
    });

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new Error('Verification token has expired');
    }

    // Mark email as verified
    verificationToken.user.isEmailVerified = true;
    await this.userRepository.save(verificationToken.user);

    // Mark token as used
    verificationToken.isUsed = true;
    await this.emailVerificationTokenRepository.save(verificationToken);
  }

  static async sendPhoneVerification(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.phoneNumber) {
      throw new Error('User not found or phone number not provided');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 10 minutes expiry
    const redis = getRedisClient();
    await redis.setEx(`phone_verification:${userId}`, 10 * 60, code);

    // Send SMS
    await NotificationService.sendPhoneVerification(user.phoneNumber, code);
  }

  static async verifyPhone(userId: string, code: string): Promise<void> {
    const redis = getRedisClient();
    const storedCode = await redis.get(`phone_verification:${userId}`);

    if (!storedCode || storedCode !== code) {
      throw new Error('Invalid verification code');
    }

    // Mark phone as verified
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.isPhoneVerified = true;
      await this.userRepository.save(user);
    }

    // Remove code from Redis
    await redis.del(`phone_verification:${userId}`);
  }

  private static async generateTokens(user: User): Promise<{ token: string; refreshToken: string }> {
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Generate refresh token
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      token,
      refreshToken: refreshTokenValue
    };
  }
}