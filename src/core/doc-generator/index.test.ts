/**
 * Tests for API Documentation Generator
 */

import { DocumentationGenerator } from './index';
import { TemplateManager } from './template-manager';
import { CodeExampleGenerator } from './code-example-generator';
import type { DocumentationConfig, OperationData, CodeExampleConfig } from './types';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

// Mock the SpecParser and CodeParser
jest.mock('../parser/index', () => ({
  SpecParser: jest.fn().mockImplementation(() => ({
    parseSpecification: jest.fn().mockImplementation((specPath: string) => {
      if (specPath.includes('invalid-spec.json')) {
        throw new Error('Invalid specification format');
      }
      return Promise.resolve({
      spec: {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'A test API for documentation generation'
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              description: 'Retrieve a list of users',
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
            }
          }
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' }
              },
              required: ['id', 'name', 'email']
            }
          }
        }
      },
      version: '3.0.0',
      format: 'openapi',
      paths: ['/users'],
      operations: [{
        operationId: 'get_users',
        method: 'get',
        path: '/users',
        summary: 'Get users',
        description: 'Retrieve a list of users',
        tags: [],
        parameters: [],
        responses: [{
          statusCode: '200',
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
        }]
      }],
      schemas: [{
        name: 'User',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' }
          },
          required: ['id', 'name', 'email']
        },
        type: 'component',
        usageCount: 1
      }],
      metadata: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for documentation generation',
        servers: [],
        contact: undefined,
        license: undefined,
        externalDocs: undefined,
        tags: undefined
      }
      });
    })
  }))
}));

jest.mock('../code-parser/index', () => ({
  CodeParser: jest.fn().mockImplementation(() => ({
    parseFile: jest.fn().mockResolvedValue({
      language: 'typescript',
      classes: [],
      interfaces: [],
      functions: [],
      imports: [],
      exports: [],
      apiEndpoints: [{
        path: '/api/test',
        method: 'GET',
        handler: 'testHandler',
        parameters: [],
        responses: []
      }],
      metadata: {
        lineCount: 100,
        complexity: 5,
        dependencies: []
      }
    })
  }))
}));

describe('DocumentationGenerator', () => {
  let generator: DocumentationGenerator;
  let testOutputDir: string;

  beforeEach(() => {
    generator = new DocumentationGenerator();
    testOutputDir = join(__dirname, '__test_output__');

    // Clean up test output directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
    mkdirSync(testOutputDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test output directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('generateFromSpec', () => {
    it('should generate documentation from OpenAPI specification', async () => {
      // Create test OpenAPI spec
      const testSpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'A test API for documentation generation'
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              description: 'Retrieve a list of users',
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
            }
          }
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' }
              },
              required: ['id', 'name', 'email']
            }
          }
        }
      };

      const specPath = join(testOutputDir, 'test-spec.json');
      writeFileSync(specPath, JSON.stringify(testSpec, null, 2));

      const config: DocumentationConfig = {
        format: 'markdown',
        template: {
          engine: 'handlebars',
          builtinTemplate: 'default'
        },
        codeExamples: {
          languages: ['typescript', 'curl'],
          includeRequests: true,
          includeResponses: true,
          includeErrors: false,
          autoGenerate: true
        },
        interactive: {
          apiExplorer: false,
          tryItOut: false,
          schemaVisualization: false,
          codePlayground: false
        },
        output: {
          outputDir: testOutputDir,
          filenamePattern: 'api-docs',
          includeTableOfContents: true,
          includeSearch: false
        }
      };

      const result = await generator.generateFromSpec(specPath, config);

      expect(result).toBeDefined();
      expect(result.format).toBe('markdown');
      expect(result.content).toContain('Test API');
      expect(result.content).toContain('Get users');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('api-docs.md');
      expect(result.metadata.sourceSpec.title).toBe('Test API');
      expect(result.metadata.sourceSpec.operationCount).toBeGreaterThan(0);
    });

    it('should handle invalid specification gracefully', async () => {
      const invalidSpecPath = join(testOutputDir, 'invalid-spec.json');
      writeFileSync(invalidSpecPath, '{ invalid json }');

      const config: DocumentationConfig = {
        format: 'markdown',
        template: {
          engine: 'handlebars',
          builtinTemplate: 'default'
        },
        codeExamples: {
          languages: ['typescript'],
          includeRequests: true,
          includeResponses: true,
          includeErrors: false,
          autoGenerate: true
        },
        interactive: {
          apiExplorer: false,
          tryItOut: false,
          schemaVisualization: false,
          codePlayground: false
        },
        output: {
          outputDir: testOutputDir,
          filenamePattern: 'api-docs',
          includeTableOfContents: true,
          includeSearch: false
        }
      };

      await expect(generator.generateFromSpec(invalidSpecPath, config))
        .rejects.toThrow();
    });
  });

  describe('generateFromCode', () => {
    it('should generate documentation from code files', async () => {
      // Create test TypeScript file
      const testCode = `
        /**
         * User API endpoints
         */
        export class UserController {
          /**
           * Get all users
           */
          async getUsers(): Promise<User[]> {
            // Implementation
            return [];
          }

          /**
           * Create a new user
           */
          async createUser(user: CreateUserRequest): Promise<User> {
            // Implementation
            return {} as User;
          }
        }

        export interface User {
          id: number;
          name: string;
          email: string;
        }

        export interface CreateUserRequest {
          name: string;
          email: string;
        }
      `;

      const codePath = join(testOutputDir, 'user-controller.ts');
      writeFileSync(codePath, testCode);

      const config: DocumentationConfig = {
        format: 'markdown',
        template: {
          engine: 'handlebars',
          builtinTemplate: 'minimal'
        },
        codeExamples: {
          languages: ['typescript'],
          includeRequests: false,
          includeResponses: false,
          includeErrors: false,
          autoGenerate: false
        },
        interactive: {
          apiExplorer: false,
          tryItOut: false,
          schemaVisualization: false,
          codePlayground: false
        },
        output: {
          outputDir: testOutputDir,
          filenamePattern: 'code-docs',
          includeTableOfContents: true,
          includeSearch: false
        }
      };

      const result = await generator.generateFromCode([codePath], config);

      expect(result).toBeDefined();
      expect(result.format).toBe('markdown');
      expect(result.content).toContain('API Documentation');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('code-docs.md');
    });
  });
});

