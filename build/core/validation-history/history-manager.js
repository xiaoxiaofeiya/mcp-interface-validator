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
/**
 * Main history manager class
 */
export class HistoryManager extends EventEmitter {
    logger;
    config;
    database;
    exportManager;
    cleanupManager;
    isInitialized = false;
    constructor(config, logger, database) {
        super();
        this.config = config;
        this.logger = logger || {
            info: console.log,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
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
    async initialize() {
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
        }
        catch (error) {
            this.logger.error('Failed to initialize validation history manager:', error);
            throw error;
        }
    }
    /**
     * Shutdown the history manager
     */
    async shutdown() {
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
        }
        catch (error) {
            this.logger.error('Error during history manager shutdown:', error);
            throw error;
        }
    }
    /**
     * Record a validation result
     */
    async recordValidation(specId, result, sourceCode, validationType, context, metrics, filePath, userId) {
        this.ensureInitialized();
        try {
            const entry = {
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
        }
        catch (error) {
            this.logger.error('Failed to record validation:', error);
            throw error;
        }
    }
    /**
     * Record multiple validations in batch
     */
    async recordValidationBatch(entries) {
        this.ensureInitialized();
        try {
            const historyEntries = entries.map(entry => ({
                ...entry,
                id: this.generateEntryId(),
                timestamp: new Date()
            }));
            await this.database.storeBatch(historyEntries);
            const ids = historyEntries.map(entry => entry.id);
            this.emit('validation.batch.recorded', historyEntries);
            this.logger.info(`Recorded ${entries.length} validation history entries in batch`);
            return ids;
        }
        catch (error) {
            this.logger.error('Failed to record validation batch:', error);
            throw error;
        }
    }
    /**
     * Get a validation history entry by ID
     */
    async getValidation(id) {
        this.ensureInitialized();
        try {
            return await this.database.get(id);
        }
        catch (error) {
            this.logger.error(`Failed to get validation history entry: ${id}`, error);
            throw error;
        }
    }
    /**
     * Query validation history
     */
    async queryValidations(query) {
        this.ensureInitialized();
        try {
            return await this.database.query(query);
        }
        catch (error) {
            this.logger.error('Failed to query validation history:', error);
            throw error;
        }
    }
    /**
     * Create a new query builder
     */
    createQuery() {
        return new QueryBuilder(this.database);
    }
    /**
     * Get validation history statistics
     */
    async getStatistics(specId, dateRange) {
        this.ensureInitialized();
        try {
            return await this.database.getStatistics(specId, dateRange);
        }
        catch (error) {
            this.logger.error('Failed to get validation history statistics:', error);
            throw error;
        }
    }
    /**
     * Export validation history
     */
    async exportHistory(options) {
        this.ensureInitialized();
        try {
            return await this.exportManager.export(options);
        }
        catch (error) {
            this.logger.error('Failed to export validation history:', error);
            throw error;
        }
    }
    /**
     * Export validation history (alias for exportHistory)
     */
    async export(options) {
        return this.exportHistory(options);
    }
    /**
     * Clean up old validation history entries
     */
    async cleanup(options) {
        this.ensureInitialized();
        try {
            // Ensure database is connected before cleanup
            if (!this.database.isConnected()) {
                throw new Error('Database is not connected. Ensure HistoryManager is properly initialized.');
            }
            return await this.cleanupManager.cleanup(options);
        }
        catch (error) {
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
        }
        catch (error) {
            this.logger.error('Failed to get cleanup statistics:', error);
            throw error;
        }
    }
    /**
     * Delete specific validation entries
     */
    async deleteValidations(ids) {
        this.ensureInitialized();
        try {
            const deletedCount = await this.database.delete(ids);
            this.emit('validation.deleted', ids);
            this.logger.info(`Deleted ${deletedCount} validation history entries`);
            return deletedCount;
        }
        catch (error) {
            this.logger.error('Failed to delete validation history entries:', error);
            throw error;
        }
    }
    /**
     * Get database health status
     */
    async getHealth() {
        this.ensureInitialized();
        try {
            return await this.database.getHealth();
        }
        catch (error) {
            this.logger.error('Failed to get database health:', error);
            throw error;
        }
    }
    /**
     * Optimize database performance
     */
    async optimize() {
        this.ensureInitialized();
        try {
            await this.database.optimize();
            this.logger.info('Database optimization completed');
        }
        catch (error) {
            this.logger.error('Failed to optimize database:', error);
            throw error;
        }
    }
    /**
     * Create database backup
     */
    async backup(path) {
        this.ensureInitialized();
        try {
            await this.database.backup(path);
            this.logger.info(`Database backup created: ${path}`);
        }
        catch (error) {
            this.logger.error(`Failed to create database backup: ${path}`, error);
            throw error;
        }
    }
    /**
     * Restore database from backup
     */
    async restore(path) {
        this.ensureInitialized();
        try {
            await this.database.restore(path);
            this.logger.info(`Database restored from backup: ${path}`);
        }
        catch (error) {
            this.logger.error(`Failed to restore database from backup: ${path}`, error);
            throw error;
        }
    }
    /**
     * Get recent validations for a specification
     */
    async getRecentValidations(specId, limit = 10) {
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
    async getFailedValidations(days = 7, limit = 50) {
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
    async getValidationTrends(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const query = this.createQuery()
            .dateRange(startDate, endDate)
            .build();
        const result = await this.queryValidations(query);
        // Group by date
        const trendMap = new Map();
        for (const entry of result.entries) {
            const dateKey = entry.timestamp.toISOString().split('T')[0];
            if (!dateKey)
                continue;
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
            if (!trend)
                continue;
            trend.totalValidations++;
            trend.totalDuration += entry.metrics.duration;
            if (entry.result.isValid) {
                trend.passedValidations++;
            }
            else {
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
    isReady() {
        return this.isInitialized;
    }
    // Private helper methods
    createDatabase() {
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
    setupEventForwarding() {
        // 简化事件转发，避免类型问题
        // TODO: 实现数据库和清理管理器的事件转发
    }
    generateEntryId() {
        return crypto.randomUUID();
    }
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('History manager is not initialized. Call initialize() first.');
        }
        if (!this.database.isConnected()) {
            throw new Error('Database is not connected. Ensure the database is properly initialized.');
        }
    }
}
/**
 * Create history manager with default configuration
 */
export function createHistoryManager(config, logger) {
    return new HistoryManager(config, logger);
}
//# sourceMappingURL=history-manager.js.map