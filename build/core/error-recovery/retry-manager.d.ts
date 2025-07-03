/**
 * Retry Manager
 *
 * Implements various retry strategies with configurable backoff algorithms
 */
import type { RetryConfig, RecoveryOperation, RecoveryContext, IRetryManager } from './types';
import { RetryStrategy, ErrorCategory } from './types';
/**
 * Retry manager implementation
 */
export declare class RetryManager implements IRetryManager {
    /**
     * Execute an operation with retry logic
     */
    execute<T>(operation: RecoveryOperation<T>, config: RetryConfig, context: RecoveryContext): Promise<T>;
    /**
     * Calculate delay for the next retry attempt
     */
    calculateDelay(attempt: number, config: RetryConfig): number;
    /**
     * Determine if an error should be retried
     */
    shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean;
    /**
     * Apply jitter to delay to avoid thundering herd
     */
    private _applyJitter;
    /**
     * Sleep for specified milliseconds
     */
    private _sleep;
    /**
     * Categorize error for retry decision
     */
    private _categorizeError;
    private _isNetworkError;
    private _isTimeoutError;
    private _isRateLimitError;
    private _isResourceError;
    private _isSystemError;
    private _isValidationError;
    private _isAuthenticationError;
    private _isAuthorizationError;
    private _isConfigurationError;
}
/**
 * Retry configuration builder
 */
export declare class RetryConfigBuilder {
    private config;
    /**
     * Set retry strategy
     */
    strategy(strategy: RetryStrategy): this;
    /**
     * Set maximum number of attempts
     */
    maxAttempts(attempts: number): this;
    /**
     * Set base delay in milliseconds
     */
    baseDelay(delay: number): this;
    /**
     * Set maximum delay in milliseconds
     */
    maxDelay(delay: number): this;
    /**
     * Set backoff multiplier for exponential strategy
     */
    backoffMultiplier(multiplier: number): this;
    /**
     * Enable or disable jitter
     */
    jitter(enabled: boolean): this;
    /**
     * Set retryable error categories
     */
    retryableErrors(errors: ErrorCategory[]): this;
    /**
     * Set custom delay function
     */
    customDelayFunction(fn: (attempt: number, baseDelay: number) => number): this;
    /**
     * Build the retry configuration
     */
    build(): RetryConfig;
}
/**
 * Predefined retry configurations
 */
export declare const RetryConfigs: {
    /**
     * Quick retry for fast operations
     */
    quick: RetryConfig;
    /**
     * Standard retry for most operations
     */
    standard: RetryConfig;
    /**
     * Aggressive retry for critical operations
     */
    aggressive: RetryConfig;
    /**
     * Conservative retry for expensive operations
     */
    conservative: RetryConfig;
};
/**
 * Create a default retry manager instance
 */
export declare function createRetryManager(): RetryManager;
//# sourceMappingURL=retry-manager.d.ts.map