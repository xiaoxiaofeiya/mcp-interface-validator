/**
 * Tests for Cleanup Manager
 */

import { CleanupManager, CleanupPresets, createCleanupManager } from '../cleanup-manager';
import { Logger } from '../../../utils/logger/index';
import type {
  CleanupOptions,
  CleanupResult,
  HistoryConfig
} from '../types';
import type { IHistoryDatabase } from '../database/interface';

// Mock database implementation
class MockDatabase implements Partial<IHistoryDatabase> {
  private entryCount = 1000;

  async query(): Promise<any> {
    return {
      entries: [],
      totalCount: this.entryCount,
      metadata: {}
    };
  }

  async cleanup(options: CleanupOptions): Promise<CleanupResult> {
    const removedCount = options.dryRun ? this.entryCount * 0.3 : Math.floor(this.entryCount * 0.3);
    const keptCount = this.entryCount - removedCount;

    if (!options.dryRun) {
      this.entryCount = keptCount;
    }

    return {
      removedCount,
      keptCount,
      duration: 100,
      spaceFreed: removedCount * 1024,
      metadata: {
        timestamp: new Date(),
        options,
        dryRun: options.dryRun
      }
    };
  }

  async getHealth(): Promise<any> {
    return {
      connected: true,
      responseTime: 10,
      size: this.entryCount * 1024,
      entryCount: this.entryCount,
      indexes: [],
      performance: { avgQueryTime: 10, slowQueries: 0, cacheHitRatio: 0.8 },
      storage: { totalSize: this.entryCount * 1024, usedSize: this.entryCount * 512, freeSize: this.entryCount * 512, fragmentation: 0 }
    };
  }

  setEntryCount(count: number): void {
    this.entryCount = count;
  }
}

