module.exports = {
  testEnvironment: 'jsdom',
  preset: null,
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(fast-check)/)'
  ],
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  testTimeout: 10000
};
