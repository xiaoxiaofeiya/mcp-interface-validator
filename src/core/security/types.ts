/**
 * Security Module Type Definitions
 * 
 * Comprehensive type definitions for the security module
 */

// Security Event Types
export type SecurityEventType = 'authentication' | 'authorization' | 'encryption' | 'access' | 'error';
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

// Authentication Types
export type AuthenticationMethod = 'password' | 'token' | 'oauth' | 'saml' | 'ldap';
export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'hardware';

// Authorization Types
export type ResourceType = 'validation' | 'monitoring' | 'configuration' | 'user' | 'system' | '*';
export type ActionType = 'read' | 'write' | 'execute' | 'delete' | 'admin' | '*';

// User Status Types
export type UserStatus = 'active' | 'inactive' | 'locked' | 'pending' | 'suspended';

// Session Types
export type SessionStatus = 'active' | 'expired' | 'revoked' | 'invalid';

// Encryption Types
export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'aes-192-gcm' | 'aes-128-gcm';
export type HashAlgorithm = 'sha256' | 'sha512' | 'bcrypt' | 'argon2';

// Audit Log Types
export type AuditLogLevel = 'minimal' | 'standard' | 'detailed' | 'verbose';

// Security Policy Types
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

// Extended User Interface
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

// Extended Session Interface
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

// Security Context Interface
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

// Security Middleware Interface
export interface SecurityMiddleware {
  name: string;
  priority: number;
  execute(context: SecurityContext, next: () => Promise<void>): Promise<void>;
}

// Security Provider Interface
export interface SecurityProvider {
  name: string;
  type: 'authentication' | 'authorization' | 'encryption' | 'audit';
  initialize(config: any): Promise<void>;
  isEnabled(): boolean;
  getCapabilities(): string[];
}

// Authentication Provider Interface
export interface AuthenticationProvider extends SecurityProvider {
  authenticate(credentials: any): Promise<any>; // Will be AuthenticationResult from index.ts
  validateToken(token: string): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string } | null>;
}

// Authorization Provider Interface
export interface AuthorizationProvider extends SecurityProvider {
  authorize(context: SecurityContext, resource: string, action: string): Promise<any>; // Will be AuthorizationResult from index.ts
  getRoles(userId: string): Promise<string[]>;
  getPermissions(userId: string): Promise<string[]>;
}

// Encryption Provider Interface
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

// Audit Provider Interface
export interface AuditProvider extends SecurityProvider {
  log(event: any): Promise<void>; // Will be SecurityEvent from index.ts
  query(filter: AuditQueryFilter): Promise<any[]>; // Will be SecurityEvent[] from index.ts
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

// Security Configuration Interfaces
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
  maxAge: number; // days
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
  keyRotationInterval: number; // days
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

// Security Error Types
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: SecurityEventSeverity = 'medium',
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 'medium', metadata);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'AUTHZ_ERROR', 'medium', metadata);
    this.name = 'AuthorizationError';
  }
}

export class EncryptionError extends SecurityError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'ENCRYPTION_ERROR', 'high', metadata);
    this.name = 'EncryptionError';
  }
}

export class RateLimitError extends SecurityError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'RATE_LIMIT_ERROR', 'low', metadata);
    this.name = 'RateLimitError';
  }
}

// Re-export main interfaces from index.ts
export type {
  SecurityConfig,
  User,
  Session,
  SecurityEvent,
  Permission,
  Role,
  AuthenticationResult,
  AuthorizationResult
} from './index.js';
