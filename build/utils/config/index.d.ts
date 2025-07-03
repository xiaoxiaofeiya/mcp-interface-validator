/**
 * Configuration Manager for MCP Interface Validator
 *
 * Manages application configuration from various sources
 */
export interface ValidationConfig {
    strictMode: boolean;
    allowAdditionalProperties: boolean;
    validateExamples: boolean;
    customRules: string[];
}
export interface IntegrationConfig {
    cursor: {
        enabled: boolean;
        configPath?: string;
    };
    windsurf: {
        enabled: boolean;
        configPath?: string;
    };
    augment: {
        enabled: boolean;
        configPath?: string;
    };
    trae: {
        enabled: boolean;
        configPath?: string;
    };
}
export interface MonitoringConfig {
    watchPatterns: string[];
    ignorePatterns: string[];
    debounceMs: number;
    maxFileSize: number;
}
export interface MCPConfig {
    server: {
        name: string;
        version: string;
        description: string;
    };
    validation: ValidationConfig;
    integrations: IntegrationConfig;
    monitoring: MonitoringConfig;
    logging: {
        level: string;
        format: string;
    };
}
export declare class ConfigManager {
    private config;
    private configPath;
    constructor(configPath?: string);
    /**
     * Find configuration file in standard locations
     */
    private findConfigFile;
    /**
     * Load configuration from file or use defaults
     */
    private loadConfig;
    /**
     * Deep merge configuration objects
     */
    private mergeConfig;
    /**
     * Get full configuration
     */
    getConfig(): MCPConfig;
    /**
     * Get validation configuration
     */
    getValidationConfig(): ValidationConfig;
    /**
     * Get integration configuration
     */
    getIntegrationConfig(): IntegrationConfig;
    /**
     * Get monitoring configuration
     */
    getMonitoringConfig(): MonitoringConfig;
    /**
     * Get server configuration
     */
    getServerConfig(): MCPConfig['server'];
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<MCPConfig>): void;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
}
//# sourceMappingURL=index.d.ts.map