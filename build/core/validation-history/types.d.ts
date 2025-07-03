/**
 * Validation History System Types
 *
 * Type definitions for validation history tracking and query system
 */
import type { ValidationResult } from '../validation/index.js';
/**
 * Validation history entry
 */
export interface ValidationHistoryEntry {
    /** Unique entry ID */
    id: string;
    /** Specification ID */
    specId: string;
    /** Validation timestamp */
    timestamp: Date;
    /** Validation result */
    result: ValidationResult;
    /** Source code that was validated */
    sourceCode: string;
    /** Validation type */
    validationType: 'frontend' | 'backend' | 'both';
    /** File path that was validated */
    filePath?: string;
    /** User who triggered validation */
    userId?: string;
    /** Validation context */
    context: ValidationContext;
    /** Performance metrics */
    metrics: ValidationMetrics;
}
/**
 * Validation context information
 */
export interface ValidationContext {
    /** Validation trigger */
    trigger: 'manual' | 'auto' | 'file-change' | 'api-call';
    /** Environment */
    environment: 'development' | 'staging' | 'production';
    /** Tool integration */
    integration?: 'cursor' | 'windsurf' | 'augment' | 'trae';
    /** Session ID */
    sessionId?: string;
    /** Additional metadata */
    metadata: Record<string, any>;
}
/**
 * Validation performance metrics
 */
export interface ValidationMetrics {
    /** Total validation duration (ms) */
    duration: number;
    /** Schema validation duration (ms) */
    schemaDuration: number;
    /** Code analysis duration (ms) */
    analysisDuration: number;
    /** Memory usage (bytes) */
    memoryUsage: number;
    /** CPU usage percentage */
    cpuUsage: number;
    /** Number of rules applied */
    rulesApplied: number;
    /** Cache hit ratio */
    cacheHitRatio: number;
}
/**
 * History query parameters
 */
export interface HistoryQuery {
    /** Specification ID filter */
    specId?: string;
    /** Date range filter */
    dateRange?: {
        start: Date;
        end: Date;
    };
    /** Validation type filter */
    validationType?: 'frontend' | 'backend' | 'both';
    /** Result status filter */
    status?: 'passed' | 'failed' | 'warning';
    /** User filter */
    userId?: string;
    /** Integration filter */
    integration?: string;
    /** Environment filter */
    environment?: string;
    /** Pagination */
    pagination?: {
        offset: number;
        limit: number;
    };
    /** Sorting */
    sort?: {
        field: keyof ValidationHistoryEntry;
        order: 'asc' | 'desc';
    };
    /** Search text */
    search?: string;
}
/**
 * History query result
 */
export interface HistoryQueryResult {
    /** Matching entries */
    entries: ValidationHistoryEntry[];
    /** Total count (before pagination) */
    totalCount: number;
    /** Query metadata */
    metadata: {
        query: HistoryQuery;
        executionTime: number;
        cacheHit: boolean;
    };
}
/**
 * History statistics
 */
export interface HistoryStatistics {
    /** Total entries count */
    totalEntries: number;
    /** Entries by status */
    statusBreakdown: {
        passed: number;
        failed: number;
        warning: number;
    };
    /** Entries by type */
    typeBreakdown: {
        frontend: number;
        backend: number;
        both: number;
    };
    /** Entries by integration */
    integrationBreakdown: Record<string, number>;
    /** Average validation duration */
    averageDuration: number;
    /** Most common errors */
    commonErrors: Array<{
        code: string;
        count: number;
        percentage: number;
    }>;
    /** Validation trends */
    trends: {
        daily: Array<{
            date: string;
            count: number;
            successRate: number;
        }>;
        weekly: Array<{
            week: string;
            count: number;
            successRate: number;
        }>;
    };
}
/**
 * Export format options
 */
