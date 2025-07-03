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
export class WindsurfAdapter extends EventEmitter {
  private logger: Logger;
  private validator: ValidationEngine;
  private contextEnhancer: ContextEnhancer;
  private parser: SpecParser;
  private config: WindsurfAdapterConfig;
  private validationCache: Map<string, WindsurfValidationResult> = new Map();
  private isActive: boolean = false;
  private mcpServers: Map<string, any> = new Map();

  constructor(
    config: WindsurfAdapterConfig,
    validator?: ValidationEngine,
    contextEnhancer?: ContextEnhancer,
    parser?: SpecParser
  ) {
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
  async initialize(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to initialize Windsurf Adapter:', error);
      throw error;
    }
  }

  /**
   * Set up MCP servers for enhanced tool integration
   */
  private async setupMCPServers(): Promise<void> {
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
      } catch (error) {
        this.logger.error(`Failed to configure MCP server ${serverName}:`, error);
      }
    }
  }

  /**
   * Set up real-time monitoring for code changes
   */
  private async setupRealTimeMonitoring(): Promise<void> {
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
  private async checkForChanges(): Promise<void> {
    try {
      // This would integrate with Windsurf's change detection APIs
      // For now, we'll emit a monitoring event
      this.emit('monitoring', {
        timestamp: Date.now(),
        status: 'active',
        message: 'Monitoring for code changes...'
      });
    } catch (error) {
      this.logger.error('Error during change monitoring:', error);
    }
  }

  /**
   * Validate a document for API interface consistency
   */
  async validateDocument(contextData: WindsurfContextData): Promise<WindsurfValidationResult> {
    const cacheKey = `${contextData.documentPath}-${this.hashContent(contextData.content)}`;
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    try {
      this.logger.info('Validating document', {
        path: contextData.documentPath,
        language: contextData.language,
        ideType: contextData.ideInfo?.type
      });

      const result: WindsurfValidationResult = {
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
            type: 'both' as const
          };
          
          // Validate the parsed specification
          const validationResult = await this.validator.validateInterface(validationRequest);
          
          result.isValid = validationResult.isValid;
          result.errors = validationResult.errors.map(e => e.message);
          result.warnings = validationResult.warnings.map(w => w.message);
          result.suggestions = validationResult.suggestions.map(s => s.message) || [];

          // Estimate token usage (simplified)
          result.metadata!.tokensUsed = Math.floor(contextData.content.length / 4);
          result.metadata!.creditsConsumed = result.metadata!.tokensUsed * 0.00004; // Rough estimate
        } else {
          result.isValid = false;
          result.errors = [parseResult.error || 'Failed to parse API specification'];
        }
      }

      // Cache the result
      this.validationCache.set(cacheKey, result);

      // Emit validation event
      this.emit('validationResult', result);

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
   * Inject context into Windsurf environment
   */
  async injectContext(contextData: WindsurfContextData): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to inject context:', error);
      throw error;
    }
  }

  /**
   * Query Windsurf analytics data
   */
  async queryAnalytics(
    startTimestamp: string,
    endTimestamp: string,
    options: {
      groupName?: string;
      emails?: string[];
      ideTypes?: string[];
    } = {}
  ): Promise<WindsurfAnalyticsData> {
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
      const analyticsData: WindsurfAnalyticsData = {
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
    } catch (error) {
      this.logger.error('Failed to query analytics:', error);
      throw error;
    }
  }

  /**
   * Clear the validation cache
   */
  clearValidationCache(): void {
    this.validationCache.clear();
    this.logger.info('Validation cache cleared');
  }

  /**
   * Check if content is an API specification
   */
  private isAPISpecification(contextData: WindsurfContextData): boolean {
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
  private async generateContextForDocument(contextData: WindsurfContextData): Promise<any> {
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
      mcpServersCount: this.mcpServers.size,
      config: this.config,
      mcpServers: Array.from(this.mcpServers.keys())
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.validationCache.clear();
    this.mcpServers.clear();
    this.isActive = false;
    this.logger.info('Windsurf Adapter disposed');
  }
}

export default WindsurfAdapter;
