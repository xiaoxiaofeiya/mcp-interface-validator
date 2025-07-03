/**
 * SQLite Database Implementation for Validation History
 *
 * SQLite-based storage for validation history entries
 */
import { EventEmitter } from 'events';
import { Logger } from '../../../utils/logger/index.js';
import type { ValidationHistoryEntry, HistoryQuery, HistoryQueryResult, HistoryStatistics, CleanupOptions, CleanupResult, DatabaseConfig } from '../types.js';
import type { IHistoryDatabase, DatabaseHealth } from './interface.js';
/**
 * SQLite database implementation
 */
export declare class SQLiteDatabase extends EventEmitter implements IHistoryDatabase {
    private db;
    private isInitialized;
    private readonly logger;
    private _config;
    constructor(logger?: Logger);
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
    backup(backupPath: string): Promise<void>;
    /**
     * Restore database from backup
     */
    restore(backupPath: string): Promise<void>;
    private importSQLite;
    private extractDatabasePath;
    private ensureDirectory;
    protected openDatabase(sqlite3: any, dbPath: string): Promise<any>;
    private createSchema;
    private createIndexes;
    private runMigrations;
    private beginTransaction;
    private run;
    private getRow;
    private getRows;
    private buildQuery;
    private buildWhereClause;
    private buildWhereParams;
    private mapRowToEntry;
    private ensureConnected;
}
//# sourceMappingURL=sqlite-database.d.ts.map