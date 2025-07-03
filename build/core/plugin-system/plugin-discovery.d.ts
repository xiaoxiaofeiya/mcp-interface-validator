/**
 * Plugin Discovery System
 *
 * Handles discovery and validation of plugins in configured directories
 */
import { EventEmitter } from 'events';
import type { PluginDiscoveryResult, PluginManifest, PluginLoaderConfig } from './types';
import { Logger } from '../../utils/logger/index';
/**
 * Plugin discovery service
 */
export declare class PluginDiscovery extends EventEmitter {
    private readonly config;
    private readonly logger;
    constructor(config: PluginLoaderConfig, logger?: Logger);
    /**
     * Discover all plugins in configured directories
     */
    discoverPlugins(): Promise<PluginDiscoveryResult[]>;
    /**
     * Discover a single plugin by directory path
     */
    discoverPlugin(pluginDir: string): Promise<PluginDiscoveryResult>;
    /**
     * Validate plugin manifest
     */
    validateManifest(manifest: PluginManifest): Promise<string[]>;
    /**
     * Watch for plugin changes (if auto-reload is enabled)
     */
    watchPlugins(): Promise<void>;
    private _findPluginDirectories;
    private _discoverPlugin;
    private _ensureDirectory;
    private _fileExists;
    private _isApiVersionCompatible;
    private _isHostVersionCompatible;
    private _compareVersions;
}
//# sourceMappingURL=plugin-discovery.d.ts.map