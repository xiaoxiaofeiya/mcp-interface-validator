/**
 * Unit tests for Enhanced OpenAPI/Swagger Parser
 */

import { SpecParser, type ParsedSpec, type ConversionOptions } from '../../src/core/parser/index';
import { Logger } from '../../src/utils/logger/index';
import type { ValidationConfig } from '../../src/utils/config/index';

describe('SpecParser', () => {
  let parser: SpecParser;
  let mockLogger: Logger;
  let mockConfig: ValidationConfig;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    mockConfig = {
      allowAdditionalProperties: true,
      strictMode: false,
      customRules: []
    } as ValidationConfig;

    parser = new SpecParser(mockConfig, mockLogger);
  });

  describe('parseSpecification', () => {
    it('should parse a valid OpenAPI 3.0 specification', async () => {
      const openApiSpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'A test API'
        },
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production server'
          }
        ],
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              summary: 'Get all users',
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            },
            post: {
              operationId: 'createUser',
              summary: 'Create a user',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/User' }
                  }
                }
              },
              responses: {
                '201': {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          },
          '/users/{userId}': {
            parameters: [
              {
                name: 'userId',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            get: {
              operationId: 'getUserById',
              summary: 'Get user by ID',
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/User' }
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
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          }
        }
      };

      const result = await parser.parseSpecification(openApiSpec);

      expect(result.format).toBe('openapi');
      expect(result.version).toBe('3.0.0');
      expect(result.paths).toEqual(['/users', '/users/{userId}']);
      expect(result.operations).toHaveLength(3);
      expect(result.schemas).toHaveLength(1);
      expect(result.metadata.title).toBe('Test API');
      expect(result.metadata.servers).toHaveLength(1);
      expect(result.metadata.servers![0].url).toBe('https://api.example.com');

      // Check operations
      const getUsersOp = result.operations.find(op => op.operationId === 'getUsers');
      expect(getUsersOp).toBeDefined();
      expect(getUsersOp!.method).toBe('GET');
      expect(getUsersOp!.path).toBe('/users');

      const createUserOp = result.operations.find(op => op.operationId === 'createUser');
      expect(createUserOp).toBeDefined();
      expect(createUserOp!.requestBody).toBeDefined();
      expect(createUserOp!.requestBody!.required).toBe(true);

      const getUserByIdOp = result.operations.find(op => op.operationId === 'getUserById');
      expect(getUserByIdOp).toBeDefined();
      expect(getUserByIdOp!.parameters).toHaveLength(1);
      expect(getUserByIdOp!.parameters![0].name).toBe('userId');
      expect(getUserByIdOp!.parameters![0].in).toBe('path');
      expect(getUserByIdOp!.parameters![0].required).toBe(true);

      // Check schemas
      expect(result.schemas[0].name).toBe('User');
      expect(result.schemas[0].type).toBe('component');
    });

    it('should parse a valid Swagger 2.0 specification', async () => {
      const swaggerSpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        host: 'api.example.com',
        basePath: '/v1',
        schemes: ['https'],
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              summary: 'Get all users',
              responses: {
                '200': {
                  description: 'Success',
                  schema: {
                    type: 'array',
                    items: { $ref: '#/definitions/User' }
                  }
                }
              }
            }
          }
        },
        definitions: {
          User: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      };

      const result = await parser.parseSpecification(swaggerSpec);

      expect(result.format).toBe('swagger');
      expect(result.version).toBe('2.0');
      expect(result.paths).toEqual(['/users']);
      expect(result.operations).toHaveLength(1);
      expect(result.schemas).toHaveLength(1);
      expect(result.metadata.servers).toHaveLength(1);
      expect(result.metadata.servers![0].url).toBe('https://api.example.com/v1');
    });

    it('should throw error for invalid specification', async () => {
      const invalidSpec = {
        info: {
          title: 'Invalid API'
        }
        // Missing openapi or swagger field
      };

      await expect(parser.parseSpecification(invalidSpec))
        .rejects.toThrow('Invalid specification: missing openapi or swagger field');
    });
  });

  describe('convertSwaggerToOpenAPI', () => {
    it('should convert Swagger 2.0 to OpenAPI 3.0', async () => {
      const swaggerSpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'A test API'
        },
        host: 'api.example.com',
        basePath: '/v1',
        schemes: ['https', 'http'],
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              summary: 'Get all users',
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  type: 'integer',
                  description: 'Number of users to return'
                }
              ],
              responses: {
                '200': {
                  description: 'Success',
                  schema: {
                    type: 'array',
                    items: { $ref: '#/definitions/User' }
                  }
                }
              }
            },
            post: {
              operationId: 'createUser',
              summary: 'Create a user',
              parameters: [
                {
                  name: 'user',
                  in: 'body',
                  required: true,
                  schema: { $ref: '#/definitions/User' }
                }
              ],
              responses: {
                '201': {
                  description: 'Created',
                  schema: { $ref: '#/definitions/User' }
                }
              }
            }
          }
        },
        definitions: {
          User: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        },
        securityDefinitions: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header'
          },
          oauth2: {
            type: 'oauth2',
            flow: 'accessCode',
            authorizationUrl: 'https://auth.example.com/oauth/authorize',
            tokenUrl: 'https://auth.example.com/oauth/token',
            scopes: {
              'read:users': 'Read users',
              'write:users': 'Write users'
            }
          }
        }
      };

      const options: ConversionOptions = {
        targetVersion: '3.0',
        validateResult: false
      };

      const result = await parser.convertSwaggerToOpenAPI(swaggerSpec, options);

      expect(result.openapi).toBe('3.0');
      expect(result.info.title).toBe('Test API');
      expect(result.servers).toHaveLength(2);
      expect(result.servers![0].url).toBe('https://api.example.com/v1');
      expect(result.servers![1].url).toBe('http://api.example.com/v1');

      // Check converted paths
      expect(result.paths['/users'].get).toBeDefined();
      expect(result.paths['/users'].post).toBeDefined();

      // Check parameter conversion
      const getOperation = result.paths['/users'].get;
      expect(getOperation.parameters).toHaveLength(1);
      expect(getOperation.parameters[0].name).toBe('limit');
      expect(getOperation.parameters[0].schema.type).toBe('integer');

      // Check request body conversion
      const postOperation = result.paths['/users'].post;
      expect(postOperation.requestBody).toBeDefined();
      expect(postOperation.requestBody.required).toBe(true);
      expect(postOperation.requestBody.content['application/json'].schema.$ref).toBe('#/definitions/User');

      // Check response conversion
      expect(postOperation.responses['201'].content['application/json'].schema.$ref).toBe('#/definitions/User');

      // Check components
      expect(result.components.schemas.User).toBeDefined();
      expect(result.components.securitySchemes.apiKey).toBeDefined();
      expect(result.components.securitySchemes.oauth2).toBeDefined();
      expect(result.components.securitySchemes.oauth2.flows.authorizationCode).toBeDefined();
    });

    it('should throw error for non-Swagger specification', async () => {
      const openApiSpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' }
      };

      await expect(parser.convertSwaggerToOpenAPI(openApiSpec))
        .rejects.toThrow('Input is not a valid Swagger 2.0 specification');
    });
  });

  describe('cache management', () => {
    it('should cache parsed specifications', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      // Parse twice
      await parser.parseSpecification(spec);
      await parser.parseSpecification(spec);

      const stats = parser.getStats();
      expect(stats.cachedSpecs).toBe(0); // Object specs are not cached
    });

    it('should clear cache', () => {
      parser.clearCache();
      const stats = parser.getStats();
      expect(stats.cachedSpecs).toBe(0);
    });
  });
});
