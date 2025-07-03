/**
 * Error Recovery System
 *
 * Main entry point for the error recovery and retry system
 */
export * from './types';
export { ErrorClassifier, createDefaultErrorClassifier, ErrorClassifierUtils } from './error-classifier';
export { RetryManager, RetryConfigBuilder, RetryConfigs, createRetryManager } from './retry-manager';
export { CircuitBreaker, CircuitBreakerConfigBuilder, CircuitBreakerConfigs, createCircuitBreaker } from './circuit-breaker';
export { StateManager, createStateManager, StateManagerUtils } from './state-manager';
export { MetricsCollector, createMetricsCollector } from './metrics-collector';
export { RecoveryManager, createRecoveryManager } from './recovery-manager';
export type { ErrorCategory, ErrorSeverity, RecoveryAction, RetryStrategy, CircuitBreakerState, ErrorClassification, RetryConfig, CircuitBreakerConfig, RecoveryContext, RecoveryResult, RecoveryStats, HealthCheckResult } from './types';
/**
 * Error Recovery System Factory
 *
 * Provides convenient factory methods for creating configured recovery systems
 */
export declare class ErrorRecoverySystemFactory {
    /**
     * Create a basic error recovery system with default configuration
     */
    static createBasic(): {
        recoveryManager: any;
        execute: any;
        getStats: any;
        getHealth: any;
    };
    /**
     * Create a development-optimized error recovery system
     */
    static createForDevelopment(): {
        recoveryManager: any;
        execute: any;
        getStats: any;
        getHealth: any;
    };
    /**
     * Create a production-optimized error recovery system
     */
    static createForProduction(): {
        recoveryManager: any;
        execute: any;
        getStats: any;
        getHealth: any;
    };
    /**
     * Create a testing-optimized error recovery system
     */
    static createForTesting(): {
        recoveryManager: any;
        execute: any;
        getStats: any;
        getHealth: any;
    };
    /**
     * Create a custom error recovery system
     */
    static createCustom(config: any): {
        recoveryManager: any;
        execute: any;
        getStats: any;
        getHealth: any;
    };
}
/**
 * Utility functions for common error recovery patterns
 */
export declare class ErrorRecoveryUtils {
    /**
     * Create a simple retry wrapper for any async function
     */
    static withRetry<T>(fn: () => Promise<T>, _maxAttempts?: number, _delay?: number): Promise<T>;
    /**
     * Create a circuit breaker wrapper for any async function
     */
    static withCircuitBreaker<T>(fn: () => Promise<T>, _operationId: string, config?: any): Promise<T>;
    /**
     * Create a fallback wrapper for any async function
     */
    static withFallback<T>(primary: () => Promise<T>, fallback: (error: Error, context: any) => Promise<T>, operationId?: string): Promise<T>;
    /**
     * Create a timeout wrapper for any async function
     */
    static withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
    /**
     * Combine multiple recovery patterns
     */
    static withFullRecovery<T>(fn: () => Promise<T>, fallback: (error: Error, context: any) => Promise<T>, options?: {
        maxAttempts?: number;
        timeout?: number;
        circuitBreaker?: any;
        operationId?: string;
    }): Promise<T>;
}
/**
 * Default error recovery system instance
 */
export declare const defaultErrorRecoverySystem: {
    recoveryManager: any;
    execute: any;
    getStats: any;
    getHealth: any;
};
/**
 * Convenience function to execute operations with default recovery
 */
export declare function executeWithRecovery<T>(operation: () => Promise<T>, operationId?: string): Promise<T>;
//# sourceMappingURL=index.d.ts.map