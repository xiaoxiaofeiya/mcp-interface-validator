/**
 * Cursor Tool Adapter
 * 
 * Provides integration with Cursor AI programming tool for real-time
 * API interface validation and context injection.
 */

// VSCode types - optional dependency
// This adapter requires VSCode extension environment to function
let vscode: any;
try {
  vscode = require('vscode');
} catch (error) {
  // VSCode not available - adapter will be disabled
  vscode = {
    workspace: { onDidChangeTextDocument: () => ({ dispose: () => {} }), onDidSaveTextDocument: () => ({ dispose: () => {} }) },
    window: {
      activeTextEditor: undefined,
      onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
      showWarningMessage: () => {},
      showErrorMessage: () => {},
      showInformationMessage: () => {}
    },
    commands: { registerCommand: () => ({ dispose: () => {} }) },
    Position: class { constructor(_line: number, _character: number) {} },
    Disposable: class { dispose() {} }
  };
}
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index';
import { ValidationEngine } from '../../core/validation';
import { ContextEnhancer } from '../../core/context';
import { SpecParser } from '../../core/parser';
import { ConfigManager } from '../../utils/config';

export interface CursorAdapterConfig {
  enableRealTimeValidation: boolean;
  contextInjectionMode: 'auto' | 'manual' | 'disabled';
  validationTriggers: string[];
  outputChannel?: any;
  workspaceRoot?: string;
}

export interface CursorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  contextId?: string;
  timestamp: number;
}

export interface CursorContextData {
  documentUri: string;
  content: string;
  language: string;
  position?: any;
  selection?: any;
}

/**
 * Cursor Tool Adapter Class
 * 
 * Integrates with Cursor AI programming tool to provide:
 * - Real-time code monitoring
 * - Context injection handlers
 * - API validation feedback
 * - Response processing
 */
export class CursorAdapter extends EventEmitter {
  private logger: Logger;
  private validator: ValidationEngine;
  private contextEnhancer: ContextEnhancer;
  private parser: SpecParser;
  private config: CursorAdapterConfig;
  private disposables: any[] = [];
  private validationCache: Map<string, CursorValidationResult> = new Map();
  private isActive: boolean = false;

  constructor(config: CursorAdapterConfig) {
    super();
    this.config = config;
    this.logger = new Logger('CursorAdapter');

    // Create a config manager for dependencies
    const configManager = new ConfigManager();

    this.validator = new ValidationEngine(configManager, this.logger);
    this.contextEnhancer = new ContextEnhancer(configManager.getValidationConfig(), this.logger);
    this.parser = new SpecParser(configManager.getValidationConfig(), this.logger);
  }

  /**
   * Initialize the Cursor adapter
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Cursor Adapter...', {
        config: this.config
      });

      // Initialize core components
      await this.validator.initialize();
      await this.contextEnhancer.initialize();

      // Set up VS Code event listeners
      this.setupEventListeners();

      // Register commands
      this.registerCommands();

      this.isActive = true;
      this.logger.info('Cursor Adapter initialized successfully');

      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Cursor Adapter:', error);
      throw error;
    }
  }

  /**
   * Set up VS Code event listeners for real-time monitoring
   */
  private setupEventListeners(): void {
    if (this.config.enableRealTimeValidation) {
      // Document change listener
      const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(
        this.handleDocumentChange.bind(this)
      );
      this.disposables.push(onDidChangeTextDocument);

      // Document save listener
      const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(
        this.handleDocumentSave.bind(this)
      );
      this.disposables.push(onDidSaveTextDocument);

      // Active editor change listener
      const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(
        this.handleActiveEditorChange.bind(this)
      );
      this.disposables.push(onDidChangeActiveTextEditor);
    }
  }

  /**
   * Register VS Code commands
   */
  private registerCommands(): void {
    // Validate current document command
    const validateCommand = vscode.commands.registerCommand(
      'cursor-adapter.validateDocument',
      this.validateCurrentDocument.bind(this)
    );
    this.disposables.push(validateCommand);

    // Inject context command
    const injectContextCommand = vscode.commands.registerCommand(
      'cursor-adapter.injectContext',
      this.injectContextToDocument.bind(this)
    );
    this.disposables.push(injectContextCommand);

    // Clear validation cache command
    const clearCacheCommand = vscode.commands.registerCommand(
      'cursor-adapter.clearCache',
      this.clearValidationCache.bind(this)
    );
    this.disposables.push(clearCacheCommand);
  }

