/**
 * Error Recovery System Types
 *
 * Defines types for error classification, recovery strategies, and monitoring
 */
/**
 * Error severity levels
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * Error categories for classification
 */
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["RATE_LIMIT"] = "rate_limit";
    ErrorCategory["TIMEOUT"] = "timeout";
    ErrorCategory["RESOURCE"] = "resource";
    ErrorCategory["CONFIGURATION"] = "configuration";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (ErrorCategory = {}));
/**
 * Recovery action types
 */
export var RecoveryAction;
(function (RecoveryAction) {
    RecoveryAction["RETRY"] = "retry";
    RecoveryAction["FALLBACK"] = "fallback";
    RecoveryAction["CIRCUIT_BREAK"] = "circuit_break";
    RecoveryAction["ROLLBACK"] = "rollback";
    RecoveryAction["ESCALATE"] = "escalate";
    RecoveryAction["IGNORE"] = "ignore";
})(RecoveryAction || (RecoveryAction = {}));
/**
 * Retry strategy types
 */
export var RetryStrategy;
(function (RetryStrategy) {
    RetryStrategy["FIXED"] = "fixed";
    RetryStrategy["LINEAR"] = "linear";
    RetryStrategy["EXPONENTIAL"] = "exponential";
    RetryStrategy["CUSTOM"] = "custom";
})(RetryStrategy || (RetryStrategy = {}));
/**
 * Circuit breaker states
 */
export var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "closed";
    CircuitBreakerState["OPEN"] = "open";
    CircuitBreakerState["HALF_OPEN"] = "half_open";
})(CircuitBreakerState || (CircuitBreakerState = {}));
//# sourceMappingURL=types.js.map