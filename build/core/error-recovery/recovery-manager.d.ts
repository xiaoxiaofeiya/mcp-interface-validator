/**
 * Recovery Manager
 *
 * Main orchestrator for error recovery operations
 */
import { EventEmitter } from 'events';
import type { RecoveryManagerConfig, RecoveryStrategyConfig, RecoveryOperation, RecoveryResult, HealthCheckResult, StateCheckpoint, IRecoveryManager } from './types.js';
import { RetryManager } from './retry-manager.js';
/**
 * Recovery manager implementation
 */
export declare class RecoveryManager extends EventEmitter implements IRecoveryManager {
    private readonly config;
    private readonly errorClassifier;
    private readonly _retryManager;
    get retryManager(): RetryManager;
    private readonly stateManager;
    private readonly metricsCollector;
    private readonly logger;
    private readonly strategies;
    private readonly circuitBreakers;
    private readonly activeOperations;
    constructor(config: RecoveryManagerConfig);
    /**
     * Execute an operation with recovery capabilities
     */
    execute<T>(operation: RecoveryOperation<T>, operationId: string, strategyName?: string): Promise<RecoveryResult<T>>;
    /**
     * Create a state checkpoint
     */
    createCheckpoint(operationId: string, state: any, description: string): string;
    /**
     * Rollback to a specific checkpoint
     */
    rollbackToCheckpoint(operationId: string, checkpointId: string): Promise<void>;
    /**
     * Get recovery statistics
     */
    getStats(): import("./types.js").RecoveryStats;
    /**
     * Get checkpoints for a specific operation
     */
    getCheckpoints(operationId?: string): StateCheckpoint[];
    /**
     * Get health status
     */
    getHealthStatus(): HealthCheckResult;
    /**
     * Get health status (alias for getHealthStatus)
     */
    getHealth(): HealthCheckResult;
    /**
     * Add a recovery strategy
     */
    addStrategy(name: string, config: RecoveryStrategyConfig): void;
    /**
     * Remove a recovery strategy
     */
    removeStrategy(name: string): void;
    /**
     * Reset all recovery state
     */
    reset(): void;
    /**
     * Shutdown the recovery manager
     */
    shutdown(): Promise<void>;
    /**
     * Execute operation with specific strategy
     */
    private _executeWithStrategy;
    /**
     * Execute operation with retry and collect attempts
     */
    private _executeWithRetry;
    /**
     * Calculate retry delay
     */
    private _calculateDelay;
    /**
     * Get strategy by name or default
     */
    private _getStrategy;
    /**
     * Get or create circuit breaker for operation
     */
    private _getOrCreateCircuitBreaker;
    /**
     * Initialize default strategies
     */
    private _initializeStrategies;
    /**
     * Setup event listeners
     */
    private _setupEventListeners;
}
/**
 * Create a default recovery manager instance
 */
export declare function createRecoveryManager(config?: Partial<RecoveryManagerConfig>): RecoveryManager;
//# sourceMappingURL=recovery-manager.d.ts.map