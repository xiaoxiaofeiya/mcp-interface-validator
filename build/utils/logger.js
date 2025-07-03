/**
 * Logger utility for the MCP Interface Validator
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * Logger class for structured logging
 */
export class Logger {
    component;
    config;
    logEntries = [];
    constructor(component, config = {}) {
        this.component = component;
        this.config = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: false,
            maxLogEntries: 1000,
            ...config
        };
    }
    /**
     * Log a debug message
     */
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    /**
     * Log an info message
     */
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    /**
     * Log a warning message
     */
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    /**
     * Log an error message
     */
    error(message, error) {
        this.log(LogLevel.ERROR, message, error);
    }
    /**
     * Core logging method
     */
    log(level, message, data) {
        if (level < this.config.level) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            component: this.component,
            message,
            data
        };
        // Add to log entries
        this.logEntries.push(entry);
        // Maintain max log entries
        if (this.logEntries.length > this.config.maxLogEntries) {
            this.logEntries.shift();
        }
        // Console output
        if (this.config.enableConsole) {
            this.outputToConsole(entry);
        }
    }
    /**
     * Output log entry to console
     */
    outputToConsole(entry) {
        const levelName = LogLevel[entry.level];
        const prefix = `[${entry.timestamp}] [${levelName}] [${entry.component}]`;
        const message = `${prefix} ${entry.message}`;
        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(message, entry.data || '');
                break;
            case LogLevel.INFO:
                console.info(message, entry.data || '');
                break;
            case LogLevel.WARN:
                console.warn(message, entry.data || '');
                break;
            case LogLevel.ERROR:
                console.error(message, entry.data || '');
                break;
        }
    }
    /**
     * Get recent log entries
     */
    getLogEntries(count) {
        if (count) {
            return this.logEntries.slice(-count);
        }
        return [...this.logEntries];
    }
    /**
     * Clear log entries
     */
    clearLogs() {
        this.logEntries = [];
    }
    /**
     * Update logger configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Global logger instance
 */
export const globalLogger = new Logger('Global');
export default Logger;
//# sourceMappingURL=logger.js.map