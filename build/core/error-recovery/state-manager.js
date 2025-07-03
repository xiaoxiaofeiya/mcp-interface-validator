/**
 * State Manager
 *
 * Manages state checkpoints and rollback functionality
 */
import { EventEmitter } from 'events';
/**
 * State manager implementation
 */
export class StateManager extends EventEmitter {
    checkpoints = new Map();
    operationCheckpoints = new Map();
    maxCheckpoints;
    compressionEnabled;
    constructor(options = {}) {
        super();
        this.maxCheckpoints = options.maxCheckpoints || 100;
        this.compressionEnabled = options.compressionEnabled || false;
    }
    /**
     * Create a state checkpoint
     */
    createCheckpoint(operationId, state, description) {
        const checkpointId = this._generateCheckpointId(operationId);
        const checkpoint = {
            id: checkpointId,
            timestamp: new Date(),
            state: this._serializeState(state),
            description
        };
        // Store checkpoint
        this.checkpoints.set(checkpointId, checkpoint);
        // Track checkpoint for operation
        if (!this.operationCheckpoints.has(operationId)) {
            this.operationCheckpoints.set(operationId, []);
        }
        this.operationCheckpoints.get(operationId).push(checkpointId);
        // Cleanup old checkpoints if needed
        this._cleanupOldCheckpoints();
        this.emit('checkpoint.created', checkpoint, operationId);
        return checkpoint;
    }
    /**
     * Rollback to a specific checkpoint
     */
    async rollback(checkpointId) {
        const checkpoint = this.checkpoints.get(checkpointId);
        if (!checkpoint) {
            throw new Error(`Checkpoint not found: ${checkpointId}`);
        }
        try {
            const state = this._deserializeState(checkpoint.state);
            this.emit('rollback.started', checkpoint);
            // In a real implementation, this would restore the actual application state
            // For now, we just return the state data
            const restoredState = await this._restoreState(state);
            this.emit('rollback.completed', checkpoint, restoredState);
            return restoredState;
        }
        catch (error) {
            this.emit('rollback.failed', checkpoint, error);
            throw new Error(`Failed to rollback to checkpoint ${checkpointId}: ${error.message}`);
        }
    }
    /**
     * Clear checkpoints for a specific operation or all checkpoints
     */
    clearCheckpoints(operationId) {
        if (operationId) {
            const checkpointIds = this.operationCheckpoints.get(operationId) || [];
            // Remove checkpoints
            for (const checkpointId of checkpointIds) {
                this.checkpoints.delete(checkpointId);
            }
            // Remove operation tracking
            this.operationCheckpoints.delete(operationId);
            this.emit('checkpoints.cleared', operationId, checkpointIds.length);
        }
        else {
            // Clear all checkpoints
            const totalCheckpoints = this.checkpoints.size;
            this.checkpoints.clear();
            this.operationCheckpoints.clear();
            this.emit('checkpoints.cleared', undefined, totalCheckpoints);
        }
    }
    /**
     * Get checkpoints for a specific operation or all checkpoints
     */
    getCheckpoints(operationId) {
        if (operationId) {
            const checkpointIds = this.operationCheckpoints.get(operationId) || [];
            return checkpointIds
                .map(id => this.checkpoints.get(id))
                .filter(checkpoint => checkpoint !== undefined);
        }
        else {
            return Array.from(this.checkpoints.values());
        }
    }
    /**
     * Get a specific checkpoint by ID
     */
    getCheckpoint(checkpointId) {
        return this.checkpoints.get(checkpointId);
    }
    /**
     * Get the latest checkpoint for an operation
     */
    getLatestCheckpoint(operationId) {
        const checkpointIds = this.operationCheckpoints.get(operationId) || [];
        if (checkpointIds.length === 0) {
            return undefined;
        }
        const latestId = checkpointIds[checkpointIds.length - 1];
        return latestId ? this.checkpoints.get(latestId) : undefined;
    }
    /**
     * Get state manager statistics
     */
    getStats() {
        const totalCheckpoints = this.checkpoints.size;
        const totalOperations = this.operationCheckpoints.size;
        const checkpointsByOperation = {};
        for (const [operationId, checkpointIds] of this.operationCheckpoints) {
            checkpointsByOperation[operationId] = checkpointIds.length;
        }
        const memoryUsage = this._calculateMemoryUsage();
        return {
            totalCheckpoints,
            totalOperations,
            checkpointsByOperation,
            memoryUsage,
            maxCheckpoints: this.maxCheckpoints,
            compressionEnabled: this.compressionEnabled
        };
    }
    /**
     * Generate a unique checkpoint ID
     */
    _generateCheckpointId(operationId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${operationId}_${timestamp}_${random}`;
    }
    /**
     * Serialize state for storage
     */
    _serializeState(state) {
        try {
            // Deep clone to avoid reference issues
            const serialized = JSON.parse(JSON.stringify(state));
            if (this.compressionEnabled) {
                // In a real implementation, you might use compression here
                return this._compressState(serialized);
            }
            return serialized;
        }
        catch (error) {
            throw new Error(`Failed to serialize state: ${error.message}`);
        }
    }
    /**
     * Deserialize state from storage
     */
    _deserializeState(serializedState) {
        try {
            if (this.compressionEnabled) {
                return this._decompressState(serializedState);
            }
            return serializedState;
        }
        catch (error) {
            throw new Error(`Failed to deserialize state: ${error.message}`);
        }
    }
    /**
     * Restore state (placeholder for actual state restoration logic)
     */
    async _restoreState(state) {
        // In a real implementation, this would:
        // 1. Validate the state
        // 2. Apply the state to the application
        // 3. Verify the restoration was successful
        // For now, just return the state
        return state;
    }
    /**
     * Compress state (placeholder for actual compression)
     */
    _compressState(state) {
        // In a real implementation, you might use libraries like:
        // - pako for gzip compression
        // - lz-string for string compression
        return state;
    }
    /**
     * Decompress state (placeholder for actual decompression)
     */
    _decompressState(compressedState) {
        // Corresponding decompression logic
        return compressedState;
    }
    /**
     * Clean up old checkpoints to maintain memory limits
     */
    _cleanupOldCheckpoints() {
        if (this.checkpoints.size <= this.maxCheckpoints) {
            return;
        }
        // Sort checkpoints by timestamp (oldest first)
        const sortedCheckpoints = Array.from(this.checkpoints.entries())
            .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
        // Remove oldest checkpoints
        const toRemove = this.checkpoints.size - this.maxCheckpoints;
        for (let i = 0; i < toRemove; i++) {
            const entry = sortedCheckpoints[i];
            if (!entry)
                continue;
            const [checkpointId] = entry;
            this.checkpoints.delete(checkpointId);
            // Remove from operation tracking
            for (const [operationId, checkpointIds] of this.operationCheckpoints) {
                const index = checkpointIds.indexOf(checkpointId);
                if (index !== -1) {
                    checkpointIds.splice(index, 1);
                    if (checkpointIds.length === 0) {
                        this.operationCheckpoints.delete(operationId);
                    }
                    break;
                }
            }
        }
        this.emit('checkpoints.cleaned', toRemove);
    }
    /**
     * Calculate approximate memory usage
     */
    _calculateMemoryUsage() {
        let totalSize = 0;
        for (const checkpoint of this.checkpoints.values()) {
            // Rough estimation of memory usage
            totalSize += JSON.stringify(checkpoint).length * 2; // UTF-16 encoding
        }
        return totalSize;
    }
}
/**
 * Create a default state manager instance
 */
export function createStateManager(options) {
    return new StateManager(options);
}
/**
 * State manager utilities
 */
export const StateManagerUtils = {
    /**
     * Create a checkpoint with automatic cleanup
     */
    createAutoCleanupCheckpoint(stateManager, operationId, state, description, ttl = 3600000 // 1 hour default
    ) {
        const checkpoint = stateManager.createCheckpoint(operationId, state, description);
        // Schedule automatic cleanup
        setTimeout(() => {
            try {
                stateManager.clearCheckpoints(operationId);
            }
            catch (error) {
                // Ignore cleanup errors
            }
        }, ttl);
        return checkpoint;
    },
    /**
     * Create a checkpoint with validation
     */
    createValidatedCheckpoint(stateManager, operationId, state, description, validator) {
        if (validator && !validator(state)) {
            throw new Error('State validation failed - checkpoint not created');
        }
        return stateManager.createCheckpoint(operationId, state, description);
    }
};
//# sourceMappingURL=state-manager.js.map