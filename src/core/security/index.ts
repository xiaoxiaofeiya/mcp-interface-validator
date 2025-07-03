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
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';
import { Logger } from '../../utils/logger';

// Security Configuration Interface
export interface SecurityConfig {
  authentication: {
    enabled: boolean;
    tokenExpiry: number; // in seconds
    maxLoginAttempts: number;
    lockoutDuration: number; // in seconds
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

// User and Session Interfaces
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

// Permission and Role Interfaces
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

// Authentication Result Interface
export interface AuthenticationResult {
  success: boolean;
  user?: User;
  session?: Session;
  token?: string;
  error?: string;
  requiresTwoFactor?: boolean;
}

// Authorization Result Interface
export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
}

/**
 * Main Security Manager Class
 */
export class SecurityManager extends EventEmitter {
  private config: SecurityConfig;
  private logger: Logger;
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupIntervals: NodeJS.Timeout[] = [];
  private isInitialized: boolean = false;

  constructor(config: SecurityConfig, logger: Logger) {
    super();
    this.config = this.validateAndMergeConfig(config);
    this.logger = logger;
  }

  /**
   * Initialize the security manager
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Security Manager...');

      // Load users and sessions from storage (in real implementation)
      await this.loadUsersFromStorage();
      await this.loadSessionsFromStorage();

      // Set up cleanup intervals
      this.setupCleanupIntervals();

      // Create default admin user if none exists
      await this.createDefaultAdminUser();

      this.isInitialized = true;
      this.logger.info('Security Manager initialized successfully');

      this.logSecurityEvent({
        type: 'access',
        severity: 'low',
        message: 'Security Manager initialized'
      });

    } catch (error) {
      this.logger.error('Failed to initialize Security Manager:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with username/password
   */
  async authenticate(username: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthenticationResult> {
    if (!this.isInitialized) {
      throw new Error('Security Manager not initialized');
    }

    try {
      // Check rate limiting
      if (this.config.rateLimit.enabled && !this.checkRateLimit(ipAddress || 'unknown')) {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          message: 'Authentication rate limit exceeded',
          ipAddress,
          userAgent
        });
        return { success: false, error: 'Rate limit exceeded' };
      }

      // Find user
      const user = Array.from(this.users.values()).find(u => u.username === username);
      if (!user) {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          message: `Authentication failed: user not found - ${username}`,
          ipAddress,
          userAgent
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if user is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          message: `Authentication failed: user locked - ${username}`,
          userId: user.id,
          ipAddress,
          userAgent
        });
        return { success: false, error: 'Account locked' };
      }

