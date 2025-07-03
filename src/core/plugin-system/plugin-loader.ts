/**
 * Plugin Loader System
 * 
 * Handles dynamic loading and lifecycle management of plugins
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import type { 
  IPlugin, 
  PluginLoadResult, 
  PluginDiscoveryResult, 
  PluginContext,
  PluginConfig,
  PluginLoaderConfig,
  PluginAPI,
  HookType,
  HookHandler,
  HookContext
} from './types.js';
import { Logger } from '../../utils/logger/index.js';

/**
 * Plugin loader implementation
 */
export class PluginLoader extends EventEmitter {
  private readonly logger: Logger;
  private readonly loadedModules: Map<string, any> = new Map();
  private readonly pluginInstances: Map<string, IPlugin> = new Map();
  private readonly hooks: Map<HookType, Map<IPlugin, HookHandler[]>> = new Map();
  private readonly services: Map<string, any> = new Map();

  constructor(
    private readonly config: PluginLoaderConfig,
    logger?: Logger
  ) {
    super();
    this.logger = logger || new Logger('PluginLoader');
  }

  /**
   * Load a plugin from discovery result
   */
  async loadPlugin(discoveryResult: PluginDiscoveryResult): Promise<PluginLoadResult> {
    const startTime = Date.now();
    const result: PluginLoadResult = {
      errors: [],
      warnings: [],
      success: false,
      duration: 0
    };

    try {
      if (!discoveryResult.isValid) {
        result.errors.push(...discoveryResult.errors);
        return result;
      }

      const { manifest, pluginDir } = discoveryResult;
      
      this.logger.info(`Loading plugin: ${manifest.name}`, { 
        id: manifest.id, 
        version: manifest.version 
      });

      // Check if plugin is already loaded
      if (this.pluginInstances.has(manifest.id)) {
        result.warnings.push(`Plugin ${manifest.id} is already loaded`);
        const existingPlugin = this.pluginInstances.get(manifest.id);
        if (existingPlugin) {
          result.plugin = existingPlugin;
        }
        result.success = true;
        return result;
      }

      // Load plugin module
      const pluginModule = await this._loadPluginModule(pluginDir, manifest);
      
      // Create plugin instance
      const plugin = await this._createPluginInstance(pluginModule, manifest);
      
      // Create plugin context
      const context = await this._createPluginContext(manifest, pluginDir);
      
      // Initialize plugin
      await this._initializePlugin(plugin, context);
      
      // Store plugin instance
      this.pluginInstances.set(manifest.id, plugin);
      this.loadedModules.set(manifest.id, pluginModule);
      
      result.plugin = plugin;
      result.success = true;
      
      this.logger.info(`Plugin loaded successfully: ${manifest.name}`);
      this.emit('plugin.loaded', plugin);
      
    } catch (error) {
      this.logger.error(`Failed to load plugin: ${discoveryResult.manifest.name}`, error);
      result.errors.push((error as Error).message);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.pluginInstances.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not loaded`);
    }

    this.logger.info(`Unloading plugin: ${plugin.metadata.name}`);

    try {
      // Stop plugin if running
      if (plugin.state === 'started') {
        await plugin.stop();
      }

      // Cleanup plugin
      await plugin.cleanup();

      // Remove hooks
      this._removePluginHooks(plugin);

      // Remove from maps
      this.pluginInstances.delete(pluginId);
      this.loadedModules.delete(pluginId);

      this.logger.info(`Plugin unloaded successfully: ${plugin.metadata.name}`);
      this.emit('plugin.unloaded', plugin);
      
    } catch (error) {
      this.logger.error(`Failed to unload plugin: ${plugin.metadata.name}`, error);
      throw error;
    }
  }

  /**
   * Get loaded plugin by ID
   */
  getPlugin(pluginId: string): IPlugin | null {
    return this.pluginInstances.get(pluginId) || null;
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): IPlugin[] {
    return Array.from(this.pluginInstances.values());
  }

  /**
   * Create plugin API for context
   */
  createPluginAPI(plugin: IPlugin): PluginAPI {
    return {
      registerHook: (type: HookType, handler: HookHandler) => {
        this._registerHook(type, plugin, handler);
      },
      
      unregisterHook: (type: HookType, handler: HookHandler) => {
        this._unregisterHook(type, plugin, handler);
      },
      
      emitHook: async (type: HookType, data: any) => {
        return await this._emitHook(type, data, plugin);
      },
      
      getPlugin: (id: string) => {
        return this.getPlugin(id);
      },
      
      getPlugins: () => {
        return this.getPlugins();
      },
      
      getHostConfig: () => {
        return this.config;
      },
      
      registerService: (name: string, service: any) => {
        this.services.set(name, service);
        this.logger.debug(`Service registered: ${name} by ${plugin.metadata.name}`);
      },
      
      getService: (name: string) => {
        return this.services.get(name);
      },
      
      log: (level: string, message: string, meta?: any) => {
        const logger = this.logger as any;
        if (typeof logger[level] === 'function') {
          logger[level](`[${plugin.metadata.name}] ${message}`, meta);
        }
      }
    };
  }

  // Private methods

  private async _loadPluginModule(pluginDir: string, manifest: any): Promise<any> {
    const mainFile = manifest.main || 'index.js';
    const mainPath = path.resolve(pluginDir, mainFile);

    try {
      // Check if main file exists
      await fs.access(mainPath);

      // Clear require cache to allow reloading
      if (require.cache[mainPath]) {
        delete require.cache[mainPath];
      }

      // Use require for CommonJS modules
      const pluginModule = require(mainPath);

      return pluginModule;
    } catch (error) {
      throw new Error(`Failed to load plugin module: ${(error as Error).message}`);
    }
  }

  private async _createPluginInstance(pluginModule: any, manifest: any): Promise<IPlugin> {
    try {
      // Get the plugin class (could be default export or named export)
      let PluginClass = pluginModule.default || pluginModule;

      // Handle module.exports = Class syntax
      if (typeof PluginClass === 'object' && PluginClass.default) {
        PluginClass = PluginClass.default;
      }

      if (typeof PluginClass !== 'function') {
        throw new Error('Plugin module must export a class or constructor function');
      }

      // Create plugin metadata
      const metadata = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        keywords: manifest.keywords || [],
        homepage: manifest.homepage,
        repository: manifest.repository,
        license: manifest.license
      };

      // Create plugin instance
      const plugin = new PluginClass(metadata);

      if (!plugin || typeof plugin.initialize !== 'function') {
        throw new Error('Plugin must implement IPlugin interface');
      }

      return plugin;
    } catch (error) {
      throw new Error(`Failed to create plugin instance: ${(error as Error).message}`);
    }
  }

  private async _createPluginContext(manifest: any, pluginDir: string): Promise<PluginContext> {
    // Create plugin data directory
    const dataDir = path.join(this.config.dataDir, manifest.id);
    await fs.mkdir(dataDir, { recursive: true });

    // Create assets directory if specified
    let assetsDir: string | undefined;
    if (manifest.assets) {
      assetsDir = path.join(pluginDir, manifest.assets);
    }

    // Get plugin configuration
    const config: PluginConfig = {
      enabled: true,
      config: manifest.defaultConfig || {},
      priority: 'medium',
      timeout: this.config.loadTimeout,
      autoStart: true
    };

    // Create plugin-specific logger
    const pluginLogger = new Logger(`Plugin:${manifest.name}`);

    const context: PluginContext = {
      metadata: manifest,
      config,
      logger: pluginLogger,
      dataDir,
      assetsDir: assetsDir || '',
      api: {} as PluginAPI, // Will be set after plugin instance creation
      events: new EventEmitter()
    };

    return context;
  }

  private async _initializePlugin(plugin: IPlugin, context: PluginContext): Promise<void> {
    // Set the API in context
    context.api = this.createPluginAPI(plugin);
    
    // Initialize plugin with timeout
    const timeout = this.config.initTimeout;
    const initPromise = plugin.initialize(context);
    
    if (timeout > 0) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plugin initialization timeout')), timeout);
      });
      
      await Promise.race([initPromise, timeoutPromise]);
    } else {
      await initPromise;
    }
  }

  private _registerHook(type: HookType, plugin: IPlugin, handler: HookHandler): void {
    if (!this.hooks.has(type)) {
      this.hooks.set(type, new Map());
    }
    
    const typeHooks = this.hooks.get(type)!;
    if (!typeHooks.has(plugin)) {
      typeHooks.set(plugin, []);
    }
    
    typeHooks.get(plugin)!.push(handler);
    this.emit('hook.registered', type, plugin);
  }

  private _unregisterHook(type: HookType, plugin: IPlugin, handler: HookHandler): void {
    const typeHooks = this.hooks.get(type);
    if (!typeHooks) return;
    
    const pluginHooks = typeHooks.get(plugin);
    if (!pluginHooks) return;
    
    const index = pluginHooks.indexOf(handler);
    if (index !== -1) {
      pluginHooks.splice(index, 1);
      this.emit('hook.unregistered', type, plugin);
    }
  }

  private async _emitHook(type: HookType, data: any, emittingPlugin: IPlugin): Promise<any> {
    const typeHooks = this.hooks.get(type);
    if (!typeHooks) return data;

    let result = data;
    const startTime = Date.now();

    for (const [plugin, handlers] of typeHooks) {
      for (const handler of handlers) {
        try {
          const context: HookContext = {
            type,
            plugin,
            metadata: {
              timestamp: new Date(),
              executionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
          };

          const handlerResult = await handler(result, context);
          if (handlerResult !== undefined) {
            result = handlerResult;
          }
        } catch (error) {
          this.logger.error(`Hook handler error in plugin ${plugin.metadata.name}`, error);
        }
      }
    }

    const duration = Date.now() - startTime;
    this.emit('hook.executed', type, emittingPlugin, duration);

    return result;
  }

  private _removePluginHooks(plugin: IPlugin): void {
    for (const [type, typeHooks] of this.hooks) {
      typeHooks.delete(plugin);
      if (typeHooks.size === 0) {
        this.hooks.delete(type);
      }
    }
  }
}
