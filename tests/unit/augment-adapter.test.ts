/**
 * Tests for Augment Tool Adapter
 */

import { AugmentAdapter, AugmentAdapterConfig, AugmentContextData } from '../../src/adapters/augment';
import { Logger } from '../../src/utils/logger';
import { ValidationEngine } from '../../src/core/validation';
import { ContextEnhancer } from '../../src/core/context';
import { SpecParser } from '../../src/core/parser';

// Mock dependencies
jest.mock('../../src/utils/logger');
jest.mock('../../src/core/validation');
jest.mock('../../src/core/context');
jest.mock('../../src/core/parser');

describe('AugmentAdapter', () => {
  let adapter: AugmentAdapter;
  let mockConfig: AugmentAdapterConfig;
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
      validationTriggers: ['onSave', 'onChange'],
      codebaseIndexing: true,
      semanticAnalysis: true,
      workspaceRoot: '/test/workspace',
      capabilities: {
        codebaseRetrieval: true,
        semanticSearch: true,
        contextualValidation: true,
        intelligentSuggestions: true,
        crossFileAnalysis: true
      },
      requestTimeout: 5000,
      maxContextSize: 10000
    };

    // Create mocked instances
    mockValidationEngine = new ValidationEngine() as jest.Mocked<ValidationEngine>;
    mockContextEnhancer = new ContextEnhancer() as jest.Mocked<ContextEnhancer>;
    mockSpecParser = new SpecParser() as jest.Mocked<SpecParser>;

    // Setup mock implementations
    mockValidationEngine.initialize = jest.fn().mockResolvedValue(undefined);
    mockValidationEngine.validateSpec = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    });

    mockContextEnhancer.initialize = jest.fn().mockResolvedValue(undefined);
    mockContextEnhancer.injectContext = jest.fn().mockResolvedValue(true);

    mockSpecParser.initialize = jest.fn().mockResolvedValue(undefined);
    mockSpecParser.parseSpec = jest.fn().mockResolvedValue({
      success: true,
      spec: { openapi: '3.0.0', paths: {} },
      errors: []
    });

    // Create adapter instance
    adapter = new AugmentAdapter(mockConfig);

    // Replace the mocked instances
    (adapter as any).validationEngine = mockValidationEngine;
    (adapter as any).contextEnhancer = mockContextEnhancer;
    (adapter as any).specParser = mockSpecParser;
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.dispose();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const initSpy = jest.spyOn(adapter, 'emit');
      
      await adapter.initialize();
      
      expect(mockValidationEngine.initialize).toHaveBeenCalled();
      expect(mockContextEnhancer.initialize).toHaveBeenCalled();
      expect(mockSpecParser.initialize).toHaveBeenCalled();
      expect(initSpy).toHaveBeenCalledWith('initialized', { timestamp: expect.any(Number) });
    });

    it('should initialize without codebase indexing', async () => {
      const configWithoutIndexing = { ...mockConfig, codebaseIndexing: false };
      const adapterWithoutIndexing = new AugmentAdapter(configWithoutIndexing);
      
      // Replace mocked instances
      (adapterWithoutIndexing as any).validationEngine = mockValidationEngine;
      (adapterWithoutIndexing as any).contextEnhancer = mockContextEnhancer;
      (adapterWithoutIndexing as any).specParser = mockSpecParser;
      
      await adapterWithoutIndexing.initialize();
      
      expect(mockValidationEngine.initialize).toHaveBeenCalled();
      await adapterWithoutIndexing.dispose();
    });

    it('should handle initialization errors gracefully', async () => {
      mockValidationEngine.initialize.mockRejectedValue(new Error('Initialization failed'));
      
      await expect(adapter.initialize()).rejects.toThrow('Initialization failed');
    });

    it('should emit initialized event on successful initialization', async () => {
      const eventSpy = jest.spyOn(adapter, 'emit');
      
      await adapter.initialize();
      
      expect(eventSpy).toHaveBeenCalledWith('initialized', { timestamp: expect.any(Number) });
    });

    it('should build codebase index when enabled', async () => {
      await adapter.initialize();
      
      const stats = adapter.getStatistics();
      expect(stats.codebaseIndexSize).toBeGreaterThan(0);
    });
  });

  describe('Document Validation', () => {
    let mockContextData: AugmentContextData;

    beforeEach(async () => {
      await adapter.initialize();
      
      mockContextData = {
        documentPath: '/test/api.yaml',
        content: 'openapi: 3.0.0\npaths:\n  /users:\n    get:\n      responses:\n        200:\n          description: Success',
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
      expect(result.errors).toHaveLength(0);
      expect(result.suggestions).toContain('Consider adding more detailed descriptions');
      expect(result.metadata?.confidenceScore).toBeGreaterThan(0);
    });

    it('should handle non-API specification documents', async () => {
      const nonApiContextData = {
        ...mockContextData,
        content: 'const users = [];\nfunction getUsers() { return users; }',
        language: 'typescript'
      };
      
      const result = await adapter.validateDocument(nonApiContextData);
      
      expect(result).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should use validation cache for repeated requests', async () => {
      // First validation
      const result1 = await adapter.validateDocument(mockContextData);
      
      // Second validation with same data
      const result2 = await adapter.validateDocument(mockContextData);
      
      expect(result1).toEqual(result2);
      expect(mockSpecParser.parseSpec).toHaveBeenCalledTimes(1); // Should be cached
    });

    it('should emit validation result event', async () => {
      const eventSpy = jest.spyOn(adapter, 'emit');
      
      await adapter.validateDocument(mockContextData);
      
      expect(eventSpy).toHaveBeenCalledWith('validationResult', {
        result: expect.any(Object),
        contextData: mockContextData
      });
    });

    it('should handle validation errors gracefully', async () => {
      const invalidContextData = {
        ...mockContextData,
        content: 'openapi: 3.0.0\ninvalid yaml content that cannot be parsed',
        language: 'yaml'
      };

      mockSpecParser.parseSpec.mockResolvedValue({
        success: false,
        errors: ['Parse error'],
        spec: null
      });

      const result = await adapter.validateDocument(invalidContextData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to parse API specification');
    });

    it('should clear validation cache', () => {
      adapter.clearValidationCache();
      
      const stats = adapter.getStatistics();
      expect(stats.validationCacheSize).toBe(0);
    });
  });

  describe('Context Injection', () => {
    let mockContextData: AugmentContextData;

    beforeEach(async () => {
      await adapter.initialize();
      
      mockContextData = {
        documentPath: '/test/component.ts',
        content: 'export class UserComponent {}',
        language: 'typescript'
      };
    });

    it('should inject context successfully', async () => {
      const result = await adapter.injectContext(mockContextData);
      
      expect(result).toBe(true);
      expect(mockContextEnhancer.injectContext).toHaveBeenCalled();
    });

    it('should emit context injected event', async () => {
      const eventSpy = jest.spyOn(adapter, 'emit');
      
      await adapter.injectContext(mockContextData);
      
      expect(eventSpy).toHaveBeenCalledWith('contextInjected', {
        contextData: expect.any(Object),
        timestamp: expect.any(Number)
      });
    });

    it('should fail when adapter is not active', async () => {
      // Don't initialize the adapter
      const uninitializedAdapter = new AugmentAdapter(mockConfig);

      // The method should throw an error when adapter is not active
      await expect(uninitializedAdapter.injectContext(mockContextData)).rejects.toThrow('Augment adapter is not active');
    });

    it('should handle context injection errors', async () => {
      mockContextEnhancer.injectContext.mockResolvedValue(false);
      
      const result = await adapter.injectContext(mockContextData);
      
      expect(result).toBe(false);
    });
  });

  describe('Codebase Search', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should perform intelligent codebase search', async () => {
      const query = {
        query: 'user',
        maxResults: 5,
        includeContext: true
      };
      
      const result = await adapter.searchCodebase(query);
      
      expect(result.files).toBeDefined();
      expect(result.totalMatches).toBeGreaterThanOrEqual(0);
      expect(result.queryTime).toBeGreaterThan(0);
    });

    it('should filter by file types', async () => {
      const query = {
        query: 'api',
        fileTypes: ['ts'],
        maxResults: 10
      };
      
      const result = await adapter.searchCodebase(query);
      
      expect(result.files).toBeDefined();
      // All results should be TypeScript files
      result.files.forEach(file => {
        expect(file.path.endsWith('.ts')).toBe(true);
      });
    });

    it('should limit search results', async () => {
      const query = {
        query: 'test',
        maxResults: 2
      };
      
      const result = await adapter.searchCodebase(query);
      
      expect(result.files.length).toBeLessThanOrEqual(2);
    });

    it('should include relevance scores', async () => {
      const query = {
        query: 'user',
        maxResults: 5
      };

      const result = await adapter.searchCodebase(query);

      result.files.forEach(file => {
        expect(file.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(file.relevanceScore).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Real-time Monitoring', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should emit monitoring events during real-time monitoring', async () => {
      const eventSpy = jest.spyOn(adapter, 'emit');

      await adapter.startRealTimeMonitoring();

      // Wait longer for monitoring events to be emitted
      await new Promise(resolve => setTimeout(resolve, 6000));

      await adapter.stopRealTimeMonitoring();

      expect(eventSpy).toHaveBeenCalledWith('monitoring', expect.objectContaining({
        status: 'active',
        timestamp: expect.any(Number),
        metrics: expect.any(Object)
      }));
    });

    it('should not monitor when adapter is inactive', async () => {
      const uninitializedAdapter = new AugmentAdapter(mockConfig);
      const eventSpy = jest.spyOn(uninitializedAdapter, 'emit');

      await uninitializedAdapter.startRealTimeMonitoring();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventSpy).not.toHaveBeenCalledWith('monitoring', expect.any(Object));
    });
  });

  describe('Statistics and Configuration', () => {
    it('should return correct statistics before initialization', () => {
      const stats = adapter.getStatistics();

      expect(stats.isActive).toBe(false);
      expect(stats.validationCacheSize).toBe(0);
      expect(stats.codebaseIndexSize).toBe(0);
      expect(stats.contextCacheSize).toBe(0);
      expect(stats.capabilities).toBeDefined();
    });

    it('should return correct statistics after initialization', async () => {
      await adapter.initialize();

      const stats = adapter.getStatistics();

      expect(stats.isActive).toBe(true);
      expect(stats.codebaseIndexSize).toBeGreaterThan(0);
      expect(stats.capabilities).toEqual(mockConfig.capabilities);
    });
  });

  describe('Disposal', () => {
    it('should dispose resources correctly', async () => {
      await adapter.initialize();
      await adapter.startRealTimeMonitoring();

      const eventSpy = jest.spyOn(adapter, 'emit');

      await adapter.dispose();

      const stats = adapter.getStatistics();
      expect(stats.isActive).toBe(false);
      expect(stats.validationCacheSize).toBe(0);
      expect(stats.codebaseIndexSize).toBe(0);
      expect(eventSpy).toHaveBeenCalledWith('disposed', { timestamp: expect.any(Number) });
    });

    it('should handle multiple dispose calls safely', async () => {
      await adapter.initialize();

      await adapter.dispose();
      await adapter.dispose(); // Should not throw

      const stats = adapter.getStatistics();
      expect(stats.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle configuration with missing optional fields', () => {
      const minimalConfig: AugmentAdapterConfig = {
        enableRealTimeValidation: false,
        contextInjectionMode: 'disabled',
        validationTriggers: []
      };

      const minimalAdapter = new AugmentAdapter(minimalConfig);

      expect(minimalAdapter).toBeDefined();
      expect(minimalAdapter.getStatistics().capabilities).toEqual({});
    });

    it('should handle validation with malformed content', async () => {
      const malformedContextData: AugmentContextData = {
        documentPath: '/test/malformed.yaml',
        content: 'this is not valid yaml: [unclosed bracket',
        language: 'yaml'
      };

      const result = await adapter.validateDocument(malformedContextData);

      expect(result).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should handle codebase search errors', async () => {
      // Mock an error in the search process
      const originalIndex = (adapter as any).codebaseIndex;
      (adapter as any).codebaseIndex = null;

      await expect(adapter.searchCodebase({ query: 'test' })).rejects.toThrow();

      // Restore the index
      (adapter as any).codebaseIndex = originalIndex;
    });

    it('should handle context injection with invalid data', async () => {
      const invalidContextData = {
        documentPath: '',
        content: '',
        language: ''
      };

      const result = await adapter.injectContext(invalidContextData);

      // Should handle gracefully
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Intelligent Features', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should enhance context with codebase intelligence', async () => {
      const contextData: AugmentContextData = {
        documentPath: '/test/api/users.ts',
        content: 'export class UserService {}',
        language: 'typescript'
      };

      const result = await adapter.validateDocument(contextData);

      expect(result.metadata?.codebaseContext).toBeDefined();
      expect(result.metadata?.relatedFiles).toBeDefined();
    });

    it('should provide semantic analysis', async () => {
      const contextData: AugmentContextData = {
        documentPath: '/test/component.ts',
        content: 'async function fetchUsers() { return await api.get("/users"); }',
        language: 'typescript'
      };

      const result = await adapter.validateDocument(contextData);

      expect(result.suggestions).toContain('Consider adding error handling with try-catch blocks');
    });

    it('should identify API patterns', async () => {
      const contextData: AugmentContextData = {
        documentPath: '/test/api.yaml',
        content: 'openapi: 3.0.0\npaths:\n  /users:\n    get:\n      responses:\n        200:\n          description: Success',
        language: 'yaml'
      };

      const result = await adapter.validateDocument(contextData);

      expect(result.metadata?.codebaseContext).toBeDefined();
    });

    it('should provide contextual suggestions', async () => {
      const contextData: AugmentContextData = {
        documentPath: '/test/service.ts',
        content: 'function processData(data: any) { console.log(data); }',
        language: 'typescript'
      };

      const result = await adapter.validateDocument(contextData);

      // Check that suggestions are provided (exact content may vary)
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('Console.log statements found - consider using a proper logging library');
    });
  });
});