describe('TemplateManager', () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    templateManager = new TemplateManager();
  });

  describe('loadTemplate', () => {
    it('should load built-in default template', async () => {
      const config = {
        engine: 'handlebars' as const,
        builtinTemplate: 'default' as const
      };

      const template = await templateManager.loadTemplate(config);
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');
    });

    it('should load built-in minimal template', async () => {
      const config = {
        engine: 'handlebars' as const,
        builtinTemplate: 'minimal' as const
      };

      const template = await templateManager.loadTemplate(config);
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');
    });

    it('should load built-in api-reference template', async () => {
      const config = {
        engine: 'handlebars' as const,
        builtinTemplate: 'api-reference' as const
      };

      const template = await templateManager.loadTemplate(config);
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');
    });

    it('should cache compiled templates', async () => {
      const config = {
        engine: 'handlebars' as const,
        builtinTemplate: 'default' as const
      };

      const template1 = await templateManager.loadTemplate(config);
      const template2 = await templateManager.loadTemplate(config);
      
      expect(template1).toBe(template2);
    });

    it('should clear template cache', async () => {
      const config = {
        engine: 'handlebars' as const,
        builtinTemplate: 'default' as const
      };

      await templateManager.loadTemplate(config);
      templateManager.clearCache();
      
      // Should not throw
      await templateManager.loadTemplate(config);
    });
  });

  describe('renderTemplate', () => {
    it('should render template with data', async () => {
      const config = {
        engine: 'handlebars' as const,
        builtinTemplate: 'minimal' as const
      };

      const template = await templateManager.loadTemplate(config);
      
      const templateData = {
        spec: {
          info: {
            title: 'Test API',
            version: '1.0.0',
            description: 'Test description'
          }
        },
        operations: [],
        schemas: [],
        codeExamples: {},
        config: {} as any,
        metadata: {} as any,
        helpers: {} as any
      };

      const result = await templateManager.renderTemplate(template, templateData);
      
      expect(result).toContain('Test API');
      expect(result).toContain('1.0.0');
      expect(result).toContain('Test description');
    });
  });
});

describe('CodeExampleGenerator', () => {
  let generator: CodeExampleGenerator;

  beforeEach(() => {
    generator = new CodeExampleGenerator();
  });

  describe('generateExamples', () => {
    it('should generate code examples for operation', async () => {
      const operation: OperationData = {
        operationId: 'getUsers',
        method: 'get',
        path: '/users',
        summary: 'Get users',
        description: 'Retrieve a list of users',
        tags: ['users'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of users to return',
            required: false,
            schema: { type: 'integer' }
          }
        ],
        responses: [
          {
            statusCode: '200',
            description: 'Successful response',
            content: {
              'application/json': {
                mediaType: 'application/json',
                schema: {
                  type: 'array',
                  items: { type: 'object' }
                }
              }
            }
          }
        ],
        examples: []
      };

      const config: CodeExampleConfig = {
        languages: ['typescript', 'curl'],
        includeRequests: true,
        includeResponses: true,
        includeErrors: false,
        autoGenerate: true
      };

      const examples = await generator.generateExamples(operation, config);

      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      
      const tsExample = examples.find(ex => ex.language === 'typescript');
      expect(tsExample).toBeDefined();
      expect(tsExample?.code).toContain('fetch');
      
      const curlExample = examples.find(ex => ex.language === 'curl');
      expect(curlExample).toBeDefined();
      expect(curlExample?.code).toContain('curl');
    });

    it('should handle operations without parameters', async () => {
      const operation: OperationData = {
        operationId: 'getHealth',
        method: 'get',
        path: '/health',
        summary: 'Health check',
        tags: [],
        parameters: [],
        responses: [
          {
            statusCode: '200',
            description: 'OK'
          }
        ],
        examples: []
      };

      const config: CodeExampleConfig = {
        languages: ['typescript'],
        includeRequests: true,
        includeResponses: false,
        includeErrors: false,
        autoGenerate: true
      };

      const examples = await generator.generateExamples(operation, config);

      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].code).toContain('/health');
    });
  });
});
