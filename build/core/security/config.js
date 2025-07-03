/**
 * Security Module Configuration
 *
 * Default configurations and configuration utilities for the security module
 */
/**
 * Default Security Configuration
 */
export const DEFAULT_SECURITY_CONFIG = {
    authentication: {
        enabled: true,
        tokenExpiry: 3600, // 1 hour
        maxLoginAttempts: 5,
        lockoutDuration: 900, // 15 minutes
        requireTwoFactor: false
    },
    authorization: {
        enabled: true,
        defaultRole: 'user',
        roleHierarchy: {
            'admin': ['user', 'viewer'],
            'user': ['viewer'],
            'viewer': []
        }
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 256,
        ivLength: 16,
        saltLength: 32,
        iterations: 100000
    },
    rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false
    },
    audit: {
        enabled: true,
        logLevel: 'standard',
        retentionDays: 30
    }
};
/**
 * Development Security Configuration (Less Strict)
 */
export const DEVELOPMENT_SECURITY_CONFIG = {
    authentication: {
        enabled: true,
        tokenExpiry: 7200, // 2 hours
        maxLoginAttempts: 10,
        lockoutDuration: 300, // 5 minutes
        requireTwoFactor: false
    },
    authorization: {
        enabled: false, // Disabled for development
        defaultRole: 'admin',
        roleHierarchy: {
            'admin': ['user', 'viewer'],
            'user': ['viewer'],
            'viewer': []
        }
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 256,
        ivLength: 16,
        saltLength: 16, // Smaller for faster processing
        iterations: 10000 // Reduced for faster processing
    },
    rateLimit: {
        enabled: false, // Disabled for development
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 1000,
        skipSuccessfulRequests: true
    },
    audit: {
        enabled: true,
        logLevel: 'detailed',
        retentionDays: 7
    }
};
/**
 * Production Security Configuration (Strict)
 */
export const PRODUCTION_SECURITY_CONFIG = {
    authentication: {
        enabled: true,
        tokenExpiry: 1800, // 30 minutes
        maxLoginAttempts: 3,
        lockoutDuration: 1800, // 30 minutes
        requireTwoFactor: true
    },
    authorization: {
        enabled: true,
        defaultRole: 'viewer',
        roleHierarchy: {
            'admin': ['user', 'viewer'],
            'user': ['viewer'],
            'viewer': []
        }
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 256,
        ivLength: 16,
        saltLength: 64, // Larger for better security
        iterations: 200000 // Higher for better security
    },
    rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 50,
        skipSuccessfulRequests: false
    },
    audit: {
        enabled: true,
        logLevel: 'detailed',
        retentionDays: 90
    }
};
/**
 * Testing Security Configuration (Minimal)
 */
export const TESTING_SECURITY_CONFIG = {
    authentication: {
        enabled: true,
        tokenExpiry: 300, // 5 minutes
        maxLoginAttempts: 3,
        lockoutDuration: 60, // 1 minute
        requireTwoFactor: false
    },
    authorization: {
        enabled: true,
        defaultRole: 'user',
        roleHierarchy: {
            'admin': ['user', 'viewer'],
            'user': ['viewer'],
            'viewer': []
        }
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 256,
        ivLength: 16,
        saltLength: 16,
        iterations: 1000 // Very low for fast testing
    },
    rateLimit: {
        enabled: true,
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        skipSuccessfulRequests: false
    },
    audit: {
        enabled: true,
        logLevel: 'minimal',
        retentionDays: 1
    }
};
/**
 * Default Security Policies
 */
