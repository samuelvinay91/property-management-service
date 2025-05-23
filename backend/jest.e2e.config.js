module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/e2e'],
  testMatch: ['**/*.e2e.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1, // Run E2E tests sequentially
  forceExit: true,
  detectOpenHandles: true,
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
  globalSetup: '<rootDir>/tests/e2e/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/e2e/globalTeardown.ts'
};