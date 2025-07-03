/**
 * History Manager for Validation History
 *
 * Main manager class that coordinates all validation history operations
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index.js';
import { QueryBuilder } from './query-builder.js';
import type { ValidationHistoryEntry, HistoryQuery, HistoryQueryResult, HistoryStatistics, HistoryConfig, ValidationContext, ValidationMetrics, ExportOptions, ExportResult, CleanupOptions, CleanupResult } from './types.js';
import type { ValidationResult } from '../validation/index.js';
import type { IHistoryDatabase, DatabaseHealth } from './database/interface.js';
/**
 * Main history manager class
 */
export declare class HistoryManager extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly database;
    private readonly exportManager;
    private readonly cleanupManager;
    private isInitialized;
    constructor(config: HistoryConfig, logger?: Logger, database?: IHistoryDatabase);
    /**
     * Initialize the history manager
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the history manager
     */
    shutdown(): Promise<void>;
    /**
     * Record a validation result
     */
    recordValidation(specId: string, result: ValidationResult, sourceCode: string, validationType: 'frontend' | 'backend' | 'both', context: ValidationContext, metrics: ValidationMetrics, filePath?: string, userId?: string): Promise<string>;
    /**
     * Record multiple validations in batch
     */
    recordValidationBatch(entries: Omit<ValidationHistoryEntry, 'id' | 'timestamp'>[]): Promise<string[]>;
    /**
     * Get a validation history entry by ID
     */
    getValidation(id: string): Promise<ValidationHistoryEntry | null>;
    /**
     * Query validation history
     */
    queryValidations(query: HistoryQuery): Promise<HistoryQueryResult>;
    /**
     * Create a new query builder
     */
    createQuery(): QueryBuilder;
    /**
     * Get validation history statistics
     */
    getStatistics(specId?: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<HistoryStatistics>;
    /**
     * Export validation history
     */
    exportHistory(options: ExportOptions): Promise<ExportResult>;
    /**
     * Export validation history (alias for exportHistory)
     */
    export(options: ExportOptions): Promise<ExportResult>;
    /**
     * Clean up old validation history entries
     */
    cleanup(options?: Partial<CleanupOptions>): Promise<CleanupResult>;
    /**
     * Get cleanup statistics
     */
    getCleanupStats(): Promise<import("./cleanup-manager.js").CleanupStats>;
    /**
     * Delete specific validation entries
     */
    deleteValidations(ids: string[]): Promise<number>;
    /**
     * Get database health status
     */
    getHealth(): Promise<DatabaseHealth>;
    /**
     * Optimize database performance
     */
    optimize(): Promise<void>;
    /**
     * Create database backup
     */
    backup(path: string): Promise<void>;
    /**
     * Restore database from backup
     */
    restore(path: string): Promise<void>;
    /**
     * Get recent validations for a specification
     */
    getRecentValidations(specId: string, limit?: number): Promise<ValidationHistoryEntry[]>;
    /**
     * Get failed validations for debugging
     */
    getFailedValidations(days?: number, limit?: number): Promise<ValidationHistoryEntry[]>;
    /**
     * Get validation trends
     */
    getValidationTrends(days?: number): Promise<ValidationTrend[]>;
    /**
     * Check if history manager is initialized
     */
    isReady(): boolean;
    private createDatabase;
    private setupEventForwarding;
    private generateEntryId;
    private ensureInitialized;
}
/**
 * Validation trend interface
 */
export interface ValidationTrend {
    /** Date (YYYY-MM-DD format) */
    date: string;
    /** Total number of validations */
    totalValidations: number;
    /** Number of passed validations */
    passedValidations: number;
    /** Number of failed validations */
    failedValidations: number;
    /** Average validation duration */
    averageDuration: number;
    /** Total duration (internal) */
    totalDuration: number;
}
/**
 * History manager events
 */
export interface HistoryManagerEvents {
    /** Manager initialized */
    'initialized': () => void;
    /** Manager shut down */
    'shutdown': () => void;
    /** Validation recorded */
    'validation.recorded': (entry: ValidationHistoryEntry) => void;
    /** Validation batch recorded */
    'validation.batch.recorded': (entries: ValidationHistoryEntry[]) => void;
    /** Validations deleted */
    'validation.deleted': (ids: string[]) => void;
    /** Database connected */
    'database.connected': () => void;
    /** Database disconnected */
    'database.disconnected': () => void;
    /** Database error */
    'database.error': (error: Error) => void;
    /** Cleanup completed */
    'cleanup.completed': (result: CleanupResult) => void;
    /** Cleanup error */
    'cleanup.error': (error: Error) => void;
}
/**
 * Create history manager with default configuration
 */
export declare function createHistoryManager(config: HistoryConfig, logger?: Logger): HistoryManager;
//# sourceMappingURL=history-manager.d.ts.map