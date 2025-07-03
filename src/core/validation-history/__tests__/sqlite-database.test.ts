/**
 * Tests for SQLite Database Implementation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SQLiteDatabase } from '../database/sqlite-database.js';
import { Logger } from '../../../utils/logger/index.js';
import type {
  ValidationHistoryEntry,
  HistoryQuery,
  CleanupOptions,
  DatabaseConfig
} from '../types.js';
import type { ValidationResult } from '../../validation/index.js';

// Mock sqlite3 module
const mockSqlite3 = {
  Database: jest.fn()
};

jest.mock('sqlite3', () => mockSqlite3, { virtual: true });

// 创建一个测试专用的SQLite数据库类
class TestSQLiteDatabase extends SQLiteDatabase {
  private mockDb: any;

  constructor(logger: Logger) {
    super(logger);
    // 创建Mock数据库对象
    this.mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      close: jest.fn(),
      serialize: jest.fn(),
      parallelize: jest.fn(),
      exec: jest.fn(),
      prepare: jest.fn(),
      each: jest.fn()
    };
  }

  // 重写openDatabase方法，直接返回Mock实例
  protected async openDatabase(sqlite3: any, dbPath: string): Promise<any> {
    return Promise.resolve(this.mockDb);
  }

  // 提供访问Mock的方法，用于测试验证
  getMockDb() {
    return this.mockDb;
  }
}

describe('SQLiteDatabase', () => {
  let database: TestSQLiteDatabase;
  let mockDb: any;
  let logger: Logger;
  let testDbPath: string;
  let mockEntry: ValidationHistoryEntry;

  beforeEach(async () => {
    // 完全重置所有Mock
    jest.clearAllMocks();
    jest.resetAllMocks();

    logger = new Logger('TestSQLiteDatabase');
    database = new TestSQLiteDatabase(logger);
    mockDb = database.getMockDb();

    // Reset mock database methods
    Object.values(mockDb).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockReset();
      }
    });
    testDbPath = path.join(__dirname, 'test.db');

    // Create mock validation history entry
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
        rulesApplied: ['rule1']
      }
    };

    mockEntry = {
      id: 'test-id',
      specId: 'spec-123',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      result: mockValidationResult,
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
    };
  });

  afterEach(async () => {
    // 强制关闭数据库连接
    if (database && database.isConnected()) {
      await database.close();
    }

    // Clean up test database file
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore if file doesn't exist
    }

    // 完全清理Mock和内存
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }

    // 清理变量引用
    mockDb = null;
    database = null;
  });

  describe('Initialization', () => {
    it('should initialize database successfully', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      // Mock successful database operations
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 0 }, null);
      });

      await database.initialize(config);

      expect(database.isConnected()).toBe(true);
      expect(mockSqlite3.Database).toHaveBeenCalledWith(testDbPath, expect.any(Function));
    });

    it('should handle initialization errors', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      // Mock database connection error
      mockSqlite3.Database.mockImplementation((path: string, callback: Function) => {
        callback(new Error('Connection failed'));
        return mockDb;
      });

      await expect(database.initialize(config)).rejects.toThrow('Connection failed');
    });

    it('should create schema and indexes during initialization', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 0 }, null);
      });

      await database.initialize(config);

      // Verify schema creation calls
      const runCalls = mockDb.run.mock.calls;
      expect(runCalls.some(call => call[0].includes('CREATE TABLE'))).toBe(true);
      expect(runCalls.some(call => call[0].includes('CREATE INDEX'))).toBe(true);
    });
  });

  describe('Connection Management', () => {
    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 0 }, null);
      });

      await database.initialize(config);
    });

    it('should report connected status', () => {
      expect(database.isConnected()).toBe(true);
    });

    it('should close connection successfully', async () => {
      mockDb.close.mockImplementation((callback: Function) => {
        callback(null);
      });

      await database.close();

      expect(database.isConnected()).toBe(false);
      expect(mockDb.close).toHaveBeenCalled();
    });

    it('should handle close errors', async () => {
      mockDb.close.mockImplementation((callback: Function) => {
        callback(new Error('Close failed'));
      });

      await expect(database.close()).rejects.toThrow('Close failed');
    });
  });

  describe('Data Operations', () => {
    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 1 }, null);
      });

      await database.initialize(config);
    });

    describe('Store Operations', () => {
      it('should store validation history entry', async () => {
        await database.store(mockEntry);

        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO validation_history'),
          expect.arrayContaining([
            mockEntry.id,
            mockEntry.specId,
            mockEntry.timestamp.toISOString(),
            JSON.stringify(mockEntry.result),
            mockEntry.sourceCode,
            mockEntry.validationType,
            mockEntry.filePath,
            mockEntry.userId,
            JSON.stringify(mockEntry.context),
            JSON.stringify(mockEntry.metrics)
          ])
        );
      });

      it('should handle store errors', async () => {
        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ changes: 0 }, new Error('Store failed'));
        });

        await expect(database.store(mockEntry)).rejects.toThrow('Store failed');
      });

      it('should store batch of entries', async () => {
        const entries = [mockEntry, { ...mockEntry, id: 'test-id-2' }];

        // Mock transaction methods
        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          if (sql === 'BEGIN TRANSACTION' || sql === 'COMMIT' || sql === 'ROLLBACK') {
            callback.call({ changes: 0 }, null);
          } else {
            callback.call({ changes: 1 }, null);
          }
        });

        await database.storeBatch(entries);

        // Should call BEGIN, INSERT for each entry, and COMMIT
        expect(mockDb.run).toHaveBeenCalledWith('BEGIN TRANSACTION', []);
        expect(mockDb.run).toHaveBeenCalledWith('COMMIT', []);
      });
    });

    describe('Retrieve Operations', () => {
      it('should retrieve entry by ID', async () => {
        const mockRow = {
          id: mockEntry.id,
          spec_id: mockEntry.specId,
          timestamp: mockEntry.timestamp.toISOString(),
          result: JSON.stringify(mockEntry.result),
          source_code: mockEntry.sourceCode,
          validation_type: mockEntry.validationType,
          file_path: mockEntry.filePath,
          user_id: mockEntry.userId,
          context: JSON.stringify(mockEntry.context),
          metrics: JSON.stringify(mockEntry.metrics)
        };

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, mockRow);
        });

        const result = await database.get(mockEntry.id);

        expect(result).toBeDefined();
        expect(result?.id).toBe(mockEntry.id);
        expect(result?.specId).toBe(mockEntry.specId);
        expect(mockDb.get).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM validation_history WHERE id = ?'),
          [mockEntry.id]
        );
      });

      it('should return null for non-existent entry', async () => {
        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, null);
        });

        const result = await database.get('non-existent-id');

        expect(result).toBeNull();
      });

      it('should handle retrieve errors', async () => {
        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(new Error('Retrieve failed'), null);
        });

        await expect(database.get(mockEntry.id)).rejects.toThrow('Retrieve failed');
      });
    });

    describe('Query Operations', () => {
      it('should execute query with filters', async () => {
        const query: HistoryQuery = {
          specId: 'spec-123',
          validationType: 'frontend',
          pagination: { offset: 0, limit: 50 }
        };

        const mockRows = [{
          id: mockEntry.id,
          spec_id: mockEntry.specId,
          timestamp: mockEntry.timestamp.toISOString(),
          result: JSON.stringify(mockEntry.result),
          source_code: mockEntry.sourceCode,
          validation_type: mockEntry.validationType,
          file_path: mockEntry.filePath,
          user_id: mockEntry.userId,
          context: JSON.stringify(mockEntry.context),
          metrics: JSON.stringify(mockEntry.metrics)
        }];

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          if (sql.includes('COUNT(*)')) {
            callback(null, { count: 1 });
          } else {
            callback(null, mockRows[0]);
          }
        });

        mockDb.all.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, mockRows);
        });

        const result = await database.query(query);

        expect(result.entries).toHaveLength(1);
        expect(result.totalCount).toBe(1);
        expect(result.entries[0].id).toBe(mockEntry.id);
      });

      it('should handle query errors', async () => {
        const query: HistoryQuery = { specId: 'spec-123' };

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(new Error('Query failed'), null);
        });

        await expect(database.query(query)).rejects.toThrow('Query failed');
      });
    });

    describe('Delete Operations', () => {
      it('should delete entries by IDs', async () => {
        const ids = ['id1', 'id2', 'id3'];

        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ changes: 3 }, null);
        });

        const deletedCount = await database.delete(ids);

        expect(deletedCount).toBe(3);
        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM validation_history WHERE id IN'),
          ids
        );
      });

      it('should return 0 for empty ID array', async () => {
        const deletedCount = await database.delete([]);
        expect(deletedCount).toBe(0);
      });

      it('should handle delete errors', async () => {
        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ changes: 0 }, new Error('Delete failed'));
        });

        await expect(database.delete(['id1'])).rejects.toThrow('Delete failed');
      });
    });

    describe('Cleanup Operations', () => {
      it('should perform cleanup with options', async () => {
        const options: CleanupOptions = {
          retentionDays: 30,
          keepSuccessful: true,
          keepFailed: true,
          batchSize: 1000,
          dryRun: false
        };

        // Mock count query
        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          if (sql.includes('COUNT(*)')) {
            callback(null, { count: 100 });
          } else {
            callback(null, null);
          }
        });

        // Mock delete operations
        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          if (sql.includes('DELETE')) {
            callback.call({ changes: 50 }, null);
          } else {
            callback.call({ changes: 0 }, null);
          }
        });

        const result = await database.cleanup(options);

        expect(result.removedCount).toBeGreaterThan(0);
        expect(result.metadata.dryRun).toBe(false);
      });

      it('should perform dry run cleanup', async () => {
        const options: CleanupOptions = {
          retentionDays: 30,
          keepSuccessful: true,
          keepFailed: true,
          batchSize: 1000,
          dryRun: true
        };

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, { count: 100 });
        });

        const result = await database.cleanup(options);

        expect(result.metadata.dryRun).toBe(true);
        expect(result.removedCount).toBe(100);
      });
    });
  });

  describe('Health and Maintenance', () => {
    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 0 }, null);
      });

      await database.initialize(config);
    });

    it('should get database health status', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
        if (sql.includes('pragma_page_count')) {
          callback(null, { size: 1024, page_count: 10, page_size: 1024 });
        } else if (sql.includes('COUNT(*)')) {
          callback(null, { count: 100 });
        } else {
          callback(null, { name: 'test_index', sql: 'CREATE INDEX...' });
        }
      });

      mockDb.all.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback(null, [{ name: 'test_index', sql: 'CREATE INDEX...' }]);
      });

      const health = await database.getHealth();

      expect(health.connected).toBe(true);
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.entryCount).toBe(100);
    });

    it('should optimize database', async () => {
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 0 }, null);
      });

      await database.optimize();

      expect(mockDb.run).toHaveBeenCalledWith('VACUUM', []);
      expect(mockDb.run).toHaveBeenCalledWith('ANALYZE', []);
    });

    it('should handle optimization errors', async () => {
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        if (sql === 'VACUUM') {
          callback.call({ changes: 0 }, new Error('Vacuum failed'));
        } else {
          callback.call({ changes: 0 }, null);
        }
      });

      await expect(database.optimize()).rejects.toThrow('Vacuum failed');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not connected', async () => {
      await expect(database.store(mockEntry)).rejects.toThrow('Database is not connected');
    });

    it('should handle missing sqlite3 module', async () => {
      // Mock require to throw MODULE_NOT_FOUND error
      const originalRequire = require;
      (global as any).require = jest.fn().mockImplementation((module: string) => {
        if (module === 'sqlite3') {
          const error = new Error('Cannot find module \'sqlite3\'');
          (error as any).code = 'MODULE_NOT_FOUND';
          throw error;
        }
        return originalRequire(module);
      });

      const newDatabase = new SQLiteDatabase(logger);
      const config: DatabaseConfig = {
        type: 'sqlite',
        connectionString: `sqlite:${testDbPath}`
      };

      await expect(newDatabase.initialize(config)).rejects.toThrow(
        'sqlite3 package is required but not installed'
      );

      // Restore original require
      (global as any).require = originalRequire;
    });
  });
});
