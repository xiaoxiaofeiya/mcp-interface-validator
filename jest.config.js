export default {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 增加内存限制和性能优化
  maxWorkers: 1, // 限制并发worker数量，减少内存使用
  workerIdleMemoryLimit: '512MB', // 设置worker内存限制

  // 测试超时设置
  testTimeout: 30000, // 30秒超时

  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^vscode$': '<rootDir>/tests/__mocks__/vscode.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 内存和性能优化
  logHeapUsage: true, // 记录堆内存使用情况
  detectOpenHandles: true, // 检测未关闭的句柄
  forceExit: true, // 强制退出，防止内存泄漏

  // SQLite特定优化
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ]
};
