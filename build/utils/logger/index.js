/**
 * Logger Utility for MCP Interface Validator
 *
 * Provides structured logging with different levels and formatting
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    component;
    logLevel;
    constructor(component, logLevel = LogLevel.INFO) {
        this.component = component;
        this.logLevel = logLevel;
    }
    /**
     * Log debug message
     */
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    /**
     * Log info message
     */
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    /**
     * Log warning message
     */
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    /**
     * Log error message
     */
    error(message, error) {
        this.log(LogLevel.ERROR, message, error);
    }
    /**
     * Internal logging method
     */
    log(level, message, data) {
        if (level < this.logLevel) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            component: this.component,
            message,
            data
        };
        const formattedMessage = this.formatLogEntry(entry);
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
        }
    }
    /**
     * Format log entry for output
     */
    formatLogEntry(entry) {
        const levelName = LogLevel[entry.level];
        let formatted = `[${entry.timestamp}] ${levelName} [${entry.component}] ${entry.message}`;
        if (entry.data) {
            formatted += `\n${JSON.stringify(entry.data, null, 2)}`;
        }
        return formatted;
    }
    /**
     * Set log level
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * Get current log level
     */
    getLogLevel() {
        return this.logLevel;
    }
}
//# sourceMappingURL=index.js.map