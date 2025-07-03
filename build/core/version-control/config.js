/**
 * Version Control Configuration
 *
 * This module provides configuration management for the version control system.
 */
import * as path from 'path';
/**
 * Default configuration for version control system
 */
export const defaultVersionControlConfig = {
    provider: {
        type: 'filesystem',
        config: {
            basePath: path.join(process.cwd(), '.version-control'),
            structure: 'hierarchical',
            naming: {
                pattern: '{specId}_{versionId}',
                includeTimestamp: true,
                includeHash: false
            }
        }
    },
    storage: {
        path: path.join(process.cwd(), '.version-control'),
        compression: false,
        encryption: false
    },
    versioning: {
        autoVersion: true,
        versionFormat: 'semantic',
        maxVersions: 100
    },
    branching: {
        enabled: true,
        defaultBranch: 'main',
        autoMerge: false
    },
    conflict: {
        resolution: 'manual',
        strategy: 'merge'
    }
};
/**
 * Git provider configuration
 */
export const gitProviderConfig = {
    repository: '',
    branch: 'main',
    credentials: {
        username: '',
        password: '',
        token: '',
        sshKey: ''
    },
    remote: 'origin',
    workingDirectory: path.join(process.cwd(), '.version-control-git')
};
/**
 * File system provider configuration
 */
export const fileSystemProviderConfig = {
    basePath: path.join(process.cwd(), '.version-control-fs'),
    structure: 'hierarchical',
    naming: {
        pattern: '{specId}_{versionId}_{timestamp}',
        includeTimestamp: true,
        includeHash: true
    }
};
/**
 * Configuration factory for different environments
 */
