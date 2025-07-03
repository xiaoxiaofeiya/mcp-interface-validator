/**
 * Unit tests for Cursor Adapter
 */

import { CursorAdapter, CursorAdapterConfig, CursorValidationResult, CursorContextData } from '../../src/adapters/cursor';
import * as vscode from 'vscode';
import { EventEmitter } from 'events';

// Mock the core modules
jest.mock('../../src/core/validation', () => ({
  ValidationEngine: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    validateInterface: jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    })
  }))
}));

jest.mock('../../src/core/context', () => ({
  ContextEnhancer: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('../../src/core/parser', () => ({
  SpecParser: jest.fn().mockImplementation(() => ({
    parseSpec: jest.fn().mockResolvedValue({
      success: true,
      spec: { openapi: '3.0.0' },
      errors: []
    })
  }))
}));

jest.mock('../../src/utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));

// Mock vscode module
jest.mock('vscode', () => ({
  workspace: {
    onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
    onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() }))
  },
  window: {
    onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
    activeTextEditor: undefined,
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn()
  },
  commands: {
    registerCommand: jest.fn(() => ({ dispose: jest.fn() }))
  },
  Position: jest.fn(),
  Selection: jest.fn(),
  Uri: {
    parse: jest.fn()
  }
}));

describe('CursorAdapter', () => {
  let adapter: CursorAdapter;
  let mockConfig: CursorAdapterConfig;
  let mockOutputChannel: any;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock output channel
    mockOutputChannel = {
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn()
    };

    // Create test configuration
    mockConfig = {
      enableRealTimeValidation: true,
      contextInjectionMode: 'auto',
      validationTriggers: ['typescript', 'javascript', 'json', 'yaml'],
      outputChannel: mockOutputChannel,
      workspaceRoot: '/test/workspace'
    };

    // Create adapter instance
    adapter = new CursorAdapter(mockConfig);
  });

  afterEach(() => {
    if (adapter) {
      adapter.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const initPromise = adapter.initialize();
      
      // Listen for initialized event
      const initPromiseWithEvent = new Promise<void>((resolve) => {
        adapter.once('initialized', resolve);
      });

      await initPromise;
      await initPromiseWithEvent;

      expect(adapter.getStatistics().isActive).toBe(true);
    });

    it('should set up event listeners when real-time validation is enabled', async () => {
      await adapter.initialize();

      expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
      expect(vscode.workspace.onDidSaveTextDocument).toHaveBeenCalled();
      expect(vscode.window.onDidChangeActiveTextEditor).toHaveBeenCalled();
    });

    it('should register commands', async () => {
      await adapter.initialize();

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'cursor-adapter.validateDocument',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'cursor-adapter.injectContext',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'cursor-adapter.clearCache',
        expect.any(Function)
      );
    });
  });

  describe('document validation', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should validate API specification document', async () => {
      const contextData: CursorContextData = {
        documentUri: 'file:///test/api.yaml',
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

      const result = await adapter.validateDocument(contextData);

      expect(result).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle non-API documents', async () => {
      const contextData: CursorContextData = {
        documentUri: 'file:///test/regular.ts',
        content: `
const hello = 'world';
console.log(hello);
        `,
        language: 'typescript'
      };

      const result = await adapter.validateDocument(contextData);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true); // Non-API documents should pass validation
    });

    it('should cache validation results', async () => {
      const contextData: CursorContextData = {
        documentUri: 'file:///test/api.json',
        content: '{"openapi": "3.0.0", "info": {"title": "Test", "version": "1.0.0"}}',
        language: 'json'
      };

      // First validation
      const result1 = await adapter.validateDocument(contextData);
      const stats1 = adapter.getStatistics();

      // Second validation with same content
      const result2 = await adapter.validateDocument(contextData);
      const stats2 = adapter.getStatistics();

      expect(result1.timestamp).toBe(result2.timestamp); // Should be cached
      expect(stats2.cacheSize).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', async () => {
      // Test with content that will trigger an exception
      const contextData: CursorContextData = {
        documentUri: 'file:///test/invalid.yaml',
        content: 'openapi: 3.0.0\ninvalid: yaml: content: [unclosed',
        language: 'yaml'
      };

      // Mock the parser to throw an error
      const originalParseSpec = adapter['parser'].parseSpec;
      adapter['parser'].parseSpec = jest.fn().mockRejectedValue(new Error('Parse error'));

      const result = await adapter.validateDocument(contextData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Validation error');

      // Restore original method
      adapter['parser'].parseSpec = originalParseSpec;
    });
  });

  describe('context injection', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle missing active editor', async () => {
      // Mock no active editor
      (vscode.window as any).activeTextEditor = undefined;

      await adapter.injectContextToDocument();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No active editor found');
    });

    it('should emit contextInjected event when context is injected', async () => {
      // Mock active editor
      const mockEditor = {
        document: {
          uri: { toString: () => 'file:///test/api.ts' },
          getText: () => 'const api = {};',
          languageId: 'typescript'
        },
        selection: {
          active: new vscode.Position(0, 0)
        },
        edit: jest.fn(() => Promise.resolve(true))
      };
      (vscode.window as any).activeTextEditor = mockEditor;

      const contextInjectedPromise = new Promise((resolve) => {
        adapter.once('contextInjected', resolve);
      });

      await adapter.injectContextToDocument();
      await contextInjectedPromise;

      expect(mockEditor.edit).toHaveBeenCalled();
    });
  });

  describe('configuration handling', () => {
    it('should respect validation triggers', async () => {
      const configWithTriggers: CursorAdapterConfig = {
        ...mockConfig,
        validationTriggers: ['typescript']
      };

      const adapterWithTriggers = new CursorAdapter(configWithTriggers);
      await adapterWithTriggers.initialize();

      // Test private method through validation
      const tsContextData: CursorContextData = {
        documentUri: 'file:///test/app.ts',
        content: 'const app = {};',
        language: 'typescript'
      };

      const jsContextData: CursorContextData = {
        documentUri: 'file:///test/app.js',
        content: 'const app = {};',
        language: 'javascript'
      };

      // Both should validate, but triggers only affect event handling
      const tsResult = await adapterWithTriggers.validateDocument(tsContextData);
      const jsResult = await adapterWithTriggers.validateDocument(jsContextData);

      expect(tsResult).toBeDefined();
      expect(jsResult).toBeDefined();

      adapterWithTriggers.dispose();
    });

    it('should handle disabled real-time validation', async () => {
      const configDisabled: CursorAdapterConfig = {
        ...mockConfig,
        enableRealTimeValidation: false
      };

      const adapterDisabled = new CursorAdapter(configDisabled);
      await adapterDisabled.initialize();

      // Event listeners should not be set up
      expect(vscode.workspace.onDidChangeTextDocument).not.toHaveBeenCalled();

      adapterDisabled.dispose();
    });
  });

  describe('cache management', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should clear validation cache', () => {
      // Add some items to cache first
      const contextData: CursorContextData = {
        documentUri: 'file:///test/api.yaml',
        content: 'openapi: 3.0.0',
        language: 'yaml'
      };

      return adapter.validateDocument(contextData).then(() => {
        const statsBefore = adapter.getStatistics();
        expect(statsBefore.cacheSize).toBeGreaterThan(0);

        adapter.clearValidationCache();

        const statsAfter = adapter.getStatistics();
        expect(statsAfter.cacheSize).toBe(0);
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Validation cache cleared');
      });
    });
  });

  describe('statistics and monitoring', () => {
    it('should provide accurate statistics', async () => {
      const stats = adapter.getStatistics();

      expect(stats).toHaveProperty('isActive');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('disposablesCount');

      expect(stats.isActive).toBe(false); // Not initialized yet
      expect(stats.cacheSize).toBe(0);
      expect(stats.config).toBe(mockConfig);

      await adapter.initialize();

      const statsAfterInit = adapter.getStatistics();
      expect(statsAfterInit.isActive).toBe(true);
    });
  });

  describe('disposal', () => {
    it('should dispose resources properly', async () => {
      await adapter.initialize();

      const statsBefore = adapter.getStatistics();
      expect(statsBefore.isActive).toBe(true);
      expect(statsBefore.disposablesCount).toBeGreaterThan(0);

      adapter.dispose();

      const statsAfter = adapter.getStatistics();
      expect(statsAfter.isActive).toBe(false);
      expect(statsAfter.disposablesCount).toBe(0);
      expect(statsAfter.cacheSize).toBe(0);
    });
  });

  describe('event emission', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should emit validation results', async () => {
      const contextData: CursorContextData = {
        documentUri: 'file:///test/api.json',
        content: '{"openapi": "3.0.0"}',
        language: 'json'
      };

      const validationResultPromise = new Promise<CursorValidationResult>((resolve) => {
        adapter.once('validationResult', resolve);
      });

      // Simulate document change event
      const mockEvent = {
        document: {
          uri: { toString: () => contextData.documentUri },
          getText: () => contextData.content,
          languageId: contextData.language
        }
      };

      // Access private method through any
      await (adapter as any).handleDocumentChange(mockEvent);

      // Wait for debounced validation
      await new Promise(resolve => setTimeout(resolve, 600));

      const result = await validationResultPromise;
      expect(result).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });
});
