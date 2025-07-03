/**
 * Trae Tool Adapter
 *
 * Provides integration with Trae AI programming tool for real-time
 * API interface validation and context injection using MCP protocol.
 */
import { EventEmitter } from 'events';
import { ValidationEngine } from '../../core/validation';
import { ContextEnhancer } from '../../core/context';
import { SpecParser } from '../../core/parser';
export interface TraeAdapterConfig {
    enableRealTimeValidation: boolean;
    contextInjectionMode: 'auto' | 'manual' | 'disabled';
    validationTriggers: string[];
    mcpServerPath?: string;
    serverCommand?: string;
    serverArgs?: string[];
    workspaceRoot?: string;
    capabilities?: TraeCapabilities;
    requestTimeout?: number;
}
export interface TraeCapabilities {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
    sampling?: boolean;
}
export interface TraeValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    contextId?: string;
    timestamp: number;
    metadata?: {
        toolsUsed?: string[];
        resourcesAccessed?: string[];
        promptsExecuted?: string[];
    };
}
export interface TraeContextData {
    documentPath: string;
    content: string;
    language: string;
    projectInfo?: {
        name: string;
        version: string;
        type: string;
    };
    mcpContext?: {
        availableTools?: string[];
        availableResources?: string[];
        availablePrompts?: string[];
    };
}
export interface TraeTool {
    name: string;
    description: string;
    inputSchema: any;
}
export interface TraeResource {
    uri: string;
    name: string;
    mimeType?: string;
    description?: string;
}
export interface TraePrompt {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required: boolean;
    }>;
}
/**
 * Trae Tool Adapter Class
 *
 * Integrates with Trae AI programming tool using MCP protocol to provide:
 * - Real-time code monitoring via MCP tools
 * - Context injection through MCP resources
 * - API validation feedback using MCP prompts
 * - Tool execution and resource management
 */
export declare class TraeAdapter extends EventEmitter {
    private logger;
    private validator;
    private contextEnhancer;
    private parser;
    private config;
    private validationCache;
    private isActive;
    private mcpSession;
    private availableTools;
    private availableResources;
    private availablePrompts;
    constructor(config: TraeAdapterConfig, validator?: ValidationEngine, contextEnhancer?: ContextEnhancer, parser?: SpecParser);
    /**
     * Initialize the Trae adapter
     */
    initialize(): Promise<void>;
    /**
     * Set up MCP connection to Trae server
     */
    private setupMCPConnection;
    /**
     * Discover available MCP capabilities (tools, resources, prompts)
     */
    private discoverMCPCapabilities;
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
    validateDocument(contextData: TraeContextData): Promise<TraeValidationResult>;
    /**
     * Execute an MCP tool
     */
    executeTool(toolName: string, toolArgs: any): Promise<any>;
    /**
     * Inject context into Trae environment
     */
    injectContext(contextData: TraeContextData): Promise<void>;
    /**
     * Get available MCP tools
     */
    getAvailableTools(): TraeTool[];
    /**
     * Get available MCP resources
     */
    getAvailableResources(): TraeResource[];
    /**
     * Get available MCP prompts
     */
    getAvailablePrompts(): TraePrompt[];
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
export default TraeAdapter;
//# sourceMappingURL=index.d.ts.map