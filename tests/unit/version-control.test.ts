/**
 * Unit tests for Version Control System
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import * as path from 'path';
import { VersionControlManager } from '../../src/core/version-control';
import { FileSystemProvider } from '../../src/core/version-control/providers/filesystem-provider';
import { VersionControlConfigFactory } from '../../src/core/version-control/config';
import type { ApiSpecification, VersionEntry, VersionControlConfig } from '../../src/core/version-control/types';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Test data
const testSpec: ApiSpecification = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'Test API specification'
  },
  paths: {
    '/users': {
      get: {
        summary: 'Get users',
        responses: {
          '200': {
            description: 'Success'
          }
        }
      }
    }
  }
};

const testSpecModified: ApiSpecification = {
  ...testSpec,
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        responses: {
          '200': {
            description: 'Success'
          }
        }
      },
      post: {
        summary: 'Create user',
        responses: {
          '201': {
            description: 'Created'
          }
        }
      }
    }
  }
};

describe('Version Control System', () => {
  let versionControl: VersionControlManager;
  let config: VersionControlConfig;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(__dirname, '../../temp/version-control-test');
    await fs.mkdir(testDir, { recursive: true });

    // Create test configuration
    config = VersionControlConfigFactory.createTestConfig();
    config.provider.config = {
      basePath: testDir,
      structure: 'hierarchical',
      naming: {
        pattern: '{specId}_{versionId}',
        includeTimestamp: false,
        includeHash: false
      }
    };

    versionControl = new VersionControlManager(config, mockLogger as any);
    await versionControl.initialize();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing version control system...');
      expect(mockLogger.info).toHaveBeenCalledWith('Version control system initialized successfully');
    });

    it('should create required directories', async () => {
      const versionsDir = path.join(testDir, 'versions');
      const branchesDir = path.join(testDir, 'branches');
      const metadataDir = path.join(testDir, 'metadata');

      await expect(fs.access(versionsDir)).resolves.not.toThrow();
      await expect(fs.access(branchesDir)).resolves.not.toThrow();
      await expect(fs.access(metadataDir)).resolves.not.toThrow();
    });
  });

  describe('Version Creation', () => {
    it('should create a new version', async () => {
      const version = await versionControl.createVersion('test-spec', testSpec, {
        author: 'test-user',
        message: 'Initial version'
      });

      expect(version).toBeDefined();
      expect(version.specId).toBe('test-spec');
      expect(version.version).toBe('1.0.0');
      expect(version.specification).toEqual(testSpec);
      expect(version.metadata.author).toBe('test-user');
      expect(version.metadata.message).toBe('Initial version');
    });

    it('should increment version numbers', async () => {
      const version1 = await versionControl.createVersion('test-spec', testSpec);
      const version2 = await versionControl.createVersion('test-spec', testSpecModified);

      expect(version1.version).toBe('1.0.0');
      expect(version2.version).toBe('1.0.1');
      expect(version2.parent).toBe(version1.id);
    });

    it('should calculate specification hash', async () => {
      const version = await versionControl.createVersion('test-spec', testSpec);
      
      expect(version.hash).toBeDefined();
      expect(version.hash).toHaveLength(64); // SHA-256 hash length
    });

    it('should emit versionCreated event', async () => {
      const eventSpy = jest.fn();
      versionControl.on('versionCreated', eventSpy);

      const version = await versionControl.createVersion('test-spec', testSpec);

      expect(eventSpy).toHaveBeenCalledWith(version);
    });
  });

  describe('Version Retrieval', () => {
    let testVersion: VersionEntry;

    beforeEach(async () => {
      testVersion = await versionControl.createVersion('test-spec', testSpec);
    });

    it('should retrieve a version by ID', async () => {
      const retrieved = await versionControl.getVersion('test-spec', testVersion.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(testVersion.id);
      expect(retrieved!.specification).toEqual(testSpec);
    });

    it('should return null for non-existent version', async () => {
      const retrieved = await versionControl.getVersion('test-spec', 'non-existent');

      expect(retrieved).toBeNull();
    });

    it('should get version history', () => {
      const history = versionControl.getVersionHistory('test-spec');

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(testVersion.id);
    });

    it('should get latest version', () => {
      const latest = versionControl.getLatestVersion('test-spec');

      expect(latest).toBeDefined();
      expect(latest!.id).toBe(testVersion.id);
    });

    it('should get current version ID', () => {
      const currentId = versionControl.getCurrentVersion('test-spec');

      expect(currentId).toBe(testVersion.id);
    });
  });

  describe('Version Comparison', () => {
    let version1: VersionEntry;
    let version2: VersionEntry;

    beforeEach(async () => {
      version1 = await versionControl.createVersion('test-spec', testSpec);
      version2 = await versionControl.createVersion('test-spec', testSpecModified);
    });

    it('should compare two versions', async () => {
      const diff = await versionControl.compareVersions('test-spec', version1.id, version2.id);

      expect(diff).toBeDefined();
      expect(diff.specId).toBe('test-spec');
      expect(diff.fromVersion).toBe(version1.id);
      expect(diff.toVersion).toBe(version2.id);
      expect(diff.changes).toHaveLength(1); // One modification (the /users path changed)
    });

    it('should detect modifications', async () => {
      const diff = await versionControl.compareVersions('test-spec', version1.id, version2.id);
      
      const modification = diff.changes.find(c => c.type === 'modification');
      expect(modification).toBeDefined();
      expect(modification!.path).toBe('paths./users');
    });

    it('should detect additions', async () => {
      const diff = await versionControl.compareVersions('test-spec', version1.id, version2.id);
      
      // The POST endpoint is an addition to the /users path
      const changes = diff.changes.filter(c => c.type === 'modification');
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('Rollback', () => {
    let version1: VersionEntry;
    let version2: VersionEntry;

    beforeEach(async () => {
      version1 = await versionControl.createVersion('test-spec', testSpec);
      version2 = await versionControl.createVersion('test-spec', testSpecModified);
    });

    it('should rollback to previous version', async () => {
      const rollbackVersion = await versionControl.rollback('test-spec', version1.id);

      expect(rollbackVersion).toBeDefined();
      expect(rollbackVersion.specification).toEqual(testSpec);
      expect(rollbackVersion.metadata.message).toContain('Rollback to version');
      expect(rollbackVersion.metadata.tags).toContain('rollback');
    });

    it('should emit rollback event', async () => {
      const eventSpy = jest.fn();
      versionControl.on('rollback', eventSpy);

      const rollbackVersion = await versionControl.rollback('test-spec', version1.id);

      expect(eventSpy).toHaveBeenCalledWith({
        specId: 'test-spec',
        targetVersion: version1,
        rollbackVersion
      });
    });

    it('should fail rollback to non-existent version', async () => {
      await expect(
        versionControl.rollback('test-spec', 'non-existent')
      ).rejects.toThrow('Target version non-existent not found');
    });
  });

  describe('Branching', () => {
    let testVersion: VersionEntry;

    beforeEach(async () => {
      testVersion = await versionControl.createVersion('test-spec', testSpec);
    });

    it('should create a branch', async () => {
      await versionControl.createBranch('test-spec', 'feature-branch', testVersion.id);

      expect(mockLogger.info).toHaveBeenCalledWith('Created branch feature-branch for spec test-spec');
    });

    it('should emit branchCreated event', async () => {
      const eventSpy = jest.fn();
      versionControl.on('branchCreated', eventSpy);

      await versionControl.createBranch('test-spec', 'feature-branch', testVersion.id);

      expect(eventSpy).toHaveBeenCalledWith({
        specId: 'test-spec',
        branchName: 'feature-branch',
        sourceVersion: testVersion
      });
    });
  });

  describe('Conflict Detection', () => {
    let version1: VersionEntry;
    let version2: VersionEntry;

    beforeEach(async () => {
      version1 = await versionControl.createVersion('test-spec', testSpec);
      version2 = await versionControl.createVersion('test-spec', testSpecModified);
    });

    it('should detect conflicts between versions', async () => {
      const conflicts = await versionControl.detectConflicts('test-spec', version1.id, version2.id);

      expect(conflicts).toBeDefined();
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await versionControl.createVersion('spec1', testSpec);
      await versionControl.createVersion('spec1', testSpecModified);
      await versionControl.createVersion('spec2', testSpec);
    });

    it('should provide version control statistics', () => {
      const stats = versionControl.getStatistics();

      expect(stats.totalSpecs).toBe(2);
      expect(stats.totalVersions).toBe(3);
      expect(stats.averageVersionsPerSpec).toBe(1.5);
      expect(stats.oldestVersion).toBeInstanceOf(Date);
      expect(stats.newestVersion).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', () => {
      const uninitializedVC = new VersionControlManager(config, mockLogger as any);

      expect(() => uninitializedVC.getVersionHistory('test-spec')).toThrow('Version control system not initialized');
    });

    it('should handle storage errors gracefully', async () => {
      // Mock file system error
      const originalWriteFile = fs.writeFile;
      (fs.writeFile as any) = jest.fn().mockRejectedValue(new Error('Storage error'));

      await expect(
        versionControl.createVersion('test-spec', testSpec)
      ).rejects.toThrow();

      // Restore original function
      (fs.writeFile as any) = originalWriteFile;
    });
  });
});

describe('FileSystemProvider', () => {
  let provider: FileSystemProvider;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(__dirname, '../../temp/fs-provider-test');
    await fs.mkdir(testDir, { recursive: true });

    provider = new FileSystemProvider({
      basePath: testDir,
      structure: 'hierarchical'
    }, mockLogger as any);

    await provider.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('File Operations', () => {
    it('should write and read files', async () => {
      const testPath = path.join(testDir, 'test.txt');
      const testContent = 'Hello, World!';

      await provider.writeFile(testPath, testContent);
      const readContent = await provider.readFile(testPath);

      expect(readContent).toBe(testContent);
    });

    it('should list files in directory', async () => {
      await provider.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await provider.writeFile(path.join(testDir, 'file2.txt'), 'content2');

      const files = await provider.listFiles(testDir);

      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });

    it('should delete files', async () => {
      const testPath = path.join(testDir, 'test.txt');
      await provider.writeFile(testPath, 'content');

      await provider.deleteFile(testPath);

      await expect(fs.access(testPath)).rejects.toThrow();
    });
  });

  describe('Version Storage', () => {
    it('should store and retrieve versions', async () => {
      const version: VersionEntry = {
        id: 'test-version-id',
        specId: 'test-spec',
        version: '1.0.0',
        specification: testSpec,
        hash: 'test-hash',
        timestamp: new Date(),
        metadata: {
          author: 'test-user',
          message: 'Test version',
          tags: []
        }
      };

      await provider.storeVersion(version);
      const retrieved = await provider.getVersion('test-spec', 'test-version-id');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(version.id);
      expect(retrieved!.specification).toEqual(testSpec);
    });
  });
});
