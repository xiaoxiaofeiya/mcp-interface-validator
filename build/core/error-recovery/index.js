/**
 * Error Recovery System
 *
 * Main entry point for the error recovery and retry system
 */
// Types
export * from './types.js';
// Core components
export { ErrorClassifier, createDefaultErrorClassifier, ErrorClassifierUtils } from './error-classifier.js';
export { RetryManager, RetryConfigBuilder, RetryConfigs, createRetryManager } from './retry-manager.js';
export { CircuitBreaker, CircuitBreakerConfigBuilder, CircuitBreakerConfigs, createCircuitBreaker } from './circuit-breaker.js';
export { StateManager, createStateManager, StateManagerUtils } from './state-manager.js';
export { MetricsCollector, createMetricsCollector } from './metrics-collector.js';
export { RecoveryManager, createRecoveryManager } from './recovery-manager.js';
/**
 * Error Recovery System Factory
 *
 * Provides convenient factory methods for creating configured recovery systems
 */
export class ErrorRecoverySystemFactory {
    /**
     * Create a basic error recovery system with default configuration
     */
    static createBasic() {
        const { createRecoveryManager } = require('./recovery-manager');
        const recoveryManager = createRecoveryManager();
        return {
            recoveryManager,
            execute: recoveryManager.execute.bind(recoveryManager),
            getStats: recoveryManager.getStats.bind(recoveryManager),
            getHealth: recoveryManager.getHealth.bind(recoveryManager)
        };
    }
    /**
     * Create a development-optimized error recovery system
     */
    static createForDevelopment() {
        const { createRecoveryManager } = require('./recovery-manager');
        const recoveryManager = createRecoveryManager({
            defaultStrategy: {
                retryConfig: {
                    strategy: 'fixed',
                    maxAttempts: 2,
                    baseDelay: 500,
                    maxDelay: 5000,
                    backoffMultiplier: 1,
                    jitter: false,
                    retryableErrors: ['network', 'timeout']
                },
                enableStateManagement: true,
                enableMetrics: true
            },
            enableLogging: true,
            metricsRetentionPeriod: 1800000 // 30 minutes
        });
        return {
            recoveryManager,
            execute: recoveryManager.execute.bind(recoveryManager),
            getStats: recoveryManager.getStats.bind(recoveryManager),
            getHealth: recoveryManager.getHealth.bind(recoveryManager)
        };
    }
    /**
     * Create a production-optimized error recovery system
     */
    static createForProduction() {
        const { createRecoveryManager } = require('./recovery-manager');
        const recoveryManager = createRecoveryManager({
            defaultStrategy: {
                retryConfig: {
                    strategy: 'exponential',
                    maxAttempts: 5,
                    baseDelay: 1000,
                    maxDelay: 60000,
                    backoffMultiplier: 2,
                    jitter: true,
                    retryableErrors: ['network', 'timeout', 'rate_limit', 'system']
                },
                circuitBreakerConfig: {
                    failureThreshold: 10,
                    recoveryTimeout: 300000, // 5 minutes
                    monitoringWindow: 900000, // 15 minutes
                    minimumThroughput: 20
                },
                enableStateManagement: true,
                enableMetrics: true
            },
            enableLogging: false, // Reduce logging in production
            metricsRetentionPeriod: 7200000 // 2 hours
        });
        return {
            recoveryManager,
            execute: recoveryManager.execute.bind(recoveryManager),
            getStats: recoveryManager.getStats.bind(recoveryManager),
            getHealth: recoveryManager.getHealth.bind(recoveryManager)
        };
    }
    /**
     * Create a testing-optimized error recovery system
     */
    static createForTesting() {
        const { createRecoveryManager } = require('./recovery-manager');
        const recoveryManager = createRecoveryManager({
            defaultStrategy: {
                retryConfig: {
                    strategy: 'fixed',
                    maxAttempts: 3,
                    baseDelay: 10,
                    maxDelay: 100,
                    backoffMultiplier: 1,
                    jitter: false,
                    retryableErrors: ['network', 'timeout', 'unknown']
                },
                enableStateManagement: true,
                enableMetrics: true
            },
            enableLogging: false,
            metricsRetentionPeriod: 60000 // 1 minute
        });
        return {
            recoveryManager,
            execute: recoveryManager.execute.bind(recoveryManager),
            getStats: recoveryManager.getStats.bind(recoveryManager),
            getHealth: recoveryManager.getHealth.bind(recoveryManager)
        };
    }
    /**
     * Create a custom error recovery system
     */
    static createCustom(config) {
        const { createRecoveryManager } = require('./recovery-manager');
        const recoveryManager = createRecoveryManager(config);
        return {
            recoveryManager,
            execute: recoveryManager.execute.bind(recoveryManager),
            getStats: recoveryManager.getStats.bind(recoveryManager),
            getHealth: recoveryManager.getHealth.bind(recoveryManager)
        };
    }
}
/**
 * Utility functions for common error recovery patterns
 */
