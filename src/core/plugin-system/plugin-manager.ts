/**
 * Plugin Manager
 * 
 * Central management system for plugin lifecycle and coordination
 */

import { EventEmitter } from 'events';
import type {
  IPluginManager,
  IPlugin,
  PluginDiscoveryResult,
  PluginLoadResult,
  PluginLoaderConfig,
  PluginState,
  PluginManagerStats,
  PluginManifest
} from './types.js';
import { PluginDiscovery } from './plugin-discovery.js';
import { PluginLoader } from './plugin-loader.js';
import { Logger } from '../../utils/logger/index.js';

/**
 * Plugin manager implementation
 */
export class PluginManager extends EventEmitter implements IPluginManager {
  private readonly logger: Logger;
  private readonly discovery: PluginDiscovery;
  private readonly loader: PluginLoader;
  private readonly plugins: Map<string, IPlugin> = new Map();
  private readonly _discoveredPlugins: Map<string, PluginDiscoveryResult> = new Map();
  private isInitialized = false;

  constructor(
    private readonly config: PluginLoaderConfig,
    logger?: Logger
  ) {
    super();
    this.logger = logger || new Logger('PluginManager');
    this.discovery = new PluginDiscovery(config, this.logger);
    this.loader = new PluginLoader(config, this.logger);

    // Forward events from discovery and loader
    this._setupEventForwarding();
  }

  /**
   * Initialize plugin manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing plugin manager');

    try {
      // Start plugin discovery
      await this.discoverPlugins();

      // Start file watcher if auto-reload is enabled
      if (this.config.autoReload) {
        await this.discovery.watchPlugins();
      }

      this.isInitialized = true;
      this.logger.info('Plugin manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize plugin manager', error);
      throw error;
    }
  }

  /**
   * Discover plugins in configured directories
   */
  async discoverPlugins(): Promise<PluginDiscoveryResult[]> {
    this.logger.info('Discovering plugins');

    try {
      const results = await this.discovery.discoverPlugins();
      
      // Update discovered plugins map (include both valid and invalid plugins)
      this._discoveredPlugins.clear();
      for (const result of results) {
        // Store all discovered plugins, even invalid ones
        // This allows us to attempt loading and provide proper error messages
        if (result.manifest && result.manifest.id) {
          this._discoveredPlugins.set(result.manifest.id, result);
        }
      }

      this.logger.info(`Discovered ${results.filter(r => r.isValid).length} valid plugins`);
      return results;
    } catch (error) {
      this.logger.error('Plugin discovery failed', error);
      throw error;
    }
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(id: string): Promise<PluginLoadResult> {
    const discoveryResult = this._discoveredPlugins.get(id);
    if (!discoveryResult) {
      throw new Error(`Plugin ${id} not found. Run discoverPlugins() first.`);
    }

    this.logger.info(`Loading plugin: ${id}`);

    // Check if plugin is valid before attempting to load
    if (!discoveryResult.isValid) {
      return {
        success: false,
        errors: discoveryResult.errors || ['Plugin is invalid'],
        warnings: [],
        duration: 0
      } as PluginLoadResult;
    }

    try {
      const result = await this.loader.loadPlugin(discoveryResult);

      if (result.success && result.plugin) {
        this.plugins.set(id, result.plugin);
        this._setupPluginEventHandlers(result.plugin);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to load plugin: ${id}`, error);
      throw error;
    }
  }

  /**
   * Load all discovered plugins
   */
  async loadAllPlugins(): Promise<PluginLoadResult[]> {
    this.logger.info('Loading all discovered plugins');

    const results: PluginLoadResult[] = [];
    const pluginIds = Array.from(this._discoveredPlugins.keys());

    // Sort plugins by priority and dependencies
    const sortedIds = await this._sortPluginsByDependencies(pluginIds);

    for (const id of sortedIds) {
      try {
        const result = await this.loadPlugin(id);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to load plugin: ${id}`, error);
        results.push({
          errors: [(error as Error).message],
          warnings: [],
          success: false,
          duration: 0
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.info(`Loaded ${successCount} out of ${results.length} plugins`);

    return results;
  }

  /**
   * Start a specific plugin
   */
  async startPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} is not loaded`);
    }

    if (plugin.state === 'started') {
      this.logger.warn(`Plugin ${id} is already started`);
      return;
    }

    this.logger.info(`Starting plugin: ${id}`);

    try {
      await plugin.start();
      this.logger.info(`Plugin started successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to start plugin: ${id}`, error);
      throw error;
    }
  }

  /**
   * Start all loaded plugins
   */
  async startAllPlugins(): Promise<void> {
    this.logger.info('Starting all loaded plugins');

    const plugins = Array.from(this.plugins.values());
    const startPromises = plugins
      .filter(plugin => plugin.state === 'initialized')
      .map(plugin => this.startPlugin(plugin.metadata.id));

    await Promise.allSettled(startPromises);
  }

  /**
   * Stop a specific plugin
   */
  async stopPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} is not loaded`);
    }

    if (plugin.state !== 'started') {
      this.logger.warn(`Plugin ${id} is not started`);
      return;
    }

    this.logger.info(`Stopping plugin: ${id}`);

    try {
      await plugin.stop();
      this.logger.info(`Plugin stopped successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to stop plugin: ${id}`, error);
      throw error;
    }
  }

