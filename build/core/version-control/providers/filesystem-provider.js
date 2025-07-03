/**
 * File System Provider for Version Control System
 *
 * This provider implements version control using the local file system as storage.
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
/**
 * File System Provider Implementation
 */
export class FileSystemProvider {
    config;
    logger;
    basePath;
    initialized = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.basePath = path.resolve(config.basePath);
    }
    /**
     * Initialize the file system provider
     */
    async initialize() {
        try {
            this.logger.info('Initializing File System provider...');
            // Ensure base directory exists
            await this.ensureDirectory(this.basePath);
            // Create subdirectories
            await this.ensureDirectory(path.join(this.basePath, 'versions'));
            await this.ensureDirectory(path.join(this.basePath, 'branches'));
            await this.ensureDirectory(path.join(this.basePath, 'metadata'));
            this.initialized = true;
            this.logger.info('File System provider initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize File System provider:', error);
            throw error;
        }
    }
    /**
     * Store a version in the file system
     */
    async storeVersion(version) {
        this.ensureInitialized();
        try {
            const versionPath = this.getVersionPath(version.specId, version.id);
            const versionDir = path.dirname(versionPath);
            // Ensure directory exists
            await this.ensureDirectory(versionDir);
            // Prepare version data for storage
            const versionData = {
                ...version,
                timestamp: version.timestamp.toISOString()
            };
            // Write version file
            await this.writeFile(versionPath, JSON.stringify(versionData, null, 2));
            // Update metadata
            await this.updateMetadata(version.specId, version);
            this.logger.debug(`Stored version ${version.id} in file system`);
        }
        catch (error) {
            this.logger.error(`Failed to store version ${version.id}:`, error);
            throw error;
        }
    }
    /**
     * Get a version from the file system
     */
    async getVersion(specId, versionId) {
        this.ensureInitialized();
        try {
            const versionPath = this.getVersionPath(specId, versionId);
            // Check if file exists
            try {
                await fs.access(versionPath);
            }
            catch {
                return null;
            }
            const content = await this.readFile(versionPath);
            const versionData = JSON.parse(content);
            // Convert timestamp back to Date
            if (typeof versionData.timestamp === 'string') {
                versionData.timestamp = new Date(versionData.timestamp);
            }
            return versionData;
        }
        catch (error) {
            this.logger.error(`Failed to get version ${versionId}:`, error);
            return null;
        }
    }
    /**
     * Load version history from the file system
     */
    async loadHistory() {
        this.ensureInitialized();
        const history = new Map();
        try {
            const versionsDir = path.join(this.basePath, 'versions');
            // Check if versions directory exists
            try {
                await fs.access(versionsDir);
            }
            catch {
                return history;
            }
            const specDirs = await this.listFiles(versionsDir);
            for (const specId of specDirs) {
                const specDir = path.join(versionsDir, specId);
                const stat = await fs.stat(specDir);
                if (stat.isDirectory()) {
                    const versions = [];
                    const versionFiles = await this.listFiles(specDir);
                    for (const versionFile of versionFiles) {
                        if (versionFile.endsWith('.json')) {
                            const versionPath = path.join(specDir, versionFile);
                            const content = await this.readFile(versionPath);
                            const versionData = JSON.parse(content);
                            // Convert timestamp back to Date
                            if (typeof versionData.timestamp === 'string') {
                                versionData.timestamp = new Date(versionData.timestamp);
                            }
                            versions.push(versionData);
                        }
                    }
                    // Sort versions by timestamp
                    versions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                    history.set(specId, versions);
                }
            }
            this.logger.info(`Loaded history for ${history.size} specifications`);
            return history;
        }
        catch (error) {
            this.logger.error('Failed to load version history:', error);
            return history;
        }
    }
    /**
     * Create a new branch
     */
    async createBranch(specId, branchName, fromVersionId) {
        this.ensureInitialized();
        try {
            const branchPath = this.getBranchPath(specId, branchName);
            const branchDir = path.dirname(branchPath);
            await this.ensureDirectory(branchDir);
            const branchInfo = {
                name: branchName,
                specId,
                baseVersion: fromVersionId,
                headVersion: fromVersionId,
                created: new Date(),
                lastModified: new Date(),
                author: 'system',
                status: 'active'
            };
            await this.writeFile(branchPath, JSON.stringify(branchInfo, null, 2));
            this.logger.info(`Created branch ${branchName} for spec ${specId}`);
        }
        catch (error) {
            this.logger.error(`Failed to create branch ${branchName}:`, error);
            throw error;
        }
    }
    /**
     * Merge branches (simplified implementation)
     */
    async mergeBranch(specId, sourceBranch, targetBranch, _conflictResolution) {
        this.ensureInitialized();
        try {
            // Get branch information
            const sourceBranchInfo = await this.getBranchInfo(specId, sourceBranch);
            const targetBranchInfo = await this.getBranchInfo(specId, targetBranch);
            if (!sourceBranchInfo || !targetBranchInfo) {
                throw new Error('Source or target branch not found');
            }
            // Get the head versions
            const sourceVersion = await this.getVersion(specId, sourceBranchInfo.headVersion);
            const targetVersion = await this.getVersion(specId, targetBranchInfo.headVersion);
            if (!sourceVersion || !targetVersion) {
                throw new Error('Source or target version not found');
            }
            // Simple merge strategy: use source version as the merged result
            const mergeVersion = {
                id: crypto.randomUUID(),
                specId,
                version: this.getNextVersion(specId),
                specification: sourceVersion.specification,
                hash: this.calculateHash(sourceVersion.specification),
                timestamp: new Date(),
                metadata: {
                    author: 'system',
                    message: `Merge ${sourceBranch} into ${targetBranch}`,
                    tags: ['merge'],
                    source: sourceBranch,
                    custom: {
                        mergedFrom: sourceBranchInfo.headVersion,
                        mergedInto: targetBranchInfo.headVersion
                    }
                },
                parent: targetBranchInfo.headVersion
            };
            // Store the merge version
            await this.storeVersion(mergeVersion);
            // Update target branch head
            targetBranchInfo.headVersion = mergeVersion.id;
            targetBranchInfo.lastModified = new Date();
            await this.updateBranchInfo(specId, targetBranch, targetBranchInfo);
            this.logger.info(`Merged branch ${sourceBranch} into ${targetBranch}`);
            return mergeVersion;
        }
        catch (error) {
            this.logger.error(`Failed to merge branches:`, error);
            throw error;
        }
    }
    /**
     * List branches for a specification
     */
    async listBranches(specId) {
        this.ensureInitialized();
        try {
            const branchesDir = path.join(this.basePath, 'branches', specId);
            // Check if branches directory exists
            try {
                await fs.access(branchesDir);
            }
            catch {
                return [];
            }
            const branchFiles = await this.listFiles(branchesDir);
            const branches = [];
            for (const branchFile of branchFiles) {
                if (branchFile.endsWith('.json')) {
                    const branchPath = path.join(branchesDir, branchFile);
                    const content = await this.readFile(branchPath);
                    const branchInfo = JSON.parse(content);
                    // Convert dates back to Date objects
                    branchInfo.created = new Date(branchInfo.created);
                    branchInfo.lastModified = new Date(branchInfo.lastModified);
                    branches.push(branchInfo);
                }
            }
            return branches;
        }
        catch (error) {
            this.logger.error(`Failed to list branches for spec ${specId}:`, error);
            return [];
        }
    }
    /**
     * Delete a branch
     */
    async deleteBranch(specId, branchName) {
        this.ensureInitialized();
        try {
            const branchPath = this.getBranchPath(specId, branchName);
            await this.deleteFile(branchPath);
            this.logger.info(`Deleted branch ${branchName} for spec ${specId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete branch ${branchName}:`, error);
            throw error;
        }
    }
    /**
     * Ensure directory exists
     */
    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            this.logger.error(`Failed to create directory ${dirPath}:`, error);
            throw error;
        }
    }
    /**
     * Write file
     */
    async writeFile(filePath, content) {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
        }
        catch (error) {
            this.logger.error(`Failed to write file ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Read file
     */
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            this.logger.error(`Failed to read file ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Delete file
     */
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            this.logger.error(`Failed to delete file ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * List files in directory
     */
    async listFiles(directory) {
        try {
            return await fs.readdir(directory);
        }
        catch (error) {
            this.logger.error(`Failed to list files in ${directory}:`, error);
            return [];
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        // File system provider doesn't need explicit cleanup
        this.logger.debug('File System provider cleanup completed');
    }
    // Private helper methods
    getVersionPath(specId, versionId) {
        const fileName = this.config.naming?.includeTimestamp
            ? `${versionId}_${Date.now()}.json`
            : `${versionId}.json`;
        if (this.config.structure === 'flat') {
            return path.join(this.basePath, 'versions', `${specId}_${fileName}`);
        }
        else {
            return path.join(this.basePath, 'versions', specId, fileName);
        }
    }
    getBranchPath(specId, branchName) {
        return path.join(this.basePath, 'branches', specId, `${branchName}.json`);
    }
    async getBranchInfo(specId, branchName) {
        try {
            const branchPath = this.getBranchPath(specId, branchName);
            const content = await this.readFile(branchPath);
            const branchInfo = JSON.parse(content);
            // Convert dates back to Date objects
            branchInfo.created = new Date(branchInfo.created);
            branchInfo.lastModified = new Date(branchInfo.lastModified);
            return branchInfo;
        }
        catch (error) {
            return null;
        }
    }
    async updateBranchInfo(specId, branchName, branchInfo) {
        const branchPath = this.getBranchPath(specId, branchName);
        await this.writeFile(branchPath, JSON.stringify(branchInfo, null, 2));
    }
    async updateMetadata(specId, version) {
        try {
            const metadataPath = path.join(this.basePath, 'metadata', `${specId}.json`);
            let metadata = {};
            try {
                const content = await this.readFile(metadataPath);
                metadata = JSON.parse(content);
            }
            catch {
                // File doesn't exist, start with empty metadata
            }
            if (!metadata.versions) {
                metadata.versions = [];
            }
            metadata.versions.push({
                id: version.id,
                version: version.version,
                timestamp: version.timestamp.toISOString(),
                hash: version.hash
            });
            metadata.lastUpdated = new Date().toISOString();
            await this.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        catch (error) {
            this.logger.warn(`Failed to update metadata for spec ${specId}:`, error);
        }
    }
    getNextVersion(_specId) {
        // Simple version increment - in a real implementation,
        // this would read the latest version from metadata
        return `1.0.${Date.now()}`;
    }
    calculateHash(specification) {
        const content = JSON.stringify(specification, null, 0);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('File System provider not initialized');
        }
    }
}
//# sourceMappingURL=filesystem-provider.js.map