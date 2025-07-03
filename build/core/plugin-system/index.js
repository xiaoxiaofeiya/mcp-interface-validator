/**
 * Plugin System Main Entry Point
 *
 * Exports all plugin system components and provides factory functions
 */
// Core classes
export { BasePlugin, SimplePlugin } from './base-plugin';
export { PluginDiscovery } from './plugin-discovery';
export { PluginLoader } from './plugin-loader';
export { PluginManager } from './plugin-manager';
import { PluginManager } from './plugin-manager';
import { Logger } from '../../utils/logger/index';
/**
 * Default plugin system configuration
 */
export const DEFAULT_PLUGIN_CONFIG = {
    pluginsDir: './plugins',
    dataDir: './data/plugins',
    loadTimeout: 30000,
    initTimeout: 10000,
    startTimeout: 5000,
    sandboxing: false,
    allowedPermissions: [
        'fs.read',
        'fs.write',
        'network.http',
        'network.https',
        'process.env'
    ],
    discoveryPatterns: ['*'],
    autoReload: false,
    validation: {
        validateSignatures: false,
        allowedSources: ['*'],
        securityPolicy: 'moderate'
    }
};
/**
 * Create a plugin manager with default configuration
 */
export function createPluginManager(config, logger) {
    const finalConfig = { ...DEFAULT_PLUGIN_CONFIG, ...config };
    return new PluginManager(finalConfig, logger);
}
/**
 * Plugin system factory with common configurations
 */
export class PluginSystemFactory {
    /**
     * Create a development plugin system
     */
    static createDevelopment(pluginsDir, logger) {
        const config = {
            ...DEFAULT_PLUGIN_CONFIG,
            pluginsDir: pluginsDir || './plugins',
            autoReload: true,
            validation: {
                validateSignatures: false,
                allowedSources: ['*'],
                securityPolicy: 'permissive'
            }
        };
        return new PluginManager(config, logger);
    }
    /**
     * Create a production plugin system
     */
    static createProduction(pluginsDir, logger) {
        const config = {
            ...DEFAULT_PLUGIN_CONFIG,
            pluginsDir: pluginsDir || './plugins',
            autoReload: false,
            validation: {
                validateSignatures: true,
                allowedSources: ['trusted'],
                securityPolicy: 'strict'
            },
            allowedPermissions: [
                'fs.read',
                'network.https'
            ]
        };
        return new PluginManager(config, logger);
    }
    /**
     * Create a testing plugin system
     */
    static createTesting(pluginsDir, logger) {
        const config = {
            ...DEFAULT_PLUGIN_CONFIG,
            pluginsDir: pluginsDir || './test/fixtures/plugins',
            loadTimeout: 5000,
            initTimeout: 3000,
            startTimeout: 2000,
            autoReload: false,
            validation: {
                validateSignatures: false,
                allowedSources: ['*'],
                securityPolicy: 'permissive'
            }
        };
        return new PluginManager(config, logger);
    }
}
/**
 * Plugin utilities
 */
