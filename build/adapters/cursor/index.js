/**
 * Cursor Tool Adapter
 *
 * Provides integration with Cursor AI programming tool for real-time
 * API interface validation and context injection.
 */
// VSCode types - optional dependency
// This adapter requires VSCode extension environment to function
let vscode;
try {
    vscode = require('vscode');
}
catch (error) {
    // VSCode not available - adapter will be disabled
    vscode = {
        workspace: { onDidChangeTextDocument: () => ({ dispose: () => { } }), onDidSaveTextDocument: () => ({ dispose: () => { } }) },
        window: {
            activeTextEditor: undefined,
            onDidChangeActiveTextEditor: () => ({ dispose: () => { } }),
            showWarningMessage: () => { },
            showErrorMessage: () => { },
            showInformationMessage: () => { }
        },
        commands: { registerCommand: () => ({ dispose: () => { } }) },
        Position: class {
            constructor(_line, _character) { }
        },
        Disposable: class {
            dispose() { }
        }
    };
}
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index.js';
import { ValidationEngine } from '../../core/validation/index.js';
import { ContextEnhancer } from '../../core/context/index.js';
import { SpecParser } from '../../core/parser/index.js';
import { ConfigManager } from '../../utils/config/index.js';
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
    logger;
    validator;
    contextEnhancer;
    parser;
    config;
    disposables = [];
    validationCache = new Map();
    isActive = false;
    constructor(config) {
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
    async initialize() {
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
        }
        catch (error) {
            this.logger.error('Failed to initialize Cursor Adapter:', error);
            throw error;
        }
    }
    /**
     * Set up VS Code event listeners for real-time monitoring
     */
    setupEventListeners() {
        if (this.config.enableRealTimeValidation) {
            // Document change listener
            const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(this.handleDocumentChange.bind(this));
            this.disposables.push(onDidChangeTextDocument);
            // Document save listener
            const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(this.handleDocumentSave.bind(this));
            this.disposables.push(onDidSaveTextDocument);
            // Active editor change listener
            const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(this.handleActiveEditorChange.bind(this));
            this.disposables.push(onDidChangeActiveTextEditor);
        }
    }
    /**
     * Register VS Code commands
     */
    registerCommands() {
        // Validate current document command
        const validateCommand = vscode.commands.registerCommand('cursor-adapter.validateDocument', this.validateCurrentDocument.bind(this));
        this.disposables.push(validateCommand);
        // Inject context command
        const injectContextCommand = vscode.commands.registerCommand('cursor-adapter.injectContext', this.injectContextToDocument.bind(this));
        this.disposables.push(injectContextCommand);
        // Clear validation cache command
        const clearCacheCommand = vscode.commands.registerCommand('cursor-adapter.clearCache', this.clearValidationCache.bind(this));
        this.disposables.push(clearCacheCommand);
    }
    /**
     * Handle document change events
     */
    async handleDocumentChange(event) {
        if (!this.shouldProcessDocument(event.document)) {
            return;
        }
        const documentUri = event.document.uri.toString();
        // Debounce validation to avoid excessive processing
        setTimeout(async () => {
            try {
                const contextData = {
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
            }
            catch (error) {
                this.logger.error('Error during document validation:', error);
            }
        }, 500); // 500ms debounce
    }
    /**
     * Handle document save events
     */
    async handleDocumentSave(document) {
        if (!this.shouldProcessDocument(document)) {
            return;
        }
        this.logger.info('Document saved, performing validation', {
            uri: document.uri.toString()
        });
        const contextData = {
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
    async handleActiveEditorChange(editor) {
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
    async validateDocument(contextData) {
        const cacheKey = `${contextData.documentUri}-${this.hashContent(contextData.content)}`;
        // Check cache first
        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey);
        }
        try {
            this.logger.info('Validating document', {
                uri: contextData.documentUri,
                language: contextData.language
            });
            const result = {
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
                        type: 'both'
                    };
                    // Validate the parsed specification
                    const validationResult = await this.validator.validateInterface(validationRequest);
                    result.isValid = validationResult.isValid;
                    result.errors = validationResult.errors.map(e => e.message);
                    result.warnings = validationResult.warnings.map(w => w.message);
                    result.suggestions = validationResult.suggestions.map(s => s.message) || [];
                }
                else {
                    result.isValid = false;
                    result.errors = [parseResult.error || 'Failed to parse API specification'];
                }
            }
            // Cache the result
            this.validationCache.set(cacheKey, result);
            return result;
        }
        catch (error) {
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
    async injectContextToDocument() {
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
    async injectContextToEditor(editor) {
        try {
            const document = editor.document;
            const contextData = {
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
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode.Position(0, 0), contextComment + '\n\n');
                });
                this.logger.info('Context injected successfully', {
                    uri: document.uri.toString(),
                    contextId: context.id
                });
                this.emit('contextInjected', { editor, context });
            }
        }
        catch (error) {
            this.logger.error('Failed to inject context:', error);
            vscode.window.showErrorMessage(`Failed to inject context: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate the current active document
     */
    async validateCurrentDocument() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }
        const contextData = {
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
    clearValidationCache() {
        this.validationCache.clear();
        this.logger.info('Validation cache cleared');
        vscode.window.showInformationMessage('Validation cache cleared');
    }
    /**
     * Check if a document should be processed
     */
    shouldProcessDocument(document) {
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
    isAPISpecification(contextData) {
        const content = contextData.content.toLowerCase();
        return (content.includes('openapi') ||
            content.includes('swagger') ||
            content.includes('paths:') ||
            content.includes('"paths"') ||
            (contextData.language === 'json' && content.includes('info')) ||
            (contextData.language === 'yaml' && content.includes('info:')));
    }
    /**
     * Generate context for a document
     */
    async generateContextForDocument(contextData) {
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
    formatContextAsComment(context, languageId) {
        const commentStart = this.getCommentStart(languageId);
        const lines = [
            `${commentStart} API Validation Context`,
            `${commentStart} Generated: ${context.timestamp}`,
            `${commentStart} Context ID: ${context.id}`,
            `${commentStart}`,
            ...context.suggestions.map((suggestion) => `${commentStart} - ${suggestion}`)
        ];
        return lines.join('\n');
    }
    /**
     * Get comment syntax for a language
     */
    getCommentStart(languageId) {
        const commentMap = {
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
    displayValidationResult(result) {
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
    hashContent(content) {
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
    getStatistics() {
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
    dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        this.validationCache.clear();
        this.isActive = false;
        this.logger.info('Cursor Adapter disposed');
    }
}
export default CursorAdapter;
//# sourceMappingURL=index.js.map