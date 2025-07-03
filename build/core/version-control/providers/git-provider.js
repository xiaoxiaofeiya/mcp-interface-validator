/**
 * Git Provider for Version Control System
 *
 * This provider implements version control using Git as the backend storage.
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
/**
 * Git Provider Implementation
 */
export class GitProvider {
    config;
    logger;
    workingDir;
    initialized = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.workingDir = config.workingDirectory || path.join(process.cwd(), '.version-control');
    }
    /**
     * Initialize the Git provider
     */
    async initialize() {
        try {
            this.logger.info('Initializing Git provider...');
            // Ensure working directory exists
            await fs.mkdir(this.workingDir, { recursive: true });
            // Check if it's already a git repository
            const isGitRepo = await this.isGitRepository();
            if (!isGitRepo) {
                if (this.config.repository) {
                    // Clone existing repository
                    await this.clone();
                }
                else {
                    // Initialize new repository
                    await this.initRepository();
                }
            }
            // Configure git if credentials are provided
            await this.configureGit();
            this.initialized = true;
            this.logger.info('Git provider initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Git provider:', error);
            throw error;
        }
    }
    /**
     * Store a version in Git
     */
    async storeVersion(version) {
        this.ensureInitialized();
        try {
            const versionPath = this.getVersionPath(version.specId, version.id);
            const versionDir = path.dirname(versionPath);
            // Ensure directory exists
            await fs.mkdir(versionDir, { recursive: true });
            // Write version data
            const versionData = {
                ...version,
                specification: JSON.stringify(version.specification, null, 2)
            };
            await fs.writeFile(versionPath, JSON.stringify(versionData, null, 2));
            // Add to git and commit
            await this.execGit(['add', versionPath]);
            await this.commit(`Add version ${version.version} for spec ${version.specId}`, [versionPath]);
            this.logger.debug(`Stored version ${version.id} in Git`);
        }
        catch (error) {
            this.logger.error(`Failed to store version ${version.id}:`, error);
            throw error;
        }
    }
    /**
     * Get a version from Git
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
            const content = await fs.readFile(versionPath, 'utf-8');
            const versionData = JSON.parse(content);
            // Parse specification back to object
            if (typeof versionData.specification === 'string') {
                versionData.specification = JSON.parse(versionData.specification);
            }
            return versionData;
        }
        catch (error) {
            this.logger.error(`Failed to get version ${versionId}:`, error);
            return null;
        }
    }
    /**
     * Load version history from Git
     */
    async loadHistory() {
        this.ensureInitialized();
        const history = new Map();
        try {
            const versionsDir = path.join(this.workingDir, 'versions');
            // Check if versions directory exists
            try {
                await fs.access(versionsDir);
            }
            catch {
                return history;
            }
            const specDirs = await fs.readdir(versionsDir);
            for (const specId of specDirs) {
                const specDir = path.join(versionsDir, specId);
                const stat = await fs.stat(specDir);
                if (stat.isDirectory()) {
                    const versions = [];
                    const versionFiles = await fs.readdir(specDir);
                    for (const versionFile of versionFiles) {
                        if (versionFile.endsWith('.json')) {
                            const versionPath = path.join(specDir, versionFile);
                            const content = await fs.readFile(versionPath, 'utf-8');
                            const versionData = JSON.parse(content);
                            // Parse specification back to object
                            if (typeof versionData.specification === 'string') {
                                versionData.specification = JSON.parse(versionData.specification);
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
    async createBranch(specId, branchName, _fromVersionId) {
        this.ensureInitialized();
        try {
            // Create and checkout new branch
            await this.execGit(['checkout', '-b', `${specId}/${branchName}`]);
            this.logger.info(`Created branch ${branchName} for spec ${specId}`);
        }
        catch (error) {
            this.logger.error(`Failed to create branch ${branchName}:`, error);
            throw error;
        }
    }
    /**
     * Merge branches
     */
    async mergeBranch(specId, sourceBranch, targetBranch, conflictResolution) {
        this.ensureInitialized();
        try {
            // Checkout target branch
            await this.checkout(targetBranch);
            // Attempt merge
            try {
                await this.execGit(['merge', `${specId}/${sourceBranch}`]);
            }
            catch (error) {
                // Handle merge conflicts
                if (conflictResolution) {
                    await this.resolveConflicts(conflictResolution);
                }
                else {
                    throw new Error('Merge conflicts detected and no resolution strategy provided');
                }
            }
            // Get the merge commit
            const { stdout } = await this.execGit(['rev-parse', 'HEAD']);
            const commitHash = stdout.trim();
            // Create version entry for merge result
            const mergeVersion = {
                id: commitHash,
                specId,
                version: 'merge',
                specification: {}, // Will be populated from actual merged content
                hash: commitHash,
                timestamp: new Date(),
                metadata: {
                    author: 'system',
                    message: `Merge ${sourceBranch} into ${targetBranch}`,
                    tags: ['merge']
                }
            };
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
            const { stdout } = await this.execGit(['branch', '-a']);
            const branches = stdout.split('\n')
                .map(line => line.trim())
                .filter(line => line.includes(`${specId}/`))
                .map(line => line.replace('* ', '').replace('remotes/origin/', ''));
            const branchInfos = [];
            for (const branch of branches) {
                const branchName = branch.split('/')[1];
                if (branchName) {
                    // Get branch info
                    const { stdout: logOutput } = await this.execGit([
                        'log', '--format=%H|%an|%ad|%s', '-1', branch
                    ]);
                    const logParts = logOutput.trim().split('|');
                    const [hash = '', author = '', date = '', _message = ''] = logParts;
                    branchInfos.push({
                        name: branchName,
                        specId,
                        baseVersion: '', // Would need additional logic to determine
                        headVersion: hash,
                        created: new Date(date || Date.now()),
                        lastModified: new Date(date || Date.now()),
                        author,
                        status: 'active'
                    });
                }
            }
            return branchInfos;
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
            await this.execGit(['branch', '-D', `${specId}/${branchName}`]);
            this.logger.info(`Deleted branch ${branchName} for spec ${specId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete branch ${branchName}:`, error);
            throw error;
        }
    }
    /**
     * Clone repository
     */
    async clone() {
        if (!this.config.repository) {
            throw new Error('Repository URL not configured');
        }
        try {
            const parentDir = path.dirname(this.workingDir);
            const dirName = path.basename(this.workingDir);
            await execAsync(`git clone ${this.config.repository} ${dirName}`, {
                cwd: parentDir
            });
            this.logger.info(`Cloned repository ${this.config.repository}`);
        }
        catch (error) {
            this.logger.error('Failed to clone repository:', error);
            throw error;
        }
    }
    /**
     * Pull latest changes
     */
    async pull() {
        this.ensureInitialized();
        try {
            await this.execGit(['pull']);
            this.logger.debug('Pulled latest changes');
        }
        catch (error) {
            this.logger.error('Failed to pull changes:', error);
            throw error;
        }
    }
    /**
     * Push changes
     */
    async push() {
        this.ensureInitialized();
        try {
            await this.execGit(['push']);
            this.logger.debug('Pushed changes');
        }
        catch (error) {
            this.logger.error('Failed to push changes:', error);
            throw error;
        }
    }
    /**
     * Commit changes
     */
    async commit(message, files) {
        this.ensureInitialized();
        try {
            // Add files
            for (const file of files) {
                await this.execGit(['add', file]);
            }
            // Commit
            await this.execGit(['commit', '-m', message]);
            // Get commit hash
            const { stdout } = await this.execGit(['rev-parse', 'HEAD']);
            const commitHash = stdout.trim();
            this.logger.debug(`Committed changes: ${commitHash}`);
            return commitHash;
        }
        catch (error) {
            this.logger.error('Failed to commit changes:', error);
            throw error;
        }
    }
    /**
     * Checkout branch
     */
    async checkout(branch) {
        this.ensureInitialized();
        try {
            await this.execGit(['checkout', branch]);
            this.logger.debug(`Checked out branch: ${branch}`);
        }
        catch (error) {
            this.logger.error(`Failed to checkout branch ${branch}:`, error);
            throw error;
        }
    }
    /**
     * Create tag
     */
    async createTag(name, message) {
        this.ensureInitialized();
        try {
            const args = ['tag'];
            if (message) {
                args.push('-a', name, '-m', message);
            }
            else {
                args.push(name);
            }
            await this.execGit(args);
            this.logger.info(`Created tag: ${name}`);
        }
        catch (error) {
            this.logger.error(`Failed to create tag ${name}:`, error);
            throw error;
        }
    }
    /**
     * Get commit history
     */
    async getCommitHistory(limit = 50) {
        this.ensureInitialized();
        try {
            const { stdout } = await this.execGit([
                'log',
                `--max-count=${limit}`,
                '--format=%H|%an|%ae|%ad|%s',
                '--name-only'
            ]);
            const commits = [];
            const lines = stdout.split('\n');
            let i = 0;
            while (i < lines.length) {
                const line = lines[i]?.trim();
                if (!line) {
                    i++;
                    continue;
                }
                const lineParts = line.split('|');
                const [hash = '', author = '', email = '', date = '', message = ''] = lineParts;
                const files = [];
                // Collect file names
                i++;
                while (i < lines.length && lines[i]?.trim() && !lines[i]?.includes('|')) {
                    const fileName = lines[i]?.trim();
                    if (fileName) {
                        files.push(fileName);
                    }
                    i++;
                }
                commits.push({
                    hash,
                    author,
                    email,
                    date: new Date(date || Date.now()),
                    message,
                    files
                });
            }
            return commits;
        }
        catch (error) {
            this.logger.error('Failed to get commit history:', error);
            return [];
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        // Git provider doesn't need explicit cleanup
        this.logger.debug('Git provider cleanup completed');
    }
    // Private helper methods
    async isGitRepository() {
        try {
            await this.execGit(['status']);
            return true;
        }
        catch {
            return false;
        }
    }
    async initRepository() {
        try {
            await this.execGit(['init']);
            this.logger.info('Initialized new Git repository');
        }
        catch (error) {
            this.logger.error('Failed to initialize Git repository:', error);
            throw error;
        }
    }
    async configureGit() {
        try {
            if (this.config.credentials?.username) {
                await this.execGit(['config', 'user.name', this.config.credentials.username]);
            }
            if (this.config.credentials?.username) {
                await this.execGit(['config', 'user.email', `${this.config.credentials.username}@example.com`]);
            }
        }
        catch (error) {
            this.logger.warn('Failed to configure Git:', error);
        }
    }
    async resolveConflicts(resolution) {
        // Simplified conflict resolution
        switch (resolution.strategy) {
            case 'latest-wins':
                await this.execGit(['checkout', '--theirs', '.']);
                break;
            case 'oldest-wins':
                await this.execGit(['checkout', '--ours', '.']);
                break;
            default:
                throw new Error(`Unsupported conflict resolution strategy: ${resolution.strategy}`);
        }
        await this.execGit(['add', '.']);
        await this.execGit(['commit', '-m', 'Resolve merge conflicts']);
    }
    getVersionPath(specId, versionId) {
        return path.join(this.workingDir, 'versions', specId, `${versionId}.json`);
    }
    async execGit(args) {
        return execAsync(`git ${args.join(' ')}`, { cwd: this.workingDir });
    }
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Git provider not initialized');
        }
    }
}
//# sourceMappingURL=git-provider.js.map