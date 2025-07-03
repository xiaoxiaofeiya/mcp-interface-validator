/**
 * Security Module for MCP Interface Validator
 *
 * Provides comprehensive security features including:
 * - Authentication and authorization
 * - Data encryption and decryption
 * - Security logging and audit trails
 * - Input validation and sanitization
 * - Rate limiting and access control
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
export interface SecurityConfig {
    authentication: {
        enabled: boolean;
        tokenExpiry: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
        requireTwoFactor: boolean;
    };
    authorization: {
        enabled: boolean;
        defaultRole: string;
        roleHierarchy: Record<string, string[]>;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
        saltLength: number;
        iterations: number;
    };
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
    };
    audit: {
        enabled: boolean;
        logLevel: 'minimal' | 'standard' | 'detailed';
        retentionDays: number;
    };
}
export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    salt: string;
    roles: string[];
    isActive: boolean;
    lastLogin?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date | undefined;
    twoFactorSecret?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    lastActivity: Date;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    isValid: boolean;
}
export interface SecurityEvent {
    id: string;
    type: 'authentication' | 'authorization' | 'encryption' | 'access' | 'error';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface Permission {
    resource: string;
    action: string;
    conditions?: Record<string, any>;
}
export interface Role {
    name: string;
    permissions: Permission[];
    inherits?: string[];
}
export interface AuthenticationResult {
    success: boolean;
    user?: User;
    session?: Session;
    token?: string;
    error?: string;
    requiresTwoFactor?: boolean;
}
export interface AuthorizationResult {
    allowed: boolean;
    reason?: string;
    requiredPermissions?: Permission[];
}
/**
 * Main Security Manager Class
 */
export declare class SecurityManager extends EventEmitter {
    private config;
    private logger;
    private users;
    private sessions;
    private securityEvents;
    private rateLimitStore;
    private cleanupIntervals;
    private isInitialized;
    constructor(config: SecurityConfig, logger: Logger);
    /**
     * Initialize the security manager
     */
    initialize(): Promise<void>;
    /**
     * Authenticate user with username/password
     */
    authenticate(username: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthenticationResult>;
    /**
     * Validate session token
     */
    validateSession(token: string): Promise<Session | null>;
    /**
     * Check if user has permission for a specific action
     */
    authorize(userId: string, resource: string, action: string, context?: Record<string, any>): Promise<AuthorizationResult>;
    /**
     * Encrypt sensitive data
     */
    encrypt(data: string, password?: string): {
        encrypted: string;
        iv: string;
        salt: string;
        authTag?: string;
    };
    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedData: string, iv: string, salt: string, password?: string, authTag?: string): string;
    /**
     * Hash password with salt
     */
    private hashPassword;
    /**
     * Generate secure random salt
     */
    private generateSalt;
    /**
     * Create new user session
     */
    private createSession;
    /**
     * Check user permission through roles
     */
    private checkUserPermission;
    /**
     * Get all permissions for given roles
     */
    private getUserPermissions;
    /**
     * Get permissions for a specific role
     */
    private getRolePermissions;
    /**
     * Check permission conditions
     */
    private checkPermissionConditions;
    /**
     * Check rate limiting
     */
    private checkRateLimit;
    /**
     * Log security event
     */
    private logSecurityEvent;
    /**
     * Clean up old security events
     */
    private cleanupOldEvents;
    /**
     * Setup cleanup intervals
     */
    private setupCleanupIntervals;
    /**
     * Load users from storage (placeholder - implement with actual storage)
     */
    private loadUsersFromStorage;
    /**
     * Load sessions from storage (placeholder - implement with actual storage)
     */
    private loadSessionsFromStorage;
    /**
     * Create default admin user if none exists
     */
    private createDefaultAdminUser;
    /**
     * Validate and merge configuration with defaults
     */
    private validateAndMergeConfig;
    /**
     * Get security statistics
     */
    getSecurityStats(): {
        activeUsers: number;
        activeSessions: number;
        securityEvents: number;
        rateLimitEntries: number;
        lastSecurityEvent?: SecurityEvent | undefined;
    };
    /**
     * Get security events with filtering
     */
    getSecurityEvents(filter?: {
        type?: SecurityEvent['type'];
        severity?: SecurityEvent['severity'];
        userId?: string;
        since?: Date;
        limit?: number;
    }): SecurityEvent[];
    /**
     * Revoke session
     */
    revokeSession(sessionId: string): Promise<boolean>;
    /**
     * Revoke all sessions for a user
     */
    revokeUserSessions(userId: string): Promise<number>;
    /**
     * Sanitize input to prevent injection attacks
     */
    sanitizeInput(input: string): string;
    /**
     * Validate input against patterns
     */
    validateInput(input: string, pattern: 'email' | 'username' | 'password' | 'alphanumeric'): boolean;
    /**
     * Shutdown security manager
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map