import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/contracts/',
    '<rootDir>/tests/e2e/',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/contracts/',
    '/tests/',
  ],
};

export default createJestConfig(config);
