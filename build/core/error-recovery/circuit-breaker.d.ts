/**
 * Circuit Breaker
 *
 * Implements circuit breaker pattern to prevent cascading failures
 */
import { EventEmitter } from 'events';
import type { CircuitBreakerConfig, RecoveryOperation, ICircuitBreaker } from './types';
import { CircuitBreakerState } from './types';
/**
 * Circuit breaker implementation
 */
export declare class CircuitBreaker extends EventEmitter implements ICircuitBreaker {
    private state;
    private failureCount;
    private lastFailureTime?;
    private nextAttemptTime?;
    private callHistory;
    private readonly config;
    constructor(config: CircuitBreakerConfig);
    /**
     * Execute an operation through the circuit breaker
     */
    execute<T>(operation: RecoveryOperation<T>): Promise<T>;
    /**
     * Get current circuit breaker state
     */
    getState(): CircuitBreakerState;
    /**
     * Get circuit breaker statistics
     */
    getStats(): {
        state: CircuitBreakerState;
        failureCount: number;
        totalCalls: number;
        failedCalls: number;
        successRate: number;
        lastFailureTime: Date | undefined;
        nextAttemptTime: Date | undefined;
    };
    /**
     * Manually reset the circuit breaker
     */
    reset(): void;
    /**
     * Force circuit breaker to open state
     */
    forceOpen(): void;
    /**
     * Force circuit breaker to closed state
     */
    forceClose(): void;
    /**
     * Record a successful operation
     */
    private _recordSuccess;
    /**
     * Record a failed operation
     */
    private _recordFailure;
    /**
     * Check if circuit should be opened
     */
    private _shouldOpenCircuit;
    /**
     * Check if we should attempt to reset the circuit
     */
    private _shouldAttemptReset;
    /**
     * Get recent calls within the monitoring window
     */
    private _getRecentCalls;
    /**
     * Clean up old call history
     */
    private _cleanupHistory;
    /**
     * Transition to OPEN state
     */
    private _transitionToOpen;
    /**
     * Transition to HALF_OPEN state
     */
    private _transitionToHalfOpen;
    /**
     * Transition to CLOSED state
     */
    private _transitionToClosed;
}
/**
 * Circuit breaker configuration builder
 */
export declare class CircuitBreakerConfigBuilder {
    private config;
    /**
     * Set failure threshold
     */
    failureThreshold(threshold: number): this;
    /**
     * Set recovery timeout in milliseconds
     */
    recoveryTimeout(timeout: number): this;
    /**
     * Set monitoring window in milliseconds
     */
    monitoringWindow(window: number): this;
    /**
     * Set minimum throughput for decision making
     */
    minimumThroughput(throughput: number): this;
    /**
     * Build the configuration
     */
    build(): CircuitBreakerConfig;
}
/**
 * Predefined circuit breaker configurations
 */
export declare const CircuitBreakerConfigs: {
    /**
     * Fast recovery for quick operations
     */
    fast: CircuitBreakerConfig;
    /**
     * Standard configuration for most operations
     */
    standard: CircuitBreakerConfig;
    /**
     * Conservative configuration for critical operations
     */
    conservative: CircuitBreakerConfig;
};
/**
 * Create a circuit breaker with default configuration
 */
export declare function createCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker;
//# sourceMappingURL=circuit-breaker.d.ts.map