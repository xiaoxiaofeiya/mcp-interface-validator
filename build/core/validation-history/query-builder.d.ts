/**
 * Query Builder for Validation History
 *
 * Fluent interface for building complex validation history queries
 */
import type { HistoryQuery, ValidationHistoryEntry } from './types.js';
import type { IQueryBuilder, IHistoryDatabase } from './database/interface.js';
/**
 * Query builder implementation
 */
export declare class QueryBuilder implements IQueryBuilder {
    private query;
    private conditions;
    private _database;
    constructor(database?: IHistoryDatabase);
    /**
     * Add WHERE condition
     */
    where(field: string, operator: string, value: any): IQueryBuilder;
    /**
     * Add AND condition
     */
    and(field: string, operator: string, value: any): IQueryBuilder;
    /**
     * Add OR condition
     */
    or(field: string, operator: string, value: any): IQueryBuilder;
    /**
     * Add ORDER BY clause
     */
    orderBy(field: string, direction: 'asc' | 'desc'): IQueryBuilder;
    /**
     * Add LIMIT clause
     */
    limit(count: number): IQueryBuilder;
    /**
     * Add OFFSET clause
     */
    offset(count: number): IQueryBuilder;
    /**
     * Filter by specification ID
     */
    forSpec(specId: string): QueryBuilder;
    /**
     * Filter by date range
     */
    dateRange(start: Date, end: Date): QueryBuilder;
    /**
     * Filter by validation type
     */
    validationType(type: 'frontend' | 'backend' | 'both'): QueryBuilder;
    /**
     * Filter by status
     */
    status(status: 'passed' | 'failed' | 'warning'): QueryBuilder;
    /**
     * Filter by user
     */
    user(userId: string): QueryBuilder;
    /**
     * Filter by integration
     */
    integration(integration: string): QueryBuilder;
    /**
     * Filter by environment
     */
    environment(environment: string): QueryBuilder;
    /**
     * Search in source code and file paths
     */
    search(text: string): QueryBuilder;
    /**
     * Filter by date - today
     */
    today(): QueryBuilder;
    /**
     * Filter by date - yesterday
     */
    yesterday(): QueryBuilder;
    /**
     * Filter by date - last N days
     */
    lastDays(days: number): QueryBuilder;
    /**
     * Filter by date - last week
     */
    lastWeek(): QueryBuilder;
    /**
     * Filter by date - last month
     */
    lastMonth(): QueryBuilder;
    /**
     * Filter by date - this week
     */
    thisWeek(): QueryBuilder;
    /**
     * Filter by date - this month
     */
    thisMonth(): QueryBuilder;
    /**
     * Filter failed validations only
     */
    failed(): QueryBuilder;
    /**
     * Filter passed validations only
     */
    passed(): QueryBuilder;
    /**
     * Filter validations with warnings
     */
    withWarnings(): QueryBuilder;
    /**
     * Order by timestamp (newest first)
     */
    newest(): QueryBuilder;
    /**
     * Order by timestamp (oldest first)
     */
    oldest(): QueryBuilder;
    /**
     * Order by duration (slowest first)
     */
    slowest(): QueryBuilder;
    /**
     * Order by duration (fastest first)
     */
    fastest(): QueryBuilder;
    /**
     * Get first N results
     */
    take(count: number): QueryBuilder;
    /**
     * Skip N results
     */
    skip(count: number): QueryBuilder;
    /**
     * Paginate results
     */
    page(pageNumber: number, pageSize?: number): QueryBuilder;
    /**
     * Build the final query object
     */
    build(): HistoryQuery;
    /**
     * Execute query using the database instance
     */
    execute(): Promise<ValidationHistoryEntry[]>;
    /**
     * Count matching records using the database instance
     */
    count(): Promise<number>;
    /**
     * Clone the query builder
     */
    clone(): QueryBuilder;
    /**
     * Reset the query builder
     */
    reset(): QueryBuilder;
    /**
     * Get query summary for debugging
     */
    getSummary(): string;
    private applyConditions;
}
/**
 * Create a new query builder instance
 */
export declare function createQuery(database?: IHistoryDatabase): QueryBuilder;
/**
 * Query builder factory with common presets
 */
export declare class QueryPresets {
    /**
     * Recent failed validations
     */
    static recentFailures(days?: number): QueryBuilder;
    /**
     * Validations for a specific spec
     */
    static forSpec(specId: string, days?: number): QueryBuilder;
    /**
     * User's validation history
     */
    static forUser(userId: string, days?: number): QueryBuilder;
    /**
     * Integration-specific validations
     */
    static forIntegration(integration: string, days?: number): QueryBuilder;
    /**
     * Performance analysis query (slowest validations)
     */
    static performanceAnalysis(days?: number): QueryBuilder;
    /**
     * Quality trends (all validations with status breakdown)
     */
    static qualityTrends(days?: number): QueryBuilder;
    /**
     * Error analysis (failed validations only)
     */
    static errorAnalysis(days?: number): QueryBuilder;
    /**
     * Daily summary for today
     */
    static todaySummary(): QueryBuilder;
    /**
     * Weekly summary
     */
    static weeklySummary(): QueryBuilder;
    /**
     * Monthly summary
     */
    static monthlySummary(): QueryBuilder;
}
//# sourceMappingURL=query-builder.d.ts.map