import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { AppDataSource } from '../database/connection';
import { User } from '../entities/User';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TwoFactorService {
  private static userRepository = AppDataSource.getRepository(User);

  static async setup(userId: string): Promise<TwoFactorSetup> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PropFlow (${user.email})`,
      issuer: 'PropFlow',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret temporarily (not enabled until verified)
    user.twoFactorSecret = secret.base32;
    await this.userRepository.save(user);

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes
    };
  }

  static async enable(userId: string, secret: string, code: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.twoFactorSecret !== secret) {
      throw new Error('Invalid secret');
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA
    user.isTwoFactorEnabled = true;
    user.backupCodes = this.generateBackupCodes();
    await this.userRepository.save(user);
  }

  static async disable(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('Two-factor authentication is not enabled');
    }

    // Verify the code or backup code
    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    const isValidBackupCode = user.backupCodes.includes(code);

    if (!isValidTotp && !isValidBackupCode) {
      throw new Error('Invalid verification code');
    }

    // If backup code was used, remove it
    if (isValidBackupCode) {
      user.backupCodes = user.backupCodes.filter(bc => bc !== code);
    }

    // Disable 2FA
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];
    await this.userRepository.save(user);
  }

  static async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // Try TOTP first
    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (isValidTotp) {
      return true;
    }

    // Try backup codes
    const isValidBackupCode = user.backupCodes.includes(code);
    if (isValidBackupCode) {
      // Remove used backup code
      user.backupCodes = user.backupCodes.filter(bc => bc !== code);
      await this.userRepository.save(user);
      return true;
    }

    return false;
  }

  static async generateBackupCodes(userId?: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();

    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.backupCodes = backupCodes;
        await this.userRepository.save(user);
      }
    }

    return backupCodes;
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}