      // Check if user is active
      if (!user.isActive) {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          message: `Authentication failed: user inactive - ${username}`,
          userId: user.id,
          ipAddress,
          userAgent
        });
        return { success: false, error: 'Account inactive' };
      }

      // Verify password
      const passwordHash = this.hashPassword(password, user.salt);
      if (passwordHash !== user.passwordHash) {
        // Increment failed login attempts
        user.failedLoginAttempts++;
        if (user.failedLoginAttempts >= this.config.authentication.maxLoginAttempts) {
          user.lockedUntil = new Date(Date.now() + this.config.authentication.lockoutDuration * 1000);
        }

        this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          message: `Authentication failed: invalid password - ${username}`,
          userId: user.id,
          ipAddress,
          userAgent
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Reset failed login attempts
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLogin = new Date();

      // Check if two-factor authentication is required
      if (this.config.authentication.requireTwoFactor && user.twoFactorSecret) {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'low',
          message: `Two-factor authentication required - ${username}`,
          userId: user.id,
          ipAddress,
          userAgent
        });
        return { success: true, user, requiresTwoFactor: true };
      }

      // Create session
      const session = await this.createSession(user.id, ipAddress, userAgent);

      this.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        message: `Authentication successful - ${username}`,
        userId: user.id,
        sessionId: session.id,
        ipAddress,
        userAgent
      });

      return { success: true, user, session, token: session.token };

    } catch (error) {
      this.logger.error('Authentication error:', error);
      this.logSecurityEvent({
        type: 'error',
        severity: 'high',
        message: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress,
        userAgent
      });
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<Session | null> {
    if (!this.isInitialized) {
      throw new Error('Security Manager not initialized');
    }

    const session = Array.from(this.sessions.values()).find(s => s.token === token);
    
    if (!session || !session.isValid || session.expiresAt < new Date()) {
      if (session) {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'low',
          message: 'Session validation failed: expired or invalid',
          sessionId: session.id,
          userId: session.userId
        });
      }
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    
    return session;
  }

  /**
   * Check if user has permission for a specific action
   */
  async authorize(userId: string, resource: string, action: string, context?: Record<string, any>): Promise<AuthorizationResult> {
    if (!this.isInitialized) {
      throw new Error('Security Manager not initialized');
    }

    if (!this.config.authorization.enabled) {
      return { allowed: true };
    }

    try {
      const user = this.users.get(userId);
      if (!user) {
        this.logSecurityEvent({
          type: 'authorization',
          severity: 'medium',
          message: `Authorization failed: user not found`,
          userId
        });
        return { allowed: false, reason: 'User not found' };
      }

      // Check user permissions through roles
      const hasPermission = await this.checkUserPermission(user, resource, action, context);

      if (!hasPermission) {
        this.logSecurityEvent({
          type: 'authorization',
          severity: 'medium',
          message: `Authorization denied: ${resource}:${action}`,
          userId,
          metadata: { resource, action, context }
        });
        return {
          allowed: false,
          reason: 'Insufficient permissions',
          requiredPermissions: [{ resource, action }]
        };
      }

      this.logSecurityEvent({
        type: 'authorization',
        severity: 'low',
        message: `Authorization granted: ${resource}:${action}`,
        userId,
        metadata: { resource, action, context }
      });

      return { allowed: true };

    } catch (error) {
      this.logger.error('Authorization error:', error);
      this.logSecurityEvent({
        type: 'error',
        severity: 'high',
        message: `Authorization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        userId,
        metadata: { resource, action, context }
      });
      return { allowed: false, reason: 'Authorization error' };
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string, password?: string): { encrypted: string; iv: string; salt: string; authTag?: string } {
    try {
      const salt = randomBytes(this.config.encryption.saltLength);
      const iv = randomBytes(this.config.encryption.ivLength);

      // Derive key from password or use default
      const key = password
        ? pbkdf2Sync(password, salt, this.config.encryption.iterations, 32, 'sha256')
        : pbkdf2Sync('default-key', salt, this.config.encryption.iterations, 32, 'sha256');

      const cipher = createCipheriv(this.config.encryption.algorithm, key, iv) as any;
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag ? cipher.getAuthTag().toString('hex') : undefined;

      this.logSecurityEvent({
        type: 'encryption',
        severity: 'low',
        message: 'Data encrypted successfully'
      });

      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        authTag
      };
    } catch (error) {
      this.logger.error('Encryption error:', error);
      this.logSecurityEvent({
        type: 'error',
        severity: 'high',
        message: `Encryption error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, iv: string, salt: string, password?: string, authTag?: string): string {
    try {
      const ivBuffer = Buffer.from(iv, 'hex');
      const saltBuffer = Buffer.from(salt, 'hex');

      // Derive key from password or use default
      const key = password
        ? pbkdf2Sync(password, saltBuffer, this.config.encryption.iterations, 32, 'sha256')
        : pbkdf2Sync('default-key', saltBuffer, this.config.encryption.iterations, 32, 'sha256');

      const decipher = createDecipheriv(this.config.encryption.algorithm, key, ivBuffer) as any;

      if (authTag && decipher.setAuthTag) {
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      }

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.logSecurityEvent({
        type: 'encryption',
        severity: 'low',
        message: 'Data decrypted successfully'
      });

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption error:', error);
      this.logSecurityEvent({
        type: 'error',
        severity: 'high',
        message: `Decryption error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Hash password with salt
   */
  private hashPassword(password: string, salt: string): string {
    return pbkdf2Sync(password, salt, this.config.encryption.iterations, 64, 'sha256').toString('hex');
  }

  /**
   * Generate secure random salt
   */
  private generateSalt(): string {
    return randomBytes(this.config.encryption.saltLength).toString('hex');
  }

  /**
   * Create new user session
   */
  private async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<Session> {
    const sessionId = randomBytes(16).toString('hex');
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.config.authentication.tokenExpiry * 1000);

    const session: Session = {
      id: sessionId,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      isValid: true
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Check user permission through roles
   */
  private async checkUserPermission(user: User, resource: string, action: string, context?: Record<string, any>): Promise<boolean> {
    // Get all permissions for user's roles
    const userPermissions = this.getUserPermissions(user.roles);

    // Check if user has the required permission
    return userPermissions.some(permission =>
      permission.resource === resource &&
      permission.action === action &&
      this.checkPermissionConditions(permission.conditions, context)
    );
  }

  /**
   * Get all permissions for given roles
   */
  private getUserPermissions(roles: string[]): Permission[] {
    const permissions: Permission[] = [];
    const processedRoles = new Set<string>();

    const processRole = (roleName: string) => {
      if (processedRoles.has(roleName)) return;
      processedRoles.add(roleName);

      const roleConfig = this.config.authorization.roleHierarchy[roleName];
      if (roleConfig) {
        // Add role's own permissions (simplified - in real implementation, load from config)
        permissions.push(...this.getRolePermissions(roleName));

        // Process inherited roles
        const inheritedRoles = roleConfig;
        inheritedRoles.forEach(inheritedRole => processRole(inheritedRole));
      }
    };

    roles.forEach(role => processRole(role));
    return permissions;
  }

  /**
   * Get permissions for a specific role
   */
  private getRolePermissions(roleName: string): Permission[] {
    // Default role permissions (in real implementation, load from configuration)
    const defaultPermissions: Record<string, Permission[]> = {
      'admin': [
        { resource: '*', action: '*' },
      ],
      'user': [
        { resource: 'validation', action: 'read' },
        { resource: 'validation', action: 'execute' },
        { resource: 'monitoring', action: 'read' },
      ],
      'viewer': [
        { resource: 'validation', action: 'read' },
        { resource: 'monitoring', action: 'read' },
      ]
    };

    return defaultPermissions[roleName] || [];
  }

  /**
   * Check permission conditions
   */
  private checkPermissionConditions(conditions?: Record<string, any>, context?: Record<string, any>): boolean {
    if (!conditions) return true;
    if (!context) return false;

    // Simple condition checking (can be extended)
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(identifier: string): boolean {
    if (!this.config.rateLimit.enabled) return true;

    const now = Date.now();

    const entry = this.rateLimitStore.get(identifier);

    if (!entry || entry.resetTime <= now) {
      // Reset or create new entry
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs
      });
      return true;
    }

    if (entry.count >= this.config.rateLimit.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: randomBytes(8).toString('hex'),
      timestamp: new Date(),
      ...event
    };

    this.securityEvents.push(securityEvent);

    // Log to system logger based on severity
    switch (event.severity) {
      case 'critical':
        this.logger.error(`[SECURITY] ${event.message}`, event.metadata);
        break;
      case 'high':
        this.logger.error(`[SECURITY] ${event.message}`, event.metadata);
        break;
      case 'medium':
        this.logger.warn(`[SECURITY] ${event.message}`, event.metadata);
        break;
      case 'low':
        this.logger.info(`[SECURITY] ${event.message}`, event.metadata);
        break;
    }

    // Emit event for external listeners
    this.emit('securityEvent', securityEvent);

    // Clean up old events based on retention policy
    this.cleanupOldEvents();
  }

  /**
   * Clean up old security events
   */
  private cleanupOldEvents(): void {
    if (!this.config.audit.enabled) return;

    const cutoffDate = new Date(Date.now() - this.config.audit.retentionDays * 24 * 60 * 60 * 1000);
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoffDate);
  }

  /**
   * Setup cleanup intervals
   */
  private setupCleanupIntervals(): void {
    // Clean up expired sessions every 5 minutes
    const sessionCleanup = setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.expiresAt < now || !session.isValid) {
          this.sessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000);
    this.cleanupIntervals.push(sessionCleanup);

    // Clean up rate limit store every hour
    const rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [identifier, entry] of this.rateLimitStore.entries()) {
        if (entry.resetTime <= now) {
          this.rateLimitStore.delete(identifier);
        }
      }
    }, 60 * 60 * 1000);
    this.cleanupIntervals.push(rateLimitCleanup);

    // Clean up old security events daily
    const eventsCleanup = setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000);
    this.cleanupIntervals.push(eventsCleanup);
  }

  /**
   * Load users from storage (placeholder - implement with actual storage)
   */
  private async loadUsersFromStorage(): Promise<void> {
    // In real implementation, load from database or file system
    this.logger.debug('Loading users from storage...');
  }

  /**
   * Load sessions from storage (placeholder - implement with actual storage)
   */
  private async loadSessionsFromStorage(): Promise<void> {
    // In real implementation, load from database or file system
    this.logger.debug('Loading sessions from storage...');
  }

  /**
   * Create default admin user if none exists
   */
  private async createDefaultAdminUser(): Promise<void> {
    if (this.users.size === 0) {
      const adminId = randomBytes(8).toString('hex');
      const salt = this.generateSalt();
      const defaultPassword = 'admin123'; // In real implementation, generate secure password

      const adminUser: User = {
        id: adminId,
        username: 'admin',
        email: 'admin@localhost',
        passwordHash: this.hashPassword(defaultPassword, salt),
        salt,
        roles: ['admin'],
        isActive: true,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.users.set(adminId, adminUser);

      this.logger.warn('Default admin user created with username: admin, password: admin123');
      this.logSecurityEvent({
        type: 'access',
        severity: 'medium',
        message: 'Default admin user created',
        userId: adminId
      });
    }
  }

  /**
   * Validate and merge configuration with defaults
   */
  private validateAndMergeConfig(config: Partial<SecurityConfig>): SecurityConfig {
    const defaultConfig: SecurityConfig = {
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
        ivLength: 12,
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

    return {
      authentication: { ...defaultConfig.authentication, ...config.authentication },
      authorization: { ...defaultConfig.authorization, ...config.authorization },
      encryption: { ...defaultConfig.encryption, ...config.encryption },
      rateLimit: { ...defaultConfig.rateLimit, ...config.rateLimit },
      audit: { ...defaultConfig.audit, ...config.audit }
    };
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    activeUsers: number;
    activeSessions: number;
    securityEvents: number;
    rateLimitEntries: number;
    lastSecurityEvent?: SecurityEvent | undefined;
  } {
    const activeUsers = Array.from(this.users.values()).filter(u => u.isActive).length;
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isValid && s.expiresAt > new Date()).length;
    const lastSecurityEvent = this.securityEvents[this.securityEvents.length - 1];

    return {
      activeUsers,
      activeSessions,
      securityEvents: this.securityEvents.length,
      rateLimitEntries: this.rateLimitStore.size,
      lastSecurityEvent
    };
  }

  /**
   * Get security events with filtering
   */
  getSecurityEvents(filter?: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    userId?: string;
    since?: Date;
    limit?: number;
  }): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (filter) {
      if (filter.type) {
        events = events.filter(e => e.type === filter.type);
      }
      if (filter.severity) {
        events = events.filter(e => e.severity === filter.severity);
      }
      if (filter.userId) {
        events = events.filter(e => e.userId === filter.userId);
      }
      if (filter.since) {
        events = events.filter(e => e.timestamp >= filter.since!);
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isValid = false;
      this.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        message: 'Session revoked',
        sessionId,
        userId: session.userId
      });
      return true;
    }
    return false;
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeUserSessions(userId: string): Promise<number> {
    let revokedCount = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isValid) {
        session.isValid = false;
        revokedCount++;
      }
    }

    if (revokedCount > 0) {
      this.logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        message: `All user sessions revoked (${revokedCount} sessions)`,
        userId
      });
    }

    return revokedCount;
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Basic sanitization - remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/"/g, '"') // Escape double quotes
      .replace(/'/g, "'") // Escape single quotes
      .replace(/[;&|`$]/g, '') // Remove command injection characters
      .trim();
  }

  /**
   * Validate input against patterns
   */
  validateInput(input: string, pattern: 'email' | 'username' | 'password' | 'alphanumeric'): boolean {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      username: /^[a-zA-Z0-9_]{3,20}$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      alphanumeric: /^[a-zA-Z0-9]+$/
    };

    return patterns[pattern]?.test(input) || false;
  }

  /**
   * Shutdown security manager
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Security Manager...');

    // Clear all cleanup intervals
    for (const interval of this.cleanupIntervals) {
      clearInterval(interval);
    }
    this.cleanupIntervals.length = 0;

    // Clear all intervals and cleanup
    this.removeAllListeners();
    this.sessions.clear();
    this.rateLimitStore.clear();

    this.logSecurityEvent({
      type: 'access',
      severity: 'low',
      message: 'Security Manager shutdown'
    });

    this.isInitialized = false;
    this.logger.info('Security Manager shutdown complete');
  }
}
