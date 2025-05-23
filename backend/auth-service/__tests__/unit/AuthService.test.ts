import { AuthService } from '../../src/services/AuthService';
import { UserService } from '../../src/services/UserService';
import { User } from '../../src/entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../src/services/UserService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUser: Partial<User>;

  beforeEach(() => {
    authService = new AuthService();
    mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: 'hashedpassword',
      role: 'TENANT',
      isEmailVerified: true,
      isTwoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockBcrypt.compare = jest.fn().mockResolvedValue(true);
      mockJwt.sign = jest.fn().mockReturnValue('jwt-token');

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result).toEqual({
        token: 'jwt-token',
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com'
        }),
        expiresIn: expect.any(Number)
      });

      expect(mockUserService.prototype.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockJwt.sign).toHaveBeenCalled();
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockBcrypt.compare = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for unverified email', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(unverifiedUser);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('Email not verified');
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TENANT' as const
      };

      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
      mockBcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
      mockUserService.prototype.create = jest.fn().mockResolvedValue({
        ...mockUser,
        ...registerData,
        passwordHash: 'hashedpassword'
      });
      mockJwt.sign = jest.fn().mockReturnValue('jwt-token');

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result).toEqual({
        token: 'jwt-token',
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        }),
        expiresIn: expect.any(Number)
      });

      expect(mockUserService.prototype.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUserService.prototype.create).toHaveBeenCalled();
    });

    it('should throw error for existing email', async () => {
      // Arrange
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TENANT' as const
      };

      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow('User already exists');
    });

    it('should validate password strength', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: '123', // Weak password
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TENANT' as const
      };

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow('Password too weak');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decodedPayload = { userId: 'user-1', email: 'test@example.com' };

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload);
      mockUserService.prototype.findById = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await authService.verifyToken(token);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(mockUserService.prototype.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';

      mockJwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow('Invalid token');
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const token = 'expired-token';

      mockJwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow('Token expired');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const decodedPayload = { userId: 'user-1', type: 'refresh' };

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload);
      mockUserService.prototype.findById = jest.fn().mockResolvedValue(mockUser);
      mockJwt.sign = jest.fn().mockReturnValue('new-jwt-token');

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toEqual({
        token: 'new-jwt-token',
        expiresIn: expect.any(Number)
      });

      expect(mockJwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(mockUserService.prototype.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';

      mockJwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      // Arrange
      const userId = 'user-1';
      const changePasswordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      mockUserService.prototype.findById = jest.fn().mockResolvedValue(mockUser);
      mockBcrypt.compare = jest.fn().mockResolvedValue(true);
      mockBcrypt.hash = jest.fn().mockResolvedValue('newhashedpassword');
      mockUserService.prototype.update = jest.fn().mockResolvedValue(true);

      // Act
      const result = await authService.changePassword(userId, changePasswordData);

      // Assert
      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('oldpassword', 'hashedpassword');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockUserService.prototype.update).toHaveBeenCalledWith(
        userId,
        { passwordHash: 'newhashedpassword' }
      );
    });

    it('should throw error for wrong current password', async () => {
      // Arrange
      const userId = 'user-1';
      const changePasswordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      mockUserService.prototype.findById = jest.fn().mockResolvedValue(mockUser);
      mockBcrypt.compare = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(authService.changePassword(userId, changePasswordData))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for valid user', async () => {
      // Arrange
      const email = 'test@example.com';

      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockJwt.sign = jest.fn().mockReturnValue('reset-token');

      // Mock email service
      const mockSendEmail = jest.fn().mockResolvedValue(true);
      (authService as any).emailService = { sendPasswordResetEmail: mockSendEmail };

      // Act
      const result = await authService.forgotPassword(email);

      // Assert
      expect(result).toBe(true);
      expect(mockUserService.prototype.findByEmail).toHaveBeenCalledWith(email);
      expect(mockJwt.sign).toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should not throw error for non-existent email (security)', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);

      // Act
      const result = await authService.forgotPassword(email);

      // Assert
      expect(result).toBe(true); // Always return true for security
      expect(mockUserService.prototype.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      // Arrange
      const resetToken = 'valid-reset-token';
      const newPassword = 'newpassword123';
      const decodedPayload = { userId: 'user-1', type: 'password_reset' };

      mockJwt.verify = jest.fn().mockReturnValue(decodedPayload);
      mockUserService.prototype.findById = jest.fn().mockResolvedValue(mockUser);
      mockBcrypt.hash = jest.fn().mockResolvedValue('newhashedpassword');
      mockUserService.prototype.update = jest.fn().mockResolvedValue(true);

      // Act
      const result = await authService.resetPassword(resetToken, newPassword);

      // Assert
      expect(result).toBe(true);
      expect(mockJwt.verify).toHaveBeenCalledWith(resetToken, process.env.JWT_SECRET);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockUserService.prototype.update).toHaveBeenCalled();
    });

    it('should throw error for invalid reset token', async () => {
      // Arrange
      const resetToken = 'invalid-token';
      const newPassword = 'newpassword123';

      mockJwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.resetPassword(resetToken, newPassword))
        .rejects.toThrow('Invalid or expired reset token');
    });
  });
});