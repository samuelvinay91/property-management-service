module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'api-gateway/src/**/*.{ts,js}',
    'auth-service/src/**/*.{ts,js}',
    'property-service/src/**/*.{ts,js}',
    'tenant-service/src/**/*.{ts,js}',
    'maintenance-service/src/**/*.{ts,js}',
    'booking-service/src/**/*.{ts,js}',
    'payment-service/src/**/*.{ts,js}',
    'notification-service/src/**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.config.js',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@auth/(.*)$': '<rootDir>/auth-service/src/$1',
    '^@property/(.*)$': '<rootDir>/property-service/src/$1',
    '^@tenant/(.*)$': '<rootDir>/tenant-service/src/$1',
    '^@maintenance/(.*)$': '<rootDir>/maintenance-service/src/$1',
    '^@booking/(.*)$': '<rootDir>/booking-service/src/$1',
    '^@payment/(.*)$': '<rootDir>/payment-service/src/$1',
    '^@notification/(.*)$': '<rootDir>/notification-service/src/$1',
    '^@gateway/(.*)$': '<rootDir>/api-gateway/src/$1'
  },
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts'
};