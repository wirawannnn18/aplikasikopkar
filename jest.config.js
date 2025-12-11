export default {
  testEnvironment: 'jsdom',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder
  },
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
};
