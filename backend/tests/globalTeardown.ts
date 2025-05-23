import { execSync } from 'child_process';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Stop test containers if using Docker
    if (process.env.USE_DOCKER_FOR_TESTS === 'true') {
      console.log('🛑 Stopping test containers...');
      execSync('docker-compose -f docker-compose.test.yml down -v', {
        stdio: 'inherit'
      });
    }

    console.log('✅ Test environment cleanup complete');

  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
  }
}