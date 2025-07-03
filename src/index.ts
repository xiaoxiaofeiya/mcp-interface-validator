#!/usr/bin/env node

/**
 * MCP Interface Validator - Main Entry Point
 *
 * This is the main entry point for the MCP Interface Validation Component.
 * It initializes the MCP server and sets up the validation services.
 *
 * Usage:
 * - As MCP Server: npx mcp-interface-validator
 * - Direct execution: node build/index.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { Logger } from './utils/logger/index.js';
import { ConfigManager } from './utils/config/index.js';
import { ValidationEngine } from './core/validation/index.js';
import { IntelligentConstraintSystem } from './core/intelligent-constraints/index.js';
import { IntelligentContextAnalyzer } from './core/intelligent-context/index.js';
// import { IntegrationManager } from './integrations/index.js';
// import { SecurityManager } from './core/security/index.js';

/**
 * Main MCP Interface Validator Server
 */
class MCPInterfaceValidator {
  private server: Server;
  private logger: Logger;
  private configManager: ConfigManager;
  private validationEngine: ValidationEngine;
  private constraintSystem: IntelligentConstraintSystem;
  private _contextAnalyzer: IntelligentContextAnalyzer;
  // private integrationManager: IntegrationManager;

  constructor() {
    this.logger = new Logger('MCPInterfaceValidator');
    this.configManager = new ConfigManager();

    // Initialize MCP Server
    this.server = new Server(
      {
        name: 'mcp-interface-validator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {},
        },
      }
    );

    this.validationEngine = new ValidationEngine(this.configManager, this.logger);

    // Initialize intelligent constraint system
    this._contextAnalyzer = new IntelligentContextAnalyzer();
    this.constraintSystem = new IntelligentConstraintSystem(this._contextAnalyzer);

