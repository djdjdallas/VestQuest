// Minimalist Jest configuration
module.exports = {
  testEnvironment: 'node',
  // Don't try to transform code with babel
  transform: {},
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ],
  // Only include simple tests for now
  testMatch: [
    '**/simple-tests/*.js'
  ],
  // Add coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'simple-tests/*.js',
    'src/utils/*.js'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover']
}