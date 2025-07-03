/**
 * Unit tests for Windsurf Tool Adapter
 */

import { WindsurfAdapter, WindsurfAdapterConfig, WindsurfContextData } from '../../src/adapters/windsurf';
import { ValidationEngine } from '../../src/core/validation';
import { ContextEnhancer } from '../../src/core/context';
import { SpecParser } from '../../src/core/parser';

// Mock the core modules
jest.mock('../../src/core/validation');
jest.mock('../../src/core/context');
jest.mock('../../src/core/parser');
jest.mock('../../src/utils/logger');

describe('WindsurfAdapter', () => {
  let adapter: WindsurfAdapter;
  let mockConfig: WindsurfAdapterConfig;
  let mockValidationEngine: jest.Mocked<ValidationEngine>;
  let mockContextEnhancer: jest.Mocked<ContextEnhancer>;
  let mockSpecParser: jest.Mocked<SpecParser>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Create mock config
    mockConfig = {
      enableRealTimeValidation: true,
      contextInjectionMode: 'auto',
      validationTriggers: ['save', 'change'],
      apiEndpoint: 'https://api.windsurf.com',
      serviceKey: 'test-service-key',
      workspaceRoot: '/test/workspace',
      mcpServerConfig: {
        servers: {
          github: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'test-token' }
          }
        }
      }
    };

    // Setup mocks for core modules
    const MockedValidationEngine = ValidationEngine as jest.MockedClass<typeof ValidationEngine>;
    const MockedContextEnhancer = ContextEnhancer as jest.MockedClass<typeof ContextEnhancer>;
    const MockedSpecParser = SpecParser as jest.MockedClass<typeof SpecParser>;

    mockValidationEngine = new MockedValidationEngine() as jest.Mocked<ValidationEngine>;
    mockContextEnhancer = new MockedContextEnhancer() as jest.Mocked<ContextEnhancer>;
    mockSpecParser = new MockedSpecParser() as jest.Mocked<SpecParser>;

    // Mock the initialize methods
    mockValidationEngine.initialize = jest.fn().mockResolvedValue(undefined);
    mockContextEnhancer.initialize = jest.fn().mockResolvedValue(undefined);

    // Mock the parseSpec method
    mockSpecParser.parseSpec = jest.fn();

    // Mock the validateInterface method
    mockValidationEngine.validateInterface = jest.fn();

    // Create adapter instance with mocked dependencies
    adapter = new WindsurfAdapter(mockConfig, mockValidationEngine, mockContextEnhancer, mockSpecParser);
  });

  afterEach(() => {
    jest.useRealTimers();
    adapter.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const initSpy = jest.fn();
      adapter.on('initialized', initSpy);

      await adapter.initialize();

      expect(mockValidationEngine.initialize).toHaveBeenCalled();
      expect(mockContextEnhancer.initialize).toHaveBeenCalled();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should setup MCP servers when configured', async () => {
      await adapter.initialize();

      const stats = adapter.getStatistics();
      expect(stats.mcpServersCount).toBe(1);
      expect(stats.mcpServers).toContain('github');
    });

    it('should setup real-time monitoring when enabled', async () => {
      const monitoringSpy = jest.fn();
      adapter.on('monitoring', monitoringSpy);

      await adapter.initialize();

      // Fast-forward time to trigger monitoring
      jest.advanceTimersByTime(6000);

      expect(monitoringSpy).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockValidationEngine.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(adapter.initialize()).rejects.toThrow('Init failed');
    });

    it('should not setup MCP servers when not configured', async () => {
      const configWithoutMCP = { ...mockConfig };
      delete configWithoutMCP.mcpServerConfig;

      const mockValidationEngineLocal = new ValidationEngine() as jest.Mocked<ValidationEngine>;
      const mockContextEnhancerLocal = new ContextEnhancer() as jest.Mocked<ContextEnhancer>;
      const mockSpecParserLocal = new SpecParser() as jest.Mocked<SpecParser>;

      mockValidationEngineLocal.initialize = jest.fn().mockResolvedValue(undefined);
      mockContextEnhancerLocal.initialize = jest.fn().mockResolvedValue(undefined);

      const adapterWithoutMCP = new WindsurfAdapter(configWithoutMCP, mockValidationEngineLocal, mockContextEnhancerLocal, mockSpecParserLocal);
      await adapterWithoutMCP.initialize();

      const stats = adapterWithoutMCP.getStatistics();
      expect(stats.mcpServersCount).toBe(0);

      adapterWithoutMCP.dispose();
    });
  });

  describe('Document Validation', () => {
    const mockContextData: WindsurfContextData = {
      documentPath: '/test/api.yaml',
      content: `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        '200':
          description: Success
      `,
      language: 'yaml',
      projectInfo: {
        name: 'test-project',
        version: '1.0.0',
        type: 'api'
      },
      ideInfo: {
        type: 'vscode',
        version: '1.89.0'
      }
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should validate API specification documents successfully', async () => {
      // Mock successful parsing
      mockSpecParser.parseSpec.mockResolvedValue({
        success: true,
        spec: { openapi: '3.0.0', info: { title: 'Test API' } },
        errors: []
      });

      // Mock successful validation
      mockValidationEngine.validateInterface.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      const result = await adapter.validateDocument(mockContextData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.model).toBe('windsurf-validator');
      expect(result.metadata?.tokensUsed).toBeGreaterThan(0);
    });

    it('should handle validation errors properly', async () => {
      // Mock parsing failure
      mockSpecParser.parseSpec.mockResolvedValue({
        success: false,
        spec: null,
        errors: ['Invalid YAML syntax']
      });

      const result = await adapter.validateDocument(mockContextData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to parse API specification');
    });

    it('should cache validation results', async () => {
      mockSpecParser.parseSpec.mockResolvedValue({
        success: true,
        spec: { openapi: '3.0.0' },
        errors: []
      });

      mockValidationEngine.validateInterface.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      // First validation
      const result1 = await adapter.validateDocument(mockContextData);
      
      // Second validation with same content
      const result2 = await adapter.validateDocument(mockContextData);

      expect(mockSpecParser.parseSpec).toHaveBeenCalledTimes(1);
      expect(result1.timestamp).toBe(result2.timestamp);
    });

    it('should emit validation events', async () => {
      const validationSpy = jest.fn();
      adapter.on('validationResult', validationSpy);

      mockSpecParser.parseSpec.mockResolvedValue({
        success: true,
        spec: { openapi: '3.0.0' },
        errors: []
      });

      mockValidationEngine.validateInterface.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      await adapter.validateDocument(mockContextData);

      expect(validationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: true,
          errors: [],
          warnings: []
        })
      );
    });

    it('should handle non-API documents', async () => {
      const nonApiContext = {
        ...mockContextData,
        content: 'console.log("Hello World");',
        language: 'javascript'
      };

      const result = await adapter.validateDocument(nonApiContext);

      expect(result.isValid).toBe(true);
      expect(mockSpecParser.parseSpec).not.toHaveBeenCalled();
    });

    it('should handle validation exceptions', async () => {
      mockSpecParser.parseSpec.mockRejectedValue(new Error('Parser error'));

      const result = await adapter.validateDocument(mockContextData);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Validation error: Parser error');
    });
  });

  describe('Context Injection', () => {
    const mockContextData: WindsurfContextData = {
      documentPath: '/test/component.tsx',
      content: 'export const Component = () => <div>Hello</div>;',
      language: 'typescript',
      ideInfo: {
        type: 'vscode',
        version: '1.89.0'
      }
    };

    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should inject context successfully', async () => {
      const contextSpy = jest.fn();
      adapter.on('contextInjected', contextSpy);

      await adapter.injectContext(mockContextData);

      expect(contextSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contextData: mockContextData,
          context: expect.objectContaining({
            id: expect.stringMatching(/^windsurf-context-\d+$/),
            type: 'api-validation',
            language: 'typescript',
            ideType: 'vscode'
          })
        })
      );
    });

    it('should handle context injection errors', async () => {
      // Force an error by making the adapter inactive
      adapter.dispose();

      await expect(adapter.injectContext(mockContextData)).rejects.toThrow();
    });
  });

  describe('Analytics Queries', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should query analytics successfully', async () => {
      const analyticsSpy = jest.fn();
      adapter.on('analyticsQueried', analyticsSpy);

      const result = await adapter.queryAnalytics(
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        { groupName: 'test-group' }
      );

      expect(result).toHaveProperty('cascade_lines');
      expect(result).toHaveProperty('cascade_runs');
      expect(result).toHaveProperty('tool_usage');
      expect(analyticsSpy).toHaveBeenCalledWith(result);
    });

    it('should require service key and API endpoint for analytics', async () => {
      const configWithoutAuth = { ...mockConfig };
      delete configWithoutAuth.serviceKey;
      delete configWithoutAuth.apiEndpoint;

      const mockValidationEngineLocal = new ValidationEngine() as jest.Mocked<ValidationEngine>;
      const mockContextEnhancerLocal = new ContextEnhancer() as jest.Mocked<ContextEnhancer>;
      const mockSpecParserLocal = new SpecParser() as jest.Mocked<SpecParser>;

      mockValidationEngineLocal.initialize = jest.fn().mockResolvedValue(undefined);
      mockContextEnhancerLocal.initialize = jest.fn().mockResolvedValue(undefined);

      const adapterWithoutAuth = new WindsurfAdapter(configWithoutAuth, mockValidationEngineLocal, mockContextEnhancerLocal, mockSpecParserLocal);
      await adapterWithoutAuth.initialize();

      await expect(
        adapterWithoutAuth.queryAnalytics('2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z')
      ).rejects.toThrow('Service key and API endpoint required');

      adapterWithoutAuth.dispose();
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should clear validation cache', async () => {
      // Add something to cache first
      const mockContextData: WindsurfContextData = {
        documentPath: '/test/api.yaml',
        content: `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        '200':
          description: Success
        `,
        language: 'yaml'
      };

      mockSpecParser.parseSpec.mockResolvedValue({
        success: true,
        spec: { openapi: '3.0.0' },
        errors: []
      });

      mockValidationEngine.validateInterface.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      await adapter.validateDocument(mockContextData);

      let stats = adapter.getStatistics();
      expect(stats.cacheSize).toBeGreaterThan(0);

      adapter.clearValidationCache();

      stats = adapter.getStatistics();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate statistics', async () => {
      await adapter.initialize();

      const stats = adapter.getStatistics();

      expect(stats).toHaveProperty('isActive', true);
      expect(stats).toHaveProperty('cacheSize', 0);
      expect(stats).toHaveProperty('mcpServersCount', 1);
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('mcpServers');
      expect(stats.mcpServers).toContain('github');
    });

    it('should show inactive status after disposal', () => {
      adapter.dispose();

      const stats = adapter.getStatistics();
      expect(stats.isActive).toBe(false);
      expect(stats.cacheSize).toBe(0);
      expect(stats.mcpServersCount).toBe(0);
    });
  });

  describe('Configuration Handling', () => {
    it('should handle minimal configuration', async () => {
      const minimalConfig: WindsurfAdapterConfig = {
        enableRealTimeValidation: false,
        contextInjectionMode: 'disabled',
        validationTriggers: []
      };

      const mockValidationEngineLocal = new ValidationEngine() as jest.Mocked<ValidationEngine>;
      const mockContextEnhancerLocal = new ContextEnhancer() as jest.Mocked<ContextEnhancer>;
      const mockSpecParserLocal = new SpecParser() as jest.Mocked<SpecParser>;

      mockValidationEngineLocal.initialize = jest.fn().mockResolvedValue(undefined);
      mockContextEnhancerLocal.initialize = jest.fn().mockResolvedValue(undefined);

      const minimalAdapter = new WindsurfAdapter(minimalConfig, mockValidationEngineLocal, mockContextEnhancerLocal, mockSpecParserLocal);
      await minimalAdapter.initialize();

      const stats = minimalAdapter.getStatistics();
      expect(stats.config.enableRealTimeValidation).toBe(false);
      expect(stats.config.contextInjectionMode).toBe('disabled');
      expect(stats.mcpServersCount).toBe(0);

      minimalAdapter.dispose();
    });

    it('should handle complex MCP server configurations', async () => {
      const complexConfig = {
        ...mockConfig,
        mcpServerConfig: {
          servers: {
            github: {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-github'],
              env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'token1' }
            },
            filesystem: {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
              env: { NODE_ENV: 'development' }
            }
          }
        }
      };

      const mockValidationEngineLocal = new ValidationEngine() as jest.Mocked<ValidationEngine>;
      const mockContextEnhancerLocal = new ContextEnhancer() as jest.Mocked<ContextEnhancer>;
      const mockSpecParserLocal = new SpecParser() as jest.Mocked<SpecParser>;

      mockValidationEngineLocal.initialize = jest.fn().mockResolvedValue(undefined);
      mockContextEnhancerLocal.initialize = jest.fn().mockResolvedValue(undefined);

      const complexAdapter = new WindsurfAdapter(complexConfig, mockValidationEngineLocal, mockContextEnhancerLocal, mockSpecParserLocal);
      await complexAdapter.initialize();

      const stats = complexAdapter.getStatistics();
      expect(stats.mcpServersCount).toBe(2);
      expect(stats.mcpServers).toContain('github');
      expect(stats.mcpServers).toContain('filesystem');

      complexAdapter.dispose();
    });
  });
});
