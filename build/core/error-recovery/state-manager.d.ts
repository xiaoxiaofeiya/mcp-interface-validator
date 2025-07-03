/**
 * State Manager
 *
 * Manages state checkpoints and rollback functionality
 */
import { EventEmitter } from 'events';
import type { StateCheckpoint, IStateManager } from './types.js';
/**
 * State manager implementation
 */
export declare class StateManager extends EventEmitter implements IStateManager {
    private checkpoints;
    private operationCheckpoints;
    private maxCheckpoints;
    private compressionEnabled;
    constructor(options?: {
        maxCheckpoints?: number;
        compressionEnabled?: boolean;
    });
    /**
     * Create a state checkpoint
     */
    createCheckpoint(operationId: string, state: any, description: string): StateCheckpoint;
    /**
     * Rollback to a specific checkpoint
     */
    rollback(checkpointId: string): Promise<any>;
    /**
     * Clear checkpoints for a specific operation or all checkpoints
     */
    clearCheckpoints(operationId?: string): void;
    /**
     * Get checkpoints for a specific operation or all checkpoints
     */
    getCheckpoints(operationId?: string): StateCheckpoint[];
    /**
     * Get a specific checkpoint by ID
     */
    getCheckpoint(checkpointId: string): StateCheckpoint | undefined;
    /**
     * Get the latest checkpoint for an operation
     */
    getLatestCheckpoint(operationId: string): StateCheckpoint | undefined;
    /**
     * Get state manager statistics
     */
    getStats(): {
        totalCheckpoints: number;
        totalOperations: number;
        checkpointsByOperation: Record<string, number>;
        memoryUsage: number;
        maxCheckpoints: number;
        compressionEnabled: boolean;
    };
    /**
     * Generate a unique checkpoint ID
     */
    private _generateCheckpointId;
    /**
     * Serialize state for storage
     */
    private _serializeState;
    /**
     * Deserialize state from storage
     */
    private _deserializeState;
    /**
     * Restore state (placeholder for actual state restoration logic)
     */
    private _restoreState;
    /**
     * Compress state (placeholder for actual compression)
     */
    private _compressState;
    /**
     * Decompress state (placeholder for actual decompression)
     */
    private _decompressState;
    /**
     * Clean up old checkpoints to maintain memory limits
     */
    private _cleanupOldCheckpoints;
    /**
     * Calculate approximate memory usage
     */
    private _calculateMemoryUsage;
}
/**
 * Create a default state manager instance
 */
export declare function createStateManager(options?: {
    maxCheckpoints?: number;
    compressionEnabled?: boolean;
}): StateManager;
/**
 * State manager utilities
 */
export declare const StateManagerUtils: {
    /**
     * Create a checkpoint with automatic cleanup
     */
    createAutoCleanupCheckpoint(stateManager: StateManager, operationId: string, state: any, description: string, ttl?: number): StateCheckpoint;
    /**
     * Create a checkpoint with validation
     */
    createValidatedCheckpoint(stateManager: StateManager, operationId: string, state: any, description: string, validator?: (state: any) => boolean): StateCheckpoint;
};
//# sourceMappingURL=state-manager.d.ts.map