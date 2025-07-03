/**
 * Logger utility for the MCP Interface Validator
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
export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    maxLogEntries: number;
}
/**
 * Logger class for structured logging
 */
export declare class Logger {
    private component;
    private config;
    private logEntries;
    constructor(component: string, config?: Partial<LoggerConfig>);
    /**
     * Log a debug message
     */
    debug(message: string, data?: any): void;
    /**
     * Log an info message
     */
    info(message: string, data?: any): void;
    /**
     * Log a warning message
     */
    warn(message: string, data?: any): void;
    /**
     * Log an error message
     */
    error(message: string, error?: any): void;
    /**
     * Core logging method
     */
    private log;
    /**
     * Output log entry to console
     */
    private outputToConsole;
    /**
     * Get recent log entries
     */
    getLogEntries(count?: number): LogEntry[];
    /**
     * Clear log entries
     */
    clearLogs(): void;
    /**
     * Update logger configuration
     */
    updateConfig(config: Partial<LoggerConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): LoggerConfig;
}
/**
 * Global logger instance
 */
export declare const globalLogger: Logger;
export default Logger;
//# sourceMappingURL=logger.d.ts.map