/**
 * Circuit Breaker
 *
 * Implements circuit breaker pattern to prevent cascading failures
 */
import { EventEmitter } from 'events';
import { CircuitBreakerState } from './types';
/**
 * Circuit breaker implementation
 */
export class CircuitBreaker extends EventEmitter {
    state = CircuitBreakerState.CLOSED;
    failureCount = 0;
    lastFailureTime;
    nextAttemptTime;
    callHistory = [];
    config;
    constructor(config) {
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
    async execute(operation) {
        const startTime = new Date();
        // Check if circuit is open
        if (this.state === CircuitBreakerState.OPEN) {
            if (this._shouldAttemptReset()) {
                this._transitionToHalfOpen();
            }
            else {
                throw new Error('Circuit breaker is OPEN - operation not allowed');
            }
        }
        try {
            const result = await operation();
            this._recordSuccess(startTime);
            return result;
        }
        catch (error) {
            this._recordFailure(startTime, error);
            throw error;
        }
    }
    /**
     * Get current circuit breaker state
     */
    getState() {
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
    reset() {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        delete this.lastFailureTime;
        delete this.nextAttemptTime;
        this.callHistory = [];
        this.emit('circuit.reset');
    }
    /**
     * Force circuit breaker to open state
     */
    forceOpen() {
        this.lastFailureTime = new Date();
        this._transitionToOpen();
    }
    /**
     * Force circuit breaker to closed state
     */
    forceClose() {
        this._transitionToClosed();
    }
    /**
     * Record a successful operation
     */
    _recordSuccess(startTime) {
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
    _recordFailure(startTime, error) {
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
    _shouldOpenCircuit() {
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
    _shouldAttemptReset() {
        if (!this.lastFailureTime) {
            return true;
        }
        const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
        return timeSinceLastFailure >= this.config.recoveryTimeout;
    }
    /**
     * Get recent calls within the monitoring window
     */
    _getRecentCalls() {
        const cutoffTime = new Date(Date.now() - this.config.monitoringWindow);
        return this.callHistory.filter(call => call.timestamp >= cutoffTime);
    }
    /**
     * Clean up old call history
     */
    _cleanupHistory() {
        const cutoffTime = new Date(Date.now() - this.config.monitoringWindow);
        this.callHistory = this.callHistory.filter(call => call.timestamp >= cutoffTime);
    }
    /**
     * Transition to OPEN state
     */
    _transitionToOpen() {
        this.state = CircuitBreakerState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
        this.emit('circuit.opened');
    }
    /**
     * Transition to HALF_OPEN state
     */
    _transitionToHalfOpen() {
        this.state = CircuitBreakerState.HALF_OPEN;
        delete this.nextAttemptTime;
        this.emit('circuit.halfOpen');
    }
    /**
     * Transition to CLOSED state
     */
    _transitionToClosed() {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        delete this.lastFailureTime;
        delete this.nextAttemptTime;
        this.emit('circuit.closed');
    }
}
/**
 * Circuit breaker configuration builder
 */
export class CircuitBreakerConfigBuilder {
    config = {};
    /**
     * Set failure threshold
     */
    failureThreshold(threshold) {
        this.config.failureThreshold = threshold;
        return this;
    }
    /**
     * Set recovery timeout in milliseconds
     */
    recoveryTimeout(timeout) {
        this.config.recoveryTimeout = timeout;
        return this;
    }
    /**
     * Set monitoring window in milliseconds
     */
    monitoringWindow(window) {
        this.config.monitoringWindow = window;
        return this;
    }
    /**
     * Set minimum throughput for decision making
     */
    minimumThroughput(throughput) {
        this.config.minimumThroughput = throughput;
        return this;
    }
    /**
     * Build the configuration
     */
    build() {
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
export function createCircuitBreaker(config) {
    const defaultConfig = CircuitBreakerConfigs.standard;
    return new CircuitBreaker({ ...defaultConfig, ...config });
}
//# sourceMappingURL=circuit-breaker.js.map