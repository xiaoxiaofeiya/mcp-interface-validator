/**
 * Security Module Unit Tests
 * 
 * Comprehensive test suite for the Security Module
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SecurityManager, SecurityConfig } from '../../src/core/security/index';
import { Logger } from '../../src/utils/logger/index';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
} as any as Logger;

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  let config: SecurityConfig;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create test configuration
    config = {
      authentication: {
        enabled: true,
        tokenExpiry: 3600,
        maxLoginAttempts: 3,
        lockoutDuration: 300,
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
        iterations: 10000 // Reduced for testing
      },
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 10,
        skipSuccessfulRequests: false
      },
      audit: {
        enabled: true,
        logLevel: 'standard',
        retentionDays: 7
      }
    };

    securityManager = new SecurityManager(config, mockLogger);
    await securityManager.initialize();
  });

  afterEach(async () => {
    if (securityManager) {
      await securityManager.shutdown();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing Security Manager...');
      expect(mockLogger.info).toHaveBeenCalledWith('Security Manager initialized successfully');
    });

    test('should create default admin user', async () => {
      const stats = securityManager.getSecurityStats();
      expect(stats.activeUsers).toBe(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Default admin user created')
      );
    });

    test('should throw error when not initialized', async () => {
      const uninitializedManager = new SecurityManager(config, mockLogger);
      
      await expect(
        uninitializedManager.authenticate('admin', 'password')
      ).rejects.toThrow('Security Manager not initialized');
    });
  });

  describe('Authentication', () => {
    test('should authenticate valid admin user', async () => {
      const result = await securityManager.authenticate('admin', 'admin123');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user?.username).toBe('admin');
    });

    test('should reject invalid credentials', async () => {
      const result = await securityManager.authenticate('admin', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.user).toBeUndefined();
      expect(result.session).toBeUndefined();
    });

    test('should reject non-existent user', async () => {
      const result = await securityManager.authenticate('nonexistent', 'password');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    test('should lock account after max failed attempts', async () => {
      // Attempt to login with wrong password multiple times
      for (let i = 0; i < config.authentication.maxLoginAttempts; i++) {
        await securityManager.authenticate('admin', 'wrongpassword');
      }

      // Next attempt should indicate account is locked
      const result = await securityManager.authenticate('admin', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Account locked');
    });

    test('should handle rate limiting', async () => {
      const ipAddress = '192.168.1.1';
      
      // Make requests up to the limit
      for (let i = 0; i < config.rateLimit.maxRequests; i++) {
        const result = await securityManager.authenticate('admin', 'admin123', ipAddress);
        if (i === 0) {
          expect(result.success).toBe(true);
        }
      }

      // Next request should be rate limited
      const result = await securityManager.authenticate('admin', 'admin123', ipAddress);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('Session Management', () => {
    test('should validate valid session token', async () => {
      const authResult = await securityManager.authenticate('admin', 'admin123');
      expect(authResult.success).toBe(true);
      
      const session = await securityManager.validateSession(authResult.token!);
      expect(session).toBeDefined();
      expect(session?.userId).toBe(authResult.user?.id);
    });

    test('should reject invalid session token', async () => {
      const session = await securityManager.validateSession('invalid-token');
      expect(session).toBeNull();
    });

    test('should revoke session', async () => {
      const authResult = await securityManager.authenticate('admin', 'admin123');
      expect(authResult.success).toBe(true);
      
      const revoked = await securityManager.revokeSession(authResult.session!.id);
      expect(revoked).toBe(true);
      
      const session = await securityManager.validateSession(authResult.token!);
      expect(session).toBeNull();
    });

    test('should revoke all user sessions', async () => {
      // Create multiple sessions
      const auth1 = await securityManager.authenticate('admin', 'admin123');
      const auth2 = await securityManager.authenticate('admin', 'admin123');
      
      expect(auth1.success).toBe(true);
      expect(auth2.success).toBe(true);
      
      const revokedCount = await securityManager.revokeUserSessions(auth1.user!.id);
      expect(revokedCount).toBe(2);
      
      // Both sessions should be invalid
      const session1 = await securityManager.validateSession(auth1.token!);
      const session2 = await securityManager.validateSession(auth2.token!);
      expect(session1).toBeNull();
      expect(session2).toBeNull();
    });
  });

  describe('Authorization', () => {
    test('should authorize admin user for any action', async () => {
      const authResult = await securityManager.authenticate('admin', 'admin123');
      expect(authResult.success).toBe(true);
      
      const authzResult = await securityManager.authorize(
        authResult.user!.id,
        'validation',
        'execute'
      );
      
      expect(authzResult.allowed).toBe(true);
    });

    test('should deny authorization for non-existent user', async () => {
      const authzResult = await securityManager.authorize(
        'non-existent-user',
        'validation',
        'execute'
      );
      
      expect(authzResult.allowed).toBe(false);
      expect(authzResult.reason).toBe('User not found');
    });

    test('should respect authorization when disabled', async () => {
      // Create manager with authorization disabled
      const disabledConfig = { ...config };
      disabledConfig.authorization.enabled = false;
      
      const disabledManager = new SecurityManager(disabledConfig, mockLogger);
      await disabledManager.initialize();
      
      const authzResult = await disabledManager.authorize(
        'any-user',
        'any-resource',
        'any-action'
      );
      
      expect(authzResult.allowed).toBe(true);
      
      await disabledManager.shutdown();
    });
  });

  describe('Encryption', () => {
    test('should encrypt and decrypt data successfully', () => {
      const originalData = 'sensitive information';
      const password = 'encryption-password';
      
      const encrypted = securityManager.encrypt(originalData, password);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      
      const decrypted = securityManager.decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.salt,
        password,
        encrypted.authTag
      );
      
      expect(decrypted).toBe(originalData);
    });

    test('should fail to decrypt with wrong password', () => {
      const originalData = 'sensitive information';
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';
      
      const encrypted = securityManager.encrypt(originalData, correctPassword);
      
      expect(() => {
        securityManager.decrypt(
          encrypted.encrypted,
          encrypted.iv,
          encrypted.salt,
          wrongPassword
        );
      }).toThrow();
    });

    test('should encrypt without password using default key', () => {
      const originalData = 'test data';
      
      const encrypted = securityManager.encrypt(originalData);
      expect(encrypted.encrypted).toBeDefined();
      
      const decrypted = securityManager.decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.salt,
        undefined,
        encrypted.authTag
      );
      
      expect(decrypted).toBe(originalData);
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should sanitize malicious input', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = securityManager.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toBe('scriptalert("xss")/script');
    });

    test('should validate email format', () => {
      expect(securityManager.validateInput('test@example.com', 'email')).toBe(true);
      expect(securityManager.validateInput('invalid-email', 'email')).toBe(false);
      expect(securityManager.validateInput('test@', 'email')).toBe(false);
    });

    test('should validate username format', () => {
      expect(securityManager.validateInput('validuser123', 'username')).toBe(true);
      expect(securityManager.validateInput('user_name', 'username')).toBe(true);
      expect(securityManager.validateInput('ab', 'username')).toBe(false); // too short
      expect(securityManager.validateInput('user@name', 'username')).toBe(false); // invalid chars
    });

    test('should validate password strength', () => {
      expect(securityManager.validateInput('StrongPass123!', 'password')).toBe(true);
      expect(securityManager.validateInput('weakpass', 'password')).toBe(false);
      expect(securityManager.validateInput('NoNumbers!', 'password')).toBe(false);
    });
  });

  describe('Security Events and Audit', () => {
    test('should log security events', async () => {
      await securityManager.authenticate('admin', 'admin123');
      
      const events = securityManager.getSecurityEvents();
      expect(events.length).toBeGreaterThan(0);
      
      const authEvent = events.find(e => e.type === 'authentication');
      expect(authEvent).toBeDefined();
      expect(authEvent?.message).toContain('Authentication successful');
    });

    test('should filter security events', async () => {
      await securityManager.authenticate('admin', 'admin123');
      await securityManager.authenticate('admin', 'wrongpassword');
      
      const authEvents = securityManager.getSecurityEvents({ type: 'authentication' });
      expect(authEvents.length).toBeGreaterThan(0);
      expect(authEvents.every(e => e.type === 'authentication')).toBe(true);
    });

    test('should limit security events', async () => {
      await securityManager.authenticate('admin', 'admin123');
      await securityManager.authenticate('admin', 'wrongpassword');
      
      const limitedEvents = securityManager.getSecurityEvents({ limit: 1 });
      expect(limitedEvents.length).toBe(1);
    });

    test('should provide security statistics', () => {
      const stats = securityManager.getSecurityStats();
      
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('securityEvents');
      expect(stats).toHaveProperty('rateLimitEntries');
      expect(typeof stats.activeUsers).toBe('number');
    });
  });
});
