/**
 * Query Builder for Validation History
 * 
 * Fluent interface for building complex validation history queries
 */

import type { HistoryQuery, ValidationHistoryEntry } from './types';
import type { IQueryBuilder, IHistoryDatabase } from './database/interface';

/**
 * Query builder implementation
 */
export class QueryBuilder implements IQueryBuilder {
  private query: Partial<HistoryQuery> = {};
  private conditions: Array<{ field: string; operator: string; value: any; connector?: 'AND' | 'OR' }> = [];
  private _database: IHistoryDatabase | undefined;

  constructor(database?: IHistoryDatabase) {
    this._database = database;
  }

  /**
   * Add WHERE condition
   */
  where(field: string, operator: string, value: any): IQueryBuilder {
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Add AND condition
   */
  and(field: string, operator: string, value: any): IQueryBuilder {
    this.conditions.push({ field, operator, value, connector: 'AND' });
    return this;
  }

  /**
   * Add OR condition
   */
  or(field: string, operator: string, value: any): IQueryBuilder {
    this.conditions.push({ field, operator, value, connector: 'OR' });
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(field: string, direction: 'asc' | 'desc'): IQueryBuilder {
    this.query.sort = { field: field as keyof ValidationHistoryEntry, order: direction };
    return this;
  }

  /**
   * Add LIMIT clause
   */
  limit(count: number): IQueryBuilder {
    if (!this.query.pagination) {
      this.query.pagination = { offset: 0, limit: count };
    } else {
      this.query.pagination.limit = count;
    }
    return this;
  }

  /**
   * Add OFFSET clause
   */
  offset(count: number): IQueryBuilder {
    if (!this.query.pagination) {
      this.query.pagination = { offset: count, limit: 50 };
    } else {
      this.query.pagination.offset = count;
    }
    return this;
  }

  /**
   * Filter by specification ID
   */
  forSpec(specId: string): QueryBuilder {
    this.query.specId = specId;
    return this;
  }

  /**
   * Filter by date range
   */
  dateRange(start: Date, end: Date): QueryBuilder {
    this.query.dateRange = { start, end };
    return this;
  }

  /**
   * Filter by validation type
   */
  validationType(type: 'frontend' | 'backend' | 'both'): QueryBuilder {
    this.query.validationType = type;
    return this;
  }

  /**
   * Filter by status
   */
  status(status: 'passed' | 'failed' | 'warning'): QueryBuilder {
    this.query.status = status;
    return this;
  }

  /**
   * Filter by user
   */
  user(userId: string): QueryBuilder {
    this.query.userId = userId;
    return this;
  }

  /**
   * Filter by integration
   */
  integration(integration: string): QueryBuilder {
    this.query.integration = integration;
    return this;
  }

  /**
   * Filter by environment
   */
  environment(environment: string): QueryBuilder {
    this.query.environment = environment;
    return this;
  }

  /**
   * Search in source code and file paths
   */
  search(text: string): QueryBuilder {
    this.query.search = text;
    return this;
  }

  /**
   * Filter by date - today
   */
  today(): QueryBuilder {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.dateRange(start, end);
  }

  /**
   * Filter by date - yesterday
   */
  yesterday(): QueryBuilder {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return this.dateRange(start, end);
  }

  /**
   * Filter by date - last N days
   */
  lastDays(days: number): QueryBuilder {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this.dateRange(start, end);
  }

  /**
   * Filter by date - last week
   */
  lastWeek(): QueryBuilder {
    return this.lastDays(7);
  }

  /**
   * Filter by date - last month
   */
  lastMonth(): QueryBuilder {
    return this.lastDays(30);
  }

  /**
   * Filter by date - this week
   */
  thisWeek(): QueryBuilder {
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - now.getUTCDay());
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return this.dateRange(start, end);
  }

  /**
   * Filter by date - this month
   */
  thisMonth(): QueryBuilder {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    end.setUTCHours(23, 59, 59, 999);
    return this.dateRange(start, end);
  }

  /**
   * Filter failed validations only
   */
  failed(): QueryBuilder {
    return this.status('failed');
  }

  /**
   * Filter passed validations only
   */
  passed(): QueryBuilder {
    return this.status('passed');
  }

  /**
   * Filter validations with warnings
   */
  withWarnings(): QueryBuilder {
    return this.status('warning');
  }

  /**
   * Order by timestamp (newest first)
   */
  newest(): QueryBuilder {
    return this.orderBy('timestamp', 'desc') as QueryBuilder;
  }

  /**
   * Order by timestamp (oldest first)
   */
  oldest(): QueryBuilder {
    return this.orderBy('timestamp', 'asc') as QueryBuilder;
  }

  /**
   * Order by duration (slowest first)
   */
  slowest(): QueryBuilder {
    return this.orderBy('metrics', 'desc') as QueryBuilder; // Will need custom handling for nested field
  }

  /**
   * Order by duration (fastest first)
   */
  fastest(): QueryBuilder {
    return this.orderBy('metrics', 'asc') as QueryBuilder; // Will need custom handling for nested field
  }

  /**
   * Get first N results
   */
  take(count: number): QueryBuilder {
    return this.limit(count) as QueryBuilder;
  }

  /**
   * Skip N results
   */
  skip(count: number): QueryBuilder {
    return this.offset(count) as QueryBuilder;
  }

  /**
   * Paginate results
   */
  page(pageNumber: number, pageSize: number = 50): QueryBuilder {
    const offset = (pageNumber - 1) * pageSize;
    this.query.pagination = { offset, limit: pageSize };
    return this;
  }

  /**
   * Build the final query object
   */
  build(): HistoryQuery {
    // Apply custom conditions to the query
    this.applyConditions();
    return this.query as HistoryQuery;
  }

  /**
   * Execute query using the database instance
   */
  async execute(): Promise<ValidationHistoryEntry[]> {
    if (!this._database) {
      throw new Error('Execute method requires database instance. Use build() and pass to database.query() or provide database in constructor');
    }

    const query = this.build();
    const result = await this._database.query(query);
    return result.entries;
  }

  /**
   * Count matching records using the database instance
   */
  async count(): Promise<number> {
    if (!this._database) {
      throw new Error('Count method requires database instance. Use build() and pass to database.query() or provide database in constructor');
    }

    const query = this.build();
    const result = await this._database.query(query);
    return result.totalCount;
  }

  /**
   * Clone the query builder
   */
  clone(): QueryBuilder {
    const cloned = new QueryBuilder();
    cloned.query = { ...this.query };
    cloned.conditions = [...this.conditions];
    return cloned;
  }

  /**
   * Reset the query builder
   */
  reset(): QueryBuilder {
    this.query = {};
    this.conditions = [];
    return this;
  }

  /**
   * Get query summary for debugging
   */
  getSummary(): string {
    const parts: string[] = [];
    
    if (this.query.specId) {
      parts.push(`spec: ${this.query.specId}`);
    }
    
    if (this.query.dateRange) {
      parts.push(`date: ${this.query.dateRange.start.toISOString()} to ${this.query.dateRange.end.toISOString()}`);
    }
    
    if (this.query.validationType) {
      parts.push(`type: ${this.query.validationType}`);
    }
    
    if (this.query.status) {
      parts.push(`status: ${this.query.status}`);
    }
    
    if (this.query.userId) {
      parts.push(`user: ${this.query.userId}`);
    }
    
    if (this.query.integration) {
      parts.push(`integration: ${this.query.integration}`);
    }
    
    if (this.query.search) {
      parts.push(`search: "${this.query.search}"`);
    }
    
    if (this.query.sort) {
      parts.push(`sort: ${this.query.sort.field} ${this.query.sort.order}`);
    }
    
    if (this.query.pagination) {
      parts.push(`limit: ${this.query.pagination.limit}, offset: ${this.query.pagination.offset}`);
    }
    
    if (this.conditions.length > 0) {
      parts.push(`conditions: ${this.conditions.length}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'empty query';
  }

  // Private helper methods

  private applyConditions(): void {
    // This method would apply custom conditions to the query
    // For now, we'll keep it simple and rely on the standard query fields
    // In a more advanced implementation, this could build complex WHERE clauses
  }
}

/**
 * Create a new query builder instance
 */
export function createQuery(database?: IHistoryDatabase): QueryBuilder {
  return new QueryBuilder(database);
}

/**
 * Query builder factory with common presets
 */
export class QueryPresets {
  /**
   * Recent failed validations
   */
  static recentFailures(days: number = 7): QueryBuilder {
    return createQuery()
      .failed()
      .lastDays(days)
      .newest();
  }

  /**
   * Validations for a specific spec
   */
  static forSpec(specId: string, days: number = 30): QueryBuilder {
    return createQuery()
      .forSpec(specId)
      .lastDays(days)
      .newest();
  }

  /**
   * User's validation history
   */
  static forUser(userId: string, days: number = 30): QueryBuilder {
    return createQuery()
      .user(userId)
      .lastDays(days)
      .newest();
  }

  /**
   * Integration-specific validations
   */
  static forIntegration(integration: string, days: number = 7): QueryBuilder {
    return createQuery()
      .integration(integration)
      .lastDays(days)
      .newest();
  }

  /**
   * Performance analysis query (slowest validations)
   */
  static performanceAnalysis(days: number = 7): QueryBuilder {
    return createQuery()
      .lastDays(days)
      .slowest()
      .take(100);
  }

  /**
   * Quality trends (all validations with status breakdown)
   */
  static qualityTrends(days: number = 30): QueryBuilder {
    return createQuery()
      .lastDays(days)
      .newest();
  }

  /**
   * Error analysis (failed validations only)
   */
  static errorAnalysis(days: number = 7): QueryBuilder {
    return createQuery()
      .failed()
      .lastDays(days)
      .newest();
  }

  /**
   * Daily summary for today
   */
  static todaySummary(): QueryBuilder {
    return createQuery()
      .today()
      .newest();
  }

  /**
   * Weekly summary
   */
  static weeklySummary(): QueryBuilder {
    return createQuery()
      .thisWeek()
      .newest();
  }

  /**
   * Monthly summary
   */
  static monthlySummary(): QueryBuilder {
    return createQuery()
      .thisMonth()
      .newest();
  }
}
