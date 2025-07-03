/**
 * Metrics Collector
 * 
 * Collects and aggregates error recovery metrics and statistics
 */

import { EventEmitter } from 'events';
import type {
  ErrorClassification,
  RecoveryStats,
  IMetricsCollector
} from './types';
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
export class MetricsCollector extends EventEmitter implements IMetricsCollector {
  private operations: OperationMetric[] = [];
  private errors: ErrorMetric[] = [];
  private recoveries: RecoveryMetric[] = [];
  private retentionPeriod: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(retentionPeriod: number = 3600000) { // 1 hour default
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
  recordOperation(operationId: string, success: boolean, duration: number, error?: Error): void {
    const metric: OperationMetric = {
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
  recordError(error: Error, classification: ErrorClassification): void {
    const metric: ErrorMetric = {
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
  recordRecovery(action: RecoveryAction, success: boolean, duration: number): void {
    const metric: RecoveryMetric = {
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
  getStats(): RecoveryStats {
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
    const errorBreakdown: Record<ErrorCategory, number> = {} as Record<ErrorCategory, number>;
    Object.values(ErrorCategory).forEach(category => {
      errorBreakdown[category] = 0;
    });
    recentErrors.forEach(error => {
      errorBreakdown[error.classification.category]++;
    });

    // Recovery breakdown by action
    const recoveryBreakdown: Record<RecoveryAction, number> = {} as Record<RecoveryAction, number>;
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
  getDetailedStats(startTime: Date, endTime: Date) {
    const operations = this.operations.filter(
      op => op.timestamp >= startTime && op.timestamp <= endTime
    );
    const errors = this.errors.filter(
      err => err.timestamp >= startTime && err.timestamp <= endTime
    );
    const recoveries = this.recoveries.filter(
      rec => rec.timestamp >= startTime && rec.timestamp <= endTime
    );

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
  getOperationStats(operationId: string) {
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
  reset(): void {
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
  importMetrics(data: {
    operations: OperationMetric[];
    errors: ErrorMetric[];
    recoveries: RecoveryMetric[];
  }): void {
    this.operations = [...data.operations];
    this.errors = [...data.errors];
    this.recoveries = [...data.recoveries];
    this.emit('metrics.imported');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
  }

  /**
   * Get recent operations within retention period
   */
  private _getRecentOperations(): OperationMetric[] {
    const cutoffTime = new Date(Date.now() - this.retentionPeriod);
    return this.operations.filter(op => op.timestamp >= cutoffTime);
  }

  /**
   * Get recent errors within retention period
   */
  private _getRecentErrors(): ErrorMetric[] {
    const cutoffTime = new Date(Date.now() - this.retentionPeriod);
    return this.errors.filter(err => err.timestamp >= cutoffTime);
  }

  /**
   * Get recent recoveries within retention period
   */
  private _getRecentRecoveries(): RecoveryMetric[] {
    const cutoffTime = new Date(Date.now() - this.retentionPeriod);
    return this.recoveries.filter(rec => rec.timestamp >= cutoffTime);
  }

  /**
   * Clean up old metrics beyond retention period
   */
  private _cleanupOldMetrics(): void {
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
  private _groupErrorsByCategory(errors: ErrorMetric[]): Record<ErrorCategory, number> {
    const grouped: Record<ErrorCategory, number> = {} as Record<ErrorCategory, number>;
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
  private _groupErrorsBySeverity(errors: ErrorMetric[]) {
    const grouped: Record<string, number> = {};
    
    errors.forEach(error => {
      const severity = error.classification.severity;
      grouped[severity] = (grouped[severity] || 0) + 1;
    });
    
    return grouped;
  }

  /**
   * Group recoveries by action
   */
  private _groupRecoveriesByAction(recoveries: RecoveryMetric[]): Record<RecoveryAction, number> {
    const grouped: Record<RecoveryAction, number> = {} as Record<RecoveryAction, number>;
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
export function createMetricsCollector(retentionPeriod?: number): MetricsCollector {
  return new MetricsCollector(retentionPeriod);
}
