/**
 * Plugin Manager
 *
 * Central management system for plugin lifecycle and coordination
 */
import { EventEmitter } from 'events';
import type { IPluginManager, IPlugin, PluginDiscoveryResult, PluginLoadResult, PluginLoaderConfig, PluginState, PluginManagerStats, PluginManifest } from './types';
import { Logger } from '../../utils/logger/index';
/**
 * Plugin manager implementation
 */
export declare class PluginManager extends EventEmitter implements IPluginManager {
    private readonly config;
    private readonly logger;
    private readonly discovery;
    private readonly loader;
    private readonly plugins;
    private readonly _discoveredPlugins;
    private isInitialized;
    constructor(config: PluginLoaderConfig, logger?: Logger);
    /**
     * Initialize plugin manager
     */
    initialize(): Promise<void>;
    /**
     * Discover plugins in configured directories
     */
    discoverPlugins(): Promise<PluginDiscoveryResult[]>;
    /**
     * Load a specific plugin
     */
    loadPlugin(id: string): Promise<PluginLoadResult>;
    /**
     * Load all discovered plugins
     */
    loadAllPlugins(): Promise<PluginLoadResult[]>;
    /**
     * Start a specific plugin
     */
    startPlugin(id: string): Promise<void>;
    /**
     * Start all loaded plugins
     */
    startAllPlugins(): Promise<void>;
    /**
     * Stop a specific plugin
     */
    stopPlugin(id: string): Promise<void>;
    /**
     * Stop all plugins
     */
    stopAllPlugins(): Promise<void>;
    /**
     * Unload a specific plugin
     */
    unloadPlugin(id: string): Promise<void>;
    /**
     * Unload all plugins
     */
    unloadAllPlugins(): Promise<void>;
    /**
     * Get plugin by ID
     */
    getPlugin(id: string): IPlugin | null;
    /**
     * Get all plugins
     */
    getPlugins(): IPlugin[];
    /**
     * Get plugins by state
     */
    getPluginsByState(state: PluginState): IPlugin[];
    /**
     * Get plugin manager statistics
     */
    getStats(): PluginManagerStats;
    /**
     * Reload a specific plugin
     */
    reloadPlugin(id: string): Promise<PluginLoadResult>;
    /**
     * Enable a plugin
     */
    enablePlugin(id: string): Promise<void>;
    /**
     * Disable a plugin
     */
    disablePlugin(id: string): Promise<void>;
    /**
     * Validate plugin
     */
    validatePlugin(manifest: PluginManifest): Promise<string[]>;
    private _setupEventForwarding;
    private _setupPluginEventHandlers;
    private _sortPluginsByDependencies;
}
//# sourceMappingURL=plugin-manager.d.ts.map