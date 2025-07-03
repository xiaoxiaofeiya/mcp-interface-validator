/**
 * Cursor Tool Adapter
 *
 * Provides integration with Cursor AI programming tool for real-time
 * API interface validation and context injection.
 */
import { EventEmitter } from 'events';
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
export declare class CursorAdapter extends EventEmitter {
    private logger;
    private validator;
    private contextEnhancer;
    private parser;
    private config;
    private disposables;
    private validationCache;
    private isActive;
    constructor(config: CursorAdapterConfig);
    /**
     * Initialize the Cursor adapter
     */
    initialize(): Promise<void>;
    /**
     * Set up VS Code event listeners for real-time monitoring
     */
    private setupEventListeners;
    /**
     * Register VS Code commands
     */
    private registerCommands;
    /**
     * Handle document change events
     */
    private handleDocumentChange;
    /**
     * Handle document save events
     */
    private handleDocumentSave;
    /**
     * Handle active editor change events
     */
    private handleActiveEditorChange;
    /**
     * Validate a document for API interface consistency
     */
    validateDocument(contextData: CursorContextData): Promise<CursorValidationResult>;
    /**
     * Inject context into the current document
     */
    injectContextToDocument(): Promise<void>;
    /**
     * Inject context into a specific editor
     */
    private injectContextToEditor;
    /**
     * Validate the current active document
     */
    validateCurrentDocument(): Promise<void>;
    /**
     * Clear the validation cache
     */
    clearValidationCache(): void;
    /**
     * Check if a document should be processed
     */
    private shouldProcessDocument;
    /**
     * Check if content is an API specification
     */
    private isAPISpecification;
    /**
     * Generate context for a document
     */
    private generateContextForDocument;
    /**
     * Format context as a comment for the given language
     */
    private formatContextAsComment;
    /**
     * Get comment syntax for a language
     */
    private getCommentStart;
    /**
     * Display validation result in output channel
     */
    private displayValidationResult;
    /**
     * Generate a hash for content caching
     */
    private hashContent;
    /**
     * Get adapter statistics
     */
    getStatistics(): any;
    /**
     * Dispose of all resources
     */
    dispose(): void;
}
export default CursorAdapter;
//# sourceMappingURL=index.d.ts.map