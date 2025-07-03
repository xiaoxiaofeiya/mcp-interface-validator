/**
 * Error Recovery System Integration Tests
 */

import {
  ErrorRecoverySystemFactory,
  ErrorRecoveryUtils,
  executeWithRecovery,
  defaultErrorRecoverySystem,
  ErrorCategory,
  ErrorSeverity,
  RecoveryAction,
  RetryStrategy,
  CircuitBreakerState
} from '../../src/core/error-recovery';

describe('Error Recovery System Integration', () => {
  // Increase timeout for integration tests
  jest.setTimeout(60000);

  // Track recovery systems for cleanup
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

  afterAll(async () => {
    // Clean up the default error recovery system
    if (defaultErrorRecoverySystem.recoveryManager && typeof defaultErrorRecoverySystem.recoveryManager.shutdown === 'function') {
      await defaultErrorRecoverySystem.recoveryManager.shutdown();
    }
  });

  describe('End-to-End Recovery Scenarios', () => {
    test('should handle network failure with retry and fallback', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);
      let attempts = 0;

      const primaryOperation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('ECONNREFUSED connection failed'));
        }
        return Promise.resolve('primary success');
      });

      const result = await recoverySystem.execute(primaryOperation, 'network-test');

      expect(result.success).toBe(true);
      expect(result.result).toBe('primary success');
      expect(result.attempts.length).toBeGreaterThan(0);
      expect(primaryOperation).toHaveBeenCalledTimes(3);
    });

    test('should escalate to fallback when primary fails completely', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForDevelopment();
      recoverySystems.push(recoverySystem);

      const primaryOperation = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const fallbackOperation = jest.fn().mockResolvedValue('fallback success');

      // Use fallback wrapper
      const result = await ErrorRecoveryUtils.withFallback(
        primaryOperation,
        async () => await fallbackOperation(),
        'fallback-test'
      );

      expect(result).toBe('fallback success');
      expect(fallbackOperation).toHaveBeenCalled();
    });

    test('should handle timeout scenarios correctly', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 2000));

      await expect(ErrorRecoveryUtils.withTimeout(slowOperation, 500))
        .rejects.toThrow('Operation timed out');
    });

    test('should combine multiple recovery patterns', async () => {
      let attempts = 0;
      const unreliableOperation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve('success after retry');
      });

      const fallbackOperation = jest.fn().mockResolvedValue('fallback result');

      const result = await ErrorRecoveryUtils.withFullRecovery(
        unreliableOperation,
        async () => await fallbackOperation(),
        {
          maxAttempts: 3,
          timeout: 5000,
          operationId: 'full-recovery-test'
        }
      );

      expect(result).toBe('success after retry');
      expect(unreliableOperation).toHaveBeenCalledTimes(2);
      expect(fallbackOperation).not.toHaveBeenCalled();
    });
  });

  describe('Circuit Breaker Integration', () => {
    test('should protect against cascading failures', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      // Execute multiple failures to open circuit
      const results: Array<{ success: boolean; error?: any }> = [];
      for (let i = 0; i < 5; i++) {
        try {
          const result = await recoverySystem.execute(failingOperation, `circuit-test-${i}`);
          results.push({ success: result.success });
        } catch (error) {
          results.push({ success: false, error });
        }
      }

      expect(results).toHaveLength(5);
      expect(failingOperation).toHaveBeenCalled();
    }, 120000);

    test('should allow circuit breaker recovery', async () => {
      const circuitBreakerOperation = jest.fn().mockResolvedValue('recovered');

      const result = await ErrorRecoveryUtils.withCircuitBreaker(
        circuitBreakerOperation,
        'recovery-test',
        {
          failureThreshold: 1,
          recoveryTimeout: 100,
          monitoringWindow: 1000,
          minimumThroughput: 1
        }
      );

      expect(result).toBe('recovered');
      expect(circuitBreakerOperation).toHaveBeenCalled();
    });
  });

  describe('State Management Integration', () => {
    test('should maintain operation state across retries', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForTesting();
      recoverySystems.push(recoverySystem);
      let operationState = { counter: 0 };

      const statefulOperation = jest.fn().mockImplementation(() => {
        operationState.counter++;
        if (operationState.counter < 3) {
          return Promise.reject(new Error('Not ready yet'));
        }
        return Promise.resolve(`Success after ${operationState.counter} attempts`);
      });

      const result = await recoverySystem.execute(statefulOperation, 'stateful-test');

      expect(result.success).toBe(true);
      expect(result.result).toBe('Success after 3 attempts');
      expect(operationState.counter).toBe(3);
    });

    test('should handle state rollback on critical failures', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);
      const initialState = { data: 'initial', version: 1 };

      // Create checkpoint before operation
      recoverySystem.recoveryManager.createCheckpoint('rollback-test', initialState, 'Initial state');

      const criticalOperation = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Critical failure - rollback required'));
      });

      try {
        await recoverySystem.execute(criticalOperation, 'rollback-test');
      } catch (error) {
        // Expected to fail
      }

      // Get the checkpoint to verify it was created
      const checkpoints = recoverySystem.recoveryManager.getCheckpoints('rollback-test');
      expect(checkpoints.length).toBeGreaterThan(0);
      expect(checkpoints[0].state).toEqual(initialState);
      expect(criticalOperation).toHaveBeenCalled();
    });
  });

  describe('Metrics and Monitoring Integration', () => {
    test('should collect comprehensive metrics', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);

      // Execute successful operations
      await recoverySystem.execute(() => Promise.resolve('success1'), 'metrics-test-1');
      await recoverySystem.execute(() => Promise.resolve('success2'), 'metrics-test-2');

      // Execute failing operations
      try {
        await recoverySystem.execute(() => Promise.reject(new Error('failure')), 'metrics-test-3');
      } catch (error) {
        // Expected failure
      }

      const stats = recoverySystem.getStats();
      expect(stats.totalOperations).toBeGreaterThanOrEqual(3);
      expect(stats.totalFailures).toBeGreaterThanOrEqual(1);
      expect(stats.successRate).toBeLessThan(1);
    });

    test('should provide health status information', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);

      const health = recoverySystem.getHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('metrics');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Error Classification Integration', () => {
    test('should classify and handle different error types appropriately', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);

      // Network error - should retry
      const networkError = new Error('ECONNREFUSED connection failed');
      try {
        await recoverySystem.execute(() => Promise.reject(networkError), 'network-error-test');
      } catch (error) {
        // Expected after retries
      }

      // Authentication error - should not retry
      const authError = new Error('401 Unauthorized');
      try {
        await recoverySystem.execute(() => Promise.reject(authError), 'auth-error-test');
      } catch (error) {
        // Expected immediate failure
      }

      const stats = recoverySystem.getStats();
      expect(stats.errorBreakdown).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent operations efficiently', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);

      const operations = Array.from({ length: 10 }, (_, i) =>
        recoverySystem.execute(
          () => Promise.resolve(`result-${i}`),
          `concurrent-test-${i}`
        )
      );

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.result).toBe(`result-${index}`);
      });
    });

    test('should maintain performance under load', async () => {
      const recoverySystem = ErrorRecoverySystemFactory.createForProduction();
      recoverySystems.push(recoverySystem);
      const startTime = Date.now();

      const heavyOperations = Array.from({ length: 50 }, (_, i) =>
        recoverySystem.execute(
          () => new Promise(resolve => setTimeout(() => resolve(`heavy-${i}`), 10)),
          `load-test-${i}`
        )
      );

      await Promise.all(heavyOperations);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (allowing for some overhead)
      expect(duration).toBeLessThan(2000); // 2 seconds for 50 operations
    });
  });

  describe('Configuration and Customization', () => {
    test('should support custom recovery strategies', async () => {
      const customSystem = ErrorRecoverySystemFactory.createCustom({
        defaultStrategy: {
          retryConfig: {
            strategy: 'linear',
            maxAttempts: 2,
            baseDelay: 50,
            maxDelay: 200,
            backoffMultiplier: 1,
            jitter: false,
            retryableErrors: ['network', 'timeout']
          },
          circuitBreakerConfig: {
            failureThreshold: 2,
            recoveryTimeout: 1000,
            monitoringWindow: 2000,
            minimumThroughput: 1
          }
        }
      });
      recoverySystems.push(customSystem);

      let attempts = 0;
      const customOperation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('ECONNREFUSED'));
        }
        return Promise.resolve('custom success');
      });

      const result = await customSystem.execute(customOperation, 'custom-test');
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('custom success');
      expect(attempts).toBe(2);
    });
  });

  describe('Error Recovery Utils Integration', () => {
    test('should provide convenient utility functions', async () => {
      // Test retry utility
      let retryAttempts = 0;
      const retryResult = await ErrorRecoveryUtils.withRetry(
        () => {
          retryAttempts++;
          if (retryAttempts < 2) {
            return Promise.reject(new Error('retry needed'));
          }
          return Promise.resolve('retry success');
        },
        3,
        10
      );

      expect(retryResult).toBe('retry success');
      expect(retryAttempts).toBe(2);

      // Test timeout utility
      await expect(
        ErrorRecoveryUtils.withTimeout(
          () => new Promise(resolve => setTimeout(resolve, 1000)),
          100
        )
      ).rejects.toThrow('Operation timed out');
    });
  });

  describe('Default Recovery System', () => {
    test('should provide working default recovery system', async () => {
      let attempts = 0;
      const result = await executeWithRecovery(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('ECONNREFUSED'));
        }
        return Promise.resolve('default success');
      });

      expect(result).toBe('default success');
      expect(attempts).toBe(2);
    });
  });
});
