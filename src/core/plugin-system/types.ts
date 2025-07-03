/**
 * Plugin System Type Definitions
 * 
 * Defines interfaces and types for the extensible plugin architecture
 */

import { EventEmitter } from 'events';
import type { Logger } from '../../utils/logger/index.js';

/**
 * Plugin lifecycle states
 */
export type PluginState = 
  | 'unloaded'
  | 'loading'
  | 'loaded'
  | 'initializing'
  | 'initialized'
  | 'starting'
  | 'started'
  | 'stopping'
  | 'stopped'
  | 'error'
  | 'disabled';

/**
 * Plugin priority levels for loading order
 */
export type PluginPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Plugin API hook types
 */
export type HookType = 
  | 'validation.before'
  | 'validation.after'
  | 'validation.error'
  | 'parsing.before'
  | 'parsing.after'
  | 'parsing.error'
  | 'report.before'
  | 'report.after'
  | 'server.start'
  | 'server.stop'
  | 'config.change'
  | 'custom';

/**
 * Plugin metadata information
 */
export interface PluginMetadata {
  /** Plugin unique identifier */
  id: string;
  /** Plugin display name */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author information */
  author: string;
  /** Plugin homepage URL */
  homepage?: string;
  /** Plugin repository URL */
  repository?: string;
  /** Plugin license */
  license?: string;
  /** Plugin keywords/tags */
  keywords?: string[];
  /** Minimum host version required */
  minHostVersion?: string;
  /** Maximum host version supported */
  maxHostVersion?: string;
  /** Plugin dependencies */
  dependencies?: PluginDependency[];
  /** Plugin configuration schema */
  configSchema?: any;
  /** Plugin capabilities */
  capabilities?: string[];
  /** Plugin entry point */
  main?: string;
  /** Plugin assets directory */
  assets?: string;
}

/**
 * Plugin dependency specification
 */
export interface PluginDependency {
  /** Dependency plugin ID */
  id: string;
  /** Required version range */
  version: string;
  /** Whether dependency is optional */
  optional?: boolean;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  /** Whether plugin is enabled */
  enabled: boolean;
  /** Plugin-specific configuration */
  config?: Record<string, any>;
  /** Plugin loading priority */
  priority?: PluginPriority;
  /** Plugin loading timeout (ms) */
  timeout?: number;
  /** Whether to auto-start plugin */
  autoStart?: boolean;
}

/**
 * Plugin manifest file structure
 */
export interface PluginManifest extends PluginMetadata {
  /** Plugin configuration defaults */
  defaultConfig?: Record<string, any>;
  /** Plugin permissions required */
  permissions?: string[];
  /** Plugin API version */
  apiVersion?: string;
}

/**
 * Plugin context provided to plugins
 */
export interface PluginContext {
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Plugin configuration */
  config: PluginConfig;
  /** Logger instance */
  logger: Logger;
  /** Plugin data directory */
  dataDir: string;
  /** Plugin assets directory */
  assetsDir?: string;
  /** Host API access */
  api: PluginAPI;
  /** Event emitter for plugin communication */
  events: EventEmitter;
}

/**
 * Plugin API interface for host interaction
 */
export interface PluginAPI {
  /** Register a hook handler */
  registerHook(type: HookType, handler: HookHandler): void;
  /** Unregister a hook handler */
  unregisterHook(type: HookType, handler: HookHandler): void;
  /** Emit a hook event */
  emitHook(type: HookType, data: any): Promise<any>;
  /** Get plugin by ID */
  getPlugin(id: string): IPlugin | null;
  /** Get all loaded plugins */
  getPlugins(): IPlugin[];
  /** Get host configuration */
  getHostConfig(): any;
  /** Register a service */
  registerService(name: string, service: any): void;
  /** Get a service */
  getService(name: string): any;
  /** Log message */
  log(level: string, message: string, meta?: any): void;
}

/**
 * Hook handler function signature
 */
export type HookHandler = (data: any, context: HookContext) => Promise<any> | any;

/**
 * Hook execution context
 */
export interface HookContext {
  /** Hook type */
  type: HookType;
  /** Plugin that registered the hook */
  plugin: IPlugin;
  /** Hook execution metadata */
  metadata: {
    timestamp: Date;
    executionId: string;
  };
  /** Cancel hook execution */
  cancel?: () => void;
  /** Skip remaining hooks */
  skip?: () => void;
}

/**
 * Plugin interface that all plugins must implement
 */
export interface IPlugin {
  /** Plugin metadata */
  readonly metadata: PluginMetadata;
  /** Plugin current state */
  readonly state: PluginState;
  /** Plugin context */
  readonly context: PluginContext;

  /** Initialize plugin */
  initialize(context: PluginContext): Promise<void>;
  /** Start plugin */
  start(): Promise<void>;
  /** Stop plugin */
  stop(): Promise<void>;
  /** Cleanup plugin resources */
  cleanup(): Promise<void>;
  /** Get plugin health status */
  getHealth(): PluginHealth;
  /** Handle configuration changes */
  onConfigChange?(config: PluginConfig): Promise<void>;
}

/**
 * Plugin health status
 */