describe('CleanupManager', () => {
  let cleanupManager: CleanupManager;
  let mockDatabase: MockDatabase;
  let logger: Logger;
  let config: HistoryConfig;

  beforeEach(() => {
    config = {
      database: { type: 'sqlite', connectionString: 'sqlite::memory:' },
      storage: { maxEntries: 10000, retentionDays: 30, compression: false, indexOptimization: false },
      query: { defaultPageSize: 50, maxPageSize: 1000, timeout: 30000, cache: { enabled: false, ttl: 0, maxSize: 0 } },
      export: { directory: './exports', maxFileSize: 10 * 1024 * 1024, allowedFormats: ['json'] },
      cleanup: {
        enabled: true,
        schedule: 'daily',
        defaultRetention: 30
      }
    };

    logger = new Logger('TestCleanupManager');
    mockDatabase = new MockDatabase();

    cleanupManager = new CleanupManager(
      mockDatabase as IHistoryDatabase,
      config,
      logger
    );
  });

  afterEach(() => {
    cleanupManager.stop();
    jest.clearAllMocks();
  });

  describe('Basic Cleanup Operations', () => {
    it('should perform cleanup with default options', async () => {
      const result = await cleanupManager.cleanup();

      expect(result.removedCount).toBeGreaterThan(0);
      expect(result.keptCount).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.spaceFreed).toBeGreaterThan(0);
      expect(result.metadata.dryRun).toBe(false);
    });

    it('should perform dry run cleanup', async () => {
      const result = await cleanupManager.cleanup({ dryRun: true });

      expect(result.removedCount).toBeGreaterThan(0);
      expect(result.metadata.dryRun).toBe(true);
    });

    it('should cleanup with custom retention days', async () => {
      const options: Partial<CleanupOptions> = {
        retentionDays: 7,
        dryRun: false
      };

      const result = await cleanupManager.cleanup(options);

      expect(result.metadata.options.retentionDays).toBe(7);
    });

    it('should cleanup with selective retention', async () => {
      const options: Partial<CleanupOptions> = {
        retentionDays: 30,
        keepSuccessful: false,
        keepFailed: true,
        dryRun: false
      };

      const result = await cleanupManager.cleanup(options);

      expect(result.metadata.options.keepSuccessful).toBe(false);
      expect(result.metadata.options.keepFailed).toBe(true);
    });

    it('should cleanup with custom batch size', async () => {
      const options: Partial<CleanupOptions> = {
        retentionDays: 30,
        batchSize: 500,
        dryRun: false
      };

      const result = await cleanupManager.cleanup(options);

      expect(result.metadata.options.batchSize).toBe(500);
    });
  });

  describe('Cleanup Statistics and Estimation', () => {
    it('should get cleanup statistics', async () => {
      const stats = await cleanupManager.getStats();

      expect(stats.totalEntries).toBe(1000);
      expect(stats.estimatedCleanupSize).toBeGreaterThan(0);
      expect(stats.lastCleanup).toBeUndefined(); // No cleanup performed yet
      expect(stats.nextScheduledCleanup).toBeUndefined(); // No schedule active
    });

    it('should estimate cleanup impact', async () => {
      const estimate = await cleanupManager.estimateCleanup({
        retentionDays: 7
      });

      expect(estimate.estimatedRemovals).toBeGreaterThan(0);
      expect(estimate.estimatedSpaceFreed).toBeGreaterThan(0);
      expect(estimate.estimatedDuration).toBeGreaterThan(0);
      expect(estimate.breakdown.byAge).toBeDefined();
      expect(estimate.breakdown.byStatus).toBeDefined();
      expect(estimate.breakdown.byType).toBeDefined();
    });

    it('should estimate cleanup for different retention strategies', async () => {
      const conservativeEstimate = await cleanupManager.estimateCleanup({
        retentionDays: 90,
        keepSuccessful: true,
        keepFailed: true
      });

      const aggressiveEstimate = await cleanupManager.estimateCleanup({
        retentionDays: 7,
        keepSuccessful: false,
        keepFailed: false
      });

      expect(aggressiveEstimate.estimatedRemovals).toBeGreaterThan(conservativeEstimate.estimatedRemovals);
    });
  });

  describe('Scheduled Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start scheduled cleanup', () => {
      const scheduleConfig = {
        enabled: true,
        schedule: 'daily',
        retentionDays: 30
      };

      cleanupManager.start(scheduleConfig);

      expect(cleanupManager.isRunning()).toBe(true);
    });

    it('should stop scheduled cleanup', () => {
      const scheduleConfig = {
        enabled: true,
        schedule: 'daily',
        retentionDays: 30
      };

      cleanupManager.start(scheduleConfig);
      cleanupManager.stop();

      expect(cleanupManager.isRunning()).toBe(false);
    });

    it('should execute cleanup on schedule', (done) => {
      const scheduleConfig = {
        enabled: true,
        schedule: 'hourly', // Use hourly for faster testing
        retentionDays: 30
      };

      cleanupManager.on('cleanup.completed', (result) => {
        expect(result.removedCount).toBeGreaterThan(0);
        done();
      });

      cleanupManager.start(scheduleConfig);

      // Fast-forward time to trigger cleanup
      jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
    });

    it('should handle different schedule intervals', () => {
      const schedules = ['hourly', '6h', 'daily', 'weekly'];

      schedules.forEach(schedule => {
        cleanupManager.start({
          enabled: true,
          schedule,
          retentionDays: 30
        });

        expect(cleanupManager.isRunning()).toBe(true);
        cleanupManager.stop();
      });
    });

    it('should not start if already running', () => {
      const scheduleConfig = {
        enabled: true,
        schedule: 'daily',
        retentionDays: 30
      };

      cleanupManager.start(scheduleConfig);
      cleanupManager.start(scheduleConfig); // Should not throw

      expect(cleanupManager.isRunning()).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should emit cleanup started event', (done) => {
      cleanupManager.on('cleanup.started', (options) => {
        expect(options).toBeDefined();
        expect(options.retentionDays).toBeDefined();
        done();
      });

      cleanupManager.cleanup();
    });

    it('should emit cleanup completed event', (done) => {
      cleanupManager.on('cleanup.completed', (result) => {
        expect(result.removedCount).toBeGreaterThan(0);
        expect(result.duration).toBeGreaterThan(0);
        done();
      });

      cleanupManager.cleanup();
    });

    it('should emit cleanup error event', (done) => {
      // Mock database to throw error
      mockDatabase.cleanup = jest.fn().mockRejectedValue(new Error('Cleanup failed'));

      cleanupManager.on('cleanup.error', (error) => {
        expect(error.message).toBe('Cleanup failed');
        done();
      });

      cleanupManager.cleanup().catch(() => {
        // Expected to throw, but we're testing the event emission
      });
    });

    it('should emit schedule started event', (done) => {
      cleanupManager.on('schedule.started', (config) => {
        expect(config.schedule).toBe('daily');
        expect(config.retentionDays).toBe(30);
        done();
      });

      cleanupManager.start({
        enabled: true,
        schedule: 'daily',
        retentionDays: 30
      });
    });

    it('should emit schedule stopped event', (done) => {
      cleanupManager.start({
        enabled: true,
        schedule: 'daily',
        retentionDays: 30
      });

      cleanupManager.on('schedule.stopped', () => {
        done();
      });

      cleanupManager.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during cleanup', async () => {
      mockDatabase.cleanup = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(cleanupManager.cleanup()).rejects.toThrow('Database error');
    });

    it('should handle database errors during stats retrieval', async () => {
      mockDatabase.getHealth = jest.fn().mockRejectedValue(new Error('Health check failed'));

      await expect(cleanupManager.getStats()).rejects.toThrow('Health check failed');
    });

    it('should handle invalid schedule configuration', () => {
      expect(() => {
        cleanupManager.start({
          enabled: true,
          schedule: 'invalid-schedule' as any,
          retentionDays: 30
        });
      }).toThrow('Invalid schedule format');
    });

    it('should handle negative retention days', async () => {
      await expect(
        cleanupManager.cleanup({ retentionDays: -1 })
      ).rejects.toThrow('Retention days must be positive');
    });

    it('should handle zero batch size', async () => {
      await expect(
        cleanupManager.cleanup({ batchSize: 0 })
      ).rejects.toThrow('Batch size must be positive');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate cleanup options', () => {
      const validOptions: CleanupOptions = {
        retentionDays: 30,
        keepSuccessful: true,
        keepFailed: true,
        batchSize: 1000,
        dryRun: false
      };

      expect(() => cleanupManager.validateOptions(validOptions)).not.toThrow();
    });

    it('should reject invalid retention days', () => {
      const invalidOptions: CleanupOptions = {
        retentionDays: -5,
        keepSuccessful: true,
        keepFailed: true,
        batchSize: 1000,
        dryRun: false
      };

      expect(() => cleanupManager.validateOptions(invalidOptions)).toThrow();
    });

    it('should reject invalid batch size', () => {
      const invalidOptions: CleanupOptions = {
        retentionDays: 30,
        keepSuccessful: true,
        keepFailed: true,
        batchSize: -100,
        dryRun: false
      };

      expect(() => cleanupManager.validateOptions(invalidOptions)).toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track cleanup performance', async () => {
      const result = await cleanupManager.cleanup();

      expect(result.duration).toBeGreaterThan(0);
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should provide performance metrics', async () => {
      await cleanupManager.cleanup();
      const stats = await cleanupManager.getStats();

      expect(stats.performance).toBeDefined();
      expect(stats.performance.averageCleanupTime).toBeGreaterThan(0);
      expect(stats.performance.totalCleanupsPerformed).toBe(1);
    });
  });
});

