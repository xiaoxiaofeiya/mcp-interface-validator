/**
 * Plugin Loader System
 *
 * Handles dynamic loading and lifecycle management of plugins
 */
import { EventEmitter } from 'events';
import type { IPlugin, PluginLoadResult, PluginDiscoveryResult, PluginLoaderConfig, PluginAPI } from './types.js';
import { Logger } from '../../utils/logger/index.js';
/**
 * Plugin loader implementation
 */
export declare class PluginLoader extends EventEmitter {
    private readonly config;
    private readonly logger;
    private readonly loadedModules;
    private readonly pluginInstances;
    private readonly hooks;
    private readonly services;
    constructor(config: PluginLoaderConfig, logger?: Logger);
    /**
     * Load a plugin from discovery result
     */
    loadPlugin(discoveryResult: PluginDiscoveryResult): Promise<PluginLoadResult>;
    /**
     * Unload a plugin
     */
    unloadPlugin(pluginId: string): Promise<void>;
    /**
     * Get loaded plugin by ID
     */
    getPlugin(pluginId: string): IPlugin | null;
    /**
     * Get all loaded plugins
     */
    getPlugins(): IPlugin[];
    /**
     * Create plugin API for context
     */
    createPluginAPI(plugin: IPlugin): PluginAPI;
    private _loadPluginModule;
    private _createPluginInstance;
    private _createPluginContext;
    private _initializePlugin;
    private _registerHook;
    private _unregisterHook;
    private _emitHook;
    private _removePluginHooks;
}
//# sourceMappingURL=plugin-loader.d.ts.map