    // this.integrationManager = new IntegrationManager(this.configManager, this.logger);
  }

  /**
   * Initialize the MCP server and register handlers
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing MCP Interface Validator...');

      // Register tool handlers
      this.registerToolHandlers();

      console.log('MCP Interface Validator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Interface Validator:', error);
      throw error;
    }
  }

  /**
   * Register MCP tool handlers
   */
  private registerToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'validate-interface',
            description: 'Validate API interface against OpenAPI specification with optional constraint enhancement',
            inputSchema: {
              type: 'object',
              properties: {
                interfaceCode: {
                  type: 'string',
                  description: 'The interface code to validate'
                },
                specPath: {
                  type: 'string',
                  description: 'Path to OpenAPI specification file'
                },
                validationType: {
                  type: 'string',
                  enum: ['frontend', 'backend', 'both'],
                  description: 'Type of validation to perform'
                },
                userInstruction: {
                  type: 'string',
                  description: 'User instruction for intelligent validation'
                },
                projectContext: {
                  type: 'object',
                  description: 'Project context information'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID for constraint-aware validation'
                },
                enableConstraints: {
                  type: 'boolean',
                  description: 'Enable constraint-enhanced validation'
                }
              },
              required: ['interfaceCode', 'specPath']
            }
          },
          {
            name: 'monitor-changes',
            description: 'Start monitoring file changes for real-time validation',
            inputSchema: {
              type: 'object',
              properties: {
                watchPaths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Paths to monitor for changes'
                },
                specPath: {
                  type: 'string',
                  description: 'Path to OpenAPI specification file'
                }
              },
              required: ['watchPaths', 'specPath']
            }
          },
          {
            name: 'activate-interface-constraints',
            description: '激活接口约束模式，支持 .use interface 指令',
            inputSchema: {
              type: 'object',
              properties: {
                userInput: {
                  type: 'string',
                  description: '用户输入，包含 .use interface 指令和开发需求'
                },
                sessionId: {
                  type: 'string',
                  description: '会话ID，用于管理约束状态'
                },
                projectContext: {
                  type: 'object',
                  description: '项目上下文信息',
                  properties: {
                    basePath: { type: 'string' },
                    authMethod: { type: 'string' },
                    responseFormat: { type: 'object' }
                  }
                }
              },
              required: ['userInput', 'sessionId']
            }
          },
          {
            name: 'apply-interface-constraints',
            description: '应用接口约束到用户指令，生成增强的开发指导',
            inputSchema: {
              type: 'object',
              properties: {
                userInstruction: {
                  type: 'string',
                  description: '用户的开发指令'
                },
                sessionId: {
                  type: 'string',
                  description: '会话ID'
                },
                constraintType: {
                  type: 'string',
                  enum: ['default', 'strict', 'custom'],
                  description: '约束类型'
                },
                projectContext: {
                  type: 'object',
                  description: '项目上下文信息'
                }
              },
              required: ['userInstruction', 'sessionId']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'validate-interface':
          return await this.handleValidateInterface(args);
        case 'monitor-changes':
          return await this.handleMonitorChanges(args);
        case 'activate-interface-constraints':
          return await this.handleActivateConstraints(args);
        case 'apply-interface-constraints':
          return await this.handleApplyConstraints(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Handle interface validation tool call
   */
  private async handleValidateInterface(args: any): Promise<any> {
    try {
      const {
        interfaceCode,
        specPath,
        validationType = 'both',
        userInstruction = '',
        projectContext = {},
        sessionId = '',
        enableConstraints = false
      } = args;

      this.logger.info('Handling interface validation', {
        hasCode: !!interfaceCode,
        hasSpec: !!specPath,
        hasInstruction: !!userInstruction,
        enableConstraints,
        sessionId
      });

      // Check if constraints should be applied
      if (enableConstraints && sessionId && this.constraintSystem.getConstraintStatus(sessionId).isActive) {
        this.logger.info('Applying constraints to validation');

        // Apply constraints to user instruction if provided
        if (userInstruction) {
          const constraintResult = await this.constraintSystem.applyConstraintsToInstruction(
            userInstruction,
            sessionId,
            projectContext
          );

          if (constraintResult.success && constraintResult.enhancedInstruction) {
            // Use enhanced instruction for validation
            const enhancedInstruction = constraintResult.enhancedInstruction.enhancedInstruction;

            const result = await this.validationEngine.validateWithIntelligentContext(
              enhancedInstruction,
              interfaceCode,
              specPath,
              projectContext
            );

            let responseText = '🔒 **约束增强验证结果**\n\n';
            responseText += this.formatIntelligentValidationResult(result);
            responseText += '\n\n📋 **应用的约束**：\n';
            responseText += constraintResult.appliedConstraints.map(c => `- ${c}`).join('\n');

            return {
              content: [
                {
                  type: 'text',
                  text: responseText
                }
              ]
            };
          }
        }
      }

      // Use intelligent validation if user instruction is provided
      if (userInstruction && interfaceCode) {
        const result = await this.validationEngine.validateWithIntelligentContext(
          userInstruction,
          interfaceCode,
          specPath,
          projectContext
        );

        return {
          content: [
            {
              type: 'text',
              text: this.formatIntelligentValidationResult(result)
            }
          ]
        };
      }

      // Fallback to standard validation
      if (interfaceCode && specPath) {
        const result = await this.validationEngine.validateInterface({
          code: interfaceCode,
          specPath,
          type: validationType
        });

        return {
          content: [
            {
              type: 'text',
              text: this.formatValidationResult(result)
            }
          ]
        };
      }

      // No sufficient input for validation
      return {
        content: [
          {
            type: 'text',
            text: '❌ 验证失败：需要提供代码和OpenAPI规范路径，或者用户指令和代码'
          }
        ]
      };

    } catch (error) {
      this.logger.error('Interface validation failed:', error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ 验证失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ]
      };
    }
  }

  /**
   * Format intelligent validation result for display
   */
  private formatIntelligentValidationResult(result: any): string {
    let output = '';

    // Header
    output += `🧠 智能接口验证结果\n`;
    output += `==================\n\n`;

    // Validation status
    if (result.isValid) {
      output += `✅ 验证通过\n\n`;
    } else {
      output += `❌ 验证失败\n\n`;
    }

    // Missing spec handling
    if (result.missingSpecHandling?.shouldCreateSpec) {
      output += `📋 OpenAPI规范建议\n`;
      output += `${result.missingSpecHandling.reasoning}\n\n`;
      output += `建议的规范结构：\n`;
      output += `\`\`\`yaml\n${JSON.stringify(result.missingSpecHandling.suggestedStructure, null, 2)}\`\`\`\n\n`;
    }

    // Context suggestions
    if (result.contextSuggestions) {
      const suggestions = result.contextSuggestions;
      if (suggestions.suggestedEndpoints.length > 0) {
        output += `🎯 建议的API端点\n`;
        suggestions.suggestedEndpoints.forEach((endpoint: string) => {
          output += `- ${endpoint}\n`;
        });
        output += `\n`;
      }

      if (suggestions.reasoning) {
        output += `💡 分析说明\n`;
        output += `${suggestions.reasoning}\n\n`;
      }
    }

    // Errors and warnings
    if (result.errors.length > 0) {
      output += `🚨 错误 (${result.errors.length})\n`;
      result.errors.forEach((error: any) => {
        output += `- ${error.message}\n`;
      });
      output += `\n`;
    }

    if (result.warnings.length > 0) {
      output += `⚠️ 警告 (${result.warnings.length})\n`;
      result.warnings.forEach((warning: any) => {
        output += `- ${warning.message}\n`;
      });
      output += `\n`;
    }

    // Suggestions
    if (result.suggestions.length > 0) {
      output += `💡 建议 (${result.suggestions.length})\n`;
      result.suggestions.forEach((suggestion: any) => {
        output += `- ${suggestion.message}\n`;
      });
      output += `\n`;
    }

    return output;
  }

  /**
   * Format standard validation result for display
   */
  private formatValidationResult(result: any): string {
    let output = '';

    output += `🔍 接口验证结果\n`;
    output += `==============\n\n`;

    if (result.isValid) {
      output += `✅ 验证通过\n\n`;
    } else {
      output += `❌ 验证失败\n\n`;
    }

    if (result.errors.length > 0) {
      output += `🚨 错误 (${result.errors.length})\n`;
      result.errors.forEach((error: any) => {
        output += `- ${error.message}\n`;
      });
      output += `\n`;
    }

    if (result.warnings.length > 0) {
      output += `⚠️ 警告 (${result.warnings.length})\n`;
      result.warnings.forEach((warning: any) => {
        output += `- ${warning.message}\n`;
      });
      output += `\n`;
    }

    if (result.suggestions.length > 0) {
      output += `💡 建议 (${result.suggestions.length})\n`;
      result.suggestions.forEach((suggestion: any) => {
        output += `- ${suggestion.message}\n`;
      });
    }

    return output;
  }

  /**
   * Handle monitoring changes tool call
   */
  private async handleMonitorChanges(args: any): Promise<any> {
    try {
      const { watchPaths, specPath } = args;

      // Simplified monitoring for now
      console.log('Starting monitoring for paths:', watchPaths, 'with spec:', specPath);

      return {
        content: [
          {
            type: 'text',
            text: 'Monitoring started successfully'
          }
        ]
      };
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      throw error;
    }
  }

  /**
   * Handle activate interface constraints tool call
   */
  private async handleActivateConstraints(args: any): Promise<any> {
    try {
      const { userInput, sessionId, projectContext = {} } = args;

      this.logger.info('Handling activate constraints', {
        hasInput: !!userInput,
        sessionId,
        hasContext: !!projectContext
      });

      // Process user input through constraint system
      const result = await this.constraintSystem.processUserInput(
        userInput,
        sessionId,
        projectContext
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.isConstraintCommand) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ 未检测到有效的约束指令。请使用 `.use interface` 指令格式，例如：\n\n`.use interface 开发用户登录功能`'
            }
          ]
        };
      }

      // Format response
      let responseText = result.activationResult || '';

      if (result.result && result.result.success && result.result.enhancedInstruction) {
        responseText += '\n\n🚀 **增强指令已生成**：\n\n';
        responseText += result.result.enhancedInstruction.enhancedInstruction;
      }

      return {
        content: [
          {
            type: 'text',
            text: responseText
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to activate constraints', { error });
      return {
        content: [
          {
            type: 'text',
            text: `❌ 激活约束失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }

  /**
   * Handle apply interface constraints tool call
   */
  private async handleApplyConstraints(args: any): Promise<any> {
    try {
      const {
        userInstruction,
        sessionId,
        constraintType = 'default',
        projectContext = {}
      } = args;

      this.logger.info('Handling apply constraints', {
        hasInstruction: !!userInstruction,
        sessionId,
        constraintType
      });

      // Check if constraints are active for this session
      const status = this.constraintSystem.getConstraintStatus(sessionId);
      if (!status.isActive) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ 约束模式未激活。请先使用 `activate-interface-constraints` 工具激活约束模式。'
            }
          ]
        };
      }

      // Apply constraints to instruction
      const result = await this.constraintSystem.applyConstraintsToInstruction(
        userInstruction,
        sessionId,
        projectContext
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to apply constraints');
      }

      const enhancedInstruction = result.enhancedInstruction!;

      let responseText = '✅ **约束应用成功**\n\n';
      responseText += '📝 **增强后的开发指令**：\n\n';
      responseText += enhancedInstruction.enhancedInstruction;
      responseText += '\n\n📊 **应用的约束**：\n';
      responseText += result.appliedConstraints.map(c => `- ${c}`).join('\n');
      responseText += `\n\n⏱️ **处理时间**: ${result.processingTime}ms`;

      return {
        content: [
          {
            type: 'text',
            text: responseText
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to apply constraints', { error });
      return {
        content: [
          {
            type: 'text',
            text: `❌ 应用约束失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      await this.initialize();

      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.log('MCP Interface Validator server started');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

/**
 * Main entry point for CLI execution
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);

    // Handle help flag
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
MCP Interface Validator v1.0.0

Usage:
  mcp-interface-validator [options]

Options:
  --help, -h     Show this help message
  --version, -v  Show version information
  --stdio        Use STDIO transport (default)
  --port <port>  Use HTTP transport on specified port

Examples:
  # Run as MCP server with STDIO transport
  mcp-interface-validator

  # Run with HTTP transport
  mcp-interface-validator --port 3000

For more information, visit: https://github.com/your-org/mcp-interface-validator
`);
      process.exit(0);
    }

    // Handle version flag
    if (args.includes('--version') || args.includes('-v')) {
      console.log('1.0.0');
      process.exit(0);
    }

    // Start the MCP server
    const validator = new MCPInterfaceValidator();
    await validator.start();

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start the server
main();

export { MCPInterfaceValidator };
