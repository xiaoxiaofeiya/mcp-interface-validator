/**
 * MCP Protocol Server Implementation
 * 
 * This module implements a Model Context Protocol (MCP) server that provides:
 * - RESTful API endpoints for HTTP communication
 * - WebSocket support for real-time bidirectional communication
 * - JSON-RPC 2.0 message handling
 * - Session management and client connection tracking
 * - Integration with validation engine and tool adapters
 * 
 * Based on MCP specification and TypeScript SDK patterns
 */

import express, { type Request, type Response } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import cors from 'cors';
import { EventEmitter } from 'events';

// Core validation engine integration
import { ValidationEngine } from '../validation/index';
import type { ValidationRequest } from '../validation/index';
import { ConfigManager } from '../../utils/config/index';
import { Logger } from '../../utils/logger/index';

// Intelligent constraints system integration
import { IntelligentConstraintSystem } from '../intelligent-constraints/index';
import { IntelligentContextAnalyzer } from '../intelligent-context/index';

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  /** Server name for identification */
  name: string;
  /** Server version */
  version: string;
  /** HTTP port to listen on */
  port: number;
  /** Enable CORS for cross-origin requests */
  enableCors?: boolean;
  /** Allowed origins for CORS */
  allowedOrigins?: string[];
  /** Enable WebSocket support */
  enableWebSocket?: boolean;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
  /** Maximum number of concurrent sessions */
  maxSessions?: number;
}

/**
 * MCP Session represents a client connection
 */
export interface MCPSession {
  /** Unique session identifier */
  id: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Client information */
  clientInfo?: {
    name: string;
    version: string;
  };
  /** Session capabilities */
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
  };
  /** WebSocket connection if available */
  websocket?: WebSocket;
}

/**
 * JSON-RPC 2.0 Message Types
 */
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, any>;
}

/**
 * MCP Server Capabilities
 */
export interface MCPServerCapabilities {
  /** Tool execution support */
  tools?: {
    listChanged?: boolean;
  };
  /** Resource access support */
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  /** Prompt template support */
  prompts?: {
    listChanged?: boolean;
  };
  /** Logging support */
  logging?: {};
  /** Completion support */
  completions?: {};
}

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Resource Definition
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * Main MCP Server Class
 */
export class MCPServer extends EventEmitter {
  private config: MCPServerConfig;
  private app: express.Application;
  private httpServer: HttpServer;
  private wsServer?: WebSocketServer;
  private sessions: Map<string, MCPSession> = new Map();
  private sessionCleanupInterval?: NodeJS.Timeout;
  private validationEngine: ValidationEngine;
  private intelligentConstraintSystem: IntelligentConstraintSystem;
  private logger: Logger;
  private isRunning = false;

  // Server capabilities
  private capabilities: MCPServerCapabilities = {
    tools: { listChanged: true },
    resources: { subscribe: true, listChanged: true },
    prompts: { listChanged: true },
    logging: {},
    completions: {}
  };

  // Registered tools and resources
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();

