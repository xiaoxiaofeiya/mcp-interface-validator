/**
 * Error Recovery System Unit Tests
 */

import {
  ErrorClassifier,
  RetryManager,
  CircuitBreaker,
  StateManager,
  MetricsCollector,
  RecoveryManager,
  ErrorRecoverySystemFactory,
  ErrorRecoveryUtils,
  defaultErrorRecoverySystem,
  ErrorCategory,
  ErrorSeverity,
  RecoveryAction,
  RetryStrategy,
  CircuitBreakerState,
  createDefaultErrorClassifier,
  createRetryManager,
  createCircuitBreaker,
  createStateManager,
  createMetricsCollector,
  createRecoveryManager
} from '../../src/core/error-recovery';

describe('Error Recovery System', () => {
  describe('ErrorClassifier', () => {
    let classifier: ErrorClassifier;

    beforeEach(() => {
      classifier = createDefaultErrorClassifier();
    });

    test('should classify network errors correctly', () => {
      const error = new Error('ECONNREFUSED connection failed');
      const classification = classifier.classify(error);

      expect(classification.category).toBe(ErrorCategory.NETWORK);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.isRecoverable).toBe(true);
      expect(classification.recommendedAction).toBe(RecoveryAction.RETRY);
    });

    test('should classify timeout errors correctly', () => {
      const error = new Error('Request timed out');
      const classification = classifier.classify(error);

      expect(classification.category).toBe(ErrorCategory.TIMEOUT);
      expect(classification.isRecoverable).toBe(true);
    });

    test('should classify authentication errors correctly', () => {
      const error = new Error('401 Unauthorized');
      const classification = classifier.classify(error);

      expect(classification.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classification.isRecoverable).toBe(false);
      expect(classification.recommendedAction).toBe(RecoveryAction.ESCALATE);
    });

    test('should handle unknown errors', () => {
      const error = new Error('Some unknown error');
      const classification = classifier.classify(error);

      expect(classification.category).toBe(ErrorCategory.UNKNOWN);
      expect(classification.isRecoverable).toBe(true);
    });

    test('should allow custom classification rules', () => {
      const customClassification = {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.HIGH,
        isRecoverable: false,
        recommendedAction: RecoveryAction.ESCALATE,
        metadata: {}
      };

      classifier.addRule(
        (error) => error.message.includes('custom'),
        customClassification,
        200
      );

      const error = new Error('custom error message');
      const classification = classifier.classify(error);

      expect(classification.category).toBe(ErrorCategory.VALIDATION);
    });
  });

  describe('RetryManager', () => {
    let retryManager: RetryManager;

    beforeEach(() => {
      retryManager = createRetryManager();
    });

    test('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const config = {
        strategy: RetryStrategy.FIXED,
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false,
        retryableErrors: [ErrorCategory.NETWORK]
      };
      const context = {
        operationId: 'test',
        attempt: 0,
        startTime: new Date(),
        metadata: {},
        checkpoints: []
      };

      const result = await retryManager.execute(operation, config, context);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const config = {
        strategy: RetryStrategy.FIXED,
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false,
        retryableErrors: [ErrorCategory.NETWORK]
      };
      const context = {
        operationId: 'test',
        attempt: 0,
        startTime: new Date(),
        metadata: {},
        checkpoints: []
      };

      const result = await retryManager.execute(operation, config, context);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('401 Unauthorized'));
      const config = {
        strategy: RetryStrategy.FIXED,
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false,
        retryableErrors: [ErrorCategory.NETWORK]
      };
      const context = {
        operationId: 'test',
        attempt: 0,
        startTime: new Date(),
        metadata: {},
        checkpoints: []
      };

      await expect(retryManager.execute(operation, config, context))
        .rejects.toThrow('401 Unauthorized');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should calculate exponential backoff delay correctly', () => {
      const config = {
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
        retryableErrors: []
      };

      expect(retryManager.calculateDelay(1, config)).toBe(1000);
      expect(retryManager.calculateDelay(2, config)).toBe(2000);
      expect(retryManager.calculateDelay(3, config)).toBe(4000);
      expect(retryManager.calculateDelay(4, config)).toBe(8000);
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = createCircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 60000, // 60 seconds to ensure it stays open during test
        monitoringWindow: 5000,
        minimumThroughput: 2
      });
    });

    test('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    test('should execute operation successfully when closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should open circuit after failure threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));

      // Execute enough failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected failures
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    test('should reject operations when open', async () => {
      // Force circuit to open
      circuitBreaker.forceOpen();

      const operation = jest.fn().mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(operation))
        .rejects.toThrow('Circuit breaker is OPEN');
      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('StateManager', () => {
    let stateManager: StateManager;

    beforeEach(() => {
      stateManager = createStateManager();
    });

    test('should create checkpoints', () => {
      const state = { data: 'test' };
      const checkpoint = stateManager.createCheckpoint('op1', state, 'Test checkpoint');

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.description).toBe('Test checkpoint');
      expect(checkpoint.timestamp).toBeInstanceOf(Date);
    });

    test('should retrieve checkpoints by operation', () => {
      stateManager.createCheckpoint('op1', { data: 'test1' }, 'Checkpoint 1');
      stateManager.createCheckpoint('op1', { data: 'test2' }, 'Checkpoint 2');
      stateManager.createCheckpoint('op2', { data: 'test3' }, 'Checkpoint 3');

      const op1Checkpoints = stateManager.getCheckpoints('op1');
      expect(op1Checkpoints).toHaveLength(2);

      const allCheckpoints = stateManager.getCheckpoints();
      expect(allCheckpoints).toHaveLength(3);
    });

    test('should rollback to checkpoint', async () => {
      const state = { data: 'test' };
      const checkpoint = stateManager.createCheckpoint('op1', state, 'Test checkpoint');

      const restoredState = await stateManager.rollback(checkpoint.id);
      expect(restoredState).toEqual(state);
    });

    test('should clear checkpoints', () => {
      stateManager.createCheckpoint('op1', { data: 'test1' }, 'Checkpoint 1');
      stateManager.createCheckpoint('op2', { data: 'test2' }, 'Checkpoint 2');

      stateManager.clearCheckpoints('op1');
      expect(stateManager.getCheckpoints('op1')).toHaveLength(0);
      expect(stateManager.getCheckpoints('op2')).toHaveLength(1);

      stateManager.clearCheckpoints();
      expect(stateManager.getCheckpoints()).toHaveLength(0);
    });
  });

  describe('MetricsCollector', () => {
    let metricsCollector: MetricsCollector;

    beforeEach(() => {
      metricsCollector = createMetricsCollector();
    });

    afterEach(() => {
      metricsCollector.destroy();
    });

    test('should record operations', () => {
      metricsCollector.recordOperation('op1', true, 100);
      metricsCollector.recordOperation('op2', false, 200);

      const stats = metricsCollector.getStats();
      expect(stats.totalOperations).toBe(2);
      expect(stats.totalFailures).toBe(1);
      expect(stats.successRate).toBe(0.5);
    });

    test('should record errors', () => {
      const error = new Error('test error');
      const classification = {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        isRecoverable: true,
        recommendedAction: RecoveryAction.RETRY,
        metadata: {}
      };

      metricsCollector.recordError(error, classification);

      const stats = metricsCollector.getStats();
      expect(stats.errorBreakdown[ErrorCategory.NETWORK]).toBe(1);
    });

    test('should record recoveries', () => {
      metricsCollector.recordRecovery(RecoveryAction.RETRY, true, 500);
      metricsCollector.recordRecovery(RecoveryAction.FALLBACK, false, 1000);

      const stats = metricsCollector.getStats();
      expect(stats.totalRecoveries).toBe(2);
      expect(stats.recoveryBreakdown[RecoveryAction.RETRY]).toBe(1);
      expect(stats.recoveryBreakdown[RecoveryAction.FALLBACK]).toBe(1);
    });
  });

  describe('ErrorRecoverySystemFactory', () => {
    const recoverySystems: any[] = [];

    afterEach(async () => {
      // Clean up all recovery systems created during tests
      for (const system of recoverySystems) {
        if (system.recoveryManager && typeof system.recoveryManager.shutdown === 'function') {
          await system.recoveryManager.shutdown();
        }
      }
      recoverySystems.length = 0;
    });

    test('should create basic recovery system', () => {
      const system = ErrorRecoverySystemFactory.createBasic();
      recoverySystems.push(system);

      expect(system.recoveryManager).toBeDefined();
      expect(system.execute).toBeDefined();
      expect(system.getStats).toBeDefined();
      expect(system.getHealth).toBeDefined();
    });

    test('should create development recovery system', () => {
      const system = ErrorRecoverySystemFactory.createForDevelopment();
      recoverySystems.push(system);
      expect(system.recoveryManager).toBeDefined();
    });

    test('should create production recovery system', () => {
      const system = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(system);
      expect(system.recoveryManager).toBeDefined();
    });

    test('should create testing recovery system', () => {
      const system = ErrorRecoverySystemFactory.createForTesting();
      recoverySystems.push(system);
      expect(system.recoveryManager).toBeDefined();
    });
  });

  describe('ErrorRecoveryUtils', () => {
    test('should create retry wrapper', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('ECONNREFUSED'));
        }
        return Promise.resolve('success');
      });

      const result = await ErrorRecoveryUtils.withRetry(operation, 3, 10);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should create timeout wrapper', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 1000));
      
      await expect(ErrorRecoveryUtils.withTimeout(slowOperation, 100))
        .rejects.toThrow('Operation timed out');
    });
  });

  afterAll(async () => {
    // Clean up the default error recovery system
    if (defaultErrorRecoverySystem.recoveryManager && typeof defaultErrorRecoverySystem.recoveryManager.shutdown === 'function') {
      await defaultErrorRecoverySystem.recoveryManager.shutdown();
    }
  });
});
