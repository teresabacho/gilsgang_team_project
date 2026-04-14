module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  maxWorkers: 1,
};
