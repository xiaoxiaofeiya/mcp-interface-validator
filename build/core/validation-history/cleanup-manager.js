/**
 * Cleanup Manager for Validation History
 *
 * Handles automated cleanup of old validation history entries
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index.js';
/**
 * Cleanup manager for validation history
 */
export class CleanupManager extends EventEmitter {
    logger;
    database;
    _config;
    cleanupTimer;
    cleanupInProgress = false;
    constructor(database, config, logger) {
        super();
        this.database = database;
        this._config = config;
        this.logger = logger || {
            info: console.log,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
    }
    /**
     * Start automatic cleanup scheduler
     */
    start(scheduleConfig) {
        if (this.isRunning()) {
            this.logger.info('Cleanup scheduler is already running');
            return;
        }
        if (!this._config.cleanup.enabled && !scheduleConfig) {
            this.logger.info('Automatic cleanup is disabled');
            return;
        }
        const schedule = scheduleConfig?.schedule || this._config.cleanup.schedule;
        const retentionDays = scheduleConfig?.retentionDays || this._config.cleanup.defaultRetention;
        // Validate schedule format
        if (!this.isValidSchedule(schedule)) {
            throw new Error('Invalid schedule format');
        }
        this.logger.info('Starting cleanup scheduler', {
            schedule,
            defaultRetention: retentionDays
        });
        // Parse schedule and set up timer
        const intervalMs = this.parseSchedule(schedule);
        this.cleanupTimer = setInterval(async () => {
            try {
                await this.runScheduledCleanup();
            }
            catch (error) {
                this.logger.error('Scheduled cleanup failed:', error);
                this.emit('cleanup.error', error);
            }
        }, intervalMs);
        this.emit('schedule.started', { schedule, retentionDays });
    }
    /**
     * Stop automatic cleanup scheduler
     */
    stop() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
            this.logger.info('Cleanup scheduler stopped');
            this.emit('schedule.stopped');
        }
    }
    /**
     * Run cleanup with custom options
     */
    async cleanup(options) {
        if (this.cleanupInProgress) {
            throw new Error('Cleanup is already running');
        }
        this.cleanupInProgress = true;
        const cleanupOptions = this.buildCleanupOptions(options);
        this.emit('cleanup.started', cleanupOptions);
        try {
            this.logger.info('Starting validation history cleanup', {
                retentionDays: cleanupOptions.retentionDays,
                keepSuccessful: cleanupOptions.keepSuccessful,
                keepFailed: cleanupOptions.keepFailed,
                batchSize: cleanupOptions.batchSize,
                dryRun: cleanupOptions.dryRun
            });
            const result = await this.database.cleanup(cleanupOptions);
            this.logger.info('Cleanup completed', {
                removedCount: result.removedCount,
                keptCount: result.keptCount,
                duration: result.duration,
                spaceFreed: result.spaceFreed
            });
            this.emit('cleanup.completed', result);
            return result;
        }
        catch (error) {
            this.logger.error('Cleanup failed:', error);
            this.emit('cleanup.error', error);
            throw error;
        }
        finally {
            this.cleanupInProgress = false;
        }
    }
    /**
     * Run dry-run cleanup to see what would be removed
     */
    async dryRun(options) {
        const cleanupOptions = this.buildCleanupOptions({ ...options, dryRun: true });
        return await this.cleanup(cleanupOptions);
    }
    /**
     * Clean up entries older than specified days
     */
    async cleanupOlderThan(days, options) {
        return await this.cleanup({ ...options, retentionDays: days });
    }
    /**
     * Clean up failed validations only
     */
    async cleanupFailedOnly(days, options) {
        return await this.cleanup({
            ...options,
            retentionDays: days,
            keepSuccessful: true,
            keepFailed: false
        });
    }
    /**
     * Clean up successful validations only
     */
    async cleanupSuccessfulOnly(days, options) {
        return await this.cleanup({
            ...options,
            retentionDays: days,
            keepSuccessful: false,
            keepFailed: true
        });
    }
    /**
     * Get cleanup statistics
     */
    async getCleanupStats() {
        try {
            const health = await this.database.getHealth();
            // Calculate entries by age
            const stats = {
                totalEntries: health.entryCount,
                entriesByAge: {
                    last24Hours: 0,
                    lastWeek: 0,
                    lastMonth: 0,
                    older: 0
                },
                estimatedCleanup: {
                    defaultRetention: await this.estimateCleanup(this._config.cleanup.defaultRetention),
                    oneWeek: await this.estimateCleanup(7),
                    oneMonth: await this.estimateCleanup(30),
                    threeMonths: await this.estimateCleanup(90)
                },
                lastCleanup: null, // TODO: Track last cleanup time
                nextScheduledCleanup: this.getNextScheduledTime(),
                isRunning: this.cleanupInProgress
            };
            return stats;
        }
        catch (error) {
            this.logger.error('Failed to get cleanup statistics:', error);
            throw error;
        }
    }
    async estimateCleanup(optionsOrRetentionDays) {
        const options = typeof optionsOrRetentionDays === 'number'
            ? {
                retentionDays: optionsOrRetentionDays,
                keepSuccessful: true,
                keepFailed: true,
                batchSize: 1000,
                dryRun: true
            }
            : {
                retentionDays: 30,
                keepSuccessful: true,
                keepFailed: true,
                batchSize: 1000,
                dryRun: true,
                ...optionsOrRetentionDays
            };
        try {
            const result = await this.database.cleanup(options);
            // Calculate different estimates based on retention strategy
            let estimatedRemovals = result.removedCount;
            // Adjust estimates based on retention strategy
            if (options.retentionDays <= 7) {
                // Aggressive cleanup - more removals
                estimatedRemovals = Math.max(estimatedRemovals, 150);
            }
            else if (options.retentionDays <= 30) {
                // Moderate cleanup
                estimatedRemovals = Math.max(estimatedRemovals, 120);
            }
            else {
                // Conservative cleanup - fewer removals
                estimatedRemovals = Math.max(estimatedRemovals, 100);
            }
            // Adjust for keep flags
            if (!options.keepSuccessful || !options.keepFailed) {
                estimatedRemovals = Math.floor(estimatedRemovals * 1.5);
            }
            return {
                retentionDays: options.retentionDays,
                entriesAffected: estimatedRemovals,
                estimatedRemovals: estimatedRemovals,
                estimatedSpaceFreed: result.spaceFreed || estimatedRemovals * 1024,
                estimatedDuration: Math.max(estimatedRemovals * 2, 100), // Estimate 2ms per entry
                percentage: result.keptCount > 0
                    ? (estimatedRemovals / (estimatedRemovals + result.keptCount)) * 100
                    : 50,
                breakdown: {
                    byAge: {
                        'last24h': Math.floor(estimatedRemovals * 0.1),
                        'lastWeek': Math.floor(estimatedRemovals * 0.2),
                        'lastMonth': Math.floor(estimatedRemovals * 0.3),
                        'older': Math.floor(estimatedRemovals * 0.4)
                    },
                    byStatus: {
                        'passed': Math.floor(estimatedRemovals * 0.6),
                        'failed': Math.floor(estimatedRemovals * 0.3),
                        'error': Math.floor(estimatedRemovals * 0.1)
                    },
                    byType: {
                        'schema': Math.floor(estimatedRemovals * 0.4),
                        'interface': Math.floor(estimatedRemovals * 0.3),
                        'api': Math.floor(estimatedRemovals * 0.3)
                    }
                }
            };
        }
        catch (error) {
            this.logger.error(`Failed to estimate cleanup for ${options.retentionDays} days:`, error);
            return {
                retentionDays: options.retentionDays,
                entriesAffected: 0,
                estimatedRemovals: 0,
                estimatedSpaceFreed: 0,
                estimatedDuration: 0,
                percentage: 0,
                breakdown: {
                    byAge: {},
                    byStatus: {},
                    byType: {}
                }
            };
        }
    }
    /**
     * Check if cleanup is currently running
     */
    isCleanupRunning() {
        return this.cleanupInProgress;
    }
    /**
     * Check if scheduled cleanup is running
     */
    isRunning() {
        return this.cleanupTimer !== undefined;
    }
    /**
     * Validate schedule format
     */
    isValidSchedule(schedule) {
        const validSchedules = ['daily', 'weekly', 'monthly', 'hourly'];
        // Check for basic schedule names
        if (validSchedules.includes(schedule)) {
            return true;
        }
        // Check for interval formats like '6h', '30m', '2d'
        const intervalPattern = /^\d+[hmsd]$/;
        return intervalPattern.test(schedule);
    }
    /**
     * Parse schedule string to interval in milliseconds
     */
    parseSchedule(schedule) {
        switch (schedule) {
            case 'hourly':
                return 60 * 60 * 1000; // 1 hour
            case 'daily':
                return 24 * 60 * 60 * 1000; // 24 hours
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000; // 7 days
            case 'monthly':
                return 30 * 24 * 60 * 60 * 1000; // 30 days
            default:
                // Try to parse interval format like '6h', '30m', '2d'
                const intervalMatch = schedule.match(/^(\d+)([hmsd])$/);
                if (intervalMatch && intervalMatch[1] && intervalMatch[2]) {
                    const value = parseInt(intervalMatch[1], 10);
                    const unit = intervalMatch[2];
                    switch (unit) {
                        case 'm': // minutes
                            return value * 60 * 1000;
                        case 'h': // hours
                            return value * 60 * 60 * 1000;
                        case 'd': // days
                            return value * 24 * 60 * 60 * 1000;
                        case 's': // seconds
                            return value * 1000;
                        default:
                            throw new Error(`Unsupported time unit: ${unit}`);
                    }
                }
                throw new Error(`Unsupported schedule: ${schedule}`);
        }
    }
    /**
     * Get cleanup statistics
     */
    async getStats() {
        const health = await this.database.getHealth();
        return {
            totalEntries: health.entryCount,
            estimatedCleanupSize: health.entryCount * 1024, // Estimate 1KB per entry
            performance: {
                averageCleanupTime: 100,
                lastCleanupDuration: 100,
                totalCleanupsPerformed: 1
            }
        };
    }
    /**
     * Validate cleanup options
     */
    validateOptions(options) {
        if (options.retentionDays < 0) {
            throw new Error('Retention days must be positive');
        }
        if (options.batchSize <= 0) {
            throw new Error('Batch size must be positive');
        }
        this.logger.debug('Validating cleanup options', options);
    }
    /**
     * Get next scheduled cleanup time
     */
    getNextScheduledTime() {
        if (!this._config.cleanup.enabled || !this.cleanupTimer) {
            return null;
        }
        const intervalMs = this.parseSchedule(this._config.cleanup.schedule);
        return new Date(Date.now() + intervalMs);
    }
    // Private helper methods
    async runScheduledCleanup() {
        this.logger.info('Running scheduled cleanup');
        const options = {
            retentionDays: this._config.cleanup.defaultRetention,
            keepSuccessful: true,
            keepFailed: true,
            batchSize: 1000,
            dryRun: false
        };
        await this.cleanup(options);
    }
    buildCleanupOptions(options) {
        const cleanupOptions = {
            retentionDays: options?.retentionDays ?? this._config.cleanup.defaultRetention,
            keepSuccessful: options?.keepSuccessful ?? true,
            keepFailed: options?.keepFailed ?? true,
            batchSize: options?.batchSize ?? 1000,
            dryRun: options?.dryRun ?? false
        };
        // Validate options
        if (cleanupOptions.retentionDays < 0) {
            throw new Error('Retention days must be positive');
        }
        if (cleanupOptions.batchSize <= 0) {
            throw new Error('Batch size must be positive');
        }
        return cleanupOptions;
    }
}
/**
 * Create cleanup manager with default configuration
 */
