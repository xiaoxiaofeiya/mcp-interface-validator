/**
 * Trae Tool Adapter
 *
 * Provides integration with Trae AI programming tool for real-time
 * API interface validation and context injection using MCP protocol.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index.js';
import { ValidationEngine } from '../../core/validation/index.js';
import { ConfigManager } from '../../utils/config/index.js';
import { ContextEnhancer } from '../../core/context/index.js';
import { SpecParser } from '../../core/parser/index.js';
/**
 * Trae Tool Adapter Class
 *
 * Integrates with Trae AI programming tool using MCP protocol to provide:
 * - Real-time code monitoring via MCP tools
 * - Context injection through MCP resources
 * - API validation feedback using MCP prompts
 * - Tool execution and resource management
 */
export class TraeAdapter extends EventEmitter {
    logger;
    validator;
    contextEnhancer;
    parser;
    config;
    validationCache = new Map();
    isActive = false;
    mcpSession = null;
    availableTools = [];
    availableResources = [];
    availablePrompts = [];
    constructor(config, validator, contextEnhancer, parser) {
        super();
        this.config = {
            requestTimeout: 30000,
            capabilities: {
                tools: true,
                resources: true,
                prompts: true,
                logging: true,
                sampling: false
            },
            ...config
        };
        this.logger = new Logger('TraeAdapter');
        // Create a config manager for dependencies
        const configManager = new ConfigManager();
        this.validator = validator || new ValidationEngine(configManager, this.logger);
        this.contextEnhancer = contextEnhancer || new ContextEnhancer(configManager.getValidationConfig(), this.logger);
        this.parser = parser || new SpecParser(configManager.getValidationConfig(), this.logger);
    }
    /**
     * Initialize the Trae adapter
     */
    async initialize() {
        try {
            this.logger.info('Initializing Trae Adapter...', {
                config: this.config
            });
            // Initialize core components
            await this.validator.initialize();
            await this.contextEnhancer.initialize();
            // Set up MCP connection if server path is provided
            if (this.config.mcpServerPath) {
                await this.setupMCPConnection();
            }
            // Set up monitoring if enabled
            if (this.config.enableRealTimeValidation) {
                await this.setupRealTimeMonitoring();
            }
            this.isActive = true;
            this.logger.info('Trae Adapter initialized successfully');
            this.emit('initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize Trae Adapter:', error);
            throw error;
        }
    }
    /**
     * Set up MCP connection to Trae server
     */
    async setupMCPConnection() {
        try {
            this.logger.info('Setting up MCP connection...', {
                serverPath: this.config.mcpServerPath,
                command: this.config.serverCommand,
                args: this.config.serverArgs
            });
            // In a real implementation, this would establish actual MCP connection
            // For now, we'll simulate the connection and tool discovery
            this.mcpSession = {
                connected: true,
                serverPath: this.config.mcpServerPath,
                capabilities: this.config.capabilities
            };
            // Discover available tools, resources, and prompts
            await this.discoverMCPCapabilities();
            this.logger.info('MCP connection established successfully', {
                toolsCount: this.availableTools.length,
                resourcesCount: this.availableResources.length,
                promptsCount: this.availablePrompts.length
            });
        }
        catch (error) {
            this.logger.error('Failed to setup MCP connection:', error);
            throw error;
        }
    }
    /**
     * Discover available MCP capabilities (tools, resources, prompts)
     */
    async discoverMCPCapabilities() {
        // Simulate tool discovery
        if (this.config.capabilities?.tools) {
            this.availableTools = [
                {
                    name: 'validate_api_spec',
                    description: 'Validate OpenAPI/Swagger specification',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            spec: { type: 'string' },
                            format: { type: 'string', enum: ['yaml', 'json'] }
                        },
                        required: ['spec']
                    }
                },
                {
                    name: 'generate_context',
                    description: 'Generate context for API development',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            language: { type: 'string' },
                            framework: { type: 'string' },
                            apiType: { type: 'string' }
                        },
                        required: ['language']
                    }
                },
                {
                    name: 'analyze_code_patterns',
                    description: 'Analyze code patterns for API consistency',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: { type: 'string' },
                            language: { type: 'string' }
                        },
                        required: ['code', 'language']
                    }
                }
            ];
        }
        // Simulate resource discovery
        if (this.config.capabilities?.resources) {
            this.availableResources = [
                {
                    uri: 'trae://api-templates',
                    name: 'API Templates',
                    mimeType: 'application/json',
                    description: 'Collection of API templates and patterns'
                },
                {
                    uri: 'trae://validation-rules',
                    name: 'Validation Rules',
                    mimeType: 'application/json',
                    description: 'API validation rules and best practices'
                },
                {
                    uri: 'trae://context-templates',
                    name: 'Context Templates',
                    mimeType: 'text/plain',
                    description: 'Templates for generating development context'
                }
            ];
        }
        // Simulate prompt discovery
        if (this.config.capabilities?.prompts) {
            this.availablePrompts = [
                {
                    name: 'api-review',
                    description: 'Generate API review comments',
                    arguments: [
                        { name: 'spec', description: 'API specification', required: true },
                        { name: 'focus', description: 'Review focus area', required: false }
                    ]
                },
                {
                    name: 'error-analysis',
                    description: 'Analyze API errors and suggest fixes',
                    arguments: [
                        { name: 'error', description: 'Error message or code', required: true },
                        { name: 'context', description: 'Additional context', required: false }
                    ]
                }
            ];
        }
    }
    /**
     * Set up real-time monitoring for code changes
     */
    async setupRealTimeMonitoring() {
        this.logger.info('Setting up real-time monitoring...');
        // Simulate file system monitoring
        setInterval(async () => {
            if (this.isActive) {
                await this.checkForChanges();
            }
        }, 5000); // Check every 5 seconds
    }
    /**
     * Check for code changes and trigger validation
     */
    async checkForChanges() {
        try {
            this.emit('monitoring', {
                timestamp: Date.now(),
                status: 'active',
                message: 'Monitoring for code changes...',
                availableTools: this.availableTools.length,
                availableResources: this.availableResources.length
            });
        }
        catch (error) {
            this.logger.error('Error during change monitoring:', error);
        }
    }
    /**
     * Validate a document for API interface consistency
     */
    async validateDocument(contextData) {
        const cacheKey = `${contextData.documentPath}-${this.hashContent(contextData.content)}`;
        // Check cache first
        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey);
        }
        try {
            this.logger.info('Validating document', {
                path: contextData.documentPath,
                language: contextData.language,
                toolsAvailable: this.availableTools.length
            });
            const result = {
                isValid: true,
                errors: [],
                warnings: [],
                suggestions: [],
                timestamp: Date.now(),
                metadata: {
                    toolsUsed: [],
                    resourcesAccessed: [],
                    promptsExecuted: []
                }
            };
            // Use MCP tools for validation if available
            if (this.isAPISpecification(contextData) && this.availableTools.length > 0) {
                const validationTool = this.availableTools.find(tool => tool.name === 'validate_api_spec');
                if (validationTool) {
                    const toolResult = await this.executeTool('validate_api_spec', {
                        spec: contextData.content,
                        format: contextData.language
                    });
                    result.metadata.toolsUsed.push('validate_api_spec');
                    if (toolResult.success) {
                        result.isValid = toolResult.data.isValid;
                        result.errors = toolResult.data.errors || [];
                        result.warnings = toolResult.data.warnings || [];
                        result.suggestions = toolResult.data.suggestions || [];
                    }
                    else {
                        result.isValid = false;
                        result.errors = [toolResult.error || 'Tool execution failed'];
                    }
                }
            }
            else {
                // Fallback to core validation
                const parseResult = await this.parser.parseSpec(contextData.content);
                if (parseResult.success && parseResult.spec) {
                    const validationRequest = {
                        code: contextData.content,
                        specPath: contextData.documentPath,
                        type: 'both'
                    };
                    const validationResult = await this.validator.validateInterface(validationRequest);
                    result.isValid = validationResult.isValid;
                    result.errors = validationResult.errors.map(e => e.message);
                    result.warnings = validationResult.warnings.map(w => w.message);
                    result.suggestions = validationResult.suggestions?.map(s => s.message) || [];
                }
                else {
                    result.isValid = false;
                    result.errors = [parseResult.error || 'Failed to parse API specification'];
                }
            }
            // Cache the result
            this.validationCache.set(cacheKey, result);
            // Emit validation event
            this.emit('validationResult', result);
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
     * Execute an MCP tool
     */
    async executeTool(toolName, toolArgs) {
        try {
            this.logger.info('Executing MCP tool', { toolName, arguments: toolArgs });
            // In a real implementation, this would call the actual MCP tool
            // For now, we'll simulate tool execution
            if (toolName === 'validate_api_spec') {
                // Simulate API spec validation
                const spec = toolArgs.spec;
                const hasOpenAPI = spec.includes('openapi') || spec.includes('swagger');
                const hasPaths = spec.includes('paths');
                return {
                    success: true,
                    data: {
                        isValid: hasOpenAPI && hasPaths,
                        errors: hasOpenAPI && hasPaths ? [] : ['Invalid API specification format'],
                        warnings: [],
                        suggestions: ['Consider adding more detailed descriptions', 'Add example responses']
                    }
                };
            }
            if (toolName === 'generate_context') {
                return {
                    success: true,
                    data: {
                        context: `Generated context for ${toolArgs.language} development`,
                        templates: ['api-controller', 'data-model', 'validation-schema'],
                        recommendations: ['Use TypeScript for better type safety', 'Implement proper error handling']
                    }
                };
            }
            return {
                success: false,
                error: `Tool not found: ${toolName}`
            };
        }
        catch (error) {
            this.logger.error('Tool execution failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Inject context into Trae environment
     */
    async injectContext(contextData) {
        if (!this.isActive) {
            throw new Error('TraeAdapter is not active. Call initialize() first or adapter has been disposed.');
        }
        try {
            this.logger.info('Injecting context into Trae', {
                path: contextData.documentPath,
                language: contextData.language,
                resourcesAvailable: this.availableResources.length
            });
            // Generate context using available resources
            const context = await this.generateContextForDocument(contextData);
            if (context) {
                this.logger.info('Context generated successfully', {
                    contextId: context.id,
                    path: contextData.documentPath,
                    resourcesUsed: context.resourcesUsed
                });
                this.emit('contextInjected', { contextData, context });
            }
        }
        catch (error) {
            this.logger.error('Failed to inject context:', error);
            throw error;
        }
    }
    /**
     * Get available MCP tools
     */
    getAvailableTools() {
        return [...this.availableTools];
    }
    /**
     * Get available MCP resources
     */
    getAvailableResources() {
        return [...this.availableResources];
    }
    /**
     * Get available MCP prompts
     */
    getAvailablePrompts() {
        return [...this.availablePrompts];
    }
    /**
     * Clear the validation cache
     */
    clearValidationCache() {
        this.validationCache.clear();
        this.logger.info('Validation cache cleared');
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
        const resourcesUsed = [];
        // Use context templates resource if available
        const contextTemplateResource = this.availableResources.find(r => r.uri === 'trae://context-templates');
        if (contextTemplateResource) {
            resourcesUsed.push(contextTemplateResource.uri);
        }
        return {
            id: `trae-context-${Date.now()}`,
            type: 'api-validation',
            language: contextData.language,
            timestamp: new Date().toISOString(),
            resourcesUsed,
            suggestions: [
                'Ensure API endpoints follow RESTful conventions',
                'Validate request/response schemas against OpenAPI spec',
                'Check for consistent error handling patterns',
                'Verify authentication and authorization requirements'
            ],
            mcpCapabilities: {
                tools: this.availableTools.map(t => t.name),
                resources: this.availableResources.map(r => r.uri),
                prompts: this.availablePrompts.map(p => p.name)
            }
        };
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
            mcpConnected: !!this.mcpSession?.connected,
            availableToolsCount: this.availableTools.length,
            availableResourcesCount: this.availableResources.length,
            availablePromptsCount: this.availablePrompts.length,
            config: this.config
        };
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        this.validationCache.clear();
        this.availableTools = [];
        this.availableResources = [];
        this.availablePrompts = [];
        this.mcpSession = null;
        this.isActive = false;
        this.logger.info('Trae Adapter disposed');
    }
}
export default TraeAdapter;
//# sourceMappingURL=index.js.map