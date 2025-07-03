/**
 * Circuit Breaker
 * 
 * Implements circuit breaker pattern to prevent cascading failures
 */

import { EventEmitter } from 'events';
import type {
  CircuitBreakerConfig,
  RecoveryOperation,
  ICircuitBreaker
} from './types.js';
import { CircuitBreakerState } from './types.js';

/**
 * Circuit breaker call result
 */
interface CallResult {
  success: boolean;
  timestamp: Date;
  duration: number;
  error?: Error;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker extends EventEmitter implements ICircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private callHistory: CallResult[] = [];
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    super();
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      recoveryTimeout: config.recoveryTimeout ?? 60000, // 1 minute
      monitoringWindow: config.monitoringWindow ?? 300000, // 5 minutes
      minimumThroughput: config.minimumThroughput ?? 10
    };
  }

  /**
   * Execute an operation through the circuit breaker
   */
  async execute<T>(operation: RecoveryOperation<T>): Promise<T> {
    const startTime = new Date();

    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this._shouldAttemptReset()) {
        this._transitionToHalfOpen();
      } else {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
    }

    try {
      const result = await operation();
      this._recordSuccess(startTime);
      return result;
    } catch (error) {
      this._recordFailure(startTime, error as Error);
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    const recentCalls = this._getRecentCalls();
    const totalCalls = recentCalls.length;
    const failedCalls = recentCalls.filter(call => !call.success).length;
    const successRate = totalCalls > 0 ? (totalCalls - failedCalls) / totalCalls : 1;

    return {
      state: this.state,
      failureCount: this.failureCount,
      totalCalls,
      failedCalls,
      successRate,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    delete (this as any).lastFailureTime;
    delete (this as any).nextAttemptTime;
    this.callHistory = [];
    this.emit('circuit.reset');
  }

  /**
   * Force circuit breaker to open state
   */
  forceOpen(): void {
    this.lastFailureTime = new Date();
    this._transitionToOpen();
  }

  /**
   * Force circuit breaker to closed state
   */
  forceClose(): void {
    this._transitionToClosed();
  }

  /**
   * Record a successful operation
   */
  private _recordSuccess(startTime: Date): void {
    const duration = Date.now() - startTime.getTime();
    
    this.callHistory.push({
      success: true,
      timestamp: new Date(),
      duration
    });

    this._cleanupHistory();

    // If we're in half-open state and this succeeds, close the circuit
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this._transitionToClosed();
    }
  }

  /**
   * Record a failed operation
   */
  private _recordFailure(startTime: Date, error: Error): void {
    const duration = Date.now() - startTime.getTime();
    
    this.callHistory.push({
      success: false,
      timestamp: new Date(),
      duration,
      error
    });

    this._cleanupHistory();

    this.failureCount++;
    this.lastFailureTime = new Date();

    // Check if we should open the circuit
    if (this._shouldOpenCircuit()) {
      this._transitionToOpen();
    }
  }

  /**
   * Check if circuit should be opened
   */
  private _shouldOpenCircuit(): boolean {
    const recentCalls = this._getRecentCalls();
    
    // Need minimum throughput to make a decision
    if (recentCalls.length < this.config.minimumThroughput) {
      return false;
    }

    // Check failure rate
    const failedCalls = recentCalls.filter(call => !call.success).length;
    return failedCalls >= this.config.failureThreshold;
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private _shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return true;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  /**
   * Get recent calls within the monitoring window
   */
  private _getRecentCalls(): CallResult[] {
    const cutoffTime = new Date(Date.now() - this.config.monitoringWindow);
    return this.callHistory.filter(call => call.timestamp >= cutoffTime);
  }

  /**
   * Clean up old call history
   */
  private _cleanupHistory(): void {
    const cutoffTime = new Date(Date.now() - this.config.monitoringWindow);
    this.callHistory = this.callHistory.filter(call => call.timestamp >= cutoffTime);
  }

  /**
   * Transition to OPEN state
   */
  private _transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
    this.emit('circuit.opened');
  }

  /**
   * Transition to HALF_OPEN state
   */
  private _transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    delete (this as any).nextAttemptTime;
    this.emit('circuit.halfOpen');
  }

  /**
   * Transition to CLOSED state
   */
  private _transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    delete (this as any).lastFailureTime;
    delete (this as any).nextAttemptTime;
    this.emit('circuit.closed');
  }
}

/**
 * Circuit breaker configuration builder
 */
export class CircuitBreakerConfigBuilder {
  private config: Partial<CircuitBreakerConfig> = {};

  /**
   * Set failure threshold
   */
  failureThreshold(threshold: number): this {
    this.config.failureThreshold = threshold;
    return this;
  }

  /**
   * Set recovery timeout in milliseconds
   */
  recoveryTimeout(timeout: number): this {
    this.config.recoveryTimeout = timeout;
    return this;
  }

  /**
   * Set monitoring window in milliseconds
   */
  monitoringWindow(window: number): this {
    this.config.monitoringWindow = window;
    return this;
  }

  /**
   * Set minimum throughput for decision making
   */
  minimumThroughput(throughput: number): this {
    this.config.minimumThroughput = throughput;
    return this;
  }

  /**
   * Build the configuration
   */
  build(): CircuitBreakerConfig {
    return {
      failureThreshold: this.config.failureThreshold || 5,
      recoveryTimeout: this.config.recoveryTimeout || 60000,
      monitoringWindow: this.config.monitoringWindow || 300000,
      minimumThroughput: this.config.minimumThroughput || 10
    };
  }
}

/**
 * Predefined circuit breaker configurations
 */
export const CircuitBreakerConfigs = {
  /**
   * Fast recovery for quick operations
   */
  fast: new CircuitBreakerConfigBuilder()
    .failureThreshold(3)
    .recoveryTimeout(30000) // 30 seconds
    .monitoringWindow(120000) // 2 minutes
    .minimumThroughput(5)
    .build(),

  /**
   * Standard configuration for most operations
   */
  standard: new CircuitBreakerConfigBuilder()
    .failureThreshold(5)
    .recoveryTimeout(60000) // 1 minute
    .monitoringWindow(300000) // 5 minutes
    .minimumThroughput(10)
    .build(),

  /**
   * Conservative configuration for critical operations
   */
  conservative: new CircuitBreakerConfigBuilder()
    .failureThreshold(10)
    .recoveryTimeout(300000) // 5 minutes
    .monitoringWindow(900000) // 15 minutes
    .minimumThroughput(20)
    .build()
};

/**
 * Create a circuit breaker with default configuration
 */
export function createCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  const defaultConfig = CircuitBreakerConfigs.standard;
  return new CircuitBreaker({ ...defaultConfig, ...config });
}
