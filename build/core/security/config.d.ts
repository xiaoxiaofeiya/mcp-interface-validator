/**
 * Security Module Configuration
 *
 * Default configurations and configuration utilities for the security module
 */
import type { SecurityConfig } from './index.js';
import type { SecurityPolicy } from './types.js';
/**
 * Default Security Configuration
 */
export declare const DEFAULT_SECURITY_CONFIG: SecurityConfig;
/**
 * Development Security Configuration (Less Strict)
 */
export declare const DEVELOPMENT_SECURITY_CONFIG: SecurityConfig;
/**
 * Production Security Configuration (Strict)
 */
export declare const PRODUCTION_SECURITY_CONFIG: SecurityConfig;
/**
 * Testing Security Configuration (Minimal)
 */
export declare const TESTING_SECURITY_CONFIG: SecurityConfig;
/**
 * Default Security Policies
 */
export declare const DEFAULT_SECURITY_POLICIES: SecurityPolicy[];
/**
 * Configuration utility functions
 */
export declare class SecurityConfigManager {
    /**
     * Get configuration based on environment
     */
    static getConfigForEnvironment(env: 'development' | 'production' | 'testing' | 'default'): SecurityConfig;
    /**
     * Merge custom configuration with defaults
     */
    static mergeConfig(customConfig: Partial<SecurityConfig>, baseConfig?: SecurityConfig): SecurityConfig;
    /**
     * Validate configuration
     */
    static validateConfig(config: SecurityConfig): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Create configuration from environment variables
     */
    static createFromEnvironment(): SecurityConfig;
}
//# sourceMappingURL=config.d.ts.map