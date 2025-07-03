/**
 * Tests for History Manager
 */

import { HistoryManager, createHistoryManager } from '../history-manager';
import { Logger } from '../../../utils/logger/index';
import type {
  HistoryConfig,
  ValidationHistoryEntry,
  ValidationContext,
  ValidationMetrics,
  HistoryQuery
} from '../types';
import type { ValidationResult } from '../../validation/index';
import type { IHistoryDatabase } from '../database/interface';
import { EventEmitter } from 'events';

// Mock database implementation
class MockDatabase extends EventEmitter implements IHistoryDatabase {
  private entries: Map<string, ValidationHistoryEntry> = new Map();
  private connected = false;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    this.connected = true;
  }

  async close(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async store(entry: ValidationHistoryEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async storeBatch(entries: ValidationHistoryEntry[]): Promise<void> {
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
    }
  }

  async get(id: string): Promise<ValidationHistoryEntry | null> {
    return this.entries.get(id) || null;
  }

  async query(query: any): Promise<any> {
    const entries = Array.from(this.entries.values());
    return {
      entries: entries.slice(0, query.pagination?.limit || 50),
      totalCount: entries.length,
      metadata: {
        query,
        executionTime: 10,
        cacheHit: false
      }
    };
  }

  async getStatistics(): Promise<any> {
    return {
      totalEntries: this.entries.size,
      statusBreakdown: { passed: 80, failed: 15, warning: 5 },
      typeBreakdown: { frontend: 40, backend: 35, both: 25 },
      integrationBreakdown: { cursor: 50, windsurf: 30, augment: 20 },
      averageDuration: 150,
      commonErrors: [],
      trends: { daily: [], weekly: [] }
    };
  }

  async delete(ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      if (this.entries.delete(id)) {
        deleted++;
      }
    }
    return deleted;
  }

  async cleanup(options: any): Promise<any> {
    return {
      removedCount: 10,
      keptCount: 90,
      duration: 100,
      spaceFreed: 1024,
      metadata: {
        timestamp: new Date(),
        options: options || {},
        dryRun: options?.dryRun || false
      }
    };
  }

  async getHealth(): Promise<any> {
    return {
      connected: this.connected,
      responseTime: 10,
      size: 1024,
      entryCount: this.entries.size,
      indexes: [],
      performance: { avgQueryTime: 10, slowQueries: 0, cacheHitRatio: 0.8 },
      storage: { totalSize: 1024, usedSize: 512, freeSize: 512, fragmentation: 0 }
    };
  }

  async optimize(): Promise<void> {
    // Mock optimization
  }

  async backup(): Promise<void> {
    // Mock backup
  }

  async restore(): Promise<void> {
    // Mock restore
  }

  // EventEmitter methods
  on(): this { return this; }
  emit(): boolean { return true; }
  removeListener(): this { return this; }
}

