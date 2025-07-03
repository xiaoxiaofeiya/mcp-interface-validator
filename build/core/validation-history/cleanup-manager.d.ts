/**
 * Cleanup Manager for Validation History
 *
 * Handles automated cleanup of old validation history entries
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index';
import type { CleanupOptions, CleanupResult, HistoryConfig } from './types';
import type { IHistoryDatabase } from './database/interface';
/**
 * Cleanup manager for validation history
 */
export declare class CleanupManager extends EventEmitter {
    private readonly logger;
    private readonly database;
    private readonly _config;
    private cleanupTimer?;
    private cleanupInProgress;
    constructor(database: IHistoryDatabase, config: HistoryConfig, logger?: Logger);
    /**
     * Start automatic cleanup scheduler
     */
    start(scheduleConfig?: {
        schedule: string;
        retentionDays: number;
    }): void;
    /**
     * Stop automatic cleanup scheduler
     */
    stop(): void;
    /**
     * Run cleanup with custom options
     */
    cleanup(options?: Partial<CleanupOptions>): Promise<CleanupResult>;
    /**
     * Run dry-run cleanup to see what would be removed
     */
    dryRun(options?: Partial<CleanupOptions>): Promise<CleanupResult>;
    /**
     * Clean up entries older than specified days
     */
    cleanupOlderThan(days: number, options?: Partial<CleanupOptions>): Promise<CleanupResult>;
    /**
     * Clean up failed validations only
     */
    cleanupFailedOnly(days: number, options?: Partial<CleanupOptions>): Promise<CleanupResult>;
    /**
     * Clean up successful validations only
     */
    cleanupSuccessfulOnly(days: number, options?: Partial<CleanupOptions>): Promise<CleanupResult>;
    /**
     * Get cleanup statistics
     */
    getCleanupStats(): Promise<CleanupStats>;
    /**
     * Estimate cleanup impact
     */
    estimateCleanup(options: Partial<CleanupOptions>): Promise<CleanupEstimate>;
    estimateCleanup(retentionDays: number): Promise<CleanupEstimate>;
    /**
     * Check if cleanup is currently running
     */
    isCleanupRunning(): boolean;
    /**
     * Check if scheduled cleanup is running
     */
    isRunning(): boolean;
    /**
     * Validate schedule format
     */
    private isValidSchedule;
    /**
     * Parse schedule string to interval in milliseconds
     */
    private parseSchedule;
    /**
     * Get cleanup statistics
     */
    getStats(): Promise<{
        totalEntries: number;
        estimatedCleanupSize: number;
        performance: {
            averageCleanupTime: number;
            lastCleanupDuration: number;
            totalCleanupsPerformed: number;
        };
    }>;
    /**
     * Validate cleanup options
     */
    validateOptions(options: CleanupOptions): void;
    /**
     * Get next scheduled cleanup time
     */
    getNextScheduledTime(): Date | null;
    private runScheduledCleanup;
    private buildCleanupOptions;
}
/**
 * Cleanup statistics interface
 */
export interface CleanupStats {
    /** Total number of entries */
    totalEntries: number;
    /** Entries breakdown by age */
    entriesByAge: {
        last24Hours: number;
        lastWeek: number;
        lastMonth: number;
        older: number;
    };
    /** Estimated cleanup impact for different retention periods */
    estimatedCleanup: {
        defaultRetention: CleanupEstimate;
        oneWeek: CleanupEstimate;
        oneMonth: CleanupEstimate;
        threeMonths: CleanupEstimate;
    };
    /** Last cleanup timestamp */
    lastCleanup: Date | null;
    /** Next scheduled cleanup */
    nextScheduledCleanup: Date | null;
    /** Whether cleanup is currently running */
    isRunning: boolean;
}
/**
 * Cleanup estimate interface
 */
export interface CleanupEstimate {
    /** Retention period in days */
    retentionDays: number;
    /** Number of entries that would be affected */
    entriesAffected: number;
    /** Number of entries that would be removed */
    estimatedRemovals: number;
    /** Estimated space that would be freed (bytes) */
    estimatedSpaceFreed: number;
    /** Estimated duration in milliseconds */
    estimatedDuration: number;
    /** Percentage of total entries */
    percentage: number;
    /** Breakdown by different criteria */
    breakdown: {
        byAge: {
            [key: string]: number;
        };
        byStatus: {
            [key: string]: number;
        };
        byType: {
            [key: string]: number;
        };
    };
}
/**
 * Cleanup events interface
 */
export interface CleanupEvents {
    /** Cleanup manager started */
    'started': () => void;
    /** Cleanup manager stopped */
    'stopped': () => void;
    /** Cleanup operation started */
    'cleanup.started': () => void;
    /** Cleanup operation completed */
    'cleanup.completed': (result: CleanupResult) => void;
    /** Error occurred */
    'error': (error: Error) => void;
}
/**
 * Create cleanup manager with default configuration
 */
export declare function createCleanupManager(database: IHistoryDatabase, config: HistoryConfig, logger?: Logger): CleanupManager;
/**
 * Cleanup presets for common scenarios
 */
export declare class CleanupPresets {
    /**
     * Conservative cleanup - keep everything for 90 days
     */
    static conservative(): CleanupOptions;
    /**
     * Moderate cleanup - keep for 30 days
     */
    static moderate(): Partial<CleanupOptions>;
    /**
     * Aggressive cleanup - keep for 7 days
     */
    static aggressive(): CleanupOptions;
    /**
     * Development cleanup - keep only failures for debugging
     */
    static development(): CleanupOptions;
    /**
     * Balanced cleanup - moderate retention
     */
    static balanced(): CleanupOptions;
    /**
     * Testing cleanup - minimal retention
     */
    static testing(): CleanupOptions;
    /**
     * Production cleanup - long retention
     */
    static production(): CleanupOptions;
}
//# sourceMappingURL=cleanup-manager.d.ts.map