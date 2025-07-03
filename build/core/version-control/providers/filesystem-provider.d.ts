/**
 * File System Provider for Version Control System
 *
 * This provider implements version control using the local file system as storage.
 */
import type { Logger } from '../../../utils/logger';
import type { VersionControlProvider, FileSystemProvider as IFileSystemProvider, FileSystemProviderConfig, VersionEntry, BranchInfo, ConflictResolution } from '../types';
/**
 * File System Provider Implementation
 */
export declare class FileSystemProvider implements VersionControlProvider, IFileSystemProvider {
    private config;
    private logger;
    private basePath;
    private initialized;
    constructor(config: FileSystemProviderConfig, logger: Logger);
    /**
     * Initialize the file system provider
     */
    initialize(): Promise<void>;
    /**
     * Store a version in the file system
     */
    storeVersion(version: VersionEntry): Promise<void>;
    /**
     * Get a version from the file system
     */
    getVersion(specId: string, versionId: string): Promise<VersionEntry | null>;
    /**
     * Load version history from the file system
     */
    loadHistory(): Promise<Map<string, VersionEntry[]>>;
    /**
     * Create a new branch
     */
    createBranch(specId: string, branchName: string, fromVersionId: string): Promise<void>;
    /**
     * Merge branches (simplified implementation)
     */
    mergeBranch(specId: string, sourceBranch: string, targetBranch: string, _conflictResolution?: ConflictResolution): Promise<VersionEntry>;
    /**
     * List branches for a specification
     */
    listBranches(specId: string): Promise<BranchInfo[]>;
    /**
     * Delete a branch
     */
    deleteBranch(specId: string, branchName: string): Promise<void>;
    /**
     * Ensure directory exists
     */
    ensureDirectory(dirPath: string): Promise<void>;
    /**
     * Write file
     */
    writeFile(filePath: string, content: string): Promise<void>;
    /**
     * Read file
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Delete file
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * List files in directory
     */
    listFiles(directory: string): Promise<string[]>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    private getVersionPath;
    private getBranchPath;
    private getBranchInfo;
    private updateBranchInfo;
    private updateMetadata;
    private getNextVersion;
    private calculateHash;
    private ensureInitialized;
}
//# sourceMappingURL=filesystem-provider.d.ts.map