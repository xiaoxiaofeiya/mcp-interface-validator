/**
 * Recovery Manager
 *
 * Main orchestrator for error recovery operations
 */
import { EventEmitter } from 'events';
import { RecoveryAction } from './types.js';
import { ErrorClassifier } from './error-classifier.js';
import { RetryManager } from './retry-manager.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { StateManager } from './state-manager.js';
import { MetricsCollector } from './metrics-collector.js';
import { Logger } from '../../utils/logger/index.js';
/**
 * Recovery manager implementation
 */
export class RecoveryManager extends EventEmitter {
    config;
    errorClassifier;
    _retryManager; // Used for retry logic
    // Getter to avoid unused variable warning
    get retryManager() { return this._retryManager; }
    stateManager;
    metricsCollector;
    logger;
    strategies = new Map();
    circuitBreakers = new Map();
    activeOperations = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger('RecoveryManager');
        // Initialize components
        this.errorClassifier = new ErrorClassifier();
        this._retryManager = new RetryManager();
        this.stateManager = new StateManager();
        this.metricsCollector = new MetricsCollector(config.metricsRetentionPeriod);
        // Setup strategies
        this._initializeStrategies();
        // Setup event listeners
        this._setupEventListeners();
    }
    /**
     * Execute an operation with recovery capabilities
     */
    async execute(operation, operationId, strategyName) {
        const startTime = new Date();
        const strategy = this._getStrategy(strategyName);
        const context = {
            operationId,
            attempt: 0,
            startTime,
            metadata: {},
            checkpoints: []
        };
        this.activeOperations.set(operationId, context);
        this.emit('recovery.started', context);
        const attempts = [];
        try {
            // Create initial checkpoint if state management is enabled
            if (strategy.enableStateManagement) {
                this.createCheckpoint(operationId, {}, 'Initial state');
            }
            const result = await this._executeWithStrategy(operation, strategy, context, attempts);
            const recoveryResult = {
                success: true,
                result,
                attempts,
                totalDuration: Date.now() - startTime.getTime(),
                recoveryAction: RecoveryAction.RETRY,
                context
            };
            // Record successful operation
            this.metricsCollector.recordOperation(operationId, true, Date.now() - startTime.getTime());
            this.emit('recovery.success', recoveryResult);
            return recoveryResult;
        }
        catch (error) {
            const recoveryResult = {
                success: false,
                error: error,
                attempts,
                totalDuration: Date.now() - startTime.getTime(),
                recoveryAction: RecoveryAction.ESCALATE,
                context
            };
            // Record failed operation
            this.metricsCollector.recordOperation(operationId, false, Date.now() - startTime.getTime(), error);
            // Classify the error for metrics
            const errorClassification = this.errorClassifier.classify(error);
            this.metricsCollector.recordError(error, errorClassification);
            this.emit('recovery.failure', recoveryResult);
            return recoveryResult;
        }
        finally {
            this.activeOperations.delete(operationId);
        }
    }
    /**
     * Create a state checkpoint
     */
    createCheckpoint(operationId, state, description) {
        const checkpoint = this.stateManager.createCheckpoint(operationId, state, description);
        const context = this.activeOperations.get(operationId);
        if (context) {
            context.checkpoints.push(checkpoint);
        }
        return checkpoint.id;
    }
    /**
     * Rollback to a specific checkpoint
     */
    async rollbackToCheckpoint(operationId, checkpointId) {
        try {
            await this.stateManager.rollback(checkpointId);
            this.emit('rollback.executed', operationId, checkpointId);
        }
        catch (error) {
            this.logger.error('Rollback failed', { operationId, checkpointId, error });
            throw error;
        }
    }
    /**
     * Get recovery statistics
     */
    getStats() {
        return this.metricsCollector.getStats();
    }
    /**
     * Get checkpoints for a specific operation
     */
    getCheckpoints(operationId) {
        return this.stateManager.getCheckpoints(operationId);
    }
    /**
     * Get health status
     */
    getHealthStatus() {
        const errors = [];
        const details = {};
        try {
            // Check metrics collector health
            const stats = this.metricsCollector.getStats();
            details['metrics'] = {
                totalOperations: stats.totalOperations,
                successRate: stats.successRate
            };
            // Check circuit breakers
            const circuitBreakerStates = {};
            for (const [name, breaker] of this.circuitBreakers) {
                circuitBreakerStates[name] = breaker.getState();
            }
            details['circuitBreakers'] = circuitBreakerStates;
            // Check active operations
            details['activeOperations'] = this.activeOperations.size;
            // Check state manager
            const stateStats = this.stateManager.getStats();
            details['stateManager'] = {
                totalCheckpoints: stateStats.totalCheckpoints,
                memoryUsage: stateStats.memoryUsage
            };
        }
        catch (error) {
            errors.push(error);
        }
        const isHealthy = errors.length === 0;
        const stats = this.metricsCollector.getStats();
        // Determine status based on health and metrics
        let status;
        if (!isHealthy) {
            status = 'unhealthy';
        }
        else if (stats.successRate < 0.8) {
            status = 'degraded';
        }
        else {
            status = 'healthy';
        }
        return {
            isHealthy,
            status,
            timestamp: new Date(),
            details,
            errors,
            metrics: details['metrics']
        };
    }
    /**
     * Get health status (alias for getHealthStatus)
     */
    getHealth() {
        return this.getHealthStatus();
    }
    /**
     * Add a recovery strategy
     */
    addStrategy(name, config) {
        this.strategies.set(name, config);
        // Create circuit breaker if configured
        if (config.circuitBreakerConfig) {
            this.circuitBreakers.set(name, new CircuitBreaker(config.circuitBreakerConfig));
        }
    }
    /**
     * Remove a recovery strategy
     */
    removeStrategy(name) {
        this.strategies.delete(name);
        this.circuitBreakers.delete(name);
    }
    /**
     * Reset all recovery state
     */
    reset() {
        this.activeOperations.clear();
        this.stateManager.clearCheckpoints();
        this.metricsCollector.reset();
        for (const breaker of this.circuitBreakers.values()) {
            breaker.reset();
        }
    }
    /**
     * Shutdown the recovery manager
     */
    async shutdown() {
        // Wait for active operations to complete or timeout
        const timeout = this.config.globalTimeout;
        const startTime = Date.now();
        while (this.activeOperations.size > 0 && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Force cleanup
        this.activeOperations.clear();
        this.metricsCollector.destroy();
        this.removeAllListeners();
    }
    /**
     * Execute operation with specific strategy
     */
    async _executeWithStrategy(operation, strategy, context, attempts) {
        const { retryConfig, circuitBreakerConfig, fallbackFunction } = strategy;
        try {
            // Use circuit breaker if configured
            if (circuitBreakerConfig) {
                const breaker = this._getOrCreateCircuitBreaker(context.operationId, circuitBreakerConfig);
                return await breaker.execute(async () => {
                    return await this._executeWithRetry(operation, retryConfig, context, attempts);
                });
            }
            else {
                return await this._executeWithRetry(operation, retryConfig, context, attempts);
            }
        }
        catch (error) {
            // Record error metrics
            const classification = this.errorClassifier.classify(error);
            this.metricsCollector.recordError(error, classification);
            // Try fallback if available
            if (fallbackFunction && classification.isRecoverable) {
                try {
                    const fallbackAttempt = {
                        attempt: attempts.length + 1,
                        timestamp: new Date(),
                        error: error,
                        action: RecoveryAction.FALLBACK,
                        success: false,
                        duration: 0,
                        metadata: { operationId: context.operationId }
                    };
                    attempts.push(fallbackAttempt);
                    this.emit('fallback.executed', context.operationId, error);
                    const fallbackStart = Date.now();
                    const result = await fallbackFunction(error, context);
                    fallbackAttempt.duration = Date.now() - fallbackStart;
                    return result;
                }
                catch (fallbackError) {
                    this.logger.error('Fallback failed', { operationId: context.operationId, fallbackError });
                    throw fallbackError;
                }
            }
            throw error;
        }
    }
    /**
     * Execute operation with retry and collect attempts
     */
    async _executeWithRetry(operation, retryConfig, context, attempts) {
        let lastError;
        for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
            const attemptStart = Date.now();
            try {
                const result = await operation();
                // Record successful attempt
                const successAttempt = {
                    attempt: attempt,
                    timestamp: new Date(),
                    action: RecoveryAction.RETRY,
                    success: true,
                    duration: Date.now() - attemptStart,
                    metadata: { operationId: context.operationId }
                };
                attempts.push(successAttempt);
                return result;
            }
            catch (error) {
                lastError = error;
                // Record failed attempt
                const failedAttempt = {
                    attempt: attempt,
                    timestamp: new Date(),
                    error: lastError,
                    action: RecoveryAction.RETRY,
                    success: false,
                    duration: Date.now() - attemptStart,
                    metadata: { operationId: context.operationId }
                };
                attempts.push(failedAttempt);
                // Check if we should retry
                const classification = this.errorClassifier.classify(lastError);
                if (attempt < retryConfig.maxAttempts && classification.isRecoverable) {
                    const delay = this._calculateDelay(attempt, retryConfig);
                    if (delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        }
        throw lastError;
    }
    /**
     * Calculate retry delay
     */
    _calculateDelay(attempt, config) {
        let delay = 0;
        switch (config.strategy) {
            case 'fixed':
                delay = config.baseDelay;
                break;
            case 'linear':
                delay = config.baseDelay * attempt;
                break;
            case 'exponential':
                delay = config.baseDelay * Math.pow(config.backoffMultiplier || 2, attempt - 1);
                break;
            default:
                delay = config.baseDelay;
        }
        // Apply jitter if enabled
        if (config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        // Respect max delay
        return Math.min(delay, config.maxDelay);
    }
    /**
     * Get strategy by name or default
     */
    _getStrategy(strategyName) {
        if (strategyName && this.strategies.has(strategyName)) {
            return this.strategies.get(strategyName);
        }
        return this.config.defaultStrategy;
    }
    /**
     * Get or create circuit breaker for operation
     */
    _getOrCreateCircuitBreaker(operationId, config) {
        if (!this.circuitBreakers.has(operationId)) {
            this.circuitBreakers.set(operationId, new CircuitBreaker(config));
        }
        return this.circuitBreakers.get(operationId);
    }
    /**
     * Initialize default strategies
     */
    _initializeStrategies() {
        // Add configured strategies
        for (const [name, config] of Object.entries(this.config.strategies)) {
            this.addStrategy(name, config);
        }
    }
    /**
     * Setup event listeners
     */
    _setupEventListeners() {
        // Listen to metrics events
        this.metricsCollector.on('operation.recorded', (metric) => {
            if (this.config.enableLogging) {
                this.logger.debug('Operation recorded', metric);
            }
        });
        this.metricsCollector.on('error.recorded', (metric) => {
            if (this.config.enableLogging) {
                this.logger.warn('Error recorded', metric);
            }
        });
        // Listen to circuit breaker events
        for (const [name, breaker] of this.circuitBreakers) {
            breaker.on('circuit.opened', () => {
                this.emit('circuit.opened', name);
                if (this.config.enableLogging) {
                    this.logger.warn('Circuit breaker opened', { strategy: name });
                }
            });
            breaker.on('circuit.closed', () => {
                this.emit('circuit.closed', name);
                if (this.config.enableLogging) {
                    this.logger.info('Circuit breaker closed', { strategy: name });
                }
            });
        }
    }
}
/**
 * Create a default recovery manager instance
 */
export function createRecoveryManager(config) {
    const defaultConfig = {
        defaultStrategy: {
            retryConfig: {
                strategy: 'exponential',
                maxAttempts: 3,
                baseDelay: 1000,
                maxDelay: 30000,
                backoffMultiplier: 2,
                jitter: true,
                retryableErrors: ['network', 'timeout', 'system']
            },
            enableStateManagement: true,
            enableMetrics: true
        },
        strategies: {},
        globalTimeout: 300000, // 5 minutes
        enableLogging: true,
        metricsRetentionPeriod: 3600000 // 1 hour
    };
    return new RecoveryManager({ ...defaultConfig, ...config });
}
//# sourceMappingURL=recovery-manager.js.map