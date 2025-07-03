/**
 * Windsurf Tool Adapter
 *
 * Provides integration with Windsurf AI programming tool for real-time
 * API interface validation and context injection.
 */
import { EventEmitter } from 'events';
import { ValidationEngine } from '../../core/validation/index.js';
import { ContextEnhancer } from '../../core/context/index.js';
import { SpecParser } from '../../core/parser/index.js';
export interface WindsurfAdapterConfig {
    enableRealTimeValidation: boolean;
    contextInjectionMode: 'auto' | 'manual' | 'disabled';
    validationTriggers: string[];
    apiEndpoint?: string;
    serviceKey?: string;
    workspaceRoot?: string;
    mcpServerConfig?: MCPServerConfig;
}
export interface MCPServerConfig {
    servers: Record<string, {
        command: string;
        args: string[];
        env?: Record<string, string>;
    }>;
}
export interface WindsurfValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    contextId?: string;
    timestamp: number;
    metadata?: {
        model?: string;
        tokensUsed?: number;
        creditsConsumed?: number;
    };
}
export interface WindsurfContextData {
    documentPath: string;
    content: string;
    language: string;
    projectInfo?: {
        name: string;
        version: string;
        type: string;
    };
    ideInfo?: {
        type: 'vscode' | 'jetbrains' | 'visual-studio' | 'neovim' | 'vim' | 'emacs' | 'xcode' | 'sublime' | 'eclipse';
        version: string;
    };
}
export interface WindsurfAnalyticsData {
    cascade_lines?: {
        linesSuggested: string;
        linesAccepted: string;
    };
    cascade_runs?: {
        totalRuns: string;
        successfulRuns: string;
    };
    tool_usage?: Array<{
        tool: string;
        count: string;
    }>;
}
/**
 * Windsurf Tool Adapter Class
 *
 * Integrates with Windsurf AI programming tool to provide:
 * - Real-time code monitoring via Windsurf APIs
 * - Context injection through MCP servers
 * - API validation feedback
 * - Analytics and usage tracking
 */
export declare class WindsurfAdapter extends EventEmitter {
    private logger;
    private validator;
    private contextEnhancer;
    private parser;
    private config;
    private validationCache;
    private isActive;
    private mcpServers;
    constructor(config: WindsurfAdapterConfig, validator?: ValidationEngine, contextEnhancer?: ContextEnhancer, parser?: SpecParser);
    /**
     * Initialize the Windsurf adapter
     */
    initialize(): Promise<void>;
    /**
     * Set up MCP servers for enhanced tool integration
     */
    private setupMCPServers;
    /**
     * Set up real-time monitoring for code changes
     */
    private setupRealTimeMonitoring;
    /**
     * Check for code changes and trigger validation
     */
    private checkForChanges;
    /**
     * Validate a document for API interface consistency
     */
    validateDocument(contextData: WindsurfContextData): Promise<WindsurfValidationResult>;
    /**
     * Inject context into Windsurf environment
     */
    injectContext(contextData: WindsurfContextData): Promise<void>;
    /**
     * Query Windsurf analytics data
     */
    queryAnalytics(startTimestamp: string, endTimestamp: string, options?: {
        groupName?: string;
        emails?: string[];
        ideTypes?: string[];
    }): Promise<WindsurfAnalyticsData>;
    /**
     * Clear the validation cache
     */
    clearValidationCache(): void;
    /**
     * Check if content is an API specification
     */
    private isAPISpecification;
    /**
     * Generate context for a document
     */
    private generateContextForDocument;
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
export default WindsurfAdapter;
//# sourceMappingURL=index.d.ts.map