/**
 * Tests for Query Builder
 */

import { QueryBuilder, createQuery, QueryPresets } from '../query-builder.js';
import type { HistoryQuery } from '../types.js';

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder;

  beforeEach(() => {
    queryBuilder = new QueryBuilder();
  });

  describe('Basic Query Building', () => {
    it('should create empty query by default', () => {
      const query = queryBuilder.build();
      expect(query).toEqual({});
    });

    it('should build query with spec ID filter', () => {
      const query = queryBuilder
        .forSpec('spec-123')
        .build();

      expect(query.specId).toBe('spec-123');
    });

    it('should build query with date range filter', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const query = queryBuilder
        .dateRange(start, end)
        .build();

      expect(query.dateRange?.start).toBe(start);
      expect(query.dateRange?.end).toBe(end);
    });

    it('should build query with validation type filter', () => {
      const query = queryBuilder
        .validationType('frontend')
        .build();

      expect(query.validationType).toBe('frontend');
    });

    it('should build query with status filter', () => {
      const query = queryBuilder
        .status('failed')
        .build();

      expect(query.status).toBe('failed');
    });

    it('should build query with user filter', () => {
      const query = queryBuilder
        .user('user-123')
        .build();

      expect(query.userId).toBe('user-123');
    });

    it('should build query with integration filter', () => {
      const query = queryBuilder
        .integration('cursor')
        .build();

      expect(query.integration).toBe('cursor');
    });

    it('should build query with environment filter', () => {
      const query = queryBuilder
        .environment('production')
        .build();

      expect(query.environment).toBe('production');
    });

    it('should build query with search text', () => {
      const query = queryBuilder
        .search('test query')
        .build();

      expect(query.search).toBe('test query');
    });
  });

  describe('Pagination and Sorting', () => {
    it('should set limit', () => {
      const query = queryBuilder
        .limit(100)
        .build();

      expect(query.pagination?.limit).toBe(100);
      expect(query.pagination?.offset).toBe(0);
    });

    it('should set offset', () => {
      const query = queryBuilder
        .offset(50)
        .build();

      expect(query.pagination?.offset).toBe(50);
      expect(query.pagination?.limit).toBe(50); // Default limit
    });

    it('should set both limit and offset', () => {
      const query = queryBuilder
        .limit(100)
        .offset(50)
        .build();

      expect(query.pagination?.limit).toBe(100);
      expect(query.pagination?.offset).toBe(50);
    });

    it('should set page-based pagination', () => {
      const query = queryBuilder
        .page(3, 25) // Page 3 with 25 items per page
        .build();

      expect(query.pagination?.offset).toBe(50); // (3-1) * 25
      expect(query.pagination?.limit).toBe(25);
    });

    it('should set sorting', () => {
      const query = queryBuilder
        .orderBy('timestamp', 'desc')
        .build();

      expect(query.sort?.field).toBe('timestamp');
      expect(query.sort?.order).toBe('desc');
    });
  });

  describe('Date Range Helpers', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should filter by today', () => {
      const query = queryBuilder
        .today()
        .build();

      const start = new Date('2024-01-15');
      start.setHours(0, 0, 0, 0);
      const end = new Date('2024-01-15');
      end.setHours(23, 59, 59, 999);

      expect(query.dateRange?.start.getTime()).toBe(start.getTime());
      expect(query.dateRange?.end.getTime()).toBe(end.getTime());
    });

    it('should filter by yesterday', () => {
      const query = queryBuilder
        .yesterday()
        .build();

      const start = new Date('2024-01-14');
      start.setHours(0, 0, 0, 0);
      const end = new Date('2024-01-14');
      end.setHours(23, 59, 59, 999);

      expect(query.dateRange?.start.getTime()).toBe(start.getTime());
      expect(query.dateRange?.end.getTime()).toBe(end.getTime());
    });

    it('should filter by last N days', () => {
      const query = queryBuilder
        .lastDays(7)
        .build();

      const start = new Date('2024-01-08T12:00:00Z');
      const end = new Date('2024-01-15T12:00:00Z');

      expect(query.dateRange?.start.getTime()).toBe(start.getTime());
      expect(query.dateRange?.end.getTime()).toBe(end.getTime());
    });

    it('should filter by last week', () => {
      const query = queryBuilder
        .lastWeek()
        .build();

      // Should be equivalent to lastDays(7)
      const start = new Date('2024-01-08T12:00:00Z');
      const end = new Date('2024-01-15T12:00:00Z');

      expect(query.dateRange?.start.getTime()).toBe(start.getTime());
      expect(query.dateRange?.end.getTime()).toBe(end.getTime());
    });

    it('should filter by this week', () => {
      const query = queryBuilder
        .thisWeek()
        .build();

      // January 15, 2024 is a Monday, so this week starts on January 14 (Sunday)
      const start = new Date('2024-01-14T00:00:00.000Z');
      const end = new Date('2024-01-20T23:59:59.999Z');

      expect(query.dateRange?.start.toISOString()).toBe(start.toISOString());
      expect(query.dateRange?.end.toISOString()).toBe(end.toISOString());
    });

    it('should filter by this month', () => {
      const query = queryBuilder
        .thisMonth()
        .build();

      const start = new Date('2024-01-01T00:00:00.000Z');
      const end = new Date('2024-01-31T23:59:59.999Z');

      expect(query.dateRange?.start.toISOString()).toBe(start.toISOString());
      expect(query.dateRange?.end.toISOString()).toBe(end.toISOString());
    });
  });

  describe('Status Helpers', () => {
    it('should filter failed validations', () => {
      const query = queryBuilder
        .failed()
        .build();

      expect(query.status).toBe('failed');
    });

    it('should filter passed validations', () => {
      const query = queryBuilder
        .passed()
        .build();

      expect(query.status).toBe('passed');
    });

    it('should filter validations with warnings', () => {
      const query = queryBuilder
        .withWarnings()
        .build();

      expect(query.status).toBe('warning');
    });
  });

  describe('Sorting Helpers', () => {
    it('should sort by newest first', () => {
      const query = queryBuilder
        .newest()
        .build();

      expect(query.sort?.field).toBe('timestamp');
      expect(query.sort?.order).toBe('desc');
    });

    it('should sort by oldest first', () => {
      const query = queryBuilder
        .oldest()
        .build();

      expect(query.sort?.field).toBe('timestamp');
      expect(query.sort?.order).toBe('asc');
    });

    it('should sort by slowest first', () => {
      const query = queryBuilder
        .slowest()
        .build();

      expect(query.sort?.field).toBe('metrics');
      expect(query.sort?.order).toBe('desc');
    });

    it('should sort by fastest first', () => {
      const query = queryBuilder
        .fastest()
        .build();

      expect(query.sort?.field).toBe('metrics');
      expect(query.sort?.order).toBe('asc');
    });
  });

  describe('Pagination Helpers', () => {
    it('should take N results', () => {
      const query = queryBuilder
        .take(25)
        .build();

      expect(query.pagination?.limit).toBe(25);
    });

    it('should skip N results', () => {
      const query = queryBuilder
        .skip(10)
        .build();

      expect(query.pagination?.offset).toBe(10);
    });
  });

  describe('Complex Queries', () => {
    it('should build complex query with multiple filters', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const query = queryBuilder
        .forSpec('spec-123')
        .dateRange(start, end)
        .validationType('frontend')
        .status('failed')
        .user('user-123')
        .integration('cursor')
        .environment('production')
        .search('error')
        .newest()
        .take(50)
        .skip(10)
        .build();

      expect(query).toEqual({
        specId: 'spec-123',
        dateRange: { start, end },
        validationType: 'frontend',
        status: 'failed',
        userId: 'user-123',
        integration: 'cursor',
        environment: 'production',
        search: 'error',
        sort: { field: 'timestamp', order: 'desc' },
        pagination: { offset: 10, limit: 50 }
      });
    });
  });

  describe('Query Builder Utilities', () => {
    it('should clone query builder', () => {
      const original = queryBuilder
        .forSpec('spec-123')
        .failed();

      const cloned = original.clone();
      cloned.passed(); // Modify clone

      expect(original.build().status).toBe('failed');
      expect(cloned.build().status).toBe('passed');
    });

    it('should reset query builder', () => {
      queryBuilder
        .forSpec('spec-123')
        .failed()
        .newest();

      const beforeReset = queryBuilder.build();
      expect(Object.keys(beforeReset)).toHaveLength(3);

      queryBuilder.reset();
      const afterReset = queryBuilder.build();
      expect(Object.keys(afterReset)).toHaveLength(0);
    });

    it('should provide query summary', () => {
      const summary = queryBuilder
        .forSpec('spec-123')
        .failed()
        .lastWeek()
        .getSummary();

      expect(summary).toContain('spec: spec-123');
      expect(summary).toContain('status: failed');
      expect(summary).toContain('date:');
    });

    it('should provide empty query summary', () => {
      const summary = queryBuilder.getSummary();
      expect(summary).toBe('empty query');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when trying to execute without database', async () => {
      await expect(queryBuilder.execute()).rejects.toThrow(
        'Execute method requires database instance'
      );
    });

    it('should throw error when trying to count without database', async () => {
      await expect(queryBuilder.count()).rejects.toThrow(
        'Count method requires database instance'
      );
    });
  });
});

