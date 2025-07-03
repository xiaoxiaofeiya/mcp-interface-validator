/**
 * Unit tests for Context Enhancer
 */

import { ContextEnhancer, ContextData, ContextOptions, ContextTemplate } from '../../src/core/context/index';
import { Logger } from '../../src/utils/logger/index';
import { ValidationConfig } from '../../src/utils/config/index';
import { ParsedSpec } from '../../src/core/parser/index';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync } from 'fs';

describe('ContextEnhancer', () => {
  let contextEnhancer: ContextEnhancer;
  let logger: Logger;
  let config: ValidationConfig;
  let tempDir: string;

  const mockParsedSpec: ParsedSpec = {
    version: '3.0.0',
    format: 'openapi',
    metadata: {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API Description'
    },
    operations: [
      {
        operationId: 'getUsers',
        method: 'GET',
        path: '/users',
        summary: 'Get all users',
        parameters: [],
        responses: {},
        tags: ['users']
      }
    ],
    schemas: [
      {
        name: 'User',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        },
        required: ['id', 'name']
      }
    ],
    paths: ['/users'],
    tags: ['users'],
    servers: [{ url: 'https://api.example.com' }]
  };

  const mockContextData: ContextData = {
    spec: mockParsedSpec,
    projectInfo: {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project',
      rootPath: '/test/project'
    },
    techStack: {
      frontend: {
        name: 'react',
        version: '18.0.0',
        features: ['hooks', 'typescript']
      },
      backend: {
        name: 'express',
        version: '4.18.0',
        features: ['typescript', 'cors']
      },
      database: {
        type: 'postgresql',
        version: '14.0'
      }
    }
  };

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = join(tmpdir(), 'context-enhancer-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });

    logger = new Logger({ level: 'error' }); // Suppress logs during tests
    config = {
      specPath: '',
      outputPath: '',
      watchMode: false,
      strictMode: true,
      customRules: [],
      integrations: {
        cursor: { enabled: false },
        windsurf: { enabled: false },
        augment: { enabled: false },
        trae: { enabled: false }
      }
    };

    contextEnhancer = new ContextEnhancer(config, logger, tempDir);
    await contextEnhancer.initialize();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const stats = contextEnhancer.getStats();
      expect(stats.templatesLoaded).toBeGreaterThan(0);
      expect(stats.templatesPath).toBe(tempDir);
    });

    it('should load built-in templates', async () => {
      const templates = contextEnhancer.getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const typescriptTemplate = templates.find(t => t.id === 'openapi-typescript');
      expect(typescriptTemplate).toBeDefined();
      expect(typescriptTemplate?.techStack).toContain('typescript');
    });
  });

  describe('template management', () => {
    it('should get templates for specific tech stack', () => {
      const reactTemplates = contextEnhancer.getTemplatesForTechStack(['react', 'typescript']);
      expect(reactTemplates.length).toBeGreaterThan(0);
      
      const typescriptTemplate = reactTemplates.find(t => t.id === 'openapi-typescript');
      expect(typescriptTemplate).toBeDefined();
    });

    it('should register custom template', () => {
      const customTemplate: ContextTemplate = {
        id: 'custom-test',
        name: 'Custom Test Template',
        description: 'Test template',
        techStack: ['test'],
        template: 'Test template content: {{testVar}}',
        variables: [
          { name: 'testVar', type: 'string', description: 'Test variable', required: true }
        ],
        outputFormat: 'text'
      };

      contextEnhancer.registerTemplate(customTemplate);
      
      const templates = contextEnhancer.getAvailableTemplates();
      const registeredTemplate = templates.find(t => t.id === 'custom-test');
      expect(registeredTemplate).toBeDefined();
      expect(registeredTemplate?.name).toBe('Custom Test Template');
    });
  });

  describe('context generation', () => {
    it('should generate context with default template', async () => {
      const context = await contextEnhancer.generateContext(mockContextData);
      
      expect(context).toBeDefined();
      expect(context.id).toBeTruthy();
      expect(context.content).toBeTruthy();
      expect(context.metadata.specVersion).toBe('3.0.0');
      expect(context.metadata.techStack).toContain('react');
      expect(context.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate context with specific template', async () => {
      const options: ContextOptions = {
        templateId: 'openapi-typescript',
        variables: {
          clientName: 'TestApiClient',
          baseUrl: 'https://test.api.com'
        }
      };

      const context = await contextEnhancer.generateContext(mockContextData, options);
      
      expect(context.templateId).toBe('openapi-typescript');
      expect(context.content).toContain('TestApiClient');
      expect(context.content).toContain('https://test.api.com');
      expect(context.content).toContain('Test API');
    });

    it('should generate context with custom variables', async () => {
      const options: ContextOptions = {
        templateId: 'openapi-python',
        variables: {
          packageName: 'test_api_client',
          className: 'TestClient',
          asyncSupport: true
        }
      };

      const context = await contextEnhancer.generateContext(mockContextData, options);
      
      expect(context.content).toContain('test_api_client');
      expect(context.content).toContain('TestClient');
      expect(context.content).toContain('async def main');
    });

    it('should handle missing template gracefully', async () => {
      const options: ContextOptions = {
        templateId: 'non-existent-template'
      };

      await expect(
        contextEnhancer.generateContext(mockContextData, options)
      ).rejects.toThrow('Template not found: non-existent-template');
    });

    it('should auto-select template based on tech stack', async () => {
      const javaContextData: ContextData = {
        ...mockContextData,
        techStack: {
          backend: {
            name: 'spring',
            version: '5.0.0'
          }
        }
      };

      const context = await contextEnhancer.generateContext(javaContextData);
      expect(context.templateId).toBe('openapi-java');
    });
  });

  describe('context updates', () => {
    it('should update existing context', async () => {
      // Generate initial context
      const initialContext = await contextEnhancer.generateContext(mockContextData);
      
      // Update with new data
      const newData: Partial<ContextData> = {
        spec: {
          ...mockContextData.spec,
          version: '3.1.0'
        },
        projectInfo: {
          ...mockContextData.projectInfo,
          version: '2.0.0'
        }
      };

      const updatedContext = await contextEnhancer.updateContext(
        initialContext.id,
        newData
      );

      expect(updatedContext.id).not.toBe(initialContext.id);
      expect(updatedContext.templateId).toBe(initialContext.templateId);
    });

    it('should handle update of non-existent context', async () => {
      await expect(
        contextEnhancer.updateContext('non-existent-id', {})
      ).rejects.toThrow('Context not found: non-existent-id');
    });
  });

  describe('caching', () => {
    it('should cache generated contexts', async () => {
      const context1 = await contextEnhancer.generateContext(mockContextData);

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const context2 = await contextEnhancer.generateContext({
        ...mockContextData,
        projectInfo: {
          ...mockContextData.projectInfo,
          name: 'different-project'
        }
      });

      const stats = contextEnhancer.getStats();
      expect(stats.cachedContexts).toBe(2);
    });

    it('should clear cache', async () => {
      await contextEnhancer.generateContext(mockContextData);
      
      let stats = contextEnhancer.getStats();
      expect(stats.cachedContexts).toBe(1);
      
      contextEnhancer.clearCache();
      
      stats = contextEnhancer.getStats();
      expect(stats.cachedContexts).toBe(0);
    });
  });

  describe('file operations', () => {
    it('should save context to file when output path specified', async () => {
      const outputPath = join(tempDir, 'test-context.md');
      const options: ContextOptions = {
        outputPath
      };

      await contextEnhancer.generateContext(mockContextData, options);
      
      expect(existsSync(outputPath)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle template rendering errors gracefully', async () => {
      const invalidTemplate: ContextTemplate = {
        id: 'invalid-template',
        name: 'Invalid Template',
        description: 'Template with invalid syntax',
        techStack: ['test'],
        template: 'Invalid template: {{unclosedVariable',
        variables: [],
        outputFormat: 'text'
      };

      contextEnhancer.registerTemplate(invalidTemplate);

      const options: ContextOptions = {
        templateId: 'invalid-template'
      };

      // Should not throw, but handle gracefully
      const context = await contextEnhancer.generateContext(mockContextData, options);
      expect(context).toBeDefined();
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', async () => {
      await contextEnhancer.generateContext(mockContextData);

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await contextEnhancer.generateContext({
        ...mockContextData,
        projectInfo: {
          ...mockContextData.projectInfo,
          name: 'stats-test-project'
        }
      });

      const stats = contextEnhancer.getStats();
      expect(stats.templatesLoaded).toBeGreaterThan(0);
      expect(stats.cachedContexts).toBe(2);
      expect(stats.templatesPath).toBe(tempDir);
    });
  });
});
