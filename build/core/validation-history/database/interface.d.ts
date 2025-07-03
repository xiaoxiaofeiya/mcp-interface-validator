/**
 * Database Interface for Validation History
 *
 * Abstract interface for different database implementations
 */
import type { ValidationHistoryEntry, HistoryQuery, HistoryQueryResult, HistoryStatistics, CleanupOptions, CleanupResult, DatabaseConfig } from '../types';
/**
 * Database interface for validation history storage
 */
export interface IHistoryDatabase {
    /**
     * Initialize the database connection and schema
     */
    initialize(config: DatabaseConfig): Promise<void>;
    /**
     * Close the database connection
     */
    close(): Promise<void>;
    /**
     * Check if database is connected
     */
    isConnected(): boolean;
    /**
     * Store a validation history entry
     */
    store(entry: ValidationHistoryEntry): Promise<void>;
    /**
     * Store multiple validation history entries
     */
    storeBatch(entries: ValidationHistoryEntry[]): Promise<void>;
    /**
     * Retrieve a validation history entry by ID
     */
    get(id: string): Promise<ValidationHistoryEntry | null>;
    /**
     * Query validation history with filters
     */
    query(query: HistoryQuery): Promise<HistoryQueryResult>;
    /**
     * Get validation history statistics
     */
    getStatistics(specId?: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<HistoryStatistics>;
    /**
     * Delete validation history entries
     */
    delete(ids: string[]): Promise<number>;
    /**
     * Clean up old validation history entries
     */
    cleanup(options: CleanupOptions): Promise<CleanupResult>;
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
}
/**
 * Database health status
 */
export interface DatabaseHealth {
    /** Connection status */
    connected: boolean;
    /** Response time (ms) */
    responseTime: number;
    /** Database size (bytes) */
    size: number;
    /** Number of entries */
    entryCount: number;
    /** Index status */
    indexes: Array<{
        name: string;
        size: number;
        efficiency: number;
    }>;
    /** Performance metrics */
    performance: {
        avgQueryTime: number;
        slowQueries: number;
        cacheHitRatio: number;
    };
    /** Storage metrics */
    storage: {
        totalSize: number;
        usedSize: number;
        freeSize: number;
        fragmentation: number;
    };
}
/**
 * Database transaction interface
 */
export interface ITransaction {
    /**
     * Commit the transaction
     */
    commit(): Promise<void>;
    /**
     * Rollback the transaction
     */
    rollback(): Promise<void>;
    /**
     * Store entry within transaction
     */
    store(entry: ValidationHistoryEntry): Promise<void>;
    /**
     * Delete entries within transaction
     */
    delete(ids: string[]): Promise<number>;
}
/**
 * Database migration interface
 */
export interface IMigration {
    /**
     * Migration version
     */
    version: string;
    /**
     * Migration description
     */
    description: string;
    /**
     * Apply migration
     */
    up(db: IHistoryDatabase): Promise<void>;
    /**
     * Revert migration
     */
    down(db: IHistoryDatabase): Promise<void>;
}
/**
 * Query builder interface
 */
export interface IQueryBuilder {
    /**
     * Add WHERE condition
     */
    where(field: string, operator: string, value: any): IQueryBuilder;
    /**
     * Add AND condition
     */
    and(field: string, operator: string, value: any): IQueryBuilder;
    /**
     * Add OR condition
     */
    or(field: string, operator: string, value: any): IQueryBuilder;
    /**
     * Add ORDER BY clause
     */
    orderBy(field: string, direction: 'asc' | 'desc'): IQueryBuilder;
    /**
     * Add LIMIT clause
     */
    limit(count: number): IQueryBuilder;
    /**
     * Add OFFSET clause
     */
    offset(count: number): IQueryBuilder;
    /**
     * Execute query
     */
    execute(): Promise<ValidationHistoryEntry[]>;
    /**
     * Count matching records
     */
    count(): Promise<number>;
}
/**
 * Database factory interface
 */
export interface IDatabaseFactory {
    /**
     * Create database instance
     */
    create(config: DatabaseConfig): IHistoryDatabase;
    /**
     * Get supported database types
     */
    getSupportedTypes(): string[];
    /**
     * Validate database configuration
     */
    validateConfig(config: DatabaseConfig): Promise<boolean>;
}
/**
 * Database events
 */
export interface DatabaseEvents {
    /** Connection established */
    'connected': () => void;
    /** Connection lost */
    'disconnected': (error?: Error) => void;
    /** Entry stored */
    'entry.stored': (entry: ValidationHistoryEntry) => void;
    /** Entry deleted */
    'entry.deleted': (id: string) => void;
    /** Query executed */
    'query.executed': (query: HistoryQuery, duration: number) => void;
    /** Error occurred */
    'error': (error: Error) => void;
    /** Cleanup completed */
    'cleanup.completed': (result: CleanupResult) => void;
    /** Backup created */
    'backup.created': (path: string) => void;
}
/**
 * Database connection options
 */
export interface ConnectionOptions {
    /** Connection timeout (ms) */
    timeout: number;
    /** Retry attempts */
    retryAttempts: number;
    /** Retry delay (ms) */
    retryDelay: number;
    /** Keep alive */
    keepAlive: boolean;
    /** SSL configuration */
    ssl?: {
        enabled: boolean;
        cert?: string;
        key?: string;
        ca?: string;
    };
}
/**
 * Index configuration
 */
export interface IndexConfig {
    /** Index name */
    name: string;
    /** Fields to index */
    fields: string[];
    /** Index type */
    type: 'btree' | 'hash' | 'gin' | 'gist';
    /** Unique constraint */
    unique: boolean;
    /** Partial index condition */
    where?: string;
}
/**
 * Schema configuration
 */
export interface SchemaConfig {
    /** Table/collection name */
    tableName: string;
    /** Indexes to create */
    indexes: IndexConfig[];
    /** Constraints */
    constraints: Array<{
        name: string;
        type: 'primary' | 'foreign' | 'unique' | 'check';
        definition: string;
    }>;
    /** Partitioning */
    partitioning?: {
        enabled: boolean;
        strategy: 'range' | 'hash' | 'list';
        field: string;
        partitions: number;
    };
}
//# sourceMappingURL=interface.d.ts.map