export class ErrorRecoveryUtils {
    /**
     * Create a simple retry wrapper for any async function
     */
    static async withRetry(fn, _maxAttempts = 3, _delay = 1000) {
        const recoverySystem = ErrorRecoverySystemFactory.createBasic();
        try {
            const result = await recoverySystem.execute(fn, `retry-${Date.now()}`);
            if (result.success && result.result !== undefined) {
                return result.result;
            }
            throw result.error || new Error('Operation failed');
        }
        finally {
            // Clean up the recovery system
            if (recoverySystem.recoveryManager && typeof recoverySystem.recoveryManager.shutdown === 'function') {
                await recoverySystem.recoveryManager.shutdown();
            }
        }
    }
    /**
     * Create a circuit breaker wrapper for any async function
     */
    static withCircuitBreaker(fn, _operationId, config) {
        const { createCircuitBreaker } = require('./circuit-breaker');
        const circuitBreaker = createCircuitBreaker(config);
        return circuitBreaker.execute(fn);
    }
    /**
     * Create a fallback wrapper for any async function
     */
    static async withFallback(primary, fallback, operationId = `fallback-${Date.now()}`) {
        const { createRecoveryManager } = require('./recovery-manager');
        const recoveryManager = createRecoveryManager({
            defaultStrategy: {
                retryConfig: {
                    strategy: 'fixed',
                    maxAttempts: 1,
                    baseDelay: 0,
                    maxDelay: 0,
                    backoffMultiplier: 1,
                    jitter: false,
                    retryableErrors: []
                },
                fallbackFunction: fallback,
                enableStateManagement: false,
                enableMetrics: false
            }
        });
        try {
            const result = await recoveryManager.execute(primary, operationId);
            if (result.success && result.result !== undefined) {
                return result.result;
            }
            throw result.error || new Error('Operation failed');
        }
        finally {
            // Clean up the recovery manager
            if (typeof recoveryManager.shutdown === 'function') {
                await recoveryManager.shutdown();
            }
        }
    }
    /**
     * Create a timeout wrapper for any async function
     */
    static withTimeout(fn, timeoutMs, timeoutMessage = 'Operation timed out') {
        return Promise.race([
            fn(),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
            })
        ]);
    }
    /**
     * Combine multiple recovery patterns
     */
    static async withFullRecovery(fn, fallback, options = {}) {
        const { maxAttempts = 3, timeout = 30000, circuitBreaker, operationId = `full-recovery-${Date.now()}` } = options;
        const { createRecoveryManager } = require('./recovery-manager');
        const recoveryManager = createRecoveryManager({
            defaultStrategy: {
                retryConfig: {
                    strategy: 'exponential',
                    maxAttempts,
                    baseDelay: 1000,
                    maxDelay: 10000,
                    backoffMultiplier: 2,
                    jitter: true,
                    retryableErrors: ['network', 'timeout', 'system']
                },
                circuitBreakerConfig: circuitBreaker,
                fallbackFunction: fallback,
                enableStateManagement: true,
                enableMetrics: true
            },
            globalTimeout: timeout
        });
        try {
            const result = await recoveryManager.execute(fn, operationId);
            if (result.success && result.result !== undefined) {
                return result.result;
            }
            throw result.error || new Error('Operation failed');
        }
        finally {
            // Clean up the recovery manager
            if (typeof recoveryManager.shutdown === 'function') {
                await recoveryManager.shutdown();
            }
        }
    }
}
/**
 * Default error recovery system instance
 */
export const defaultErrorRecoverySystem = ErrorRecoverySystemFactory.createBasic();
/**
 * Convenience function to execute operations with default recovery
 */
export function executeWithRecovery(operation, operationId = `operation-${Date.now()}`) {
    return defaultErrorRecoverySystem.execute(operation, operationId).then((result) => {
        if (result.success && result.result !== undefined) {
            return result.result;
        }
        throw result.error || new Error('Operation failed');
    });
}
//# sourceMappingURL=index.js.map