export class PluginUtils {
    /**
     * Validate plugin metadata
     */
    static validateMetadata(metadata) {
        const errors = [];
        if (!metadata.id) {
            errors.push('Plugin ID is required');
        }
        if (!metadata.name) {
            errors.push('Plugin name is required');
        }
        if (!metadata.version) {
            errors.push('Plugin version is required');
        }
        if (!metadata.description) {
            errors.push('Plugin description is required');
        }
        if (!metadata.author) {
            errors.push('Plugin author is required');
        }
        return errors;
    }
    /**
     * Compare plugin versions
     */
    static compareVersions(a, b) {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            if (aPart > bPart)
                return 1;
            if (aPart < bPart)
                return -1;
        }
        return 0;
    }
    /**
     * Check if version satisfies range
     */
    static satisfiesVersion(version, range) {
        // Simple version range checking
        // In a real implementation, this would use semver
        if (range.startsWith('^')) {
            const targetVersion = range.slice(1);
            return this.compareVersions(version, targetVersion) >= 0;
        }
        if (range.startsWith('~')) {
            const targetVersion = range.slice(1);
            return this.compareVersions(version, targetVersion) >= 0;
        }
        return version === range;
    }
    /**
     * Generate plugin manifest template
     */
    static generateManifestTemplate(id, name) {
        return {
            id,
            name,
            version: '1.0.0',
            description: `${name} plugin`,
            author: 'Plugin Author',
            main: 'index.js',
            apiVersion: '1.0.0',
            keywords: [],
            dependencies: [],
            defaultConfig: {},
            permissions: []
        };
    }
    /**
     * Create plugin directory structure
     */
    static async createPluginStructure(pluginDir, manifest) {
        const fs = await import('fs/promises');
        const path = await import('path');
        // Create plugin directory
        await fs.mkdir(pluginDir, { recursive: true });
        // Write manifest file
        const manifestPath = path.join(pluginDir, 'plugin.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        // Create basic index.js file
        const indexPath = path.join(pluginDir, 'index.js');
        const indexContent = `
/**
 * ${manifest.name} Plugin
 * ${manifest.description}
 */

const { BasePlugin } = require('@mcp-interface-validator/core/plugin-system');

class ${manifest.name.replace(/[^a-zA-Z0-9]/g, '')}Plugin extends BasePlugin {
  async onInitialize() {
    this._log('info', 'Plugin initialized');
  }

  async onStart() {
    this._log('info', 'Plugin started');
  }

  async onStop() {
    this._log('info', 'Plugin stopped');
  }

  async onCleanup() {
    this._log('info', 'Plugin cleaned up');
  }
}

module.exports = ${manifest.name.replace(/[^a-zA-Z0-9]/g, '')}Plugin;
`.trim();
        await fs.writeFile(indexPath, indexContent);
        // Create README.md
        const readmePath = path.join(pluginDir, 'README.md');
        const readmeContent = `
# ${manifest.name}

${manifest.description}

## Installation

Copy this plugin to your plugins directory.

## Configuration

This plugin supports the following configuration options:

\`\`\`json
{
  // Add configuration options here
}
\`\`\`

## Usage

This plugin provides the following features:

- Feature 1
- Feature 2

## License

${manifest.license || 'MIT'}
`.trim();
        await fs.writeFile(readmePath, readmeContent);
    }
}
/**
 * Plugin system events
 */
export const PLUGIN_EVENTS = {
    DISCOVERED: 'plugin.discovered',
    LOADING: 'plugin.loading',
    LOADED: 'plugin.loaded',
    INITIALIZING: 'plugin.initializing',
    INITIALIZED: 'plugin.initialized',
    STARTING: 'plugin.starting',
    STARTED: 'plugin.started',
    STOPPING: 'plugin.stopping',
    STOPPED: 'plugin.stopped',
    ERROR: 'plugin.error',
    STATE_CHANGED: 'plugin.stateChanged',
    HOOK_REGISTERED: 'hook.registered',
    HOOK_UNREGISTERED: 'hook.unregistered',
    HOOK_EXECUTED: 'hook.executed'
};
/**
 * Plugin hook types
 */
export const HOOK_TYPES = {
    VALIDATION_BEFORE: 'validation.before',
    VALIDATION_AFTER: 'validation.after',
    VALIDATION_ERROR: 'validation.error',
    PARSING_BEFORE: 'parsing.before',
    PARSING_AFTER: 'parsing.after',
    PARSING_ERROR: 'parsing.error',
    REPORT_BEFORE: 'report.before',
    REPORT_AFTER: 'report.after',
    SERVER_START: 'server.start',
    SERVER_STOP: 'server.stop',
    CONFIG_CHANGE: 'config.change',
    CUSTOM: 'custom'
};
/**
 * Plugin states
 */
export const PLUGIN_STATES = {
    UNLOADED: 'unloaded',
    LOADING: 'loading',
    LOADED: 'loaded',
    INITIALIZING: 'initializing',
    INITIALIZED: 'initialized',
    STARTING: 'starting',
    STARTED: 'started',
    STOPPING: 'stopping',
    STOPPED: 'stopped',
    ERROR: 'error',
    DISABLED: 'disabled'
};
//# sourceMappingURL=index.js.map