/**
 * File Monitor for Real-time Validation
 *
 * Monitors file system changes and triggers validation
 */
import { watch, FSWatcher } from 'chokidar';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '../../utils/logger/index';
export class FileMonitor {
    logger;
    config;
    watcher = null;
    changeHandlers = [];
    debounceTimers = new Map();
    watchingState = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    /**
     * Initialize the file monitor
     */
    async initialize() {
        try {
            this.logger.info('Initializing File Monitor...');
            // Validate configuration
            this.validateConfig();
            this.logger.info('File Monitor initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize File Monitor:', error);
            throw error;
        }
    }
    /**
     * Start watching specified paths
     */
    async startWatching(paths) {
        if (this.watchingState) {
            this.logger.warn('File monitoring is already active');
            return;
        }
        try {
            this.logger.info('Starting file monitoring', { paths });
            // Create watcher with configuration
            this.watcher = watch(paths, {
                ignored: this.config.ignorePatterns,
                persistent: true,
                ignoreInitial: true,
                followSymlinks: false,
                depth: 10,
                awaitWriteFinish: {
                    stabilityThreshold: 100,
                    pollInterval: 50
                }
            });
            // Set up event handlers
            this.setupEventHandlers();
            this.watchingState = true;
            this.logger.info('File monitoring started successfully');
        }
        catch (error) {
            this.logger.error('Failed to start file monitoring:', error);
            throw error;
        }
    }
    /**
     * Stop watching files
     */
    async stopWatching() {
        if (!this.watchingState || !this.watcher) {
            return;
        }
        try {
            this.logger.info('Stopping file monitoring...');
            // Clear any pending debounce timers
            for (const timer of this.debounceTimers.values()) {
                clearTimeout(timer);
            }
            this.debounceTimers.clear();
            // Close the watcher
            await this.watcher.close();
            this.watcher = null;
            this.watchingState = false;
            this.logger.info('File monitoring stopped');
        }
        catch (error) {
            this.logger.error('Failed to stop file monitoring:', error);
            throw error;
        }
    }
    /**
     * Add a file change handler
     */
    onFileChange(handler) {
        this.changeHandlers.push(handler);
        this.logger.debug('File change handler added', {
            handlerCount: this.changeHandlers.length
        });
    }
    /**
     * Remove a file change handler
     */
    removeFileChangeHandler(handler) {
        const index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
            this.logger.debug('File change handler removed', {
                handlerCount: this.changeHandlers.length
            });
        }
    }
    /**
     * Check if monitoring is active
     */
    isWatching() {
        return this.watchingState;
    }
    /**
     * Get monitoring statistics
     */
    getStats() {
        return {
            isWatching: this.watchingState,
            handlerCount: this.changeHandlers.length,
            pendingDebounces: this.debounceTimers.size
        };
    }
    /**
     * Setup event handlers for the file watcher
     */
    setupEventHandlers() {
        if (!this.watcher) {
            return;
        }
        // Handle file additions
        this.watcher.on('add', (path) => {
            this.handleFileEvent('add', path);
        });
        // Handle file changes
        this.watcher.on('change', (path) => {
            this.handleFileEvent('change', path);
        });
        // Handle file deletions
        this.watcher.on('unlink', (path) => {
            this.handleFileEvent('unlink', path);
        });
        // Handle errors
        this.watcher.on('error', (error) => {
            this.logger.error('File watcher error:', error);
        });
        // Handle ready event
        this.watcher.on('ready', () => {
            this.logger.debug('File watcher ready');
        });
    }
    /**
     * Handle file system events with debouncing
     */
    handleFileEvent(type, filePath) {
        const resolvedPath = resolve(filePath);
        // Clear existing debounce timer for this file
        const existingTimer = this.debounceTimers.get(resolvedPath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new debounce timer
        const timer = setTimeout(async () => {
            this.debounceTimers.delete(resolvedPath);
            await this.processFileEvent(type, resolvedPath);
        }, this.config.debounceMs);
        this.debounceTimers.set(resolvedPath, timer);
    }
    /**
     * Process file events after debouncing
     */
    async processFileEvent(type, filePath) {
        try {
            this.logger.debug('Processing file event', { type, filePath });
            // Skip deleted files
            if (type === 'unlink') {
                this.logger.debug('File deleted, skipping validation', { filePath });
                return;
            }
            // Check file size
            const stats = statSync(filePath);
            if (stats.size > this.config.maxFileSize) {
                this.logger.warn('File too large, skipping validation', {
                    filePath,
                    size: stats.size,
                    maxSize: this.config.maxFileSize
                });
                return;
            }
            // Read file content
            const content = readFileSync(filePath, 'utf-8');
            // Notify all handlers
            const promises = this.changeHandlers.map(handler => handler(filePath, content).catch(error => {
                this.logger.error('File change handler failed:', error);
            }));
            await Promise.all(promises);
        }
        catch (error) {
            this.logger.error('Failed to process file event:', error);
        }
    }
    /**
     * Validate monitoring configuration
     */
    validateConfig() {
        if (!this.config.watchPatterns || this.config.watchPatterns.length === 0) {
            throw new Error('Watch patterns must be specified');
        }
        if (this.config.debounceMs < 0) {
            throw new Error('Debounce time must be non-negative');
        }
        if (this.config.maxFileSize <= 0) {
            throw new Error('Max file size must be positive');
        }
    }
}
//# sourceMappingURL=index.js.map