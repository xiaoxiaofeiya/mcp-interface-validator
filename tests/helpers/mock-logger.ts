import { jest } from '@jest/globals';
import type { Logger } from '../../src/utils/logger';

/**
 * Create a mock logger for testing
 */
export function createMockLogger(): jest.Mocked<Logger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setLevel: jest.fn(),
    getLevel: jest.fn().mockReturnValue('info'),
    child: jest.fn().mockReturnThis(),
    addContext: jest.fn().mockReturnThis(),
    removeContext: jest.fn().mockReturnThis(),
    clearContext: jest.fn().mockReturnThis(),
    getContext: jest.fn().mockReturnValue({}),
    startTimer: jest.fn().mockReturnValue({
      end: jest.fn().mockReturnValue(100)
    }),
    profile: jest.fn(),
    stream: jest.fn(),
    close: jest.fn()
  } as jest.Mocked<Logger>;
}

/**
 * Create a mock logger with specific behavior
 */
export function createMockLoggerWithBehavior(behavior: Partial<Logger>): jest.Mocked<Logger> {
  const mockLogger = createMockLogger();
  
  Object.assign(mockLogger, behavior);
  
  return mockLogger;
}

/**
 * Verify logger calls in tests
 */
export function expectLoggerCalls(
  mockLogger: jest.Mocked<Logger>,
  expectedCalls: {
    debug?: number;
    info?: number;
    warn?: number;
    error?: number;
  }
) {
  if (expectedCalls.debug !== undefined) {
    expect(mockLogger.debug).toHaveBeenCalledTimes(expectedCalls.debug);
  }
  if (expectedCalls.info !== undefined) {
    expect(mockLogger.info).toHaveBeenCalledTimes(expectedCalls.info);
  }
  if (expectedCalls.warn !== undefined) {
    expect(mockLogger.warn).toHaveBeenCalledTimes(expectedCalls.warn);
  }
  if (expectedCalls.error !== undefined) {
    expect(mockLogger.error).toHaveBeenCalledTimes(expectedCalls.error);
  }
}

/**
 * Reset all mock logger calls
 */
export function resetMockLogger(mockLogger: jest.Mocked<Logger>): void {
  Object.values(mockLogger).forEach(mockFn => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
}
