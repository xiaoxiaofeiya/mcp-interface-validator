/**
 * Retry Manager
 * 
 * Implements various retry strategies with configurable backoff algorithms
 */

import type {
  RetryConfig,
  RecoveryOperation,
  RecoveryContext,
  IRetryManager
} from './types';
import { RetryStrategy, ErrorCategory } from './types';

/**
 * Retry manager implementation
 */
export class RetryManager implements IRetryManager {
  /**
   * Execute an operation with retry logic
   */
  async execute<T>(
    operation: RecoveryOperation<T>,
    config: RetryConfig,
    context: RecoveryContext
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        context.attempt = attempt;
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error as Error;
        context.lastError = lastError;

        // Check if we should retry this error
        if (!this.shouldRetry(lastError, attempt, config)) {
          throw lastError;
        }

        // Don't delay after the last attempt
        if (attempt < config.maxAttempts) {
          const delay = this.calculateDelay(attempt, config);
          await this._sleep(delay);
        }
      }
    }

    // All attempts exhausted
    throw lastError!;
  }

  /**
   * Calculate delay for the next retry attempt
   */
  calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    switch (config.strategy) {
      case RetryStrategy.FIXED:
        delay = config.baseDelay;
        break;

      case RetryStrategy.LINEAR:
        delay = config.baseDelay * attempt;
        break;

      case RetryStrategy.EXPONENTIAL:
        delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        break;

      case RetryStrategy.CUSTOM:
        if (config.customDelayFunction) {
          delay = config.customDelayFunction(attempt, config.baseDelay);
        } else {
          delay = config.baseDelay;
        }
        break;

      default:
        delay = config.baseDelay;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Apply jitter if enabled
    if (config.jitter) {
      delay = this._applyJitter(delay);
    }

    return Math.max(0, delay);
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean {
    // Check if we've exceeded max attempts
    if (attempt >= config.maxAttempts) {
      return false;
    }

    // Check if error category is retryable
    const errorCategory = this._categorizeError(error);
    if (!config.retryableErrors.includes(errorCategory)) {
      return false;
    }

    return true;
  }

  /**
   * Apply jitter to delay to avoid thundering herd
   */
  private _applyJitter(delay: number): number {
    // Apply random jitter of ±25%
    const jitterRange = delay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return delay + jitter;
  }

  /**
   * Sleep for specified milliseconds
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Categorize error for retry decision
   */
  private _categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (this._isNetworkError(message)) return ErrorCategory.NETWORK;
    if (this._isTimeoutError(message)) return ErrorCategory.TIMEOUT;
    if (this._isRateLimitError(message)) return ErrorCategory.RATE_LIMIT;
    if (this._isResourceError(message)) return ErrorCategory.RESOURCE;
    if (this._isSystemError(message)) return ErrorCategory.SYSTEM;
    if (this._isValidationError(message)) return ErrorCategory.VALIDATION;
    if (this._isAuthenticationError(message)) return ErrorCategory.AUTHENTICATION;
    if (this._isAuthorizationError(message)) return ErrorCategory.AUTHORIZATION;
    if (this._isConfigurationError(message)) return ErrorCategory.CONFIGURATION;

    return ErrorCategory.UNKNOWN;
  }

  private _isNetworkError(message: string): boolean {
    return ['econnrefused', 'enotfound', 'econnreset', 'etimedout', 'network', 'connection'].some(
      keyword => message.includes(keyword)
    );
  }

  private _isTimeoutError(message: string): boolean {
    return ['timeout', 'timed out', 'deadline exceeded'].some(keyword => message.includes(keyword));
  }

  private _isRateLimitError(message: string): boolean {
    return ['rate limit', 'too many requests', '429', 'quota exceeded'].some(keyword => message.includes(keyword));
  }

  private _isResourceError(message: string): boolean {
    return ['not found', '404', 'resource', 'file not found'].some(keyword => message.includes(keyword));
  }

  private _isSystemError(message: string): boolean {
    return ['internal server error', '500', 'system', 'server', 'service unavailable', '503'].some(
      keyword => message.includes(keyword)
    );
  }

  private _isValidationError(message: string): boolean {
    return ['validation', 'invalid', 'bad request', '400', 'malformed'].some(keyword => message.includes(keyword));
  }

  private _isAuthenticationError(message: string): boolean {
    return ['unauthorized', '401', 'authentication', 'invalid credentials'].some(keyword => message.includes(keyword));
  }

  private _isAuthorizationError(message: string): boolean {
    return ['forbidden', '403', 'authorization', 'access denied'].some(keyword => message.includes(keyword));
  }

  private _isConfigurationError(message: string): boolean {
    return ['configuration', 'config', 'environment', 'setting'].some(keyword => message.includes(keyword));
  }
}

