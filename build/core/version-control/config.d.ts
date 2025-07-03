/**
 * Version Control Configuration
 *
 * This module provides configuration management for the version control system.
 */
import type { VersionControlConfig, GitProviderConfig, FileSystemProviderConfig } from './types';
/**
 * Default configuration for version control system
 */
export declare const defaultVersionControlConfig: VersionControlConfig;
/**
 * Git provider configuration
 */
export declare const gitProviderConfig: GitProviderConfig;
/**
 * File system provider configuration
 */
export declare const fileSystemProviderConfig: FileSystemProviderConfig;
/**
 * Configuration factory for different environments
 */
export declare class VersionControlConfigFactory {
    /**
     * Create configuration for development environment
     */
    static createDevelopmentConfig(): VersionControlConfig;
    /**
     * Create configuration for production environment
     */
    static createProductionConfig(): VersionControlConfig;
    /**
     * Create configuration for testing environment
     */
    static createTestConfig(): VersionControlConfig;
    /**
     * Create configuration from environment variables
     */
    static createFromEnvironment(): VersionControlConfig;
    /**
     * Validate configuration
     */
    static validateConfig(config: VersionControlConfig): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Merge configurations with priority to the second config
     */
    static mergeConfigs(baseConfig: VersionControlConfig, overrideConfig: Partial<VersionControlConfig>): VersionControlConfig;
}
/**
 * Configuration utilities
 */
export declare class VersionControlConfigUtils {
    /**
     * Get configuration for current environment
     */
    static getCurrentConfig(): VersionControlConfig;
    /**
     * Create configuration with custom overrides
     */
    static createCustomConfig(overrides: Partial<VersionControlConfig>): VersionControlConfig;
    /**
     * Get provider-specific configuration
     */
    static getProviderConfig(config: VersionControlConfig): GitProviderConfig | FileSystemProviderConfig;
    /**
     * Check if Git provider is configured
     */
    static isGitProvider(config: VersionControlConfig): boolean;
    /**
     * Check if File System provider is configured
     */
    static isFileSystemProvider(config: VersionControlConfig): boolean;
    /**
     * Get storage path for the configuration
     */
    static getStoragePath(config: VersionControlConfig): string;
    /**
     * Check if compression is enabled
     */
    static isCompressionEnabled(config: VersionControlConfig): boolean;
    /**
     * Check if encryption is enabled
     */
    static isEncryptionEnabled(config: VersionControlConfig): boolean;
    /**
     * Check if auto-versioning is enabled
     */
    static isAutoVersioningEnabled(config: VersionControlConfig): boolean;
    /**
     * Check if branching is enabled
     */
    static isBranchingEnabled(config: VersionControlConfig): boolean;
    /**
     * Get default branch name
     */
    static getDefaultBranch(config: VersionControlConfig): string;
    /**
     * Get maximum number of versions to keep
     */
    static getMaxVersions(config: VersionControlConfig): number;
}
//# sourceMappingURL=config.d.ts.map