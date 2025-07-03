/**
 * Tests for Validation History Types
 */

import type {
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
} from '../types';
import type { ValidationResult } from '../../validation/index';

describe('Validation History Types', () => {
  describe('ValidationHistoryEntry', () => {
    it('should have all required properties', () => {
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

      const mockContext: ValidationContext = {
        trigger: 'manual',
        environment: 'development',
        integration: 'cursor',
        sessionId: 'session-123',
        metadata: { test: true }
      };

      const mockMetrics: ValidationMetrics = {
        duration: 100,
        schemaDuration: 30,
        analysisDuration: 70,
        memoryUsage: 1024,
        cpuUsage: 50,
        rulesApplied: 5,
        cacheHitRatio: 0.8
      };

      const entry: ValidationHistoryEntry = {
        id: 'test-id',
        specId: 'spec-123',
        timestamp: new Date(),
        result: mockValidationResult,
        sourceCode: 'const test = true;',
        validationType: 'frontend',
        filePath: '/path/to/file.ts',
        userId: 'user-123',
        context: mockContext,
        metrics: mockMetrics
      };

      expect(entry.id).toBe('test-id');
      expect(entry.specId).toBe('spec-123');
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.result).toBe(mockValidationResult);
      expect(entry.sourceCode).toBe('const test = true;');
      expect(entry.validationType).toBe('frontend');
      expect(entry.filePath).toBe('/path/to/file.ts');
      expect(entry.userId).toBe('user-123');
      expect(entry.context).toBe(mockContext);
      expect(entry.metrics).toBe(mockMetrics);
    });

    it('should allow optional properties to be undefined', () => {
      const entry: Partial<ValidationHistoryEntry> = {
        id: 'test-id',
        specId: 'spec-123',
        filePath: undefined,
        userId: undefined
      };

      expect(entry.filePath).toBeUndefined();
      expect(entry.userId).toBeUndefined();
    });
  });

  describe('ValidationContext', () => {
    it('should support all trigger types', () => {
      const triggers: ValidationContext['trigger'][] = [
        'manual',
        'auto',
        'file-change',
        'api-call'
      ];

      triggers.forEach(trigger => {
        const context: ValidationContext = {
          trigger,
          environment: 'development',
          metadata: {}
        };
        expect(context.trigger).toBe(trigger);
      });
    });

    it('should support all environment types', () => {
      const environments: ValidationContext['environment'][] = [
        'development',
        'staging',
        'production'
      ];

      environments.forEach(environment => {
        const context: ValidationContext = {
          trigger: 'manual',
          environment,
          metadata: {}
        };
        expect(context.environment).toBe(environment);
      });
    });

    it('should support all integration types', () => {
      const integrations: ValidationContext['integration'][] = [
        'cursor',
        'windsurf',
        'augment',
        'trae'
      ];

      integrations.forEach(integration => {
        const context: ValidationContext = {
          trigger: 'manual',
          environment: 'development',
          integration,
          metadata: {}
        };
        expect(context.integration).toBe(integration);
      });
    });
  });

  describe('ValidationMetrics', () => {
    it('should have all required numeric properties', () => {
      const metrics: ValidationMetrics = {
        duration: 100,
        schemaDuration: 30,
        analysisDuration: 70,
        memoryUsage: 1024,
        cpuUsage: 50,
        rulesApplied: 5,
        cacheHitRatio: 0.8
      };

      expect(typeof metrics.duration).toBe('number');
      expect(typeof metrics.schemaDuration).toBe('number');
      expect(typeof metrics.analysisDuration).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.cpuUsage).toBe('number');
      expect(typeof metrics.rulesApplied).toBe('number');
      expect(typeof metrics.cacheHitRatio).toBe('number');
    });

    it('should allow zero values', () => {
      const metrics: ValidationMetrics = {
        duration: 0,
        schemaDuration: 0,
        analysisDuration: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        rulesApplied: 0,
        cacheHitRatio: 0
      };

      Object.values(metrics).forEach(value => {
        expect(value).toBe(0);
      });
    });
  });

  describe('HistoryQuery', () => {
    it('should allow all optional properties', () => {
      const query: HistoryQuery = {
        specId: 'spec-123',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        validationType: 'frontend',
        status: 'passed',
        userId: 'user-123',
        integration: 'cursor',
        environment: 'development',
        pagination: {
          offset: 0,
          limit: 50
        },
        sort: {
          field: 'timestamp',
          order: 'desc'
        },
        search: 'test query'
      };

      expect(query.specId).toBe('spec-123');
      expect(query.dateRange?.start).toBeInstanceOf(Date);
      expect(query.dateRange?.end).toBeInstanceOf(Date);
      expect(query.validationType).toBe('frontend');
      expect(query.status).toBe('passed');
      expect(query.userId).toBe('user-123');
      expect(query.integration).toBe('cursor');
      expect(query.environment).toBe('development');
      expect(query.pagination?.offset).toBe(0);
      expect(query.pagination?.limit).toBe(50);
      expect(query.sort?.field).toBe('timestamp');
      expect(query.sort?.order).toBe('desc');
      expect(query.search).toBe('test query');
    });

    it('should allow empty query', () => {
      const query: HistoryQuery = {};
      expect(Object.keys(query)).toHaveLength(0);
    });
  });

  describe('HistoryStatistics', () => {
    it('should have all required properties with correct structure', () => {
      const stats: HistoryStatistics = {
        totalEntries: 100,
        statusBreakdown: {
          passed: 80,
          failed: 15,
          warning: 5
        },
        typeBreakdown: {
          frontend: 40,
          backend: 35,
          both: 25
        },
        integrationBreakdown: {
          cursor: 50,
          windsurf: 30,
          augment: 20
        },
        averageDuration: 150,
        commonErrors: [
          {
            code: 'VALIDATION_ERROR',
            count: 10,
            percentage: 10
          }
        ],
        trends: {
          daily: [
            {
              date: '2024-01-01',
              count: 10,
              successRate: 0.8
            }
          ],
          weekly: [
            {
              week: '2024-W01',
              count: 70,
              successRate: 0.85
            }
          ]
        }
      };

      expect(stats.totalEntries).toBe(100);
      expect(stats.statusBreakdown.passed).toBe(80);
      expect(stats.statusBreakdown.failed).toBe(15);
      expect(stats.statusBreakdown.warning).toBe(5);
      expect(stats.typeBreakdown.frontend).toBe(40);
      expect(stats.typeBreakdown.backend).toBe(35);
      expect(stats.typeBreakdown.both).toBe(25);
      expect(stats.integrationBreakdown.cursor).toBe(50);
      expect(stats.averageDuration).toBe(150);
      expect(stats.commonErrors).toHaveLength(1);
      expect(stats.trends.daily).toHaveLength(1);
      expect(stats.trends.weekly).toHaveLength(1);
    });
  });

  describe('ExportOptions', () => {
    it('should support all export formats', () => {
      const formats: ExportOptions['format'][] = [
        'json',
        'csv',
        'xlsx',
        'pdf'
      ];

      formats.forEach(format => {
        const options: ExportOptions = {
          format,
          includeSourceCode: true,
          includeMetrics: true,
          compress: false
        };
        expect(options.format).toBe(format);
      });
    });

    it('should have all required boolean properties', () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: false,
        compress: true
      };

      expect(typeof options.includeSourceCode).toBe('boolean');
      expect(typeof options.includeMetrics).toBe('boolean');
      expect(typeof options.compress).toBe('boolean');
    });
  });

  describe('CleanupOptions', () => {
    it('should have all required properties', () => {
      const options: CleanupOptions = {
        retentionDays: 30,
        keepSuccessful: true,
        keepFailed: true,
        batchSize: 1000,
        dryRun: false
      };

      expect(typeof options.retentionDays).toBe('number');
      expect(typeof options.keepSuccessful).toBe('boolean');
      expect(typeof options.keepFailed).toBe('boolean');
      expect(typeof options.batchSize).toBe('number');
      expect(typeof options.dryRun).toBe('boolean');
    });

    it('should allow different retention strategies', () => {
      const keepOnlyFailed: CleanupOptions = {
        retentionDays: 7,
        keepSuccessful: false,
        keepFailed: true,
        batchSize: 500,
        dryRun: false
      };

      const keepOnlySuccessful: CleanupOptions = {
        retentionDays: 7,
        keepSuccessful: true,
        keepFailed: false,
        batchSize: 500,
        dryRun: false
      };

      expect(keepOnlyFailed.keepSuccessful).toBe(false);
      expect(keepOnlyFailed.keepFailed).toBe(true);
      expect(keepOnlySuccessful.keepSuccessful).toBe(true);
      expect(keepOnlySuccessful.keepFailed).toBe(false);
    });
  });

  describe('DatabaseConfig', () => {
    it('should support all database types', () => {
      const types: DatabaseConfig['type'][] = [
        'sqlite',
        'postgresql',
        'mysql',
        'mongodb'
      ];

      types.forEach(type => {
        const config: DatabaseConfig = {
          type,
          connectionString: `${type}://localhost/test`
        };
        expect(config.type).toBe(type);
      });
    });

    it('should have optional pool configuration', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        connectionString: 'postgresql://localhost/test',
        pool: {
          min: 1,
          max: 10,
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 600000
        }
      };

      expect(config.pool?.min).toBe(1);
      expect(config.pool?.max).toBe(10);
      expect(config.pool?.acquireTimeoutMillis).toBe(30000);
      expect(config.pool?.idleTimeoutMillis).toBe(600000);
    });
  });

  describe('HistoryConfig', () => {
    it('should have all required sections', () => {
      const config: HistoryConfig = {
        database: {
          type: 'sqlite',
          connectionString: 'sqlite:./test.db'
        },
        storage: {
          maxEntries: 10000,
          retentionDays: 30,
          compression: true,
          indexOptimization: true
        },
        query: {
          defaultPageSize: 50,
          maxPageSize: 1000,
          timeout: 30000,
          cache: {
            enabled: true,
            ttl: 300000,
            maxSize: 100
          }
        },
        export: {
          directory: './exports',
          maxFileSize: 100 * 1024 * 1024,
          allowedFormats: ['json', 'csv']
        },
        cleanup: {
          enabled: true,
          schedule: 'daily',
          defaultRetention: 90
        }
      };

      expect(config.database).toBeDefined();
      expect(config.storage).toBeDefined();
      expect(config.query).toBeDefined();
      expect(config.export).toBeDefined();
      expect(config.cleanup).toBeDefined();
    });
  });
});
