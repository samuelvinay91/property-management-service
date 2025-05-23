import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/services/UserService';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/User';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashedPassword',
    role: 'TENANT',
    isActive: true,
    isEmailVerified: false,
    isPhoneVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const createUserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'TENANT' as const,
      };

      mockedBcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.createUser(createUserData);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserData,
        passwordHash: 'hashedPassword',
        password: undefined,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const createUserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'TENANT' as const,
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.createUser(createUserData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';

      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email, isActive: true },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';

      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUser(userId, updateData);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateData,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      const updateData = { firstName: 'Jane' };

      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateUser(userId, updateData)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const deactivatedUser = { ...mockUser, isActive: false };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(deactivatedUser);

      // Act
      await service.deleteUser(userId);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        isActive: false,
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteUser(userId)).rejects.toThrow('User not found');
    });
  });
});