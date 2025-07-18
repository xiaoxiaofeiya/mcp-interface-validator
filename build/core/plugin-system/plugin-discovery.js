/**
 * Plugin Discovery System
 *
 * Handles discovery and validation of plugins in configured directories
 */
import * as fs from 'fs/promises';
import * as path from 'path';
// import { glob } from 'glob'; // Will implement simple directory scanning
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index.js';
/**
 * Plugin discovery service
 */
export class PluginDiscovery extends EventEmitter {
    config;
    logger;
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger('PluginDiscovery');
    }
    /**
     * Discover all plugins in configured directories
     */
    async discoverPlugins() {
        this.logger.info('Starting plugin discovery', {
            pluginsDir: this.config.pluginsDir,
            patterns: this.config.discoveryPatterns
        });
        const results = [];
        try {
            // Ensure plugins directory exists
            await this._ensureDirectory(this.config.pluginsDir);
            // Find all potential plugin directories
            const pluginDirs = await this._findPluginDirectories();
            this.logger.info(`Found ${pluginDirs.length} potential plugin directories`);
            // Process each directory
            for (const pluginDir of pluginDirs) {
                try {
                    const result = await this._discoverPlugin(pluginDir);
                    results.push(result);
                    this.emit('plugin.discovered', result);
                    if (result.isValid) {
                        this.logger.info(`Discovered valid plugin: ${result.manifest.name}`, {
                            id: result.manifest.id,
                            version: result.manifest.version,
                            path: result.pluginDir
                        });
                    }
                    else {
                        this.logger.warn(`Invalid plugin found: ${pluginDir}`, {
                            errors: result.errors
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Error discovering plugin in ${pluginDir}`, error);
                    results.push({
                        manifestPath: path.join(pluginDir, 'plugin.json'),
                        pluginDir,
                        manifest: {},
                        errors: [error.message],
                        isValid: false
                    });
                }
            }
            this.logger.info(`Plugin discovery completed. Found ${results.filter(r => r.isValid).length} valid plugins out of ${results.length} total`);
            return results;
        }
        catch (error) {
            this.logger.error('Plugin discovery failed', error);
            throw error;
        }
    }
    /**
     * Discover a single plugin by directory path
     */
    async discoverPlugin(pluginDir) {
        return await this._discoverPlugin(pluginDir);
    }
    /**
     * Validate plugin manifest
     */
    async validateManifest(manifest) {
        const errors = [];
        // Required fields
        if (!manifest.id) {
            errors.push('Plugin ID is required');
        }
        else if (!/^[a-zA-Z0-9\-_.]+$/.test(manifest.id)) {
            errors.push('Plugin ID contains invalid characters');
        }
        if (!manifest.name) {
            errors.push('Plugin name is required');
        }
        if (!manifest.version) {
            errors.push('Plugin version is required');
        }
        else if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
            errors.push('Plugin version must follow semantic versioning (x.y.z)');
        }
        if (!manifest.description) {
            errors.push('Plugin description is required');
        }
        if (!manifest.author) {
            errors.push('Plugin author is required');
        }
        // Validate main entry point
        if (manifest.main && !manifest.main.endsWith('.js')) {
            errors.push('Plugin main entry point must be a .js file');
        }
        // Validate dependencies
        if (manifest.dependencies) {
            for (const dep of manifest.dependencies) {
                if (!dep.id) {
                    errors.push('Dependency ID is required');
                }
                if (!dep.version) {
                    errors.push(`Dependency ${dep.id} version is required`);
                }
            }
        }
        // Validate API version compatibility
        if (manifest.apiVersion && !this._isApiVersionCompatible(manifest.apiVersion)) {
            errors.push(`Plugin API version ${manifest.apiVersion} is not compatible with host`);
        }
        // Validate host version requirements
        if (manifest.minHostVersion && !this._isHostVersionCompatible(manifest.minHostVersion, 'min')) {
            errors.push(`Plugin requires minimum host version ${manifest.minHostVersion}`);
        }
        if (manifest.maxHostVersion && !this._isHostVersionCompatible(manifest.maxHostVersion, 'max')) {
            errors.push(`Plugin requires maximum host version ${manifest.maxHostVersion}`);
        }
        return errors;
    }
    /**
     * Watch for plugin changes (if auto-reload is enabled)
     */
    async watchPlugins() {
        if (!this.config.autoReload) {
            return;
        }
        this.logger.info('Starting plugin file watcher');
        // Implementation would use fs.watch or chokidar for file watching
        // For now, we'll implement a simple polling mechanism
        setInterval(async () => {
            try {
                const results = await this.discoverPlugins();
                this.emit('plugins.changed', results);
            }
            catch (error) {
                this.logger.error('Error during plugin watch', error);
            }
        }, 5000); // Check every 5 seconds
    }
    // Private methods
    async _findPluginDirectories() {
        const directories = [];
        try {
            // Simple directory scanning - read all subdirectories
            const entries = await fs.readdir(this.config.pluginsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(this.config.pluginsDir, entry.name);
                    directories.push(fullPath);
                }
            }
        }
        catch (error) {
            this.logger.warn('Error reading plugins directory', error);
        }
        // Remove duplicates and sort
        return [...new Set(directories)].sort();
    }
    async _discoverPlugin(pluginDir) {
        const manifestPath = path.join(pluginDir, 'plugin.json');
        const errors = [];
        try {
            // Check if manifest file exists
            const manifestExists = await this._fileExists(manifestPath);
            if (!manifestExists) {
                errors.push('Plugin manifest file (plugin.json) not found');
                return {
                    manifestPath,
                    pluginDir,
                    manifest: {},
                    errors,
                    isValid: false
                };
            }
            // Read and parse manifest
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            let manifest;
            try {
                manifest = JSON.parse(manifestContent);
            }
            catch (parseError) {
                errors.push(`Invalid JSON in manifest file: ${parseError.message}`);
                return {
                    manifestPath,
                    pluginDir,
                    manifest: {},
                    errors,
                    isValid: false
                };
            }
            // Validate manifest
            const validationErrors = await this.validateManifest(manifest);
            errors.push(...validationErrors);
            // Check if main entry point exists
            if (manifest.main) {
                const mainPath = path.join(pluginDir, manifest.main);
                const mainExists = await this._fileExists(mainPath);
                if (!mainExists) {
                    errors.push(`Main entry point file not found: ${manifest.main}`);
                }
            }
            // Check permissions
            if (manifest.permissions) {
                const invalidPermissions = manifest.permissions.filter(perm => !this.config.allowedPermissions.includes(perm));
                if (invalidPermissions.length > 0) {
                    errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}`);
                }
            }
            return {
                manifestPath,
                pluginDir,
                manifest,
                errors,
                isValid: errors.length === 0
            };
        }
        catch (error) {
            errors.push(`Error reading plugin directory: ${error.message}`);
            return {
                manifestPath,
                pluginDir,
                manifest: {},
                errors,
                isValid: false
            };
        }
    }
    async _ensureDirectory(dirPath) {
        try {
            await fs.access(dirPath);
        }
        catch {
            await fs.mkdir(dirPath, { recursive: true });
            this.logger.info(`Created plugins directory: ${dirPath}`);
        }
    }
    async _fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    _isApiVersionCompatible(apiVersion) {
        // Simple version compatibility check
        // In a real implementation, this would use semver comparison
        const supportedVersions = ['1.0.0', '1.0.1', '1.1.0'];
        return supportedVersions.includes(apiVersion);
    }
    _isHostVersionCompatible(version, type) {
        // Simple version compatibility check
        // In a real implementation, this would use semver comparison
        const hostVersion = '1.0.0'; // This would come from package.json or config
        if (type === 'min') {
            return this._compareVersions(hostVersion, version) >= 0;
        }
        else {
            return this._compareVersions(hostVersion, version) <= 0;
        }
    }
    _compareVersions(a, b) {
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
}
//# sourceMappingURL=plugin-discovery.js.map