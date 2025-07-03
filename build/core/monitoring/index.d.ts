/**
 * File Monitor for Real-time Validation
 *
 * Monitors file system changes and triggers validation
 */
import { Logger } from '../../utils/logger/index';
import type { MonitoringConfig } from '../../utils/config/index';
export type FileChangeHandler = (filePath: string, content: string) => Promise<void>;
export interface FileChangeEvent {
    type: 'add' | 'change' | 'unlink';
    path: string;
    timestamp: number;
    size?: number;
}
export declare class FileMonitor {
    private logger;
    private config;
    private watcher;
    private changeHandlers;
    private debounceTimers;
    private watchingState;
    constructor(config: MonitoringConfig, logger: Logger);
    /**
     * Initialize the file monitor
     */
    initialize(): Promise<void>;
    /**
     * Start watching specified paths
     */
    startWatching(paths: string[]): Promise<void>;
    /**
     * Stop watching files
     */
    stopWatching(): Promise<void>;
    /**
     * Add a file change handler
     */
    onFileChange(handler: FileChangeHandler): void;
    /**
     * Remove a file change handler
     */
    removeFileChangeHandler(handler: FileChangeHandler): void;
    /**
     * Check if monitoring is active
     */
    isWatching(): boolean;
    /**
     * Get monitoring statistics
     */
    getStats(): {
        isWatching: boolean;
        handlerCount: number;
        pendingDebounces: number;
    };
    /**
     * Setup event handlers for the file watcher
     */
    private setupEventHandlers;
    /**
     * Handle file system events with debouncing
     */
    private handleFileEvent;
    /**
     * Process file events after debouncing
     */
    private processFileEvent;
    /**
     * Validate monitoring configuration
     */
    private validateConfig;
}
//# sourceMappingURL=index.d.ts.map