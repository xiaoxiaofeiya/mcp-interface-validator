/**
 * Base Plugin Implementation
 * 
 * Provides a base class for plugin development with common functionality
 */

import { EventEmitter } from 'events';
import type { 
  IPlugin, 
  PluginMetadata, 
  PluginState, 
  PluginContext, 
  PluginConfig,
  PluginHealth,
  HookType,
  HookHandler
} from './types.js';

/**
 * Abstract base plugin class
 */
export abstract class BasePlugin extends EventEmitter implements IPlugin {
  protected _state: PluginState = 'unloaded';
  protected _context!: PluginContext;
  protected _startTime?: Date;
  protected _errors: Error[] = [];
  protected _hooks: Map<HookType, HookHandler[]> = new Map();

  constructor(
    public readonly metadata: PluginMetadata
  ) {
    super();
    this.setMaxListeners(50); // Allow many hook listeners
  }

  /**
   * Get current plugin state
   */
  get state(): PluginState {
    return this._state;
  }

  /**
   * Get plugin context
   */
  get context(): PluginContext {
    return this._context;
  }

  /**
   * Initialize plugin with context
   */
  async initialize(context: PluginContext): Promise<void> {
    this._setState('initializing');
    this._context = context;
    
    try {
      // Validate plugin metadata
      this._validateMetadata();
      
      // Initialize plugin-specific logic
      await this.onInitialize();
      
      this._setState('initialized');
      this._log('info', `Plugin ${this.metadata.name} initialized successfully`);
    } catch (error) {
      this._setState('error');
      this._addError(error as Error);
      throw error;
    }
  }

  /**
   * Start plugin
   */
  async start(): Promise<void> {
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
    } catch (error) {
      this._setState('error');
      this._addError(error as Error);
      throw error;
    }
  }

  /**
   * Stop plugin
   */
  async stop(): Promise<void> {
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
    } catch (error) {
      this._setState('error');
      this._addError(error as Error);
      throw error;
    }
  }

  /**
   * Cleanup plugin resources
   */
  async cleanup(): Promise<void> {
    try {
      // Unregister all hooks
      this._hooks.clear();
      
      // Cleanup plugin-specific resources
      await this.onCleanup();
      
      // Remove all event listeners
      this.removeAllListeners();
      
      this._setState('unloaded');
      this._log('info', `Plugin ${this.metadata.name} cleaned up successfully`);
    } catch (error) {
      this._addError(error as Error);
      throw error;
    }
  }

  /**
   * Get plugin health status
   */
  getHealth(): PluginHealth {
    const health: PluginHealth = {
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
  async onConfigChange(config: PluginConfig): Promise<void> {
    try {
      this._log('info', `Plugin ${this.metadata.name} configuration changed`);
      await this.onConfigurationChange(config);
    } catch (error) {
      this._addError(error as Error);
      throw error;
    }
  }

  /**
   * Register a hook handler
   */
  protected registerHook(type: HookType, handler: HookHandler): void {
    if (!this._context) {
      throw new Error('Plugin not initialized');
    }

    this._context.api.registerHook(type, handler);
    
    // Track locally for cleanup
    if (!this._hooks.has(type)) {
      this._hooks.set(type, []);
    }
    this._hooks.get(type)!.push(handler);
    
    this._log('debug', `Registered hook: ${type}`);
  }

  /**
   * Unregister a hook handler
   */
  protected unregisterHook(type: HookType, handler: HookHandler): void {
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
  protected async emitHook(type: HookType, data: any): Promise<any> {
    if (!this._context) {
      throw new Error('Plugin not initialized');
    }

    return await this._context.api.emitHook(type, data);
  }

  /**
   * Get a service from the host
   */
  protected getService(name: string): any {
    if (!this._context) {
      throw new Error('Plugin not initialized');
    }

    return this._context.api.getService(name);
  }

  /**
   * Register a service with the host
   */
  protected registerService(name: string, service: any): void {
    if (!this._context) {
      throw new Error('Plugin not initialized');
    }

    this._context.api.registerService(name, service);
    this._log('debug', `Registered service: ${name}`);
  }

  /**
   * Log a message
   */
  protected _log(level: string, message: string, meta?: any): void {
    if (this._context && this._context.logger) {
      const logger = this._context.logger as any;
      if (typeof logger[level] === 'function') {
        logger[level](`[${this.metadata.name}] ${message}`, meta);
      }
    }
  }

  // Abstract methods to be implemented by concrete plugins

  /**
   * Plugin-specific initialization logic
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Plugin-specific start logic
   */
  protected abstract onStart(): Promise<void>;

  /**
   * Plugin-specific stop logic
   */
  protected abstract onStop(): Promise<void>;

  /**
   * Plugin-specific cleanup logic
   */
  protected abstract onCleanup(): Promise<void>;

  /**
   * Handle configuration changes (optional)
   */
  protected async onConfigurationChange(_config: PluginConfig): Promise<void> {
    // Default implementation - override if needed
  }

  // Private helper methods

  private _setState(newState: PluginState): void {
    const oldState = this._state;
    this._state = newState;
    this.emit('stateChanged', oldState, newState);
  }

  private _validateMetadata(): void {
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

  private _addError(error: Error): void {
    this._errors.push(error);
    // Keep only last 10 errors
    if (this._errors.length > 10) {
      this._errors = this._errors.slice(-10);
    }
  }

  private _getHealthStatus(): 'healthy' | 'warning' | 'error' | 'unknown' {
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

  private _getHealthMessage(): string {
    if (this._errors.length > 0) {
      return `Plugin has ${this._errors.length} error(s)`;
    }
    return `Plugin is in ${this._state} state`;
  }

  private _getHealthMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {
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
  private _initHandler: (() => Promise<void>) | undefined;
  private _startHandler: (() => Promise<void>) | undefined;
  private _stopHandler: (() => Promise<void>) | undefined;
  private _cleanupHandler: (() => Promise<void>) | undefined;

  constructor(
    metadata: PluginMetadata,
    handlers: {
      onInitialize?: () => Promise<void>;
      onStart?: () => Promise<void>;
      onStop?: () => Promise<void>;
      onCleanup?: () => Promise<void>;
    } = {}
  ) {
    super(metadata);
    this._initHandler = handlers.onInitialize;
    this._startHandler = handlers.onStart;
    this._stopHandler = handlers.onStop;
    this._cleanupHandler = handlers.onCleanup;
  }

  protected async onInitialize(): Promise<void> {
    if (this._initHandler) {
      await this._initHandler();
    }
  }

  protected async onStart(): Promise<void> {
    if (this._startHandler) {
      await this._startHandler();
    }
  }

  protected async onStop(): Promise<void> {
    if (this._stopHandler) {
      await this._stopHandler();
    }
  }

  protected async onCleanup(): Promise<void> {
    if (this._cleanupHandler) {
      await this._cleanupHandler();
    }
  }
}
