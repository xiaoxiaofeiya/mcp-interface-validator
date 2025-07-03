/**
 * Query Builder for Validation History
 *
 * Fluent interface for building complex validation history queries
 */
/**
 * Query builder implementation
 */
export class QueryBuilder {
    query = {};
    conditions = [];
    _database;
    constructor(database) {
        this._database = database;
    }
    /**
     * Add WHERE condition
     */
    where(field, operator, value) {
        this.conditions.push({ field, operator, value });
        return this;
    }
    /**
     * Add AND condition
     */
    and(field, operator, value) {
        this.conditions.push({ field, operator, value, connector: 'AND' });
        return this;
    }
    /**
     * Add OR condition
     */
    or(field, operator, value) {
        this.conditions.push({ field, operator, value, connector: 'OR' });
        return this;
    }
    /**
     * Add ORDER BY clause
     */
    orderBy(field, direction) {
        this.query.sort = { field: field, order: direction };
        return this;
    }
    /**
     * Add LIMIT clause
     */
    limit(count) {
        if (!this.query.pagination) {
            this.query.pagination = { offset: 0, limit: count };
        }
        else {
            this.query.pagination.limit = count;
        }
        return this;
    }
    /**
     * Add OFFSET clause
     */
    offset(count) {
        if (!this.query.pagination) {
            this.query.pagination = { offset: count, limit: 50 };
        }
        else {
            this.query.pagination.offset = count;
        }
        return this;
    }
    /**
     * Filter by specification ID
     */
    forSpec(specId) {
        this.query.specId = specId;
        return this;
    }
    /**
     * Filter by date range
     */
    dateRange(start, end) {
        this.query.dateRange = { start, end };
        return this;
    }
    /**
     * Filter by validation type
     */
    validationType(type) {
        this.query.validationType = type;
        return this;
    }
    /**
     * Filter by status
     */
    status(status) {
        this.query.status = status;
        return this;
    }
    /**
     * Filter by user
     */
    user(userId) {
        this.query.userId = userId;
        return this;
    }
    /**
     * Filter by integration
     */
    integration(integration) {
        this.query.integration = integration;
        return this;
    }
    /**
     * Filter by environment
     */
    environment(environment) {
        this.query.environment = environment;
        return this;
    }
    /**
     * Search in source code and file paths
     */
    search(text) {
        this.query.search = text;
        return this;
    }
    /**
     * Filter by date - today
     */
    today() {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.dateRange(start, end);
    }
    /**
     * Filter by date - yesterday
     */
    yesterday() {
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
    lastDays(days) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        return this.dateRange(start, end);
    }
    /**
     * Filter by date - last week
     */
    lastWeek() {
        return this.lastDays(7);
    }
    /**
     * Filter by date - last month
     */
    lastMonth() {
        return this.lastDays(30);
    }
    /**
     * Filter by date - this week
     */
    thisWeek() {
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
    thisMonth() {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
        end.setUTCHours(23, 59, 59, 999);
        return this.dateRange(start, end);
    }
    /**
     * Filter failed validations only
     */
    failed() {
        return this.status('failed');
    }
    /**
     * Filter passed validations only
     */
    passed() {
        return this.status('passed');
    }
    /**
     * Filter validations with warnings
     */
    withWarnings() {
        return this.status('warning');
    }
    /**
     * Order by timestamp (newest first)
     */
    newest() {
        return this.orderBy('timestamp', 'desc');
    }
    /**
     * Order by timestamp (oldest first)
     */
    oldest() {
        return this.orderBy('timestamp', 'asc');
    }
    /**
     * Order by duration (slowest first)
     */
    slowest() {
        return this.orderBy('metrics', 'desc'); // Will need custom handling for nested field
    }
    /**
     * Order by duration (fastest first)
     */
    fastest() {
        return this.orderBy('metrics', 'asc'); // Will need custom handling for nested field
    }
    /**
     * Get first N results
     */
    take(count) {
        return this.limit(count);
    }
    /**
     * Skip N results
     */
    skip(count) {
        return this.offset(count);
    }
    /**
     * Paginate results
     */
    page(pageNumber, pageSize = 50) {
        const offset = (pageNumber - 1) * pageSize;
        this.query.pagination = { offset, limit: pageSize };
        return this;
    }
    /**
     * Build the final query object
     */
    build() {
        // Apply custom conditions to the query
        this.applyConditions();
        return this.query;
    }
    /**
     * Execute query using the database instance
     */
    async execute() {
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
    async count() {
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
    clone() {
        const cloned = new QueryBuilder();
        cloned.query = { ...this.query };
        cloned.conditions = [...this.conditions];
        return cloned;
    }
    /**
     * Reset the query builder
     */
    reset() {
        this.query = {};
        this.conditions = [];
        return this;
    }
    /**
     * Get query summary for debugging
     */
    getSummary() {
        const parts = [];
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
    applyConditions() {
        // This method would apply custom conditions to the query
        // For now, we'll keep it simple and rely on the standard query fields
        // In a more advanced implementation, this could build complex WHERE clauses
    }
}
/**
 * Create a new query builder instance
 */
export function createQuery(database) {
    return new QueryBuilder(database);
}
/**
 * Query builder factory with common presets
 */
export class QueryPresets {
    /**
     * Recent failed validations
     */
    static recentFailures(days = 7) {
        return createQuery()
            .failed()
            .lastDays(days)
            .newest();
    }
    /**
     * Validations for a specific spec
     */
    static forSpec(specId, days = 30) {
        return createQuery()
            .forSpec(specId)
            .lastDays(days)
            .newest();
    }
    /**
     * User's validation history
     */
    static forUser(userId, days = 30) {
        return createQuery()
            .user(userId)
            .lastDays(days)
            .newest();
    }
    /**
     * Integration-specific validations
     */
    static forIntegration(integration, days = 7) {
        return createQuery()
            .integration(integration)
            .lastDays(days)
            .newest();
    }
    /**
     * Performance analysis query (slowest validations)
     */
    static performanceAnalysis(days = 7) {
        return createQuery()
            .lastDays(days)
            .slowest()
            .take(100);
    }
    /**
     * Quality trends (all validations with status breakdown)
     */
    static qualityTrends(days = 30) {
        return createQuery()
            .lastDays(days)
            .newest();
    }
    /**
     * Error analysis (failed validations only)
     */
    static errorAnalysis(days = 7) {
        return createQuery()
            .failed()
            .lastDays(days)
            .newest();
    }
    /**
     * Daily summary for today
     */
    static todaySummary() {
        return createQuery()
            .today()
            .newest();
    }
    /**
     * Weekly summary
     */
    static weeklySummary() {
        return createQuery()
            .thisWeek()
            .newest();
    }
    /**
     * Monthly summary
     */
    static monthlySummary() {
        return createQuery()
            .thisMonth()
            .newest();
    }
}
//# sourceMappingURL=query-builder.js.map