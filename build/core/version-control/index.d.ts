/**
 * Version Control System for API Specifications
 *
 * This module provides version control functionality for API specifications,
 * including change tracking, version comparison, rollback support, and conflict resolution.
 */
import { EventEmitter } from 'events';
import type { Logger } from '../../utils/logger';
import type { VersionControlConfig, ApiSpecification, VersionEntry, ChangeSet, ConflictResolution, VersionDiff, VersionMetadata } from './types';
/**
 * Main Version Control Manager
 */
export declare class VersionControlManager extends EventEmitter {
    private config;
    private logger;
    private provider;
    private versions;
    private currentVersions;
    private initialized;
    constructor(config: VersionControlConfig, logger: Logger);
    /**
     * Initialize the version control system
     */
    initialize(): Promise<void>;
    /**
     * Create a new version of an API specification
     */
    createVersion(specId: string, specification: ApiSpecification, metadata?: Partial<VersionMetadata>): Promise<VersionEntry>;
    /**
     * Get a specific version of an API specification
     */
    getVersion(specId: string, versionId: string): Promise<VersionEntry | null>;
    /**
     * Get version history for a specification
     */
    getVersionHistory(specId: string): VersionEntry[];
    /**
     * Compare two versions and return differences
     */
    compareVersions(specId: string, fromVersionId: string, toVersionId: string): Promise<VersionDiff>;
    /**
     * Rollback to a previous version
     */
    rollback(specId: string, targetVersionId: string): Promise<VersionEntry>;
    /**
     * Get the current version of a specification
     */
    getCurrentVersion(specId: string): string | undefined;
    /**
     * Get the latest version entry for a specification
     */
    getLatestVersion(specId: string): VersionEntry | null;
    /**
     * Create a branch from a specific version
     */
    createBranch(specId: string, branchName: string, fromVersionId?: string): Promise<void>;
    /**
     * Merge changes from one branch to another
     */
    mergeBranch(specId: string, sourceBranch: string, targetBranch: string, conflictResolution?: ConflictResolution): Promise<VersionEntry>;
    /**
     * Detect conflicts between versions
     */
    detectConflicts(specId: string, versionId1: string, versionId2: string): Promise<ChangeSet[]>;
    /**
     * Get version control statistics
     */
    getStatistics(): {
        totalSpecs: number;
        totalVersions: number;
        averageVersionsPerSpec: number;
        oldestVersion: Date | null;
        newestVersion: Date | null;
    };
    private createProvider;
    private loadVersionHistory;
    private generateVersionId;
    private calculateSpecHash;
    private getNextVersion;
    private calculateDiff;
    private findConflicts;
    private ensureInitialized;
}
export * from './types';
export { GitProvider } from './providers/git-provider';
export { FileSystemProvider } from './providers/filesystem-provider';
//# sourceMappingURL=index.d.ts.map