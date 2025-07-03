/**
 * Version Control System for API Specifications
 * 
 * This module provides version control functionality for API specifications,
 * including change tracking, version comparison, rollback support, and conflict resolution.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import type { Logger } from '../../utils/logger';
import type {
  VersionControlConfig,
  ApiSpecification,
  VersionEntry,
  ChangeSet,
  ConflictResolution,
  VersionDiff,
  VersionMetadata,
  VersionControlProvider
} from './types';
import { GitProvider } from './providers/git-provider';
import { FileSystemProvider } from './providers/filesystem-provider';

/**
 * Main Version Control Manager
 */
export class VersionControlManager extends EventEmitter {
  private config: VersionControlConfig;
  private logger: Logger;
  private provider: VersionControlProvider;
  private versions: Map<string, VersionEntry[]> = new Map();
  private currentVersions: Map<string, string> = new Map();
  private initialized: boolean = false;

  constructor(config: VersionControlConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    
    // Initialize provider based on configuration
    this.provider = this.createProvider();
  }

  /**
   * Initialize the version control system
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing version control system...');
      
      await this.provider.initialize();
      await this.loadVersionHistory();
      
      this.initialized = true;
      this.logger.info('Version control system initialized successfully');
      
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize version control system:', error);
      throw error;
    }
  }

  /**
   * Create a new version of an API specification
   */
  async createVersion(
    specId: string,
    specification: ApiSpecification,
    metadata: Partial<VersionMetadata> = {}
  ): Promise<VersionEntry> {
    this.ensureInitialized();
    
    try {
      const versionId = this.generateVersionId();
      const timestamp = new Date();
      const hash = this.calculateSpecHash(specification);
      
      const currentVersion = this.getCurrentVersion(specId);
      const versionEntry: VersionEntry = {
        id: versionId,
        specId,
        version: this.getNextVersion(specId),
        specification,
        hash,
        timestamp,
        metadata: {
          author: metadata.author || 'system',
          message: metadata.message || 'Auto-generated version',
          tags: metadata.tags || [],
          ...metadata
        },
        ...(currentVersion && { parent: currentVersion })
      };

      // Store version
      await this.provider.storeVersion(versionEntry);
      
      // Update version history
      if (!this.versions.has(specId)) {
        this.versions.set(specId, []);
      }
      this.versions.get(specId)!.push(versionEntry);
      this.currentVersions.set(specId, versionId);
      
      this.logger.info(`Created version ${versionEntry.version} for spec ${specId}`);
      this.emit('versionCreated', versionEntry);
      
      return versionEntry;
    } catch (error) {
      this.logger.error(`Failed to create version for spec ${specId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific version of an API specification
   */
  async getVersion(specId: string, versionId: string): Promise<VersionEntry | null> {
    this.ensureInitialized();
    
    try {
      const versions = this.versions.get(specId);
      if (!versions) {
        return null;
      }
      
      const version = versions.find(v => v.id === versionId);
      if (!version) {
        // Try to load from provider
        return await this.provider.getVersion(specId, versionId);
      }
      
      return version;
    } catch (error) {
      this.logger.error(`Failed to get version ${versionId} for spec ${specId}:`, error);
      throw error;
    }
  }

  /**
   * Get version history for a specification
   */
  getVersionHistory(specId: string): VersionEntry[] {
    this.ensureInitialized();
    return this.versions.get(specId) || [];
  }

  /**
   * Compare two versions and return differences
   */
  async compareVersions(
    specId: string,
    fromVersionId: string,
    toVersionId: string
  ): Promise<VersionDiff> {
    this.ensureInitialized();
    
    try {
      const fromVersion = await this.getVersion(specId, fromVersionId);
      const toVersion = await this.getVersion(specId, toVersionId);
      
      if (!fromVersion || !toVersion) {
        throw new Error('One or both versions not found');
      }
      
      const diff = this.calculateDiff(fromVersion.specification, toVersion.specification);
      
      return {
        specId,
        fromVersion: fromVersion.id,
        toVersion: toVersion.id,
        changes: diff,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to compare versions for spec ${specId}:`, error);
      throw error;
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollback(specId: string, targetVersionId: string): Promise<VersionEntry> {
    this.ensureInitialized();
    
    try {
      const targetVersion = await this.getVersion(specId, targetVersionId);
      if (!targetVersion) {
        throw new Error(`Target version ${targetVersionId} not found`);
      }
      
      // Create a new version based on the target version
      const rollbackVersion = await this.createVersion(
        specId,
        targetVersion.specification,
        {
          author: 'system',
          message: `Rollback to version ${targetVersion.version}`,
          tags: ['rollback']
        }
      );
      
      this.logger.info(`Rolled back spec ${specId} to version ${targetVersion.version}`);
      this.emit('rollback', { specId, targetVersion, rollbackVersion });
      
      return rollbackVersion;
    } catch (error) {
      this.logger.error(`Failed to rollback spec ${specId}:`, error);
      throw error;
    }
  }

  /**
   * Get the current version of a specification
   */
  getCurrentVersion(specId: string): string | undefined {
    return this.currentVersions.get(specId);
  }

  /**
   * Get the latest version entry for a specification
   */
  getLatestVersion(specId: string): VersionEntry | null {
    const versions = this.versions.get(specId);
    if (!versions || versions.length === 0) {
      return null;
    }

    return versions[versions.length - 1] || null;
  }

  /**
   * Create a branch from a specific version
   */
  async createBranch(
    specId: string,
    branchName: string,
    fromVersionId?: string
  ): Promise<void> {
    this.ensureInitialized();
    
    try {
      const sourceVersion = fromVersionId 
        ? await this.getVersion(specId, fromVersionId)
        : this.getLatestVersion(specId);
        
      if (!sourceVersion) {
        throw new Error('Source version not found');
      }
      
      await this.provider.createBranch(specId, branchName, sourceVersion.id);
      
      this.logger.info(`Created branch ${branchName} for spec ${specId}`);
      this.emit('branchCreated', { specId, branchName, sourceVersion });
    } catch (error) {
      this.logger.error(`Failed to create branch ${branchName} for spec ${specId}:`, error);
      throw error;
    }
  }

  /**
   * Merge changes from one branch to another
   */
  async mergeBranch(
    specId: string,
    sourceBranch: string,
    targetBranch: string,
    conflictResolution?: ConflictResolution
  ): Promise<VersionEntry> {
    this.ensureInitialized();
    
    try {
      const mergeResult = await this.provider.mergeBranch(
        specId,
        sourceBranch,
        targetBranch,
        conflictResolution
      );
      
      this.logger.info(`Merged branch ${sourceBranch} into ${targetBranch} for spec ${specId}`);
      this.emit('branchMerged', { specId, sourceBranch, targetBranch, mergeResult });
      
      return mergeResult;
    } catch (error) {
      this.logger.error(`Failed to merge branch ${sourceBranch} into ${targetBranch}:`, error);
      throw error;
    }
  }

  /**
   * Detect conflicts between versions
   */
  async detectConflicts(
    specId: string,
    versionId1: string,
    versionId2: string
  ): Promise<ChangeSet[]> {
    this.ensureInitialized();
    
    try {
      const version1 = await this.getVersion(specId, versionId1);
      const version2 = await this.getVersion(specId, versionId2);
      
      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }
      
      return this.findConflicts(version1.specification, version2.specification);
    } catch (error) {
      this.logger.error(`Failed to detect conflicts for spec ${specId}:`, error);
      throw error;
    }
  }

  /**
   * Get version control statistics
   */
  getStatistics(): {
    totalSpecs: number;
    totalVersions: number;
    averageVersionsPerSpec: number;
    oldestVersion: Date | null;
    newestVersion: Date | null;
  } {
    const totalSpecs = this.versions.size;
    let totalVersions = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;
    
    for (const versions of this.versions.values()) {
      totalVersions += versions.length;
      
      for (const version of versions) {
        if (!oldestDate || version.timestamp < oldestDate) {
          oldestDate = version.timestamp;
        }
        if (!newestDate || version.timestamp > newestDate) {
          newestDate = version.timestamp;
        }
      }
    }
    
    return {
      totalSpecs,
      totalVersions,
      averageVersionsPerSpec: totalSpecs > 0 ? totalVersions / totalSpecs : 0,
      oldestVersion: oldestDate,
      newestVersion: newestDate
    };
  }

  // Private helper methods
  private createProvider(): VersionControlProvider {
    switch (this.config.provider.type) {
      case 'git':
        return new GitProvider(this.config.provider.config as any, this.logger);
      case 'filesystem':
        return new FileSystemProvider(this.config.provider.config as any, this.logger);
      default:
        throw new Error(`Unsupported provider type: ${this.config.provider.type}`);
    }
  }

  private async loadVersionHistory(): Promise<void> {
    try {
      const history = await this.provider.loadHistory();
      
      for (const [specId, versions] of history) {
        this.versions.set(specId, versions);

        if (versions.length > 0) {
          const latest = versions[versions.length - 1];
          if (latest) {
            this.currentVersions.set(specId, latest.id);
          }
        }
      }
      
      this.logger.info(`Loaded version history for ${history.size} specifications`);
    } catch (error) {
      this.logger.warn('Failed to load version history:', error);
    }
  }

  private generateVersionId(): string {
    return crypto.randomUUID();
  }

  private calculateSpecHash(specification: ApiSpecification): string {
    const content = JSON.stringify(specification, null, 0);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private getNextVersion(specId: string): string {
    const versions = this.versions.get(specId);
    if (!versions || versions.length === 0) {
      return '1.0.0';
    }

    const latest = versions[versions.length - 1];
    if (!latest) {
      return '1.0.0';
    }

    const versionParts = latest.version.split('.').map(Number);
    const [major = 1, minor = 0, patch = 0] = versionParts;

    return `${major}.${minor}.${patch + 1}`;
  }

  private calculateDiff(spec1: ApiSpecification, spec2: ApiSpecification): ChangeSet[] {
    const changes: ChangeSet[] = [];
    
    // Compare endpoints
    const endpoints1 = new Set(Object.keys(spec1.paths || {}));
    const endpoints2 = new Set(Object.keys(spec2.paths || {}));
    
    // Added endpoints
    for (const endpoint of endpoints2) {
      if (!endpoints1.has(endpoint)) {
        changes.push({
          type: 'addition',
          path: `paths.${endpoint}`,
          oldValue: undefined,
          newValue: spec2.paths?.[endpoint]
        });
      }
    }
    
    // Removed endpoints
    for (const endpoint of endpoints1) {
      if (!endpoints2.has(endpoint)) {
        changes.push({
          type: 'deletion',
          path: `paths.${endpoint}`,
          oldValue: spec1.paths?.[endpoint],
          newValue: undefined
        });
      }
    }
    
    // Modified endpoints
    for (const endpoint of endpoints1) {
      if (endpoints2.has(endpoint)) {
        const old = spec1.paths?.[endpoint];
        const new_ = spec2.paths?.[endpoint];
        
        if (JSON.stringify(old) !== JSON.stringify(new_)) {
          changes.push({
            type: 'modification',
            path: `paths.${endpoint}`,
            oldValue: old,
            newValue: new_
          });
        }
      }
    }
    
    return changes;
  }

  private findConflicts(spec1: ApiSpecification, spec2: ApiSpecification): ChangeSet[] {
    const conflicts: ChangeSet[] = [];
    
    // Find conflicting changes in the same paths
    const paths1 = Object.keys(spec1.paths || {});
    const paths2 = Object.keys(spec2.paths || {});
    
    for (const path of paths1) {
      if (paths2.includes(path)) {
        const endpoint1 = spec1.paths?.[path];
        const endpoint2 = spec2.paths?.[path];
        
        if (JSON.stringify(endpoint1) !== JSON.stringify(endpoint2)) {
          conflicts.push({
            type: 'conflict',
            path: `paths.${path}`,
            oldValue: endpoint1,
            newValue: endpoint2
          });
        }
      }
    }
    
    return conflicts;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Version control system not initialized');
    }
  }
}

// Export types and providers
export * from './types';
export { GitProvider } from './providers/git-provider';
export { FileSystemProvider } from './providers/filesystem-provider';