export class VersionControlConfigFactory {
    /**
     * Create configuration for development environment
     */
    static createDevelopmentConfig() {
        return {
            ...defaultVersionControlConfig,
            provider: {
                type: 'filesystem',
                config: {
                    ...fileSystemProviderConfig,
                    basePath: path.join(process.cwd(), '.version-control-dev')
                }
            },
            versioning: {
                ...defaultVersionControlConfig.versioning,
                autoVersion: true,
                maxVersions: 50
            }
        };
    }
    /**
     * Create configuration for production environment
     */
    static createProductionConfig() {
        return {
            ...defaultVersionControlConfig,
            provider: {
                type: 'git',
                config: {
                    ...gitProviderConfig,
                    repository: process.env['VC_GIT_REPOSITORY'] || '',
                    credentials: {
                        username: process.env['VC_GIT_USERNAME'] || '',
                        password: process.env['VC_GIT_PASSWORD'] || '',
                        token: process.env['VC_GIT_TOKEN'] || '',
                        sshKey: process.env['VC_GIT_SSH_KEY'] || ''
                    }
                }
            },
            storage: {
                ...defaultVersionControlConfig.storage,
                compression: true,
                encryption: true
            },
            versioning: {
                ...defaultVersionControlConfig.versioning,
                maxVersions: 1000
            }
        };
    }
    /**
     * Create configuration for testing environment
     */
    static createTestConfig() {
        return {
            ...defaultVersionControlConfig,
            provider: {
                type: 'filesystem',
                config: {
                    ...fileSystemProviderConfig,
                    basePath: path.join(process.cwd(), '.version-control-test')
                }
            },
            versioning: {
                ...defaultVersionControlConfig.versioning,
                autoVersion: false,
                maxVersions: 10
            }
        };
    }
    /**
     * Create configuration from environment variables
     */
    static createFromEnvironment() {
        const providerType = process.env['VC_PROVIDER_TYPE'] || 'filesystem';
        const baseConfig = {
            ...defaultVersionControlConfig,
            provider: {
                type: providerType,
                config: providerType === 'git' ? {
                    ...gitProviderConfig,
                    repository: process.env['VC_GIT_REPOSITORY'] || '',
                    branch: process.env['VC_GIT_BRANCH'] || 'main',
                    credentials: {
                        username: process.env['VC_GIT_USERNAME'] || '',
                        password: process.env['VC_GIT_PASSWORD'] || '',
                        token: process.env['VC_GIT_TOKEN'] || '',
                        sshKey: process.env['VC_GIT_SSH_KEY'] || ''
                    },
                    workingDirectory: process.env['VC_GIT_WORKING_DIR'] || path.join(process.cwd(), '.version-control-git')
                } : {
                    ...fileSystemProviderConfig,
                    basePath: process.env['VC_FS_BASE_PATH'] || path.join(process.cwd(), '.version-control-fs'),
                    structure: process.env['VC_FS_STRUCTURE'] || 'hierarchical'
                }
            },
            storage: {
                path: process.env['VC_STORAGE_PATH'] || path.join(process.cwd(), '.version-control'),
                compression: process.env['VC_STORAGE_COMPRESSION'] === 'true',
                encryption: process.env['VC_STORAGE_ENCRYPTION'] === 'true'
            },
            versioning: {
                autoVersion: process.env['VC_AUTO_VERSION'] !== 'false',
                versionFormat: process.env['VC_VERSION_FORMAT'] || 'semantic',
                maxVersions: parseInt(process.env['VC_MAX_VERSIONS'] || '100', 10)
            },
            branching: {
                enabled: process.env['VC_BRANCHING_ENABLED'] !== 'false',
                defaultBranch: process.env['VC_DEFAULT_BRANCH'] || 'main',
                autoMerge: process.env['VC_AUTO_MERGE'] === 'true'
            },
            conflict: {
                resolution: process.env['VC_CONFLICT_RESOLUTION'] || 'manual',
                strategy: process.env['VC_CONFLICT_STRATEGY'] || 'merge'
            }
        };
        return baseConfig;
    }
    /**
     * Validate configuration
     */
    static validateConfig(config) {
        const errors = [];
        // Validate provider configuration
        if (!config.provider || !config.provider.type) {
            errors.push('Provider type is required');
        }
        if (config.provider.type === 'git') {
            const gitConfig = config.provider.config;
            if (!gitConfig.repository && !gitConfig.workingDirectory) {
                errors.push('Git provider requires either repository URL or working directory');
            }
        }
        if (config.provider.type === 'filesystem') {
            const fsConfig = config.provider.config;
            if (!fsConfig.basePath) {
                errors.push('File system provider requires base path');
            }
        }
        // Validate storage configuration
        if (!config.storage || !config.storage.path) {
            errors.push('Storage path is required');
        }
        // Validate versioning configuration
        if (config.versioning?.maxVersions && config.versioning.maxVersions < 1) {
            errors.push('Max versions must be greater than 0');
        }
        // Validate version format
        if (config.versioning?.versionFormat &&
            !['semantic', 'timestamp', 'incremental'].includes(config.versioning.versionFormat)) {
            errors.push('Invalid version format');
        }
        // Validate conflict resolution
        if (config.conflict?.resolution &&
            !['manual', 'auto', 'latest-wins', 'oldest-wins'].includes(config.conflict.resolution)) {
            errors.push('Invalid conflict resolution strategy');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Merge configurations with priority to the second config
     */
    static mergeConfigs(baseConfig, overrideConfig) {
        return {
            provider: overrideConfig.provider || baseConfig.provider,
            storage: {
                ...baseConfig.storage,
                ...overrideConfig.storage
            },
            versioning: {
                ...baseConfig.versioning,
                ...overrideConfig.versioning
            },
            branching: {
                ...baseConfig.branching,
                ...overrideConfig.branching
            },
            conflict: {
                ...baseConfig.conflict,
                ...overrideConfig.conflict
            }
        };
    }
}
/**
 * Configuration utilities
 */
export class VersionControlConfigUtils {
    /**
     * Get configuration for current environment
     */
    static getCurrentConfig() {
        const env = process.env['NODE_ENV'] || 'development';
        switch (env) {
            case 'production':
                return VersionControlConfigFactory.createProductionConfig();
            case 'test':
                return VersionControlConfigFactory.createTestConfig();
            case 'development':
            default:
                return VersionControlConfigFactory.createDevelopmentConfig();
        }
    }
    /**
     * Create configuration with custom overrides
     */
    static createCustomConfig(overrides) {
        const baseConfig = this.getCurrentConfig();
        return VersionControlConfigFactory.mergeConfigs(baseConfig, overrides);
    }
    /**
     * Get provider-specific configuration
     */
    static getProviderConfig(config) {
        return config.provider.config;
    }
    /**
     * Check if Git provider is configured
     */
    static isGitProvider(config) {
        return config.provider.type === 'git';
    }
    /**
     * Check if File System provider is configured
     */
    static isFileSystemProvider(config) {
        return config.provider.type === 'filesystem';
    }
    /**
     * Get storage path for the configuration
     */
    static getStoragePath(config) {
        return config.storage.path;
    }
    /**
     * Check if compression is enabled
     */
    static isCompressionEnabled(config) {
        return config.storage.compression === true;
    }
    /**
     * Check if encryption is enabled
     */
    static isEncryptionEnabled(config) {
        return config.storage.encryption === true;
    }
    /**
     * Check if auto-versioning is enabled
     */
    static isAutoVersioningEnabled(config) {
        return config.versioning?.autoVersion === true;
    }
    /**
     * Check if branching is enabled
     */
    static isBranchingEnabled(config) {
        return config.branching?.enabled === true;
    }
    /**
     * Get default branch name
     */
    static getDefaultBranch(config) {
        return config.branching?.defaultBranch || 'main';
    }
    /**
     * Get maximum number of versions to keep
     */
    static getMaxVersions(config) {
        return config.versioning?.maxVersions || 100;
    }
}
//# sourceMappingURL=config.js.map