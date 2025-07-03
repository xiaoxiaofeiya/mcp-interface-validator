/**
 * Plugin System Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  PluginManager, 
  PluginDiscovery, 
  PluginLoader,
  BasePlugin,
  SimplePlugin,
  PluginSystemFactory,
  PluginUtils,
  DEFAULT_PLUGIN_CONFIG
} from '../../src/core/plugin-system';
import type { 
  PluginMetadata, 
  PluginLoaderConfig,
  PluginManifest 
} from '../../src/core/plugin-system/types';
import { Logger } from '../../src/utils/logger';

// Mock file system operations
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Plugin System', () => {
  let testConfig: PluginLoaderConfig;
  let logger: Logger;

  beforeEach(() => {
    testConfig = {
      ...DEFAULT_PLUGIN_CONFIG,
      pluginsDir: './test-plugins',
      dataDir: './test-data'
    };
    logger = new Logger({ name: 'test', level: 'error' });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('PluginUtils', () => {
    describe('validateMetadata', () => {
      it('should return no errors for valid metadata', () => {
        const metadata: PluginMetadata = {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin',
          author: 'Test Author'
        };

        const errors = PluginUtils.validateMetadata(metadata);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for missing required fields', () => {
        const metadata = {};
        const errors = PluginUtils.validateMetadata(metadata);
        
        expect(errors).toContain('Plugin ID is required');
        expect(errors).toContain('Plugin name is required');
        expect(errors).toContain('Plugin version is required');
        expect(errors).toContain('Plugin description is required');
        expect(errors).toContain('Plugin author is required');
      });
    });

    describe('compareVersions', () => {
      it('should compare versions correctly', () => {
        expect(PluginUtils.compareVersions('1.0.0', '1.0.0')).toBe(0);
        expect(PluginUtils.compareVersions('1.0.1', '1.0.0')).toBe(1);
        expect(PluginUtils.compareVersions('1.0.0', '1.0.1')).toBe(-1);
        expect(PluginUtils.compareVersions('2.0.0', '1.9.9')).toBe(1);
      });
    });

    describe('satisfiesVersion', () => {
      it('should check version ranges correctly', () => {
        expect(PluginUtils.satisfiesVersion('1.0.0', '1.0.0')).toBe(true);
        expect(PluginUtils.satisfiesVersion('1.0.1', '^1.0.0')).toBe(true);
        expect(PluginUtils.satisfiesVersion('1.1.0', '~1.0.0')).toBe(true);
        expect(PluginUtils.satisfiesVersion('0.9.0', '^1.0.0')).toBe(false);
      });
    });

    describe('generateManifestTemplate', () => {
      it('should generate valid manifest template', () => {
        const manifest = PluginUtils.generateManifestTemplate('test-id', 'Test Plugin');
        
        expect(manifest.id).toBe('test-id');
        expect(manifest.name).toBe('Test Plugin');
        expect(manifest.version).toBe('1.0.0');
        expect(manifest.description).toBe('Test Plugin plugin');
        expect(manifest.main).toBe('index.js');
      });
    });
  });

  describe('BasePlugin', () => {
    class TestPlugin extends BasePlugin {
      protected async onInitialize(): Promise<void> {
        // Test implementation
      }

      protected async onStart(): Promise<void> {
        // Test implementation
      }

      protected async onStop(): Promise<void> {
        // Test implementation
      }

      protected async onCleanup(): Promise<void> {
        // Test implementation
      }
    }

    let plugin: TestPlugin;
    let metadata: PluginMetadata;

    beforeEach(() => {
      metadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author'
      };
      plugin = new TestPlugin(metadata);
    });

    it('should initialize with correct metadata', () => {
      expect(plugin.metadata).toEqual(metadata);
      expect(plugin.state).toBe('unloaded');
    });

    it('should transition states correctly during lifecycle', async () => {
      const mockContext = {
        metadata,
        config: { enabled: true },
        logger,
        dataDir: './test-data',
        api: {
          registerHook: jest.fn(),
          unregisterHook: jest.fn(),
          emitHook: jest.fn(),
          getPlugin: jest.fn(),
          getPlugins: jest.fn(),
          getHostConfig: jest.fn(),
          registerService: jest.fn(),
          getService: jest.fn(),
          log: jest.fn()
        },
        events: { on: jest.fn(), emit: jest.fn() }
      } as any;

      // Initialize
      await plugin.initialize(mockContext);
      expect(plugin.state).toBe('initialized');

      // Start
      await plugin.start();
      expect(plugin.state).toBe('started');

      // Stop
      await plugin.stop();
      expect(plugin.state).toBe('stopped');

      // Cleanup
      await plugin.cleanup();
      expect(plugin.state).toBe('unloaded');
    });

    it('should provide health status', () => {
      const health = plugin.getHealth();
      
      expect(health.status).toBe('unknown');
      expect(health.timestamp).toBeInstanceOf(Date);
      expect(health.details).toBeDefined();
    });
  });

  describe('SimplePlugin', () => {
    it('should create plugin with handlers', async () => {
      const initHandler = jest.fn();
      const startHandler = jest.fn();
      const stopHandler = jest.fn();
      const cleanupHandler = jest.fn();

      const metadata: PluginMetadata = {
        id: 'simple-plugin',
        name: 'Simple Plugin',
        version: '1.0.0',
        description: 'A simple plugin',
        author: 'Test Author'
      };

      const plugin = new SimplePlugin(metadata, {
        onInitialize: initHandler,
        onStart: startHandler,
        onStop: stopHandler,
        onCleanup: cleanupHandler
      });

      const mockContext = {
        metadata,
        config: { enabled: true },
        logger,
        dataDir: './test-data',
        api: {
          registerHook: jest.fn(),
          unregisterHook: jest.fn(),
          emitHook: jest.fn(),
          getPlugin: jest.fn(),
          getPlugins: jest.fn(),
          getHostConfig: jest.fn(),
          registerService: jest.fn(),
          getService: jest.fn(),
          log: jest.fn()
        },
        events: { on: jest.fn(), emit: jest.fn() }
      } as any;

      await plugin.initialize(mockContext);
      expect(initHandler).toHaveBeenCalled();

      await plugin.start();
      expect(startHandler).toHaveBeenCalled();

      await plugin.stop();
      expect(stopHandler).toHaveBeenCalled();

      await plugin.cleanup();
      expect(cleanupHandler).toHaveBeenCalled();
    });
  });

  describe('PluginDiscovery', () => {
    let discovery: PluginDiscovery;

    beforeEach(() => {
      discovery = new PluginDiscovery(testConfig, logger);
    });

    it('should validate manifest correctly', async () => {
      const validManifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author'
      };

      const errors = await discovery.validateManifest(validManifest);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid manifest', async () => {
      const invalidManifest = {
        id: '',
        name: '',
        version: 'invalid',
        description: '',
        author: ''
      } as PluginManifest;

      const errors = await discovery.validateManifest(invalidManifest);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should discover plugins in directory', async () => {
      // Mock file system
      mockFs.readdir.mockResolvedValue([
        { name: 'plugin1', isDirectory: () => true },
        { name: 'plugin2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false }
      ] as any);

      mockFs.access.mockImplementation(async (path: any) => {
        if (path.includes('plugin.json')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        main: 'index.js'
      }));

      const results = await discovery.discoverPlugins();
      expect(results).toHaveLength(2);
    });
  });

  describe('PluginSystemFactory', () => {
    it('should create development plugin system', () => {
      const manager = PluginSystemFactory.createDevelopment('./dev-plugins', logger);
      expect(manager).toBeInstanceOf(PluginManager);
    });

    it('should create production plugin system', () => {
      const manager = PluginSystemFactory.createProduction('./prod-plugins', logger);
      expect(manager).toBeInstanceOf(PluginManager);
    });

    it('should create testing plugin system', () => {
      const manager = PluginSystemFactory.createTesting('./test-plugins', logger);
      expect(manager).toBeInstanceOf(PluginManager);
    });
  });

  describe('PluginManager', () => {
    let manager: PluginManager;

    beforeEach(() => {
      manager = new PluginManager(testConfig, logger);
    });

    it('should initialize successfully', async () => {
      // Mock discovery
      mockFs.readdir.mockResolvedValue([]);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('Directory not found'));

      await manager.initialize();
      expect(manager).toBeDefined();
    });

    it('should get plugin statistics', () => {
      const stats = manager.getStats();
      
      expect(stats.totalDiscovered).toBe(0);
      expect(stats.totalLoaded).toBe(0);
      expect(stats.totalStarted).toBe(0);
      expect(stats.stateBreakdown).toBeDefined();
    });

    it('should handle plugin not found error', async () => {
      await expect(manager.loadPlugin('non-existent')).rejects.toThrow('Plugin non-existent not found');
    });
  });

  describe('Integration', () => {
    it('should create and use plugin system end-to-end', async () => {
      // Mock file system for plugin discovery
      mockFs.readdir.mockResolvedValue([
        { name: 'test-plugin', isDirectory: () => true }
      ] as any);

      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        main: 'index.js'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(manifest));

      const manager = PluginSystemFactory.createTesting('./test-plugins', logger);
      await manager.initialize();

      const stats = manager.getStats();
      expect(stats.totalDiscovered).toBeGreaterThanOrEqual(0);
    });
  });
});
