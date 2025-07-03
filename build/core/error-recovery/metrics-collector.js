/**
 * Metrics Collector
 *
 * Collects and aggregates error recovery metrics and statistics
 */
import { EventEmitter } from 'events';
import { ErrorCategory, RecoveryAction } from './types.js';
/**
 * Metrics collector implementation
 */
export class MetricsCollector extends EventEmitter {
    operations = [];
    errors = [];
    recoveries = [];
    retentionPeriod;
    cleanupInterval;
    constructor(retentionPeriod = 3600000) {
        super();
        this.retentionPeriod = retentionPeriod;
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this._cleanupOldMetrics();
        }, 300000); // Clean up every 5 minutes
    }
    /**
     * Record an operation execution
     */
    recordOperation(operationId, success, duration, error) {
        const metric = {
            operationId,
            timestamp: new Date(),
            success,
            duration,
            ...(error && { error })
        };
        this.operations.push(metric);
        this.emit('operation.recorded', metric);
    }
    /**
     * Record an error occurrence
     */
    recordError(error, classification) {
        const metric = {
            timestamp: new Date(),
            error,
            classification
        };
        this.errors.push(metric);
        this.emit('error.recorded', metric);
    }
    /**
     * Record a recovery attempt
     */
    recordRecovery(action, success, duration) {
        const metric = {
            timestamp: new Date(),
            action,
            success,
            duration
        };
        this.recoveries.push(metric);
        this.emit('recovery.recorded', metric);
    }
    /**
     * Get comprehensive recovery statistics
     */
    getStats() {
        const recentOperations = this._getRecentOperations();
        const recentErrors = this._getRecentErrors();
        const recentRecoveries = this._getRecentRecoveries();
        const totalOperations = recentOperations.length;
        const totalFailures = recentOperations.filter(op => !op.success).length;
        const totalRecoveries = recentRecoveries.length;
        const successRate = totalOperations > 0 ? (totalOperations - totalFailures) / totalOperations : 1;
        // Calculate average recovery time
        const successfulRecoveries = recentRecoveries.filter(r => r.success);
        const averageRecoveryTime = successfulRecoveries.length > 0
            ? successfulRecoveries.reduce((sum, r) => sum + r.duration, 0) / successfulRecoveries.length
            : 0;
        // Error breakdown by category
        const errorBreakdown = {};
        Object.values(ErrorCategory).forEach(category => {
            errorBreakdown[category] = 0;
        });
        recentErrors.forEach(error => {
            errorBreakdown[error.classification.category]++;
        });
        // Recovery breakdown by action
        const recoveryBreakdown = {};
        Object.values(RecoveryAction).forEach(action => {
            recoveryBreakdown[action] = 0;
        });
        recentRecoveries.forEach(recovery => {
            recoveryBreakdown[recovery.action]++;
        });
        return {
            totalOperations,
            totalFailures,
            totalRecoveries,
            successRate,
            averageRecoveryTime,
            errorBreakdown,
            recoveryBreakdown
        };
    }
    /**
     * Get detailed metrics for a specific time period
     */
    getDetailedStats(startTime, endTime) {
        const operations = this.operations.filter(op => op.timestamp >= startTime && op.timestamp <= endTime);
        const errors = this.errors.filter(err => err.timestamp >= startTime && err.timestamp <= endTime);
        const recoveries = this.recoveries.filter(rec => rec.timestamp >= startTime && rec.timestamp <= endTime);
        return {
            period: { startTime, endTime },
            operations: {
                total: operations.length,
                successful: operations.filter(op => op.success).length,
                failed: operations.filter(op => !op.success).length,
                averageDuration: operations.length > 0
                    ? operations.reduce((sum, op) => sum + op.duration, 0) / operations.length
                    : 0
            },
            errors: {
                total: errors.length,
                byCategory: this._groupErrorsByCategory(errors),
                bySeverity: this._groupErrorsBySeverity(errors)
            },
            recoveries: {
                total: recoveries.length,
                successful: recoveries.filter(rec => rec.success).length,
                failed: recoveries.filter(rec => !rec.success).length,
                byAction: this._groupRecoveriesByAction(recoveries),
                averageDuration: recoveries.length > 0
                    ? recoveries.reduce((sum, rec) => sum + rec.duration, 0) / recoveries.length
                    : 0
            }
        };
    }
    /**
     * Get metrics for a specific operation
     */
    getOperationStats(operationId) {
        const operationMetrics = this.operations.filter(op => op.operationId === operationId);
        if (operationMetrics.length === 0) {
            return null;
        }
        const successful = operationMetrics.filter(op => op.success).length;
        const failed = operationMetrics.filter(op => !op.success).length;
        const averageDuration = operationMetrics.reduce((sum, op) => sum + op.duration, 0) / operationMetrics.length;
        return {
            operationId,
            totalExecutions: operationMetrics.length,
            successful,
            failed,
            successRate: successful / operationMetrics.length,
            averageDuration,
            firstExecution: operationMetrics[0]?.timestamp || new Date(),
            lastExecution: operationMetrics[operationMetrics.length - 1]?.timestamp || new Date()
        };
    }
    /**
     * Reset all metrics
     */
    reset() {
        this.operations = [];
        this.errors = [];
        this.recoveries = [];
        this.emit('metrics.reset');
    }
    /**
     * Export metrics data
     */
    exportMetrics() {
        return {
            operations: [...this.operations],
            errors: [...this.errors],
            recoveries: [...this.recoveries],
            exportTime: new Date()
        };
    }
    /**
     * Import metrics data
     */
    importMetrics(data) {
        this.operations = [...data.operations];
        this.errors = [...data.errors];
        this.recoveries = [...data.recoveries];
        this.emit('metrics.imported');
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.removeAllListeners();
    }
    /**
     * Get recent operations within retention period
     */
    _getRecentOperations() {
        const cutoffTime = new Date(Date.now() - this.retentionPeriod);
        return this.operations.filter(op => op.timestamp >= cutoffTime);
    }
    /**
     * Get recent errors within retention period
     */
    _getRecentErrors() {
        const cutoffTime = new Date(Date.now() - this.retentionPeriod);
        return this.errors.filter(err => err.timestamp >= cutoffTime);
    }
    /**
     * Get recent recoveries within retention period
     */
    _getRecentRecoveries() {
        const cutoffTime = new Date(Date.now() - this.retentionPeriod);
        return this.recoveries.filter(rec => rec.timestamp >= cutoffTime);
    }
    /**
     * Clean up old metrics beyond retention period
     */
    _cleanupOldMetrics() {
        const cutoffTime = new Date(Date.now() - this.retentionPeriod);
        const oldOperationsCount = this.operations.length;
        const oldErrorsCount = this.errors.length;
        const oldRecoveriesCount = this.recoveries.length;
        this.operations = this.operations.filter(op => op.timestamp >= cutoffTime);
        this.errors = this.errors.filter(err => err.timestamp >= cutoffTime);
        this.recoveries = this.recoveries.filter(rec => rec.timestamp >= cutoffTime);
        const cleanedOperations = oldOperationsCount - this.operations.length;
        const cleanedErrors = oldErrorsCount - this.errors.length;
        const cleanedRecoveries = oldRecoveriesCount - this.recoveries.length;
        if (cleanedOperations > 0 || cleanedErrors > 0 || cleanedRecoveries > 0) {
            this.emit('metrics.cleaned', {
                operations: cleanedOperations,
                errors: cleanedErrors,
                recoveries: cleanedRecoveries
            });
        }
    }
    /**
     * Group errors by category
     */
    _groupErrorsByCategory(errors) {
        const grouped = {};
        Object.values(ErrorCategory).forEach(category => {
            grouped[category] = 0;
        });
        errors.forEach(error => {
            grouped[error.classification.category]++;
        });
        return grouped;
    }
    /**
     * Group errors by severity
     */
    _groupErrorsBySeverity(errors) {
        const grouped = {};
        errors.forEach(error => {
            const severity = error.classification.severity;
            grouped[severity] = (grouped[severity] || 0) + 1;
        });
        return grouped;
    }
    /**
     * Group recoveries by action
     */
    _groupRecoveriesByAction(recoveries) {
        const grouped = {};
        Object.values(RecoveryAction).forEach(action => {
            grouped[action] = 0;
        });
        recoveries.forEach(recovery => {
            grouped[recovery.action]++;
        });
        return grouped;
    }
}
/**
 * Create a default metrics collector instance
 */
export function createMetricsCollector(retentionPeriod) {
    return new MetricsCollector(retentionPeriod);
}
//# sourceMappingURL=metrics-collector.js.map