  /**
   * Stop all plugins
   */
  async stopAllPlugins(): Promise<void> {
    this.logger.info('Stopping all plugins');

    const plugins = Array.from(this.plugins.values());
    const stopPromises = plugins
      .filter(plugin => plugin.state === 'started')
      .map(plugin => this.stopPlugin(plugin.metadata.id));

    await Promise.allSettled(stopPromises);
  }

  /**
   * Unload a specific plugin
   */
  async unloadPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} is not loaded`);
    }

    this.logger.info(`Unloading plugin: ${id}`);

    try {
      await this.loader.unloadPlugin(id);
      this.plugins.delete(id);
      this.logger.info(`Plugin unloaded successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to unload plugin: ${id}`, error);
      throw error;
    }
  }

  /**
   * Unload all plugins
   */
  async unloadAllPlugins(): Promise<void> {
    this.logger.info('Unloading all plugins');

    const pluginIds = Array.from(this.plugins.keys());
    for (const id of pluginIds) {
      try {
        await this.unloadPlugin(id);
      } catch (error) {
        this.logger.error(`Failed to unload plugin: ${id}`, error);
      }
    }
  }

  /**
   * Get plugin by ID
   */
  getPlugin(id: string): IPlugin | null {
    return this.plugins.get(id) || null;
  }

  /**
   * Get all plugins
   */
  getPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by state
   */
  getPluginsByState(state: PluginState): IPlugin[] {
    return this.getPlugins().filter(plugin => plugin.state === state);
  }

  /**
   * Get plugin manager statistics
   */
  getStats(): PluginManagerStats {
    const plugins = this.getPlugins();
    const stateBreakdown: Record<PluginState, number> = {
      unloaded: 0, loading: 0, loaded: 0, initializing: 0, initialized: 0,
      starting: 0, started: 0, stopping: 0, stopped: 0, error: 0, disabled: 0
    };

    plugins.forEach(plugin => {
      stateBreakdown[plugin.state]++;
    });

    return {
      totalDiscovered: this._discoveredPlugins.size,
      totalLoaded: plugins.length,
      totalStarted: stateBreakdown.started,
      totalErrors: stateBreakdown.error,
      stateBreakdown,
      performance: {
        averageLoadTime: 0, // Would be calculated from actual metrics
        averageInitTime: 0,
        averageStartTime: 0
      }
    };
  }

  /**
   * Reload a specific plugin
   */
  async reloadPlugin(id: string): Promise<PluginLoadResult> {
    this.logger.info(`Reloading plugin: ${id}`);

    try {
      // Unload if currently loaded
      if (this.plugins.has(id)) {
        await this.unloadPlugin(id);
      }

      // Rediscover the plugin
      await this.discoverPlugins();

      // Load the plugin again
      return await this.loadPlugin(id);
    } catch (error) {
      this.logger.error(`Failed to reload plugin: ${id}`, error);
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(id: string): Promise<void> {
    // Implementation would update plugin configuration
    this.logger.info(`Enabling plugin: ${id}`);
    // This would typically update the plugin's enabled state in configuration
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(id: string): Promise<void> {
    // Implementation would update plugin configuration and stop the plugin
    this.logger.info(`Disabling plugin: ${id}`);
    
    if (this.plugins.has(id)) {
      await this.stopPlugin(id);
    }
  }

  /**
   * Validate plugin
   */
  async validatePlugin(manifest: PluginManifest): Promise<string[]> {
    return await this.discovery.validateManifest(manifest);
  }

  // Private methods

  private _setupEventForwarding(): void {
    // Forward discovery events
    this.discovery.on('plugin.discovered', (result) => {
      this.emit('plugin.discovered', result);
    });

    // Forward loader events
    this.loader.on('plugin.loaded', (plugin) => {
      this.emit('plugin.loaded', plugin);
    });

    this.loader.on('hook.registered', (type, plugin) => {
      this.emit('hook.registered', type, plugin);
    });

    this.loader.on('hook.executed', (type, plugin, duration) => {
      this.emit('hook.executed', type, plugin, duration);
    });
  }

  private _setupPluginEventHandlers(_plugin: IPlugin): void {
    // 简化事件处理，避免类型问题
    // TODO: 实现插件事件监听
  }

  private async _sortPluginsByDependencies(pluginIds: string[]): Promise<string[]> {
    // Simple topological sort based on dependencies
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving plugin: ${id}`);
      }

      visiting.add(id);

      const discoveryResult = this._discoveredPlugins.get(id);
      if (discoveryResult?.manifest.dependencies) {
        for (const dep of discoveryResult.manifest.dependencies) {
          if (pluginIds.includes(dep.id)) {
            visit(dep.id);
          }
        }
      }

      visiting.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    for (const id of pluginIds) {
      visit(id);
    }

    return sorted;
  }
}
