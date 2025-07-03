/**
 * Configuration Manager for MCP Interface Validator
 * 
 * Manages application configuration from various sources
 */

import { readFileSync, existsSync } from 'fs';
// import { join } from 'path'; // Removed unused import
import { parse as parseYaml } from 'yaml';

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

export class ConfigManager {
  private config: MCPConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || this.findConfigFile();
    this.config = this.loadConfig();
  }

  /**
   * Find configuration file in standard locations
   */
  private findConfigFile(): string {
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
  private loadConfig(): MCPConfig {
    const defaultConfig: MCPConfig = {
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
      let loadedConfig: Partial<MCPConfig>;

      if (this.configPath.endsWith('.json')) {
        loadedConfig = JSON.parse(configContent);
      } else if (this.configPath.endsWith('.yaml') || this.configPath.endsWith('.yml')) {
        loadedConfig = parseYaml(configContent);
      } else {
        throw new Error(`Unsupported config file format: ${this.configPath}`);
      }

      // Merge with defaults
      return this.mergeConfig(defaultConfig, loadedConfig);
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}, using defaults:`, error);
      return defaultConfig;
    }
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfig(defaultConfig: MCPConfig, userConfig: Partial<MCPConfig>): MCPConfig {
    const merged = { ...defaultConfig };

    for (const [key, value] of Object.entries(userConfig)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof MCPConfig] = {
          ...merged[key as keyof MCPConfig],
          ...value
        } as any;
      } else {
        merged[key as keyof MCPConfig] = value as any;
      }
    }

    return merged;
  }

  /**
   * Get full configuration
   */
  getConfig(): MCPConfig {
    return this.config;
  }

  /**
   * Get validation configuration
   */
  getValidationConfig(): ValidationConfig {
    return this.config.validation;
  }

  /**
   * Get integration configuration
   */
  getIntegrationConfig(): IntegrationConfig {
    return this.config.integrations;
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }

  /**
   * Get server configuration
   */
  getServerConfig(): MCPConfig['server'] {
    return this.config.server;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MCPConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}