describe('createQuery Factory', () => {
  it('should create new QueryBuilder instance', () => {
    const query = createQuery();
    expect(query).toBeInstanceOf(QueryBuilder);
  });

  it('should create independent instances', () => {
    const query1 = createQuery().forSpec('spec-1');
    const query2 = createQuery().forSpec('spec-2');

    expect(query1.build().specId).toBe('spec-1');
    expect(query2.build().specId).toBe('spec-2');
  });
});

describe('QueryPresets', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create recent failures preset', () => {
    const query = QueryPresets.recentFailures(7).build();

    expect(query.status).toBe('failed');
    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create spec-specific preset', () => {
    const query = QueryPresets.forSpec('spec-123', 30).build();

    expect(query.specId).toBe('spec-123');
    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create user-specific preset', () => {
    const query = QueryPresets.forUser('user-123', 30).build();

    expect(query.userId).toBe('user-123');
    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create integration-specific preset', () => {
    const query = QueryPresets.forIntegration('cursor', 7).build();

    expect(query.integration).toBe('cursor');
    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create performance analysis preset', () => {
    const query = QueryPresets.performanceAnalysis(7).build();

    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('metrics');
    expect(query.sort?.order).toBe('desc');
    expect(query.pagination?.limit).toBe(100);
  });

  it('should create quality trends preset', () => {
    const query = QueryPresets.qualityTrends(30).build();

    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create error analysis preset', () => {
    const query = QueryPresets.errorAnalysis(7).build();

    expect(query.status).toBe('failed');
    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create today summary preset', () => {
    const query = QueryPresets.todaySummary().build();

    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create weekly summary preset', () => {
    const query = QueryPresets.weeklySummary().build();

    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });

  it('should create monthly summary preset', () => {
    const query = QueryPresets.monthlySummary().build();

    expect(query.dateRange).toBeDefined();
    expect(query.sort?.field).toBe('timestamp');
    expect(query.sort?.order).toBe('desc');
  });
});