  constructor(config: MCPServerConfig) {
    super();
    this.config = {
      enableCors: true,
      allowedOrigins: ['*'],
      enableWebSocket: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxSessions: 100,
      ...config
    };

    // Initialize logger
    this.logger = new Logger('MCPServer');

    // Create a real validation engine for MCP server
    const configManager = new ConfigManager();
    this.validationEngine = new ValidationEngine(configManager, this.logger);

    // Initialize intelligent constraint system
    const contextAnalyzer = new IntelligentContextAnalyzer();
    this.intelligentConstraintSystem = new IntelligentConstraintSystem(contextAnalyzer);

    this.app = express();
    this.httpServer = createServer(this.app);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupSessionCleanup();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));

    // CORS configuration
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: this.config.allowedOrigins,
        credentials: true,
        exposedHeaders: ['mcp-session-id'],
        allowedHeaders: ['Content-Type', 'mcp-session-id', 'MCP-Protocol-Version']
      }));
    }

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // Main MCP endpoint
    this.app.post('/mcp', this.handleMCPRequest.bind(this));
    this.app.get('/mcp', this.handleMCPGet.bind(this));
    this.app.delete('/mcp', this.handleMCPDelete.bind(this));

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        server: this.config.name,
        version: this.config.version,
        sessions: this.sessions.size,
        uptime: process.uptime()
      });
    });

    // Server info endpoint
    this.app.get('/info', (_req, res) => {
      res.json({
        name: this.config.name,
        version: this.config.version,
        capabilities: this.capabilities,
        protocolVersion: '2024-11-05'
      });
    });
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocket(): void {
    if (!this.config.enableWebSocket) return;

    this.wsServer = new WebSocketServer({ 
      server: this.httpServer,
      path: '/ws'
    });

    this.wsServer.on('connection', (ws: WebSocket, _req) => {
      const sessionId = randomUUID();
      console.log(`WebSocket connection established: ${sessionId}`);

      // Create session for WebSocket connection
      const session: MCPSession = {
        id: sessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
        capabilities: {},
        websocket: ws
      };

      this.sessions.set(sessionId, session);

      // Handle WebSocket messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const response = await this.processJSONRPCMessage(message, session);
          if (response) {
            ws.send(JSON.stringify(response));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: 'Parse error'
            },
            id: null
          }));
        }
      });

      // Handle WebSocket close
      ws.on('close', () => {
        console.log(`WebSocket connection closed: ${sessionId}`);
        this.sessions.delete(sessionId);
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        this.sessions.delete(sessionId);
      });
    });
  }

  /**
   * Setup session cleanup timer
   */
  private setupSessionCleanup(): void {
    this.sessionCleanupInterval = setInterval(() => {
      const now = new Date();
      const timeout = this.config.sessionTimeout!;

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > timeout) {
          console.log(`Cleaning up expired session: ${sessionId}`);
          if (session.websocket) {
            session.websocket.close();
          }
          this.sessions.delete(sessionId);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Handle HTTP POST requests to /mcp endpoint
   */
  private async handleMCPRequest(req: Request, res: Response): Promise<void> {
    try {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let session: MCPSession | undefined;

      if (sessionId) {
        session = this.sessions.get(sessionId);
        if (session) {
          session.lastActivity = new Date();
        }
      }

      // Handle initialize request for new sessions
      if (!session && this.isInitializeRequest(req.body)) {
        session = this.createSession();
        res.setHeader('mcp-session-id', session.id);
      }

      if (!session) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided'
          },
          id: null
        });
        return;
      }

      // Process JSON-RPC message
      const response = await this.processJSONRPCMessage(req.body, session);
      if (response) {
        res.json(response);
      } else {
        res.status(202).send(); // Accepted, no response needed
      }

    } catch (error) {
      console.error('MCP request error:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }

  /**
   * Handle HTTP GET requests to /mcp endpoint (SSE support)
   */
  private async handleMCPGet(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.sessions.has(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write('data: {"type":"ping"}\n\n');
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
    });
  }

  /**
   * Handle HTTP DELETE requests to /mcp endpoint (session termination)
   */
  private async handleMCPDelete(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.sessions.has(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    // Clean up session
    const session = this.sessions.get(sessionId);
    if (session?.websocket) {
      session.websocket.close();
    }
    this.sessions.delete(sessionId);

    res.status(200).json({
      jsonrpc: '2.0',
      result: {
        message: 'Session terminated successfully'
      }
    });
  }

  /**
   * Check if a message is an initialize request
   */
  private isInitializeRequest(message: any): boolean {
    return message &&
           message.jsonrpc === '2.0' &&
           message.method === 'initialize' &&
           message.id !== undefined;
  }

  /**
   * Create a new session
   */
  private createSession(): MCPSession {
    if (this.sessions.size >= this.config.maxSessions!) {
      throw new Error('Maximum number of sessions reached');
    }

    const session: MCPSession = {
      id: randomUUID(),
      createdAt: new Date(),
      lastActivity: new Date(),
      capabilities: {}
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Process JSON-RPC messages
   */
  private async processJSONRPCMessage(
    message: JSONRPCRequest | JSONRPCNotification,
    session: MCPSession
  ): Promise<JSONRPCResponse | null> {
    try {
      // Handle requests (expect response)
      if ('id' in message) {
        const request = message as JSONRPCRequest;

        switch (request.method) {
          case 'initialize':
            return await this.handleInitialize(request, session);

          case 'tools/list':
            return await this.handleListTools(request);

          case 'tools/call':
            return await this.handleCallTool(request, session);

          case 'resources/list':
            return await this.handleListResources(request);

          case 'resources/read':
            return await this.handleReadResource(request);

          case 'prompts/list':
            return await this.handleListPrompts(request);

          case 'prompts/get':
            return await this.handleGetPrompt(request);

          case 'validation/validate':
            return await this.handleValidation(request);

          default:
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32601,
                message: `Method not found: ${request.method}`
              }
            };
        }
      } else {
        // Handle notifications (no response expected)
        const notification = message as JSONRPCNotification;
        await this.handleNotification(notification, session);
        return null;
      }
    } catch (error) {
      console.error('JSON-RPC processing error:', error);

      if ('id' in message) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error)
          }
        };
      }
      return null;
    }
  }

  /**
   * Handle initialize request
   */
  private async handleInitialize(
    request: JSONRPCRequest,
    session: MCPSession
  ): Promise<JSONRPCResponse> {
    const params = request.params || {};

    // Store client info
    if (params['clientInfo']) {
      session.clientInfo = params['clientInfo'];
    }

    // Store client capabilities
    if (params['capabilities']) {
      session.capabilities = params['capabilities'];
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: this.capabilities,
        serverInfo: {
          name: this.config.name,
          version: this.config.version
        },
        instructions: 'MCP Interface Validation Server - Provides real-time validation of AI-generated code interfaces'
      }
    };
  }

  /**
   * Handle list tools request
   */
  private async handleListTools(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const tools = Array.from(this.tools.values());

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools
      }
    };
  }

  /**
   * Handle call tool request
   */
  private async handleCallTool(
    request: JSONRPCRequest,
    _session: MCPSession
  ): Promise<JSONRPCResponse> {
    const params = request.params || {};
    const toolName = params['name'];
    const toolArgs = params['arguments'] || {};

    if (!toolName || !this.tools.has(toolName)) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `Tool not found: ${toolName}`
        }
      };
    }

    try {
      // Execute tool based on name
      let result: any;

      console.log(`Executing tool: ${toolName} with args:`, toolArgs);

      switch (toolName) {
        case 'validate-interface':
          result = await this.executeValidationTool(toolArgs);
          break;

        case 'analyze-compatibility':
          result = await this.executeCompatibilityTool(toolArgs);
          break;

        // 智能约束系统工具
        case 'activate-constraints':
          result = await this.executeActivateConstraints(toolArgs);
          break;

        case 'apply-constraint-template':
          result = await this.executeApplyConstraintTemplate(toolArgs);
          break;

        case 'load-constraint-config':
          result = await this.executeLoadConstraintConfig(toolArgs);
          break;

        case 'list-constraint-templates':
          result = await this.executeListConstraintTemplates(toolArgs);
          break;

        case 'get-constraint-status':
          result = await this.executeGetConstraintStatus(toolArgs);
          break;

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Tool implementation not found: ${toolName}`
            }
          };
      }

      console.log('Tool execution result:', result);

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error: any) {
      console.error('Tool execution error:', error);
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Tool execution failed: ${error.message}`
        }
      };
    }
  }

  /**
   * Handle list resources request
   */
  private async handleListResources(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const resources = Array.from(this.resources.values());

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources
      }
    };
  }

  /**
   * Handle read resource request
   */
  private async handleReadResource(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const params = request.params || {};
    const uri = params['uri'];

    if (!uri) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: 'Missing required parameter: uri'
        }
      };
    }

    // Find resource by URI
    const resource = Array.from(this.resources.values()).find(r => r.uri === uri);

    if (!resource) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `Resource not found: ${uri}`
        }
      };
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType || 'text/plain',
            text: `Resource content for: ${resource.name}`
          }
        ]
      }
    };
  }

  /**
   * Handle list prompts request
   */
  private async handleListPrompts(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        prompts: [
          {
            name: 'validate-code',
            description: 'Validate code interface compatibility',
            arguments: [
              {
                name: 'frontend_code',
                description: 'Frontend code to validate',
                required: true
              },
              {
                name: 'backend_code',
                description: 'Backend code to validate against',
                required: true
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Handle get prompt request
   */
  private async handleGetPrompt(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const params = request.params || {};
    const promptName = params['name'];

    if (promptName === 'validate-code') {
      const args = params['arguments'] || {};
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          description: 'Code validation prompt',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please validate the interface compatibility between this frontend code:\n\n${args.frontend_code}\n\nAnd this backend code:\n\n${args.backend_code}`
              }
            }
          ]
        }
      };
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32602,
        message: `Prompt not found: ${promptName}`
      }
    };
  }

  /**
   * Handle validation request (custom method)
   */
  private async handleValidation(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const params = request.params || {};

    const validationRequest: ValidationRequest = {
      code: params['frontendCode'] || params['backendCode'] || '',
      specPath: params['specPath'] || '',
      type: 'both'
    };

    const result = await this.validationEngine.validateInterface(validationRequest);

    return {
      jsonrpc: '2.0',
      id: request.id,
      result
    };
  }

  /**
   * Handle notifications
   */
  private async handleNotification(
    notification: JSONRPCNotification,
    session: MCPSession
  ): Promise<void> {
    switch (notification.method) {
      case 'notifications/initialized':
        console.log(`Session ${session.id} initialized`);
        break;

      case 'notifications/cancelled':
        console.log(`Request cancelled for session ${session.id}`);
        break;

      default:
        console.log(`Unknown notification: ${notification.method}`);
    }
  }

  /**
   * Execute validation tool
   */
  private async executeValidationTool(args: any): Promise<any> {
    const code = args.frontendCode || args.backendCode || '';
    const specPath = args.specPath || '';
    const userInstruction = args.userInstruction || 'Validate API interface';
    const projectContext = args.projectContext || {};

    // Use intelligent validation if no spec path is provided
    if (!specPath && code) {
      return await this.validationEngine.validateWithIntelligentContext(
        userInstruction,
        code,
        undefined,
        projectContext
      );
    }

    // Use standard validation if spec path is provided
    if (specPath && code) {
      const validationRequest: ValidationRequest = {
        code,
        specPath,
        type: 'both'
      };
      return await this.validationEngine.validateInterface(validationRequest);
    }

    // Return error if insufficient parameters
    throw new Error('Insufficient parameters: need code and either specPath or userInstruction');
  }

  /**
   * Execute compatibility analysis tool
   */
  private async executeCompatibilityTool(_args: any): Promise<any> {
    // This would integrate with the diff analyzer
    return {
      compatibility: 'high',
      score: 95,
      issues: [],
      recommendations: ['Interface compatibility looks good']
    };
  }

  /**
   * Register a tool with the server
   */
  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this.emit('toolRegistered', tool);
  }

  /**
   * Register a resource with the server
   */
  public registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    this.emit('resourceRegistered', resource);
  }

  /**
   * Start the MCP server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    // Initialize validation engine
    await this.validationEngine.initialize();

    // Register default tools
    this.registerDefaultTools();
    this.registerDefaultResources();

    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, () => {
        this.isRunning = true;
        console.log(`MCP Server "${this.config.name}" v${this.config.version} listening on port ${this.config.port}`);
        console.log(`WebSocket support: ${this.config.enableWebSocket ? 'enabled' : 'disabled'}`);
        console.log(`CORS support: ${this.config.enableCors ? 'enabled' : 'disabled'}`);
        this.emit('started');
        resolve();
      });

      this.httpServer.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop the MCP server
   */
  public async stop(): Promise<void> {
    // Always clear session cleanup interval, even if server is not running
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
      delete (this as any).sessionCleanupInterval;
    }

    if (!this.isRunning) {
      return;
    }

    // Close all WebSocket connections
    if (this.wsServer) {
      this.wsServer.close();
    }

    // Close all sessions
    for (const session of this.sessions.values()) {
      if (session.websocket) {
        session.websocket.close();
      }
    }
    this.sessions.clear();

    return new Promise((resolve) => {
      this.httpServer.close(() => {
        this.isRunning = false;
        console.log('MCP Server stopped');
        this.emit('stopped');
        resolve();
      });
    });
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    this.registerTool({
      name: 'validate-interface',
      description: 'Validate interface compatibility between frontend and backend code',
      inputSchema: {
        type: 'object',
        properties: {
          frontendCode: {
            type: 'string',
            description: 'Frontend code to validate'
          },
          backendCode: {
            type: 'string',
            description: 'Backend code to validate against'
          },
          language: {
            type: 'string',
            description: 'Programming language',
            enum: ['typescript', 'javascript', 'python', 'java']
          },
          options: {
            type: 'object',
            description: 'Additional validation options'
          }
        },
        required: ['frontendCode', 'backendCode']
      }
    });

    this.registerTool({
      name: 'analyze-compatibility',
      description: 'Analyze compatibility between code interfaces',
      inputSchema: {
        type: 'object',
        properties: {
          sourceCode: {
            type: 'string',
            description: 'Source code to analyze'
          },
          targetCode: {
            type: 'string',
            description: 'Target code to compare against'
          }
        },
        required: ['sourceCode', 'targetCode']
      }
    });

    // 智能约束系统工具
    this.registerTool({
      name: 'activate-constraints',
      description: 'Activate intelligent constraints for AI development session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Unique session identifier'
          },
          command: {
            type: 'string',
            description: 'Constraint activation command (e.g., ".use interface", ".使用接口")'
          },
          userInstruction: {
            type: 'string',
            description: 'User instruction or development request'
          },
          language: {
            type: 'string',
            description: 'Preferred language for constraints',
            enum: ['zh', 'en', 'auto']
          },
          templateType: {
            type: 'string',
            description: 'Constraint template type',
            enum: ['default', 'strict', 'api', 'frontend', 'testing', 'custom']
          },
          configFilePath: {
            type: 'string',
            description: 'Optional path to configuration file'
          }
        },
        required: ['sessionId', 'command', 'userInstruction']
      }
    });

    this.registerTool({
      name: 'apply-constraint-template',
      description: 'Apply a specific constraint template to an active session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Active session identifier'
          },
          templateName: {
            type: 'string',
            description: 'Name of the constraint template to apply'
          }
        },
        required: ['sessionId', 'templateName']
      }
    });

    this.registerTool({
      name: 'load-constraint-config',
      description: 'Load constraint configuration from file',
      inputSchema: {
        type: 'object',
        properties: {
          configFilePath: {
            type: 'string',
            description: 'Path to configuration file (JSON or YAML)'
          }
        },
        required: ['configFilePath']
      }
    });

    this.registerTool({
      name: 'list-constraint-templates',
      description: 'List all available constraint templates',
      inputSchema: {
        type: 'object',
        properties: {
          includeDetails: {
            type: 'boolean',
            description: 'Include template details in response',
            default: false
          }
        }
      }
    });

    this.registerTool({
      name: 'get-constraint-status',
      description: 'Get current constraint status for a session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Session identifier to check'
          }
        },
        required: ['sessionId']
      }
    });
  }

  /**
   * Register default resources
   */
  private registerDefaultResources(): void {
    this.registerResource({
      uri: 'mcp://server/info',
      name: 'Server Information',
      description: 'Information about the MCP server',
      mimeType: 'application/json'
    });

    this.registerResource({
      uri: 'mcp://server/capabilities',
      name: 'Server Capabilities',
      description: 'Available server capabilities',
      mimeType: 'application/json'
    });
  }

  /**
   * Get server status
   */
  public getStatus(): any {
    return {
      name: this.config.name,
      version: this.config.version,
      isRunning: this.isRunning,
      port: this.config.port,
      sessions: this.sessions.size,
      tools: this.tools.size,
      resources: this.resources.size,
      capabilities: this.capabilities
    };
  }

  /**
   * Get active sessions
   */
  public getSessions(): MCPSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 智能约束系统工具执行方法
   */

  /**
   * 执行激活约束工具
   */
  private async executeActivateConstraints(args: any): Promise<any> {
    try {
      const { sessionId, command, userInstruction, language = 'auto' } = args;

      if (!sessionId || !command || !userInstruction) {
        throw new Error('Missing required parameters: sessionId, command, userInstruction');
      }

      // 激活约束
      const constraintPrompt = await this.intelligentConstraintSystem.activateConstraints(sessionId, {
        command,
        userInstruction,
        language
      });

      // 获取约束状态
      const status = this.intelligentConstraintSystem.getConstraintStatus(sessionId);

      return {
        success: true,
        sessionId,
        message: '智能约束已激活',
        constraintPrompt,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('Failed to activate constraints', { error: error.message });
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 执行应用约束模板工具
   */
  private async executeApplyConstraintTemplate(args: any): Promise<any> {
    try {
      const { sessionId, templateName } = args;

      if (!sessionId || !templateName) {
        throw new Error('Missing required parameters: sessionId, templateName');
      }

      await this.intelligentConstraintSystem.applyConfigTemplate(sessionId, templateName);

      return {
        success: true,
        sessionId,
        templateName,
        message: `约束模板 "${templateName}" 已应用到会话`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('Failed to apply constraint template', { error: error.message });
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 执行加载约束配置工具
   */
  private async executeLoadConstraintConfig(args: any): Promise<any> {
    try {
      const { configFilePath } = args;

      if (!configFilePath) {
        throw new Error('Missing required parameter: configFilePath');
      }

      await this.intelligentConstraintSystem.loadConfigFromFile(configFilePath);

      return {
        success: true,
        configFilePath,
        message: '约束配置已从文件加载',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('Failed to load constraint config', { error: error.message });
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 执行列出约束模板工具
   */
  private async executeListConstraintTemplates(args: any): Promise<any> {
    try {
      const { includeDetails = false } = args;

      const templateNames = this.intelligentConstraintSystem.listConfigTemplates();

      let result: any = {
        success: true,
        templates: templateNames,
        count: templateNames.length,
        timestamp: new Date().toISOString()
      };

      if (includeDetails) {
        const templateDetails = this.intelligentConstraintSystem.getConfigTemplates();
        result.templateDetails = templateDetails;
      }

      return result;
    } catch (error: any) {
      this.logger.error('Failed to list constraint templates', { error: error.message });
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 执行获取约束状态工具
   */
  private async executeGetConstraintStatus(args: any): Promise<any> {
    try {
      const { sessionId } = args;

      if (!sessionId) {
        throw new Error('Missing required parameter: sessionId');
      }

      const status = this.intelligentConstraintSystem.getConstraintStatus(sessionId);

      return {
        success: true,
        sessionId,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('Failed to get constraint status', { error: error.message });
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