export interface ExportOptions {
    /** Export format */
    format: 'json' | 'csv' | 'xlsx' | 'pdf';
    /** Include source code */
    includeSourceCode: boolean;
    /** Include detailed metrics */
    includeMetrics: boolean;
    /** Date range */
    dateRange?: {
        start: Date;
        end: Date;
    };
    /** Filters */
    filters?: Partial<HistoryQuery>;
    /** Query filters */
    query?: Partial<HistoryQuery>;
    /** Compression */
    compress: boolean;
    /** Custom filename */
    filename?: string;
    /** Maximum file size in bytes */
    maxFileSize?: number;
    /** Export directory */
    exportDirectory?: string;
    /** Maximum number of records to export */
    maxRecords?: number;
}
/**
 * Export result
 */
export interface ExportResult {
    /** Export success status */
    success: boolean;
    /** Export file path */
    filePath: string;
    /** Export format */
    format: string;
    /** Number of entries exported */
    entryCount: number;
    /** Record count (alias for entryCount) */
    recordCount: number;
    /** File size (bytes) */
    fileSize: number;
    /** Export duration (ms) */
    duration: number;
    /** Whether file is compressed */
    compressed?: boolean;
    /** Error message if failed */
    error?: string;
    /** Export metadata */
    metadata: {
        exportedAt: Date;
        totalRecords: number;
        exportDuration: number;
        query: HistoryQuery;
        options: ExportOptions;
        queryMetadata?: {
            executionTime: number;
            cacheHit: boolean;
        };
    };
}
/**
 * Cleanup options
 */
export interface CleanupOptions {
    /** Retention period (days) */
    retentionDays: number;
    /** Keep successful validations */
    keepSuccessful: boolean;
    /** Keep failed validations */
    keepFailed: boolean;
    /** Batch size for cleanup */
    batchSize: number;
    /** Dry run mode */
    dryRun: boolean;
}
/**
 * Cleanup result
 */
export interface CleanupResult {
    /** Number of entries removed */
    removedCount: number;
    /** Number of entries kept */
    keptCount: number;
    /** Cleanup duration (ms) */
    duration: number;
    /** Space freed (bytes) */
    spaceFreed: number;
    /** Cleanup metadata */
    metadata: {
        timestamp: Date;
        options: CleanupOptions;
        dryRun: boolean;
    };
}
/**
 * Database configuration
 */
export interface DatabaseConfig {
    /** Database type */
    type: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';
    /** Connection string */
    connectionString: string;
    /** Connection pool settings */
    pool?: {
        min: number;
        max: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
    };
    /** Migration settings */
    migrations?: {
        enabled: boolean;
        directory: string;
    };
    /** Backup settings */
    backup?: {
        enabled: boolean;
        schedule: string;
        retention: number;
    };
}
/**
 * History system configuration
 */
export interface HistoryConfig {
    /** Database configuration */
    database: DatabaseConfig;
    /** Storage settings */
    storage: {
        /** Maximum entries to keep */
        maxEntries: number;
        /** Retention period (days) */
        retentionDays: number;
        /** Compression enabled */
        compression: boolean;
        /** Index optimization */
        indexOptimization: boolean;
    };
    /** Query settings */
    query: {
        /** Default page size */
        defaultPageSize: number;
        /** Maximum page size */
        maxPageSize: number;
        /** Query timeout (ms) */
        timeout: number;
        /** Cache settings */
        cache: {
            enabled: boolean;
            ttl: number;
            maxSize: number;
        };
    };
    /** Export settings */
    export: {
        /** Export directory */
        directory: string;
        /** Maximum file size (bytes) */
        maxFileSize: number;
        /** Allowed formats */
        allowedFormats: string[];
    };
    /** Cleanup settings */
    cleanup: {
        /** Auto cleanup enabled */
        enabled: boolean;
        /** Cleanup schedule */
        schedule: string;
        /** Default retention (days) */
        defaultRetention: number;
    };
}
//# sourceMappingURL=types.d.ts.map