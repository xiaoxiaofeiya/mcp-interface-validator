/**
 * History Manager for Validation History
 * 
 * Main manager class that coordinates all validation history operations
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { Logger } from '../../utils/logger/index';
import { SQLiteDatabase } from './database/sqlite-database';
import { ExportManager } from './export-manager';
import { CleanupManager } from './cleanup-manager';
import { QueryBuilder } from './query-builder';
import type {
  ValidationHistoryEntry,
  HistoryQuery,
  HistoryQueryResult,
  HistoryStatistics,
  HistoryConfig,
  ValidationContext,
  ValidationMetrics,
  ExportOptions,
  ExportResult,
  CleanupOptions,
  CleanupResult
} from './types';
import type { ValidationResult } from '../validation/index';
import type { IHistoryDatabase, DatabaseHealth } from './database/interface';

/**
 * Main history manager class
 */
export class HistoryManager extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: HistoryConfig;
  private readonly database: IHistoryDatabase;
  private readonly exportManager: ExportManager;
  private readonly cleanupManager: CleanupManager;
  private isInitialized = false;

  constructor(config: HistoryConfig, logger?: Logger, database?: IHistoryDatabase) {
    super();
    this.config = config;
    this.logger = logger || {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    } as Logger;

    // Initialize database based on configuration or use provided instance
    this.database = database || this.createDatabase();

    // Initialize managers
    this.exportManager = new ExportManager(this.database, this.logger);
    this.cleanupManager = new CleanupManager(this.database, this.config, this.logger);

    // Forward events
    this.setupEventForwarding();
  }

  /**
   * Initialize the history manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing validation history manager');
      
      // Initialize database
      await this.database.initialize(this.config.database);
      
      // Start cleanup manager if enabled
      if (this.config.cleanup.enabled) {
        this.cleanupManager.start();
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      this.logger.info('Validation history manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize validation history manager:', error);
      throw error;
    }
  }

  /**
   * Shutdown the history manager
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Shutting down validation history manager');
      
      // Stop cleanup manager
      this.cleanupManager.stop();
      
      // Close database connection
      await this.database.close();
      
      this.isInitialized = false;
      this.emit('shutdown');
      
      this.logger.info('Validation history manager shut down successfully');
    } catch (error) {
      this.logger.error('Error during history manager shutdown:', error);
      throw error;
    }
  }

  /**
   * Record a validation result
   */
  async recordValidation(
    specId: string,
    result: ValidationResult,
    sourceCode: string,
    validationType: 'frontend' | 'backend' | 'both',
    context: ValidationContext,
    metrics: ValidationMetrics,
    filePath?: string,
    userId?: string
  ): Promise<string> {
    this.ensureInitialized();

    try {
      const entry: ValidationHistoryEntry = {
        id: this.generateEntryId(),
        specId,
        timestamp: new Date(),
        result,
        sourceCode,
        validationType,
        filePath: filePath || '',
        userId: userId || '',
        context,
        metrics
      };

      await this.database.store(entry);
      
      this.emit('validation.recorded', entry);
      
      this.logger.debug(`Recorded validation history entry: ${entry.id}`, {
        specId,
        isValid: result.isValid,
        validationType,
        duration: metrics.duration
      });

      return entry.id;
    } catch (error) {
      this.logger.error('Failed to record validation:', error);
      throw error;
    }
  }

  /**
   * Record multiple validations in batch
   */
  async recordValidationBatch(entries: Omit<ValidationHistoryEntry, 'id' | 'timestamp'>[]): Promise<string[]> {
    this.ensureInitialized();

    try {
      const historyEntries: ValidationHistoryEntry[] = entries.map(entry => ({
        ...entry,
        id: this.generateEntryId(),
        timestamp: new Date()
      }));

      await this.database.storeBatch(historyEntries);
      
      const ids = historyEntries.map(entry => entry.id);
      
      this.emit('validation.batch.recorded', historyEntries);
      
      this.logger.info(`Recorded ${entries.length} validation history entries in batch`);

      return ids;
    } catch (error) {
      this.logger.error('Failed to record validation batch:', error);
      throw error;
    }
  }

  /**
   * Get a validation history entry by ID
   */
  async getValidation(id: string): Promise<ValidationHistoryEntry | null> {
    this.ensureInitialized();

    try {
      return await this.database.get(id);
    } catch (error) {
      this.logger.error(`Failed to get validation history entry: ${id}`, error);
      throw error;
    }
  }

  /**
   * Query validation history
   */
  async queryValidations(query: HistoryQuery): Promise<HistoryQueryResult> {
    this.ensureInitialized();

    try {
      return await this.database.query(query);
    } catch (error) {
      this.logger.error('Failed to query validation history:', error);
      throw error;
    }
  }

  /**
   * Create a new query builder
   */
  createQuery(): QueryBuilder {
    return new QueryBuilder(this.database);
  }

  /**
   * Get validation history statistics
   */
  async getStatistics(specId?: string, dateRange?: { start: Date; end: Date }): Promise<HistoryStatistics> {
    this.ensureInitialized();

    try {
      return await this.database.getStatistics(specId, dateRange);
    } catch (error) {
      this.logger.error('Failed to get validation history statistics:', error);
      throw error;
    }
  }

  /**
   * Export validation history
   */
  async exportHistory(options: ExportOptions): Promise<ExportResult> {
    this.ensureInitialized();

    try {
      return await this.exportManager.export(options);
    } catch (error) {
      this.logger.error('Failed to export validation history:', error);
      throw error;
    }
  }

  /**
   * Export validation history (alias for exportHistory)
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    return this.exportHistory(options);
  }

  /**
   * Clean up old validation history entries
   */
  async cleanup(options?: Partial<CleanupOptions>): Promise<CleanupResult> {
    this.ensureInitialized();

    try {
      // Ensure database is connected before cleanup
      if (!this.database.isConnected()) {
        throw new Error('Database is not connected. Ensure HistoryManager is properly initialized.');
      }

      return await this.cleanupManager.cleanup(options);
    } catch (error) {
      this.logger.error('Failed to cleanup validation history:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats() {
    this.ensureInitialized();

    try {
      return await this.cleanupManager.getCleanupStats();
    } catch (error) {
      this.logger.error('Failed to get cleanup statistics:', error);
      throw error;
    }
  }

  /**
   * Delete specific validation entries
   */
  async deleteValidations(ids: string[]): Promise<number> {
    this.ensureInitialized();

    try {
      const deletedCount = await this.database.delete(ids);
      
      this.emit('validation.deleted', ids);
      
      this.logger.info(`Deleted ${deletedCount} validation history entries`);
      
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to delete validation history entries:', error);
      throw error;
    }
  }

  /**
   * Get database health status
   */
  async getHealth(): Promise<DatabaseHealth> {
    this.ensureInitialized();

    try {
      return await this.database.getHealth();
    } catch (error) {
      this.logger.error('Failed to get database health:', error);
      throw error;
    }
  }

  /**
   * Optimize database performance
   */
  async optimize(): Promise<void> {
    this.ensureInitialized();

    try {
      await this.database.optimize();
      this.logger.info('Database optimization completed');
    } catch (error) {
      this.logger.error('Failed to optimize database:', error);
      throw error;
    }
  }

  /**
   * Create database backup
   */
  async backup(path: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.database.backup(path);
      this.logger.info(`Database backup created: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to create database backup: ${path}`, error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restore(path: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.database.restore(path);
      this.logger.info(`Database restored from backup: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to restore database from backup: ${path}`, error);
      throw error;
    }
  }

  /**
   * Get recent validations for a specification
   */
  async getRecentValidations(specId: string, limit: number = 10): Promise<ValidationHistoryEntry[]> {
    const query = this.createQuery()
      .forSpec(specId)
      .newest()
      .take(limit)
      .build();

    const result = await this.queryValidations(query);
    return result.entries;
  }

  /**
   * Get failed validations for debugging
   */
  async getFailedValidations(days: number = 7, limit: number = 50): Promise<ValidationHistoryEntry[]> {
    const query = this.createQuery()
      .failed()
      .lastDays(days)
      .newest()
      .take(limit)
      .build();

    const result = await this.queryValidations(query);
    return result.entries;
  }

  /**
   * Get validation trends
   */
  async getValidationTrends(days: number = 30): Promise<ValidationTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = this.createQuery()
      .dateRange(startDate, endDate)
      .build();

    const result = await this.queryValidations(query);
    
    // Group by date
    const trendMap = new Map<string, ValidationTrend>();
    
    for (const entry of result.entries) {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      if (!dateKey) continue;

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          date: dateKey,
          totalValidations: 0,
          passedValidations: 0,
          failedValidations: 0,
          averageDuration: 0,
          totalDuration: 0
        });
      }

      const trend = trendMap.get(dateKey);
      if (!trend) continue;
      trend.totalValidations++;
      trend.totalDuration += entry.metrics.duration;
      
      if (entry.result.isValid) {
        trend.passedValidations++;
      } else {
        trend.failedValidations++;
      }
    }
    
    // Calculate averages
    const trends = Array.from(trendMap.values()).map(trend => ({
      ...trend,
      averageDuration: trend.totalValidations > 0 ? trend.totalDuration / trend.totalValidations : 0
    }));
    
    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Check if history manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  // Private helper methods

  private createDatabase(): IHistoryDatabase {
    switch (this.config.database.type) {
      case 'sqlite':
        return new SQLiteDatabase(this.logger);
      case 'postgresql':
        // TODO: Implement PostgreSQL database
        throw new Error('PostgreSQL database not yet implemented');
      case 'mysql':
        // TODO: Implement MySQL database
        throw new Error('MySQL database not yet implemented');
      case 'mongodb':
        // TODO: Implement MongoDB database
        throw new Error('MongoDB database not yet implemented');
      default:
        throw new Error(`Unsupported database type: ${this.config.database.type}`);
    }
  }

  private setupEventForwarding(): void {
    // 简化事件转发，避免类型问题
    // TODO: 实现数据库和清理管理器的事件转发
  }

  private generateEntryId(): string {
    return crypto.randomUUID();
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('History manager is not initialized. Call initialize() first.');
    }
    if (!this.database.isConnected()) {
      throw new Error('Database is not connected. Ensure the database is properly initialized.');
    }
  }
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
export function createHistoryManager(config: HistoryConfig, logger?: Logger): HistoryManager {
  return new HistoryManager(config, logger);
}
