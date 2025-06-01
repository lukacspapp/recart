/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**'],
};