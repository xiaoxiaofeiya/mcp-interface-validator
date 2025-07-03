/**
 * Logger Utility for MCP Interface Validator
 *
 * Provides structured logging with different levels and formatting
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    component: string;
    message: string;
    data?: any;
}
export declare class Logger {
    private component;
    private logLevel;
    constructor(component: string, logLevel?: LogLevel);
    /**
     * Log debug message
     */
    debug(message: string, data?: any): void;
    /**
     * Log info message
     */
    info(message: string, data?: any): void;
    /**
     * Log warning message
     */
    warn(message: string, data?: any): void;
    /**
     * Log error message
     */
    error(message: string, error?: any): void;
    /**
     * Internal logging method
     */
    private log;
    /**
     * Format log entry for output
     */
    private formatLogEntry;
    /**
     * Set log level
     */
    setLogLevel(level: LogLevel): void;
    /**
     * Get current log level
     */
    getLogLevel(): LogLevel;
}
//# sourceMappingURL=index.d.ts.map