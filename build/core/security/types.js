/**
 * Security Module Type Definitions
 *
 * Comprehensive type definitions for the security module
 */
// Security Error Types
export class SecurityError extends Error {
    code;
    severity;
    metadata;
    constructor(message, code, severity = 'medium', metadata) {
        super(message);
        this.code = code;
        this.severity = severity;
        this.metadata = metadata;
        this.name = 'SecurityError';
    }
}
export class AuthenticationError extends SecurityError {
    constructor(message, metadata) {
        super(message, 'AUTH_ERROR', 'medium', metadata);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends SecurityError {
    constructor(message, metadata) {
        super(message, 'AUTHZ_ERROR', 'medium', metadata);
        this.name = 'AuthorizationError';
    }
}
export class EncryptionError extends SecurityError {
    constructor(message, metadata) {
        super(message, 'ENCRYPTION_ERROR', 'high', metadata);
        this.name = 'EncryptionError';
    }
}
export class RateLimitError extends SecurityError {
    constructor(message, metadata) {
        super(message, 'RATE_LIMIT_ERROR', 'low', metadata);
        this.name = 'RateLimitError';
    }
}
//# sourceMappingURL=types.js.map