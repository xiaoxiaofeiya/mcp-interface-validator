/**
 * Validation History System
 *
 * Main entry point for the validation history system
 */
// Core classes
export { HistoryManager } from './history-manager';
export { QueryBuilder, createQuery, QueryPresets } from './query-builder';
export { ExportManager } from './export-manager';
export { CleanupManager, CleanupPresets, createCleanupManager } from './cleanup-manager';
// Database implementations
export { SQLiteDatabase } from './database/sqlite-database';
import { HistoryManager } from './history-manager';
/**
 * Default configuration for validation history system
 */
export const DEFAULT_HISTORY_CONFIG = {
    database: {
        type: 'sqlite',
        connectionString: 'sqlite:./data/validation-history.db',
        pool: {
            min: 1,
            max: 10,
            acquireTimeoutMillis: 30000,
            idleTimeoutMillis: 600000
        },
        migrations: {
            enabled: true,
            directory: './migrations'
        },
        backup: {
            enabled: false,
            schedule: 'daily',
            retention: 7
        }
    },
    storage: {
        maxEntries: 100000,
        retentionDays: 90,
        compression: true,
        indexOptimization: true
    },
    query: {
        defaultPageSize: 50,
        maxPageSize: 1000,
        timeout: 30000,
        cache: {
            enabled: true,
            ttl: 300000, // 5 minutes
            maxSize: 100
        }
    },
    export: {
        directory: './exports/validation-history',
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFormats: ['json', 'csv', 'xlsx', 'pdf']
    },
    cleanup: {
        enabled: true,
        schedule: 'daily',
        defaultRetention: 90
    }
};
/**
 * Create a history manager with default configuration
 */
export function createHistoryManager(config) {
    return createValidationHistorySystem(config);
}
/**
 * Create a validation history system with default configuration
 */
export function createValidationHistorySystem(config) {
    const finalConfig = {
        ...DEFAULT_HISTORY_CONFIG,
        ...config,
        database: {
            ...DEFAULT_HISTORY_CONFIG.database,
            ...config?.database
        },
        storage: {
            ...DEFAULT_HISTORY_CONFIG.storage,
            ...config?.storage
        },
        query: {
            ...DEFAULT_HISTORY_CONFIG.query,
            ...config?.query,
            cache: {
                ...DEFAULT_HISTORY_CONFIG.query.cache,
                ...config?.query?.cache
            }
        },
        export: {
            ...DEFAULT_HISTORY_CONFIG.export,
            ...config?.export
        },
        cleanup: {
            ...DEFAULT_HISTORY_CONFIG.cleanup,
            ...config?.cleanup
        }
    };
    return new HistoryManager(finalConfig);
}
/**
 * Configuration presets for different environments
 */
