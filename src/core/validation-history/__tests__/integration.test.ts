/**
 * Integration Tests for Validation History System
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createValidationHistorySystem,
  HistoryConfigPresets,
  HistoryUtils,
  DEFAULT_HISTORY_CONFIG
} from '../index.js';
import type {
  ValidationHistoryEntry,
  HistoryConfig,
  ExportOptions,
  CleanupOptions
} from '../types.js';
import type { ValidationResult } from '../../validation/index.js';

describe('Validation History System Integration', () => {
  let testDbPath: string;
  let testExportDir: string;

  beforeEach(() => {
    // Use unique database path for each test to avoid data pollution
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    testDbPath = path.join(__dirname, `integration-test-${timestamp}-${randomId}.db`);
    testExportDir = path.join(__dirname, `integration-exports-${timestamp}-${randomId}`);
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore if file doesn't exist
    }

    try {
      await fs.rm(testExportDir, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    // Clean up any additional database files (WAL, SHM)
    try {
      await fs.unlink(`${testDbPath}-wal`);
    } catch {
      // Ignore if file doesn't exist
    }

    try {
      await fs.unlink(`${testDbPath}-shm`);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('End-to-End Workflow', () => {
    it('should complete full validation history workflow', async () => {
      // 1. Create and initialize system
      const config: Partial<HistoryConfig> = {
        ...HistoryConfigPresets.testing(),
        database: {
          type: 'sqlite',
          connectionString: `sqlite:${testDbPath}`
        },
        export: {
          directory: testExportDir,
          maxFileSize: 10 * 1024 * 1024,
          allowedFormats: ['json', 'csv']
        }
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      expect(historySystem.isReady()).toBe(true);

      // 2. Record multiple validations
      const mockValidationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        metadata: {
          timestamp: '2024-01-01T00:00:00.000Z',
          duration: 100,
          specVersion: '1.0.0',
          validationType: 'frontend',
          rulesApplied: ['rule1', 'rule2']
        }
      };

      const context = HistoryUtils.createManualContext('user-123', 'session-456');
      const metrics = HistoryUtils.createBasicMetrics(100);

      const entryIds: string[] = [];

      // Create entries with past timestamps for cleanup testing
      // We'll directly insert into the database to control timestamps
      const pastDate = new Date('2024-01-01T00:00:00.000Z');

      // Helper function to create entry with specific timestamp
      const createEntryWithTimestamp = (id: string, specId: string, timestamp: Date): ValidationHistoryEntry => ({
        id,
        specId,
        timestamp,
        result: mockValidationResult,
        sourceCode: `const test${id} = true;`,
        validationType: 'frontend',
        filePath: `/path/to/file${id}.ts`,
        userId: 'user-123',
        context,
        metrics
      });

      // Insert 5 individual entries with past timestamps
      for (let i = 0; i < 5; i++) {
        const entryId = `entry-${i}`;
        const entry = createEntryWithTimestamp(entryId, `spec-${i}`, pastDate);
        await (historySystem as any).database.store(entry);
        entryIds.push(entryId);
      }

      // Insert 2 batch entries - one with current timestamp (failed), one with past timestamp (success)
      const currentDate = new Date(); // Use current timestamp for failed entry to ensure it's found by lastDays(7)
      const batchEntry1 = createEntryWithTimestamp('batch-entry-1', 'batch-spec-1', currentDate);
      batchEntry1.result = { ...mockValidationResult, isValid: false };
      batchEntry1.sourceCode = 'const error = true;';
      batchEntry1.validationType = 'backend';
      batchEntry1.context = HistoryUtils.createAutoContext('cursor');
      batchEntry1.metrics = HistoryUtils.createDetailedMetrics(200, 60, 140, 2048, 75, 10, 0.9);

      // Debug: Log the failed entry result to verify it's correctly set
      console.log('DEBUG: batchEntry1.result =', JSON.stringify(batchEntry1.result));

      // Get database reference first
      const db = (historySystem as any).database;

      await db.store(batchEntry1);
      entryIds.push('batch-entry-1');

      // Debug: Immediately query the stored entry to see how it's stored
      const storedEntry = await db.query({ ids: ['batch-entry-1'] });
      console.log('DEBUG: Stored entry result:', storedEntry.entries[0]?.result);
      console.log('DEBUG: Stored entry result type:', typeof storedEntry.entries[0]?.result);
      if (storedEntry.entries[0]?.result) {
        const resultStr = typeof storedEntry.entries[0].result === 'string'
          ? storedEntry.entries[0].result
          : JSON.stringify(storedEntry.entries[0].result);
        console.log('DEBUG: Result string contains "isValid":false?', resultStr.includes('"isValid":false'));
        console.log('DEBUG: Result string contains "isValid": false?', resultStr.includes('"isValid": false'));
        console.log('DEBUG: Full result string:', resultStr);
      }

      const batchEntry2 = createEntryWithTimestamp('batch-entry-2', 'batch-spec-2', pastDate);
      batchEntry2.sourceCode = 'const success = true;';
      batchEntry2.validationType = 'both';
      batchEntry2.context = HistoryUtils.createFileChangeContext('/path/to/changed.ts', 'windsurf');
      batchEntry2.metrics = HistoryUtils.createBasicMetrics(150);
      await db.store(batchEntry2);
      entryIds.push('batch-entry-2');

      expect(entryIds).toHaveLength(7);

      // 3. Query validations
      const allValidations = await historySystem.queryValidations({});
      expect(allValidations.entries).toHaveLength(7);
      expect(allValidations.totalCount).toBe(7);

      // Query with filters
      const frontendValidations = await historySystem.queryValidations({
        validationType: 'frontend'
      });
      expect(frontendValidations.entries).toHaveLength(5);

      const failedValidations = await historySystem.queryValidations({
        status: 'failed'
      });
      expect(failedValidations.entries).toHaveLength(1);

      // 4. Use query builder
      const queryBuilder = historySystem.createQuery();

      // Debug: Query all entries first to see what's in the database
      const allEntries = await queryBuilder.execute();

      // Check what was actually stored for the failed entry
      const failedEntries = allEntries.filter(entry => {
        if (!entry.result || typeof entry.result !== 'object') return false;
        return entry.result.isValid === false;
      });

      // Force debug information to be visible through assertion failure
      const debugInfo = {
        totalEntries: allEntries.length,
        failedEntriesCount: failedEntries.length,
        entries: allEntries.map((entry, index) => ({
          index,
          id: entry.id,
          result: entry.result,
          resultType: typeof entry.result,
          isValid: entry.result?.isValid,
          isValidType: typeof entry.result?.isValid
        }))
      };

      // Always show debug info by forcing an assertion
      if (debugInfo.failedEntriesCount === 0) {
        throw new Error(`No failed entries found! Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
      }

      const recentFailed = await queryBuilder
        .failed()
        .lastDays(7)
        .newest()
        .take(10)
        .execute();

      // Direct database check to debug the issue
      const queryResult = await db.query({});

      // SQLiteDatabase.query() returns HistoryQueryResult with entries property
      const allRecords = queryResult.entries;

      // Debug: Check the actual stored data format
      console.log('DEBUG: All records count:', allRecords.length);
      allRecords.forEach((record: any, index: number) => {
        console.log(`DEBUG: Record ${index}:`, {
          id: record.id,
          result: record.result,
          resultType: typeof record.result,
          resultString: typeof record.result === 'string' ? record.result : JSON.stringify(record.result)
        });
      });

      // Test the SQL query directly
      const directFailedQuery = await db.query({ status: 'failed' });
      console.log('DEBUG: Direct failed query result:', directFailedQuery.entries.length);

      const failedRecords = allRecords.filter((r: any) => {
        try {
          const result = typeof r.result === 'string' ? JSON.parse(r.result) : r.result;
          return result.isValid === false;
        } catch {
          return false;
        }
      });

      console.log('DEBUG: Failed records found by manual filter:', failedRecords.length);

      expect(recentFailed).toHaveLength(1);

      // 5. Get statistics
      const stats = await historySystem.getStatistics();
      expect(stats.totalEntries).toBe(7);
      expect(stats.statusBreakdown.passed).toBe(6);
      expect(stats.statusBreakdown.failed).toBe(1);
      expect(stats.typeBreakdown.frontend).toBe(5);
      expect(stats.typeBreakdown.backend).toBe(1);
      expect(stats.typeBreakdown.both).toBe(1);

      // 6. Export data
      const exportOptions: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const exportResult = await historySystem.export(exportOptions);
      expect(exportResult.success).toBe(true);
      expect(exportResult.recordCount).toBe(7);
      expect(exportResult.filePath).toContain('.json');

      // Verify export file exists
      const exportStats = await fs.stat(exportResult.filePath);
      expect(exportStats.isFile()).toBe(true);
      expect(exportStats.size).toBeGreaterThan(0);

      // 7. Perform cleanup
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const cleanupOptions: CleanupOptions = {
        retentionDays: 0, // Remove all entries (no retention)
        keepSuccessful: false,
        keepFailed: false,
        batchSize: 100,
        dryRun: true // Dry run first
      };

      const dryRunResult = await historySystem.cleanup(cleanupOptions);
      expect(dryRunResult.removedCount).toBe(7);
      expect(dryRunResult.metadata.dryRun).toBe(true);

      // Actual cleanup
      const actualCleanupResult = await historySystem.cleanup({
        ...cleanupOptions,
        dryRun: false
      });
      expect(actualCleanupResult.removedCount).toBe(7);
      expect(actualCleanupResult.metadata.dryRun).toBe(false);

      // Verify cleanup worked
      const afterCleanup = await historySystem.queryValidations({});
      expect(afterCleanup.entries).toHaveLength(0);
      expect(afterCleanup.totalCount).toBe(0);

      // 8. Health check
      const health = await historySystem.getHealth();
      expect(health.connected).toBe(true);
      expect(health.entryCount).toBe(0);

      // 9. Shutdown
      await historySystem.shutdown();
      expect(historySystem.isReady()).toBe(false);
    }, 30000); // 30 second timeout for integration test
  });

  describe('Configuration Presets', () => {
    it('should work with development preset', async () => {
      const config = HistoryConfigPresets.development();
      config.database = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      expect(historySystem.isReady()).toBe(true);

      await historySystem.shutdown();
    });

    it('should work with testing preset', async () => {
      const config = HistoryConfigPresets.testing();
      config.database = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      expect(historySystem.isReady()).toBe(true);

      await historySystem.shutdown();
    });

    it('should work with production preset', async () => {
      const config = HistoryConfigPresets.production();
      config.database = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      expect(historySystem.isReady()).toBe(true);

      await historySystem.shutdown();
    });

    it('should work with high-performance preset', async () => {
      const config = HistoryConfigPresets.highPerformance();
      config.database = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      expect(historySystem.isReady()).toBe(true);

      await historySystem.shutdown();
    });

    it('should work with minimal preset', async () => {
      const config = HistoryConfigPresets.minimal();
      config.database = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      expect(historySystem.isReady()).toBe(true);

      await historySystem.shutdown();
    });
  });

  describe('Utility Functions', () => {
    it('should create different validation contexts', () => {
      const manualContext = HistoryUtils.createManualContext('user-123', 'session-456', { test: true });
      expect(manualContext.trigger).toBe('manual');
      expect(manualContext.metadata.test).toBe(true);

      const autoContext = HistoryUtils.createAutoContext('cursor', 'production', { automated: true });
      expect(autoContext.trigger).toBe('auto');
      expect(autoContext.environment).toBe('production');
      expect(autoContext.integration).toBe('cursor');

      const fileChangeContext = HistoryUtils.createFileChangeContext('/path/to/file.ts', 'windsurf');
      expect(fileChangeContext.trigger).toBe('file-change');
      expect(fileChangeContext.metadata.filePath).toBe('/path/to/file.ts');

      const apiContext = HistoryUtils.createApiContext('/api/validate', 'user-123');
      expect(apiContext.trigger).toBe('api-call');
      expect(apiContext.metadata.apiEndpoint).toBe('/api/validate');
    });

    it('should create different validation metrics', () => {
      const basicMetrics = HistoryUtils.createBasicMetrics(100);
      expect(basicMetrics.duration).toBe(100);
      expect(basicMetrics.schemaDuration).toBe(30);
      expect(basicMetrics.analysisDuration).toBe(70);

      const detailedMetrics = HistoryUtils.createDetailedMetrics(200, 60, 140, 2048, 75, 10, 0.9);
      expect(detailedMetrics.duration).toBe(200);
      expect(detailedMetrics.schemaDuration).toBe(60);
      expect(detailedMetrics.analysisDuration).toBe(140);
      expect(detailedMetrics.memoryUsage).toBe(2048);
      expect(detailedMetrics.cpuUsage).toBe(75);
      expect(detailedMetrics.rulesApplied).toBe(10);
      expect(detailedMetrics.cacheHitRatio).toBe(0.9);
    });

    it('should format file sizes correctly', () => {
      expect(HistoryUtils.formatFileSize(1024)).toBe('1.0 KB');
      expect(HistoryUtils.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(HistoryUtils.formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(HistoryUtils.formatFileSize(512)).toBe('512.0 B');
    });

    it('should format durations correctly', () => {
      expect(HistoryUtils.formatDuration(500)).toBe('500ms');
      expect(HistoryUtils.formatDuration(1500)).toBe('1.5s');
      expect(HistoryUtils.formatDuration(65000)).toBe('1m 5s');
    });

    it('should calculate success rates correctly', () => {
      const stats = {
        totalEntries: 100,
        statusBreakdown: { passed: 80, failed: 15, warning: 5 },
        typeBreakdown: { frontend: 40, backend: 35, both: 25 },
        integrationBreakdown: { cursor: 50, windsurf: 30, augment: 20 },
        averageDuration: 150,
        commonErrors: [],
        trends: { daily: [], weekly: [] }
      };

      const successRate = HistoryUtils.calculateSuccessRate(stats);
      expect(successRate).toBeCloseTo(84.21, 2); // 80 / (80 + 15) * 100
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      const config: Partial<HistoryConfig> = {
        database: {
          type: 'sqlite',
          connectionString: 'sqlite:/invalid/path/database.db' // Invalid path
        }
      };

      const historySystem = createValidationHistorySystem(config);

      await expect(historySystem.initialize()).rejects.toThrow();
      expect(historySystem.isReady()).toBe(false);
    });

    it('should handle export directory creation', async () => {
      const config: Partial<HistoryConfig> = {
        ...HistoryConfigPresets.testing(),
        database: {
          type: 'sqlite',
          connectionString: `sqlite:${testDbPath}`
        },
        export: {
          directory: path.join(testExportDir, 'nested', 'deep', 'directory'),
          maxFileSize: 10 * 1024 * 1024,
          allowedFormats: ['json']
        }
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      // Record a validation
      const mockValidationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        metadata: {
          timestamp: '2024-01-01T00:00:00.000Z',
          duration: 100,
          specVersion: '1.0.0',
          validationType: 'frontend',
          rulesApplied: []
        }
      };

      await historySystem.recordValidation(
        'spec-123',
        mockValidationResult,
        'const test = true;',
        'frontend',
        HistoryUtils.createManualContext(),
        HistoryUtils.createBasicMetrics(100)
      );

      // Export should create the directory structure
      const exportResult = await historySystem.export({
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      });

      expect(exportResult.success).toBe(true);

      await historySystem.shutdown();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large batch operations efficiently', async () => {
      const config: Partial<HistoryConfig> = {
        ...HistoryConfigPresets.testing(),
        database: {
          type: 'sqlite',
          connectionString: `sqlite:${testDbPath}`
        }
      };

      const historySystem = createValidationHistorySystem(config);
      await historySystem.initialize();

      const mockValidationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        metadata: {
          timestamp: '2024-01-01T00:00:00.000Z',
          duration: 100,
          specVersion: '1.0.0',
          validationType: 'frontend',
          rulesApplied: []
        }
      };

      // Create large batch
      const batchSize = 100;
      const batchEntries = Array.from({ length: batchSize }, (_, i) => ({
        specId: `spec-${i}`,
        result: mockValidationResult,
        sourceCode: `const test${i} = true;`,
        validationType: 'frontend' as const,
        context: HistoryUtils.createManualContext(),
        metrics: HistoryUtils.createBasicMetrics(100 + i)
      }));

      const startTime = Date.now();
      const entryIds = await historySystem.recordValidationBatch(batchEntries);
      const endTime = Date.now();

      expect(entryIds).toHaveLength(batchSize);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all entries were stored
      const allValidations = await historySystem.queryValidations({});
      expect(allValidations.totalCount).toBe(batchSize);

      await historySystem.shutdown();
    }, 10000); // 10 second timeout
  });

  describe('Default Configuration', () => {
    it('should use default configuration when none provided', () => {
      const historySystem = createValidationHistorySystem();

      // Should not throw and should use defaults
      expect(historySystem).toBeDefined();
    });

    it('should merge partial configuration with defaults', () => {
      const partialConfig: Partial<HistoryConfig> = {
        storage: {
          maxEntries: 5000,
          retentionDays: 60,
          compression: true,
          indexOptimization: true
        }
      };

      const historySystem = createValidationHistorySystem(partialConfig);

      expect(historySystem).toBeDefined();
    });

    it('should validate default configuration structure', () => {
      expect(DEFAULT_HISTORY_CONFIG.database).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.storage).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.query).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.export).toBeDefined();
      expect(DEFAULT_HISTORY_CONFIG.cleanup).toBeDefined();

      expect(DEFAULT_HISTORY_CONFIG.database.type).toBe('sqlite');
      expect(DEFAULT_HISTORY_CONFIG.storage.maxEntries).toBe(100000);
      expect(DEFAULT_HISTORY_CONFIG.query.defaultPageSize).toBe(50);
      expect(DEFAULT_HISTORY_CONFIG.export.allowedFormats).toContain('json');
      expect(DEFAULT_HISTORY_CONFIG.cleanup.enabled).toBe(true);
    });
  });
});
