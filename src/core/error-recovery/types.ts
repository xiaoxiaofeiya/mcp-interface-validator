/**
 * Error Recovery System Types
 * 
 * Defines types for error classification, recovery strategies, and monitoring
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  RESOURCE = 'resource',
  CONFIGURATION = 'configuration',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

/**
 * Recovery action types
 */
export enum RecoveryAction {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  CIRCUIT_BREAK = 'circuit_break',
  ROLLBACK = 'rollback',
  ESCALATE = 'escalate',
  IGNORE = 'ignore'
}

/**
 * Retry strategy types
 */
export enum RetryStrategy {
  FIXED = 'fixed',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  CUSTOM = 'custom'
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Error classification result
 */
export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRecoverable: boolean;
  recommendedAction: RecoveryAction;
  metadata: Record<string, any>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  strategy: RetryStrategy;
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: ErrorCategory[];
  customDelayFunction?: (attempt: number, baseDelay: number) => number;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  minimumThroughput: number;
}

/**
 * Recovery context
 */
export interface RecoveryContext {
  operationId: string;
  attempt: number;
  startTime: Date;
  lastError?: Error;
  metadata: Record<string, any>;
  checkpoints: StateCheckpoint[];
}

/**
 * State checkpoint for rollback
 */
export interface StateCheckpoint {
  id: string;
  timestamp: Date;
  state: any;
  description: string;
}

/**
 * Recovery attempt result
 */
export interface RecoveryAttempt {
  attempt: number;
  timestamp: Date;
  action: RecoveryAction;
  success: boolean;
  error?: Error;
  duration: number;
  metadata: Record<string, any>;
}

/**
 * Recovery statistics
 */
export interface RecoveryStats {
  totalOperations: number;
  totalFailures: number;
  totalRecoveries: number;
  successRate: number;
  averageRecoveryTime: number;
  errorBreakdown: Record<ErrorCategory, number>;
  recoveryBreakdown: Record<RecoveryAction, number>;
}

/**
 * Fallback function type
 */
export type FallbackFunction<T> = (error: Error, context: RecoveryContext) => Promise<T>;

/**
 * Recovery operation function type
 */
export type RecoveryOperation<T> = () => Promise<T>;

/**
 * Error classifier function type
 */
export type ErrorClassifier = (error: Error) => ErrorClassification;

/**
 * Recovery strategy configuration
 */
export interface RecoveryStrategyConfig {
  retryConfig: RetryConfig;
  circuitBreakerConfig?: CircuitBreakerConfig;
  fallbackFunction?: FallbackFunction<any>;
  enableStateManagement: boolean;
  enableMetrics: boolean;
  customClassifier?: ErrorClassifier;
}

/**
 * Recovery manager configuration
 */
export interface RecoveryManagerConfig {
  defaultStrategy: RecoveryStrategyConfig;
  strategies: Record<string, RecoveryStrategyConfig>;
  globalTimeout: number;
  enableLogging: boolean;
  metricsRetentionPeriod: number;
}

/**
 * Recovery result
 */
export interface RecoveryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: RecoveryAttempt[];
  totalDuration: number;
  recoveryAction: RecoveryAction;
  context: RecoveryContext;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details: Record<string, any>;
  errors: Error[];
  metrics?: Record<string, any>;
}

/**
 * Recovery event types
 */
export interface RecoveryEvents {
  'recovery.started': (context: RecoveryContext) => void;
  'recovery.attempt': (attempt: RecoveryAttempt, context: RecoveryContext) => void;
  'recovery.success': (result: RecoveryResult<any>) => void;
  'recovery.failure': (result: RecoveryResult<any>) => void;
  'circuit.opened': (operationId: string) => void;
  'circuit.closed': (operationId: string) => void;
  'circuit.halfOpen': (operationId: string) => void;
  'fallback.executed': (operationId: string, error: Error) => void;
  'rollback.executed': (operationId: string, checkpointId: string) => void;
}

/**
 * Recovery manager interface
 */
export interface IRecoveryManager {
  execute<T>(
    operation: RecoveryOperation<T>,
    operationId: string,
    strategyName?: string
  ): Promise<RecoveryResult<T>>;
  
  createCheckpoint(operationId: string, state: any, description: string): string;
  rollbackToCheckpoint(operationId: string, checkpointId: string): Promise<void>;
  
  getStats(): RecoveryStats;
  getHealthStatus(): HealthCheckResult;
  
  addStrategy(name: string, config: RecoveryStrategyConfig): void;
  removeStrategy(name: string): void;
  
  reset(): void;
  shutdown(): Promise<void>;
}

/**
 * Error classifier interface
 */
export interface IErrorClassifier {
  classify(error: Error): ErrorClassification;
  addRule(predicate: (error: Error) => boolean, classification: ErrorClassification): void;
  removeRule(predicate: (error: Error) => boolean): void;
}

/**
 * Retry manager interface
 */
export interface IRetryManager {
  execute<T>(
    operation: RecoveryOperation<T>,
    config: RetryConfig,
    context: RecoveryContext
  ): Promise<T>;
  
  calculateDelay(attempt: number, config: RetryConfig): number;
  shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean;
}

/**
 * Circuit breaker interface
 */
export interface ICircuitBreaker {
  execute<T>(operation: RecoveryOperation<T>): Promise<T>;
  getState(): CircuitBreakerState;
  reset(): void;
  forceOpen(): void;
  forceClose(): void;
}

/**
 * State manager interface
 */
export interface IStateManager {
  createCheckpoint(id: string, state: any, description: string): StateCheckpoint;
  rollback(checkpointId: string): Promise<any>;
  clearCheckpoints(operationId?: string): void;
  getCheckpoints(operationId?: string): StateCheckpoint[];
}

/**
 * Metrics collector interface
 */
export interface IMetricsCollector {
  recordOperation(operationId: string, success: boolean, duration: number): void;
  recordError(error: Error, classification: ErrorClassification): void;
  recordRecovery(action: RecoveryAction, success: boolean, duration: number): void;
  getStats(): RecoveryStats;
  reset(): void;
}
