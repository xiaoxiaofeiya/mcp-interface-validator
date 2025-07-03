/**
 * Error Classifier
 *
 * Classifies errors by category, severity, and recovery recommendations
 */
import type { ErrorClassification, IErrorClassifier } from './types';
import { ErrorCategory, ErrorSeverity } from './types';
/**
 * Classification rule
 */
interface ClassificationRule {
    predicate: (error: Error) => boolean;
    classification: ErrorClassification;
    priority: number;
}
/**
 * Default error classifier implementation
 */
export declare class ErrorClassifier implements IErrorClassifier {
    private rules;
    constructor();
    /**
     * Classify an error
     */
    classify(error: Error): ErrorClassification;
    /**
     * Add a custom classification rule
     */
    addRule(predicate: (error: Error) => boolean, classification: ErrorClassification, priority?: number): void;
    /**
     * Remove a classification rule
     */
    removeRule(predicate: (error: Error) => boolean): void;
    /**
     * Clear all custom rules and reset to defaults
     */
    reset(): void;
    /**
     * Get all classification rules
     */
    getRules(): ClassificationRule[];
    /**
     * Initialize default classification rules
     */
    private _initializeDefaultRules;
    /**
     * Check if error is network-related
     */
    private _isNetworkError;
    /**
     * Check if error is timeout-related
     */
    private _isTimeoutError;
    /**
     * Check if error is rate limit-related
     */
    private _isRateLimitError;
    /**
     * Check if error is authentication-related
     */
    private _isAuthenticationError;
    /**
     * Check if error is authorization-related
     */
    private _isAuthorizationError;
    /**
     * Check if error is validation-related
     */
    private _isValidationError;
    /**
     * Check if error is resource-related
     */
    private _isResourceError;
    /**
     * Check if error is configuration-related
     */
    private _isConfigurationError;
    /**
     * Check if error is system-related
     */
    private _isSystemError;
}
/**
 * Create a default error classifier instance
 */
export declare function createDefaultErrorClassifier(): ErrorClassifier;
/**
 * Utility functions for common error classifications
 */
export declare const ErrorClassifierUtils: {
    /**
     * Create a classification for retryable errors
     */
    createRetryableClassification(category: ErrorCategory, severity?: ErrorSeverity): ErrorClassification;
    /**
     * Create a classification for non-retryable errors
     */
    createNonRetryableClassification(category: ErrorCategory, severity?: ErrorSeverity): ErrorClassification;
    /**
     * Create a classification for fallback-eligible errors
     */
    createFallbackClassification(category: ErrorCategory, severity?: ErrorSeverity): ErrorClassification;
};
export {};
//# sourceMappingURL=error-classifier.d.ts.map