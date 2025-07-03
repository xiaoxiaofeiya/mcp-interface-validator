/**
 * Git Provider for Version Control System
 *
 * This provider implements version control using Git as the backend storage.
 */
import type { Logger } from '../../../utils/logger/index.js';
import type { GitProvider as IGitProvider, GitProviderConfig, VersionEntry, BranchInfo, ConflictResolution, GitCommit } from '../types.js';
/**
 * Git Provider Implementation
 */
export declare class GitProvider implements IGitProvider {
    private config;
    private logger;
    private workingDir;
    private initialized;
    constructor(config: GitProviderConfig, logger: Logger);
    /**
     * Initialize the Git provider
     */
    initialize(): Promise<void>;
    /**
     * Store a version in Git
     */
    storeVersion(version: VersionEntry): Promise<void>;
    /**
     * Get a version from Git
     */
    getVersion(specId: string, versionId: string): Promise<VersionEntry | null>;
    /**
     * Load version history from Git
     */
    loadHistory(): Promise<Map<string, VersionEntry[]>>;
    /**
     * Create a new branch
     */
    createBranch(specId: string, branchName: string, _fromVersionId: string): Promise<void>;
    /**
     * Merge branches
     */
    mergeBranch(specId: string, sourceBranch: string, targetBranch: string, conflictResolution?: ConflictResolution): Promise<VersionEntry>;
    /**
     * List branches for a specification
     */
    listBranches(specId: string): Promise<BranchInfo[]>;
    /**
     * Delete a branch
     */
    deleteBranch(specId: string, branchName: string): Promise<void>;
    /**
     * Clone repository
     */
    clone(): Promise<void>;
    /**
     * Pull latest changes
     */
    pull(): Promise<void>;
    /**
     * Push changes
     */
    push(): Promise<void>;
    /**
     * Commit changes
     */
    commit(message: string, files: string[]): Promise<string>;
    /**
     * Checkout branch
     */
    checkout(branch: string): Promise<void>;
    /**
     * Create tag
     */
    createTag(name: string, message?: string): Promise<void>;
    /**
     * Get commit history
     */
    getCommitHistory(limit?: number): Promise<GitCommit[]>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    private isGitRepository;
    private initRepository;
    private configureGit;
    private resolveConflicts;
    private getVersionPath;
    private execGit;
    private ensureInitialized;
}
//# sourceMappingURL=git-provider.d.ts.map