/**
 * Plugin Loader System
 *
 * Handles dynamic loading and lifecycle management of plugins
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index.js';
/**
 * Plugin loader implementation
 */
export class PluginLoader extends EventEmitter {
    config;
    logger;
    loadedModules = new Map();
    pluginInstances = new Map();
    hooks = new Map();
    services = new Map();
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger('PluginLoader');
    }
    /**
     * Load a plugin from discovery result
     */
    async loadPlugin(discoveryResult) {
        const startTime = Date.now();
        const result = {
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
        }
        catch (error) {
            this.logger.error(`Failed to load plugin: ${discoveryResult.manifest.name}`, error);
            result.errors.push(error.message);
        }
        finally {
            result.duration = Date.now() - startTime;
        }
        return result;
    }
    /**
     * Unload a plugin
     */
    async unloadPlugin(pluginId) {
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
        }
        catch (error) {
            this.logger.error(`Failed to unload plugin: ${plugin.metadata.name}`, error);
            throw error;
        }
    }
    /**
     * Get loaded plugin by ID
     */
    getPlugin(pluginId) {
        return this.pluginInstances.get(pluginId) || null;
    }
    /**
     * Get all loaded plugins
     */
    getPlugins() {
        return Array.from(this.pluginInstances.values());
    }
    /**
     * Create plugin API for context
     */
    createPluginAPI(plugin) {
        return {
            registerHook: (type, handler) => {
                this._registerHook(type, plugin, handler);
            },
            unregisterHook: (type, handler) => {
                this._unregisterHook(type, plugin, handler);
            },
            emitHook: async (type, data) => {
                return await this._emitHook(type, data, plugin);
            },
            getPlugin: (id) => {
                return this.getPlugin(id);
            },
            getPlugins: () => {
                return this.getPlugins();
            },
            getHostConfig: () => {
                return this.config;
            },
            registerService: (name, service) => {
                this.services.set(name, service);
                this.logger.debug(`Service registered: ${name} by ${plugin.metadata.name}`);
            },
            getService: (name) => {
                return this.services.get(name);
            },
            log: (level, message, meta) => {
                const logger = this.logger;
                if (typeof logger[level] === 'function') {
                    logger[level](`[${plugin.metadata.name}] ${message}`, meta);
                }
            }
        };
    }
    // Private methods
    async _loadPluginModule(pluginDir, manifest) {
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
        }
        catch (error) {
            throw new Error(`Failed to load plugin module: ${error.message}`);
        }
    }
    async _createPluginInstance(pluginModule, manifest) {
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
        }
        catch (error) {
            throw new Error(`Failed to create plugin instance: ${error.message}`);
        }
    }
    async _createPluginContext(manifest, pluginDir) {
        // Create plugin data directory
        const dataDir = path.join(this.config.dataDir, manifest.id);
        await fs.mkdir(dataDir, { recursive: true });
        // Create assets directory if specified
        let assetsDir;
        if (manifest.assets) {
            assetsDir = path.join(pluginDir, manifest.assets);
        }
        // Get plugin configuration
        const config = {
            enabled: true,
            config: manifest.defaultConfig || {},
            priority: 'medium',
            timeout: this.config.loadTimeout,
            autoStart: true
        };
        // Create plugin-specific logger
        const pluginLogger = new Logger(`Plugin:${manifest.name}`);
        const context = {
            metadata: manifest,
            config,
            logger: pluginLogger,
            dataDir,
            assetsDir: assetsDir || '',
            api: {}, // Will be set after plugin instance creation
            events: new EventEmitter()
        };
        return context;
    }
    async _initializePlugin(plugin, context) {
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
        }
        else {
            await initPromise;
        }
    }
    _registerHook(type, plugin, handler) {
        if (!this.hooks.has(type)) {
            this.hooks.set(type, new Map());
        }
        const typeHooks = this.hooks.get(type);
        if (!typeHooks.has(plugin)) {
            typeHooks.set(plugin, []);
        }
        typeHooks.get(plugin).push(handler);
        this.emit('hook.registered', type, plugin);
    }
    _unregisterHook(type, plugin, handler) {
        const typeHooks = this.hooks.get(type);
        if (!typeHooks)
            return;
        const pluginHooks = typeHooks.get(plugin);
        if (!pluginHooks)
            return;
        const index = pluginHooks.indexOf(handler);
        if (index !== -1) {
            pluginHooks.splice(index, 1);
            this.emit('hook.unregistered', type, plugin);
        }
    }
    async _emitHook(type, data, emittingPlugin) {
        const typeHooks = this.hooks.get(type);
        if (!typeHooks)
            return data;
        let result = data;
        const startTime = Date.now();
        for (const [plugin, handlers] of typeHooks) {
            for (const handler of handlers) {
                try {
                    const context = {
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
                }
                catch (error) {
                    this.logger.error(`Hook handler error in plugin ${plugin.metadata.name}`, error);
                }
            }
        }
        const duration = Date.now() - startTime;
        this.emit('hook.executed', type, emittingPlugin, duration);
        return result;
    }
    _removePluginHooks(plugin) {
        for (const [type, typeHooks] of this.hooks) {
            typeHooks.delete(plugin);
            if (typeHooks.size === 0) {
                this.hooks.delete(type);
            }
        }
    }
}
//# sourceMappingURL=plugin-loader.js.map