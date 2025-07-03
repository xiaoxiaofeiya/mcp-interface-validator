/**
 * Error Classifier
 * 
 * Classifies errors by category, severity, and recovery recommendations
 */

import type {
  ErrorClassification,
  IErrorClassifier
} from './types.js';
import { ErrorCategory, ErrorSeverity, RecoveryAction } from './types.js';

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
export class ErrorClassifier implements IErrorClassifier {
  private rules: ClassificationRule[] = [];

  constructor() {
    this._initializeDefaultRules();
  }

  /**
   * Classify an error
   */
  classify(error: Error): ErrorClassification {
    // Find the highest priority matching rule
    const matchingRule = this.rules
      .filter(rule => rule.predicate(error))
      .sort((a, b) => b.priority - a.priority)[0];

    if (matchingRule) {
      return {
        ...matchingRule.classification,
        metadata: {
          ...matchingRule.classification.metadata,
          errorMessage: error.message,
          errorStack: error.stack,
          timestamp: new Date()
        }
      };
    }

    // Default classification for unknown errors
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      isRecoverable: true,
      recommendedAction: RecoveryAction.RETRY,
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date()
      }
    };
  }

  /**
   * Add a custom classification rule
   */
  addRule(predicate: (error: Error) => boolean, classification: ErrorClassification, priority: number = 0): void {
    this.rules.push({
      predicate,
      classification,
      priority
    });
    
    // Sort rules by priority (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a classification rule
   */
  removeRule(predicate: (error: Error) => boolean): void {
    this.rules = this.rules.filter(rule => rule.predicate !== predicate);
  }

  /**
   * Clear all custom rules and reset to defaults
   */
  reset(): void {
    this.rules = [];
    this._initializeDefaultRules();
  }

  /**
   * Get all classification rules
   */
  getRules(): ClassificationRule[] {
    return [...this.rules];
  }

  /**
   * Initialize default classification rules
   */
  private _initializeDefaultRules(): void {
    // Network errors
    this.addRule(
      (error) => this._isNetworkError(error),
      {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        isRecoverable: true,
        recommendedAction: RecoveryAction.RETRY,
        metadata: { retryable: true }
      },
      100
    );

    // Timeout errors
    this.addRule(
      (error) => this._isTimeoutError(error),
      {
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        isRecoverable: true,
        recommendedAction: RecoveryAction.RETRY,
        metadata: { retryable: true }
      },
      90
    );

    // Rate limit errors
    this.addRule(
      (error) => this._isRateLimitError(error),
      {
        category: ErrorCategory.RATE_LIMIT,
        severity: ErrorSeverity.LOW,
        isRecoverable: true,
        recommendedAction: RecoveryAction.RETRY,
        metadata: { retryable: true, backoffRequired: true }
      },
      80
    );

    // Authentication errors
    this.addRule(
      (error) => this._isAuthenticationError(error),
      {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        isRecoverable: false,
        recommendedAction: RecoveryAction.ESCALATE,
        metadata: { retryable: false }
      },
      70
    );

    // Authorization errors
    this.addRule(
      (error) => this._isAuthorizationError(error),
      {
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        isRecoverable: false,
        recommendedAction: RecoveryAction.ESCALATE,
        metadata: { retryable: false }
      },
      70
    );

    // Validation errors
    this.addRule(
      (error) => this._isValidationError(error),
      {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        isRecoverable: false,
        recommendedAction: RecoveryAction.ESCALATE,
        metadata: { retryable: false }
      },
      60
    );

    // Resource errors
    this.addRule(
      (error) => this._isResourceError(error),
      {
        category: ErrorCategory.RESOURCE,
        severity: ErrorSeverity.HIGH,
        isRecoverable: true,
        recommendedAction: RecoveryAction.FALLBACK,
        metadata: { retryable: true }
      },
      50
    );

    // Configuration errors
    this.addRule(
      (error) => this._isConfigurationError(error),
      {
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.CRITICAL,
        isRecoverable: false,
        recommendedAction: RecoveryAction.ESCALATE,
        metadata: { retryable: false }
      },
      40
    );

    // System errors
    this.addRule(
      (error) => this._isSystemError(error),
      {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        isRecoverable: true,
        recommendedAction: RecoveryAction.CIRCUIT_BREAK,
        metadata: { retryable: true }
      },
      30
    );
  }

  /**
   * Check if error is network-related
   */
  private _isNetworkError(error: Error): boolean {
    const networkKeywords = [
      'ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT',
      'network', 'connection', 'socket', 'dns', 'fetch'
    ];
    
    const message = error.message.toLowerCase();
    return networkKeywords.some(keyword => message.includes(keyword.toLowerCase()));
  }

  /**
   * Check if error is timeout-related
   */
  private _isTimeoutError(error: Error): boolean {
    const timeoutKeywords = ['timeout', 'timed out', 'deadline exceeded'];
    const message = error.message.toLowerCase();
    return timeoutKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is rate limit-related
   */
  private _isRateLimitError(error: Error): boolean {
    const rateLimitKeywords = ['rate limit', 'too many requests', '429', 'quota exceeded'];
    const message = error.message.toLowerCase();
    return rateLimitKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is authentication-related
   */
  private _isAuthenticationError(error: Error): boolean {
    const authKeywords = ['unauthorized', '401', 'authentication', 'invalid credentials'];
    const message = error.message.toLowerCase();
    return authKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is authorization-related
   */
  private _isAuthorizationError(error: Error): boolean {
    const authzKeywords = ['forbidden', '403', 'authorization', 'access denied', 'permission'];
    const message = error.message.toLowerCase();
    return authzKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is validation-related
   */
  private _isValidationError(error: Error): boolean {
    const validationKeywords = ['validation', 'invalid', 'bad request', '400', 'malformed'];
    const message = error.message.toLowerCase();
    return validationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is resource-related
   */
  private _isResourceError(error: Error): boolean {
    const resourceKeywords = ['not found', '404', 'resource', 'file not found', 'missing'];
    const message = error.message.toLowerCase();
    return resourceKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is configuration-related
   */
  private _isConfigurationError(error: Error): boolean {
    const configKeywords = ['configuration', 'config', 'environment', 'setting', 'property'];
    const message = error.message.toLowerCase();
    return configKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is system-related
   */
  private _isSystemError(error: Error): boolean {
    const systemKeywords = ['internal server error', '500', 'system', 'server', 'service unavailable', '503'];
    const message = error.message.toLowerCase();
    return systemKeywords.some(keyword => message.includes(keyword));
  }
}

/**
 * Create a default error classifier instance
 */
export function createDefaultErrorClassifier(): ErrorClassifier {
  return new ErrorClassifier();
}

/**
 * Utility functions for common error classifications
 */
export const ErrorClassifierUtils = {
  /**
   * Create a classification for retryable errors
   */
  createRetryableClassification(category: ErrorCategory, severity: ErrorSeverity = ErrorSeverity.MEDIUM): ErrorClassification {
    return {
      category,
      severity,
      isRecoverable: true,
      recommendedAction: RecoveryAction.RETRY,
      metadata: { retryable: true }
    };
  },

  /**
   * Create a classification for non-retryable errors
   */
  createNonRetryableClassification(category: ErrorCategory, severity: ErrorSeverity = ErrorSeverity.HIGH): ErrorClassification {
    return {
      category,
      severity,
      isRecoverable: false,
      recommendedAction: RecoveryAction.ESCALATE,
      metadata: { retryable: false }
    };
  },

  /**
   * Create a classification for fallback-eligible errors
   */
  createFallbackClassification(category: ErrorCategory, severity: ErrorSeverity = ErrorSeverity.MEDIUM): ErrorClassification {
    return {
      category,
      severity,
      isRecoverable: true,
      recommendedAction: RecoveryAction.FALLBACK,
      metadata: { retryable: true, fallbackEligible: true }
    };
  }
};
