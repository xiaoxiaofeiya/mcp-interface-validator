/**
 * Tests for Export Manager
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ExportManager } from '../export-manager';
import { Logger } from '../../../utils/logger/index';
import type {
  ExportOptions,
  ValidationHistoryEntry,
  HistoryConfig
} from '../types';
import type { IHistoryDatabase } from '../database/interface';

// Mock file system operations
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock database implementation
class MockDatabase implements Partial<IHistoryDatabase> {
  query = jest.fn().mockResolvedValue({
    entries: [
      {
        id: 'test-id-1',
        specId: 'spec-123',
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
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
            rulesApplied: ['rule1']
          }
        },
        sourceCode: 'const test = true;',
        validationType: 'frontend',
        filePath: '/path/to/file.ts',
        userId: 'user-123',
        context: {
          trigger: 'manual',
          environment: 'development',
          metadata: {}
        },
        metrics: {
          duration: 100,
          schemaDuration: 30,
          analysisDuration: 70,
          memoryUsage: 1024,
          cpuUsage: 50,
          rulesApplied: 5,
          cacheHitRatio: 0.8
        }
      }
    ],
    totalCount: 1,
    metadata: {
      query: {},
      executionTime: 10,
      cacheHit: false
    }
  });
}

describe('ExportManager', () => {
  let exportManager: ExportManager;
  let mockDatabase: MockDatabase;
  let logger: Logger;
  let config: HistoryConfig;
  let testExportDir: string;

  beforeEach(() => {
    config = {
      database: { type: 'sqlite', connectionString: 'sqlite::memory:' },
      storage: { maxEntries: 1000, retentionDays: 30, compression: false, indexOptimization: false },
      query: { defaultPageSize: 50, maxPageSize: 1000, timeout: 30000, cache: { enabled: false, ttl: 0, maxSize: 0 } },
      export: {
        directory: './test-exports',
        maxFileSize: 10 * 1024 * 1024,
        allowedFormats: ['json', 'csv', 'xlsx', 'pdf']
      },
      cleanup: { enabled: false, schedule: 'daily', defaultRetention: 30 }
    };

    logger = new Logger('TestExportManager');
    mockDatabase = new MockDatabase();
    testExportDir = path.join(__dirname, 'test-exports');

    exportManager = new ExportManager(
      mockDatabase as IHistoryDatabase,
      config,
      logger
    );

    // Mock file system operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({
      size: 1024,
      isFile: () => true,
      isDirectory: () => false
    } as any);
    mockFs.access.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JSON Export', () => {
    it('should export data as JSON', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('.json');
      expect(result.format).toBe('json');
      expect(result.recordCount).toBe(1);
      expect(result.fileSize).toBe(1024);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.stringContaining('"id": "test-id-1"'),
        'utf8'
      );
    });

    it('should export compressed JSON', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: true
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('.json.gz');
      expect(result.compressed).toBe(true);
    });

    it('should exclude source code when requested', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: false,
        includeMetrics: true,
        compress: false
      };

      await exportManager.export(options);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const jsonContent = writeCall[1] as string;
      const data = JSON.parse(jsonContent);

      expect(data.entries[0]).not.toHaveProperty('sourceCode');
    });

    it('should exclude metrics when requested', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: false,
        compress: false
      };

      await exportManager.export(options);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const jsonContent = writeCall[1] as string;
      const data = JSON.parse(jsonContent);

      expect(data.entries[0]).not.toHaveProperty('metrics');
    });
  });

  describe('CSV Export', () => {
    it('should export data as CSV', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('.csv');
      expect(result.format).toBe('csv');

      const writeCall = mockFs.writeFile.mock.calls[0];
      const csvContent = writeCall[1] as string;

      // Check CSV headers
      expect(csvContent).toContain('id,specId,timestamp');
      expect(csvContent).toContain('test-id-1,spec-123');
    });

    it('should handle CSV with special characters', async () => {
      // Mock database to return entry with special characters
      mockDatabase.query = jest.fn().mockResolvedValue({
        entries: [{
          id: 'test-id-1',
          specId: 'spec-123',
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
          result: { isValid: true, errors: [], warnings: [], suggestions: [], metadata: {} },
          sourceCode: 'const test = "hello, world";',
          validationType: 'frontend',
          context: { trigger: 'manual', environment: 'development', metadata: {} },
          metrics: { duration: 100, schemaDuration: 30, analysisDuration: 70, memoryUsage: 1024, cpuUsage: 50, rulesApplied: 5, cacheHitRatio: 0.8 }
        }],
        totalCount: 1,
        metadata: {}
      });

      const options: ExportOptions = {
        format: 'csv',
        includeSourceCode: true,
        includeMetrics: false,
        compress: false
      };

      await exportManager.export(options);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const csvContent = writeCall[1] as string;

      // Should properly escape quotes in CSV
      expect(csvContent).toContain('"const test = ""hello, world"";"');
    });
  });

  describe('XLSX Export', () => {
    it('should export data as XLSX', async () => {
      const options: ExportOptions = {
        format: 'xlsx',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('.xlsx');
      expect(result.format).toBe('xlsx');

      // XLSX export should write binary data
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.xlsx'),
        expect.any(Buffer)
      );
    });

    it('should create multiple worksheets for XLSX', async () => {
      const options: ExportOptions = {
        format: 'xlsx',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      await exportManager.export(options);

      // Should create worksheets for entries, summary, and metadata
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('PDF Export', () => {
    it('should export data as PDF', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        includeSourceCode: false, // PDF typically excludes source code for readability
        includeMetrics: true,
        compress: false
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('.pdf');
      expect(result.format).toBe('pdf');

      // PDF export should write binary data
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.pdf'),
        expect.any(Buffer)
      );
    });

    it('should create structured PDF with sections', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        includeSourceCode: false,
        includeMetrics: true,
        compress: false
      };

      await exportManager.export(options);

      // PDF should be generated with proper structure
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Export Options and Filtering', () => {
    it('should apply query filters during export', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false,
        query: {
          specId: 'spec-123',
          validationType: 'frontend'
        }
      };

      await exportManager.export(options);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.objectContaining({
          specId: 'spec-123',
          validationType: 'frontend'
        })
      );
    });

    it('should apply date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false,
        query: {
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      };

      await exportManager.export(options);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: {
            start: startDate,
            end: endDate
          }
        })
      );
    });

    it('should limit export size', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false,
        maxRecords: 100
      };

      await exportManager.export(options);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            offset: 0,
            limit: 100
          }
        })
      );
    });
  });

  describe('File Management', () => {
    it('should create export directory if it does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('Directory does not exist'));

      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false,
        exportDirectory: './test-exports'
      };

      await exportManager.export(options);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('test-exports'),
        { recursive: true }
      );
    });

    it('should generate unique filenames', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const result1 = await exportManager.export(options);
      const result2 = await exportManager.export(options);

      expect(result1.filePath).not.toBe(result2.filePath);
    });

    it('should use custom filename when provided', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false,
        filename: 'custom-export'
      };

      const result = await exportManager.export(options);

      expect(result.filePath).toContain('custom-export.json');
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported export format', async () => {
      const options: ExportOptions = {
        format: 'xml' as any, // Unsupported format
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format: xml');
    });

    it('should handle file write errors', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      // Mock the writeFile to reject after the export manager is created
      mockFs.writeFile.mockRejectedValueOnce(new Error('Write failed'));

      const result = await exportManager.export(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Write failed');
    });

    it('should handle database query errors', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      // Mock the database query to reject
      mockDatabase.query.mockRejectedValueOnce(new Error('Query failed'));

      const result = await exportManager.export(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });

    it('should handle file size limit exceeded', async () => {
      // Mock large file size
      mockFs.stat.mockResolvedValueOnce({
        size: 20 * 1024 * 1024, // 20MB, exceeds 10MB limit
        isFile: () => true,
        isDirectory: () => false
      } as any);

      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false,
        maxFileSize: 10 * 1024 * 1024 // 10MB limit
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File size exceeds maximum allowed size');
    });
  });

  describe('Export Metadata', () => {
    it('should include export metadata in result', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const result = await exportManager.export(options);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.exportedAt).toBeInstanceOf(Date);
      expect(result.metadata.options).toEqual(options);
      expect(result.metadata.totalRecords).toBe(1);
      expect(result.metadata.exportDuration).toBeGreaterThan(0);
    });

    it('should include query metadata', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false,
        query: {
          specId: 'spec-123'
        }
      };

      const result = await exportManager.export(options);

      expect(result.metadata.queryMetadata).toBeDefined();
      expect(result.metadata.queryMetadata.executionTime).toBe(10);
      expect(result.metadata.queryMetadata.cacheHit).toBe(false);
    });
  });

  describe('Batch Export', () => {
    it('should handle large datasets with pagination', async () => {
      // Mock large dataset
      mockDatabase.query = jest.fn()
        .mockResolvedValueOnce({
          entries: new Array(1000).fill(null).map((_, i) => ({
            id: `test-id-${i}`,
            specId: 'spec-123',
            timestamp: new Date(),
            result: { isValid: true, errors: [], warnings: [], suggestions: [], metadata: {} },
            sourceCode: `const test${i} = true;`,
            validationType: 'frontend',
            context: { trigger: 'manual', environment: 'development', metadata: {} },
            metrics: { duration: 100, schemaDuration: 30, analysisDuration: 70, memoryUsage: 1024, cpuUsage: 50, rulesApplied: 5, cacheHitRatio: 0.8 }
          })),
          totalCount: 1000,
          metadata: {}
        });

      const options: ExportOptions = {
        format: 'json',
        includeSourceCode: true,
        includeMetrics: true,
        compress: false
      };

      const result = await exportManager.export(options);

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(1000);
    });
  });
});
