/**
 * Plugin System Main Entry Point
 *
 * Exports all plugin system components and provides factory functions
 */
export type { IPlugin, IPluginManager, PluginMetadata, PluginState, PluginContext, PluginConfig, PluginManifest, PluginHealth, PluginAPI, PluginDiscoveryResult, PluginLoadResult, PluginLoaderConfig, PluginManagerStats, PluginEvents, PluginDependency, PluginPriority, HookType, HookHandler, HookContext } from './types.js';
export { BasePlugin, SimplePlugin } from './base-plugin.js';
export { PluginDiscovery } from './plugin-discovery.js';
export { PluginLoader } from './plugin-loader.js';
export { PluginManager } from './plugin-manager.js';
import type { PluginLoaderConfig } from './types.js';
import { PluginManager } from './plugin-manager.js';
import { Logger } from '../../utils/logger/index.js';
/**
 * Default plugin system configuration
 */
export declare const DEFAULT_PLUGIN_CONFIG: PluginLoaderConfig;
/**
 * Create a plugin manager with default configuration
 */
export declare function createPluginManager(config?: Partial<PluginLoaderConfig>, logger?: Logger): PluginManager;
/**
 * Plugin system factory with common configurations
 */
export declare class PluginSystemFactory {
    /**
     * Create a development plugin system
     */
    static createDevelopment(pluginsDir?: string, logger?: Logger): PluginManager;
    /**
     * Create a production plugin system
     */
    static createProduction(pluginsDir?: string, logger?: Logger): PluginManager;
    /**
     * Create a testing plugin system
     */
    static createTesting(pluginsDir?: string, logger?: Logger): PluginManager;
}
/**
 * Plugin utilities
 */
export declare class PluginUtils {
    /**
     * Validate plugin metadata
     */
    static validateMetadata(metadata: any): string[];
    /**
     * Compare plugin versions
     */
    static compareVersions(a: string, b: string): number;
    /**
     * Check if version satisfies range
     */
    static satisfiesVersion(version: string, range: string): boolean;
    /**
     * Generate plugin manifest template
     */
    static generateManifestTemplate(id: string, name: string): any;
    /**
     * Create plugin directory structure
     */
    static createPluginStructure(pluginDir: string, manifest: any): Promise<void>;
}
/**
 * Plugin system events
 */
export declare const PLUGIN_EVENTS: {
    readonly DISCOVERED: "plugin.discovered";
    readonly LOADING: "plugin.loading";
    readonly LOADED: "plugin.loaded";
    readonly INITIALIZING: "plugin.initializing";
    readonly INITIALIZED: "plugin.initialized";
    readonly STARTING: "plugin.starting";
    readonly STARTED: "plugin.started";
    readonly STOPPING: "plugin.stopping";
    readonly STOPPED: "plugin.stopped";
    readonly ERROR: "plugin.error";
    readonly STATE_CHANGED: "plugin.stateChanged";
    readonly HOOK_REGISTERED: "hook.registered";
    readonly HOOK_UNREGISTERED: "hook.unregistered";
    readonly HOOK_EXECUTED: "hook.executed";
};
/**
 * Plugin hook types
 */
export declare const HOOK_TYPES: {
    readonly VALIDATION_BEFORE: "validation.before";
    readonly VALIDATION_AFTER: "validation.after";
    readonly VALIDATION_ERROR: "validation.error";
    readonly PARSING_BEFORE: "parsing.before";
    readonly PARSING_AFTER: "parsing.after";
    readonly PARSING_ERROR: "parsing.error";
    readonly REPORT_BEFORE: "report.before";
    readonly REPORT_AFTER: "report.after";
    readonly SERVER_START: "server.start";
    readonly SERVER_STOP: "server.stop";
    readonly CONFIG_CHANGE: "config.change";
    readonly CUSTOM: "custom";
};
/**
 * Plugin states
 */
export declare const PLUGIN_STATES: {
    readonly UNLOADED: "unloaded";
    readonly LOADING: "loading";
    readonly LOADED: "loaded";
    readonly INITIALIZING: "initializing";
    readonly INITIALIZED: "initialized";
    readonly STARTING: "starting";
    readonly STARTED: "started";
    readonly STOPPING: "stopping";
    readonly STOPPED: "stopped";
    readonly ERROR: "error";
    readonly DISABLED: "disabled";
};
//# sourceMappingURL=index.d.ts.map