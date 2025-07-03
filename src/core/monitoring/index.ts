/**
 * File Monitor for Real-time Validation
 * 
 * Monitors file system changes and triggers validation
 */

import { watch, FSWatcher } from 'chokidar';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';

import { Logger } from '../../utils/logger/index.js';
import type { MonitoringConfig } from '../../utils/config/index.js';

export type FileChangeHandler = (filePath: string, content: string) => Promise<void>;

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: number;
  size?: number;
}

export class FileMonitor {
  private logger: Logger;
  private config: MonitoringConfig;
  private watcher: FSWatcher | null = null;
  private changeHandlers: FileChangeHandler[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private watchingState: boolean = false;

  constructor(config: MonitoringConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialize the file monitor
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing File Monitor...');
      
      // Validate configuration
      this.validateConfig();
      
      this.logger.info('File Monitor initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize File Monitor:', error);
      throw error;
    }
  }

  /**
   * Start watching specified paths
   */
  async startWatching(paths: string[]): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to start file monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop watching files
   */
  async stopWatching(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to stop file monitoring:', error);
      throw error;
    }
  }

  /**
   * Add a file change handler
   */
  onFileChange(handler: FileChangeHandler): void {
    this.changeHandlers.push(handler);
    this.logger.debug('File change handler added', { 
      handlerCount: this.changeHandlers.length 
    });
  }

  /**
   * Remove a file change handler
   */
  removeFileChangeHandler(handler: FileChangeHandler): void {
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
  isWatching(): boolean {
    return this.watchingState;
  }

  /**
   * Get monitoring statistics
   */
  getStats(): { 
    isWatching: boolean; 
    handlerCount: number; 
    pendingDebounces: number; 
  } {
    return {
      isWatching: this.watchingState,
      handlerCount: this.changeHandlers.length,
      pendingDebounces: this.debounceTimers.size
    };
  }

  /**
   * Setup event handlers for the file watcher
   */
  private setupEventHandlers(): void {
    if (!this.watcher) {
      return;
    }

    // Handle file additions
    this.watcher.on('add', (path: string) => {
      this.handleFileEvent('add', path);
    });

    // Handle file changes
    this.watcher.on('change', (path: string) => {
      this.handleFileEvent('change', path);
    });

    // Handle file deletions
    this.watcher.on('unlink', (path: string) => {
      this.handleFileEvent('unlink', path);
    });

    // Handle errors
    this.watcher.on('error', (error: Error) => {
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
  private handleFileEvent(type: 'add' | 'change' | 'unlink', filePath: string): void {
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
  private async processFileEvent(type: 'add' | 'change' | 'unlink', filePath: string): Promise<void> {
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
      const promises = this.changeHandlers.map(handler => 
        handler(filePath, content).catch(error => {
          this.logger.error('File change handler failed:', error);
        })
      );

      await Promise.all(promises);

    } catch (error) {
      this.logger.error('Failed to process file event:', error);
    }
  }

  /**
   * Validate monitoring configuration
   */
  private validateConfig(): void {
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
