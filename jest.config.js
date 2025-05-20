// Jest configuration with React support
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ],
  // Focus just on simple tests for now
  testMatch: [
    '**/simple-tests/standalone.test.js'
  ],
  // Add coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'simple-tests/*.js',
    'src/utils/calculations.js'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary'],
  setupFilesAfterEnv: ['./jest.setup.js']
}