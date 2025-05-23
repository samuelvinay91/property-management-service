import bcrypt from 'bcryptjs';
import { AppDataSource } from '../database/connection';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
}

export class UserService {
  private static userRepository = AppDataSource.getRepository(User);
  private static refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

  static async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields if provided
    if (input.firstName !== undefined) {
      user.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      user.lastName = input.lastName;
    }
    if (input.phoneNumber !== undefined) {
      user.phoneNumber = input.phoneNumber;
      // Reset phone verification if phone number changed
      user.isPhoneVerified = false;
    }
    if (input.avatar !== undefined) {
      user.avatar = input.avatar;
    }

    return await this.userRepository.save(user);
  }

  static async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await this.userRepository.save(user);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  static async getUsers(page: number = 1, limit: number = 10, role?: string): Promise<{ users: User[]; total: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    usersByRole: Record<string, number>;
  }> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    const verifiedUsers = await this.userRepository.count({ 
      where: { isEmailVerified: true, isActive: true } 
    });

    // Get users by role
    const roleStats = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role, COUNT(*) as count')
      .where('user.isActive = :isActive', { isActive: true })
      .groupBy('user.role')
      .getRawMany();

    const usersByRole = roleStats.reduce((acc, stat) => {
      acc[stat.user_role] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersByRole
    };
  }
}