export class HistoryConfigPresets {
    /**
     * Development configuration
     */
    static development() {
        return {
            database: {
                type: 'sqlite',
                connectionString: 'sqlite:./dev-data/validation-history.db'
            },
            storage: {
                maxEntries: 10000,
                retentionDays: 30,
                compression: false,
                indexOptimization: false
            },
            cleanup: {
                enabled: true,
                schedule: 'daily',
                defaultRetention: 7
            }
        };
    }
    /**
     * Testing configuration
     */
    static testing() {
        return {
            database: {
                type: 'sqlite',
                connectionString: 'sqlite::memory:'
            },
            storage: {
                maxEntries: 1000,
                retentionDays: 1,
                compression: false,
                indexOptimization: false
            },
            cleanup: {
                enabled: false,
                schedule: 'daily',
                defaultRetention: 1
            }
        };
    }
    /**
     * Production configuration
     */
    static production() {
        return {
            database: {
                type: 'sqlite',
                connectionString: 'sqlite:./data/validation-history.db',
                backup: {
                    enabled: true,
                    schedule: 'daily',
                    retention: 30
                }
            },
            storage: {
                maxEntries: 1000000,
                retentionDays: 365,
                compression: true,
                indexOptimization: true
            },
            query: {
                defaultPageSize: 50,
                maxPageSize: 500,
                timeout: 60000,
                cache: {
                    enabled: true,
                    ttl: 600000, // 10 minutes
                    maxSize: 500
                }
            },
            cleanup: {
                enabled: true,
                schedule: 'daily',
                defaultRetention: 90
            }
        };
    }
    /**
     * High-performance configuration
     */
    static highPerformance() {
        return {
            database: {
                type: 'sqlite',
                connectionString: 'sqlite:./data/validation-history.db',
                pool: {
                    min: 5,
                    max: 20,
                    acquireTimeoutMillis: 10000,
                    idleTimeoutMillis: 300000
                }
            },
            storage: {
                maxEntries: 500000,
                retentionDays: 180,
                compression: true,
                indexOptimization: true
            },
            query: {
                defaultPageSize: 100,
                maxPageSize: 2000,
                timeout: 15000,
                cache: {
                    enabled: true,
                    ttl: 180000, // 3 minutes
                    maxSize: 1000
                }
            },
            cleanup: {
                enabled: true,
                schedule: '6h', // Every 6 hours
                defaultRetention: 60
            }
        };
    }
    /**
     * Minimal configuration for embedded use
     */
    static minimal() {
        return {
            database: {
                type: 'sqlite',
                connectionString: 'sqlite:./validation-history.db'
            },
            storage: {
                maxEntries: 5000,
                retentionDays: 14,
                compression: false,
                indexOptimization: false
            },
            query: {
                defaultPageSize: 25,
                maxPageSize: 100,
                timeout: 10000,
                cache: {
                    enabled: false,
                    ttl: 0,
                    maxSize: 0
                }
            },
            export: {
                directory: './exports',
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowedFormats: ['json', 'csv']
            },
            cleanup: {
                enabled: true,
                schedule: 'weekly',
                defaultRetention: 7
            }
        };
    }
}
/**
 * Utility functions for validation history
 */
export class HistoryUtils {
    /**
     * Create validation context for manual validation
     */
    static createManualContext(_userId, sessionId, metadata) {
        return {
            trigger: 'manual',
            environment: 'development',
            ...(sessionId && { sessionId }),
            metadata: metadata || {}
        };
    }
    /**
     * Create validation context for automatic validation
     */
    static createAutoContext(integration, environment = 'development', metadata) {
        return {
            trigger: 'auto',
            environment,
            integration: integration,
            metadata: metadata || {}
        };
    }
    /**
     * Create validation context for file change validation
     */
    static createFileChangeContext(filePath, integration, metadata) {
        return {
            trigger: 'file-change',
            environment: 'development',
            integration: integration,
            metadata: {
                filePath,
                ...metadata
            }
        };
    }
    /**
     * Create validation context for API call validation
     */
    static createApiContext(apiEndpoint, userId, metadata) {
        return {
            trigger: 'api-call',
            environment: 'production',
            metadata: {
                apiEndpoint,
                userId,
                ...metadata
            }
        };
    }
    /**
     * Create basic validation metrics
     */
    static createBasicMetrics(duration) {
        return {
            duration,
            schemaDuration: Math.floor(duration * 0.3),
            analysisDuration: Math.floor(duration * 0.7),
            memoryUsage: 0,
            cpuUsage: 0,
            rulesApplied: 0,
            cacheHitRatio: 0
        };
    }
    /**
     * Create detailed validation metrics
     */
    static createDetailedMetrics(duration, schemaDuration, analysisDuration, memoryUsage, cpuUsage, rulesApplied, cacheHitRatio) {
        return {
            duration,
            schemaDuration,
            analysisDuration,
            memoryUsage,
            cpuUsage,
            rulesApplied,
            cacheHitRatio
        };
    }
    /**
     * Format file size for display
     */
    static formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    /**
     * Format duration for display
     */
    static formatDuration(milliseconds) {
        if (milliseconds < 1000) {
            return `${milliseconds}ms`;
        }
        else if (milliseconds < 60000) {
            return `${(milliseconds / 1000).toFixed(1)}s`;
        }
        else {
            const minutes = Math.floor(milliseconds / 60000);
            const seconds = Math.floor((milliseconds % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
    }
    /**
     * Calculate success rate from statistics
     */
    static calculateSuccessRate(stats) {
        const total = stats.statusBreakdown.passed + stats.statusBreakdown.failed;
        return total > 0 ? (stats.statusBreakdown.passed / total) * 100 : 0;
    }
}
//# sourceMappingURL=index.js.map