describe('HistoryManager', () => {
  let historyManager: HistoryManager;
  let mockDatabase: MockDatabase;
  let logger: Logger;
  let config: HistoryConfig;

  beforeEach(() => {
    config = {
      database: {
        type: 'sqlite',
        connectionString: 'sqlite::memory:'
      },
      storage: {
        maxEntries: 10000,
        retentionDays: 30,
        compression: false,
        indexOptimization: false
      },
      query: {
        defaultPageSize: 50,
        maxPageSize: 1000,
        timeout: 30000,
        cache: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        }
      },
      export: {
        directory: './exports',
        maxFileSize: 10 * 1024 * 1024,
        allowedFormats: ['json', 'csv']
      },
      cleanup: {
        enabled: false,
        schedule: 'daily',
        defaultRetention: 30
      }
    };

    logger = new Logger('TestHistoryManager');
    mockDatabase = new MockDatabase();

    // Create history manager with mock database
    historyManager = new HistoryManager(config, logger, mockDatabase);
  });

  afterEach(async () => {
    if (historyManager.isReady()) {
      await historyManager.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await historyManager.initialize();
      expect(historyManager.isReady()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await historyManager.initialize();
      await historyManager.initialize(); // Should not throw
      expect(historyManager.isReady()).toBe(true);
    });

    it('should shutdown successfully', async () => {
      await historyManager.initialize();
      await historyManager.shutdown();
      expect(historyManager.isReady()).toBe(false);
    });

    it('should not shutdown if not initialized', async () => {
      await historyManager.shutdown(); // Should not throw
      expect(historyManager.isReady()).toBe(false);
    });
  });

  describe('Recording Validations', () => {
    let mockValidationResult: ValidationResult;
    let mockContext: ValidationContext;
    let mockMetrics: ValidationMetrics;

    beforeEach(async () => {
      await historyManager.initialize();

      mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        metadata: {
          timestamp: '2024-01-01T00:00:00.000Z',
          duration: 100,
          specVersion: '1.0.0',
          validationType: 'frontend',
          rulesApplied: ['rule1']
        }
      };

      mockContext = {
        trigger: 'manual',
        environment: 'development',
        metadata: {}
      };

      mockMetrics = {
        duration: 100,
        schemaDuration: 30,
        analysisDuration: 70,
        memoryUsage: 1024,
        cpuUsage: 50,
        rulesApplied: 5,
        cacheHitRatio: 0.8
      };
    });

    it('should record validation successfully', async () => {
      const entryId = await historyManager.recordValidation(
        'spec-123',
        mockValidationResult,
        'const test = true;',
        'frontend',
        mockContext,
        mockMetrics,
        '/path/to/file.ts',
        'user-123'
      );

      expect(entryId).toBeDefined();
      expect(typeof entryId).toBe('string');

      const storedEntry = await historyManager.getValidation(entryId);
      expect(storedEntry).toBeDefined();
      expect(storedEntry?.specId).toBe('spec-123');
      expect(storedEntry?.validationType).toBe('frontend');
    });

    it('should record validation batch successfully', async () => {
      const entries = [
        {
          specId: 'spec-1',
          result: mockValidationResult,
          sourceCode: 'const test1 = true;',
          validationType: 'frontend' as const,
          context: mockContext,
          metrics: mockMetrics
        },
        {
          specId: 'spec-2',
          result: mockValidationResult,
          sourceCode: 'const test2 = true;',
          validationType: 'backend' as const,
          context: mockContext,
          metrics: mockMetrics
        }
      ];

      const entryIds = await historyManager.recordValidationBatch(entries);

      expect(entryIds).toHaveLength(2);
      expect(entryIds.every(id => typeof id === 'string')).toBe(true);

      for (const id of entryIds) {
        const storedEntry = await historyManager.getValidation(id);
        expect(storedEntry).toBeDefined();
      }
    });

    it('should throw error when not initialized', async () => {
      await historyManager.shutdown();

      await expect(
        historyManager.recordValidation(
          'spec-123',
          mockValidationResult,
          'const test = true;',
          'frontend',
          mockContext,
          mockMetrics
        )
      ).rejects.toThrow('History manager is not initialized');
    });
  });

  describe('Querying Validations', () => {
    beforeEach(async () => {
      await historyManager.initialize();
    });

    it('should query validations successfully', async () => {
      const query: HistoryQuery = {
        specId: 'spec-123',
        validationType: 'frontend'
      };

      const result = await historyManager.queryValidations(query);

      expect(result).toBeDefined();
      expect(result.entries).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should create query builder', () => {
      const queryBuilder = historyManager.createQuery();
      expect(queryBuilder).toBeDefined();
      expect(typeof queryBuilder.forSpec).toBe('function');
    });

    it('should get statistics', async () => {
      const stats = await historyManager.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalEntries).toBeDefined();
      expect(stats.statusBreakdown).toBeDefined();
      expect(stats.typeBreakdown).toBeDefined();
    });

    it('should get recent validations', async () => {
      const recent = await historyManager.getRecentValidations('spec-123', 10);

      expect(Array.isArray(recent)).toBe(true);
    });

    it('should get failed validations', async () => {
      const failed = await historyManager.getFailedValidations(7, 50);

      expect(Array.isArray(failed)).toBe(true);
    });

    it('should get validation trends', async () => {
      const trends = await historyManager.getValidationTrends(30);

      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await historyManager.initialize();
    });

    it('should delete validations', async () => {
      const deletedCount = await historyManager.deleteValidations(['id1', 'id2']);

      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should perform cleanup', async () => {
      const result = await historyManager.cleanup({
        retentionDays: 30,
        dryRun: true
      });

      expect(result).toBeDefined();
      expect(result.removedCount).toBeDefined();
      expect(result.keptCount).toBeDefined();
    });

    it('should get cleanup stats', async () => {
      const stats = await historyManager.getCleanupStats();

      expect(stats).toBeDefined();
    });
  });

  describe('Health and Maintenance', () => {
    beforeEach(async () => {
      await historyManager.initialize();
    });

    it('should get health status', async () => {
      const health = await historyManager.getHealth();

      expect(health).toBeDefined();
      expect(health.connected).toBe(true);
      expect(health.responseTime).toBeDefined();
    });

    it('should optimize database', async () => {
      await expect(historyManager.optimize()).resolves.not.toThrow();
    });

    it('should create backup', async () => {
      await expect(historyManager.backup('/path/to/backup')).resolves.not.toThrow();
    });

    it('should restore from backup', async () => {
      await expect(historyManager.restore('/path/to/backup')).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Create a proper mock database that extends EventEmitter
      class ErrorDatabase extends EventEmitter implements IHistoryDatabase {
        async initialize(): Promise<void> {
          throw new Error('Database error');
        }

        async close(): Promise<void> {
          // Mock implementation
        }

        isConnected(): boolean {
          return false;
        }

        async storeValidation(): Promise<void> {
          throw new Error('Database error');
        }

        async getValidation(): Promise<ValidationHistoryEntry | null> {
          throw new Error('Database error');
        }

        async queryValidations(): Promise<ValidationHistoryEntry[]> {
          throw new Error('Database error');
        }

        async deleteValidations(): Promise<number> {
          throw new Error('Database error');
        }

        async getStatistics(): Promise<any> {
          throw new Error('Database error');
        }

        async cleanup(): Promise<any> {
          throw new Error('Database error');
        }

        async getHealth(): Promise<any> {
          throw new Error('Database error');
        }

        async optimize(): Promise<void> {
          throw new Error('Database error');
        }

        async backup(): Promise<void> {
          throw new Error('Database error');
        }

        async restore(): Promise<void> {
          throw new Error('Database error');
        }
      }

      const errorDatabase = new ErrorDatabase();
      const errorManager = new HistoryManager(config, logger, errorDatabase);

      await expect(errorManager.initialize()).rejects.toThrow('Database error');
    });

    it('should throw error for operations when not initialized', async () => {
      const operations = [
        () => historyManager.getValidation('id'),
        () => historyManager.queryValidations({}),
        () => historyManager.getStatistics(),
        () => historyManager.deleteValidations(['id']),
        () => historyManager.cleanup(),
        () => historyManager.getHealth(),
        () => historyManager.optimize(),
        () => historyManager.backup('/path'),
        () => historyManager.restore('/path')
      ];

      for (const operation of operations) {
        await expect(operation()).rejects.toThrow('History manager is not initialized');
      }
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await historyManager.initialize();
    });

    it('should emit events for validation recording', (done) => {
      historyManager.on('validation.recorded', (entry) => {
        expect(entry).toBeDefined();
        expect(entry.id).toBeDefined();
        done();
      });

      historyManager.recordValidation(
        'spec-123',
        {
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
        },
        'const test = true;',
        'frontend',
        { trigger: 'manual', environment: 'development', metadata: {} },
        {
          duration: 100,
          schemaDuration: 30,
          analysisDuration: 70,
          memoryUsage: 1024,
          cpuUsage: 50,
          rulesApplied: 5,
          cacheHitRatio: 0.8
        }
      );
    });

    it('should emit events for batch recording', (done) => {
      historyManager.on('validation.batch.recorded', (entries) => {
        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(1);
        done();
      });

      historyManager.recordValidationBatch([{
        specId: 'spec-123',
        result: {
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
        },
        sourceCode: 'const test = true;',
        validationType: 'frontend',
        context: { trigger: 'manual', environment: 'development', metadata: {} },
        metrics: {
          duration: 100,
          schemaDuration: 30,
          analysisDuration: 70,
          memoryUsage: 1024,
          cpuUsage: 50,
          rulesApplied: 5,
          cacheHitRatio: 0.8
        }
      }]);
    });
  });
});

describe('createHistoryManager Factory', () => {
  it('should create history manager instance', () => {
    const config: HistoryConfig = {
      database: { type: 'sqlite', connectionString: 'sqlite::memory:' },
      storage: { maxEntries: 1000, retentionDays: 30, compression: false, indexOptimization: false },
      query: { defaultPageSize: 50, maxPageSize: 1000, timeout: 30000, cache: { enabled: false, ttl: 0, maxSize: 0 } },
      export: { directory: './exports', maxFileSize: 10 * 1024 * 1024, allowedFormats: ['json'] },
      cleanup: { enabled: false, schedule: 'daily', defaultRetention: 30 }
    };

    const manager = createHistoryManager(config);
    expect(manager).toBeInstanceOf(HistoryManager);
  });
});
