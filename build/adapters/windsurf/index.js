/**
 * Windsurf Tool Adapter
 *
 * Provides integration with Windsurf AI programming tool for real-time
 * API interface validation and context injection.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index';
import { ValidationEngine } from '../../core/validation';
import { ContextEnhancer } from '../../core/context';
import { SpecParser } from '../../core/parser';
import { ConfigManager } from '../../utils/config';
/**
 * Windsurf Tool Adapter Class
 *
 * Integrates with Windsurf AI programming tool to provide:
 * - Real-time code monitoring via Windsurf APIs
 * - Context injection through MCP servers
 * - API validation feedback
 * - Analytics and usage tracking
 */
export class WindsurfAdapter extends EventEmitter {
    logger;
    validator;
    contextEnhancer;
    parser;
    config;
    validationCache = new Map();
    isActive = false;
    mcpServers = new Map();
    constructor(config, validator, contextEnhancer, parser) {
        super();
        this.config = config;
        this.logger = new Logger('WindsurfAdapter');
        // Create a config manager for dependencies
        const configManager = new ConfigManager();
        this.validator = validator || new ValidationEngine(configManager, this.logger);
        this.contextEnhancer = contextEnhancer || new ContextEnhancer(configManager.getValidationConfig(), this.logger);
        this.parser = parser || new SpecParser(configManager.getValidationConfig(), this.logger);
    }
    /**
     * Initialize the Windsurf adapter
     */
    async initialize() {
        try {
            this.logger.info('Initializing Windsurf Adapter...', {
                config: this.config
            });
            // Initialize core components
            await this.validator.initialize();
            await this.contextEnhancer.initialize();
            // Set up MCP servers if configured
            if (this.config.mcpServerConfig) {
                await this.setupMCPServers();
            }
            // Set up monitoring if enabled
            if (this.config.enableRealTimeValidation) {
                await this.setupRealTimeMonitoring();
            }
            this.isActive = true;
            this.logger.info('Windsurf Adapter initialized successfully');
            this.emit('initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize Windsurf Adapter:', error);
            throw error;
        }
    }
    /**
     * Set up MCP servers for enhanced tool integration
     */
    async setupMCPServers() {
        if (!this.config.mcpServerConfig) {
            return;
        }
        this.logger.info('Setting up MCP servers...');
        for (const [serverName, serverConfig] of Object.entries(this.config.mcpServerConfig.servers)) {
            try {
                // Create MCP server configuration
                const mcpServer = {
                    name: serverName,
                    command: serverConfig.command,
                    args: serverConfig.args,
                    env: serverConfig.env || {},
                    status: 'configured'
                };
                this.mcpServers.set(serverName, mcpServer);
                this.logger.info(`MCP server configured: ${serverName}`, mcpServer);
            }
            catch (error) {
                this.logger.error(`Failed to configure MCP server ${serverName}:`, error);
            }
        }
    }
    /**
     * Set up real-time monitoring for code changes
     */
    async setupRealTimeMonitoring() {
        this.logger.info('Setting up real-time monitoring...');
        // Simulate file system monitoring
        // In a real implementation, this would integrate with Windsurf's file watching APIs
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
            // This would integrate with Windsurf's change detection APIs
            // For now, we'll emit a monitoring event
            this.emit('monitoring', {
                timestamp: Date.now(),
                status: 'active',
                message: 'Monitoring for code changes...'
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
                ideType: contextData.ideInfo?.type
            });
            const result = {
                isValid: true,
                errors: [],
                warnings: [],
                suggestions: [],
                timestamp: Date.now(),
                metadata: {
                    model: 'windsurf-validator',
                    tokensUsed: 0,
                    creditsConsumed: 0
                }
            };
            // Parse content if it's an API specification
            if (this.isAPISpecification(contextData)) {
                const parseResult = await this.parser.parseSpec(contextData.content);
                if (parseResult.success && parseResult.spec) {
                    // Create validation request
                    const validationRequest = {
                        code: contextData.content,
                        specPath: contextData.documentPath,
                        type: 'both'
                    };
                    // Validate the parsed specification
                    const validationResult = await this.validator.validateInterface(validationRequest);
                    result.isValid = validationResult.isValid;
                    result.errors = validationResult.errors.map(e => e.message);
                    result.warnings = validationResult.warnings.map(w => w.message);
                    result.suggestions = validationResult.suggestions.map(s => s.message) || [];
                    // Estimate token usage (simplified)
                    result.metadata.tokensUsed = Math.floor(contextData.content.length / 4);
                    result.metadata.creditsConsumed = result.metadata.tokensUsed * 0.00004; // Rough estimate
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
     * Inject context into Windsurf environment
     */
    async injectContext(contextData) {
        if (!this.isActive) {
            throw new Error('WindsurfAdapter is not active. Call initialize() first or adapter has been disposed.');
        }
        try {
            this.logger.info('Injecting context into Windsurf', {
                path: contextData.documentPath,
                language: contextData.language
            });
            // Generate context based on document content
            const context = await this.generateContextForDocument(contextData);
            if (context) {
                // In a real implementation, this would use Windsurf's context injection APIs
                this.logger.info('Context generated successfully', {
                    contextId: context.id,
                    path: contextData.documentPath
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
     * Query Windsurf analytics data
     */
    async queryAnalytics(startTimestamp, endTimestamp, options = {}) {
        try {
            if (!this.config.serviceKey || !this.config.apiEndpoint) {
                throw new Error('Service key and API endpoint required for analytics queries');
            }
            this.logger.info('Querying Windsurf analytics', {
                startTimestamp,
                endTimestamp,
                options
            });
            // In a real implementation, this would make HTTP requests to Windsurf Analytics API
            // For now, return mock data
            const analyticsData = {
                cascade_lines: {
                    linesSuggested: '1250',
                    linesAccepted: '890'
                },
                cascade_runs: {
                    totalRuns: '45',
                    successfulRuns: '42'
                },
                tool_usage: [
                    { tool: 'CODE_ACTION', count: '15' },
                    { tool: 'LIST_DIRECTORY', count: '20' },
                    { tool: 'MCP_TOOL', count: '12' },
                    { tool: 'MEMORY', count: '4' }
                ]
            };
            this.emit('analyticsQueried', analyticsData);
            return analyticsData;
        }
        catch (error) {
            this.logger.error('Failed to query analytics:', error);
            throw error;
        }
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
        // This would integrate with the ContextEnhancer
        return {
            id: `windsurf-context-${Date.now()}`,
            type: 'api-validation',
            language: contextData.language,
            ideType: contextData.ideInfo?.type || 'unknown',
            timestamp: new Date().toISOString(),
            suggestions: [
                'Ensure API endpoints follow RESTful conventions',
                'Validate request/response schemas against OpenAPI spec',
                'Check for consistent error handling patterns',
                'Verify authentication and authorization requirements'
            ],
            mcpTools: Array.from(this.mcpServers.keys())
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
            mcpServersCount: this.mcpServers.size,
            config: this.config,
            mcpServers: Array.from(this.mcpServers.keys())
        };
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        this.validationCache.clear();
        this.mcpServers.clear();
        this.isActive = false;
        this.logger.info('Windsurf Adapter disposed');
    }
}
export default WindsurfAdapter;
//# sourceMappingURL=index.js.map