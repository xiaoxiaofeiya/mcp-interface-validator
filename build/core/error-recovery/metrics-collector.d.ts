/**
 * Metrics Collector
 *
 * Collects and aggregates error recovery metrics and statistics
 */
import { EventEmitter } from 'events';
import type { ErrorClassification, RecoveryStats, IMetricsCollector } from './types';
import { ErrorCategory, RecoveryAction } from './types';
/**
 * Operation metric
 */
interface OperationMetric {
    operationId: string;
    timestamp: Date;
    success: boolean;
    duration: number;
    error?: Error;
}
/**
 * Error metric
 */
interface ErrorMetric {
    timestamp: Date;
    error: Error;
    classification: ErrorClassification;
}
/**
 * Recovery metric
 */
interface RecoveryMetric {
    timestamp: Date;
    action: RecoveryAction;
    success: boolean;
    duration: number;
}
/**
 * Metrics collector implementation
 */
export declare class MetricsCollector extends EventEmitter implements IMetricsCollector {
    private operations;
    private errors;
    private recoveries;
    private retentionPeriod;
    private cleanupInterval;
    constructor(retentionPeriod?: number);
    /**
     * Record an operation execution
     */
    recordOperation(operationId: string, success: boolean, duration: number, error?: Error): void;
    /**
     * Record an error occurrence
     */
    recordError(error: Error, classification: ErrorClassification): void;
    /**
     * Record a recovery attempt
     */
    recordRecovery(action: RecoveryAction, success: boolean, duration: number): void;
    /**
     * Get comprehensive recovery statistics
     */
    getStats(): RecoveryStats;
    /**
     * Get detailed metrics for a specific time period
     */
    getDetailedStats(startTime: Date, endTime: Date): {
        period: {
            startTime: Date;
            endTime: Date;
        };
        operations: {
            total: number;
            successful: number;
            failed: number;
            averageDuration: number;
        };
        errors: {
            total: number;
            byCategory: Record<ErrorCategory, number>;
            bySeverity: Record<string, number>;
        };
        recoveries: {
            total: number;
            successful: number;
            failed: number;
            byAction: Record<RecoveryAction, number>;
            averageDuration: number;
        };
    };
    /**
     * Get metrics for a specific operation
     */
    getOperationStats(operationId: string): {
        operationId: string;
        totalExecutions: number;
        successful: number;
        failed: number;
        successRate: number;
        averageDuration: number;
        firstExecution: Date;
        lastExecution: Date;
    } | null;
    /**
     * Reset all metrics
     */
    reset(): void;
    /**
     * Export metrics data
     */
    exportMetrics(): {
        operations: OperationMetric[];
        errors: ErrorMetric[];
        recoveries: RecoveryMetric[];
        exportTime: Date;
    };
    /**
     * Import metrics data
     */
    importMetrics(data: {
        operations: OperationMetric[];
        errors: ErrorMetric[];
        recoveries: RecoveryMetric[];
    }): void;
    /**
     * Cleanup resources
     */
    destroy(): void;
    /**
     * Get recent operations within retention period
     */
    private _getRecentOperations;
    /**
     * Get recent errors within retention period
     */
    private _getRecentErrors;
    /**
     * Get recent recoveries within retention period
     */
    private _getRecentRecoveries;
    /**
     * Clean up old metrics beyond retention period
     */
    private _cleanupOldMetrics;
    /**
     * Group errors by category
     */
    private _groupErrorsByCategory;
    /**
     * Group errors by severity
     */
    private _groupErrorsBySeverity;
    /**
     * Group recoveries by action
     */
    private _groupRecoveriesByAction;
}
/**
 * Create a default metrics collector instance
 */
export declare function createMetricsCollector(retentionPeriod?: number): MetricsCollector;
export {};
//# sourceMappingURL=metrics-collector.d.ts.map