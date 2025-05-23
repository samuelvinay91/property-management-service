import request from 'supertest';
import { Application } from 'express';
import { Connection } from 'typeorm';
import { createTestApp } from '../helpers/testApp';
import { User } from '../../src/entities/User';

describe('Auth Integration Tests', () => {
  let app: Application;
  let connection: Connection;
  let testUser: User;

  beforeAll(async () => {
    app = await createTestApp();
    connection = global.__DB_CONNECTION__;
  });

  beforeEach(async () => {
    // Clean up database
    await connection.getRepository(User).delete({});
    
    // Create test user
    testUser = await connection.getRepository(User).save({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewJWa.lK.0CG3/zm', // 'password123'
      role: 'TENANT',
      isEmailVerified: true,
      isTwoFactorEnabled: false
    });
  });

  describe('POST /auth/register', () => {
    it('should successfully register a new user', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TENANT'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'TENANT'
        }),
        expiresIn: expect.any(Number)
      });

      // Verify user was created in database
      const user = await connection.getRepository(User).findOne({
        where: { email: 'newuser@example.com' }
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe('newuser@example.com');
    });

    it('should return 400 for invalid email format', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TENANT'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('email')
      });
    });

    it('should return 400 for weak password', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: '123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TENANT'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('password')
      });
    });

    it('should return 409 for existing email', async () => {
      const registerData = {
        email: 'test@example.com', // Same as testUser
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TENANT'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(409);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('already exists')
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          id: testUser.id,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }),
        expiresIn: expect.any(Number)
      });

      // Verify lastLoginAt was updated
      const updatedUser = await connection.getRepository(User).findOne({
        where: { id: testUser.id }
      });
      expect(updatedUser?.lastLoginAt).toBeTruthy();
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Invalid credentials')
      });
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Invalid credentials')
      });
    });

    it('should return 401 for unverified email', async () => {
      // Update test user to unverified
      await connection.getRepository(User).update(
        { id: testUser.id },
        { isEmailVerified: false }
      );

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Email not verified')
      });
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should successfully refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        token: expect.any(String),
        expiresIn: expect.any(Number)
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Invalid refresh token')
      });
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testUser.id,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT'
      });

      // Should not include sensitive data
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('token')
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('token')
      });
    });
  });

  describe('POST /auth/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should successfully change password', async () => {
      const changePasswordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword456'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true
      });

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword456'
        })
        .expect(200);

      expect(loginResponse.body.token).toBeTruthy();
    });

    it('should return 400 for wrong current password', async () => {
      const changePasswordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword456'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Current password')
      });
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should accept valid email (security - always return success)', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });
    });

    it('should accept non-existent email (security)', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('email')
      });
    });
  });

  describe('POST /auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should successfully logout', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('token')
      });
    });
  });
});