  /**
   * Handle document change events
   */
  private async handleDocumentChange(event: any): Promise<void> {
    if (!this.shouldProcessDocument(event.document)) {
      return;
    }

    const documentUri = event.document.uri.toString();
    
    // Debounce validation to avoid excessive processing
    setTimeout(async () => {
      try {
        const contextData: CursorContextData = {
          documentUri,
          content: event.document.getText(),
          language: event.document.languageId
        };

        const result = await this.validateDocument(contextData);
        this.emit('validationResult', result);

        // Show validation feedback if enabled
        if (this.config.outputChannel) {
          this.displayValidationResult(result);
        }
      } catch (error) {
        this.logger.error('Error during document validation:', error);
      }
    }, 500); // 500ms debounce
  }

  /**
   * Handle document save events
   */
  private async handleDocumentSave(document: any): Promise<void> {
    if (!this.shouldProcessDocument(document)) {
      return;
    }

    this.logger.info('Document saved, performing validation', {
      uri: document.uri.toString()
    });

    const contextData: CursorContextData = {
      documentUri: document.uri.toString(),
      content: document.getText(),
      language: document.languageId
    };

    const result = await this.validateDocument(contextData);
    this.emit('documentSaved', { document, validationResult: result });
  }

  /**
   * Handle active editor change events
   */
  private async handleActiveEditorChange(editor: any): Promise<void> {
    if (!editor || !this.shouldProcessDocument(editor.document)) {
      return;
    }

    // Auto-inject context if enabled
    if (this.config.contextInjectionMode === 'auto') {
      await this.injectContextToEditor(editor);
    }
  }

