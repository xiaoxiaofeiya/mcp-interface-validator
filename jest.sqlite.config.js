export default {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // SQLite测试专用配置 - 优化内存使用
  maxWorkers: 1, // 单线程运行，避免内存竞争
  workerIdleMemoryLimit: '256MB', // 严格限制worker内存
  
  // 测试超时和重试设置
  testTimeout: 60000, // 60秒超时
  bail: 1, // 遇到第一个失败就停止
  
  // 只运行SQLite测试
  testMatch: [
    '**/sqlite-database.test.ts'
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
  
  // 禁用缓存以减少内存使用
  cache: false,
  
  // Jest内存优化
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // ts-jest配置优化
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true, // 隔离模块编译
      tsconfig: {
        incremental: false, // 禁用增量编译
        tsBuildInfoFile: null
      }
    }]
  }
};
