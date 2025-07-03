/**
 * Main Test Suite for Validation History System
 */

import {
  HistoryManager,
  createHistoryManager,
  QueryBuilder,
  createQuery,
  QueryPresets,
  ExportManager,
  CleanupManager,
  CleanupPresets,
  createCleanupManager,
  SQLiteDatabase,
  createValidationHistorySystem,
  HistoryConfigPresets,
  HistoryUtils,
  DEFAULT_HISTORY_CONFIG
} from '../index.js';

import type {
  IHistoryDatabase,
  DatabaseHealth,
  ValidationHistoryEntry,
  ValidationContext,
  ValidationMetrics,
  HistoryQuery,
  HistoryQueryResult,
  HistoryStatistics,
  ExportOptions,
  ExportResult,
  CleanupOptions,
  CleanupResult,
  DatabaseConfig,
  HistoryConfig
} from '../index.js';

describe('Validation History System - Main Exports', () => {
  describe('Core Classes Export', () => {
    it('should export HistoryManager class', () => {
      expect(HistoryManager).toBeDefined();
      expect(typeof HistoryManager).toBe('function');
    });

    it('should export createHistoryManager factory', () => {
      expect(createHistoryManager).toBeDefined();
      expect(typeof createHistoryManager).toBe('function');
    });

    it('should export QueryBuilder class', () => {
      expect(QueryBuilder).toBeDefined();
      expect(typeof QueryBuilder).toBe('function');
    });

    it('should export createQuery factory', () => {
      expect(createQuery).toBeDefined();
      expect(typeof createQuery).toBe('function');
    });

    it('should export QueryPresets', () => {
      expect(QueryPresets).toBeDefined();
      expect(typeof QueryPresets).toBe('function');
    });

    it('should export ExportManager class', () => {
      expect(ExportManager).toBeDefined();
      expect(typeof ExportManager).toBe('function');
    });

    it('should export CleanupManager class', () => {
      expect(CleanupManager).toBeDefined();
      expect(typeof CleanupManager).toBe('function');
    });

    it('should export CleanupPresets', () => {
      expect(CleanupPresets).toBeDefined();
      expect(typeof CleanupPresets).toBe('function');
    });

    it('should export createCleanupManager factory', () => {
      expect(createCleanupManager).toBeDefined();
      expect(typeof createCleanupManager).toBe('function');
    });

    it('should export SQLiteDatabase class', () => {
      expect(SQLiteDatabase).toBeDefined();
      expect(typeof SQLiteDatabase).toBe('function');
    });
  });

  describe('Main Factory Function', () => {
    it('should export createValidationHistorySystem factory', () => {
      expect(createValidationHistorySystem).toBeDefined();
      expect(typeof createValidationHistorySystem).toBe('function');
    });

    it('should create history system with default config', () => {
      const historySystem = createValidationHistorySystem();
      expect(historySystem).toBeInstanceOf(HistoryManager);
    });

    it('should create history system with custom config', () => {
      const customConfig: Partial<HistoryConfig> = {
        storage: {
          maxEntries: 5000,
          retentionDays: 60,
          compression: true,
          indexOptimization: true
        }
      };

      const historySystem = createValidationHistorySystem(customConfig);
      expect(historySystem).toBeInstanceOf(HistoryManager);
    });
  });

  describe('Configuration Presets', () => {
    it('should export HistoryConfigPresets', () => {
      expect(HistoryConfigPresets).toBeDefined();
      expect(typeof HistoryConfigPresets).toBe('function');
    });

    it('should provide development preset', () => {
      const preset = HistoryConfigPresets.development();
      expect(preset).toBeDefined();
      expect(preset.database?.type).toBe('sqlite');
      expect(preset.storage?.maxEntries).toBe(10000);
      expect(preset.cleanup?.defaultRetention).toBe(7);
    });

    it('should provide testing preset', () => {
      const preset = HistoryConfigPresets.testing();
      expect(preset).toBeDefined();
      expect(preset.database?.connectionString).toBe('sqlite::memory:');
      expect(preset.storage?.maxEntries).toBe(1000);
      expect(preset.cleanup?.enabled).toBe(false);
    });

    it('should provide production preset', () => {
      const preset = HistoryConfigPresets.production();
      expect(preset).toBeDefined();
      expect(preset.storage?.maxEntries).toBe(1000000);
      expect(preset.storage?.retentionDays).toBe(365);
      expect(preset.database?.backup?.enabled).toBe(true);
    });

    it('should provide high-performance preset', () => {
      const preset = HistoryConfigPresets.highPerformance();
      expect(preset).toBeDefined();
      expect(preset.database?.pool?.max).toBe(20);
      expect(preset.query?.cache?.enabled).toBe(true);
      expect(preset.cleanup?.schedule).toBe('6h');
    });

    it('should provide minimal preset', () => {
      const preset = HistoryConfigPresets.minimal();
      expect(preset).toBeDefined();
      expect(preset.storage?.maxEntries).toBe(5000);
      expect(preset.query?.cache?.enabled).toBe(false);
      expect(preset.export?.allowedFormats).toEqual(['json', 'csv']);
    });
  });

  describe('Utility Functions', () => {
    it('should export HistoryUtils', () => {
      expect(HistoryUtils).toBeDefined();
      expect(typeof HistoryUtils).toBe('function');
    });

    it('should provide context creation utilities', () => {
      expect(typeof HistoryUtils.createManualContext).toBe('function');
      expect(typeof HistoryUtils.createAutoContext).toBe('function');
      expect(typeof HistoryUtils.createFileChangeContext).toBe('function');
      expect(typeof HistoryUtils.createApiContext).toBe('function');
    });

    it('should provide metrics creation utilities', () => {
      expect(typeof HistoryUtils.createBasicMetrics).toBe('function');
      expect(typeof HistoryUtils.createDetailedMetrics).toBe('function');
    });

    it('should provide formatting utilities', () => {
      expect(typeof HistoryUtils.formatFileSize).toBe('function');
      expect(typeof HistoryUtils.formatDuration).toBe('function');
      expect(typeof HistoryUtils.calculateSuccessRate).toBe('function');
    });
  });

  describe('Default Configuration', () => {
    it('should export DEFAULT_HISTORY_CONFIG', () => {
      expect(DEFAULT_HISTORY_CONFIG).toBeDefined();
      expect(typeof DEFAULT_HISTORY_CONFIG).toBe('object');
    });

    it('should have all required configuration sections', () => {
      expect(DEFAULT_HISTORY_CONFIG.database).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.storage).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.query).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.export).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.cleanup).toBeDefined();
    });

    it('should have valid default values', () => {
      expect(DEFAULT_HISTORY_CONFIG.database.type).toBe('sqlite');
      expect(DEFAULT_HISTORY_CONFIG.storage.maxEntries).toBe(100000);
      expect(DEFAULT_HISTORY_CONFIG.storage.retentionDays).toBe(90);
      expect(DEFAULT_HISTORY_CONFIG.query.defaultPageSize).toBe(50);
      expect(DEFAULT_HISTORY_CONFIG.query.maxPageSize).toBe(1000);
      expect(DEFAULT_HISTORY_CONFIG.export.allowedFormats).toContain('json');
      expect(DEFAULT_HISTORY_CONFIG.cleanup.enabled).toBe(true);
    });
  });

  describe('Type Exports', () => {
    it('should export database interface types', () => {
      // These are type-only exports, so we can't test them at runtime
      // But we can verify they're available for TypeScript compilation
      const testInterface: IHistoryDatabase = {} as any;
      const testHealth: DatabaseHealth = {} as any;
      
      expect(testInterface).toBeDefined();
      expect(testHealth).toBeDefined();
    });

    it('should export core data types', () => {
      const testEntry: ValidationHistoryEntry = {} as any;
      const testContext: ValidationContext = {} as any;
      const testMetrics: ValidationMetrics = {} as any;
      const testQuery: HistoryQuery = {} as any;
      const testResult: HistoryQueryResult = {} as any;
      const testStats: HistoryStatistics = {} as any;

      expect(testEntry).toBeDefined();
      expect(testContext).toBeDefined();
      expect(testMetrics).toBeDefined();
      expect(testQuery).toBeDefined();
      expect(testResult).toBeDefined();
      expect(testStats).toBeDefined();
    });

    it('should export operation types', () => {
      const testExportOptions: ExportOptions = {} as any;
      const testExportResult: ExportResult = {} as any;
      const testCleanupOptions: CleanupOptions = {} as any;
      const testCleanupResult: CleanupResult = {} as any;

      expect(testExportOptions).toBeDefined();
      expect(testExportResult).toBeDefined();
      expect(testCleanupOptions).toBeDefined();
      expect(testCleanupResult).toBeDefined();
    });

    it('should export configuration types', () => {
      const testDbConfig: DatabaseConfig = {} as any;
      const testHistoryConfig: HistoryConfig = {} as any;

      expect(testDbConfig).toBeDefined();
      expect(testHistoryConfig).toBeDefined();
    });
  });

  describe('Factory Function Integration', () => {
    it('should create functional query builder', () => {
      const queryBuilder = createQuery();
      expect(queryBuilder).toBeInstanceOf(QueryBuilder);

      const query = queryBuilder
        .forSpec('test-spec')
        .failed()
        .lastDays(7)
        .build();

      expect(query.specId).toBe('test-spec');
      expect(query.status).toBe('failed');
      expect(query.dateRange).toBeDefined();
    });

    it('should provide working query presets', () => {
      const recentFailures = QueryPresets.recentFailures(7);
      expect(recentFailures).toBeInstanceOf(QueryBuilder);

      const query = recentFailures.build();
      expect(query.status).toBe('failed');
      expect(query.dateRange).toBeDefined();
    });

    it('should provide working cleanup presets', () => {
      const conservative = CleanupPresets.conservative();
      expect(conservative.retentionDays).toBe(90);
      expect(conservative.keepSuccessful).toBe(true);
      expect(conservative.keepFailed).toBe(true);

      const aggressive = CleanupPresets.aggressive();
      expect(aggressive.retentionDays).toBe(7);
      expect(aggressive.keepSuccessful).toBe(false);
      expect(aggressive.keepFailed).toBe(true);
    });
  });

  describe('Module Completeness', () => {
    it('should export all expected classes', () => {
      const expectedClasses = [
        'HistoryManager',
        'QueryBuilder',
        'ExportManager',
        'CleanupManager',
        'SQLiteDatabase'
      ];

      const exports = {
        HistoryManager,
        QueryBuilder,
        ExportManager,
        CleanupManager,
        SQLiteDatabase
      };

      expectedClasses.forEach(className => {
        expect(exports[className as keyof typeof exports]).toBeDefined();
        expect(typeof exports[className as keyof typeof exports]).toBe('function');
      });
    });

    it('should export all expected factory functions', () => {
      const expectedFactories = [
        'createHistoryManager',
        'createQuery',
        'createCleanupManager',
        'createValidationHistorySystem'
      ];

      const exports = {
        createHistoryManager,
        createQuery,
        createCleanupManager,
        createValidationHistorySystem
      };

      expectedFactories.forEach(factoryName => {
        expect(exports[factoryName as keyof typeof exports]).toBeDefined();
        expect(typeof exports[factoryName as keyof typeof exports]).toBe('function');
      });
    });

    it('should export all expected utility objects', () => {
      const expectedUtilities = [
        'QueryPresets',
        'CleanupPresets',
        'HistoryConfigPresets',
        'HistoryUtils'
      ];

      const exports = {
        QueryPresets,
        CleanupPresets,
        HistoryConfigPresets,
        HistoryUtils
      };

      expectedUtilities.forEach(utilityName => {
        expect(exports[utilityName as keyof typeof exports]).toBeDefined();
      });
    });

    it('should export configuration constants', () => {
      expect(DEFAULT_HISTORY_CONFIG).toBeDefined();
      expect(typeof DEFAULT_HISTORY_CONFIG).toBe('object');
    });
  });

  describe('API Consistency', () => {
    it('should maintain consistent naming conventions', () => {
      // All factory functions should start with 'create'
      expect(createHistoryManager.name).toBe('createHistoryManager');
      expect(createQuery.name).toBe('createQuery');
      expect(createCleanupManager.name).toBe('createCleanupManager');
      expect(createValidationHistorySystem.name).toBe('createValidationHistorySystem');

      // All preset objects should end with 'Presets'
      expect(QueryPresets).toBeDefined();
      expect(CleanupPresets).toBeDefined();
      expect(HistoryConfigPresets).toBeDefined();

      // All manager classes should end with 'Manager'
      expect(HistoryManager.name).toBe('HistoryManager');
      expect(ExportManager.name).toBe('ExportManager');
      expect(CleanupManager.name).toBe('CleanupManager');
    });

    it('should provide consistent configuration structure', () => {
      const presets = [
        HistoryConfigPresets.development(),
        HistoryConfigPresets.testing(),
        HistoryConfigPresets.production(),
        HistoryConfigPresets.highPerformance(),
        HistoryConfigPresets.minimal()
      ];

      presets.forEach(preset => {
        // All presets should have the same structure
        expect(preset).toHaveProperty('database');
        expect(preset).toHaveProperty('storage');
        expect(preset).toHaveProperty('cleanup');
      });
    });
  });
});
