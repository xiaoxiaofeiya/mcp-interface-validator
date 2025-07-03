/**
 * Base Plugin Implementation
 *
 * Provides a base class for plugin development with common functionality
 */
import { EventEmitter } from 'events';
import type { IPlugin, PluginMetadata, PluginState, PluginContext, PluginConfig, PluginHealth, HookType, HookHandler } from './types';
/**
 * Abstract base plugin class
 */
export declare abstract class BasePlugin extends EventEmitter implements IPlugin {
    readonly metadata: PluginMetadata;
    protected _state: PluginState;
    protected _context: PluginContext;
    protected _startTime?: Date;
    protected _errors: Error[];
    protected _hooks: Map<HookType, HookHandler[]>;
    constructor(metadata: PluginMetadata);
    /**
     * Get current plugin state
     */
    get state(): PluginState;
    /**
     * Get plugin context
     */
    get context(): PluginContext;
    /**
     * Initialize plugin with context
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Start plugin
     */
    start(): Promise<void>;
    /**
     * Stop plugin
     */
    stop(): Promise<void>;
    /**
     * Cleanup plugin resources
     */
    cleanup(): Promise<void>;
    /**
     * Get plugin health status
     */
    getHealth(): PluginHealth;
    /**
     * Handle configuration changes
     */
    onConfigChange(config: PluginConfig): Promise<void>;
    /**
     * Register a hook handler
     */
    protected registerHook(type: HookType, handler: HookHandler): void;
    /**
     * Unregister a hook handler
     */
    protected unregisterHook(type: HookType, handler: HookHandler): void;
    /**
     * Emit a hook event
     */
    protected emitHook(type: HookType, data: any): Promise<any>;
    /**
     * Get a service from the host
     */
    protected getService(name: string): any;
    /**
     * Register a service with the host
     */
    protected registerService(name: string, service: any): void;
    /**
     * Log a message
     */
    protected _log(level: string, message: string, meta?: any): void;
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
    protected onConfigurationChange(_config: PluginConfig): Promise<void>;
    private _setState;
    private _validateMetadata;
    private _addError;
    private _getHealthStatus;
    private _getHealthMessage;
    private _getHealthMetrics;
}
/**
 * Simple plugin implementation for basic use cases
 */
export declare class SimplePlugin extends BasePlugin {
    private _initHandler;
    private _startHandler;
    private _stopHandler;
    private _cleanupHandler;
    constructor(metadata: PluginMetadata, handlers?: {
        onInitialize?: () => Promise<void>;
        onStart?: () => Promise<void>;
        onStop?: () => Promise<void>;
        onCleanup?: () => Promise<void>;
    });
    protected onInitialize(): Promise<void>;
    protected onStart(): Promise<void>;
    protected onStop(): Promise<void>;
    protected onCleanup(): Promise<void>;
}
//# sourceMappingURL=base-plugin.d.ts.map