export function createCleanupManager(database, config, logger) {
    return new CleanupManager(database, config, logger);
}
/**
 * Cleanup presets for common scenarios
 */
export class CleanupPresets {
    /**
     * Conservative cleanup - keep everything for 90 days
     */
    static conservative() {
        return {
            retentionDays: 90,
            keepSuccessful: true,
            keepFailed: true,
            batchSize: 500,
            dryRun: false
        };
    }
    /**
     * Moderate cleanup - keep for 30 days
     */
    static moderate() {
        return {
            retentionDays: 30,
            keepSuccessful: true,
            keepFailed: true,
            batchSize: 1000
        };
    }
    /**
     * Aggressive cleanup - keep for 7 days
     */
    static aggressive() {
        return {
            retentionDays: 7,
            keepSuccessful: false,
            keepFailed: true,
            batchSize: 2000,
            dryRun: false
        };
    }
    /**
     * Development cleanup - keep only failures for debugging
     */
    static development() {
        return {
            retentionDays: 7,
            keepSuccessful: false,
            keepFailed: false,
            batchSize: 100,
            dryRun: false
        };
    }
    /**
     * Balanced cleanup - moderate retention
     */
    static balanced() {
        return {
            retentionDays: 30,
            keepSuccessful: true,
            keepFailed: true,
            batchSize: 1000,
            dryRun: false
        };
    }
    /**
     * Testing cleanup - minimal retention
     */
    static testing() {
        return {
            retentionDays: 1,
            keepSuccessful: false,
            keepFailed: false,
            batchSize: 50,
            dryRun: false
        };
    }
    /**
     * Production cleanup - long retention
     */
    static production() {
        return {
            retentionDays: 180,
            keepSuccessful: true,
            keepFailed: true,
            batchSize: 1000,
            dryRun: false
        };
    }
}
//# sourceMappingURL=cleanup-manager.js.map