export interface PluginHealth {
  /** Overall health status */
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  /** Health check timestamp */
  timestamp: Date;
  /** Health details */
  details?: {
    message?: string;
    metrics?: Record<string, any>;
    errors?: string[];
  };
}

/**
 * Plugin loader configuration
 */
export interface PluginLoaderConfig {
  /** Plugins directory path */
  pluginsDir: string;
  /** Plugin data directory */
  dataDir: string;
  /** Plugin loading timeout (ms) */
  loadTimeout: number;
  /** Plugin initialization timeout (ms) */
  initTimeout: number;
  /** Plugin start timeout (ms) */
  startTimeout: number;
  /** Whether to enable plugin sandboxing */
  sandboxing: boolean;
  /** Allowed plugin permissions */
  allowedPermissions: string[];
  /** Plugin discovery patterns */
  discoveryPatterns: string[];
  /** Whether to auto-reload plugins on change */
  autoReload: boolean;
  /** Plugin validation settings */
  validation: {
    /** Validate plugin signatures */
    validateSignatures: boolean;
    /** Allowed plugin sources */
    allowedSources: string[];
    /** Security policy */
    securityPolicy: 'strict' | 'moderate' | 'permissive';
  };
}

/**
 * Plugin discovery result
 */
export interface PluginDiscoveryResult {
  /** Plugin manifest path */
  manifestPath: string;
  /** Plugin directory path */
  pluginDir: string;
  /** Plugin manifest data */
  manifest: PluginManifest;
  /** Discovery errors */
  errors: string[];
  /** Whether plugin is valid */
  isValid: boolean;
}

/**
 * Plugin loading result
 */
export interface PluginLoadResult {
  /** Plugin instance */
  plugin?: IPlugin;
  /** Loading errors */
  errors: string[];
  /** Loading warnings */
  warnings: string[];
  /** Whether loading was successful */
  success: boolean;
  /** Loading duration (ms) */
  duration: number;
}

/**
 * Plugin manager statistics
 */
export interface PluginManagerStats {
  /** Total plugins discovered */
  totalDiscovered: number;
  /** Total plugins loaded */
  totalLoaded: number;
  /** Total plugins started */
  totalStarted: number;
  /** Total plugins with errors */
  totalErrors: number;
  /** Plugin states breakdown */
  stateBreakdown: Record<PluginState, number>;
  /** Loading performance metrics */
  performance: {
    averageLoadTime: number;
    averageInitTime: number;
    averageStartTime: number;
  };
}

/**
 * Plugin event types
 */
export interface PluginEvents {
  'plugin.discovered': (result: PluginDiscoveryResult) => void;
  'plugin.loading': (id: string) => void;
  'plugin.loaded': (plugin: IPlugin) => void;
  'plugin.initializing': (plugin: IPlugin) => void;
  'plugin.initialized': (plugin: IPlugin) => void;
  'plugin.starting': (plugin: IPlugin) => void;
  'plugin.started': (plugin: IPlugin) => void;
  'plugin.stopping': (plugin: IPlugin) => void;
  'plugin.stopped': (plugin: IPlugin) => void;
  'plugin.error': (plugin: IPlugin, error: Error) => void;
  'plugin.stateChanged': (plugin: IPlugin, oldState: PluginState, newState: PluginState) => void;
  'hook.registered': (type: HookType, plugin: IPlugin) => void;
  'hook.unregistered': (type: HookType, plugin: IPlugin) => void;
  'hook.executed': (type: HookType, plugin: IPlugin, duration: number) => void;
}

/**
 * Plugin manager interface
 */
export interface IPluginManager extends EventEmitter {
  /** Discover plugins in configured directories */
  discoverPlugins(): Promise<PluginDiscoveryResult[]>;
  /** Load a specific plugin */
  loadPlugin(id: string): Promise<PluginLoadResult>;
  /** Load all discovered plugins */
  loadAllPlugins(): Promise<PluginLoadResult[]>;
  /** Start a specific plugin */
  startPlugin(id: string): Promise<void>;
  /** Start all loaded plugins */
  startAllPlugins(): Promise<void>;
  /** Stop a specific plugin */
  stopPlugin(id: string): Promise<void>;
  /** Stop all plugins */
  stopAllPlugins(): Promise<void>;
  /** Unload a specific plugin */
  unloadPlugin(id: string): Promise<void>;
  /** Unload all plugins */
  unloadAllPlugins(): Promise<void>;
  /** Get plugin by ID */
  getPlugin(id: string): IPlugin | null;
  /** Get all plugins */
  getPlugins(): IPlugin[];
  /** Get plugins by state */
  getPluginsByState(state: PluginState): IPlugin[];
  /** Get plugin manager statistics */
  getStats(): PluginManagerStats;
  /** Reload a specific plugin */
  reloadPlugin(id: string): Promise<PluginLoadResult>;
  /** Enable a plugin */
  enablePlugin(id: string): Promise<void>;
  /** Disable a plugin */
  disablePlugin(id: string): Promise<void>;
  /** Validate plugin */
  validatePlugin(manifest: PluginManifest): Promise<string[]>;
}
