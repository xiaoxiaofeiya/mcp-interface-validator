/**
 * Validation History System
 *
 * Main entry point for the validation history system
 */
export { HistoryManager } from './history-manager';
export { QueryBuilder, createQuery, QueryPresets } from './query-builder';
export { ExportManager } from './export-manager';
export { CleanupManager, CleanupPresets, createCleanupManager } from './cleanup-manager';
export { SQLiteDatabase } from './database/sqlite-database';
export type { IHistoryDatabase, DatabaseHealth, ITransaction, IQueryBuilder, DatabaseEvents, ConnectionOptions, IndexConfig, SchemaConfig } from './database/interface';
export type { ValidationHistoryEntry, ValidationContext, ValidationMetrics, HistoryQuery, HistoryQueryResult, HistoryStatistics, ExportOptions, ExportResult, CleanupOptions, CleanupResult, DatabaseConfig, HistoryConfig } from './types';
import type { HistoryConfig, ValidationContext, ValidationMetrics, HistoryStatistics } from './types';
import { HistoryManager } from './history-manager';
export type { ValidationTrend, HistoryManagerEvents } from './history-manager';
export type { CleanupStats, CleanupEstimate, CleanupEvents } from './cleanup-manager';
/**
 * Default configuration for validation history system
 */
export declare const DEFAULT_HISTORY_CONFIG: HistoryConfig;
/**
 * Create a history manager with default configuration
 */
export declare function createHistoryManager(config?: Partial<HistoryConfig>): HistoryManager;
/**
 * Create a validation history system with default configuration
 */
export declare function createValidationHistorySystem(config?: Partial<HistoryConfig>): HistoryManager;
/**
 * Configuration presets for different environments
 */
export declare class HistoryConfigPresets {
    /**
     * Development configuration
     */
    static development(): Partial<HistoryConfig>;
    /**
     * Testing configuration
     */
    static testing(): Partial<HistoryConfig>;
    /**
     * Production configuration
     */
    static production(): Partial<HistoryConfig>;
    /**
     * High-performance configuration
     */
    static highPerformance(): Partial<HistoryConfig>;
    /**
     * Minimal configuration for embedded use
     */
    static minimal(): Partial<HistoryConfig>;
}
/**
 * Utility functions for validation history
 */
export declare class HistoryUtils {
    /**
     * Create validation context for manual validation
     */
    static createManualContext(_userId?: string, sessionId?: string, metadata?: Record<string, any>): ValidationContext;
    /**
     * Create validation context for automatic validation
     */
    static createAutoContext(integration?: string, environment?: 'development' | 'staging' | 'production', metadata?: Record<string, any>): ValidationContext;
    /**
     * Create validation context for file change validation
     */
    static createFileChangeContext(filePath: string, integration?: string, metadata?: Record<string, any>): ValidationContext;
    /**
     * Create validation context for API call validation
     */
    static createApiContext(apiEndpoint: string, userId?: string, metadata?: Record<string, any>): ValidationContext;
    /**
     * Create basic validation metrics
     */
    static createBasicMetrics(duration: number): ValidationMetrics;
    /**
     * Create detailed validation metrics
     */
    static createDetailedMetrics(duration: number, schemaDuration: number, analysisDuration: number, memoryUsage: number, cpuUsage: number, rulesApplied: number, cacheHitRatio: number): ValidationMetrics;
    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string;
    /**
     * Format duration for display
     */
    static formatDuration(milliseconds: number): string;
    /**
     * Calculate success rate from statistics
     */
    static calculateSuccessRate(stats: HistoryStatistics): number;
}
//# sourceMappingURL=index.d.ts.map