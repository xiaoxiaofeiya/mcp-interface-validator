/**
 * Security Module Type Definitions
 *
 * Comprehensive type definitions for the security module
 */
export type SecurityEventType = 'authentication' | 'authorization' | 'encryption' | 'access' | 'error';
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuthenticationMethod = 'password' | 'token' | 'oauth' | 'saml' | 'ldap';
export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'hardware';
export type ResourceType = 'validation' | 'monitoring' | 'configuration' | 'user' | 'system' | '*';
export type ActionType = 'read' | 'write' | 'execute' | 'delete' | 'admin' | '*';
export type UserStatus = 'active' | 'inactive' | 'locked' | 'pending' | 'suspended';
export type SessionStatus = 'active' | 'expired' | 'revoked' | 'invalid';
export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'aes-192-gcm' | 'aes-128-gcm';
export type HashAlgorithm = 'sha256' | 'sha512' | 'bcrypt' | 'argon2';
export type AuditLogLevel = 'minimal' | 'standard' | 'detailed' | 'verbose';
export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    rules: SecurityRule[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface SecurityRule {
    id: string;
    type: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'rateLimit';
    condition: string;
    action: 'allow' | 'deny' | 'log' | 'alert';
    parameters?: Record<string, any>;
}
export interface ExtendedUser {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    passwordHash: string;
    salt: string;
    roles: string[];
    permissions: string[];
    status: UserStatus;
    lastLogin?: Date;
    lastPasswordChange?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    preferences?: UserPreferences;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    notifications?: NotificationPreferences;
}
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    securityAlerts: boolean;
}
export interface ExtendedSession {
    id: string;
    userId: string;
    token: string;
    refreshToken?: string;
    expiresAt: Date;
    refreshExpiresAt?: Date;
    createdAt: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    deviceInfo?: DeviceInfo;
    status: SessionStatus;
    permissions?: string[];
    metadata?: Record<string, any>;
}
export interface DeviceInfo {
    type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    os?: string;
    browser?: string;
    version?: string;
}
export interface SecurityContext {
    user?: ExtendedUser;
    session?: ExtendedSession;
    permissions: string[];
    roles: string[];
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    timestamp: Date;
}
export interface SecurityMiddleware {
    name: string;
    priority: number;
    execute(context: SecurityContext, next: () => Promise<void>): Promise<void>;
}
export interface SecurityProvider {
    name: string;
    type: 'authentication' | 'authorization' | 'encryption' | 'audit';
    initialize(config: any): Promise<void>;
    isEnabled(): boolean;
    getCapabilities(): string[];
}
export interface AuthenticationProvider extends SecurityProvider {
    authenticate(credentials: any): Promise<any>;
    validateToken(token: string): Promise<boolean>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    } | null>;
}
export interface AuthorizationProvider extends SecurityProvider {
    authorize(context: SecurityContext, resource: string, action: string): Promise<any>;
    getRoles(userId: string): Promise<string[]>;
    getPermissions(userId: string): Promise<string[]>;
}
export interface EncryptionProvider extends SecurityProvider {
    encrypt(data: string, options?: EncryptionOptions): Promise<EncryptedData>;
    decrypt(encryptedData: EncryptedData, options?: EncryptionOptions): Promise<string>;
    hash(data: string, options?: HashOptions): Promise<string>;
    verify(data: string, hash: string, options?: HashOptions): Promise<boolean>;
}
export interface EncryptionOptions {
    algorithm?: EncryptionAlgorithm;
    keyId?: string;
    password?: string;
}
export interface EncryptedData {
    data: string;
    algorithm: string;
    iv?: string;
    salt?: string;
    keyId?: string;
    metadata?: Record<string, any>;
}
export interface HashOptions {
    algorithm?: HashAlgorithm;
    salt?: string;
    iterations?: number;
    keyLength?: number;
}
export interface AuditProvider extends SecurityProvider {
    log(event: any): Promise<void>;
    query(filter: AuditQueryFilter): Promise<any[]>;
    export(filter: AuditQueryFilter, format: 'json' | 'csv' | 'xml'): Promise<string>;
}
export interface AuditQueryFilter {
    type?: SecurityEventType;
    severity?: SecurityEventSeverity;
    userId?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export interface SecurityConfiguration {
    providers: SecurityProviderConfig[];
    policies: SecurityPolicy[];
    middleware: SecurityMiddlewareConfig[];
    settings: SecuritySettings;
}
export interface SecurityProviderConfig {
    name: string;
    type: string;
    enabled: boolean;
    config: Record<string, any>;
}
export interface SecurityMiddlewareConfig {
    name: string;
    enabled: boolean;
    priority: number;
    config: Record<string, any>;
}
export interface SecuritySettings {
    defaultRole: string;
    sessionTimeout: number;
    maxConcurrentSessions: number;
    passwordPolicy: PasswordPolicy;
    rateLimiting: RateLimitingConfig;
    encryption: EncryptionConfig;
    audit: AuditConfig;
}
export interface PasswordPolicy {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
    maxAge: number;
}
export interface RateLimitingConfig {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    keyGenerator?: (context: SecurityContext) => string;
}
export interface EncryptionConfig {
    defaultAlgorithm: EncryptionAlgorithm;
    keyRotationInterval: number;
    keyDerivationIterations: number;
    saltLength: number;
    ivLength: number;
}
export interface AuditConfig {
    enabled: boolean;
    level: AuditLogLevel;
    retentionDays: number;
    exportFormats: string[];
    realTimeAlerts: boolean;
}
export declare class SecurityError extends Error {
    code: string;
    severity: SecurityEventSeverity;
    metadata?: Record<string, any> | undefined;
    constructor(message: string, code: string, severity?: SecurityEventSeverity, metadata?: Record<string, any> | undefined);
}
export declare class AuthenticationError extends SecurityError {
    constructor(message: string, metadata?: Record<string, any>);
}
export declare class AuthorizationError extends SecurityError {
    constructor(message: string, metadata?: Record<string, any>);
}
export declare class EncryptionError extends SecurityError {
    constructor(message: string, metadata?: Record<string, any>);
}
export declare class RateLimitError extends SecurityError {
    constructor(message: string, metadata?: Record<string, any>);
}
export type { SecurityConfig, User, Session, SecurityEvent, Permission, Role, AuthenticationResult, AuthorizationResult } from './index.js';
//# sourceMappingURL=types.d.ts.map