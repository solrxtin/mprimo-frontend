module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: [
    '<rootDir>/src/tests/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/controllers/**/*.ts',
    'src/services/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 30000,
  verbose: true
};