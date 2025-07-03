/**
 * Base Plugin Implementation
 *
 * Provides a base class for plugin development with common functionality
 */
import { EventEmitter } from 'events';
/**
 * Abstract base plugin class
 */
export class BasePlugin extends EventEmitter {
    metadata;
    _state = 'unloaded';
    _context;
    _startTime;
    _errors = [];
    _hooks = new Map();
    constructor(metadata) {
        super();
        this.metadata = metadata;
        this.setMaxListeners(50); // Allow many hook listeners
    }
    /**
     * Get current plugin state
     */
    get state() {
        return this._state;
    }
    /**
     * Get plugin context
     */
    get context() {
        return this._context;
    }
    /**
     * Initialize plugin with context
     */
    async initialize(context) {
        this._setState('initializing');
        this._context = context;
        try {
            // Validate plugin metadata
            this._validateMetadata();
            // Initialize plugin-specific logic
            await this.onInitialize();
            this._setState('initialized');
            this._log('info', `Plugin ${this.metadata.name} initialized successfully`);
        }
        catch (error) {
            this._setState('error');
            this._addError(error);
            throw error;
        }
    }
    /**
     * Start plugin
     */
    async start() {
        if (this._state !== 'initialized') {
            throw new Error(`Cannot start plugin in state: ${this._state}`);
        }
        this._setState('starting');
        this._startTime = new Date();
        try {
            // Start plugin-specific logic
            await this.onStart();
            this._setState('started');
            this._log('info', `Plugin ${this.metadata.name} started successfully`);
        }
        catch (error) {
            this._setState('error');
            this._addError(error);
            throw error;
        }
    }
    /**
     * Stop plugin
     */
    async stop() {
        if (this._state !== 'started') {
            this._log('warn', `Plugin ${this.metadata.name} is not started, current state: ${this._state}`);
            return;
        }
        this._setState('stopping');
        try {
            // Stop plugin-specific logic
            await this.onStop();
            this._setState('stopped');
            this._log('info', `Plugin ${this.metadata.name} stopped successfully`);
        }
        catch (error) {
            this._setState('error');
            this._addError(error);
            throw error;
        }
    }
    /**
     * Cleanup plugin resources
     */
    async cleanup() {
        try {
            // Unregister all hooks
            this._hooks.clear();
            // Cleanup plugin-specific resources
            await this.onCleanup();
            // Remove all event listeners
            this.removeAllListeners();
            this._setState('unloaded');
            this._log('info', `Plugin ${this.metadata.name} cleaned up successfully`);
        }
        catch (error) {
            this._addError(error);
            throw error;
        }
    }
    /**
     * Get plugin health status
     */
    getHealth() {
        const health = {
            status: this._getHealthStatus(),
            timestamp: new Date(),
            details: {
                message: this._getHealthMessage(),
                metrics: this._getHealthMetrics(),
                errors: this._errors.map(e => e.message)
            }
        };
        return health;
    }
    /**
     * Handle configuration changes
     */
    async onConfigChange(config) {
        try {
            this._log('info', `Plugin ${this.metadata.name} configuration changed`);
            await this.onConfigurationChange(config);
        }
        catch (error) {
            this._addError(error);
            throw error;
        }
    }
    /**
     * Register a hook handler
     */
    registerHook(type, handler) {
        if (!this._context) {
            throw new Error('Plugin not initialized');
        }
        this._context.api.registerHook(type, handler);
        // Track locally for cleanup
        if (!this._hooks.has(type)) {
            this._hooks.set(type, []);
        }
        this._hooks.get(type).push(handler);
        this._log('debug', `Registered hook: ${type}`);
    }
    /**
     * Unregister a hook handler
     */
    unregisterHook(type, handler) {
        if (!this._context) {
            return;
        }
        this._context.api.unregisterHook(type, handler);
        // Remove from local tracking
        const handlers = this._hooks.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
        this._log('debug', `Unregistered hook: ${type}`);
    }
    /**
     * Emit a hook event
     */
    async emitHook(type, data) {
        if (!this._context) {
            throw new Error('Plugin not initialized');
        }
        return await this._context.api.emitHook(type, data);
    }
    /**
     * Get a service from the host
     */
    getService(name) {
        if (!this._context) {
            throw new Error('Plugin not initialized');
        }
        return this._context.api.getService(name);
    }
    /**
     * Register a service with the host
     */
    registerService(name, service) {
        if (!this._context) {
            throw new Error('Plugin not initialized');
        }
        this._context.api.registerService(name, service);
        this._log('debug', `Registered service: ${name}`);
    }
    /**
     * Log a message
     */
    _log(level, message, meta) {
        if (this._context && this._context.logger) {
            const logger = this._context.logger;
            if (typeof logger[level] === 'function') {
                logger[level](`[${this.metadata.name}] ${message}`, meta);
            }
        }
    }
    /**
     * Handle configuration changes (optional)
     */
    async onConfigurationChange(_config) {
        // Default implementation - override if needed
    }
    // Private helper methods
    _setState(newState) {
        const oldState = this._state;
        this._state = newState;
        this.emit('stateChanged', oldState, newState);
    }
    _validateMetadata() {
        if (!this.metadata.id) {
            throw new Error('Plugin metadata must include an ID');
        }
        if (!this.metadata.name) {
            throw new Error('Plugin metadata must include a name');
        }
        if (!this.metadata.version) {
            throw new Error('Plugin metadata must include a version');
        }
    }
    _addError(error) {
        this._errors.push(error);
        // Keep only last 10 errors
        if (this._errors.length > 10) {
            this._errors = this._errors.slice(-10);
        }
    }
    _getHealthStatus() {
        if (this._errors.length > 0) {
            return 'error';
        }
        if (this._state === 'error') {
            return 'error';
        }
        if (this._state === 'started') {
            return 'healthy';
        }
        if (['initialized', 'stopped'].includes(this._state)) {
            return 'warning';
        }
        return 'unknown';
    }
    _getHealthMessage() {
        if (this._errors.length > 0) {
            return `Plugin has ${this._errors.length} error(s)`;
        }
        return `Plugin is in ${this._state} state`;
    }
    _getHealthMetrics() {
        const metrics = {
            state: this._state,
            errorCount: this._errors.length,
            hookCount: Array.from(this._hooks.values()).reduce((sum, handlers) => sum + handlers.length, 0)
        };
        if (this._startTime) {
            metrics['uptime'] = Date.now() - this._startTime.getTime();
        }
        return metrics;
    }
}
/**
 * Simple plugin implementation for basic use cases
 */
export class SimplePlugin extends BasePlugin {
    _initHandler;
    _startHandler;
    _stopHandler;
    _cleanupHandler;
    constructor(metadata, handlers = {}) {
        super(metadata);
        this._initHandler = handlers.onInitialize;
        this._startHandler = handlers.onStart;
        this._stopHandler = handlers.onStop;
        this._cleanupHandler = handlers.onCleanup;
    }
    async onInitialize() {
        if (this._initHandler) {
            await this._initHandler();
        }
    }
    async onStart() {
        if (this._startHandler) {
            await this._startHandler();
        }
    }
    async onStop() {
        if (this._stopHandler) {
            await this._stopHandler();
        }
    }
    async onCleanup() {
        if (this._cleanupHandler) {
            await this._cleanupHandler();
        }
    }
}
//# sourceMappingURL=base-plugin.js.map