describe('CleanupPresets', () => {
  it('should provide conservative cleanup preset', () => {
    const preset = CleanupPresets.conservative();

    expect(preset.retentionDays).toBe(90);
    expect(preset.keepSuccessful).toBe(true);
    expect(preset.keepFailed).toBe(true);
    expect(preset.batchSize).toBe(500);
    expect(preset.dryRun).toBe(false);
  });

  it('should provide aggressive cleanup preset', () => {
    const preset = CleanupPresets.aggressive();

    expect(preset.retentionDays).toBe(7);
    expect(preset.keepSuccessful).toBe(false);
    expect(preset.keepFailed).toBe(true);
    expect(preset.batchSize).toBe(2000);
    expect(preset.dryRun).toBe(false);
  });

  it('should provide balanced cleanup preset', () => {
    const preset = CleanupPresets.balanced();

    expect(preset.retentionDays).toBe(30);
    expect(preset.keepSuccessful).toBe(true);
    expect(preset.keepFailed).toBe(true);
    expect(preset.batchSize).toBe(1000);
    expect(preset.dryRun).toBe(false);
  });

  it('should provide development cleanup preset', () => {
    const preset = CleanupPresets.development();

    expect(preset.retentionDays).toBe(7);
    expect(preset.keepSuccessful).toBe(false);
    expect(preset.keepFailed).toBe(false);
    expect(preset.batchSize).toBe(100);
    expect(preset.dryRun).toBe(false);
  });

  it('should provide testing cleanup preset', () => {
    const preset = CleanupPresets.testing();

    expect(preset.retentionDays).toBe(1);
    expect(preset.keepSuccessful).toBe(false);
    expect(preset.keepFailed).toBe(false);
    expect(preset.batchSize).toBe(50);
    expect(preset.dryRun).toBe(false);
  });

  it('should provide production cleanup preset', () => {
    const preset = CleanupPresets.production();

    expect(preset.retentionDays).toBe(180);
    expect(preset.keepSuccessful).toBe(true);
    expect(preset.keepFailed).toBe(true);
    expect(preset.batchSize).toBe(1000);
    expect(preset.dryRun).toBe(false);
  });
});

describe('createCleanupManager Factory', () => {
  it('should create cleanup manager instance', () => {
    const config: HistoryConfig = {
      database: { type: 'sqlite', connectionString: 'sqlite::memory:' },
      storage: { maxEntries: 1000, retentionDays: 30, compression: false, indexOptimization: false },
      query: { defaultPageSize: 50, maxPageSize: 1000, timeout: 30000, cache: { enabled: false, ttl: 0, maxSize: 0 } },
      export: { directory: './exports', maxFileSize: 10 * 1024 * 1024, allowedFormats: ['json'] },
      cleanup: { enabled: true, schedule: 'daily', defaultRetention: 30 }
    };

    const mockDb = new MockDatabase();
    const manager = createCleanupManager(mockDb as IHistoryDatabase, config);

    expect(manager).toBeInstanceOf(CleanupManager);
  });
});
