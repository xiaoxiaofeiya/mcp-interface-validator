/**
 * Configuration Manager for MCP Interface Validator
 *
 * Manages application configuration from various sources
 */
import { readFileSync, existsSync } from 'fs';
// import { join } from 'path'; // Removed unused import
import { parse as parseYaml } from 'yaml';
export class ConfigManager {
    config;
    configPath;
    constructor(configPath) {
        this.configPath = configPath || this.findConfigFile();
        this.config = this.loadConfig();
    }
    /**
     * Find configuration file in standard locations
     */
    findConfigFile() {
        const possiblePaths = [
            'mcp-validator.config.json',
            'mcp-validator.config.yaml',
            'mcp-validator.config.yml',
            'config/mcp-validator.json',
            'config/mcp-validator.yaml',
            'config/mcp-validator.yml'
        ];
        for (const path of possiblePaths) {
            if (existsSync(path)) {
                return path;
            }
        }
        // Return default config path
        return 'config/mcp-validator.json';
    }
    /**
     * Load configuration from file or use defaults
     */
    loadConfig() {
        const defaultConfig = {
            server: {
                name: 'mcp-interface-validator',
                version: '1.0.0',
                description: 'MCP Interface Validation Component'
            },
            validation: {
                strictMode: true,
                allowAdditionalProperties: false,
                validateExamples: true,
                customRules: []
            },
            integrations: {
                cursor: { enabled: true },
                windsurf: { enabled: true },
                augment: { enabled: true },
                trae: { enabled: true }
            },
            monitoring: {
                watchPatterns: ['**/*.ts', '**/*.js', '**/*.json'],
                ignorePatterns: ['node_modules/**', 'build/**', '**/*.test.*'],
                debounceMs: 500,
                maxFileSize: 1024 * 1024 // 1MB
            },
            logging: {
                level: 'info',
                format: 'structured'
            }
        };
        if (!existsSync(this.configPath)) {
            return defaultConfig;
        }
        try {
            const configContent = readFileSync(this.configPath, 'utf-8');
            let loadedConfig;
            if (this.configPath.endsWith('.json')) {
                loadedConfig = JSON.parse(configContent);
            }
            else if (this.configPath.endsWith('.yaml') || this.configPath.endsWith('.yml')) {
                loadedConfig = parseYaml(configContent);
            }
            else {
                throw new Error(`Unsupported config file format: ${this.configPath}`);
            }
            // Merge with defaults
            return this.mergeConfig(defaultConfig, loadedConfig);
        }
        catch (error) {
            console.warn(`Failed to load config from ${this.configPath}, using defaults:`, error);
            return defaultConfig;
        }
    }
    /**
     * Deep merge configuration objects
     */
    mergeConfig(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };
        for (const [key, value] of Object.entries(userConfig)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                merged[key] = {
                    ...merged[key],
                    ...value
                };
            }
            else {
                merged[key] = value;
            }
        }
        return merged;
    }
    /**
     * Get full configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get validation configuration
     */
    getValidationConfig() {
        return this.config.validation;
    }
    /**
     * Get integration configuration
     */
    getIntegrationConfig() {
        return this.config.integrations;
    }
    /**
     * Get monitoring configuration
     */
    getMonitoringConfig() {
        return this.config.monitoring;
    }
    /**
     * Get server configuration
     */
    getServerConfig() {
        return this.config.server;
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = this.mergeConfig(this.config, updates);
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
}
//# sourceMappingURL=index.js.map