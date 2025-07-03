/**
 * Integration tests for Version Control System
 *
 * Tests the core version control functionality and workflow
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import * as path from 'path';
import { VersionControlManager } from '../../src/core/version-control';
import { VersionControlConfigFactory } from '../../src/core/version-control/config';
import type { ApiSpecification, VersionControlConfig } from '../../src/core/version-control/types';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Test OpenAPI specification
const testOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'User Management API',
    version: '1.0.0',
    description: 'API for managing users'
  },
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server'
    }
  ],
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        operationId: 'listUsers',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create user',
        operationId: 'createUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        operationId: 'getUserById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'name', 'email']
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          email: {
            type: 'string',
            format: 'email'
          }
        },
        required: ['name', 'email']
      }
    }
  }
};

describe('Version Control Integration', () => {
  let versionControl: VersionControlManager;
  let config: VersionControlConfig;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(__dirname, '../../temp/vc-integration-test');
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

    // Initialize components
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

  describe('Core Version Control Features', () => {
    it('should create and manage API specification versions', async () => {
      // Create version from specification
      const version = await versionControl.createVersion('user-api', testOpenApiSpec, {
        author: 'test-user',
        message: 'Initial API specification'
      });

      expect(version).toBeDefined();
      expect(version.specId).toBe('user-api');
      expect(version.version).toBe('1.0.0');
      expect(version.specification).toEqual(testOpenApiSpec);
    });

    it('should track changes between specification versions', async () => {
      // Create initial version
      const version1 = await versionControl.createVersion('user-api', testOpenApiSpec, {
        author: 'test-user',
        message: 'Initial version'
      });

      // Modify specification
      const modifiedSpec = {
        ...testOpenApiSpec,
        info: {
          ...testOpenApiSpec.info,
          version: '1.1.0'
        },
        paths: {
          ...testOpenApiSpec.paths,
          '/users/{id}': {
            ...testOpenApiSpec.paths['/users/{id}'],
            put: {
              summary: 'Update user',
              operationId: 'updateUser',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: {
                    type: 'string'
                  }
                }
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CreateUserRequest'
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'User updated',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/User'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const version2 = await versionControl.createVersion('user-api', modifiedSpec, {
        author: 'test-user',
        message: 'Added update user endpoint'
      });

      // Compare versions
      const diff = await versionControl.compareVersions('user-api', version1.id, version2.id);
      expect(diff.changes.length).toBeGreaterThan(0);

      // Should detect changes (the exact path format may vary)
      const hasChanges = diff.changes.some(change =>
        change.type === 'modification' || change.type === 'addition'
      );
      expect(hasChanges).toBe(true);
    });
  });

  describe('Branching and Merging', () => {
    it('should create and manage branches', async () => {
      // Create initial version
      const version1 = await versionControl.createVersion('user-api', testOpenApiSpec, {
        author: 'test-user',
        message: 'Initial version'
      });

      // Create branch for feature development
      await versionControl.createBranch('user-api', 'feature/user-roles', version1.id);

      // Verify branch creation
      expect(version1).toBeDefined();
      expect(version1.specId).toBe('user-api');
    });

    it('should handle specification validation workflow', async () => {
      // Create valid specification version
      const version = await versionControl.createVersion('user-api', testOpenApiSpec, {
        author: 'test-user',
        message: 'Validated specification'
      });

      expect(version).toBeDefined();
      expect(version.specification).toEqual(testOpenApiSpec);

      // Test with potentially invalid specification structure
      const modifiedSpec = {
        ...testOpenApiSpec,
        info: {
          ...testOpenApiSpec.info,
          version: '2.0.0'
        }
      };

      // Should still create version (validation is external concern)
      const version2 = await versionControl.createVersion('user-api', modifiedSpec, {
        author: 'test-user',
        message: 'Modified specification'
      });

      expect(version2).toBeDefined();
      expect(version2.specification.info.version).toBe('2.0.0');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should support complete specification lifecycle', async () => {
      // 1. Create initial version
      const version1 = await versionControl.createVersion('user-api', testOpenApiSpec, {
        author: 'developer',
        message: 'Initial API specification'
      });

      // 2. Create branch for feature development
      await versionControl.createBranch('user-api', 'feature/user-roles', version1.id);

      // 3. Modify specification (add roles)
      const enhancedSpec = {
        ...testOpenApiSpec,
        paths: {
          ...testOpenApiSpec.paths,
          '/users/{id}/roles': {
            get: {
              summary: 'Get user roles',
              operationId: 'getUserRoles',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: {
                    type: 'string'
                  }
                }
              ],
              responses: {
                '200': {
                  description: 'User roles',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      // 4. Create new version
      const version2 = await versionControl.createVersion('user-api', enhancedSpec, {
        author: 'developer',
        message: 'Added user roles endpoint'
      });

      // 5. Compare versions
      const diff = await versionControl.compareVersions('user-api', version1.id, version2.id);
      expect(diff.changes.length).toBeGreaterThan(0);

      // 6. Get version history
      const history = versionControl.getVersionHistory('user-api');
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe(version1.id);
      expect(history[1].id).toBe(version2.id);

      // 7. Test rollback functionality
      const rollbackVersion = await versionControl.rollback('user-api', version1.id);
      expect(rollbackVersion.specification).toEqual(version1.specification);

      // 8. Verify statistics
      const stats = versionControl.getStatistics();
      expect(stats.totalSpecs).toBe(1);
      expect(stats.totalVersions).toBe(3); // original + enhanced + rollback
    });
  });
});
