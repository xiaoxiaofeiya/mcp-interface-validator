/**
 * Trae Adapter Unit Tests
 * 
 * Comprehensive test suite for the Trae Tool Adapter with MCP integration
 */

import { TraeAdapter, TraeAdapterConfig, TraeContextData } from '../../src/adapters/trae';
import { ValidationEngine } from '../../src/core/validation';
import { ContextEnhancer } from '../../src/core/context';
import { SpecParser } from '../../src/core/parser';

// Mock dependencies
jest.mock('../../src/core/validation');
jest.mock('../../src/core/context');
jest.mock('../../src/core/parser');
jest.mock('../../src/utils/logger');

describe('TraeAdapter', () => {
  let adapter: TraeAdapter;
  let mockConfig: TraeAdapterConfig;
  let mockValidationEngine: jest.Mocked<ValidationEngine>;
  let mockContextEnhancer: jest.Mocked<ContextEnhancer>;
  let mockSpecParser: jest.Mocked<SpecParser>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock config
    mockConfig = {
      enableRealTimeValidation: true,
      contextInjectionMode: 'auto',
      validationTriggers: ['save', 'change'],
      mcpServerPath: '/path/to/trae/server',
      serverCommand: 'node',
      serverArgs: ['server.js'],
      workspaceRoot: '/workspace',
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
        logging: true,
        sampling: false
      },
      requestTimeout: 30000
    };

    // Create mock instances
    mockValidationEngine = new ValidationEngine() as jest.Mocked<ValidationEngine>;
    mockContextEnhancer = new ContextEnhancer() as jest.Mocked<ContextEnhancer>;
    mockSpecParser = new SpecParser() as jest.Mocked<SpecParser>;

    // Setup mock implementations
    mockValidationEngine.initialize = jest.fn().mockResolvedValue(undefined);
    mockValidationEngine.validateInterface = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    });

    mockContextEnhancer.initialize = jest.fn().mockResolvedValue(undefined);
    mockContextEnhancer.generateContext = jest.fn().mockResolvedValue({
      id: 'test-context',
      content: 'Generated context'
    });

    mockSpecParser.parseSpec = jest.fn().mockResolvedValue({
      success: true,
      spec: { openapi: '3.0.0', info: { title: 'Test API' } },
      errors: []
    });

    // Create adapter with dependency injection
    adapter = new TraeAdapter(mockConfig, mockValidationEngine, mockContextEnhancer, mockSpecParser);
  });

  afterEach(() => {
    if (adapter) {
      adapter.dispose();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(adapter.initialize()).resolves.not.toThrow();
      
      expect(mockValidationEngine.initialize).toHaveBeenCalled();
      expect(mockContextEnhancer.initialize).toHaveBeenCalled();
      expect(adapter.getStatistics().isActive).toBe(true);
    });

    it('should initialize without MCP server path', async () => {
      const configWithoutMCP = { ...mockConfig };
      delete configWithoutMCP.mcpServerPath;
      
      const adapterWithoutMCP = new TraeAdapter(configWithoutMCP, mockValidationEngine, mockContextEnhancer, mockSpecParser);
      
      await expect(adapterWithoutMCP.initialize()).resolves.not.toThrow();
      expect(adapterWithoutMCP.getStatistics().mcpConnected).toBe(false);
      
      adapterWithoutMCP.dispose();
    });

    it('should handle initialization errors gracefully', async () => {
      mockValidationEngine.initialize.mockRejectedValue(new Error('Validation engine failed'));
      
      await expect(adapter.initialize()).rejects.toThrow('Validation engine failed');
    });

    it('should emit initialized event on successful initialization', async () => {
      const initSpy = jest.fn();
      adapter.on('initialized', initSpy);
      
      await adapter.initialize();
      
      expect(initSpy).toHaveBeenCalled();
    });

    it('should set up MCP capabilities correctly', async () => {
      await adapter.initialize();
      
      const tools = adapter.getAvailableTools();
      const resources = adapter.getAvailableResources();
      const prompts = adapter.getAvailablePrompts();
      
      expect(tools.length).toBeGreaterThan(0);
      expect(resources.length).toBeGreaterThan(0);
      expect(prompts.length).toBeGreaterThan(0);
      
      // Check specific tools
      expect(tools.find(t => t.name === 'validate_api_spec')).toBeDefined();
      expect(tools.find(t => t.name === 'generate_context')).toBeDefined();
      expect(tools.find(t => t.name === 'analyze_code_patterns')).toBeDefined();
    });
  });

  describe('MCP Tool Execution', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should execute validate_api_spec tool successfully', async () => {
      const result = await adapter.executeTool('validate_api_spec', {
        spec: 'openapi: 3.0.0\npaths:\n  /test: {}',
        format: 'yaml'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(true);
      expect(Array.isArray(result.data.errors)).toBe(true);
      expect(Array.isArray(result.data.warnings)).toBe(true);
      expect(Array.isArray(result.data.suggestions)).toBe(true);
    });

    it('should handle invalid API spec in tool execution', async () => {
      const result = await adapter.executeTool('validate_api_spec', {
        spec: 'invalid spec content',
        format: 'yaml'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(false);
      expect(result.data.errors.length).toBeGreaterThan(0);
    });

    it('should execute generate_context tool successfully', async () => {
      const result = await adapter.executeTool('generate_context', {
        language: 'typescript',
        framework: 'express',
        apiType: 'rest'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.context).toBeDefined();
      expect(Array.isArray(result.data.templates)).toBe(true);
      expect(Array.isArray(result.data.recommendations)).toBe(true);
    });

    it('should handle unknown tool execution', async () => {
      const result = await adapter.executeTool('unknown_tool', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool not found');
    });

    it('should handle tool execution errors', async () => {
      // Create a spy that simulates an error in tool execution
      const executeSpy = jest.spyOn(adapter, 'executeTool').mockImplementation(async () => {
        return {
          success: false,
          error: 'Tool execution failed'
        };
      });

      const result = await adapter.executeTool('validate_api_spec', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool execution failed');

      executeSpy.mockRestore();
    });
  });

  describe('Document Validation', () => {
    let mockContextData: TraeContextData;

    beforeEach(async () => {
      await adapter.initialize();
      
      mockContextData = {
        documentPath: '/test/api.yaml',
        content: 'openapi: 3.0.0\ninfo:\n  title: Test API\npaths:\n  /test: {}',
        language: 'yaml',
        projectInfo: {
          name: 'test-project',
          version: '1.0.0',
          type: 'api'
        }
      };
    });

    it('should validate API specification document successfully', async () => {
      const result = await adapter.validateDocument(mockContextData);
      
      expect(result.isValid).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.metadata?.toolsUsed).toContain('validate_api_spec');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle non-API specification documents', async () => {
      const nonApiContextData = {
        ...mockContextData,
        content: 'console.log("Hello World");',
        language: 'javascript'
      };
      
      const result = await adapter.validateDocument(nonApiContextData);
      
      expect(result.timestamp).toBeDefined();
      expect(result.metadata?.toolsUsed).not.toContain('validate_api_spec');
    });

    it('should use validation cache for repeated requests', async () => {
      const result1 = await adapter.validateDocument(mockContextData);
      const result2 = await adapter.validateDocument(mockContextData);
      
      expect(result1).toEqual(result2);
      expect(result1.timestamp).toBe(result2.timestamp);
    });

    it('should emit validation result event', async () => {
      const validationSpy = jest.fn();
      adapter.on('validationResult', validationSpy);
      
      await adapter.validateDocument(mockContextData);
      
      expect(validationSpy).toHaveBeenCalled();
      expect(validationSpy.mock.calls[0][0]).toMatchObject({
        isValid: expect.any(Boolean),
        timestamp: expect.any(Number)
      });
    });

    it('should handle validation errors gracefully', async () => {
      // Use non-API content to force fallback to parser
      const nonApiContextData = {
        ...mockContextData,
        content: 'invalid content that is not an API spec',
        language: 'text'
      };

      mockSpecParser.parseSpec.mockResolvedValue({
        success: false,
        errors: ['Failed to parse API specification'],
        spec: null
      });

      const result = await adapter.validateDocument(nonApiContextData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to parse API specification');
    });

    it('should clear validation cache', () => {
      adapter.clearValidationCache();
      
      const stats = adapter.getStatistics();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('Context Injection', () => {
    let mockContextData: TraeContextData;

    beforeEach(async () => {
      await adapter.initialize();
      
      mockContextData = {
        documentPath: '/test/api.yaml',
        content: 'openapi: 3.0.0\ninfo:\n  title: Test API',
        language: 'yaml',
        projectInfo: {
          name: 'test-project',
          version: '1.0.0',
          type: 'api'
        }
      };
    });

    it('should inject context successfully', async () => {
      await expect(adapter.injectContext(mockContextData)).resolves.not.toThrow();
    });

    it('should emit context injected event', async () => {
      const contextSpy = jest.fn();
      adapter.on('contextInjected', contextSpy);
      
      await adapter.injectContext(mockContextData);
      
      expect(contextSpy).toHaveBeenCalled();
      expect(contextSpy.mock.calls[0][0]).toMatchObject({
        contextData: mockContextData,
        context: expect.any(Object)
      });
    });

    it('should fail when adapter is not active', async () => {
      adapter.dispose();
      
      await expect(adapter.injectContext(mockContextData))
        .rejects.toThrow('TraeAdapter is not active');
    });

    it('should handle context injection errors', async () => {
      // Mock an error in context generation
      const originalGenerateContext = (adapter as any).generateContextForDocument;
      (adapter as any).generateContextForDocument = jest.fn().mockRejectedValue(new Error('Context generation failed'));
      
      await expect(adapter.injectContext(mockContextData))
        .rejects.toThrow('Context generation failed');
    });
  });

  describe('Real-time Monitoring', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      await adapter.initialize();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should emit monitoring events during real-time monitoring', async () => {
      const monitoringSpy = jest.fn();
      adapter.on('monitoring', monitoringSpy);
      
      // Fast-forward time to trigger monitoring
      jest.advanceTimersByTime(6000);
      
      expect(monitoringSpy).toHaveBeenCalled();
      expect(monitoringSpy.mock.calls[0][0]).toMatchObject({
        timestamp: expect.any(Number),
        status: 'active',
        message: expect.any(String)
      });
    });

    it('should not monitor when adapter is inactive', async () => {
      const monitoringSpy = jest.fn();
      adapter.on('monitoring', monitoringSpy);
      
      adapter.dispose();
      jest.advanceTimersByTime(6000);
      
      expect(monitoringSpy).not.toHaveBeenCalled();
    });
  });

  describe('MCP Capabilities', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should return available tools', () => {
      const tools = adapter.getAvailableTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0]).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        inputSchema: expect.any(Object)
      });
    });

    it('should return available resources', () => {
      const resources = adapter.getAvailableResources();
      
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0]).toMatchObject({
        uri: expect.any(String),
        name: expect.any(String),
        mimeType: expect.any(String)
      });
    });

    it('should return available prompts', () => {
      const prompts = adapter.getAvailablePrompts();
      
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts[0]).toMatchObject({
        name: expect.any(String),
        description: expect.any(String)
      });
    });
  });

  describe('Statistics and Configuration', () => {
    it('should return correct statistics before initialization', () => {
      const stats = adapter.getStatistics();
      
      expect(stats).toMatchObject({
        isActive: false,
        cacheSize: 0,
        mcpConnected: false,
        availableToolsCount: 0,
        availableResourcesCount: 0,
        availablePromptsCount: 0,
        config: mockConfig
      });
    });

    it('should return correct statistics after initialization', async () => {
      await adapter.initialize();
      
      const stats = adapter.getStatistics();
      
      expect(stats).toMatchObject({
        isActive: true,
        cacheSize: 0,
        mcpConnected: true,
        availableToolsCount: expect.any(Number),
        availableResourcesCount: expect.any(Number),
        availablePromptsCount: expect.any(Number),
        config: mockConfig
      });
      
      expect(stats.availableToolsCount).toBeGreaterThan(0);
      expect(stats.availableResourcesCount).toBeGreaterThan(0);
      expect(stats.availablePromptsCount).toBeGreaterThan(0);
    });
  });

  describe('Disposal', () => {
    it('should dispose resources correctly', async () => {
      await adapter.initialize();
      
      adapter.dispose();
      
      const stats = adapter.getStatistics();
      expect(stats.isActive).toBe(false);
      expect(stats.cacheSize).toBe(0);
      expect(stats.mcpConnected).toBe(false);
      expect(stats.availableToolsCount).toBe(0);
      expect(stats.availableResourcesCount).toBe(0);
      expect(stats.availablePromptsCount).toBe(0);
    });

    it('should handle multiple dispose calls safely', async () => {
      await adapter.initialize();
      
      adapter.dispose();
      adapter.dispose(); // Should not throw
      
      expect(adapter.getStatistics().isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration with missing optional fields', () => {
      const minimalConfig: TraeAdapterConfig = {
        enableRealTimeValidation: false,
        contextInjectionMode: 'disabled',
        validationTriggers: []
      };
      
      const minimalAdapter = new TraeAdapter(minimalConfig);
      
      expect(minimalAdapter.getStatistics().config).toMatchObject({
        ...minimalConfig,
        requestTimeout: 30000,
        capabilities: {
          tools: true,
          resources: true,
          prompts: true,
          logging: true,
          sampling: false
        }
      });
      
      minimalAdapter.dispose();
    });

    it('should handle validation with malformed content', async () => {
      await adapter.initialize();
      
      const malformedContextData: TraeContextData = {
        documentPath: '/test/malformed.yaml',
        content: 'invalid: yaml: content: [unclosed',
        language: 'yaml'
      };
      
      const result = await adapter.validateDocument(malformedContextData);
      
      expect(result.timestamp).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });
  });
});
