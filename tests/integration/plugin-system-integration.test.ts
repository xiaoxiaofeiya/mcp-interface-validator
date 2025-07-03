/**
 * Plugin System Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  PluginManager, 
  PluginSystemFactory,
  BasePlugin,
  HOOK_TYPES,
  PLUGIN_EVENTS
} from '../../src/core/plugin-system';
import type { 
  PluginMetadata, 
  PluginContext,
  HookHandler,
  HookContext
} from '../../src/core/plugin-system/types';
import { Logger } from '../../src/utils/logger';

describe('Plugin System Integration', () => {
  let testPluginsDir: string;
  let testDataDir: string;
  let manager: PluginManager;
  let logger: Logger;

  beforeEach(async () => {
    // Create temporary directories for testing
    testPluginsDir = path.join(__dirname, '../../temp/test-plugins');
    testDataDir = path.join(__dirname, '../../temp/test-data');
    
    // Clean up and create fresh directories
    try {
      await fs.rm(testPluginsDir, { recursive: true, force: true });
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore errors if directories don't exist
    }
    
    await fs.mkdir(testPluginsDir, { recursive: true });
    await fs.mkdir(testDataDir, { recursive: true });

    logger = new Logger({ name: 'integration-test', level: 'error' });
    manager = PluginSystemFactory.createTesting(testPluginsDir, logger);
  });

  afterEach(async () => {
    // Cleanup
    try {
      await manager.stopAllPlugins();
      await manager.unloadAllPlugins();
      await fs.rm(testPluginsDir, { recursive: true, force: true });
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Plugin Lifecycle Management', () => {
    it('should discover, load, and start plugins', async () => {
      // Create a test plugin
      await createTestPlugin('test-plugin-1', {
        id: 'test-plugin-1',
        name: 'Test Plugin 1',
        version: '1.0.0',
        description: 'First test plugin',
        author: 'Test Author'
      });

      // Initialize plugin manager
      await manager.initialize();

      // Discover plugins
      const discoveryResults = await manager.discoverPlugins();
      expect(discoveryResults).toHaveLength(1);
      expect(discoveryResults[0].isValid).toBe(true);
      expect(discoveryResults[0].manifest.id).toBe('test-plugin-1');

      // Load plugin
      const loadResult = await manager.loadPlugin('test-plugin-1');
      expect(loadResult.success).toBe(true);
      expect(loadResult.plugin).toBeDefined();

      // Start plugin
      await manager.startPlugin('test-plugin-1');
      const plugin = manager.getPlugin('test-plugin-1');
      expect(plugin?.state).toBe('started');

      // Stop plugin
      await manager.stopPlugin('test-plugin-1');
      expect(plugin?.state).toBe('stopped');
    });

    it('should handle multiple plugins with dependencies', async () => {
      // Create plugin A (no dependencies)
      await createTestPlugin('plugin-a', {
        id: 'plugin-a',
        name: 'Plugin A',
        version: '1.0.0',
        description: 'Base plugin',
        author: 'Test Author'
      });

      // Create plugin B (depends on A)
      await createTestPlugin('plugin-b', {
        id: 'plugin-b',
        name: 'Plugin B',
        version: '1.0.0',
        description: 'Dependent plugin',
        author: 'Test Author',
        dependencies: [
          { id: 'plugin-a', version: '1.0.0' }
        ]
      });

      await manager.initialize();
      const loadResults = await manager.loadAllPlugins();

      expect(loadResults).toHaveLength(2);
      expect(loadResults.every(r => r.success)).toBe(true);

      await manager.startAllPlugins();

      const pluginA = manager.getPlugin('plugin-a');
      const pluginB = manager.getPlugin('plugin-b');

      expect(pluginA?.state).toBe('started');
      expect(pluginB?.state).toBe('started');
    });
  });

  describe('Hook System Integration', () => {
    it('should create plugin system with hook support', async () => {
      // Create a simple plugin for hook testing
      await createTestPlugin('hook-test-plugin', {
        id: 'hook-test-plugin',
        name: 'Hook Test Plugin',
        version: '1.0.0',
        description: 'Plugin for testing hooks',
        author: 'Test Author'
      });

      await manager.initialize();
      const discoveryResults = await manager.discoverPlugins();

      expect(discoveryResults).toHaveLength(1);
      expect(discoveryResults[0].manifest.id).toBe('hook-test-plugin');
    });
  });

  describe('Plugin Configuration and Services', () => {
    it('should handle plugin configuration and service registration', async () => {
      // Create a plugin that registers a service
      await createTestPlugin('service-plugin', {
        id: 'service-plugin',
        name: 'Service Plugin',
        version: '1.0.0',
        description: 'Plugin that provides services',
        author: 'Test Author',
        defaultConfig: {
          serviceName: 'test-service',
          serviceValue: 42
        }
      });

      await manager.initialize();
      await manager.loadPlugin('service-plugin');
      
      const plugin = manager.getPlugin('service-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.context.config.config).toEqual({
        serviceName: 'test-service',
        serviceValue: 42
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle plugin loading errors gracefully', async () => {
      // Create an invalid plugin (missing main file)
      const pluginDir = path.join(testPluginsDir, 'invalid-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      const manifest = {
        id: 'invalid-plugin',
        name: 'Invalid Plugin',
        version: '1.0.0',
        description: 'Plugin with missing main file',
        author: 'Test Author',
        main: 'nonexistent.js'
      };

      await fs.writeFile(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify(manifest, null, 2)
      );

      await manager.initialize();

      // Discovery should find the plugin but mark it as invalid
      const discoveryResults = await manager.discoverPlugins();
      const invalidPlugin = discoveryResults.find(r => r.manifest.id === 'invalid-plugin');
      expect(invalidPlugin).toBeDefined();

      // Loading should fail gracefully
      const loadResult = await manager.loadPlugin('invalid-plugin');
      expect(loadResult.success).toBe(false);
      expect(loadResult.errors.length).toBeGreaterThan(0);

      // Manager should still be functional
      const stats = manager.getStats();
      expect(stats.totalLoaded).toBe(0);
    });

    it('should handle plugin initialization errors', async () => {
      // Create a plugin that throws during initialization
      const pluginDir = path.join(testPluginsDir, 'error-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      const manifest = {
        id: 'error-plugin',
        name: 'Error Plugin',
        version: '1.0.0',
        description: 'Plugin that throws errors',
        author: 'Test Author',
        main: 'index.js'
      };

      await fs.writeFile(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify(manifest, null, 2)
      );

      const indexContent = `
const { EventEmitter } = require('events');

class ErrorPlugin extends EventEmitter {
  constructor(metadata) {
    super();
    this.metadata = metadata;
    this._state = 'unloaded';
    this.context = null;
  }

  get state() {
    return this._state;
  }

  async initialize(context) {
    this._state = 'initializing';
    this.context = context;
    throw new Error('Initialization failed');
  }

  async start() {}
  async stop() {}
  async cleanup() {}

  getHealth() {
    return {
      status: 'error',
      timestamp: new Date(),
      details: { error: 'Initialization failed' }
    };
  }
}

module.exports = ErrorPlugin;
      `;

      await fs.writeFile(path.join(pluginDir, 'index.js'), indexContent);

      await manager.initialize();

      // Loading should fail due to initialization error
      const loadResult = await manager.loadPlugin('error-plugin');
      expect(loadResult.success).toBe(false);
      expect(loadResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Plugin Manager Statistics', () => {
    it('should provide accurate statistics', async () => {
      // Create multiple test plugins
      await createTestPlugin('stats-plugin-1', {
        id: 'stats-plugin-1',
        name: 'Stats Plugin 1',
        version: '1.0.0',
        description: 'First stats plugin',
        author: 'Test Author'
      });

      await createTestPlugin('stats-plugin-2', {
        id: 'stats-plugin-2',
        name: 'Stats Plugin 2',
        version: '1.0.0',
        description: 'Second stats plugin',
        author: 'Test Author'
      });

      await manager.initialize();
      
      let stats = manager.getStats();
      expect(stats.totalDiscovered).toBe(2);
      expect(stats.totalLoaded).toBe(0);
      expect(stats.totalStarted).toBe(0);

      await manager.loadAllPlugins();
      
      stats = manager.getStats();
      expect(stats.totalLoaded).toBe(2);
      expect(stats.stateBreakdown.initialized).toBe(2);

      await manager.startAllPlugins();
      
      stats = manager.getStats();
      expect(stats.totalStarted).toBe(2);
      expect(stats.stateBreakdown.started).toBe(2);
    });
  });

  // Helper function to create test plugins
  async function createTestPlugin(id: string, manifest: any): Promise<void> {
    const pluginDir = path.join(testPluginsDir, id);
    await fs.mkdir(pluginDir, { recursive: true });

    // Write manifest
    await fs.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Write basic plugin implementation
    const indexContent = `
const { EventEmitter } = require('events');

// Simple plugin implementation without external dependencies
class TestPlugin extends EventEmitter {
  constructor(metadata) {
    super();
    this.metadata = metadata;
    this._state = 'unloaded';
    this.context = null;
  }

  get state() {
    return this._state;
  }

  async initialize(context) {
    this._state = 'initializing';
    this.context = context;
    await this.onInitialize();
    this._state = 'initialized';
  }

  async start() {
    this._state = 'starting';
    await this.onStart();
    this._state = 'started';
  }

  async stop() {
    this._state = 'stopping';
    await this.onStop();
    this._state = 'stopped';
  }

  async cleanup() {
    await this.onCleanup();
    this._state = 'unloaded';
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      details: {}
    };
  }

  async onInitialize() {
    if (this.context && this.context.logger) {
      this.context.logger.info('Plugin initialized');
    }
  }

  async onStart() {
    if (this.context && this.context.logger) {
      this.context.logger.info('Plugin started');
    }
  }

  async onStop() {
    if (this.context && this.context.logger) {
      this.context.logger.info('Plugin stopped');
    }
  }

  async onCleanup() {
    if (this.context && this.context.logger) {
      this.context.logger.info('Plugin cleaned up');
    }
  }
}

module.exports = TestPlugin;
    `;

    await fs.writeFile(path.join(pluginDir, 'index.js'), indexContent);
  }
});