  /**
   * Validate a document for API interface consistency
   */
  async validateDocument(contextData: CursorContextData): Promise<CursorValidationResult> {
    const cacheKey = `${contextData.documentUri}-${this.hashContent(contextData.content)}`;
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    try {
      this.logger.info('Validating document', {
        uri: contextData.documentUri,
        language: contextData.language
      });

      const result: CursorValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        timestamp: Date.now()
      };

      // Parse content if it's an API specification
      if (this.isAPISpecification(contextData)) {
        const parseResult = await this.parser.parseSpec(contextData.content);
        
        if (parseResult.success && parseResult.spec) {
          // Create validation request
          const validationRequest = {
            code: contextData.content,
            specPath: contextData.documentUri,
            type: 'both' as const
          };

          // Validate the parsed specification
          const validationResult = await this.validator.validateInterface(validationRequest);

          result.isValid = validationResult.isValid;
          result.errors = validationResult.errors.map(e => e.message);
          result.warnings = validationResult.warnings.map(w => w.message);
          result.suggestions = validationResult.suggestions.map(s => s.message) || [];
        } else {
          result.isValid = false;
          result.errors = [parseResult.error || 'Failed to parse API specification'];
        }
      }

      // Cache the result
      this.validationCache.set(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error('Document validation failed:', error);
      
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: [],
        timestamp: Date.now()
      };
    }
  }

  /**
   * Inject context into the current document
   */
  async injectContextToDocument(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    await this.injectContextToEditor(editor);
  }

  /**
   * Inject context into a specific editor
   */
  private async injectContextToEditor(editor: any): Promise<void> {
    try {
      const document = editor.document;
      const contextData: CursorContextData = {
        documentUri: document.uri.toString(),
        content: document.getText(),
        language: document.languageId,
        position: editor.selection.active,
        selection: editor.selection
      };

      // Generate context based on document content
      const context = await this.generateContextForDocument(contextData);
      
      if (context) {
        // Insert context as comments at the top of the document
        const contextComment = this.formatContextAsComment(context, document.languageId);
        
        await editor.edit((editBuilder: any) => {
          editBuilder.insert(new vscode.Position(0, 0), contextComment + '\n\n');
        });

        this.logger.info('Context injected successfully', {
          uri: document.uri.toString(),
          contextId: context.id
        });

        this.emit('contextInjected', { editor, context });
      }
    } catch (error) {
      this.logger.error('Failed to inject context:', error);
      vscode.window.showErrorMessage(`Failed to inject context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate the current active document
   */
  async validateCurrentDocument(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const contextData: CursorContextData = {
      documentUri: editor.document.uri.toString(),
      content: editor.document.getText(),
      language: editor.document.languageId
    };

    const result = await this.validateDocument(contextData);
    this.displayValidationResult(result);
  }

  /**
   * Clear the validation cache
   */
  clearValidationCache(): void {
    this.validationCache.clear();
    this.logger.info('Validation cache cleared');
    vscode.window.showInformationMessage('Validation cache cleared');
  }

  /**
   * Check if a document should be processed
   */
  private shouldProcessDocument(document: any): boolean {
    // Skip untitled documents
    if (document.uri.scheme === 'untitled') {
      return false;
    }

    // Check if language is in validation triggers
    if (this.config.validationTriggers.length > 0) {
      return this.config.validationTriggers.includes(document.languageId);
    }

    // Default: process common API-related file types
    const apiLanguages = ['json', 'yaml', 'yml', 'typescript', 'javascript'];
    return apiLanguages.includes(document.languageId);
  }

  /**
   * Check if content is an API specification
   */
  private isAPISpecification(contextData: CursorContextData): boolean {
    const content = contextData.content.toLowerCase();
    return (
      content.includes('openapi') ||
      content.includes('swagger') ||
      content.includes('paths:') ||
      content.includes('"paths"') ||
      (contextData.language === 'json' && content.includes('info')) ||
      (contextData.language === 'yaml' && content.includes('info:'))
    );
  }

  /**
   * Generate context for a document
   */
  private async generateContextForDocument(contextData: CursorContextData): Promise<any> {
    // This would integrate with the ContextEnhancer
    // For now, return a simple context structure
    return {
      id: `cursor-context-${Date.now()}`,
      type: 'api-validation',
      language: contextData.language,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Ensure API endpoints follow RESTful conventions',
        'Validate request/response schemas',
        'Check for consistent error handling'
      ]
    };
  }

  /**
   * Format context as a comment for the given language
   */
  private formatContextAsComment(context: any, languageId: string): string {
    const commentStart = this.getCommentStart(languageId);
    const lines = [
      `${commentStart} API Validation Context`,
      `${commentStart} Generated: ${context.timestamp}`,
      `${commentStart} Context ID: ${context.id}`,
      `${commentStart}`,
      ...context.suggestions.map((suggestion: string) => `${commentStart} - ${suggestion}`)
    ];
    
    return lines.join('\n');
  }

  /**
   * Get comment syntax for a language
   */
  private getCommentStart(languageId: string): string {
    const commentMap: Record<string, string> = {
      'typescript': '//',
      'javascript': '//',
      'json': '//',
      'yaml': '#',
      'yml': '#',
      'python': '#',
      'shell': '#'
    };
    
    return commentMap[languageId] || '//';
  }

  /**
   * Display validation result in output channel
   */
  private displayValidationResult(result: CursorValidationResult): void {
    if (!this.config.outputChannel) {
      return;
    }

    const channel = this.config.outputChannel;
    channel.appendLine(`\n--- Validation Result (${new Date(result.timestamp).toLocaleTimeString()}) ---`);
    channel.appendLine(`Status: ${result.isValid ? 'VALID' : 'INVALID'}`);
    
    if (result.errors.length > 0) {
      channel.appendLine('\nErrors:');
      result.errors.forEach(error => channel.appendLine(`  - ${error}`));
    }
    
    if (result.warnings.length > 0) {
      channel.appendLine('\nWarnings:');
      result.warnings.forEach(warning => channel.appendLine(`  - ${warning}`));
    }
    
    if (result.suggestions.length > 0) {
      channel.appendLine('\nSuggestions:');
      result.suggestions.forEach(suggestion => channel.appendLine(`  - ${suggestion}`));
    }
    
    channel.appendLine('--- End ---\n');
  }

  /**
   * Generate a hash for content caching
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get adapter statistics
   */
  getStatistics(): any {
    return {
      isActive: this.isActive,
      cacheSize: this.validationCache.size,
      config: this.config,
      disposablesCount: this.disposables.length
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    this.validationCache.clear();
    this.isActive = false;
    this.logger.info('Cursor Adapter disposed');
  }
}

export default CursorAdapter;