export const DEFAULT_SECURITY_POLICIES = [
    {
        id: 'password-policy',
        name: 'Password Policy',
        description: 'Enforce strong password requirements',
        rules: [
            {
                id: 'min-length',
                type: 'authentication',
                condition: 'password.length >= 8',
                action: 'deny',
                parameters: { minLength: 8 }
            },
            {
                id: 'complexity',
                type: 'authentication',
                condition: 'password.hasUppercase && password.hasLowercase && password.hasNumbers && password.hasSpecialChars',
                action: 'deny',
                parameters: {
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true
                }
            }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'session-policy',
        name: 'Session Management Policy',
        description: 'Manage user sessions and timeouts',
        rules: [
            {
                id: 'session-timeout',
                type: 'authentication',
                condition: 'session.lastActivity + sessionTimeout < now',
                action: 'deny',
                parameters: { sessionTimeout: 3600 }
            },
            {
                id: 'concurrent-sessions',
                type: 'authentication',
                condition: 'user.activeSessions <= maxConcurrentSessions',
                action: 'deny',
                parameters: { maxConcurrentSessions: 3 }
            }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'access-control-policy',
        name: 'Access Control Policy',
        description: 'Control access to resources based on roles',
        rules: [
            {
                id: 'admin-access',
                type: 'authorization',
                condition: 'user.roles.includes("admin")',
                action: 'allow',
                parameters: { resources: ['*'], actions: ['*'] }
            },
            {
                id: 'user-access',
                type: 'authorization',
                condition: 'user.roles.includes("user")',
                action: 'allow',
                parameters: {
                    resources: ['validation', 'monitoring'],
                    actions: ['read', 'execute']
                }
            },
            {
                id: 'viewer-access',
                type: 'authorization',
                condition: 'user.roles.includes("viewer")',
                action: 'allow',
                parameters: {
                    resources: ['validation', 'monitoring'],
                    actions: ['read']
                }
            }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'rate-limiting-policy',
        name: 'Rate Limiting Policy',
        description: 'Prevent abuse through rate limiting',
        rules: [
            {
                id: 'api-rate-limit',
                type: 'rateLimit',
                condition: 'requests.count <= maxRequests',
                action: 'deny',
                parameters: {
                    windowMs: 900000, // 15 minutes
                    maxRequests: 100
                }
            },
            {
                id: 'auth-rate-limit',
                type: 'rateLimit',
                condition: 'auth.attempts <= maxAttempts',
                action: 'deny',
                parameters: {
                    windowMs: 300000, // 5 minutes
                    maxAttempts: 5
                }
            }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'audit-policy',
        name: 'Audit Policy',
        description: 'Log security events for compliance',
        rules: [
            {
                id: 'log-authentication',
                type: 'audit',
                condition: 'event.type === "authentication"',
                action: 'log',
                parameters: { level: 'standard' }
            },
            {
                id: 'log-authorization',
                type: 'audit',
                condition: 'event.type === "authorization"',
                action: 'log',
                parameters: { level: 'standard' }
            },
            {
                id: 'alert-critical',
                type: 'audit',
                condition: 'event.severity === "critical"',
                action: 'alert',
                parameters: { notificationChannels: ['email', 'sms'] }
            }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
/**
 * Configuration utility functions
 */
export class SecurityConfigManager {
    /**
     * Get configuration based on environment
     */
    static getConfigForEnvironment(env) {
        switch (env) {
            case 'development':
                return DEVELOPMENT_SECURITY_CONFIG;
            case 'production':
                return PRODUCTION_SECURITY_CONFIG;
            case 'testing':
                return TESTING_SECURITY_CONFIG;
            default:
                return DEFAULT_SECURITY_CONFIG;
        }
    }
    /**
     * Merge custom configuration with defaults
     */
    static mergeConfig(customConfig, baseConfig) {
        const base = baseConfig || DEFAULT_SECURITY_CONFIG;
        return {
            authentication: { ...base.authentication, ...customConfig.authentication },
            authorization: { ...base.authorization, ...customConfig.authorization },
            encryption: { ...base.encryption, ...customConfig.encryption },
            rateLimit: { ...base.rateLimit, ...customConfig.rateLimit },
            audit: { ...base.audit, ...customConfig.audit }
        };
    }
    /**
     * Validate configuration
     */
    static validateConfig(config) {
        const errors = [];
        // Validate authentication config
        if (config.authentication.tokenExpiry <= 0) {
            errors.push('Authentication token expiry must be positive');
        }
        if (config.authentication.maxLoginAttempts <= 0) {
            errors.push('Max login attempts must be positive');
        }
        if (config.authentication.lockoutDuration <= 0) {
            errors.push('Lockout duration must be positive');
        }
        // Validate encryption config
        if (config.encryption.keyLength <= 0) {
            errors.push('Encryption key length must be positive');
        }
        if (config.encryption.iterations <= 0) {
            errors.push('Encryption iterations must be positive');
        }
        // Validate rate limiting config
        if (config.rateLimit.enabled) {
            if (config.rateLimit.windowMs <= 0) {
                errors.push('Rate limit window must be positive');
            }
            if (config.rateLimit.maxRequests <= 0) {
                errors.push('Rate limit max requests must be positive');
            }
        }
        // Validate audit config
        if (config.audit.retentionDays <= 0) {
            errors.push('Audit retention days must be positive');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Create configuration from environment variables
     */
    static createFromEnvironment() {
        const env = process.env['NODE_ENV'] || 'default';
        const baseConfig = this.getConfigForEnvironment(env);
        // Override with environment variables if present
        const customConfig = {};
        if (process.env['AUTH_TOKEN_EXPIRY']) {
            customConfig.authentication = {
                ...baseConfig.authentication,
                tokenExpiry: parseInt(process.env['AUTH_TOKEN_EXPIRY'], 10)
            };
        }
        if (process.env['AUTH_MAX_LOGIN_ATTEMPTS']) {
            customConfig.authentication = {
                ...customConfig.authentication,
                ...baseConfig.authentication,
                maxLoginAttempts: parseInt(process.env['AUTH_MAX_LOGIN_ATTEMPTS'], 10)
            };
        }
        if (process.env['RATE_LIMIT_ENABLED']) {
            customConfig.rateLimit = {
                ...baseConfig.rateLimit,
                enabled: process.env['RATE_LIMIT_ENABLED'] === 'true'
            };
        }
        if (process.env['AUDIT_RETENTION_DAYS']) {
            customConfig.audit = {
                ...baseConfig.audit,
                retentionDays: parseInt(process.env['AUDIT_RETENTION_DAYS'], 10)
            };
        }
        return this.mergeConfig(customConfig, baseConfig);
    }
}
//# sourceMappingURL=config.js.map