/**
 * Retry configuration builder
 */
export class RetryConfigBuilder {
  private config: Partial<RetryConfig> = {};

  /**
   * Set retry strategy
   */
  strategy(strategy: RetryStrategy): this {
    this.config.strategy = strategy;
    return this;
  }

  /**
   * Set maximum number of attempts
   */
  maxAttempts(attempts: number): this {
    this.config.maxAttempts = attempts;
    return this;
  }

  /**
   * Set base delay in milliseconds
   */
  baseDelay(delay: number): this {
    this.config.baseDelay = delay;
    return this;
  }

  /**
   * Set maximum delay in milliseconds
   */
  maxDelay(delay: number): this {
    this.config.maxDelay = delay;
    return this;
  }

  /**
   * Set backoff multiplier for exponential strategy
   */
  backoffMultiplier(multiplier: number): this {
    this.config.backoffMultiplier = multiplier;
    return this;
  }

  /**
   * Enable or disable jitter
   */
  jitter(enabled: boolean): this {
    this.config.jitter = enabled;
    return this;
  }

  /**
   * Set retryable error categories
   */
  retryableErrors(errors: ErrorCategory[]): this {
    this.config.retryableErrors = errors;
    return this;
  }

  /**
   * Set custom delay function
   */
  customDelayFunction(fn: (attempt: number, baseDelay: number) => number): this {
    this.config.customDelayFunction = fn;
    return this;
  }

  /**
   * Build the retry configuration
   */
  build(): RetryConfig {
    return {
      strategy: this.config.strategy || RetryStrategy.EXPONENTIAL,
      maxAttempts: this.config.maxAttempts || 3,
      baseDelay: this.config.baseDelay || 1000,
      maxDelay: this.config.maxDelay || 30000,
      backoffMultiplier: this.config.backoffMultiplier || 2,
      jitter: this.config.jitter !== undefined ? this.config.jitter : true,
      retryableErrors: this.config.retryableErrors || [
        ErrorCategory.NETWORK,
        ErrorCategory.TIMEOUT,
        ErrorCategory.RATE_LIMIT,
        ErrorCategory.SYSTEM
      ],
      ...(this.config.customDelayFunction && { customDelayFunction: this.config.customDelayFunction })
    };
  }
}

/**
 * Predefined retry configurations
 */
export const RetryConfigs = {
  /**
   * Quick retry for fast operations
   */
  quick: new RetryConfigBuilder()
    .strategy(RetryStrategy.FIXED)
    .maxAttempts(3)
    .baseDelay(100)
    .maxDelay(1000)
    .jitter(true)
    .build(),

  /**
   * Standard retry for most operations
   */
  standard: new RetryConfigBuilder()
    .strategy(RetryStrategy.EXPONENTIAL)
    .maxAttempts(5)
    .baseDelay(1000)
    .maxDelay(30000)
    .backoffMultiplier(2)
    .jitter(true)
    .build(),

  /**
   * Aggressive retry for critical operations
   */
  aggressive: new RetryConfigBuilder()
    .strategy(RetryStrategy.EXPONENTIAL)
    .maxAttempts(10)
    .baseDelay(500)
    .maxDelay(60000)
    .backoffMultiplier(1.5)
    .jitter(true)
    .build(),

  /**
   * Conservative retry for expensive operations
   */
  conservative: new RetryConfigBuilder()
    .strategy(RetryStrategy.LINEAR)
    .maxAttempts(3)
    .baseDelay(5000)
    .maxDelay(30000)
    .jitter(false)
    .build()
};

/**
 * Create a default retry manager instance
 */
export function createRetryManager(): RetryManager {
  return new RetryManager();
}
